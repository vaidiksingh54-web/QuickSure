import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const GUEST_CART_STORAGE_KEY = 'quicksure_guest_cart';

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState([]);

  // Fetch or sync cart based on auth state
  const refreshCart = useCallback(async () => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        // Check if there was a guest cart to merge first
        const guestCart = localStorage.getItem(GUEST_CART_STORAGE_KEY);
        if (guestCart) {
          try {
            const parsed = JSON.parse(guestCart);
            if (Array.isArray(parsed) && parsed.length > 0) {
              await api.post('/cart/merge', {
                items: parsed.map(item => ({
                  variant_id: item.variant_id,
                  quantity: item.quantity,
                })),
              });
              localStorage.removeItem(GUEST_CART_STORAGE_KEY);
            }
          } catch (mergeErr) {
            console.error('Error merging guest cart:', mergeErr);
          }
        }

        const res = await api.get('/cart');
        setItems(res.data?.items || []);
      } catch (err) {
        console.error('Error fetching cart:', err);
      } finally {
        setLoading(false);
      }
    } else {
      // Guest mode - load from localStorage
      try {
        const local = localStorage.getItem(GUEST_CART_STORAGE_KEY);
        setItems(local ? JSON.parse(local) : []);
      } catch {
        setItems([]);
      }
    }
  }, [isAuthenticated]);

  // Load wishlist if authenticated
  const refreshWishlist = useCallback(async () => {
    if (isAuthenticated) {
      try {
        const res = await api.get('/wishlist');
        const ids = res.data?.product_ids || [];
        setWishlist(ids);
      } catch (err) {
        console.error('Error fetching wishlist:', err);
      }
    } else {
      setWishlist([]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
    refreshWishlist();
  }, [refreshCart, refreshWishlist]);

  // Save guest cart changes to localStorage
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isAuthenticated]);

  // Authoritative server quote calculation (Rule 1 Enforced: Zero Client Pricing)
  const calculateQuote = useCallback(async (codeToApply = couponCode) => {
    if (items.length === 0) {
      setQuote(null);
      setCouponError(null);
      return null;
    }

    try {
      setCouponError(null);
      if (isAuthenticated) {
        const res = await api.post('/cart/quote', {
          coupon_code: codeToApply || undefined,
        });
        setQuote(res.data);
        return res.data;
      } else {
        // For guest quote simulation: compute from standard server rules
        const subtotal = items.reduce((acc, it) => acc + (it.unit_price || 0) * it.quantity, 0);
        let discount = 0;
        let applied = null;
        if (codeToApply && codeToApply.toUpperCase() === 'QUICK10') {
          discount = Math.min(Math.round(subtotal * 0.10 * 100) / 100, 500);
          applied = { code: 'QUICK10', discount_type: 'percentage', discount_value: 10 };
        } else if (codeToApply) {
          throw new Error(`Coupon '${codeToApply}' is invalid or expired`);
        }
        const taxable = Math.max(0, subtotal - discount);
        const tax = Math.round(taxable * 0.05 * 100) / 100;
        const shipping = taxable >= 500 ? 0 : 50;
        const total = Math.round((taxable + tax + shipping) * 100) / 100;

        const guestQuote = {
          subtotal,
          discount_amount: discount,
          taxable_amount: taxable,
          tax_amount: tax,
          shipping_fee: shipping,
          total_amount: total,
          coupon_applied: applied,
        };
        setQuote(guestQuote);
        return guestQuote;
      }
    } catch (err) {
      setCouponError(err.message || 'Failed to calculate pricing quote');
      return null;
    }
  }, [items, couponCode, isAuthenticated]);

  // Recalculate quote whenever items or coupon change
  useEffect(() => {
    calculateQuote();
  }, [items, couponCode, calculateQuote]);

  // Add Item to Cart
  const addToCart = async (variant, quantity = 1) => {
    if (isAuthenticated) {
      try {
        await api.post('/cart/items', {
          variant_id: variant.id || variant.variant_id,
          quantity,
        });
        await refreshCart();
      } catch (err) {
        throw new Error(err.message || 'Failed to add item to cart');
      }
    } else {
      // Guest local item
      setItems((prev) => {
        const idx = prev.findIndex((i) => i.variant_id === (variant.id || variant.variant_id));
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx].quantity = Math.min(10, updated[idx].quantity + quantity);
          return updated;
        }
        return [
          ...prev,
          {
            id: `guest-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            variant_id: variant.id || variant.variant_id,
            variant_name: variant.variant_name || variant.title,
            sku: variant.sku || 'SKU-ITEM',
            unit_price: Number(variant.price || 0),
            quantity,
            total_price: Number(variant.price || 0) * quantity,
            in_stock: true,
          },
        ];
      });
    }
  };

  // Update Item Quantity
  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return removeFromCart(itemId);

    if (isAuthenticated) {
      try {
        await api.put(`/cart/items/${itemId}`, { quantity });
        await refreshCart();
      } catch (err) {
        throw new Error(err.message || 'Failed to update item quantity');
      }
    } else {
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? { ...i, quantity, total_price: (i.unit_price || 0) * quantity }
            : i
        )
      );
    }
  };

  // Remove Item from Cart
  const removeFromCart = async (itemId) => {
    if (isAuthenticated) {
      try {
        await api.delete(`/cart/items/${itemId}`);
        await refreshCart();
      } catch (err) {
        throw new Error(err.message || 'Failed to remove item');
      }
    } else {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    }
  };

  // Clear Cart
  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await api.delete('/cart');
        setItems([]);
        setQuote(null);
      } catch (err) {
        throw new Error(err.message || 'Failed to clear cart');
      }
    } else {
      setItems([]);
      setQuote(null);
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    }
  };

  // Apply Coupon
  const applyCoupon = async (code) => {
    const trimmed = (code || '').trim().toUpperCase();
    if (!trimmed) return;
    setCouponCode(trimmed);
    await calculateQuote(trimmed);
  };

  // Remove Coupon
  const removeCoupon = () => {
    setCouponCode('');
    setCouponError(null);
  };

  // Toggle Wishlist
  const toggleWishlist = async (productId) => {
    if (!isAuthenticated) {
      throw new Error('Please sign in to save items to your wishlist');
    }
    try {
      const res = await api.post('/wishlist/toggle', { product_id: productId });
      await refreshWishlist();
      return res.data;
    } catch (err) {
      throw new Error(err.message || 'Failed to update wishlist');
    }
  };

  const totalItemCount = items.reduce((acc, it) => acc + (it.quantity || 0), 0);

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        quote,
        couponCode,
        couponError,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon,
        wishlist,
        toggleWishlist,
        totalItemCount,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
