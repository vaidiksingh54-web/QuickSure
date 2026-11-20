# QuickSure – UI/UX Design System & Component Guidelines

**Document Version:** 1.0.0  
**Status:** DESIGN SYSTEM SPECIFICATION  
**Target:** React 19 + Tailwind CSS + Lucide Icons  

---

## 1. Design Philosophy & Aesthetic Principles

QuickSure balances the utility, high information density, and transactional clarity of Amazon/Flipkart with the visual cleanliness and polish of modern Tailwind-driven design.
- **Clarity Over Clutter:** Clean white backgrounds, crisp borders, and deliberate negative space. Product imagery is the hero.
- **Instant Feedback:** Buttons display loading spinners, quantities change with instant optimistic updates, and toasts provide non-intrusive feedback.
- **High Affordance:** Clickable elements have clear hover, active, and focus-visible states with accessible contrast ratios (WCAG AA compliant).

---

## 2. Color Palette & Semantic Tokens

```
Primary Brand (Indigo):      #4F46E5 (indigo-600) | Hover: #4338CA (indigo-700)
Accent / Action (Amber):     #F59E0B (amber-500)  | Hover: #D97706 (amber-600)
Success State (Emerald):     #10B981 (emerald-500)
Warning State (Amber):       #F59E0B (amber-500)
Danger / Error (Rose):       #F43F5E (rose-500)
Background Canvas:           #F8FAFC (slate-50)   | Surface Card: #FFFFFF (white)
Border Lines:                #E2E8F0 (slate-200)  | Subtle Border: #F1F5F9 (slate-100)
Text Primary:                #0F172A (slate-900)  | Text Secondary: #64748B (slate-500)
```

### 2.1 Functional Application
- **Primary CTA ("Add to Cart", "Place Order"):** Indigo `#4F46E5` with crisp white text.
- **Secondary CTA ("Buy Now", Flash Deals):** Amber `#F59E0B` to drive urgency.
- **Stock Indicators:**
  - `In Stock`: Emerald `#10B981` (e.g. `bg-emerald-50 text-emerald-700 border-emerald-200`).
  - `Low Stock (<= 5 units)`: Amber `#F59E0B` (e.g. `bg-amber-50 text-amber-700 border-amber-200`).
  - `Out of Stock`: Rose `#F43F5E` (e.g. `bg-rose-50 text-rose-700 border-rose-200`).

---

## 3. Typography & Spacing System

- **Font Family:** `Inter`, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif.
- **Type Scale:**
  - `Display / Hero Title`: 32px / 36px (`text-3xl sm:text-4xl font-extrabold tracking-tight`)
  - `Section Heading (h2)`: 24px / 28px (`text-2xl font-bold text-slate-900`)
  - `Card / Component Title (h3)`: 18px / 20px (`text-lg font-semibold text-slate-900`)
  - `Body Regular`: 14px / 16px (`text-sm sm:text-base text-slate-600`)
  - `Caption & Metadata`: 12px / 14px (`text-xs text-slate-500`)
- **Spacing Scale:** Standard 4px baseline grid (`p-2`, `p-4`, `p-6`, `p-8`, `gap-4`, `gap-6`).
- **Border Radius:**
  - Cards & Modals: `rounded-xl` (12px)
  - Buttons & Inputs: `rounded-lg` (8px)
  - Badges & Pills: `rounded-full` (9999px)

---

## 4. Atomic Component Specifications

### 4.1 Buttons
- **Primary:** `bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`
- **Secondary / Outline:** `border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2.5 px-4 rounded-lg transition-all`
- **Disabled State:** `opacity-50 cursor-not-allowed pointer-events-none`
- **Loading State:** Displays inline animated spinner with text hidden or shifted.

### 4.2 Form Inputs
- **Base Input:** `w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all`
- **Error Input:** `border-rose-400 focus:border-rose-500 focus:ring-rose-100`

### 4.3 Product Card
- Structure:
  - 1:1 aspect ratio image container with subtle gray background (`bg-slate-50`) and image hover zoom (`hover:scale-105 transition-transform duration-300`).
  - Discount tag overlay in top-left corner (`bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded`).
  - Wishlist heart icon button in top-right corner.
  - Category / Brand label in light muted uppercase (`text-xs text-slate-500 font-medium tracking-wide`).
  - Product title truncated to 2 lines (`line-clamp-2 text-slate-900 font-medium text-sm`).
  - Star rating badge + review count (`text-amber-500 flex items-center gap-1 text-xs`).
  - Pricing row: Bold sale price (`text-base font-bold text-slate-900`) alongside strike-through compare price (`text-xs text-slate-400 line-through`).
  - "Add to Cart" quick-add button.

### 4.4 Modals & Slide-out Drawers
- Overlay: `fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity`
- Modal Card: `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg z-50`
- Cart Drawer: `fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col`

---

## 5. Responsive Breakpoint Guidelines

- **Mobile (< 640px):** Single-column layout, bottom sticky bar for checkout actions, filter drawer, hamburger menu.
- **Tablet (640px - 1024px):** 2-column or 3-column product grid, collapsible sidebars.
- **Desktop (1024px+):** 4-column product grid, persistent left-hand filter sidebar, expanded mega-menu navigation.
