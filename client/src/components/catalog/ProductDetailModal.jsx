import React, { useState, useEffect } from 'react';
import { 
  X, 
  Star, 
  ShoppingBag, 
  Check, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  Zap, 
  Store, 
  Layers, 
  Plus, 
  Minus,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';

export default function ProductDetailModal({ slug, onClose, onOpenCart }) {
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchDetail() {
      if (!slug) return;
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/products/detail/${slug}`);
        if (!isMounted) return;

        const prod = res.data?.product;
        if (prod) {
          setProduct(prod);
          // Default to first variant
          if (prod.variants && prod.variants.length > 0) {
            setSelectedVariant(prod.variants[0]);
          }
          // Default to primary or first image
          const primary = prod.images?.find((img) => img.is_primary) || prod.images?.[0];
          setSelectedImage(primary?.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80');
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || 'Failed to load product details');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Adjust quantity if exceeds variant stock
  useEffect(() => {
    if (selectedVariant && quantity > selectedVariant.stock_quantity && selectedVariant.stock_quantity > 0) {
      setQuantity(selectedVariant.stock_quantity);
    }
  }, [selectedVariant]);

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
    setQuantity(1);
  };

  const handleAddToCart = async () => {
    if (!selectedVariant || selectedVariant.stock_quantity <= 0 || addingToCart) return;

    try {
      setAddingToCart(true);
      await addToCart(selectedVariant.id, quantity);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!selectedVariant || selectedVariant.stock_quantity <= 0 || addingToCart) return;
    try {
      setAddingToCart(true);
      await addToCart(selectedVariant.id, quantity);
      onClose();
      if (onOpenCart) onOpenCart();
    } catch (err) {
      console.error('Failed buy now:', err);
    } finally {
      setAddingToCart(false);
    }
  };

  if (!slug) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div 
        className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close Modal"
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/90 hover:bg-gray-100 text-gray-500 hover:text-gray-900 shadow-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 font-medium">Loading product information...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="text-lg font-bold text-gray-900">Failed to load product</h3>
            <p className="text-sm text-gray-500">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold"
            >
              Close Window
            </button>
          </div>
        ) : product ? (
          <div className="overflow-y-auto p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-inner">
                <img
                  src={selectedImage}
                  alt={product.title}
                  className="w-full h-full object-cover transition-all duration-300"
                />
                {selectedVariant && selectedVariant.compare_at_price > selectedVariant.price && (
                  <span className="absolute top-3 left-3 bg-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                    {Math.round(((selectedVariant.compare_at_price - selectedVariant.price) / selectedVariant.compare_at_price) * 100)}% OFF
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto pb-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={img.id || idx}
                      onClick={() => setSelectedImage(img.image_url)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                        selectedImage === img.image_url ? 'border-indigo-600 shadow-xs' : 'border-gray-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.image_url} alt={img.alt_text || `Thumbnail ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust assurances */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center space-x-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% Genuine Guaranteed</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <RotateCcw className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>7 Days Returnable</span>
                </div>
              </div>
            </div>

            {/* Right: Details & Variant Selection */}
            <div className="flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {/* Brand & Store */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {product.brand || 'QuickSure Select'}
                  </span>
                  <div className="flex items-center text-gray-500">
                    <Store className="w-3.5 h-3.5 mr-1 text-gray-400" />
                    <span>Sold by {product.seller_name || product.sellers?.store_name || 'Verified Partner'}</span>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
                  {product.title}
                </h2>

                {/* Ratings */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                    <span>{product.rating_avg ? product.rating_avg.toFixed(1) : '4.8'}</span>
                  </div>
                  <span className="text-xs text-gray-500">({product.rating_count || 1420} verified customer reviews)</span>
                </div>

                {/* Pricing & Stock Status */}
                <div className="border-y border-gray-100 py-3 flex items-center justify-between">
                  <div className="flex items-baseline space-x-3">
                    <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                      ₹{Number(selectedVariant?.price || product.min_price || 0).toLocaleString('en-IN')}
                    </span>
                    {selectedVariant?.compare_at_price && (
                      <span className="text-sm text-gray-400 line-through">
                        ₹{Number(selectedVariant.compare_at_price).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  {/* Dynamic Stock Indicator */}
                  {selectedVariant ? (
                    selectedVariant.stock_quantity <= 0 ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">
                        Out of Stock
                      </span>
                    ) : selectedVariant.stock_quantity <= 5 ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 animate-pulse">
                        ⚡ Only {selectedVariant.stock_quantity} Left!
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                        ✓ In Stock ({selectedVariant.stock_quantity} available)
                      </span>
                    )
                  ) : null}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed">
                  {product.description}
                </p>

                {/* Variants Selection */}
                {product.variants && product.variants.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                      <span>Select Variant / Color:</span>
                      <span className="text-indigo-600">{selectedVariant?.variant_name}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((v) => {
                        const isSelected = selectedVariant?.id === v.id;
                        const isSoldOut = v.stock_quantity <= 0;

                        return (
                          <button
                            key={v.id}
                            disabled={isSoldOut}
                            onClick={() => handleVariantSelect(v)}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1.5 ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                                : isSoldOut
                                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed line-through'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                            }`}
                          >
                            <span>{v.variant_name}</span>
                            <span className="text-[10px] text-gray-400">({v.sku})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity Stepper */}
                <div className="flex items-center space-x-4 pt-1">
                  <span className="text-xs font-bold text-gray-700">Quantity:</span>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || !selectedVariant || selectedVariant.stock_quantity <= 0}
                      className="p-2 hover:bg-gray-200 text-gray-600 disabled:opacity-40 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-4 text-xs font-bold text-gray-900 select-none">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(selectedVariant?.stock_quantity || 1, q + 1))}
                      disabled={!selectedVariant || quantity >= selectedVariant.stock_quantity}
                      className="p-2 hover:bg-gray-200 text-gray-600 disabled:opacity-40 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    disabled={!selectedVariant || selectedVariant.stock_quantity <= 0 || addingToCart}
                    onClick={handleAddToCart}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-md active:scale-98 ${
                      !selectedVariant || selectedVariant.stock_quantity <= 0
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : addedSuccess
                        ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25'
                    }`}
                  >
                    {addedSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add {quantity} to Cart</span>
                      </>
                    )}
                  </button>

                  <button
                    disabled={!selectedVariant || selectedVariant.stock_quantity <= 0 || addingToCart}
                    onClick={handleBuyNow}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-md active:scale-98 ${
                      !selectedVariant || selectedVariant.stock_quantity <= 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>Instant Checkout</span>
                  </button>
                </div>

                {/* Specifications Collapsible / Table */}
                {product.specifications && Object.keys(product.specifications).length > 0 && (
                  <div className="border border-gray-100 bg-gray-50/50 rounded-xl p-3 text-xs">
                    <div className="font-bold text-gray-700 mb-2 flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Technical Specifications</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-600">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between border-b border-gray-100 py-0.5">
                          <span className="capitalize text-gray-500">{key.replace(/_/g, ' ')}:</span>
                          <span className="font-semibold text-gray-900">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
