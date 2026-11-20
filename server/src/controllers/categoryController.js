import { ApiResponse } from '../utils/apiResponse.js';
import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { createCategorySchema, updateCategorySchema } from '../validators/categoryValidator.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

// In-memory mock categories for test/dev environments
let mockCategories = [
  {
    id: 'c0000001-0000-0000-0000-000000000001',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Smartphones, Audio, Computing and Smart Tech',
    icon_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80',
    parent_id: null,
    is_active: true,
    display_order: 1,
    subcategories: [
      {
        id: 'c0000002-0000-0000-0000-000000000001',
        name: 'Audio & Headphones',
        slug: 'audio-headphones',
        description: 'Noise cancelling headphones and earbuds',
        parent_id: 'c0000001-0000-0000-0000-000000000001',
        is_active: true,
        display_order: 1,
      },
      {
        id: 'c0000002-0000-0000-0000-000000000002',
        name: 'Smartphones & Wearables',
        slug: 'smartphones-wearables',
        description: 'Latest smartphones and smartwatches',
        parent_id: 'c0000001-0000-0000-0000-000000000001',
        is_active: true,
        display_order: 2,
      },
    ],
  },
  {
    id: 'c0000001-0000-0000-0000-000000000002',
    name: 'Fashion',
    slug: 'fashion',
    description: 'Clothing, Footwear, Accessories and Style',
    icon_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=100&q=80',
    parent_id: null,
    is_active: true,
    display_order: 2,
    subcategories: [
      {
        id: 'c0000002-0000-0000-0000-000000000003',
        name: 'Men Fashion',
        slug: 'men-fashion',
        description: 'Shirts, jeans and activewear for men',
        parent_id: 'c0000001-0000-0000-0000-000000000002',
        is_active: true,
        display_order: 1,
      },
    ],
  },
  {
    id: 'c0000001-0000-0000-0000-000000000003',
    name: 'Home & Living',
    slug: 'home-living',
    description: 'Furniture, Decor, Kitchen and Appliances',
    icon_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=100&q=80',
    parent_id: null,
    is_active: true,
    display_order: 3,
    subcategories: [
      {
        id: 'c0000002-0000-0000-0000-000000000004',
        name: 'Kitchen Appliances',
        slug: 'kitchen-appliances',
        description: 'Mixer grinders, air fryers and cookers',
        parent_id: 'c0000001-0000-0000-0000-000000000003',
        is_active: true,
        display_order: 1,
      },
    ],
  },
  {
    id: 'c0000001-0000-0000-0000-000000000004',
    name: 'Beauty & Personal Care',
    slug: 'beauty',
    description: 'Skincare, Fragrances and Grooming',
    icon_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=100&q=80',
    parent_id: null,
    is_active: true,
    display_order: 4,
    subcategories: [],
  },
  {
    id: 'c0000001-0000-0000-0000-000000000005',
    name: 'Sports & Fitness',
    slug: 'sports',
    description: 'Exercise gear, Nutrition and Outdoor equipment',
    icon_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=100&q=80',
    parent_id: null,
    is_active: true,
    display_order: 5,
    subcategories: [],
  },
];

export const categoryController = {
  /**
   * GET /api/categories
   * Public: List all active categories with subcategory hierarchy
   */
  getAllCategories: async (req, res) => {
    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      return ApiResponse.success(res, {
        message: 'Categories fetched successfully',
        data: { categories: mockCategories },
      });
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('id, name, slug, description, icon_url, parent_id, is_active, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    // Build hierarchy (root categories with nested subcategories)
    const roots = (data || []).filter((c) => !c.parent_id);
    const tree = roots.map((root) => ({
      ...root,
      subcategories: (data || []).filter((sub) => sub.parent_id === root.id),
    }));

    return ApiResponse.success(res, {
      message: 'Categories fetched successfully',
      data: { categories: tree },
    });
  },

  /**
   * GET /api/categories/:slug
   * Public: Single category by slug with child categories
   */
  getCategoryBySlug: async (req, res) => {
    const { slug } = req.params;

    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const found = mockCategories.find((c) => c.slug === slug);
      if (!found) {
        throw new NotFoundError(`Category with slug '${slug}' not found`);
      }
      return ApiResponse.success(res, {
        message: 'Category retrieved successfully',
        data: { category: found },
      });
    }

    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .select('id, name, slug, description, icon_url, parent_id, is_active')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !category) {
      throw new NotFoundError(`Category with slug '${slug}' not found`);
    }

    // Fetch subcategories
    const { data: subcategories } = await supabaseAdmin
      .from('categories')
      .select('id, name, slug, description, icon_url, display_order')
      .eq('parent_id', category.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    return ApiResponse.success(res, {
      message: 'Category retrieved successfully',
      data: {
        category: {
          ...category,
          subcategories: subcategories || [],
        },
      },
    });
  },

  /**
   * POST /api/categories
   * Admin only: Create new category
   */
  createCategory: async (req, res) => {
    const validatedData = createCategorySchema.parse(req.body);

    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const exists = mockCategories.some((c) => c.slug === validatedData.slug);
      if (exists) {
        throw new ConflictError(`Category with slug '${validatedData.slug}' already exists`);
      }
      const newCategory = {
        id: `c0000003-${Date.now()}`,
        ...validatedData,
        subcategories: [],
      };
      mockCategories.push(newCategory);
      return ApiResponse.success(res, {
        statusCode: 201,
        message: 'Category created successfully',
        data: { category: newCategory },
      });
    }

    const { data: newCategory, error } = await supabaseAdmin
      .from('categories')
      .insert(validatedData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictError(`Category with slug '${validatedData.slug}' already exists`);
      }
      throw error;
    }

    return ApiResponse.success(res, {
      statusCode: 201,
      message: 'Category created successfully',
      data: { category: newCategory },
    });
  },

  /**
   * PUT /api/categories/:id
   * Admin only: Update category
   */
  updateCategory: async (req, res) => {
    const { id } = req.params;
    const validatedData = updateCategorySchema.parse(req.body);

    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const idx = mockCategories.findIndex((c) => c.id === id);
      if (idx === -1) throw new NotFoundError('Category not found');
      mockCategories[idx] = { ...mockCategories[idx], ...validatedData };
      return ApiResponse.success(res, {
        message: 'Category updated successfully',
        data: { category: mockCategories[idx] },
      });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('categories')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single();

    if (error || !updated) {
      throw new NotFoundError('Category not found or update failed');
    }

    return ApiResponse.success(res, {
      message: 'Category updated successfully',
      data: { category: updated },
    });
  },

  /**
   * DELETE /api/categories/:id
   * Admin only: Deactivate category
   */
  deleteCategory: async (req, res) => {
    const { id } = req.params;

    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      mockCategories = mockCategories.filter((c) => c.id !== id);
      return ApiResponse.success(res, {
        message: 'Category deactivated successfully',
      });
    }

    const { error } = await supabaseAdmin
      .from('categories')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    return ApiResponse.success(res, {
      message: 'Category deactivated successfully',
    });
  },
};
