import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  CreditCard, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Zap, 
  ArrowRight 
} from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    title: 'Supercharge Your Audio Experience',
    subtitle: 'SonicPro Wireless ANC Headphones with 40-hr battery',
    badge: 'Limited Time Deal • 50% Off',
    cta: 'Shop Electronics',
    category: 'electronics',
    bgGradient: 'from-indigo-900 via-indigo-800 to-slate-900',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    coupon: 'Use code QUICK100 for ₹100 instant discount',
  },
  {
    id: 2,
    title: 'Pure Organic Cotton Classics',
    subtitle: 'Breathable Oxford Weave Shirts crafted for effortless style',
    badge: 'Summer Drop • Buy 1 Get Flat 40% Off',
    cta: 'Explore Fashion',
    category: 'fashion',
    bgGradient: 'from-amber-900 via-stone-800 to-slate-900',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80',
    coupon: 'Free express shipping on all fashion orders',
  },
  {
    id: 3,
    title: 'Modern Culinary Innovations',
    subtitle: 'TurboMix 750W Heavy-Duty Copper Grinders & Smart Kitchen Gear',
    badge: 'Home & Kitchen Fest',
    cta: 'Upgrade Kitchen',
    category: 'home-living',
    bgGradient: 'from-teal-900 via-emerald-800 to-slate-900',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80',
    coupon: 'Direct 1-Year Brand Replacement Guarantee',
  },
];

export default function HeroBanner({ onSelectCategory }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);

  const active = SLIDES[currentSlide];

  return (
    <div className="mb-8">
      {/* Main Hero Slider */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl bg-slate-900">
        <div className={`relative min-h-[380px] sm:min-h-[420px] bg-gradient-to-r ${active.bgGradient} transition-all duration-700 flex items-center`}>
          <div className="max-w-7xl mx-auto px-6 sm:px-10 py-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full">
            <div className="space-y-4 text-white z-10">
              <div className="inline-flex items-center space-x-2 bg-indigo-500/20 backdrop-blur-sm border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold text-indigo-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{active.badge}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                {active.title}
              </h1>
              <p className="text-sm sm:text-base text-gray-200 max-w-lg leading-relaxed">
                {active.subtitle}
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => onSelectCategory(active.category)}
                  className="inline-flex items-center space-x-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-95"
                >
                  <span>{active.cta}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div className="text-xs bg-white/10 backdrop-blur-md border border-white/10 px-3 py-2 rounded-lg text-gray-300">
                  ⚡ {active.coupon}
                </div>
              </div>
            </div>

            <div className="hidden md:flex justify-end items-center relative">
              <div className="relative w-80 h-80 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10">
                <img
                  src={active.image}
                  alt={active.title}
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-xs transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-xs transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Slide Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${
                  idx === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Trust Highlights Grid */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center space-x-3 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-900">100% Genuine</div>
            <div className="text-[11px] text-gray-500">Verified Direct Sellers</div>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-900">Express Delivery</div>
            <div className="text-[11px] text-gray-500">Fast pan-India dispatch</div>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-900">7-Day Free Returns</div>
            <div className="text-[11px] text-gray-500">Hassle-free doorstep pickup</div>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-900">Secure Payments</div>
            <div className="text-[11px] text-gray-500">Instant UPI & 256-bit SSL</div>
          </div>
        </div>
      </div>
    </div>
  );
}
