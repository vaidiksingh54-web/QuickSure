import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Lock, Mail, User, ShieldCheck, Store, UserCheck, AlertCircle, Loader2 } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register, loginAsDemoPersona, loading, error } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [localError, setLocalError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        if (!fullName.trim()) {
          setLocalError('Please enter your full name');
          return;
        }
        await register(email, password, fullName);
      }
      onClose();
    } catch (err) {
      setLocalError(err.message || 'Authentication failed');
    }
  };

  const handleDemoLogin = async (role) => {
    setLocalError(null);
    await loginAsDemoPersona(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 relative">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">QuickSure Account</span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => { setTab('login'); setLocalError(null); }}
              className={`pb-2 px-4 text-sm font-semibold border-b-2 transition-colors ${
                tab === 'login'
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab('register'); setLocalError(null); }}
              className={`pb-2 px-4 text-sm font-semibold border-b-2 transition-colors ${
                tab === 'register'
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {(localError || error) && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{localError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Vaidik Singh"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {tab === 'login' ? 'Sign In to QuickSure' : 'Create Customer Account'}
            </button>
          </form>

          {/* Quick Demo Personas (Instant Testing Mode) */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
              Fast Testing Persona Switcher
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('customer')}
                className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700 transition-all text-xs font-semibold"
              >
                <UserCheck className="w-4 h-4 text-blue-600 mb-1" />
                Customer
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('seller')}
                className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-slate-200 hover:border-amber-500 hover:bg-amber-50 text-slate-700 transition-all text-xs font-semibold"
              >
                <Store className="w-4 h-4 text-amber-600 mb-1" />
                Seller
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-slate-700 transition-all text-xs font-semibold"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600 mb-1" />
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
