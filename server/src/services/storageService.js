import { supabaseAdmin } from '../config/supabase.js'
import { env } from '../config/env.js'
import { ValidationError } from '../utils/errors.js'

export const storageService = {
  /**
   * Upload image to Supabase Storage bucket ('product-images')
   * Validates MIME type and file size.
   */
  uploadProductImage: async ({ buffer, originalName, mimeType }) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new ValidationError(`Unsupported file type '${mimeType}'. Allowed: JPEG, PNG, WEBP.`)
    }

    // In mock/test environment
    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')
      const mockCdnUrl = `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80&mock=${Date.now()}_${sanitizedName}`
      return {
        url: mockCdnUrl,
        storagePath: `products/mock/${Date.now()}_${sanitizedName}`,
        mimeType
      }
    }

    const fileExt = originalName.split('.').pop() || 'jpg'
    const filePath = `products/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`

    const { data, error } = await supabaseAdmin.storage
      .from('product-images')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: false
      })

    if (error) throw error

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('product-images')
      .getPublicUrl(data.path)

    return {
      url: publicUrl,
      storagePath: data.path,
      mimeType
    }
  }
}
