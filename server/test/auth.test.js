import http from 'http';
import app from '../src/app.js';

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/auth`;
  let passedCount = 0;
  let totalTests = 10;

  console.log(`\n🧪 Running Stage 2 Auth & RBAC Test Suite on port ${port}...\n`);

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      server.close(() => process.exit(1));
    }
  };

  try {
    // Test 1: Unauthenticated request should be rejected
    const res1 = await fetch(`${baseUrl}/me`);
    const data1 = await res1.json();
    assert(res1.status === 401 && data1.error?.code === 'UNAUTHORIZED', 'Reject request without Authorization header (401)');

    // Test 2: Invalid bearer token should be rejected
    const res2 = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: 'Bearer invalid-token-xyz' },
    });
    const data2 = await res2.json();
    assert(res2.status === 401, 'Reject invalid Bearer token (401)');

    // Test 3: Suspended user should be blocked
    const res3 = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: 'Bearer mock-inactive-token' },
    });
    const data3 = await res3.json();
    assert(res3.status === 403 && data3.error?.code === 'FORBIDDEN', 'Reject suspended user account (403)');

    // Test 4: Authenticated customer can retrieve profile
    const res4 = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: 'Bearer mock-customer-token' },
    });
    const data4 = await res4.json();
    assert(res4.status === 200 && data4.data?.profile?.role === 'customer', 'Customer can retrieve own profile (200)');

    // Test 5: Customer attempting to access Admin route should be rejected (RBAC)
    const res5 = await fetch(`${baseUrl}/admin-check`, {
      headers: { Authorization: 'Bearer mock-customer-token' },
    });
    const data5 = await res5.json();
    assert(res5.status === 403 && data5.error?.code === 'FORBIDDEN', 'Customer blocked from admin route (403)');

    // Test 6: Admin accessing Admin route is authorized
    const res6 = await fetch(`${baseUrl}/admin-check`, {
      headers: { Authorization: 'Bearer mock-admin-token' },
    });
    const data6 = await res6.json();
    assert(res6.status === 200 && data6.data?.user?.role === 'admin', 'Admin authorized for admin route (200)');

    // Test 7: Customer blocked from Seller fulfillment route
    const res7 = await fetch(`${baseUrl}/seller-check`, {
      headers: { Authorization: 'Bearer mock-customer-token' },
    });
    assert(res7.status === 403, 'Customer blocked from seller route (403)');

    // Test 8: Approved seller authorized for Seller route
    const res8 = await fetch(`${baseUrl}/seller-check`, {
      headers: { Authorization: 'Bearer mock-seller-token' },
    });
    const data8 = await res8.json();
    assert(res8.status === 200 && data8.data?.seller?.status === 'approved', 'Approved seller authorized for seller route (200)');

    // Test 9: Profile update with valid fields succeeds
    const res9 = await fetch(`${baseUrl}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-customer-token',
      },
      body: JSON.stringify({ full_name: 'Vaidik Singh Updated' }),
    });
    const data9 = await res9.json();
    assert(res9.status === 200 && data9.data?.profile?.full_name === 'Vaidik Singh Updated', 'Customer can update full_name (200)');

    // Test 10: Rule 3 Enforcement - Role tampering rejected
    const res10 = await fetch(`${baseUrl}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-customer-token',
      },
      body: JSON.stringify({ full_name: 'Hacker', role: 'admin' }),
    });
    const data10 = await res10.json();
    assert(res10.status === 422 && data10.error?.code === 'VALIDATION_ERROR', 'Rule 3 Enforced: Role tampering strictly rejected (422)');

    console.log(`\n🎉 All ${passedCount}/${totalTests} Auth & RBAC integration tests passed successfully!\n`);
    server.close(() => process.exit(0));
  } catch (err) {
    console.error('❌ Auth test suite threw unexpected error:', err);
    server.close(() => process.exit(1));
  }
});
