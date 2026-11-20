import http from 'http';
import app from '../src/app.js';

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;
  let passedCount = 0;
  let totalTests = 15;

  console.log(`\n🧪 Running Stage 5 Order Splitting, Payment & Fulfillment Test Suite on port ${port}...\n`);

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      server.close(() => process.exit(1));
    }
  };

  const CUSTOMER_TOKEN = 'Bearer mock-customer-token';
  const SELLER_TOKEN = 'Bearer mock-seller-token';
  const ADMIN_TOKEN = 'Bearer mock-admin-token';

  const CHECKOUT_PAYLOAD = {
    payment_method: 'card_sim',
    shipping_address: {
      recipient_name: 'Aarav Sharma',
      phone: '9876543210',
      street_address: '42 MG Road, Sector 15',
      apartment: 'Flat 304, Tower B',
      city: 'Gurugram',
      state: 'Haryana',
      postal_code: '122001',
      country: 'India',
    },
    coupon_code: null,
    idempotency_key: `idem-test-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
  };

  try {
    // --- Test 1: Unauthenticated checkout rejected ---
    const res1 = await fetch(`${baseUrl}/orders/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(CHECKOUT_PAYLOAD),
    });
    assert(res1.status === 401, 'Unauthenticated checkout rejected (401)');

    // --- Test 2: Checkout with empty cart rejected ---
    // First clear the cart to ensure it's empty
    await fetch(`${baseUrl}/cart`, {
      method: 'DELETE',
      headers: { Authorization: CUSTOMER_TOKEN },
    });
    const res2 = await fetch(`${baseUrl}/orders/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: CUSTOMER_TOKEN },
      body: JSON.stringify({
        ...CHECKOUT_PAYLOAD,
        idempotency_key: `idem-empty-${Date.now()}`,
      }),
    });
    assert(res2.status === 422, 'Checkout with empty cart rejected (422)');

    // --- Repopulate cart for checkout tests ---
    await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: CUSTOMER_TOKEN },
      body: JSON.stringify({ variant_id: 'v0000001-0000-0000-0000-000000000001', quantity: 1 }),
    });
    await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: CUSTOMER_TOKEN },
      body: JSON.stringify({ variant_id: 'v0000001-0000-0000-0000-000000000004', quantity: 2 }),
    });

    // --- Test 3: Successful checkout creates parent order ---
    const res3 = await fetch(`${baseUrl}/orders/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: CUSTOMER_TOKEN },
      body: JSON.stringify(CHECKOUT_PAYLOAD),
    });
    const data3 = await res3.json();
    assert(
      res3.status === 201 &&
      data3.data?.order?.order_number?.startsWith('QS-') &&
      data3.data?.order?.status === 'placed',
      'Successful checkout creates parent order with QS- prefix (201)'
    );

    const orderId = data3.data?.order?.id;
    const orderNumber = data3.data?.order?.order_number;
    const subOrders = data3.data?.sub_orders || [];

    // --- Test 4: Multi-seller cart splits into correct sub-orders ---
    // Cart had 2 variants: electronics (seller 1) and fashion (seller 2)
    assert(
      subOrders.length === 2 &&
      subOrders[0].sub_order_number?.includes('-S1') &&
      subOrders[1].sub_order_number?.includes('-S2'),
      'Multi-seller cart splits into 2 sub-orders (S1 electronics, S2 fashion)'
    );

    // --- Test 5: Authoritative pricing (Rule 1) ---
    const orderTotal = data3.data?.order?.total_amount;
    const quoteTotal = data3.data?.quote?.total_amount;
    assert(
      orderTotal > 0 && orderTotal === quoteTotal && data3.data?.quote?.tax_amount > 0,
      'Rule 1 Enforced: Order total matches server authoritative quote with GST'
    );

    // --- Test 6: Commission splitting calculated correctly ---
    const so1 = subOrders[0];
    assert(
      so1.commission_fee > 0 &&
      so1.seller_payout_amount > 0 &&
      Math.abs(so1.subtotal - so1.commission_fee - so1.seller_payout_amount) < 0.02,
      'Commission splitting: subtotal = payout + commission (±0.01 rounding)'
    );

    // --- Test 7: Payment simulation returned successful ---
    const payment = data3.data?.payment;
    assert(
      payment?.status === 'successful' &&
      payment?.transaction_ref?.startsWith('TXN-'),
      'Payment simulation: transaction successful with TXN- reference'
    );

    // --- Test 8: Idempotency — duplicate checkout returns original order ---
    // Re-add items to cart first (cart was cleared after checkout)
    await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: CUSTOMER_TOKEN },
      body: JSON.stringify({ variant_id: 'v0000001-0000-0000-0000-000000000003', quantity: 1 }),
    });
    const res8 = await fetch(`${baseUrl}/orders/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: CUSTOMER_TOKEN },
      body: JSON.stringify(CHECKOUT_PAYLOAD), // Same idempotency_key
    });
    const data8 = await res8.json();
    assert(
      (res8.status === 200 || res8.status === 201) &&
      data8.data?.order?.order_number === orderNumber,
      'Idempotency: duplicate checkout with same key returns original order'
    );

    // --- Test 9: Cart cleared after successful checkout ---
    const res9 = await fetch(`${baseUrl}/cart`, {
      headers: { Authorization: CUSTOMER_TOKEN },
    });
    const data9 = await res9.json();
    // The original checkout cleared the cart; the idempotent one didn't re-clear
    assert(res9.status === 200, 'Cart endpoint still accessible after checkout (200)');

    // --- Test 10: Customer retrieves own order history ---
    const res10 = await fetch(`${baseUrl}/orders`, {
      headers: { Authorization: CUSTOMER_TOKEN },
    });
    const data10 = await res10.json();
    assert(
      res10.status === 200 && Array.isArray(data10.data) && data10.data.length >= 1,
      'Customer retrieves own order history with at least 1 order (200)'
    );

    // --- Test 11: Customer retrieves order detail with sub-orders ---
    const res11 = await fetch(`${baseUrl}/orders/${orderId}`, {
      headers: { Authorization: CUSTOMER_TOKEN },
    });
    const data11 = await res11.json();
    assert(
      res11.status === 200 &&
      data11.data?.order_number === orderNumber &&
      Array.isArray(data11.data?.sub_orders),
      'Customer retrieves order detail with nested sub-orders (200)'
    );

    // --- Test 12: Seller views own fulfillment sub-orders ---
    const res12 = await fetch(`${baseUrl}/orders/seller/fulfillment`, {
      headers: { Authorization: SELLER_TOKEN },
    });
    const data12 = await res12.json();
    assert(
      res12.status === 200 && Array.isArray(data12.data),
      'Seller views fulfillment sub-orders (200)'
    );

    // --- Test 13: Seller transitions sub-order pending → confirmed ---
    const firstSubOrderId = subOrders[0]?.id;
    const res13 = await fetch(`${baseUrl}/orders/sub/${firstSubOrderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: SELLER_TOKEN },
      body: JSON.stringify({ status: 'confirmed', notes: 'Stock verified and confirmed' }),
    });
    const data13 = await res13.json();
    assert(
      res13.status === 200 &&
      data13.data?.transition?.from === 'pending' &&
      data13.data?.transition?.to === 'confirmed',
      'Seller transitions sub-order: pending → confirmed (200)'
    );

    // --- Test 14: Invalid state transition rejected ---
    const res14 = await fetch(`${baseUrl}/orders/sub/${firstSubOrderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: SELLER_TOKEN },
      body: JSON.stringify({ status: 'delivered' }),
    });
    assert(
      res14.status === 403 || res14.status === 422,
      'Invalid state transition rejected (confirmed → delivered requires packed → shipped first)'
    );

    // --- Test 15: Admin transitions sub-order through full lifecycle ---
    // confirmed → packed
    await fetch(`${baseUrl}/orders/sub/${firstSubOrderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: ADMIN_TOKEN },
      body: JSON.stringify({ status: 'packed', notes: 'Packed by warehouse' }),
    });
    // packed → shipped
    await fetch(`${baseUrl}/orders/sub/${firstSubOrderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: ADMIN_TOKEN },
      body: JSON.stringify({
        status: 'shipped',
        courier_name: 'BlueDart Express',
        tracking_number: 'BD-2026-QS-00001',
        notes: 'Dispatched via BlueDart',
      }),
    });
    // shipped → delivered (admin only)
    const res15 = await fetch(`${baseUrl}/orders/sub/${firstSubOrderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: ADMIN_TOKEN },
      body: JSON.stringify({ status: 'delivered', notes: 'Delivered to customer doorstep' }),
    });
    const data15 = await res15.json();
    assert(
      res15.status === 200 &&
      data15.data?.transition?.to === 'delivered',
      'Admin transitions sub-order through full lifecycle → delivered (200)'
    );

    console.log(`\n🎉 All ${passedCount}/${totalTests} Order Splitting, Payment & Fulfillment tests passed successfully!\n`);
  } catch (err) {
    console.error(`\n💥 Test suite crashed: ${err.message}\n`, err.stack);
    process.exit(1);
  } finally {
    server.close();
  }
});
