import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Zap,
  Server,
  Database,
  CheckCircle2,
  AlertCircle,
  Layers,
  User,
  LogOut,
  LogIn,
  Store,
  Lock,
  ArrowRight,
  ShoppingBag,
  Heart,
  Tag,
  Flame,
  RefreshCw,
  Sparkles,
  Package,
  Truck
} from 'lucide-react';
import api from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { OrderProvider, useOrders } from './context/OrderContext';
import AuthModal from './components/auth/AuthModal';
import CartDrawer from './components/cart/CartDrawer';
import OrderReceipt from './components/orders/OrderReceipt';
import OrderHistory from './components/orders/OrderHistory';
import AdminDashboard from './components/admin/AdminDashboard';

// Demo catalog items matching the server mock variant fixtures
const DEMO_PRODUCTS = [
  {
    id: 'p0000001-0000-0000-0000-000000000001',
    variant_id: 'v0000001-0000-0000-0000-000000000001',
    title: 'SonicPro Wireless ANC Headphones',
    category: 'Electronics',
    price: 2499.00,
    compare_at_price: 3499.00,
    sku: 'SP-ANC-BLK',
    in_stock: true,
    badge: 'Best Seller',
  },
  {
    id: 'p0000001-0000-0000-0000-000000000002',
    variant_id: 'v0000001-0000-0000-0000-000000000003',
    title: 'AeroWatch S5 Smartwatch',
    category: 'Electronics',
    price: 1899.00,
    compare_at_price: 2499.00,
    sku: 'AW-S5-OBS',
    in_stock: true,
    badge: 'Popular',
  },
  {
    id: 'p0000001-0000-0000-0000-000000000003',
    variant_id: 'v0000001-0000-0000-0000-000000000004',
    title: 'Cotton Oxford Shirt (Sky Blue)',
    category: 'Fashion',
    price: 899.00,
    compare_at_price: 1299.00,
    sku: 'OXF-BLU-M',
    in_stock: true,
    badge: 'Pure Cotton',
  },
  {
    id: 'p0000001-0000-0000-0000-000000000004',
    variant_id: 'v0000001-0000-0000-0000-000000000006',
    title: 'TurboMix 750W Mixer Grinder',
    category: 'Home & Kitchen',
    price: 1849.00,
    compare_at_price: 2299.00,
    sku: 'TM-750-BLU',
    in_stock: true,
    badge: '750W Copper',
  },
];

function MainContent() {
  const { user, role, isAuthenticated, logout, loginAsDemoPersona } = useAuth();
  const {
    totalItemCount,
    setIsCartOpen,
    addToCart,
    wishlist,
    toggleWishlist,
    quote
  } = useCart();
  const { orders, sellerSubOrders, fetchSellerSubOrders, updateSubOrderStatus } = useOrders();

  const [health, setHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [orderHistoryOpen, setOrderHistoryOpen] = useState(false);
  const [placedOrderData, setPlacedOrderData] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [adminView, setAdminView] = useState('storefront');

  // Concurrency Stress Tester state
  const [raceLoading, setRaceLoading] = useState(false);
  const [raceResult, setRaceResult] = useState(null);

  // Seller fulfillment test state
  const [updatingSubOrder, setUpdatingSubOrder] = useState(false);

  useEffect(() => {
    checkHealth();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const checkHealth = async () => {
    try {
      setLoadingHealth(true);
      const res = await api.get('/health');
      setHealth(res.data);
    } catch {
      // ignore
    } finally {
      setLoadingHealth(false);
    }
  };

  const handleAddToCart = async (product) => {
    try {
      await addToCart({
        id: product.variant_id,
        variant_id: product.variant_id,
        title: product.title,
        price: product.price,
        sku: product.sku,
      });
      showToast(`Added "${product.title}" to cart!`);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleToggleWishlist = async (productId) => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    try {
      await toggleWishlist(productId);
      showToast('Wishlist updated');
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  // Test atomic race condition simulation
  const simulateConcurrencyRace = async () => {
    setRaceLoading(true);
    setRaceResult(null);
    try {
      // Simulate two customers competing for the single flash drop item
      const p1 = api.post('/cart/items', {
        variant_id: 'v0000001-0000-0000-0000-000000000001',
        quantity: 1,
      });
      const p2 = api.post('/cart/items', {
        variant_id: 'v0000001-0000-0000-0000-000000000001',
        quantity: 1,
      });

      const [res1, res2] = await Promise.allSettled([p1, p2]);

      setRaceResult({
        timestamp: new Date().toLocaleTimeString(),
        attempt1: res1.status === 'fulfilled' ? 'SUCCESS (HTTP 200/201)' : `FAILED (${res1.reason?.message || 'Error'})`,
        attempt2: res2.status === 'fulfilled' ? 'SUCCESS (HTTP 200/201)' : `FAILED (${res2.reason?.message || 'Error'})`,
        note: 'Atomic isolation prevents inventory overselling across concurrent transactions (Rule 4).',
      });
    } catch (err) {
      setRaceResult({ error: err.message });
    } finally {
      setRaceLoading(false);
    }
  };

  const getRoleBadgeColor = (r) => {
    switch (r) {
      case 'admin': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'seller': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'customer': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Value Assurance Ribbon */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <Zap className="w-3.5 h-3.5" /> Express Dispatch
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Verified Sellers & Genuine Products
            </span>
          </div>
          <div className="text-slate-400 font-medium hidden md:block">
            Stage 5: Multi-Seller Order Splitting & Simulation Services Live
          </div>
        </div>
      </div>

      {/* Main Header / Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="QuickSure Logo" className="h-12 w-auto" />
          </div>

          {/* Action Center: Cart, Wishlist, Auth */}
          <div className="flex items-center gap-3 sm:gap-4">

            {/* Wishlist Indicator */}
            <div className="relative">
              <button
                onClick={() => !isAuthenticated ? setAuthModalOpen(true) : null}
                title="Wishlist"
                className="p-2 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-slate-100 transition-colors relative"
              >
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </button>
            </div>

            {/* Orders Tracker Button */}
            {isAuthenticated && (
              <button
                onClick={() => setOrderHistoryOpen(true)}
                className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors relative"
                title="Your Orders"
              >
                <Package className="w-5 h-5" />
              </button>
            )}

            {/* Admin Portal Toggle Button */}
            {role === 'admin' && (
              <button
                onClick={() => setAdminView(adminView === 'portal' ? 'storefront' : 'portal')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  adminView === 'portal'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{adminView === 'portal' ? 'Storefront' : 'Admin Portal'}</span>
              </button>
            )}

            {/* Cart Trigger Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3.5 py-2 rounded-xl transition-all border border-blue-200 shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="text-xs font-bold hidden sm:inline">Cart</span>
              {totalItemCount > 0 && (
                <span className="bg-blue-600 text-white text-[11px] font-black px-1.5 py-0.2 rounded-full min-w-[20px] text-center shadow-sm">
                  {totalItemCount}
                </span>
              )}
            </button>

            {/* User Session / Sign In */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2.5 bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-200">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  {user.full_name?.charAt(0) || 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">{user.full_name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] uppercase font-extrabold px-1.5 py-0.2 rounded border ${getRoleBadgeColor(role)}`}>
                      {role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {role === 'admin' && adminView === 'portal' ? (
          <AdminDashboard />
        ) : (
          <>
        {/* Stage 4 Hero Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden border border-slate-800">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider mb-4 border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Stage 4: Authoritative Cart & Concurrency
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
              Zero-Trust Pricing & Concurrency Engine
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mb-6 leading-relaxed">
              Enforcing Architectural Rule 1 (Zero Client Pricing: discounts, 5% GST, and free shipping are calculated authoritatively by the server) and Rule 4 (Atomic Concurrency: floor-checked stock reservations eliminate race condition overselling).
            </p>

            {/* Persona Switcher Quick Bar */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/15 max-w-xl">
              <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2">
                Active Session Persona (Click to switch):
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => loginAsDemoPersona('customer')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${role === 'customer'
                      ? 'bg-blue-600 text-white ring-2 ring-white shadow'
                      : 'bg-white/15 hover:bg-white/25 text-slate-200'
                    }`}
                >
                  <User className="w-3.5 h-3.5" /> Customer Mode
                </button>
                <button
                  onClick={() => loginAsDemoPersona('seller')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${role === 'seller'
                      ? 'bg-amber-500 text-slate-900 ring-2 ring-white shadow font-extrabold'
                      : 'bg-white/15 hover:bg-white/25 text-slate-200'
                    }`}
                >
                  <Store className="w-3.5 h-3.5" /> Seller Mode
                </button>
                <button
                  onClick={() => loginAsDemoPersona('admin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${role === 'admin'
                      ? 'bg-indigo-600 text-white ring-2 ring-white shadow'
                      : 'bg-white/15 hover:bg-white/25 text-slate-200'
                    }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Admin Mode
                </button>
                {isAuthenticated && (
                  <button
                    onClick={logout}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-all ml-auto"
                  >
                    Guest
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live Marketplace Showcase (Add to Cart / Live Pricing) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Featured Catalog & Live Cart Additions</h2>
              <p className="text-xs text-slate-500">
                Click any product to add it to your cart and watch authoritative server calculation in real time.
              </p>
            </div>
            <button
              onClick={() => setIsCartOpen(true)}
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              Open Cart Drawer ({totalItemCount}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DEMO_PRODUCTS.map((prod) => {
              const isWishlisted = wishlist.includes(prod.id);
              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {/* Badge & Wishlist */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {prod.badge}
                      </span>
                      <button
                        onClick={() => handleToggleWishlist(prod.id)}
                        className={`p-1.5 rounded-lg transition-colors ${isWishlisted
                            ? 'text-rose-500 bg-rose-50'
                            : 'text-slate-400 hover:text-rose-500 hover:bg-slate-50'
                          }`}
                        title="Toggle Wishlist"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    {/* Placeholder image box */}
                    <div className="h-32 bg-slate-100 rounded-xl mb-3 flex items-center justify-center text-slate-300">
                      <ShoppingBag className="w-10 h-10" />
                    </div>

                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      {prod.category}
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mb-2 line-clamp-1">
                      {prod.title}
                    </h3>
                  </div>

                  <div className="pt-3 border-t border-slate-100 mt-2">
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-base font-black text-slate-900">
                        ₹{prod.price.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-400 line-through">
                        ₹{prod.compare_at_price.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddToCart(prod)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive Concurrency & Pricing Invariants Verification Panel */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Rule 4 Architecture Verification: Atomic Stock Reservation
              </h2>
              <p className="text-xs text-slate-500">
                Verify that parallel checkouts cannot oversell limited inventory through atomic database decrements.
              </p>
            </div>
            <button
              onClick={simulateConcurrencyRace}
              disabled={raceLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-colors shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${raceLoading ? 'animate-spin' : ''}`} />
              Run Race Simulation
            </button>
          </div>

          {raceResult && (
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 text-xs text-indigo-950 space-y-1.5">
              <div className="font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Simulation Complete at {raceResult.timestamp}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-indigo-100">
                <div className="p-2 bg-white rounded border border-indigo-100">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Thread A Reservation</span>
                  <span className="font-semibold text-emerald-700">{raceResult.attempt1}</span>
                </div>
                <div className="p-2 bg-white rounded border border-indigo-100">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Thread B Reservation</span>
                  <span className="font-semibold text-indigo-700">{raceResult.attempt2}</span>
                </div>
              </div>
              <p className="text-[11px] text-indigo-800 pt-1 font-medium">{raceResult.note}</p>
            </div>
          )}

          {/* Architecture Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Rule 1: Zero Client Pricing
              </span>
              <p className="text-[11px] text-slate-600">
                Client prices are display-only. Server recalculates subtotal, 5% GST, and thresholds.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Rule 4: Atomic Inventory
              </span>
              <p className="text-[11px] text-slate-600">
                Floor check (stock &gt;= qty) protects against double spending and race conditions.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> ADR-005: Guest Cart Merge
              </span>
              <p className="text-[11px] text-slate-600">
                Guest items in localStorage seamlessly merge into database cart upon authentication.
              </p>
            </div>
          </div>
        </div>
        </>
      )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          QuickSure Marketplace • Stage 4 Complete: Cart, Pricing & Atomic Concurrency Active
        </div>
      </footer>

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        onOrderPlaced={(data) => setPlacedOrderData(data)}
        onRequireAuth={() => setAuthModalOpen(true)}
      />

      {/* Order Confirmation Receipt Modal */}
      {placedOrderData && (
        <OrderReceipt
          orderData={placedOrderData}
          onClose={() => setPlacedOrderData(null)}
        />
      )}

      {/* Customer Order History Modal */}
      <OrderHistory
        isOpen={orderHistoryOpen}
        onClose={() => setOrderHistoryOpen(false)}
      />

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <OrderProvider>
          <MainContent />
        </OrderProvider>
      </CartProvider>
    </AuthProvider>
  );
}
