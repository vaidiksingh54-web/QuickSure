import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Package, 
  Truck, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Plus, 
  Minus, 
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Send
} from 'lucide-react';
import api from '../../services/api';

export default function SellerDashboard() {
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Stock edit state: { variantId: number }
  const [stockUpdates, setStockUpdates] = useState({});

  // Dispatch modal / drawer state
  const [dispatchingSubOrder, setDispatchingSubOrder] = useState(null);
  const [courierName, setCourierName] = useState('BlueDart Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [dispatchLoading, setDispatchLoading] = useState(false);

  useEffect(() => {
    loadSellerPortalData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadSellerPortalData = async () => {
    try {
      setLoading(true);
      const [profRes, prodRes, ordersRes] = await Promise.all([
        api.get('/seller/profile'),
        api.get('/seller/products'),
        api.get('/seller/orders'),
      ]);
      setProfile(profRes.data);
      setProducts(prodRes.data?.products || []);
      setSubOrders(ordersRes.data || []);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (variantId, currentStock) => {
    const newStock = stockUpdates[variantId] !== undefined ? stockUpdates[variantId] : currentStock;
    try {
      await api.put(`/seller/variants/${variantId}/stock`, {
        stock_quantity: Number(newStock),
      });
      showToast(`Inventory updated to ${newStock} units!`);
      setStockUpdates((prev) => {
        const next = { ...prev };
        delete next[variantId];
        return next;
      });
      await loadSellerPortalData();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleDispatchOrder = async (e) => {
    e.preventDefault();
    if (!courierName || !trackingNumber || !dispatchingSubOrder) return;
    try {
      setDispatchLoading(true);
      await api.put(`/seller/orders/sub/${dispatchingSubOrder.id}/dispatch`, {
        courier_name: courierName,
        tracking_number: trackingNumber,
        notes: `Dispatched via ${courierName}`,
      });
      showToast(`Sub-order ${dispatchingSubOrder.sub_order_number} marked as Shipped!`);
      setDispatchingSubOrder(null);
      setTrackingNumber('');
      await loadSellerPortalData();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setDispatchLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Seller Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-amber-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-400/30">
            <Store className="w-3.5 h-3.5" /> Stage 7 Vendor Fulfillment Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {profile?.store_name || 'Vendor Management Portal'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            {profile?.description || 'Manage product variants, live inventory stock quantities, and package shipments.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            {profile?.status || 'Active'}
          </span>
          <button
            onClick={loadSellerPortalData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors border border-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Catalog</span>
          </button>
        </div>
      </div>

      {/* Store Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Store Commission Tier
            </span>
            <div className="text-2xl font-black text-amber-600">
              {profile?.commission_rate || 10.00}%
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-1 inline-block">
              Platform Standard Rate
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Managed Products
            </span>
            <div className="text-2xl font-black text-slate-900">
              {products.length}
            </div>
            <span className="text-[10px] text-emerald-600 font-bold mt-1 inline-block">
              Rule 5 IDOR Guarded
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Fulfillment Queue
            </span>
            <div className="text-2xl font-black text-indigo-600">
              {subOrders.length}
            </div>
            <span className="text-[10px] text-indigo-600 font-bold mt-1 inline-block">
              Assigned Packages
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Product Variant Catalog & Inventory Stock Editor */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              Live Variant Inventory Stock Manager
            </h2>
            <p className="text-xs text-slate-500">
              Adjust stock floor quantities in real-time. Enforces Rule 5 vendor ownership validation.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider border-b border-slate-100 font-bold">
              <tr>
                <th className="py-3 px-4">Product & Variant</th>
                <th className="py-3 px-4">SKU Code</th>
                <th className="py-3 px-4">Price (INR)</th>
                <th className="py-3 px-4">Available Stock</th>
                <th className="py-3 px-4 text-right">Inventory Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((prod) =>
                (prod.variants || []).map((v) => {
                  const currentStock = stockUpdates[v.id] !== undefined ? stockUpdates[v.id] : v.stock_quantity;
                  const hasChanged = stockUpdates[v.id] !== undefined && stockUpdates[v.id] !== v.stock_quantity;

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{prod.title}</div>
                        <div className="text-[11px] text-slate-500">Variant: {v.variant_name || 'Standard'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">
                        {v.sku}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        ₹{Number(v.price).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setStockUpdates({ ...stockUpdates, [v.id]: Math.max(0, currentStock - 1) })}
                            className="p-1 border border-slate-200 rounded hover:bg-slate-100 transition-colors"
                          >
                            <Minus className="w-3 h-3 text-slate-600" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={currentStock}
                            onChange={(e) => setStockUpdates({ ...stockUpdates, [v.id]: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-xs font-black text-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setStockUpdates({ ...stockUpdates, [v.id]: currentStock + 1 })}
                            className="p-1 border border-slate-200 rounded hover:bg-slate-100 transition-colors"
                          >
                            <Plus className="w-3 h-3 text-slate-600" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {hasChanged ? (
                          <button
                            onClick={() => handleUpdateStock(v.id, v.stock_quantity)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                          >
                            Save Stock
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">In Sync</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shipment Fulfillment Dispatch Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-600" />
              Shipment Fulfillment & Dispatch Queue
            </h2>
            <p className="text-xs text-slate-500">
              Assigned sub-orders for this vendor. Attach courier tracking and dispatch packages.
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
            {subOrders.length} Sub-Orders
          </span>
        </div>

        {subOrders.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Truck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-medium text-slate-600">No pending shipment packages</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Orders placed by customers will split into this fulfillment queue automatically.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {subOrders.map((so) => (
              <div key={so.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-600 text-xs sm:text-sm">
                      {so.sub_order_number}
                    </span>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {so.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Shipment Value: <strong>₹{Number(so.subtotal).toFixed(2)}</strong> • Net Vendor Payout: <strong className="text-emerald-700">₹{Number(so.seller_payout_amount).toFixed(2)}</strong>
                  </div>
                  {so.courier_name && (
                    <div className="text-[11px] text-slate-500 font-mono">
                      Carrier: {so.courier_name} | Tracking: {so.tracking_number}
                    </div>
                  )}
                </div>

                <div>
                  {so.status !== 'shipped' && so.status !== 'delivered' && (
                    <button
                      onClick={() => {
                        setDispatchingSubOrder(so);
                        setTrackingNumber(`QS-TRK-${Date.now().toString().slice(-6)}`);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Package</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Dispatch Package */}
      {dispatchingSubOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Dispatch Shipment Package</h3>
            <p className="text-xs text-slate-500 mb-4">
              Sub-order: <strong className="font-mono text-slate-700">{dispatchingSubOrder.sub_order_number}</strong>
            </p>

            <form onSubmit={handleDispatchOrder} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Courier Partner</label>
                <select
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="BlueDart Express">BlueDart Express</option>
                  <option value="Delhivery Logistics">Delhivery Logistics</option>
                  <option value="DTDC Courier">DTDC Courier</option>
                  <option value="Shadowfax Local">Shadowfax Local</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tracking Number / AWB</label>
                <input
                  type="text"
                  placeholder="e.g. BD-2026-987654"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setDispatchingSubOrder(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dispatchLoading}
                  className="w-1/2 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {dispatchLoading ? 'Dispatching...' : 'Confirm Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
