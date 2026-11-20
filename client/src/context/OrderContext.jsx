import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';

const OrderContext = createContext(null);

export function OrderProvider({ children }) {
  const { isAuthenticated, role } = useAuth();
  const { refreshCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sellerSubOrders, setSellerSubOrders] = useState([]);

  // Fetch customer orders
  const fetchMyOrders = useCallback(async (page = 1, limit = 10) => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/orders?page=${page}&limit=${limit}`);
      setOrders(res.data || []);
      return res;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch single order details with sub-orders
  const fetchOrderById = useCallback(async (orderId) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/orders/${orderId}`);
      setCurrentOrder(res.data);
      return res.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Checkout from active cart
  const checkout = async ({ payment_method = 'card_sim', shipping_address, coupon_code = null }) => {
    try {
      setLoading(true);
      setError(null);
      const idempotencyKey = `idem-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
      const res = await api.post('/orders/checkout', {
        payment_method,
        shipping_address,
        coupon_code,
        idempotency_key: idempotencyKey,
      });

      setCurrentOrder(res.data);
      await refreshCart();
      await fetchMyOrders();
      return res.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Seller: fetch fulfillment sub-orders
  const fetchSellerSubOrders = useCallback(async (page = 1, limit = 10) => {
    if (!isAuthenticated || (role !== 'seller' && role !== 'admin')) return;
    try {
      setLoading(true);
      const res = await api.get(`/orders/seller/fulfillment?page=${page}&limit=${limit}`);
      setSellerSubOrders(res.data || []);
      return res;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, role]);

  // Update sub-order status (seller/admin)
  const updateSubOrderStatus = async (subOrderId, status, { courier_name, tracking_number, notes } = {}) => {
    try {
      setLoading(true);
      const res = await api.put(`/orders/sub/${subOrderId}/status`, {
        status,
        courier_name,
        tracking_number,
        notes,
      });
      await fetchSellerSubOrders();
      return res.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        currentOrder,
        setCurrentOrder,
        loading,
        error,
        checkout,
        fetchMyOrders,
        fetchOrderById,
        sellerSubOrders,
        fetchSellerSubOrders,
        updateSubOrderStatus,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within an OrderProvider');
  return context;
}
