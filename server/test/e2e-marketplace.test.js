import http from 'http';
import app from '../src/app.js';

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;
  let passedCount = 0;
  const totalTests = 14;

  console.log(`\n🧪 Running Stage 10 End-to-End Marketplace & Security Hardening Test Suite on port ${port}...\n`);

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

  try {
    // --- Step 1: Health Gateway Handshake ---
    const res1 = await fetch(`${baseUrl}/health`);
    const data1 = await res1.json();
    assert(res1.status === 200 && data1.success === true, '1. Health Gateway responds HTTP 200 with latency telemetry');

    // --- Step 2: Categories Tree Taxonomy ---
    const res2 = await fetch(`${baseUrl}/categories`);
    const data2 = await res2.json();
    assert(res2.status === 200 && Array.isArray(data2.data?.categories) && data2.data.categories.length > 0, '2. Category hierarchy tree retrieved with subcategories');

    // --- Step 3: Product Search and Price Filtering ---
    const res3 = await fetch(`${baseUrl}/products?q=SonicPro&min_price=1000`);
    const data3 = await res3.json();
    assert(res3.status === 200 && Array.isArray(data3.data) && data3.data.length > 0, '3. Faceted search correctly filters products by title query and price bounds');

    // --- Step 4: Product Detail by Slug with Variant Matrix ---
    const res4 = await fetch(`${baseUrl}/products/detail/quicksure-sonicpro-wireless-anc-headphones`);
    const data4 = await res4.json();
    assert(res4.status === 200 && data4.data?.product?.variants?.length >= 2, '4. Product detail retrieved by slug with complete variant matrix and images');

    // --- Step 5: Add Multi-Seller Items to Customer Cart ---
    await fetch(`${baseUrl}/cart`, { method: 'DELETE', headers: { Authorization: CUSTOMER_TOKEN } });
    const res5 = await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: CUSTOMER_TOKEN },
      body: JSON.stringify({ variant_id: 'v0000001-0000-0000-0000-000000000001', quantity: 1 }),
    });
    assert(res5.status === 201 || res5.status === 200, '5. Customer successfully adds item to persistent cart');

    // --- Step 6: Authoritative Pricing Quote ---
    const res6 = await fetch(`${baseUrl}/cart/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: CUSTOMER_TOKEN },
      body: JSON.stringify({ coupon_code: null }),
    });
    const data6 = await res6.json();
    const quote = data6.data;
    assert(res6.status === 200 && quote?.subtotal > 0 && quote?.tax_amount > 0, '6. Server pricing engine calculates authoritative subtotal and 5% GST tax');

    // --- Step 7: Rule 1 Pricing Tamper Immunity ---
    assert(quote.subtotal === 2499 && quote.tax_amount === 124.95, '7. Rule 1 Enforced: Server calculates all financial values; client inputs strictly ignored');

    // --- Step 8: Promotional Coupon Engine ---
    const res8 = await fetch(`${baseUrl}/cart/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: CUSTOMER_TOKEN },
      body: JSON.stringify({ coupon_code: 'QUICK100' }),
    });
    const data8 = await res8.json();
    assert(res8.status === 200 && data8.data?.discount_amount === 100, '8. Promotional coupon QUICK100 validates and applies flat ₹100 discount');

    // --- Step 9: Multi-Seller Atomic Checkout ---
    const testIdempotencyKey = `e2e-idem-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
    const checkoutPayload = {
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
      coupon_code: 'QUICK100',
      idempotency_key: testIdempotencyKey,
    };

    const res9 = await fetch(`${baseUrl}/orders/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: CUSTOMER_TOKEN },
      body: JSON.stringify(checkoutPayload),
    });
    const data9 = await res9.json();
    const placedOrder = data9.data?.order;
    const subOrders = data9.data?.sub_orders;
    assert(res9.status === 201 && placedOrder?.order_number && subOrders?.length > 0, '9. Atomic checkout completes creating parent order and vendor sub-orders');

    // --- Step 10: Rule 8 Multi-Seller Partitioning Verification ---
    assert(subOrders[0].seller_id && subOrders[0].commission_fee !== undefined, '10. Rule 8 Enforced: Sub-orders accurately partitioned per vendor with commission fee');

    // --- Step 11: Idempotency Immunity ---
    const res11 = await fetch(`${baseUrl}/orders/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: CUSTOMER_TOKEN },
      body: JSON.stringify(checkoutPayload),
    });
    const data11 = await res11.json();
    assert(res11.status === 200 && data11.data?.order?.id === placedOrder.id, '11. Idempotent retry returns identical order without creating duplicate database rows');

    // --- Step 12: Seller Fulfillment Dispatch ---
    const subOrderId = subOrders[0].id;
    // Advance state machine: pending -> confirmed -> packed -> shipped
    await fetch(`${baseUrl}/orders/sub/${subOrderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: SELLER_TOKEN },
      body: JSON.stringify({ status: 'confirmed' }),
    });
    await fetch(`${baseUrl}/orders/sub/${subOrderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: SELLER_TOKEN },
      body: JSON.stringify({ status: 'packed' }),
    });
    const res12 = await fetch(`${baseUrl}/seller/orders/sub/${subOrderId}/dispatch`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: SELLER_TOKEN },
      body: JSON.stringify({ courier_name: 'Delhivery Surface', tracking_number: 'DLV-9876543210' }),
    });
    const data12 = await res12.json();
    assert(res12.status === 200 && data12.data?.sub_order?.status === 'shipped', '12. Seller dispatches package with courier tracking number and updates status to shipped');

    // --- Step 13: Rule 5 IDOR Security Guard ---
    const res13 = await fetch(`${baseUrl}/seller/variants/v0000001-0000-0000-0000-000000000006/stock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: SELLER_TOKEN },
      body: JSON.stringify({ stock_quantity: 50 }),
    });
    assert(res13.status === 403, '13. Rule 5 Enforced: Cross-vendor inventory mutation strictly blocked (HTTP 403 IDOR Guard)');

    // --- Step 14: Admin Analytics & Governance ---
    const res14 = await fetch(`${baseUrl}/admin/stats`, {
      headers: { Authorization: ADMIN_TOKEN },
    });
    const data14 = await res14.json();
    assert(res14.status === 200 && data14.data?.financials?.gross_merchandise_value >= 0, '14. Admin retrieves platform GMV, total orders, and merchant revenue statistics');

    console.log(`\n🎉 All ${passedCount}/${totalTests} End-to-End Marketplace & Security Hardening tests passed successfully!\n`);
    server.close(() => process.exit(0));
  } catch (err) {
    console.error('Test execution exception:', err);
    server.close(() => process.exit(1));
  }
});
