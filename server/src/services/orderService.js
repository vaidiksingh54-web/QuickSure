import { supabaseAdmin } from '../config/supabase.js'
import { env } from '../config/env.js'
import { inventoryService } from './inventoryService.js'
import { pricingService } from './pricingService.js'
import { paymentService } from './paymentService.js'
import { NotFoundError, ConflictError, ForbiddenError, ValidationError, AppError } from '../utils/errors.js'

// Valid sub-order state transitions
const VALID_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: []
}

// Transitions that require admin-only privileges
const ADMIN_ONLY_TRANSITIONS = new Set(['delivered', 'cancelled'])

// In-memory mock stores for test/dev environment
let mockOrders = {}
let mockSubOrders = {}
let mockOrderItems = {}
let mockStatusHistory = {}
let mockOrderCounter = 1000

function generateOrderNumber () {
  mockOrderCounter++
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substr(2, 4).toUpperCase()
  return `QS-${ts}-${rand}`
}

function generateSubOrderNumber (orderNumber, sellerIndex) {
  return `${orderNumber}-S${sellerIndex + 1}`
}

// Mock seller data for test environment (maps variant_id prefix to seller info)
const MOCK_SELLERS = {
  default: {
    id: 'seller-0001-0000-0000-000000000001',
    user_id: '22222222-2222-2222-2222-222222222222',
    store_name: 'QuickSure Electronics Hub',
    commission_rate: 10.00
  },
  fashion: {
    id: 'seller-0002-0000-0000-000000000002',
    user_id: 'seller-user-0002',
    store_name: 'TrendSetter Fashion',
    commission_rate: 12.00
  }
}

function getSellerForVariant (variantId) {
  // Fashion variants (OXF-*) go to fashion seller, everything else to default
  if (variantId.includes('000000000004') || variantId.includes('000000000005')) {
    return MOCK_SELLERS.fashion
  }
  return MOCK_SELLERS.default
}

export const orderService = {
  /**
   * Find existing order by idempotency key
   */
  findExistingOrderByIdempotency: async (userId, idempotencyKey) => {
    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const existing = Object.values(mockOrders).find(
        (o) => o.idempotency_key === idempotencyKey && o.user_id === userId
      )
      if (existing) {
        return orderService._buildOrderResponse(existing.id)
      }
      return null
    }
    const { data: existing } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('user_id', userId)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()

    if (existing) {
      return orderService.getOrderById(existing.id, userId)
    }
    return null
  },

  /**
   * PLACE ORDER — Full checkout pipeline (atomic orchestration)
   *
   * 1. Validate cart is not empty
   * 2. Fetch live prices from inventory (Rule 1 enforcement)
   * 3. Calculate authoritative quote from pricingService
   * 4. Reserve stock atomically (Rule 4 enforcement)
   * 5. Create parent order
   * 6. Split items by seller → create sub-orders
   * 7. Snapshot order_items with frozen prices
   * 8. Run payment simulation
   * 9. If payment fails → rollback stock, cancel order
   * 10. If payment succeeds → clear cart, return complete order
   */
  placeOrder: async (userId, { payment_method, shipping_address, coupon_code, idempotency_key }, cartItems) => {
    // --- Idempotency Check ---
    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const existingOrder = Object.values(mockOrders).find(
        (o) => o.idempotency_key === idempotency_key && o.user_id === userId
      )
      if (existingOrder) {
        return orderService._buildOrderResponse(existingOrder.id)
      }
    }

    // --- 1. Validate cart not empty ---
    if (!cartItems || cartItems.length === 0) {
      throw new ValidationError('Cannot checkout with an empty cart')
    }

    // --- 2. Fetch live variant details & build pricing items ---
    const enrichedItems = []
    for (const item of cartItems) {
      const variant = await inventoryService.getVariantDetails(item.variant_id)
      enrichedItems.push({
        variant_id: item.variant_id,
        quantity: item.quantity,
        unit_price: Number(variant.price),
        variant_name: variant.variant_name,
        sku: variant.sku,
        seller: getSellerForVariant(item.variant_id)
      })
    }

    // --- 3. Authoritative quote (Rule 1) ---
    const quoteItems = enrichedItems.map((e) => ({
      variant_id: e.variant_id,
      unit_price: e.unit_price,
      quantity: e.quantity
    }))
    const quote = await pricingService.calculateOrderQuote({
      items: quoteItems,
      couponCode: coupon_code,
      userId
    })

    // --- 4. Reserve stock atomically (Rule 4) ---
    const reservationItems = enrichedItems.map((e) => ({
      variant_id: e.variant_id,
      quantity: e.quantity
    }))

    let stockReserved = false
    try {
      await inventoryService.reserveStockAtomically(reservationItems)
      stockReserved = true
    } catch (err) {
      throw new ConflictError(
        `Stock reservation failed: ${err.message}. Please review your cart and try again.`
      )
    }

    // --- 5. Create parent order ---
    const orderNumber = generateOrderNumber()
    const orderId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`

    const parentOrder = {
      id: orderId,
      order_number: orderNumber,
      user_id: userId,
      status: 'placed',
      subtotal: quote.subtotal,
      discount_amount: quote.discount_amount,
      shipping_fee: quote.shipping_fee,
      tax_amount: quote.tax_amount,
      total_amount: quote.total_amount,
      shipping_address,
      payment_method,
      payment_status: 'pending',
      idempotency_key,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // --- 6. Split items by seller → create sub-orders ---
    const sellerGroups = {}
    for (const item of enrichedItems) {
      const sellerId = item.seller.id
      if (!sellerGroups[sellerId]) {
        sellerGroups[sellerId] = {
          seller: item.seller,
          items: [],
          subtotal: 0
        }
      }
      sellerGroups[sellerId].items.push(item)
      sellerGroups[sellerId].subtotal += item.unit_price * item.quantity
    }

    const subOrders = []
    const allOrderItems = []
    let sellerIndex = 0

    for (const [sellerId, group] of Object.entries(sellerGroups)) {
      const subOrderNumber = generateSubOrderNumber(orderNumber, sellerIndex)
      const subOrderId = `sub-${Date.now()}-${sellerIndex}-${Math.random().toString(36).substr(2, 4)}`

      const commissionFee = Math.round(group.subtotal * (group.seller.commission_rate / 100) * 100) / 100
      const sellerPayout = Math.round((group.subtotal - commissionFee) * 100) / 100

      const subOrder = {
        id: subOrderId,
        sub_order_number: subOrderNumber,
        order_id: orderId,
        seller_id: sellerId,
        seller_name: group.seller.store_name,
        status: 'pending',
        subtotal: Math.round(group.subtotal * 100) / 100,
        seller_payout_amount: sellerPayout,
        commission_fee: commissionFee,
        courier_name: null,
        tracking_number: null,
        shipped_at: null,
        delivered_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      subOrders.push(subOrder)

      // --- 7. Create order item snapshots ---
      for (const item of group.items) {
        const orderItem = {
          id: `oi-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          order_id: orderId,
          sub_order_id: subOrderId,
          variant_id: item.variant_id,
          product_title: item.variant_name,
          variant_name: item.variant_name,
          sku: item.sku,
          unit_price: item.unit_price,
          quantity: item.quantity,
          total_price: Math.round(item.unit_price * item.quantity * 100) / 100,
          created_at: new Date().toISOString()
        }
        allOrderItems.push(orderItem)
      }

      // Initial status history entry
      const historyEntry = {
        id: `sh-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        sub_order_id: subOrderId,
        from_status: null,
        to_status: 'pending',
        changed_by_user_id: userId,
        notes: 'Order placed by customer',
        created_at: new Date().toISOString()
      }

      if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
        if (!mockStatusHistory[subOrderId]) mockStatusHistory[subOrderId] = []
        mockStatusHistory[subOrderId].push(historyEntry)
      }

      sellerIndex++
    }

    // --- 8. Payment simulation ---
    let payment
    try {
      payment = await paymentService.simulatePayment(orderId, quote.total_amount, payment_method)
    } catch (err) {
      // Rollback stock on payment processing error
      if (stockReserved) {
        await inventoryService.rollbackStock(reservationItems)
      }
      throw new AppError('Payment processing error. Stock has been released.', 500)
    }

    // --- 9. Handle payment result ---
    if (payment.status === 'failed') {
      // Rollback stock reservations
      if (stockReserved) {
        await inventoryService.rollbackStock(reservationItems)
      }
      parentOrder.status = 'cancelled'
      parentOrder.payment_status = 'failed'

      if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
        mockOrders[orderId] = parentOrder
      }

      throw new AppError(
        'Payment simulation failed. Your cart items have been preserved and stock has been released.',
        402,
        'PAYMENT_FAILED'
      )
    }

    // --- 10. Payment successful → persist everything ---
    parentOrder.payment_status = 'paid'

    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      mockOrders[orderId] = parentOrder
      for (const so of subOrders) {
        mockSubOrders[so.id] = so
      }
      for (const oi of allOrderItems) {
        if (!mockOrderItems[oi.sub_order_id]) mockOrderItems[oi.sub_order_id] = []
        mockOrderItems[oi.sub_order_id].push(oi)
      }
    } else {
      // Production: Supabase inserts
      const { error: orderErr } = await supabaseAdmin.from('orders').insert(parentOrder)
      if (orderErr) throw new AppError(`Order creation failed: ${orderErr.message}`, 500)

      for (const so of subOrders) {
        const { seller_name, ...dbSubOrder } = so
        const { error: soErr } = await supabaseAdmin.from('sub_orders').insert(dbSubOrder)
        if (soErr) throw new AppError(`Sub-order creation failed: ${soErr.message}`, 500)
      }

      const { error: oiErr } = await supabaseAdmin.from('order_items').insert(allOrderItems)
      if (oiErr) throw new AppError(`Order items creation failed: ${oiErr.message}`, 500)
    }

    return {
      order: parentOrder,
      sub_orders: subOrders.map((so) => ({
        ...so,
        items: allOrderItems.filter((oi) => oi.sub_order_id === so.id)
      })),
      payment: {
        transaction_ref: payment.transaction_ref,
        status: payment.status,
        amount: payment.amount,
        method: payment.payment_method
      },
      quote: {
        subtotal: quote.subtotal,
        discount_amount: quote.discount_amount,
        tax_amount: quote.tax_amount,
        shipping_fee: quote.shipping_fee,
        total_amount: quote.total_amount,
        coupon_applied: quote.coupon_applied || null
      }
    }
  },

  /**
   * GET ORDER BY ID — with sub-orders, items, payment, and status history
   */
  getOrderById: async (orderId, userId, role) => {
    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const order = Object.values(mockOrders).find(
        (o) => (o.id === orderId || o.order_number === orderId)
      )
      if (!order) throw new NotFoundError(`Order '${orderId}' not found`)

      // Ownership check: customers can only see their own orders
      if (role === 'customer' && order.user_id !== userId) {
        throw new ForbiddenError('You can only view your own orders')
      }

      const subOrders = Object.values(mockSubOrders).filter((so) => so.order_id === order.id)
      const payment = await paymentService.getPaymentByOrderId(order.id)

      return {
        ...order,
        sub_orders: subOrders.map((so) => ({
          ...so,
          items: (mockOrderItems[so.id] || []),
          status_history: (mockStatusHistory[so.id] || [])
        })),
        payment
      }
    }

    // Production Supabase query
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        sub_orders (
          *,
          order_items (*),
          order_status_history (*)
        ),
        payments (*)
      `)
      .or(`id.eq.${orderId},order_number.eq.${orderId}`)
      .single()

    if (error || !order) throw new NotFoundError(`Order '${orderId}' not found`)
    if (role === 'customer' && order.user_id !== userId) {
      throw new ForbiddenError('You can only view your own orders')
    }

    return order
  },

  /**
   * GET ORDERS FOR USER — paginated order history
   */
  getOrdersForUser: async (userId, page = 1, limit = 10) => {
    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const userOrders = Object.values(mockOrders)
        .filter((o) => o.user_id === userId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      const total = userOrders.length
      const start = (page - 1) * limit
      const paged = userOrders.slice(start, start + limit)

      return {
        orders: paged.map((o) => ({
          ...o,
          sub_orders_count: Object.values(mockSubOrders).filter((so) => so.order_id === o.id).length,
          items_count: Object.values(mockOrderItems)
            .flat()
            .filter((oi) => oi.order_id === o.id).length
        })),
        total,
        page,
        limit
      }
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabaseAdmin
      .from('orders')
      .select('*, sub_orders(id)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw new AppError(`Failed to fetch orders: ${error.message}`, 500)

    return { orders: data || [], total: count || 0, page, limit }
  },

  /**
   * GET SUB-ORDERS FOR SELLER — fulfillment dashboard
   */
  getSubOrdersForSeller: async (sellerUserId, page = 1, limit = 10) => {
    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      // Find seller by user_id
      const seller = Object.values(MOCK_SELLERS).find((s) => s.user_id === sellerUserId)
      if (!seller) {
        return { sub_orders: [], total: 0, page, limit }
      }

      const sellerSubOrders = Object.values(mockSubOrders)
        .filter((so) => so.seller_id === seller.id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      const total = sellerSubOrders.length
      const start = (page - 1) * limit
      const paged = sellerSubOrders.slice(start, start + limit)

      return {
        sub_orders: paged.map((so) => ({
          ...so,
          items: mockOrderItems[so.id] || [],
          status_history: mockStatusHistory[so.id] || []
        })),
        total,
        page,
        limit
      }
    }

    // Production: join sellers table to find seller_id from user_id
    const { data: seller } = await supabaseAdmin
      .from('sellers')
      .select('id')
      .eq('user_id', sellerUserId)
      .single()

    if (!seller) return { sub_orders: [], total: 0, page, limit }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabaseAdmin
      .from('sub_orders')
      .select('*, order_items(*), order_status_history(*)', { count: 'exact' })
      .eq('seller_id', seller.id)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw new AppError(`Failed to fetch sub-orders: ${error.message}`, 500)

    return { sub_orders: data || [], total: count || 0, page, limit }
  },

  /**
   * UPDATE SUB-ORDER STATUS — State machine with validation
   */
  updateSubOrderStatus: async (subOrderId, newStatus, userId, role, { courier_name, tracking_number, notes } = {}) => {
    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const subOrder = mockSubOrders[subOrderId]
      if (!subOrder) throw new NotFoundError(`Sub-order '${subOrderId}' not found`)

      const currentStatus = subOrder.status

      // Validate transition
      const allowedNext = VALID_TRANSITIONS[currentStatus]
      if (!allowedNext || !allowedNext.includes(newStatus)) {
        throw new ValidationError(
          `Invalid status transition: '${currentStatus}' → '${newStatus}'. Allowed: [${(allowedNext || []).join(', ')}]`
        )
      }

      // Admin-only gate
      if (ADMIN_ONLY_TRANSITIONS.has(newStatus) && role !== 'admin') {
        throw new ForbiddenError(`Only administrators can transition sub-orders to '${newStatus}'`)
      }

      // Shipped requires courier info
      if (newStatus === 'shipped' && (!courier_name || !tracking_number)) {
        throw new ValidationError('Courier name and tracking number are required when marking as shipped')
      }

      // Apply transition
      subOrder.status = newStatus
      subOrder.updated_at = new Date().toISOString()
      if (newStatus === 'shipped') {
        subOrder.courier_name = courier_name
        subOrder.tracking_number = tracking_number
        subOrder.shipped_at = new Date().toISOString()
      }
      if (newStatus === 'delivered') {
        subOrder.delivered_at = new Date().toISOString()
      }

      // Record history
      const historyEntry = {
        id: `sh-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        sub_order_id: subOrderId,
        from_status: currentStatus,
        to_status: newStatus,
        changed_by_user_id: userId,
        notes: notes || null,
        created_at: new Date().toISOString()
      }
      if (!mockStatusHistory[subOrderId]) mockStatusHistory[subOrderId] = []
      mockStatusHistory[subOrderId].push(historyEntry)

      // Update parent order status if all sub-orders delivered
      const parentOrderId = subOrder.order_id
      const allSubs = Object.values(mockSubOrders).filter((so) => so.order_id === parentOrderId)
      const allDelivered = allSubs.every((so) => so.status === 'delivered')
      const anyShipped = allSubs.some((so) => so.status === 'shipped')
      if (allDelivered && mockOrders[parentOrderId]) {
        mockOrders[parentOrderId].status = 'completed'
      } else if (anyShipped && mockOrders[parentOrderId]) {
        mockOrders[parentOrderId].status = 'partially_shipped'
      }

      return {
        sub_order: subOrder,
        transition: { from: currentStatus, to: newStatus },
        history_entry: historyEntry
      }
    }

    // Production implementation
    const { data: subOrder, error } = await supabaseAdmin
      .from('sub_orders')
      .select('*')
      .eq('id', subOrderId)
      .single()

    if (error || !subOrder) throw new NotFoundError(`Sub-order '${subOrderId}' not found`)

    const currentStatus = subOrder.status
    const allowedNext = VALID_TRANSITIONS[currentStatus]
    if (!allowedNext || !allowedNext.includes(newStatus)) {
      throw new ValidationError(
        `Invalid status transition: '${currentStatus}' → '${newStatus}'. Allowed: [${(allowedNext || []).join(', ')}]`
      )
    }

    if (ADMIN_ONLY_TRANSITIONS.has(newStatus) && role !== 'admin') {
      throw new ForbiddenError(`Only administrators can transition sub-orders to '${newStatus}'`)
    }

    if (newStatus === 'shipped' && (!courier_name || !tracking_number)) {
      throw new ValidationError('Courier name and tracking number are required when marking as shipped')
    }

    const updatePayload = { status: newStatus, updated_at: new Date().toISOString() }
    if (newStatus === 'shipped') {
      updatePayload.courier_name = courier_name
      updatePayload.tracking_number = tracking_number
      updatePayload.shipped_at = new Date().toISOString()
    }
    if (newStatus === 'delivered') {
      updatePayload.delivered_at = new Date().toISOString()
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('sub_orders')
      .update(updatePayload)
      .eq('id', subOrderId)
      .select()
      .single()

    if (updateErr) throw new AppError(`Status update failed: ${updateErr.message}`, 500)

    // Record history
    await supabaseAdmin.from('order_status_history').insert({
      sub_order_id: subOrderId,
      from_status: currentStatus,
      to_status: newStatus,
      changed_by_user_id: userId,
      notes: notes || null
    })

    return { sub_order: updated, transition: { from: currentStatus, to: newStatus } }
  },

  /**
   * GET ALL ORDERS — Admin only, paginated
   */
  getAllOrders: async (page = 1, limit = 10) => {
    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const all = Object.values(mockOrders)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      const total = all.length
      const start = (page - 1) * limit
      const paged = all.slice(start, start + limit)

      return { orders: paged, total, page, limit }
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabaseAdmin
      .from('orders')
      .select('*, sub_orders(id, status)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw new AppError(`Failed to fetch orders: ${error.message}`, 500)

    return { orders: data || [], total: count || 0, page, limit }
  },

  /**
   * Build a complete order response from stored data (for idempotency)
   */
  _buildOrderResponse: async (orderId) => {
    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const order = mockOrders[orderId]
      if (!order) return null

      const subOrders = Object.values(mockSubOrders).filter((so) => so.order_id === orderId)
      const payment = await paymentService.getPaymentByOrderId(orderId)

      return {
        order,
        sub_orders: subOrders.map((so) => ({
          ...so,
          items: mockOrderItems[so.id] || []
        })),
        payment: payment
          ? { transaction_ref: payment.transaction_ref, status: payment.status, amount: payment.amount, method: payment.payment_method }
          : null,
        quote: {
          subtotal: order.subtotal,
          discount_amount: order.discount_amount,
          tax_amount: order.tax_amount,
          shipping_fee: order.shipping_fee,
          total_amount: order.total_amount
        },
        idempotent_hit: true
      }
    }
    return null
  },

  // Reset mock state (for tests)
  _resetMock: () => {
    mockOrders = {}
    mockSubOrders = {}
    mockOrderItems = {}
    mockStatusHistory = {}
    mockOrderCounter = 1000
  }
}
