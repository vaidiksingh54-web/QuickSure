import React from 'react';
import { Filter, RotateCcw, Star, Check } from 'lucide-react';

const PRICE_PRESETS = [
  { label: 'All Prices', min: '', max: '' },
  { label: 'Under ₹1,000', min: '0', max: '1000' },
  { label: '₹1,000 - ₹2,000', min: '1000', max: '2000' },
  { label: '₹2,000 - ₹3,000', min: '2000', max: '3000' },
  { label: 'Above ₹3,000', min: '3000', max: '' },
];

export default function ProductFilterSidebar({
  categories = [],
  selectedCategory,
  onSelectCategory,
  minPrice,
  maxPrice,
  onPriceChange,
  sortBy,
  onSortChange,
  inStockOnly,
  onInStockToggle,
  onResetFilters,
}) {
  return (
    <aside className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center space-x-2 text-gray-900 font-bold">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span>Faceted Filters</span>
        </div>
        <button
          onClick={onResetFilters}
          className="inline-flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset All</span>
        </button>
      </div>

      {/* Sort By Filter */}
      <div className="space-y-2">
        <label htmlFor="filter-sort" className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Sort Results
        </label>
        <select
          id="filter-sort"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full text-sm rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 bg-gray-50/50"
        >
          <option value="featured">Featured / Best Matches</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Highest Customer Rating</option>
          <option value="newest">Newest Arrivals</option>
        </select>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Categories</div>
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          <button
            onClick={() => onSelectCategory('')}
            className={`w-full text-left text-xs px-2.5 py-1.5 rounded-md flex items-center justify-between transition-colors ${
              !selectedCategory ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>All Categories</span>
            {!selectedCategory && <Check className="w-3.5 h-3.5 text-indigo-600" />}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className={`w-full text-left text-xs px-2.5 py-1.5 rounded-md flex items-center justify-between transition-colors ${
                selectedCategory === cat.slug ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="truncate">{cat.name}</span>
              {selectedCategory === cat.slug && <Check className="w-3.5 h-3.5 text-indigo-600" />}
            </button>
          ))}
        </div>
      </div>

      {/* Price Presets */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Price Range (₹)</div>
        <div className="space-y-1">
          {PRICE_PRESETS.map((preset, idx) => {
            const isSelected = minPrice === preset.min && maxPrice === preset.max;
            return (
              <button
                key={idx}
                onClick={() => onPriceChange(preset.min, preset.max)}
                className={`w-full text-left text-xs px-2.5 py-1.5 rounded-md flex items-center justify-between transition-colors ${
                  isSelected ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{preset.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
              </button>
            );
          })}
        </div>

        {/* Custom Price Inputs */}
        <div className="pt-2 flex items-center space-x-2">
          <input
            type="number"
            placeholder="Min ₹"
            value={minPrice}
            onChange={(e) => onPriceChange(e.target.value, maxPrice)}
            className="w-1/2 text-xs rounded-md border-gray-300 py-1.5 px-2 bg-gray-50/50"
          />
          <span className="text-gray-400 text-xs">-</span>
          <input
            type="number"
            placeholder="Max ₹"
            value={maxPrice}
            onChange={(e) => onPriceChange(minPrice, e.target.value)}
            className="w-1/2 text-xs rounded-md border-gray-300 py-1.5 px-2 bg-gray-50/50"
          />
        </div>
      </div>

      {/* Stock Availability Toggle */}
      <div className="pt-2 border-t border-gray-100">
        <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => onInStockToggle(e.target.checked)}
            className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-gray-300"
          />
          <span className="font-medium">In Stock Items Only</span>
        </label>
      </div>
    </aside>
  );
}
