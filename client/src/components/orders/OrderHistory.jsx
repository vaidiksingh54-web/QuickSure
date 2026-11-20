import React, { useEffect, useState } from 'react';
import { 
  Package, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  Truck, 
  AlertCircle, 
  X,
  ExternalLink
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';

export default function OrderHistory({ isOpen, onClose, onOpenTracker }) {
  const { orders, fetchMyOrders, fetchOrderById, loading } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMyOrders();
    }
  }, [isOpen, fetchMyOrders]);

  if (!isOpen) return null;

  const handleSelectOrder = async (orderId) => {
    try {
      setLoadingDetail(true);
      const detail = await fetchOrderById(orderId);
      setSelectedOrder(detail);
    } catch {
      // handled in context
    } finally {
      setLoadingDetail(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'shipped':
      case 'partially_shipped':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'processing':
      case 'packed':
      case 'confirmed':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Your Order History</h2>
              <p className="text-xs text-slate-500">Track shipments, packages, and delivery statuses</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {selectedOrder ? (
            /* Order Detail View */
            <div className="space-y-4">
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                ← Back to all orders
              </button>

              <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {selectedOrder.order_number}
                  </span>
                  <div className="flex items-center gap-2">
                    {onOpenTracker && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenTracker(selectedOrder);
                        }}
                        className="text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Live Parcel Tracker</span>
                      </button>
                    )}
                    <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full border ${getStatusBadge(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  Placed on {new Date(selectedOrder.created_at).toLocaleDateString()} • Total: ₹{Number(selectedOrder.total_amount).toFixed(2)}
                </div>
              </div>

              {/* Sub-orders list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Shipment Packages ({selectedOrder.sub_orders?.length || 0})
                </h4>
                {(selectedOrder.sub_orders || []).map((so) => (
                  <div key={so.id} className="p-4 border border-slate-200 rounded-2xl space-y-3 bg-white">
                    <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                      <div>
                        <span className="font-mono font-bold text-blue-600">{so.sub_order_number}</span>
                        {so.courier_name && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Courier: <strong className="text-slate-700">{so.courier_name}</strong> • Tracking: <span className="font-mono">{so.tracking_number}</span>
                          </div>
                        )}
                      </div>
                      <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full border ${getStatusBadge(so.status)}`}>
                        {so.status}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="space-y-1.5 text-xs">
                      {(so.items || []).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-slate-700">
                          <span>{item.product_title || item.variant_name} (×{item.quantity})</span>
                          <span className="font-bold text-slate-900">₹{Number(item.total_price || item.unit_price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Status machine history timeline */}
                    {so.status_history?.length > 0 && (
                      <div className="pt-2 border-t border-dashed border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Status Transition Audit Log:
                        </span>
                        <div className="space-y-1">
                          {so.status_history.map((h, i) => (
                            <div key={i} className="text-[11px] text-slate-500 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              <span className="font-semibold text-slate-700">{h.to_status}</span>
                              <span className="text-slate-400 text-[10px]">
                                {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {h.notes && <span className="text-slate-500 italic">({h.notes})</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No orders placed yet</p>
              <p className="text-xs text-slate-400 mt-1">Place an order to see multi-seller package splitting in action.</p>
            </div>
          ) : (
            /* Orders list */
            <div className="space-y-2.5">
              {orders.map((o) => (
                <div
                  key={o.id}
                  onClick={() => handleSelectOrder(o.id)}
                  className="p-4 border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex items-center justify-between bg-white"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                        {o.order_number}
                      </span>
                      <span className={`text-[10px] uppercase font-black px-2 py-0.2 rounded-full border ${getStatusBadge(o.status)}`}>
                        {o.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {new Date(o.created_at).toLocaleDateString()} • {o.sub_orders_count || 1} package(s)
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900">
                        ₹{Number(o.total_amount).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-bold uppercase">
                        {o.payment_status}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
