import React from 'react';
import { 
  CheckCircle2, 
  Package, 
  Truck, 
  Store, 
  CreditCard, 
  ShieldCheck, 
  Calendar,
  X,
  ExternalLink
} from 'lucide-react';

export default function OrderReceipt({ orderData, onClose, onOpenTracker }) {
  if (!orderData) return null;

  const { order, sub_orders = [], payment, quote } = orderData;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Header */}
        <div className="text-center pb-6 border-b border-slate-100">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Order Confirmed & Paid
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">Thank you for your order!</h2>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Order Reference: <strong className="text-slate-800">{order?.order_number}</strong>
          </p>
        </div>

        {/* Transaction & Address Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-xs border-b border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 font-medium block mb-1">Delivery Destination</span>
            <div className="font-bold text-slate-800">{order?.shipping_address?.recipient_name}</div>
            <div className="text-slate-600">{order?.shipping_address?.street_address}</div>
            <div className="text-slate-600">
              {order?.shipping_address?.city}, {order?.shipping_address?.state} - {order?.shipping_address?.postal_code}
            </div>
            <div className="text-slate-500 mt-1">Ph: {order?.shipping_address?.phone}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 font-medium block mb-1">Payment Receipt</span>
            <div className="flex items-center gap-1.5 text-slate-800 font-bold">
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              <span>Method: {order?.payment_method?.toUpperCase()}</span>
            </div>
            <div className="text-slate-600 mt-1 font-mono text-[11px]">
              Ref: {payment?.transaction_ref}
            </div>
            <div className="text-emerald-700 font-bold mt-1">
              Status: {payment?.status?.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Multi-Seller Sub-Orders Breakdown */}
        <div className="py-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-amber-600" />
              Multi-Seller Split Shipments ({sub_orders.length} packages)
            </span>
            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              Rule 8 Enforced
            </span>
          </div>

          <div className="space-y-2.5">
            {sub_orders.map((so) => (
              <div key={so.id} className="p-3.5 border border-slate-200 rounded-2xl bg-white shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-600">{so.sub_order_number}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-semibold text-slate-700">{so.seller_name || 'Verified Vendor'}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    {so.status}
                  </span>
                </div>

                {/* Items in this sub-order */}
                <div className="space-y-1.5">
                  {(so.items || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <div className="text-slate-800">
                        <span className="font-medium">{item.product_title || item.variant_name}</span>
                        <span className="text-slate-400 ml-1.5">× {item.quantity}</span>
                      </div>
                      <span className="font-bold text-slate-900">
                        ₹{(Number(item.unit_price || 0) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Seller Payout Info (Rule 4 / Architecture Transparency) */}
                <div className="pt-2 border-t border-dashed border-slate-100 flex justify-between text-[11px] text-slate-500">
                  <span>Shipment Subtotal</span>
                  <span className="font-semibold text-slate-700">₹{Number(so.subtotal).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="p-4 bg-slate-50 rounded-2xl space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-800">₹{Number(order?.subtotal || quote?.subtotal || 0).toFixed(2)}</span>
          </div>
          {Number(order?.discount_amount || quote?.discount_amount || 0) > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount</span>
              <span>-₹{Number(order?.discount_amount || quote?.discount_amount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Taxes (5% GST)</span>
            <span className="font-semibold text-slate-800">₹{Number(order?.tax_amount || quote?.tax_amount || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span className="font-semibold text-slate-800">
              {Number(order?.shipping_fee || quote?.shipping_fee || 0) === 0 ? 'FREE' : `₹${Number(order?.shipping_fee || quote?.shipping_fee).toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
            <span>Total Paid</span>
            <span className="text-blue-600">₹{Number(order?.total_amount || quote?.total_amount || 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-2">
          {onOpenTracker && (
            <button
              onClick={() => {
                onClose();
                onOpenTracker(orderData.order || orderData);
              }}
              className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20"
            >
              <Truck className="w-4 h-4" />
              <span>Track Multi-Seller Shipments</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors text-xs uppercase tracking-wider"
          >
            Done & Return to Store
          </button>
        </div>
      </div>
    </div>
  );
}
