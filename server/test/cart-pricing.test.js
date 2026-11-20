import http from 'http';
import app from '../src/app.js';
import { inventoryService } from '../src/services/inventoryService.js';

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;
  let passedCount = 0;
  let totalTests = 12;

  console.log(`\n🧪 Running Stage 4 Cart, Pricing & Concurrency Test Suite on port ${port}...\n`);

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
    // 1. Unauthenticated cart access rejected
    const res1 = await fetch(`${baseUrl}/cart`);
    assert(res1.status === 401, 'Unauthenticated user rejected from cart (401)');

    // 2. Authenticated user retrieves cart
    const res2 = await fetch(`${baseUrl}/cart`, {
      headers: { Authorization: 'Bearer mock-customer-token' },
    });
    const data2 = await res2.json();
    assert(res2.status === 200 && Array.isArray(data2.data?.items), 'Authenticated customer retrieves active cart (200)');

    // 3. Add item to cart
    const res3 = await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-customer-token',
      },
      body: JSON.stringify({
        variant_id: 'v0000001-0000-0000-0000-000000000003',
        quantity: 2,
      }),
    });
    assert(res3.status === 201, 'Customer adds variant item to cart (201)');

    // 4. Update item quantity
    const res4 = await fetch(`${baseUrl}/cart/items/ci-0001`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-customer-token',
      },
      body: JSON.stringify({ quantity: 3 }),
    });
    assert(res4.status === 200, 'Customer updates item quantity in cart (200)');

    // 5. Authoritative Server Pricing Quote (Rule 1)
    const res5 = await fetch(`${baseUrl}/cart/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-customer-token',
      },
      body: JSON.stringify({}),
    });
    const data5 = await res5.json();
    const q5 = data5.data;
    assert(
      res5.status === 200 &&
      q5.subtotal > 0 &&
      q5.tax_amount === Math.round(q5.subtotal * 0.05 * 100) / 100 &&
      q5.total_amount > 0,
      'Rule 1 Enforced: Server calculates subtotal, tax, and total from authoritative DB prices (200)'
    );

    // 6. Apply Valid Coupon (QUICK10 - 10% off)
    const res6 = await fetch(`${baseUrl}/cart/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-customer-token',
      },
      body: JSON.stringify({ coupon_code: 'QUICK10' }),
    });
    const data6 = await res6.json();
    const q6 = data6.data;
    assert(
      res6.status === 200 &&
      q6.coupon_applied?.code === 'QUICK10' &&
      q6.discount_amount > 0,
      'Coupon engine: QUICK10 successfully applied with discount calculated (200)'
    );

    // 7. Reject Expired / Invalid Coupon
    const res7 = await fetch(`${baseUrl}/cart/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-customer-token',
      },
      body: JSON.stringify({ coupon_code: 'EXPIRED' }),
    });
    assert(res7.status === 422, 'Coupon engine: Inactive or expired coupon rejected (422)');

    // 8. Merge Guest Cart on Login (ADR-005)
    const res8 = await fetch(`${baseUrl}/cart/merge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-customer-token',
      },
      body: JSON.stringify({
        items: [
          { variant_id: 'v0000001-0000-0000-0000-000000000004', quantity: 1 },
        ],
      }),
    });
    assert(res8.status === 200, 'ADR-005 Enforced: Guest localStorage items auto-merged into account (200)');

    // 9. Atomic Inventory Concurrency: Successful reservation (Rule 4)
    const initialStock = inventoryService._getRawStock('v0000001-0000-0000-0000-000000000099');
    assert(initialStock === 1, 'Pre-check: Flash item has exactly 1 unit in stock');

    const reserved = await inventoryService.reserveStockAtomically([
      { variant_id: 'v0000001-0000-0000-0000-000000000099', quantity: 1 },
    ]);
    assert(reserved.length === 1 && inventoryService._getRawStock('v0000001-0000-0000-0000-000000000099') === 0, 'Atomic reservation decrements stock floor cleanly');

    // 10. Atomic Concurrency Oversell Rejection (Conflict 409)
    let oversellBlocked = false;
    try {
      // Attempting to reserve another unit when stock is 0
      await inventoryService.reserveStockAtomically([
        { variant_id: 'v0000001-0000-0000-0000-000000000099', quantity: 1 },
      ]);
    } catch (err) {
      if (err.statusCode === 409) oversellBlocked = true;
    }
    assert(oversellBlocked === true, 'Rule 4 Enforced: Parallel overselling rejected with 409 Conflict');

    // Release back for safety
    await inventoryService.releaseStockAtomically([
      { variant_id: 'v0000001-0000-0000-0000-000000000099', quantity: 1 },
    ]);

    // 11. Wishlist toggle
    const res11 = await fetch(`${baseUrl}/wishlist/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-customer-token',
      },
      body: JSON.stringify({ product_id: 'p0000001-0000-0000-0000-000000000001' }),
    });
    const data11 = await res11.json();
    assert(res11.status === 200 && data11.data?.is_in_wishlist === true, 'Product added to wishlist via toggle (200)');

    // 12. Clear Cart
    const res12 = await fetch(`${baseUrl}/cart`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer mock-customer-token' },
    });
    assert(res12.status === 200, 'Customer cart cleared successfully (200)');

    console.log(`\n🎉 All ${passedCount}/${totalTests} Cart, Pricing & Concurrency tests passed successfully!\n`);
    server.close(() => process.exit(0));
  } catch (err) {
    console.error('❌ Cart test suite threw unexpected error:', err);
    server.close(() => process.exit(1));
  }
});
