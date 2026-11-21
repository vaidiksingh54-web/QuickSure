import { ApiResponse } from '../utils/apiResponse.js'
import { supabaseAdmin } from '../config/supabase.js'
import { env } from '../config/env.js'
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema
} from '../validators/productValidator.js'
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors.js'

// In-memory demo products for test and local dev environments
const mockProducts = [
  {
    id: 'p0000001-0000-0000-0000-000000000001',
    seller_id: 's0000001-0000-0000-0000-000000000001',
    category_id: 'c0000002-0000-0000-0000-000000000001',
    category_slug: 'audio-headphones',
    category_name: 'Audio & Headphones',
    seller_name: 'ElectroPrime India',
    title: 'QuickSure SonicPro Wireless ANC Headphones',
    slug: 'quicksure-sonicpro-wireless-anc-headphones',
    brand: 'SonicPro',
    description: 'High-fidelity active noise-cancelling wireless headphones with 40-hour battery life and quick charge technology.',
    specifications: { bluetooth: '5.3', battery_hours: 40, weight_grams: 250, driver_size_mm: 40 },
    is_active: true,
    is_approved: true,
    rating_avg: 4.8,
    rating_count: 1420,
    deleted_at: null,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    variants: [
      {
        id: 'v0000001-0000-0000-0000-000000000001',
        sku: 'SP-ANC-BLK',
        variant_name: 'Midnight Black',
        price: 2499.00,
        compare_at_price: 4999.00,
        stock_quantity: 45,
        attributes: { color: 'Midnight Black' },
        is_active: true
      },
      {
        id: 'v0000001-0000-0000-0000-000000000002',
        sku: 'SP-ANC-SLV',
        variant_name: 'Silver Frost',
        price: 2599.00,
        compare_at_price: 4999.00,
        stock_quantity: 18,
        attributes: { color: 'Silver Frost' },
        is_active: true
      }
    ],
    images: [
      {
        id: 'i0000001-0000-0000-0000-000000000001',
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        alt_text: 'SonicPro Wireless ANC Headphones Black',
        is_primary: true,
        display_order: 1
      },
      {
        id: 'i0000001-0000-0000-0000-000000000002',
        image_url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80',
        alt_text: 'SonicPro Headphones Side Angle',
        is_primary: false,
        display_order: 2
      }
    ]
  },
  {
    id: 'p0000001-0000-0000-0000-000000000002',
    seller_id: 's0000001-0000-0000-0000-000000000001',
    category_id: 'c0000002-0000-0000-0000-000000000002',
    category_slug: 'smartphones-wearables',
    category_name: 'Smartphones & Wearables',
    seller_name: 'ElectroPrime India',
    title: 'AeroWatch S5 Smartwatch with AMOLED Display',
    slug: 'aerowatch-s5-smartwatch-amoled',
    brand: 'AeroTech',
    description: 'Precision heart rate and SpO2 health tracking with 1.43-inch AMOLED display and 100+ sport modes.',
    specifications: { display: '1.43 AMOLED', water_resistance: '5ATM', battery_days: 12 },
    is_active: true,
    is_approved: true,
    rating_avg: 4.6,
    rating_count: 890,
    deleted_at: null,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    variants: [
      {
        id: 'v0000001-0000-0000-0000-000000000003',
        sku: 'AW-S5-OBS',
        variant_name: 'Obsidian Black Strap',
        price: 1899.00,
        compare_at_price: 3499.00,
        stock_quantity: 32,
        attributes: { color: 'Obsidian Black', strap: 'Silicone' },
        is_active: true
      }
    ],
    images: [
      {
        id: 'i0000001-0000-0000-0000-000000000003',
        image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
        alt_text: 'AeroWatch S5 Smartwatch',
        is_primary: true,
        display_order: 1
      }
    ]
  },
  {
    id: 'p0000001-0000-0000-0000-000000000003',
    seller_id: 's0000001-0000-0000-0000-000000000002',
    category_id: 'c0000002-0000-0000-0000-000000000003',
    category_slug: 'men-fashion',
    category_name: 'Men Fashion',
    seller_name: 'TrendVault Apparel',
    title: 'Pure Organic Cotton Oxford Casual Shirt',
    slug: 'pure-organic-cotton-oxford-casual-shirt',
    brand: 'TrendVault',
    description: 'Tailored fit breathable 100% organic cotton casual shirt with button-down collar.',
    specifications: { material: '100% Organic Cotton', fit: 'Tailored Regular', weave: 'Oxford' },
    is_active: true,
    is_approved: true,
    rating_avg: 4.5,
    rating_count: 530,
    deleted_at: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    variants: [
      {
        id: 'v0000001-0000-0000-0000-000000000004',
        sku: 'OXF-BLU-M',
        variant_name: 'Sky Blue / M',
        price: 899.00,
        compare_at_price: 1599.00,
        stock_quantity: 25,
        attributes: { color: 'Sky Blue', size: 'M' },
        is_active: true
      },
      {
        id: 'v0000001-0000-0000-0000-000000000005',
        sku: 'OXF-BLU-L',
        variant_name: 'Sky Blue / L',
        price: 899.00,
        compare_at_price: 1599.00,
        stock_quantity: 14,
        attributes: { color: 'Sky Blue', size: 'L' },
        is_active: true
      }
    ],
    images: [
      {
        id: 'i0000001-0000-0000-0000-000000000004',
        image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80',
        alt_text: 'Organic Cotton Oxford Casual Shirt',
        is_primary: true,
        display_order: 1
      }
    ]
  },
  {
    id: 'p0000001-0000-0000-0000-000000000004',
    seller_id: 's0000001-0000-0000-0000-000000000001',
    category_id: 'c0000002-0000-0000-0000-000000000004',
    category_slug: 'kitchen-appliances',
    category_name: 'Kitchen Appliances',
    seller_name: 'ElectroPrime India',
    title: 'TurboMix 750W Heavy-Duty Mixer Grinder with 3 Stainless Steel Jars',
    slug: 'turbomix-750w-heavy-duty-mixer-grinder',
    brand: 'TurboMix',
    description: 'High-torque 750W copper motor with overload protection, 3 specialized stainless steel jars for dry, wet, and chutney grinding.',
    specifications: { power_watts: 750, jars_count: 3, blade_material: 'SS 304' },
    is_active: true,
    is_approved: true,
    rating_avg: 4.7,
    rating_count: 2150,
    deleted_at: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    variants: [
      {
        id: 'v0000001-0000-0000-0000-000000000006',
        sku: 'TM-750-BLU',
        variant_name: 'Royal Blue / 3 Jars',
        price: 1849.00,
        compare_at_price: 3299.00,
        stock_quantity: 40,
        attributes: { color: 'Royal Blue', power: '750W' },
        is_active: true
      }
    ],
    images: [
      {
        id: 'i0000001-0000-0000-0000-000000000005',
        image_url: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&q=80',
        alt_text: 'TurboMix Mixer Grinder',
        is_primary: true,
        display_order: 1
      }
    ]
  },
  {
    id: 'p0000001-0000-0000-0000-000000000005',
    seller_id: 's0000001-0000-0000-0000-000000000001',
    category_id: 'c0000002-0000-0000-0000-000000000002',
    category_slug: 'smartphones-wearables',
    category_name: 'Smartphones & Wearables',
    seller_name: 'ElectroPrime India',
    title: 'NexusPhone 15 Pro Max Titanium 512GB',
    slug: 'nexusphone-15-pro-max-titanium-512gb',
    brand: 'NexusPhone',
    description: 'A17 Pro chip, 6.7-inch Super Retina XDR display, titanium design, 48MP main camera, and USB-C connectivity. All-day battery life with fast charging.',
    specifications: { display: '6.7 inch Super Retina XDR', chip: 'A17 Pro', storage: '512GB', camera: '48MP', battery_hours: 29 },
    is_active: true,
    is_approved: true,
    rating_avg: 4.9,
    rating_count: 3240,
    deleted_at: null,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    variants: [
      {
        id: 'v0000001-0000-0000-0000-000000000007',
        sku: 'NP15PM-TIT-BLU-512',
        variant_name: 'Blue Titanium / 512GB',
        price: 159900.00,
        compare_at_price: 174900.00,
        stock_quantity: 28,
        attributes: { color: 'Blue Titanium', storage: '512GB' },
        is_active: true
      },
      {
        id: 'v0000001-0000-0000-0000-000000000008',
        sku: 'NP15PM-TIT-NAT-512',
        variant_name: 'Natural Titanium / 512GB',
        price: 159900.00,
        compare_at_price: 174900.00,
        stock_quantity: 15,
        attributes: { color: 'Natural Titanium', storage: '512GB' },
        is_active: true
      }
    ],
    images: [
      {
        id: 'i0000001-0000-0000-0000-000000000006',
        image_url: 'https://images.unsplash.com/photo-1678724169946-0e83a7b6b9e3?w=800&q=80',
        alt_text: 'NexusPhone 15 Pro Max Blue Titanium',
        is_primary: true,
        display_order: 1
      }
    ]
  },
  {
    id: 'p0000001-0000-0000-0000-000000000006',
    seller_id: 's0000001-0000-0000-0000-000000000001',
    category_id: 'c0000002-0000-0000-0000-000000000002',
    category_slug: 'smartphones-wearables',
    category_name: 'Smartphones & Wearables',
    seller_name: 'ElectroPrime India',
    title: 'GalaxyS24 Ultra 5G 256GB Titanium Gray',
    slug: 'galaxys24-ultra-5g-256gb-titanium-gray',
    brand: 'GalaxyS',
    description: 'Snapdragon 8 Gen 3 for Galaxy, 6.8-inch Dynamic AMOLED 2X, 200MP camera, S Pen included, 5000mAh battery, IP68 rated.',
    specifications: { display: '6.8 inch Dynamic AMOLED 2X', chip: 'Snapdragon 8 Gen 3', storage: '256GB', camera: '200MP', battery_mah: 5000 },
    is_active: true,
    is_approved: true,
    rating_avg: 4.8,
    rating_count: 2560,
    deleted_at: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    variants: [
      {
        id: 'v0000001-0000-0000-0000-000000000009',
        sku: 'GS24U-TIT-GRY-256',
        variant_name: 'Titanium Gray / 256GB',
        price: 129999.00,
        compare_at_price: 139999.00,
        stock_quantity: 42,
        attributes: { color: 'Titanium Gray', storage: '256GB' },
        is_active: true
      }
    ],
    images: [
      {
        id: 'i0000001-0000-0000-0000-000000000007',
        image_url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80',
        alt_text: 'Galaxy S24 Ultra Titanium Gray',
        is_primary: true,
        display_order: 1
      }
    ]
  },
  {
    id: 'p0000001-0000-0000-0000-000000000007',
    seller_id: 's0000001-0000-0000-0000-000000000002',
    category_id: 'c0000002-0000-0000-0000-000000000002',
    category_slug: 'smartphones-wearables',
    category_name: 'Smartphones & Wearables',
    seller_name: 'TrendVault Apparel',
    title: 'Pixel 9 Pro XL 512GB Porcelain',
    slug: 'pixel-9-pro-xl-512gb-porcelain',
    brand: 'Pixel',
    description: 'Google Tensor G4, 6.8-inch Super Actua display, 50MP main camera with advanced AI photography, 5060mAh battery, 7 years of OS updates.',
    specifications: { display: '6.8 inch Super Actua', chip: 'Google Tensor G4', storage: '512GB', camera: '50MP', battery_mah: 5060 },
    is_active: true,
    is_approved: true,
    rating_avg: 4.7,
    rating_count: 1890,
    deleted_at: null,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    variants: [
      {
        id: 'v0000001-0000-0000-0000-000000000010',
        sku: 'PXL9PXL-POR-512',
        variant_name: 'Porcelain / 512GB',
        price: 106999.00,
        compare_at_price: 119999.00,
        stock_quantity: 35,
        attributes: { color: 'Porcelain', storage: '512GB' },
        is_active: true
      }
    ],
    images: [
      {
        id: 'i0000001-0000-0000-0000-000000000008',
        image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff38?w=800&q=80',
        alt_text: 'Pixel 9 Pro XL Porcelain',
        is_primary: true,
        display_order: 1
      }
    ]
  },
  {
    id: 'p0000001-0000-0000-0000-000000000008',
    seller_id: 's0000001-0000-0000-0000-000000000001',
    category_id: 'c0000002-0000-0000-0000-000000000002',
    category_slug: 'smartphones-wearables',
    category_name: 'Smartphones & Wearables',
    seller_name: 'ElectroPrime India',
    title: 'OnePlus 12 5G 256GB Flowy Emerald',
    slug: 'oneplus-12-5g-256gb-flowy-emerald',
    brand: 'OnePlus',
    description: 'Snapdragon 8 Gen 3, 6.82-inch AMOLED LTPO 4.0, Hasselblad triple camera, 100W SUPERVOOC charging, 5400mAh battery.',
    specifications: { display: '6.82 inch AMOLED LTPO', chip: 'Snapdragon 8 Gen 3', storage: '256GB', camera: '50MP Hasselblad', battery_mah: 5400 },
    is_active: true,
    is_approved: true,
    rating_avg: 4.6,
    rating_count: 1420,
    deleted_at: null,
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    variants: [
      {
        id: 'v0000001-0000-0000-0000-000000000011',
        sku: 'OP12-EMR-256',
        variant_name: 'Flowy Emerald / 256GB',
        price: 64999.00,
        compare_at_price: 74999.00,
        stock_quantity: 50,
        attributes: { color: 'Flowy Emerald', storage: '256GB' },
        is_active: true
      }
    ],
    images: [
      {
        id: 'i0000001-0000-0000-0000-000000000009',
        image_url: 'https://images.unsplash.com/photo-1675263362653-8c7c0c394068?w=800&q=80',
        alt_text: 'OnePlus 12 Flowy Emerald',
        is_primary: true,
        display_order: 1
      }
    ]
  }
]

export const productController = {
  /**
   * GET /api/products
   * Public: List products with faceted filters, search, sorting, and pagination.
   * Enforces Rule 11 (Mandatory Pagination)
   */
  getProducts: async (req, res) => {
    const query = productQuerySchema.parse(req.query)
    const { page, limit, q, category, min_price, max_price, sort_by } = query

    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      let filtered = mockProducts.filter((p) => p.is_active && p.is_approved && !p.deleted_at)

      // Search keyword
      if (q) {
        const needle = q.toLowerCase()
        filtered = filtered.filter(
          (p) =>
            p.title.toLowerCase().includes(needle) ||
            p.brand?.toLowerCase().includes(needle) ||
            p.description.toLowerCase().includes(needle)
        )
      }

      // Category filter
      if (category) {
        filtered = filtered.filter((p) => p.category_slug === category)
      }

      // Price filter (based on minimum variant price)
      if (min_price !== undefined) {
        filtered = filtered.filter((p) => Math.min(...p.variants.map((v) => v.price)) >= min_price)
      }
      if (max_price !== undefined) {
        filtered = filtered.filter((p) => Math.min(...p.variants.map((v) => v.price)) <= max_price)
      }

      // Sorting
      if (sort_by === 'price_asc') {
        filtered.sort((a, b) => Math.min(...a.variants.map((v) => v.price)) - Math.min(...b.variants.map((v) => v.price)))
      } else if (sort_by === 'price_desc') {
        filtered.sort((a, b) => Math.min(...b.variants.map((v) => v.price)) - Math.min(...a.variants.map((v) => v.price)))
      } else if (sort_by === 'rating') {
        filtered.sort((a, b) => b.rating_avg - a.rating_avg)
      } else if (sort_by === 'newest') {
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      }

      const total = filtered.length
      const startIndex = (page - 1) * limit
      const paginated = filtered.slice(startIndex, startIndex + limit)

      // Map to card overview
      const cardList = paginated.map((p) => {
        const primaryImage = p.images.find((img) => img.is_primary) || p.images[0]
        const prices = p.variants.map((v) => v.price)
        const minPrice = Math.min(...prices)
        const maxPrice = Math.max(...prices)
        const comparePrices = p.variants.map((v) => v.compare_at_price).filter(Boolean)
        const maxCompare = comparePrices.length ? Math.max(...comparePrices) : null
        const totalStock = p.variants.reduce((sum, v) => sum + v.stock_quantity, 0)

        return {
          id: p.id,
          title: p.title,
          slug: p.slug,
          brand: p.brand,
          category_slug: p.category_slug,
          category_name: p.category_name,
          seller_name: p.seller_name,
          rating_avg: p.rating_avg,
          rating_count: p.rating_count,
          min_price: minPrice,
          max_price: maxPrice,
          compare_at_price: maxCompare,
          discount_percentage: maxCompare && maxCompare > minPrice ? Math.round(((maxCompare - minPrice) / maxCompare) * 100) : 0,
          total_stock: totalStock,
          is_in_stock: totalStock > 0,
          primary_image: primaryImage ? primaryImage.image_url : null,
          alt_text: primaryImage ? primaryImage.alt_text : p.title
        }
      })

      return ApiResponse.paginated(res, {
        data: cardList,
        total,
        page,
        limit,
        message: 'Products retrieved successfully'
      })
    }

    // Database querying logic using Supabase
    let queryBuilder = supabaseAdmin
      .from('products')
      .select(`
        id, title, slug, brand, rating_avg, rating_count, created_at,
        categories (slug, name),
        sellers (store_name),
        product_variants (id, price, compare_at_price, stock_quantity),
        product_images (image_url, alt_text, is_primary)
      `, { count: 'exact' })
      .eq('is_active', true)
      .eq('is_approved', true)
      .is('deleted_at', null)

    if (q) {
      queryBuilder = queryBuilder.ilike('title', `%${q}%`)
    }

    const { data, count, error } = await queryBuilder.range((page - 1) * limit, page * limit - 1)
    if (error) throw error

    return ApiResponse.paginated(res, {
      data: data || [],
      total: count || 0,
      page,
      limit,
      message: 'Products retrieved successfully'
    })
  },

  /**
   * GET /api/products/:slug
   * Public: Single product details with all variants and images
   */
  getProductBySlug: async (req, res) => {
    const { slug } = req.params

    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const product = mockProducts.find((p) => p.slug === slug && p.is_active && !p.deleted_at)
      if (!product) {
        throw new NotFoundError(`Product '${slug}' not found`)
      }
      return ApiResponse.success(res, {
        message: 'Product retrieved successfully',
        data: { product }
      })
    }

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select(`
        id, seller_id, category_id, title, slug, brand, description, specifications,
        rating_avg, rating_count, is_active, is_approved, created_at,
        categories (id, name, slug),
        sellers (id, store_name, store_slug),
        product_variants (*),
        product_images (*)
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .eq('is_approved', true)
      .is('deleted_at', null)
      .single()

    if (error || !product) {
      throw new NotFoundError(`Product '${slug}' not found`)
    }

    return ApiResponse.success(res, {
      message: 'Product retrieved successfully',
      data: { product }
    })
  },

  /**
   * POST /api/products
   * Seller/Admin only: Create new product with variants and images
   */
  createProduct: async (req, res) => {
    const validatedData = createProductSchema.parse(req.body)
    const sellerId = req.seller ? req.seller.id : req.body.seller_id

    if (!sellerId) {
      throw new ForbiddenError('A valid seller profile is required to list products')
    }

    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const exists = mockProducts.some((p) => p.slug === validatedData.slug)
      if (exists) {
        throw new ConflictError(`Product with slug '${validatedData.slug}' already exists`)
      }

      const productId = `p0000001-${Date.now()}`
      const newProduct = {
        id: productId,
        seller_id: sellerId,
        seller_name: req.seller?.store_name || 'Verified Seller',
        category_id: validatedData.category_id,
        category_slug: 'electronics',
        category_name: 'Catalog',
        title: validatedData.title,
        slug: validatedData.slug,
        brand: validatedData.brand || null,
        description: validatedData.description,
        specifications: validatedData.specifications,
        is_active: true,
        is_approved: req.user.role === 'admin', // auto-approved if created by admin
        rating_avg: 0.0,
        rating_count: 0,
        deleted_at: null,
        created_at: new Date().toISOString(),
        variants: validatedData.variants.map((v, i) => ({
          id: `v0000001-${Date.now()}-${i}`,
          product_id: productId,
          ...v
        })),
        images: validatedData.images.map((img, i) => ({
          id: `i0000001-${Date.now()}-${i}`,
          product_id: productId,
          ...img
        }))
      }

      mockProducts.unshift(newProduct)

      return ApiResponse.success(res, {
        statusCode: 201,
        message: 'Product created successfully',
        data: { product: newProduct }
      })
    }

    // Insert parent product
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .insert({
        seller_id: sellerId,
        category_id: validatedData.category_id,
        title: validatedData.title,
        slug: validatedData.slug,
        brand: validatedData.brand,
        description: validatedData.description,
        specifications: validatedData.specifications,
        is_approved: req.user.role === 'admin'
      })
      .select()
      .single()

    if (productError) throw productError

    // Insert variants
    const variantRows = validatedData.variants.map((v) => ({
      product_id: product.id,
      ...v
    }))
    const { data: variants, error: variantError } = await supabaseAdmin
      .from('product_variants')
      .insert(variantRows)
      .select()

    if (variantError) throw variantError

    // Insert images
    const imageRows = validatedData.images.map((img) => ({
      product_id: product.id,
      ...img
    }))
    const { data: images, error: imageError } = await supabaseAdmin
      .from('product_images')
      .insert(imageRows)
      .select()

    if (imageError) throw imageError

    return ApiResponse.success(res, {
      statusCode: 201,
      message: 'Product created successfully',
      data: {
        product: {
          ...product,
          variants,
          images
        }
      }
    })
  },

  /**
   * PUT /api/products/:id
   * Seller/Admin: Update product details
   * Enforces Rule 5 (Multi-tenant Seller Isolation - No IDOR)
   */
  updateProduct: async (req, res) => {
    const { id } = req.params
    const validatedData = updateProductSchema.parse(req.body)

    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const idx = mockProducts.findIndex((p) => p.id === id)
      if (idx === -1) throw new NotFoundError('Product not found')

      // IDOR Check
      if (req.user.role !== 'admin' && mockProducts[idx].seller_id !== req.seller?.id) {
        throw new ForbiddenError('Access denied: You cannot edit products from another seller')
      }

      mockProducts[idx] = { ...mockProducts[idx], ...validatedData, updated_at: new Date().toISOString() }
      return ApiResponse.success(res, {
        message: 'Product updated successfully',
        data: { product: mockProducts[idx] }
      })
    }

    // Database IDOR check & update
    const { data: existingProduct } = await supabaseAdmin
      .from('products')
      .select('seller_id')
      .eq('id', id)
      .single()

    if (!existingProduct) throw new NotFoundError('Product not found')

    if (req.user.role !== 'admin' && existingProduct.seller_id !== req.seller?.id) {
      throw new ForbiddenError('Access denied: You cannot edit products from another seller')
    }

    const { data: updated, error } = await supabaseAdmin
      .from('products')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return ApiResponse.success(res, {
      message: 'Product updated successfully',
      data: { product: updated }
    })
  },

  /**
   * DELETE /api/products/:id
   * Seller/Admin: Soft delete product
   * Enforces Rule 7 (Soft Delete on Catalog Items) & Rule 5 (IDOR Prevention)
   */
  deleteProduct: async (req, res) => {
    const { id } = req.params

    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const idx = mockProducts.findIndex((p) => p.id === id)
      if (idx === -1) throw new NotFoundError('Product not found')

      // IDOR check
      if (req.user.role !== 'admin' && mockProducts[idx].seller_id !== req.seller?.id) {
        throw new ForbiddenError('Access denied: You cannot delete products from another seller')
      }

      // Soft delete: set deleted_at and is_active = false
      mockProducts[idx].deleted_at = new Date().toISOString()
      mockProducts[idx].is_active = false

      return ApiResponse.success(res, {
        message: 'Product soft-deleted successfully (catalog history preserved)'
      })
    }

    // Check ownership
    const { data: existing } = await supabaseAdmin
      .from('products')
      .select('seller_id')
      .eq('id', id)
      .single()

    if (!existing) throw new NotFoundError('Product not found')

    if (req.user.role !== 'admin' && existing.seller_id !== req.seller?.id) {
      throw new ForbiddenError('Access denied: You cannot delete products from another seller')
    }

    const { error } = await supabaseAdmin
      .from('products')
      .update({ is_active: false, deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    return ApiResponse.success(res, {
      message: 'Product soft-deleted successfully (catalog history preserved)'
    })
  },

  /**
   * GET /api/products/seller/mine
   * Seller only: Get all products belonging to the current seller
   */
  getSellerProducts: async (req, res) => {
    const sellerId = req.seller?.id
    if (!sellerId) {
      throw new ForbiddenError('Seller account required')
    }

    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const sellerItems = mockProducts.filter((p) => p.seller_id === sellerId && !p.deleted_at)
      return ApiResponse.success(res, {
        message: 'Seller products retrieved successfully',
        data: { products: sellerItems }
      })
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        product_variants (*),
        product_images (*)
      `)
      .eq('seller_id', sellerId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error

    return ApiResponse.success(res, {
      message: 'Seller products retrieved successfully',
      data: { products: data || [] }
    })
  }
}
