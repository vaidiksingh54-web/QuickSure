import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';

// In-memory mock variants for test environment
let mockVariantStock = {
  'v0000001-0000-0000-0000-000000000001': { sku: 'SP-ANC-BLK', price: 2499.00, stock: 45, title: 'QuickSure SonicPro Wireless ANC Headphones (Black)' },
  'v0000001-0000-0000-0000-000000000002': { sku: 'SP-ANC-SLV', price: 2599.00, stock: 18, title: 'QuickSure SonicPro Wireless ANC Headphones (Silver)' },
  'v0000001-0000-0000-0000-000000000003': { sku: 'AW-S5-OBS', price: 1899.00, stock: 32, title: 'AeroWatch S5 Smartwatch' },
  'v0000001-0000-0000-0000-000000000004': { sku: 'OXF-BLU-M', price: 899.00, stock: 25, title: 'Cotton Oxford Shirt (M)' },
  'v0000001-0000-0000-0000-000000000005': { sku: 'OXF-BLU-L', price: 899.00, stock: 14, title: 'Cotton Oxford Shirt (L)' },
  'v0000001-0000-0000-0000-000000000006': { sku: 'TM-750-BLU', price: 1849.00, stock: 40, title: 'TurboMix 750W Mixer Grinder' },
  'v0000001-0000-0000-0000-000000000099': { sku: 'LIMITED-1', price: 999.00, stock: 1, title: 'Flash Item (Only 1 in stock)' },
};

export const inventoryService = {
  /**
   * Get variant stock and price details
   */
  getVariantDetails: async (variantId) => {
    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const v = mockVariantStock[variantId];
      if (!v) throw new NotFoundError(`Product variant '${variantId}' not found`);
      return {
        id: variantId,
        sku: v.sku,
        price: v.price,
        stock_quantity: v.stock,
        variant_name: v.title,
      };
    }

    const { data, error } = await supabaseAdmin
      .from('product_variants')
      .select('id, sku, price, compare_at_price, stock_quantity, variant_name, is_active')
      .eq('id', variantId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      throw new NotFoundError(`Product variant '${variantId}' not found`);
    }

    return data;
  },

  /**
   * ATOMIC CONCURRENCY RESERVATION (Rule 4 Enforcement)
   * Decrements stock conditionally: stock_quantity = stock_quantity - qty WHERE stock_quantity >= qty
   * If any item fails, rolls back previously reserved items and raises ConflictError (409)
   */
  reserveStockAtomically: async (items) => {
    // items: array of { variant_id, quantity }
    const reservedItems = [];

    for (const item of items) {
      const { variant_id, quantity } = item;

      if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
        const v = mockVariantStock[variant_id];
        if (!v) {
          await inventoryService.releaseStockAtomically(reservedItems);
          throw new NotFoundError(`Variant '${variant_id}' not found`);
        }

        // Atomic floor check
        if (v.stock < quantity) {
          // Rollback prior reservations
          await inventoryService.releaseStockAtomically(reservedItems);
          throw new ConflictError(
            `Insufficient stock for '${v.title}'. Requested: ${quantity}, Available: ${v.stock}`
          );
        }

        v.stock -= quantity;
        reservedItems.push({ variant_id, quantity });
      } else {
        // Atomic SQL execution via Supabase RPC / SQL update
        const { data, error } = await supabaseAdmin.rpc('reserve_variant_stock', {
          p_variant_id: variant_id,
          p_qty: quantity,
        });

        if (error || !data || data.success === false) {
          await inventoryService.releaseStockAtomically(reservedItems);
          throw new ConflictError(
            `Stock reservation failed for variant '${variant_id}'. The item may have sold out.`
          );
        }

        reservedItems.push({ variant_id, quantity });
      }
    }

    return reservedItems;
  },

  /**
   * Release reserved stock (rollback or cancellation)
   */
  releaseStockAtomically: async (items) => {
    for (const item of items) {
      const { variant_id, quantity } = item;

      if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
        if (mockVariantStock[variant_id]) {
          mockVariantStock[variant_id].stock += quantity;
        }
      } else {
        await supabaseAdmin.rpc('release_variant_stock', {
          p_variant_id: variant_id,
          p_qty: quantity,
        });
      }
    }
  },

  /**
   * Diagnostic helper to read raw stock in tests
   */
  _getRawStock: (variantId) => {
    return mockVariantStock[variantId]?.stock;
  },
};
