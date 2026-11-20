import http from 'http';
import app from '../src/app.js';

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/admin`;
  let passedCount = 0;
  let totalTests = 12;

  console.log(`\n🧪 Running Stage 6 Admin Management Portal Test Suite on port ${port}...\n`);

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
    // --- Test 1: Unauthenticated request rejected ---
    const res1 = await fetch(`${baseUrl}/stats`);
    assert(res1.status === 401, 'Unauthenticated user rejected from admin portal (401)');

    // --- Test 2: Customer role rejected (403 Forbidden) ---
    const res2 = await fetch(`${baseUrl}/stats`, {
      headers: { Authorization: CUSTOMER_TOKEN },
    });
    assert(res2.status === 403, 'Customer role blocked from admin portal (403)');

    // --- Test 3: Seller role rejected (403 Forbidden) ---
    const res3 = await fetch(`${baseUrl}/stats`, {
      headers: { Authorization: SELLER_TOKEN },
    });
    assert(res3.status === 403, 'Seller role blocked from admin portal (403)');

    // --- Test 4: Admin retrieves platform stats ---
    const res4 = await fetch(`${baseUrl}/stats`, {
      headers: { Authorization: ADMIN_TOKEN },
    });
    const data4 = await res4.json();
    assert(
      res4.status === 200 &&
      data4.data?.financials?.gross_merchandise_value > 0 &&
      data4.data?.financials?.platform_commission_earned > 0,
      'Admin retrieves platform analytics, GMV, and commission financials (200)'
    );

    // --- Test 5: Admin retrieves sellers list ---
    const res5 = await fetch(`${baseUrl}/sellers`, {
      headers: { Authorization: ADMIN_TOKEN },
    });
    const data5 = await res5.json();
    assert(
      res5.status === 200 && Array.isArray(data5.data) && data5.data.length >= 2,
      'Admin retrieves paginated vendor list (200)'
    );

    // --- Test 6: Admin approves pending seller ---
    const pendingSellerId = 'seller-0003-0000-0000-000000000003';
    const res6 = await fetch(`${baseUrl}/sellers/${pendingSellerId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: ADMIN_TOKEN },
      body: JSON.stringify({ status: 'approved', reason: 'Documents verified by Admin' }),
    });
    const data6 = await res6.json();
    assert(
      res6.status === 200 && data6.data?.status === 'approved',
      'Admin approves pending seller with justification audit (200)'
    );

    // --- Test 7: Admin overrides commission rate ---
    const res7 = await fetch(`${baseUrl}/sellers/${pendingSellerId}/commission`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: ADMIN_TOKEN },
      body: JSON.stringify({ commission_rate: 15.50 }),
    });
    const data7 = await res7.json();
    assert(
      res7.status === 200 && Number(data7.data?.commission_rate) === 15.50,
      'Admin overrides seller commission rate to 15.50% (200)'
    );

    // --- Test 8: Admin commission validation error (>100%) ---
    const res8 = await fetch(`${baseUrl}/sellers/${pendingSellerId}/commission`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: ADMIN_TOKEN },
      body: JSON.stringify({ commission_rate: 125.00 }),
    });
    assert(res8.status === 422, 'Invalid commission rate (>100%) rejected by validator (422)');

    // --- Test 9: Admin retrieves categories list ---
    const res9 = await fetch(`${baseUrl}/categories`, {
      headers: { Authorization: ADMIN_TOKEN },
    });
    const data9 = await res9.json();
    assert(
      res9.status === 200 && Array.isArray(data9.data) && data9.data.length >= 3,
      'Admin retrieves category taxonomy hierarchy (200)'
    );

    // --- Test 10: Admin creates a new category ---
    const testCatSlug = `test-sports-${Date.now()}`;
    const res10 = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: ADMIN_TOKEN },
      body: JSON.stringify({
        name: 'Sports & Fitness',
        slug: testCatSlug,
        description: 'Gym equipment, sports gear, and activewear',
        display_order: 5,
        is_active: true,
      }),
    });
    const data10 = await res10.json();
    assert(
      res10.status === 201 && data10.data?.slug === testCatSlug,
      'Admin creates new taxonomy category (201)'
    );

    const createdCatId = data10.data?.id;

    // --- Test 11: Admin updates category ---
    const res11 = await fetch(`${baseUrl}/categories/${createdCatId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: ADMIN_TOKEN },
      body: JSON.stringify({ name: 'Sports, Fitness & Outdoor' }),
    });
    const data11 = await res11.json();
    assert(
      res11.status === 200 && data11.data?.name === 'Sports, Fitness & Outdoor',
      'Admin updates category details (200)'
    );

    // --- Test 12: Admin deletes category ---
    const res12 = await fetch(`${baseUrl}/categories/${createdCatId}`, {
      method: 'DELETE',
      headers: { Authorization: ADMIN_TOKEN },
    });
    assert(res12.status === 200, 'Admin removes category successfully (200)');

    console.log(`\n🎉 All ${passedCount}/${totalTests} Admin Management Portal tests passed successfully!\n`);
  } catch (err) {
    console.error(`\n💥 Admin Test Suite crashed: ${err.message}\n`, err.stack);
    process.exit(1);
  } finally {
    server.close();
  }
});
