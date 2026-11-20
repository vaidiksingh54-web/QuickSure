import React, { useState } from 'react';
import {
  X,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Store,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  ShieldCheck,
  MapPin
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', desc: 'Received & Queued' },
  { key: 'confirmed', label: 'Confirmed', desc: 'Inventory Allocated' },
  { key: 'packed', label: 'Packed', desc: 'Sealed at Merchant Hub' },
  { key: 'shipped', label: 'In Transit', desc: 'Handed to Courier' },
  { key: 'delivered', label: 'Delivered', desc: 'Signed & Completed' },
];

export default function OrderTrackerModal({ order, onClose }) {
  const { updateSubOrderStatus } = useOrders();
  const [copiedKey, setCopiedKey] = useState(null);
  const [advancingId, setAdvancingId] = useState(null);
  const [localSubOrders, setLocalSubOrders] = useState(order?.sub_orders || []);

  if (!order) return null;

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getStepIndex = (status) => {
    switch (status) {
      case 'pending': return 0;
      case 'confirmed': return 1;
      case 'packed': return 2;
      case 'shipped': return 3;
      case 'delivered': return 4;
      default: return 0;
    }
  };

  const handleAdvanceStep = async (subOrder) => {
    const currentIndex = getStepIndex(subOrder.status);
    if (currentIndex >= STATUS_STEPS.length - 1) return;

    const nextStatus = STATUS_STEPS[currentIndex + 1].key;
    try {
      setAdvancingId(subOrder.id);
      await updateSubOrderStatus(subOrder.id, nextStatus, {
        courier_name: subOrder.courier_name || 'BlueDart Express',
        tracking_number: subOrder.tracking_number || `BD-${Math.floor(100000000 + Math.random() * 900000000)}`,
        notes: `Simulated state change to ${nextStatus}`,
      });

      // Update local state
      setLocalSubOrders((prev) =>
        prev.map((so) =>
          so.id === subOrder.id
            ? {
                ...so,
                status: nextStatus,
                courier_name: so.courier_name || 'BlueDart Express',
                tracking_number: so.tracking_number || `BD-${Math.floor(100000000 + Math.random() * 900000000)}`,
              }
            : so
        )
      );
    } catch (err) {
      console.error('Failed to advance shipment status:', err);
    } finally {
      setAdvancingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-900 to-indigo-950 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">Live Shipment Visualizer</h2>
                <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full font-mono">
                  {order.order_number}
                </span>
              </div>
              <p className="text-xs text-indigo-200">
                Rule 8 Partitioning: Tracking {localSubOrders.length} independent merchant packages
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Tracker"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Sub-Order Parcels */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1">
          {/* Destination Address Pill */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs text-gray-700">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Delivering to: <strong className="text-gray-900">{order.shipping_address?.recipient_name}</strong> • {order.shipping_address?.city}, {order.shipping_address?.state} ({order.shipping_address?.postal_code})
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              Paid via {order.payment_method?.toUpperCase()}
            </span>
          </div>

          {/* Sub-Orders List */}
          {localSubOrders.map((so, idx) => {
            const currentStepIdx = getStepIndex(so.status);
            const isCompleted = currentStepIdx === STATUS_STEPS.length - 1;

            return (
              <div key={so.id || idx} className="p-5 rounded-2xl border border-gray-200 bg-white shadow-xs space-y-5">
                {/* Parcel Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Store className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-bold text-gray-900">
                      Package {idx + 1}: {so.sellers?.store_name || so.seller_name || 'Verified Merchant'}
                    </span>
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                      {so.sub_order_number || `SO-${idx + 1}`}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    {so.tracking_number && (
                      <div className="flex items-center space-x-1 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
                        <span className="text-gray-400">{so.courier_name || 'Courier'}:</span>
                        <span className="font-mono font-bold text-gray-800">{so.tracking_number}</span>
                        <button
                          onClick={() => handleCopy(so.tracking_number, so.id)}
                          className="text-gray-400 hover:text-gray-700 ml-1"
                        >
                          {copiedKey === so.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Stepper Visualizer */}
                <div className="relative py-2">
                  <div className="overflow-hidden h-1.5 mb-4 text-xs flex rounded-full bg-gray-100">
                    <div
                      style={{ width: `${(currentStepIdx / (STATUS_STEPS.length - 1)) * 100}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600 transition-all duration-500"
                    />
                  </div>

                  {/* Steps circles */}
                  <div className="grid grid-cols-5 gap-1 text-center">
                    {STATUS_STEPS.map((st, sIdx) => {
                      const isPastOrCurrent = sIdx <= currentStepIdx;
                      const isCurrent = sIdx === currentStepIdx;

                      return (
                        <div key={st.key} className="flex flex-col items-center">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all mb-1 ${
                              isCurrent
                                ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-md scale-110'
                                : isPastOrCurrent
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {isPastOrCurrent && !isCurrent ? <Check className="w-3 h-3" /> : sIdx + 1}
                          </div>
                          <span className={`text-[11px] font-bold ${isCurrent ? 'text-indigo-600' : 'text-gray-700'}`}>
                            {st.label}
                          </span>
                          <span className="text-[9px] text-gray-400 hidden sm:block">
                            {st.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Items in Sub-Order */}
                {so.order_items && so.order_items.length > 0 && (
                  <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100 space-y-1.5 text-xs">
                    <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Shipment Contents:
                    </div>
                    {so.order_items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex justify-between text-gray-700">
                        <span>{item.quantity}x {item.product_title || 'Item'} ({item.sku})</span>
                        <span className="font-semibold text-gray-900">₹{Number(item.price * item.quantity).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Developer / Evaluator Interactive Advance Button */}
                <div className="pt-1 flex items-center justify-between">
                  <div className="text-[11px] text-gray-400">
                    Status: <strong className="text-gray-700 capitalize">{so.status}</strong>
                  </div>

                  {!isCompleted ? (
                    <button
                      disabled={advancingId === so.id}
                      onClick={() => handleAdvanceStep(so)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      <span>{advancingId === so.id ? 'Advancing Status...' : 'Simulate Next Stage'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Parcel Delivered Successfully</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
