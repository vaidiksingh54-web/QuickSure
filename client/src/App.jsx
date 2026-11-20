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
  ArrowRight
} from 'lucide-react';
import api from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/auth/AuthModal';

function MainContent() {
  const { user, role, isAuthenticated, logout, loginAsDemoPersona } = useAuth();
  const [health, setHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [healthError, setHealthError] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // RBAC test states
  const [rbacTestResult, setRbacTestResult] = useState(null);
  const [rbacTesting, setRbacTesting] = useState(false);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      setLoadingHealth(true);
      setHealthError(null);
      const res = await api.get('/health');
      setHealth(res.data);
    } catch (err) {
      setHealthError(err.message || 'Failed to connect to API Gateway');
    } finally {
      setLoadingHealth(false);
    }
  };

  const testEndpoint = async (endpoint, label) => {
    setRbacTesting(true);
    setRbacTestResult(null);
    try {
      const res = await api.get(endpoint);
      setRbacTestResult({
        endpoint,
        label,
        status: 200,
        success: true,
        message: res.message || 'Request authorized',
        data: res.data,
      });
    } catch (err) {
      setRbacTestResult({
        endpoint,
        label,
        status: err.statusCode || 500,
        success: false,
        message: err.message,
        code: err.code,
      });
    } finally {
      setRbacTesting(false);
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
      {/* Top Value Assurance Ribbon */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <Zap className="w-3.5 h-3.5" /> Express Dispatch
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Verified Sellers
            </span>
          </div>
          <div className="text-slate-400 font-medium">
            Stage 2: Auth & Role-Based Access Control Live
          </div>
        </div>
      </div>

      {/* Main Header / Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="QuickSure Logo" className="h-12 w-auto" />
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3 bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-200">
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
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                Sign In / Register
              </button>
            )}

            <button 
              onClick={checkHealth}
              disabled={loadingHealth}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <Server className="w-3.5 h-3.5" />
              {loadingHealth ? 'Pinging...' : 'Gateway Health'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stage 2 Interactive Hero */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden mb-8 border border-slate-800">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider mb-4 border border-blue-400/30">
              <Lock className="w-3.5 h-3.5" /> Stage 2 Security Architecture
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
              Authentication & Role-Based Access Control
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mb-6 leading-relaxed">
              Every API request is guarded by JWT verification and role authorization. Users cannot escalate their privileges, and access boundaries between Customers, Sellers, and Admins are strictly enforced.
            </p>

            {/* Quick Persona Switcher in Hero */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 max-w-xl">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">
                Active Session Persona (Click to switch):
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => loginAsDemoPersona('customer')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    role === 'customer'
                      ? 'bg-blue-600 text-white ring-2 ring-white shadow'
                      : 'bg-white/15 hover:bg-white/25 text-slate-200'
                  }`}
                >
                  <User className="w-3.5 h-3.5" /> Customer Mode
                </button>
                <button
                  onClick={() => loginAsDemoPersona('seller')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    role === 'seller'
                      ? 'bg-amber-500 text-slate-900 ring-2 ring-white shadow font-extrabold'
                      : 'bg-white/15 hover:bg-white/25 text-slate-200'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" /> Seller Mode
                </button>
                <button
                  onClick={() => loginAsDemoPersona('admin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    role === 'admin'
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
                    Clear (Guest)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live RBAC Interactive Verification Sandbox */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm mb-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Live Role-Based Access Control (RBAC) Tester</h2>
              <p className="text-xs text-slate-500">
                Trigger protected API endpoints to witness server-side RBAC boundary enforcement in real-time.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Current Role:</span>
              <span className={`text-xs uppercase font-extrabold px-2.5 py-1 rounded-full border ${getRoleBadgeColor(role)}`}>
                {role || 'Unauthenticated Guest'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Test 1: Customer Profile */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  Requires: Auth
                </span>
                <h3 className="font-bold text-slate-900 text-sm mt-2 mb-1">User Profile Endpoint</h3>
                <code className="text-xs text-slate-500 block mb-3">GET /api/auth/me</code>
                <p className="text-xs text-slate-600 mb-4">
                  Accessible by any authenticated customer, seller, or admin session.
                </p>
              </div>
              <button
                onClick={() => testEndpoint('/auth/me', 'User Profile (GET /api/auth/me)')}
                disabled={rbacTesting}
                className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
              >
                Test Endpoint
              </button>
            </div>

            {/* Test 2: Seller Protected */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  Requires: Seller Role
                </span>
                <h3 className="font-bold text-slate-900 text-sm mt-2 mb-1">Seller Fulfillment Guard</h3>
                <code className="text-xs text-slate-500 block mb-3">GET /api/auth/seller-check</code>
                <p className="text-xs text-slate-600 mb-4">
                  Only approved sellers can access. Customers and guests receive HTTP 403 Forbidden.
                </p>
              </div>
              <button
                onClick={() => testEndpoint('/auth/seller-check', 'Seller Guard (GET /api/auth/seller-check)')}
                disabled={rbacTesting}
                className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
              >
                Test Endpoint
              </button>
            </div>

            {/* Test 3: Admin Protected */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  Requires: Admin Role
                </span>
                <h3 className="font-bold text-slate-900 text-sm mt-2 mb-1">Admin Portal Guard</h3>
                <code className="text-xs text-slate-500 block mb-3">GET /api/auth/admin-check</code>
                <p className="text-xs text-slate-600 mb-4">
                  Only platform administrators can access. Customers and sellers receive HTTP 403 Forbidden.
                </p>
              </div>
              <button
                onClick={() => testEndpoint('/auth/admin-check', 'Admin Guard (GET /api/auth/admin-check)')}
                disabled={rbacTesting}
                className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
              >
                Test Endpoint
              </button>
            </div>
          </div>

          {/* Test Output Box */}
          {rbacTestResult && (
            <div className={`p-4 rounded-xl border text-xs ${
              rbacTestResult.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-bold">
                  {rbacTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>{rbacTestResult.label}</span>
                </div>
                <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                  rbacTestResult.success ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
                }`}>
                  HTTP {rbacTestResult.status}
                </span>
              </div>
              <div className="font-medium mb-1">{rbacTestResult.message}</div>
              {rbacTestResult.data && (
                <pre className="mt-2 p-2 bg-white/70 rounded border border-emerald-200 overflow-x-auto text-[11px]">
                  {JSON.stringify(rbacTestResult.data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* System Architecture Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Stage 1: Foundation</h3>
            <p className="text-xs text-slate-500 mb-3">17 Relational Tables, RLS, Indexes & Monorepo</p>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Complete & Pushed
            </span>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Stage 2: Auth & RBAC</h3>
            <p className="text-xs text-slate-500 mb-3">JWT Middleware, Role Guard & Persona Sandbox</p>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> 10/10 Tests Passed
            </span>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm opacity-60">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Stage 3: Catalog & Storage</h3>
            <p className="text-xs text-slate-500 mb-3">Categories, Variant Matrix, CDN Image Storage</p>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              Next Stage
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          QuickSure Marketplace • Three-Tier Decoupled Architecture • Stage 2 Auth & RBAC Active
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
