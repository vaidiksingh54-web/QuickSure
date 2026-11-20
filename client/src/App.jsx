import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Zap, 
  Server, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Layers,
  ArrowRight
} from 'lucide-react';
import api from './services/api';

export default function App() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/health');
      setHealth(res.data);
    } catch (err) {
      setError(err.message || 'Failed to connect to API Gateway');
    } finally {
      setLoading(false);
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
            Stage 1: Architecture & Foundation Live
          </div>
        </div>
      </div>

      {/* Main Header / Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="QuickSure Logo" className="h-12 w-auto" />
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={checkHealth}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200"
            >
              <Server className="w-4 h-4" />
              {loading ? 'Checking...' : 'Ping API Gateway'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden mb-10">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-bold uppercase tracking-wider mb-4 border border-white/20">
              <Zap className="w-3.5 h-3.5 fill-amber-300" /> Multi-Category Marketplace
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
              Speed & Security Delivered.
            </h1>
            <p className="text-blue-100 text-base sm:text-lg mb-6 leading-relaxed">
              QuickSure combines high-density product discovery, multi-seller sub-order splitting, and atomic inventory control into a seamless marketplace experience.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-sm font-semibold bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" /> 17 Relational Tables Ready
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Three-Tier Decoupled Gateway
              </div>
            </div>
          </div>

          {/* Background Decorative Rings */}
          <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute right-20 -bottom-20 w-80 h-80 rounded-full bg-amber-400/10 pointer-events-none" />
        </div>

        {/* System Architecture Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Tier 1: Frontend SPA */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Tier 1: Frontend Client</h3>
            <p className="text-sm text-slate-600 mb-4">
              React 19 + Vite SPA with Tailwind CSS, Lucide icons, and responsive layouts.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full w-fit">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active & Operational
            </div>
          </div>

          {/* Tier 2: Backend Gateway */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Server className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Tier 2: Express Gateway</h3>
            <p className="text-sm text-slate-600 mb-4">
              Authoritative pricing, atomic inventory locking, rate limiting, and Zod validation.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full w-fit">
              <CheckCircle2 className="w-3.5 h-3.5" /> Port 5000 Ready
            </div>
          </div>

          {/* Tier 3: Database & Cloud Services */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Tier 3: Supabase PostgreSQL</h3>
            <p className="text-sm text-slate-600 mb-4">
              17 normalized tables with foreign keys, RLS security policies, and automated triggers.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full w-fit">
              <CheckCircle2 className="w-3.5 h-3.5" /> Migrations Authored
            </div>
          </div>
        </div>

        {/* Live API Health Monitor Section */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">API Gateway Handshake Monitor</h2>
              <p className="text-xs text-slate-500">Live communication test between React Client and Express Gateway</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${health ? 'bg-emerald-50 text-emerald-700' : error ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
              {health ? 'CONNECTED' : error ? 'DISCONNECTED' : 'CHECKING'}
            </span>
          </div>

          {loading && (
            <div className="py-6 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Pinging Express API at <code className="bg-slate-100 px-1 py-0.5 rounded">/api/health</code>...
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
              <div>
                <div className="font-bold">Gateway Connection Alert</div>
                <div>{error}</div>
                <div className="text-xs text-rose-600 mt-1">Make sure the Express server is running on port 5000.</div>
              </div>
            </div>
          )}

          {health && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Service</span>
                <p className="text-sm font-bold text-slate-900">{health.service}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Status</span>
                <p className="text-sm font-bold text-emerald-600">Operational</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Uptime</span>
                <p className="text-sm font-bold text-slate-900">{Math.floor(health.uptime)} seconds</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">DB Latency</span>
                <p className="text-sm font-bold text-blue-600">{health.database?.latencyMs || 0} ms</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          QuickSure Marketplace • Three-Tier Decoupled Architecture • Stage 1 Initialized
        </div>
      </footer>
    </div>
  );
}
