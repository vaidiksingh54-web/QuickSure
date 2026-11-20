import React from 'react';
import { ShieldCheck, Truck, RotateCcw, Heart, Mail, ExternalLink } from 'lucide-react';

export default function Footer({ onSelectCategory }) {
  return (
    <footer className="bg-slate-900 text-gray-300 border-t border-slate-800 mt-16">
      {/* Top Banner Guarantees */}
      <div className="border-b border-slate-800/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">100% Genuine Guaranteed</div>
              <div className="text-xs text-gray-400">Direct verified vendors only</div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Reliable Pan-India Delivery</div>
              <div className="text-xs text-gray-400">Real-time parcel tracking</div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">7-Day Free Replacement</div>
              <div className="text-xs text-gray-400">Doorstep pickups on returns</div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">256-Bit SSL Encrypted</div>
              <div className="text-xs text-gray-400">Zero fraud payment security</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
        {/* Brand Summary */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md">
              Q
            </div>
            <span className="text-xl font-black text-white tracking-tight">QuickSure</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
            India's high-speed multi-seller marketplace. Connect with top verified merchants, discover authentic branded items, and enjoy atomic split-order fulfillment.
          </p>
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <span>Powered by PostgreSQL 15 & React 19</span>
          </div>
        </div>

        {/* Categories Directory */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Popular Categories</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => onSelectCategory('electronics')} className="hover:text-indigo-400 transition-colors">
                Electronics & Audio
              </button>
            </li>
            <li>
              <button onClick={() => onSelectCategory('fashion')} className="hover:text-indigo-400 transition-colors">
                Men & Women Fashion
              </button>
            </li>
            <li>
              <button onClick={() => onSelectCategory('home-living')} className="hover:text-indigo-400 transition-colors">
                Home & Appliances
              </button>
            </li>
            <li>
              <button onClick={() => onSelectCategory('sports')} className="hover:text-indigo-400 transition-colors">
                Sports & Fitness
              </button>
            </li>
          </ul>
        </div>

        {/* Customer Care */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Customer Support</h4>
          <ul className="space-y-2 text-xs">
            <li><a href="#orders" className="hover:text-indigo-400 transition-colors">Track Orders</a></li>
            <li><a href="#shipping" className="hover:text-indigo-400 transition-colors">Shipping & Delivery</a></li>
            <li><a href="#returns" className="hover:text-indigo-400 transition-colors">Return Policy</a></li>
            <li><a href="#faq" className="hover:text-indigo-400 transition-colors">Help Center & FAQ</a></li>
          </ul>
        </div>

        {/* Sell with Us */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Partner With Us</h4>
          <ul className="space-y-2 text-xs">
            <li><a href="#seller" className="hover:text-indigo-400 transition-colors">Seller Registration</a></li>
            <li><a href="#fulfillment" className="hover:text-indigo-400 transition-colors">Fulfillment by QuickSure</a></li>
            <li><a href="#commissions" className="hover:text-indigo-400 transition-colors">Commission Structure</a></li>
            <li><a href="#policy" className="hover:text-indigo-400 transition-colors">Merchant Code of Conduct</a></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800 py-6 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            &copy; {new Date().getFullYear()} QuickSure Marketplace Inc. All rights reserved.
          </div>
          <div className="flex items-center space-x-4">
            <span className="hover:text-gray-400 cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-gray-400 cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-gray-400 cursor-pointer">Security Safeguards</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
