import React, { useState } from 'react';
import { 
  X, 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  Tag, 
  ShieldCheck, 
  Truck, 
  ArrowRight,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function CartDrawer() {
  const { 
    items, 
    loading, 
    quote, 
    couponCode, 
    couponError, 
    isCartOpen, 
    setIsCartOpen,
    updateQuantity, 
    removeFromCart, 
    clearCart,
    applyCoupon, 
    removeCoupon,
    totalItemCount 
  } = useCart();
  const { isAuthenticated } = useAuth();
  const [inputCoupon, setInputCoupon] = useState('');
  const [actionError, setActionError] = useState(null);

  if (!isCartOpen) return null;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    try {
      setActionError(null);
      await applyCoupon(inputCoupon);
      setInputCoupon('');
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleUpdateQty = async (itemId, currentQty, delta) => {
    try {
      setActionError(null);
      await updateQuantity(itemId, currentQty + delta);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleRemove = async (itemId) => {
    try {
      setActionError(null);
      await removeFromCart(itemId);
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Free shipping threshold calculations (₹500 threshold)
  const currentSubtotal = quote?.subtotal || items.reduce((sum, i) => sum + (i.unit_price || 0) * i.quantity, 0);
  const freeShippingThreshold = 500;
  const amountNeeded = Math.max(0, freeShippingThreshold - currentSubtotal);
  const progressPercent = Math.min(100, (currentSubtotal / freeShippingThreshold) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform ease-out duration-300">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Your Shopping Cart</h2>
                <p className="text-xs text-slate-500">
                  {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} • Authoritative Server Pricing
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                  title="Clear Cart"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Free Shipping Progress Ribbon */}
          <div className="bg-blue-50/70 border-b border-blue-100 p-3 text-xs text-blue-900">
            <div className="flex items-center justify-between mb-1.5 font-medium">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                {amountNeeded <= 0 ? (
                  <span className="text-emerald-700 font-bold">🎉 Free Express Delivery unlocked!</span>
                ) : (
                  <span>Add <strong className="text-blue-700">₹{amountNeeded.toFixed(2)}</strong> more for FREE Shipping</span>
                )}
              </span>
              <span className="text-[11px] font-bold text-blue-700">{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full bg-blue-200/60 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${amountNeeded <= 0 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Errors alert if any */}
          {(actionError || couponError) && (
            <div className="m-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{actionError || couponError}</p>
              </div>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 divide-y divide-slate-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-300">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Your cart is empty</h3>
                <p className="text-xs text-slate-500 max-w-xs mb-6">
                  Explore thousands of genuine products with express delivery and guaranteed authenticity.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Explore Catalog
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="pt-3 first:pt-0 flex gap-3.5">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
                    <ShoppingBag className="w-6 h-6 text-slate-300" />
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 leading-tight truncate">
                        {item.variant_name || 'Product Variant'}
                      </h4>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      SKU: {item.sku || 'SKU-N/A'}
                    </div>

                    <div className="flex items-center justify-between mt-2.5">
                      <div className="text-xs font-black text-slate-900">
                        ₹{Number(item.unit_price || 0).toFixed(2)}
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                        <button
                          onClick={() => handleUpdateQty(item.id, item.quantity, -1)}
                          className="px-2 py-1 text-slate-500 hover:bg-white hover:text-slate-800 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-800 min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQty(item.id, item.quantity, 1)}
                          disabled={item.quantity >= 10}
                          className="px-2 py-1 text-slate-500 hover:bg-white hover:text-slate-800 transition-colors disabled:opacity-30"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer / Checkout Summary */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/90 space-y-4">
              
              {/* Coupon Code Section */}
              <div className="space-y-1.5">
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Enter Promo Code"
                      value={inputCoupon}
                      onChange={(e) => setInputCoupon(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Apply
                  </button>
                </form>

                {/* Applied Coupon Tag */}
                {quote?.coupon_applied && (
                  <div className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      {quote.coupon_applied.code} applied (-₹{quote.discount_amount?.toFixed(2)})
                    </span>
                    <button
                      onClick={removeCoupon}
                      className="text-emerald-700 hover:text-emerald-900 text-[10px] font-bold uppercase underline"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Quick Hint Chip */}
                {!quote?.coupon_applied && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span>Try code:</span>
                    <button
                      type="button"
                      onClick={() => applyCoupon('QUICK10')}
                      className="font-mono font-bold text-blue-600 hover:underline bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200"
                    >
                      QUICK10
                    </button>
                    <span>(10% off)</span>
                  </div>
                )}
              </div>

              {/* Authoritative Price Breakdown (Rule 1) */}
              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">
                    ₹{Number(quote?.subtotal || currentSubtotal).toFixed(2)}
                  </span>
                </div>

                {quote?.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Coupon Discount</span>
                    <span>-₹{Number(quote.discount_amount).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    Estimated GST (5%)
                    <span className="text-[10px] text-slate-400" title="Calculated authoritatively by server">ℹ️</span>
                  </span>
                  <span className="font-semibold text-slate-800">
                    ₹{Number(quote?.tax_amount || 0).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span className="font-semibold text-slate-800">
                    {quote?.shipping_fee === 0 ? (
                      <span className="text-emerald-600 font-bold">FREE</span>
                    ) : (
                      `₹${Number(quote?.shipping_fee || 50).toFixed(2)}`
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span className="text-blue-600 text-base">
                    ₹{Number(quote?.total_amount || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Zero-Trust Security Stamp */}
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-white/70 p-2 rounded-lg border border-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Rule 1 Verified:</strong> Prices & taxes calculated by QuickSure Server Gateway. Client cannot tamper with prices.
                </span>
              </div>

              {/* Checkout Action Button */}
              <button
                disabled={loading || items.length === 0}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>Proceed to Secure Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
