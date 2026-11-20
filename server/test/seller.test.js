import http from 'http';
import app from '../src/app.js';

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/seller`;
  let passedCount = 0;
  let totalTests = 12;

  console.log(`\n🧪 Running Stage 7 Seller Management Portal Test Suite on port ${port}...\n`);

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
    // --- Test 1: Unauthenticated request rejected (401) ---
    const res1 = await fetch(`${baseUrl}/profile`);
    assert(res1.status === 401, 'Unauthenticated user rejected from seller portal (401)');

    // --- Test 2: Customer role rejected (403 Forbidden) ---
    const res2 = await fetch(`${baseUrl}/profile`, {
      headers: { Authorization: CUSTOMER_TOKEN },
    });
    assert(res2.status === 403, 'Customer role blocked from seller portal (403)');

    // --- Test 3: Seller retrieves store profile ---
    const res3 = await fetch(`${baseUrl}/profile`, {
      headers: { Authorization: SELLER_TOKEN },
    });
    const data3 = await res3.json();
    assert(
      res3.status === 200 && data3.data?.store_name === 'QuickSure Electronics Hub',
      'Seller retrieves own storefront profile (200)'
    );

    // --- Test 4: Seller updates store profile / onboarding ---
    const res4 = await fetch(`${baseUrl}/onboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: SELLER_TOKEN },
      body: JSON.stringify({
        store_name: 'QuickSure Electronics & Audio Hub',
        store_slug: 'quicksure-electronics-audio',
        description: 'Updated store description for premium audio gadgets',
      }),
    });
    const data4 = await res4.json();
    assert(
      res4.status === 201 && data4.data?.store_name === 'QuickSure Electronics & Audio Hub',
      'Seller updates store profile via onboarding endpoint (201)'
    );

    // --- Test 5: Seller views own catalog products ---
    const res5 = await fetch(`${baseUrl}/products`, {
      headers: { Authorization: SELLER_TOKEN },
    });
    const data5 = await res5.json();
    assert(
      res5.status === 200 && Array.isArray(data5.data?.products) && data5.data.products.length >= 2,
      'Seller retrieves own product catalog entries (200)'
    );

    // --- Test 6: Seller updates inventory stock for owned variant ---
    const ownVariantId = 'v0000001-0000-0000-0000-000000000001';
    const res6 = await fetch(`${baseUrl}/variants/${ownVariantId}/stock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: SELLER_TOKEN },
      body: JSON.stringify({ stock_quantity: 60 }),
    });
    const data6 = await res6.json();
    assert(
      res6.status === 200 && data6.data?.stock_quantity === 60,
      'Seller updates inventory stock quantity for owned variant (200)'
    );

    // --- Test 7: Rule 5 Enforced (IDOR Protection) ---
    // Variant v0000001-...-0004 belongs to seller-0002 (TrendSetter Fashion)
    const otherSellerVariantId = 'v0000001-0000-0000-0000-000000000004';
    const res7 = await fetch(`${baseUrl}/variants/${otherSellerVariantId}/stock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: SELLER_TOKEN },
      body: JSON.stringify({ stock_quantity: 99 }),
    });
    assert(
      res7.status === 403,
      'Rule 5 Enforced: Seller blocked from modifying another vendor product variant (IDOR 403)'
    );

    // --- Test 8: Negative stock rejected by validator ---
    const res8 = await fetch(`${baseUrl}/variants/${ownVariantId}/stock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: SELLER_TOKEN },
      body: JSON.stringify({ stock_quantity: -10 }),
    });
    assert(res8.status === 422, 'Negative stock quantity rejected by validator (422)');

    // --- Test 9: Seller views assigned fulfillment sub-orders ---
    const res9 = await fetch(`${baseUrl}/orders`, {
      headers: { Authorization: SELLER_TOKEN },
    });
    const data9 = await res9.json();
    assert(
      res9.status === 200 && Array.isArray(data9.data),
      'Seller views fulfillment queue of assigned sub-orders (200)'
    );

    // --- Test 10: Dispatch with missing tracking info rejected ---
    const dummySubOrderId = 'sub-test-001';
    const res10 = await fetch(`${baseUrl}/orders/sub/${dummySubOrderId}/dispatch`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: SELLER_TOKEN },
      body: JSON.stringify({ courier_name: '' }), // missing tracking_number and empty courier
    });
    assert(res10.status === 422, 'Dispatch with missing courier or tracking number rejected (422)');

    // --- Test 11: Admin role can access seller portal (passes role guard) ---
    const res11 = await fetch(`${baseUrl}/orders`, {
      headers: { Authorization: ADMIN_TOKEN },
    });
    assert(res11.status === 200, 'Admin role passes role guard and accesses seller endpoints (200)');

    // --- Test 12: Invalid store slug rejected by onboarding schema ---
    const res12 = await fetch(`${baseUrl}/onboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: SELLER_TOKEN },
      body: JSON.stringify({
        store_name: 'Invalid Store',
        store_slug: 'INVALID SLUG WITH SPACES & CAPS',
      }),
    });
    assert(res12.status === 422, 'Invalid store slug rejected by onboarding validator (422)');

    console.log(`\n🎉 All ${passedCount}/${totalTests} Seller Management Portal tests passed successfully!\n`);
  } catch (err) {
    console.error(`\n💥 Seller Test Suite crashed: ${err.message}\n`, err.stack);
    process.exit(1);
  } finally {
    server.close();
  }
});
