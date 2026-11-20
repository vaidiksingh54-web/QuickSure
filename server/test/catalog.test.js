import http from 'http';
import app from '../src/app.js';

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;
  let passedCount = 0;
  let totalTests = 14;

  console.log(`\n🧪 Running Stage 3 Catalog & Storage Test Suite on port ${port}...\n`);

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
    // 1. Categories List
    const res1 = await fetch(`${baseUrl}/categories`);
    const data1 = await res1.json();
    assert(res1.status === 200 && Array.isArray(data1.data?.categories), 'Fetch all categories with subcategory hierarchy (200)');

    // 2. Single Category by Slug
    const res2 = await fetch(`${baseUrl}/categories/electronics`);
    const data2 = await res2.json();
    assert(res2.status === 200 && data2.data?.category?.slug === 'electronics', 'Fetch category by slug (200)');

    // 3. Customer blocked from creating category
    const res3 = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-customer-token',
      },
      body: JSON.stringify({ name: 'Automotive', slug: 'automotive' }),
    });
    assert(res3.status === 403, 'Customer blocked from creating category (403)');

    // 4. Admin creates new category
    const res4 = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-admin-token',
      },
      body: JSON.stringify({ name: 'Automotive', slug: `automotive-${Date.now()}` }),
    });
    assert(res4.status === 201, 'Admin authorized to create category (201)');

    // 5. Products pagination & list
    const res5 = await fetch(`${baseUrl}/products?page=1&limit=2`);
    const data5 = await res5.json();
    assert(res5.status === 200 && data5.data?.length === 2 && data5.meta?.total >= 4, 'Paginated product listing with metadata (200)');

    // 6. Product search filter
    const res6 = await fetch(`${baseUrl}/products?q=headphones`);
    const data6 = await res6.json();
    assert(res6.status === 200 && data6.data?.length >= 1, 'Search products by keyword (200)');

    // 7. Product category filter
    const res7 = await fetch(`${baseUrl}/products?category=audio-headphones`);
    const data7 = await res7.json();
    assert(res7.status === 200 && data7.data?.every((p) => p.category_slug === 'audio-headphones'), 'Filter products by category slug (200)');

    // 8. Product details with variants & images
    const res8 = await fetch(`${baseUrl}/products/detail/quicksure-sonicpro-wireless-anc-headphones`);
    const data8 = await res8.json();
    assert(
      res8.status === 200 &&
      data8.data?.product?.variants?.length >= 2 &&
      data8.data?.product?.images?.length >= 1,
      'Retrieve single product with full variant matrix & image gallery (200)'
    );

    // 9. Unauthenticated cannot create product
    const res9 = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test Product' }),
    });
    assert(res9.status === 401, 'Unauthenticated user rejected from creating product (401)');

    // 10. Customer cannot create product
    const res10 = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-customer-token',
      },
      body: JSON.stringify({ title: 'Test Product' }),
    });
    assert(res10.status === 403, 'Customer rejected from creating product (403)');

    // 11. Approved seller creates product + variant + image
    const newProductPayload = {
      title: 'UltraBass Portable Bluetooth Speaker',
      slug: `ultrabass-portable-speaker-${Date.now()}`,
      brand: 'SonicPro',
      description: 'Waterproof IPX7 rugged bluetooth speaker with deep punchy bass.',
      category_id: 'c0000002-0000-0000-0000-000000000001',
      specifications: { output_watts: 20, battery_hours: 15 },
      variants: [
        {
          sku: `UB-SPK-${Date.now()}`,
          variant_name: 'Camouflage Green',
          price: 1299.00,
          compare_at_price: 2499.00,
          stock_quantity: 50,
          attributes: { color: 'Camouflage Green' },
        },
      ],
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80',
          alt_text: 'UltraBass Speaker',
          is_primary: true,
          display_order: 1,
        },
      ],
    };

    const res11 = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-seller-token',
      },
      body: JSON.stringify(newProductPayload),
    });
    const data11 = await res11.json();
    assert(res11.status === 201 && data11.data?.product?.variants?.length === 1, 'Seller successfully creates product with variants and image (201)');

    const createdProductId = data11.data?.product?.id;

    // 12. IDOR Protection: Seller cannot edit product from another seller
    // Let's test editing a product belonging to another seller
    const res12 = await fetch(`${baseUrl}/products/p0000001-0000-0000-0000-000000000003`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-seller-token', // Seller 1 trying to edit TrendVault's shirt (Seller 2)
      },
      body: JSON.stringify({ title: 'Hacked Title' }),
    });
    assert(res12.status === 403, 'Rule 5 Enforced: Seller blocked from modifying another seller product (IDOR 403)');

    // 13. Soft delete: product is deactivated without destroying record
    const res13 = await fetch(`${baseUrl}/products/${createdProductId}`, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer mock-seller-token',
      },
    });
    assert(res13.status === 200, 'Rule 7 Enforced: Product soft-deleted successfully (200)');

    // 14. Image Upload endpoint
    const res14 = await fetch(`${baseUrl}/upload/product-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-seller-token',
      },
      body: JSON.stringify({
        filename: 'product-preview.jpg',
        image_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        mime_type: 'image/jpeg',
      }),
    });
    const data14 = await res14.json();
    assert(res14.status === 201 && data14.data?.url?.startsWith('http'), 'Upload product image and return CDN URL (201)');

    console.log(`\n🎉 All ${passedCount}/${totalTests} Catalog & Storage integration tests passed successfully!\n`);
    server.close(() => process.exit(0));
  } catch (err) {
    console.error('❌ Catalog test suite threw error:', err);
    server.close(() => process.exit(1));
  }
});
