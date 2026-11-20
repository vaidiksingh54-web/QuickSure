import React, { useState } from 'react';
import {
  ShoppingBag,
  Heart,
  User,
  Search,
  Package,
  Store,
  ShieldAlert,
  LogOut,
  LogIn,
  Menu,
  X,
  Sparkles,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function Navbar({
  searchTerm,
  onSearchChange,
  activeView,
  setActiveView,
  onOpenAuth,
  onOpenOrders,
  onOpenAccount,
}) {
  const { user, role, isAuthenticated, logout, loginAsDemoPersona } = useAuth();
  const { totalItemCount, setIsCartOpen, wishlist } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs">
      {/* Top Notification Announcement Bar */}
      <div className="bg-indigo-600 text-white text-[11px] font-medium py-1 px-4 text-center flex items-center justify-center space-x-2">
        <Sparkles className="w-3.5 h-3.5" />
        <span>⚡ Special Launch Offer: Use code <strong className="underline font-bold">QUICK100</strong> for ₹100 instant discount!</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div 
            onClick={() => setActiveView('storefront')}
            className="flex items-center space-x-2.5 cursor-pointer select-none shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-indigo-500/20">
              Q
            </div>
            <div>
              <span className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center">
                Quick<span className="text-indigo-600">Sure</span>
              </span>
              <span className="hidden sm:block text-[10px] text-gray-400 font-semibold tracking-wider uppercase -mt-1">
                Multi-Seller Market
              </span>
            </div>
          </div>

          {/* Search Bar (Desktop & Tablet) */}
          <div className="flex-1 max-w-xl mx-2 hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search over 10,000+ authentic electronics, fashion, and home essentials..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-gray-50/50 transition-all placeholder:text-gray-400"
              />
              {searchTerm && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Persona Switcher & Navigation Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Persona Switcher Quick Select (For verification) */}
            <div className="hidden lg:flex items-center space-x-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => loginAsDemoPersona('customer')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  role === 'customer' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Customer
              </button>
              <button
                onClick={() => loginAsDemoPersona('seller')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  role === 'seller' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Seller
              </button>
              <button
                onClick={() => loginAsDemoPersona('admin')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  role === 'admin' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Admin
              </button>
            </div>

            {/* Admin Portal Toggle */}
            {role === 'admin' && (
              <button
                onClick={() => setActiveView(activeView === 'admin' ? 'storefront' : 'admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  activeView === 'admin'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin Portal</span>
              </button>
            )}

            {/* Seller Hub Toggle */}
            {(role === 'seller' || role === 'admin') && (
              <button
                onClick={() => setActiveView(activeView === 'seller' ? 'storefront' : 'seller')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  activeView === 'seller'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Seller Hub</span>
              </button>
            )}

            {/* My Orders Button */}
            <button
              onClick={onOpenOrders}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative"
              title="My Orders"
              aria-label="My Orders"
            >
              <Package className="w-5 h-5" />
            </button>

            {/* Wishlist */}
            <div className="relative">
              <button
                className="p-2 text-gray-600 hover:text-rose-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Wishlist"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </button>
            </div>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart</span>
              {totalItemCount > 0 && (
                <span className="ml-1 bg-white text-indigo-600 px-1.5 py-0.5 rounded-full text-[10px] font-black">
                  {totalItemCount}
                </span>
              )}
            </button>

            {/* Auth Dropdown / Button */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-1">
                <button
                  onClick={onOpenAccount}
                  className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="My Account & Tax Invoices"
                  aria-label="My Account"
                >
                  <User className="w-5 h-5" />
                </button>
                <button
                  onClick={logout}
                  className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  title={`Logout (${user?.email})`}
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Sign In"
                aria-label="Sign In"
              >
                <LogIn className="w-5 h-5" />
              </button>
            )}

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 bg-gray-50"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
