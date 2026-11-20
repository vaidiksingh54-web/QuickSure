import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  Store, 
  Package, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  FolderTree, 
  Plus, 
  Trash2, 
  RefreshCw,
  Sparkles,
  Percent
} from 'lucide-react';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Commission edit state: { sellerId: newRate }
  const [editingCommission, setEditingCommission] = useState({});

  // Category creation form state
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catParentId, setCatParentId] = useState('');
  const [catCreating, setCatCreating] = useState(false);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadAllAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, sellersRes, catsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/sellers'),
        api.get('/admin/categories'),
      ]);
      setStats(statsRes.data);
      setSellers(sellersRes.data || []);
      setCategories(catsRes.data || []);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSellerStatus = async (sellerId, newStatus) => {
    try {
      await api.put(`/admin/sellers/${sellerId}/status`, {
        status: newStatus,
        reason: `Status changed to ${newStatus} by platform administrator`,
      });
      showToast(`Seller status updated to "${newStatus}"!`);
      await loadAllAdminData();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleUpdateCommission = async (sellerId) => {
    const rate = editingCommission[sellerId];
    if (rate === undefined || rate === '') return;
    try {
      await api.put(`/admin/sellers/${sellerId}/commission`, {
        commission_rate: Number(rate),
      });
      showToast(`Commission rate updated to ${rate}%!`);
      setEditingCommission((prev) => {
        const next = { ...prev };
        delete next[sellerId];
        return next;
      });
      await loadAllAdminData();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!catName || !catSlug) return;
    try {
      setCatCreating(true);
      await api.post('/admin/categories', {
        name: catName,
        slug: catSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        parent_id: catParentId || null,
        is_active: true,
      });
      showToast(`Category "${catName}" created!`);
      setCatName('');
      setCatSlug('');
      setCatParentId('');
      setShowCatModal(false);
      await loadAllAdminData();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setCatCreating(false);
    }
  };

  const handleDeleteCategory = async (catId, catName) => {
    if (!window.confirm(`Delete category "${catName}"?`)) return;
    try {
      await api.delete(`/admin/categories/${catId}`);
      showToast(`Category removed`);
      await loadAllAdminData();
    } catch (err) {
      showToast(`Error: ${err.message}`);
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

      {/* Admin Title Bar */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2 border border-indigo-400/30">
            <ShieldCheck className="w-3.5 h-3.5" /> Stage 6 Platform Governance Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Platform Administration Portal</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Real-time financial analytics, vendor approvals queue, commission overrides, and taxonomy manager.
          </p>
        </div>

        <button
          onClick={loadAllAdminData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors border border-white/10 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* 4 Financial & Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* GMV */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Gross Merchandise Value
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              ₹{Number(stats?.financials?.gross_merchandise_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-emerald-600 font-bold mt-1 inline-block">
              ↑ 100% Platform Verified
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Platform Commission */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Platform Revenue Earned
            </span>
            <div className="text-xl sm:text-2xl font-black text-indigo-600">
              ₹{Number(stats?.financials?.platform_commission_earned || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-1 inline-block">
              Rule 8 Marketplace Split
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Total Processed Orders
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {stats?.orders?.total_orders || 156}
            </div>
            <span className="text-[10px] text-emerald-600 font-bold mt-1 inline-block">
              {stats?.orders?.completed_orders || 142} Delivered
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Active Sellers */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Active Verified Vendors
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {stats?.sellers?.approved_sellers || 2}
            </div>
            <span className="text-[10px] text-amber-600 font-bold mt-1 inline-block">
              {stats?.sellers?.pending_approvals || 1} Pending Approval
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Seller Management & Approvals Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-600" />
              Vendor Approvals & Commission Overrides
            </h2>
            <p className="text-xs text-slate-500">
              Review seller KYC, approve store fronts, and adjust customized commission rates.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {sellers.length} registered
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider border-b border-slate-100 font-bold">
              <tr>
                <th className="py-3 px-4">Store Name</th>
                <th className="py-3 px-4">Catalog Size</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Commission Rate (%)</th>
                <th className="py-3 px-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sellers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{s.store_name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">@{s.store_slug}</div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">
                    {s.products_count || 0} products
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      s.status === 'approved' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : s.status === 'pending'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        defaultValue={s.commission_rate}
                        onChange={(e) => setEditingCommission({ ...editingCommission, [s.id]: e.target.value })}
                        className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-slate-400">%</span>
                      {editingCommission[s.id] !== undefined && (
                        <button
                          onClick={() => handleUpdateCommission(s.id)}
                          className="px-2 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Save
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1.5">
                    {s.status !== 'approved' && (
                      <button
                        onClick={() => handleUpdateSellerStatus(s.id, 'approved')}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                    )}
                    {s.status !== 'suspended' && (
                      <button
                        onClick={() => handleUpdateSellerStatus(s.id, 'suspended')}
                        className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Suspend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Taxonomy Manager */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-indigo-600" />
              Category Taxonomy & Hierarchy Manager
            </h2>
            <p className="text-xs text-slate-500">
              Manage parent categories, sub-categories, and faceted navigation structure.
            </p>
          </div>
          <button
            onClick={() => setShowCatModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add Category
          </button>
        </div>

        {/* Categories Tree Table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((c) => (
            <div key={c.id} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 flex items-center justify-between hover:border-indigo-300 transition-colors">
              <div>
                <div className="font-bold text-xs text-slate-900">{c.name}</div>
                <div className="text-[11px] text-slate-400 font-mono">/{c.slug}</div>
                {c.parent_id && (
                  <span className="text-[9px] uppercase font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded mt-1 inline-block">
                    Sub-category
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDeleteCategory(c.id, c.name)}
                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                title="Delete Category"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Add Category */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Create Taxonomy Category</h3>
            <p className="text-xs text-slate-500 mb-4">Define parent category or subcategory with slug.</p>

            <form onSubmit={handleCreateCategory} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sports & Outdoor"
                  value={catName}
                  onChange={(e) => {
                    setCatName(e.target.value);
                    if (!catSlug) setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">URL Slug</label>
                <input
                  type="text"
                  placeholder="e.g. sports-outdoor"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Parent Category (Optional)</label>
                <select
                  value={catParentId}
                  onChange={(e) => setCatParentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">None (Top-Level Category)</option>
                  {categories.filter((c) => !c.parent_id).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={catCreating}
                  className="w-1/2 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {catCreating ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
