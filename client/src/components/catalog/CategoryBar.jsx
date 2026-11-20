import React from 'react';
import { 
  Headphones, 
  Shirt, 
  Home, 
  Sparkles, 
  Dumbbell, 
  Smartphone, 
  Watch, 
  Grid 
} from 'lucide-react';

const CATEGORY_ICONS = {
  'electronics': Smartphone,
  'audio-headphones': Headphones,
  'smartphones-wearables': Watch,
  'fashion': Shirt,
  'men-fashion': Shirt,
  'home-living': Home,
  'kitchen-appliances': Home,
  'beauty': Sparkles,
  'sports': Dumbbell,
};

export default function CategoryBar({ 
  categories = [], 
  selectedCategory = '', 
  onSelectCategory 
}) {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-16 z-30 shadow-xs" aria-label="Product Categories">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2 py-2.5 overflow-x-auto scrollbar-none text-sm font-medium">
          <button
            onClick={() => onSelectCategory('')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
              !selectedCategory
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>All Categories</span>
          </button>

          {categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.slug] || Grid;
            const isSelected = selectedCategory === cat.slug;

            return (
              <div key={cat.id} className="relative group shrink-0">
                <button
                  onClick={() => onSelectCategory(cat.slug)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.name}</span>
                </button>

                {/* Subcategory dropdown on hover */}
                {cat.subcategories && cat.subcategories.length > 0 && (
                  <div className="hidden group-hover:block absolute left-0 top-full pt-1 z-40 min-w-[200px]">
                    <div className="bg-white rounded-lg shadow-lg border border-gray-100 py-1 text-xs">
                      {cat.subcategories.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCategory(sub.slug);
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-indigo-50 hover:text-indigo-600 transition-colors ${
                            selectedCategory === sub.slug ? 'font-semibold text-indigo-600 bg-indigo-50/50' : 'text-gray-700'
                          }`}
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
