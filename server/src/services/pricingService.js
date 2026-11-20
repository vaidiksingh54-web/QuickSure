import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { inventoryService } from './inventoryService.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

// In-memory demo coupons for test environment
const mockCoupons = {
  'QUICK10': {
    code: 'QUICK10',
    discount_type: 'percentage',
    discount_value: 10.00,
    min_order_amount: 500.00,
    max_discount_amount: 200.00,
    is_active: true,
  },
  'SURE50': {
    code: 'SURE50',
    discount_type: 'fixed',
    discount_value: 50.00,
    min_order_amount: 300.00,
    max_discount_amount: 50.00,
    is_active: true,
  },
  'WELCOME200': {
    code: 'WELCOME200',
    discount_type: 'fixed',
    discount_value: 200.00,
    min_order_amount: 1500.00,
    max_discount_amount: 200.00,
    is_active: true,
  },
  'EXPIRED': {
    code: 'EXPIRED',
    discount_type: 'percentage',
    discount_value: 50.00,
    min_order_amount: 100.00,
    is_active: false,
  },
};

export const pricingService = {
  /**
   * Authoritatively calculate prices, discounts, shipping, and taxes
   * ENFORCES RULE 1: Server calculates all pricing; client totals are ignored.
   */
  calculateOrderQuote: async ({ items, couponCode = null, userId = null }) => {
    if (!items || items.length === 0) {
      throw new ValidationError('Cannot generate quote for empty items list');
    }

    let subtotal = 0;
    const itemsBreakdown = [];

    // 1. Authoritative price lookup per line item
    for (const item of items) {
      const variant = await inventoryService.getVariantDetails(item.variant_id);
      const unitPrice = Number(variant.price);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      itemsBreakdown.push({
        variant_id: variant.id,
        sku: variant.sku,
        variant_name: variant.variant_name,
        unit_price: unitPrice,
        quantity: item.quantity,
        total_price: lineTotal,
        in_stock: variant.stock_quantity >= item.quantity,
      });
    }

    // 2. Shipping calculation: Free delivery over ₹500, else ₹40 standard delivery
    const freeShippingThreshold = 500.00;
    const standardShippingFee = 40.00;
    const shippingFee = subtotal >= freeShippingThreshold ? 0.00 : standardShippingFee;

    // 3. Tax calculation (5% GST standard)
    const taxRate = 0.05;
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;

    // 4. Coupon validation and discount application
    let discountAmount = 0.00;
    let couponDetails = null;

    if (couponCode) {
      const cleanCode = couponCode.trim().toUpperCase();
      couponDetails = await pricingService.validateCoupon(cleanCode, subtotal, userId);
      discountAmount = couponDetails.calculated_discount;
    }

    // 5. Final total calculation
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee + taxAmount);

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount_amount: Math.round(discountAmount * 100) / 100,
      shipping_fee: shippingFee,
      tax_amount: taxAmount,
      total_amount: Math.round(totalAmount * 100) / 100,
      coupon_applied: couponDetails
        ? {
            code: couponDetails.code,
            discount_type: couponDetails.discount_type,
            discount_value: couponDetails.discount_value,
            savings: discountAmount,
          }
        : null,
      items_breakdown: itemsBreakdown,
      currency: 'INR',
    };
  },

  /**
   * Validate coupon code against minimum spend, expiry, and customer limits
   */
  validateCoupon: async (code, subtotal, userId = null) => {
    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const coupon = mockCoupons[code];
      if (!coupon || !coupon.is_active) {
        throw new ValidationError(`Coupon '${code}' is invalid or has expired.`);
      }

      if (subtotal < coupon.min_order_amount) {
        throw new ValidationError(
          `Coupon '${code}' requires a minimum cart value of ₹${coupon.min_order_amount}. (Current: ₹${subtotal})`
        );
      }

      let discount = 0;
      if (coupon.discount_type === 'percentage') {
        discount = (subtotal * coupon.discount_value) / 100;
        if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
          discount = coupon.max_discount_amount;
        }
      } else {
        discount = Math.min(coupon.discount_value, subtotal);
      }

      return {
        ...coupon,
        calculated_discount: discount,
      };
    }

    // Database lookup in Supabase
    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (error || !coupon) {
      throw new ValidationError(`Coupon '${code}' is invalid.`);
    }

    // Check expiry
    const now = new Date();
    if (new Date(coupon.starts_at) > now || new Date(coupon.expires_at) < now) {
      throw new ValidationError(`Coupon '${code}' has expired.`);
    }

    // Check minimum spend
    if (subtotal < Number(coupon.min_order_amount)) {
      throw new ValidationError(
        `Coupon '${code}' requires a minimum cart spend of ₹${coupon.min_order_amount}.`
      );
    }

    // Check single-use restriction per user
    if (userId) {
      const { data: redemption } = await supabaseAdmin
        .from('coupon_redemptions')
        .select('id')
        .eq('coupon_id', coupon.id)
        .eq('user_id', userId)
        .single();

      if (redemption) {
        throw new ValidationError(`You have already redeemed coupon '${code}'. Limit 1 per customer.`);
      }
    }

    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = (subtotal * Number(coupon.discount_value)) / 100;
      if (coupon.max_discount_amount && discount > Number(coupon.max_discount_amount)) {
        discount = Number(coupon.max_discount_amount);
      }
    } else {
      discount = Math.min(Number(coupon.discount_value), subtotal);
    }

    return {
      ...coupon,
      calculated_discount: discount,
    };
  },
};
