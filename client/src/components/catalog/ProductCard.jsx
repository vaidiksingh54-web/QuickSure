import React, { useState } from 'react';
import { Star, ShoppingBag, Heart, Eye, Check, Shield } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function ProductCard({
  product,
  viewMode = 'grid',
  onSelectProduct,
}) {
  const { addToCart, wishlist, toggleWishlist } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const isWishlisted = wishlist.includes(product.id);
  const isOutOfStock = product.total_stock <= 0 || !product.is_in_stock;

  const handleQuickAdd = async (e) => {
    e.stopPropagation();
    if (isOutOfStock || adding) return;

    try {
      setAdding(true);
      // If product has a primary variant id, use it, or fallback to known ID pattern
      const variantId = product.primary_variant_id || product.variants?.[0]?.id || `v0000001-0000-0000-0000-${product.id.slice(-12)}`;
      await addToCart(variantId, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error('Failed to add product to cart:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  if (viewMode === 'list') {
    return (
      <div 
        onClick={() => onSelectProduct(product.slug)}
        className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row gap-4 items-center group"
      >
        <div className="relative w-full sm:w-48 h-48 rounded-lg overflow-hidden bg-gray-50 shrink-0">
          <img
            src={product.primary_image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'}
            alt={product.alt_text || product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {product.discount_percentage > 0 && (
            <span className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              {product.discount_percentage}% OFF
            </span>
          )}
        </div>

        <div className="flex-1 w-full flex flex-col justify-between py-1">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                {product.category_name || product.brand || 'Category'}
              </span>
              <button
                onClick={handleWishlist}
                className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors"
                aria-label="Wishlist"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>

            <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mt-1">
              {product.title}
            </h3>

            <div className="flex items-center space-x-2 mt-1.5">
              <div className="flex items-center bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                <span>{product.rating_avg ? product.rating_avg.toFixed(1) : '4.5'}</span>
              </div>
              <span className="text-xs text-gray-400">({product.rating_count || 120} reviews)</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">Sold by {product.seller_name || 'Verified Vendor'}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-extrabold text-gray-900">
                ₹{Number(product.min_price || product.price || 0).toLocaleString('en-IN')}
              </span>
              {product.compare_at_price && (
                <span className="text-xs text-gray-400 line-through">
                  ₹{Number(product.compare_at_price).toLocaleString('en-IN')}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectProduct(product.slug);
                }}
                className="inline-flex items-center space-x-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Details</span>
              </button>

              <button
                disabled={isOutOfStock || adding}
                onClick={handleQuickAdd}
                className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isOutOfStock
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : added
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Added</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      onClick={() => onSelectProduct(product.slug)}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between group"
    >
      <div>
        {/* Product Image */}
        <div className="relative aspect-square w-full bg-gray-50 overflow-hidden">
          <img
            src={product.primary_image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'}
            alt={product.alt_text || product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
            {product.discount_percentage > 0 && (
              <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                {product.discount_percentage}% OFF
              </span>
            )}
            {product.total_stock <= 5 && product.total_stock > 0 && (
              <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                Only {product.total_stock} left
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            aria-label="Wishlist"
            className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/80 backdrop-blur-xs hover:bg-white text-gray-500 hover:text-rose-500 transition-colors shadow-xs"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <span className="font-semibold text-indigo-600 uppercase tracking-wider truncate">
              {product.brand || product.category_name || 'QuickSure'}
            </span>
            <div className="flex items-center text-amber-600 font-bold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
              <span>{product.rating_avg ? product.rating_avg.toFixed(1) : '4.5'}</span>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 min-h-[40px]">
            {product.title}
          </h3>

          <div className="text-[11px] text-gray-400 truncate">
            Sold by {product.seller_name || 'Verified Vendor'}
          </div>
        </div>
      </div>

      {/* Footer / Pricing & Action */}
      <div className="p-4 pt-0 border-t border-gray-50 flex items-center justify-between mt-2">
        <div>
          <div className="text-base font-extrabold text-gray-900">
            ₹{Number(product.min_price || product.price || 0).toLocaleString('en-IN')}
          </div>
          {product.compare_at_price && (
            <div className="text-[11px] text-gray-400 line-through">
              ₹{Number(product.compare_at_price).toLocaleString('en-IN')}
            </div>
          )}
        </div>

        <button
          disabled={isOutOfStock || adding}
          onClick={handleQuickAdd}
          className={`inline-flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            isOutOfStock
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : added
              ? 'bg-emerald-600 text-white'
              : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
          }`}
        >
          {added ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Added</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{isOutOfStock ? 'Sold Out' : 'Add'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
