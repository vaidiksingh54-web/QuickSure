# QuickSure – Multi-Category E-Commerce Marketplace
## Master Implementation Plan

> **Protocol Notice:** Plan initialized under `writing-plans`. Execution remains locked until explicit user authorization (`Proceed` / execute command).
> **Execution Sub-Skill:** Use `superpowers:executing-plans` or `superpowers:subagent-driven-development` when triggered.

---

### Project Overview
- **Project Name:** QuickSure
- **Product Type:** Multi-Category E-Commerce Marketplace (Customer Storefront + Admin Dashboard + Seller Dashboard + Backend REST API + Supabase PostgreSQL)
- **Scale:** Medium-sized Full-Stack Application
- **Architecture:** Decoupled Client-Server Monorepo
  - **Frontend:** React 19 / Vite, Tailwind CSS, Lucide Icons, React Router DOM, TanStack Query / Axios, Zustand (State Management)
  - **Backend API:** Node.js (v20+), Express.js, TypeScript/ESM, Zod, Helmet, Morgan, CORS, `@supabase/supabase-js`
  - **Database & Auth & Storage:** Supabase (PostgreSQL 15+, Supabase Auth with Row Level Security, Supabase Storage for media)
  - **Deployment Targets:** Frontend on Vercel, Backend API on Render, Database & Storage on Supabase
- **Simulation Mode Policy:** All payment processing, delivery dispatching/tracking events, and seller revenue payouts are implemented in simulation mode with full state lifecycles and realistic audit logs until production gateway integrations are attached.

---

### Monorepo Structure Blueprint

```
QuickSure/
├── .github/
│   └── workflows/
│       └── ci.yml
├── client/                     # Frontend React + Vite
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/         # Button, Input, Modal, Badge, Toast, Loader
│   │   │   ├── layout/         # Navbar, Footer, MegaMenu, MobileNav, DashboardLayout
│   │   │   ├── product/        # ProductCard, ProductGrid, ImageGallery, FilterSidebar, SortDropdown
│   │   │   ├── cart/           # CartDrawer, CartItemRow, OrderSummaryBox, CouponInput
│   │   │   ├── checkout/       # AddressSelector, DeliveryMethod, MockPaymentForm
│   │   │   ├── admin/          # MetricCard, SalesChart, DataTable, StatusBadge
│   │   │   └── seller/         # InventoryEditor, OrderActionModal, PayoutOverview
│   │   ├── context/            # AuthContext, ThemeContext, CartContext, WishlistContext
│   │   ├── hooks/              # useAuth, useCart, useProducts, useDebounce, useLocalStorage
│   │   ├── pages/
│   │   │   ├── storefront/     # Home, ProductList, ProductDetail, Cart, Wishlist, Checkout, OrderSuccess
│   │   │   ├── auth/           # Login, Register, ForgotPassword, ResetPassword
│   │   │   ├── account/        # Profile, Orders, Addresses, Notifications
│   │   │   ├── admin/          # AdminOverview, AdminProducts, AdminOrders, AdminUsers, AdminCoupons
│   │   │   └── seller/         # SellerDashboard, SellerProducts, SellerOrders, SellerAnalytics
│   │   ├── routes/             # AppRoutes, ProtectedRoute, RoleRoute
│   │   ├── services/           # api.js (Axios client), authService, productService, orderService
│   │   ├── types/
│   │   ├── utils/              # currencyFormatter, dateHelper, validationSchemas
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
├── server/                     # Backend REST API
│   ├── src/
│   │   ├── config/             # supabase.js, env.js, corsConfig.js
│   │   ├── controllers/        # auth, product, category, cart, order, review, admin, seller
│   │   ├── middlewares/        # authMiddleware, requireRole, errorHandler, rateLimiter, validate
│   │   ├── routes/             # authRoutes, productRoutes, categoryRoutes, orderRoutes, etc.
│   │   ├── services/           # mockPaymentService, orderService, inventoryService, emailSimulator
│   │   ├── validators/         # zod schemas for payloads
│   │   ├── utils/              # apiResponse.js, logger.js, constants.js
│   │   └── app.js              # Express app entry
│   ├── server.js               # HTTP listener
│   ├── package.json
│   ├── tsconfig.json (or jsconfig.json)
│   └── .env.example
├── supabase/                   # Database migrations & seed scripts
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   ├── 003_functions_and_triggers.sql
│   │   └── 004_indexes_and_constraints.sql
│   └── seed/
│       └── demo_data.sql
├── docs/
│   └── plans/
│       └── 2026-11-20-quicksure-implementation-plan.md
└── package.json                # Root orchestration workspace scripts
```

---

## Complete Phased Implementation Roadmap

### Phase 1: Project Foundation & Environment Setup
- **Task 1.1: Root Workspace & Monorepo Initialization**
  - Initialize root `package.json` with npm/yarn workspaces (`client`, `server`) and concurrent dev runner scripts (`npm run dev:all`).
  - Configure `.gitignore`, `.editorconfig`, and standard linting/formatting rules.
- **Task 1.2: Client Scaffolding (React + Vite + Tailwind CSS)**
  - Initialize Vite app with React template in `/client`.
  - Install core dependencies: `react-router-dom`, `lucide-react`, `axios`, `@tanstack/react-query`, `zustand`, `clsx`, `tailwind-merge`.
  - Configure Tailwind CSS v3/v4 with custom theme tokens (QuickSure brand palette: Primary Indigo `#4F46E5`, Amber Accent `#F59E0B`, Slate neutrals).
  - Setup `.env.example` (`VITE_API_URL=http://localhost:5000/api`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- **Task 1.3: Server Scaffolding (Node.js + Express API)**
  - Initialize Node.js ESM server in `/server`.
  - Install dependencies: `express`, `cors`, `helmet`, `morgan`, `dotenv`, `@supabase/supabase-js`, `zod`, `express-rate-limit`.
  - Establish modular folders: `routes/`, `controllers/`, `middlewares/`, `services/`, `config/`, `utils/`.
  - Create standardized API Response format `{ success: true, message: "", data: ... }` and global error handling middleware.
- **Task 1.4: Base Health Check & Communication Test**
  - Implement `GET /api/health` returning server status, database latency, and timestamp.
  - Wire frontend Axios base instance with baseURL, interceptors, and error handlers to successfully ping backend.

---

### Phase 2: UI/UX & Frontend Development
- **Task 2.1: Design System & Core Components**
  - Build reusable UI primitives: `Button` (variants: primary, secondary, outline, ghost, danger), `Input`, `Select`, `Modal`, `Badge`, `Spinner`, `ToastNotification`, `DropdownMenu`.
  - Setup responsive layout shell: Header, Top announcement bar, Main container, Sticky Mobile Bottom Bar, Footer.
- **Task 2.2: Responsive Header & Category Mega-Menu**
  - Desktop: Logo, Search input with auto-suggest dropdown, Category mega-menu, Currency/Language selector, Wishlist counter, Cart drawer toggle, User profile dropdown.
  - Mobile: Hamburger drawer menu, collapsible category accordion, bottom navigation bar (Home, Categories, Wishlist, Cart, Profile).
- **Task 2.3: Homepage Construction**
  - Hero carousel with responsive promotional banners and CTAs.
  - Category icon grid (Electronics, Fashion, Home, Beauty, Sports, Books).
  - Featured / Trending products slider.
  - Flash Sale section with animated real-time countdown timer.
  - Trust badge banner (Free delivery simulation, 24/7 support, Buyer protection, Easy returns).
  - Newsletter subscription box.
- **Task 2.4: Product Listing Page (PLP) & Filtering Engine**
  - Dynamic breadcrumb navigation (`Home > Electronics > Audio`).
  - Left sidebar filters: Category multi-select, Price range slider, Brand checkboxes, Customer rating filter (4★ & above), In-stock toggle.
  - Active filter badges with "Clear all" button.
  - Top sort bar: "Featured", "Price: Low to High", "Price: High to Low", "Highest Rated", "Newest Arrivals".
  - Grid / List view toggle switch.
  - Responsive pagination and "Items per page" selector.
- **Task 2.5: Product Detail Page (PDP)**
  - Interactive multi-image gallery with thumbnail switcher and zoom preview.
  - Product title, brand link, star rating preview with review count.
  - Dynamic pricing block with original price, discount percentage badge, and savings calculation.
  - Variant selectors (Color swatch picker, Size selector with size guide modal).
  - Real-time stock availability badge (`In Stock`, `Only 3 left`, `Out of Stock`).
  - Quantity counter selector with minimum/maximum limits.
  - Action buttons: "Add to Cart" (with feedback animation), "Buy Now", "Add to Wishlist".
  - Tabbed information section: Description, Specifications table, Shipping & Returns policy, Customer Reviews breakdown.
- **Task 2.6: Cart & Wishlist Pages**
  - Slide-out Cart Drawer + Full Cart Page (`/cart`).
  - Item listing with thumbnail, variants, price, quantity controls, and delete confirmation.
  - Order summary sidebar: Subtotal, Estimated delivery, Applied discount, Coupon code input field with status feedback, Estimated total.
  - Wishlist page (`/wishlist`): Grid of saved items with "Move all to cart" and individual "Add to cart" buttons.
- **Task 2.7: Authentication & Customer Account Portal**
  - Modal + dedicated pages for Login, Register, Forgot Password, Reset Password.
  - Customer Profile dashboard (`/account/profile`): Personal info, change password.
  - Order History (`/account/orders`): List of orders with statuses (`Pending`, `Processing`, `Delivered`, `Cancelled`), details modal, invoice download.
  - Saved Delivery Addresses (`/account/addresses`): Add/Edit/Delete address cards with default address toggle.

---

### Phase 3: Database Architecture (Supabase PostgreSQL)
- **Task 3.1: Database Schema & Entity Modeling**
  Implement SQL migrations creating 15 core normalized tables:
  1. `profiles`: `id (UUID references auth.users)`, `full_name`, `avatar_url`, `phone`, `role (enum: 'customer','seller','admin')`, `created_at`, `updated_at`.
  2. `categories`: `id (UUID)`, `name`, `slug (unique)`, `description`, `icon_url`, `parent_id (self-ref for subcategories)`, `is_active`.
  3. `sellers`: `id (UUID)`, `user_id (references profiles)`, `store_name`, `store_slug`, `store_description`, `logo_url`, `banner_url`, `status (enum: 'pending','approved','suspended')`, `commission_rate`, `created_at`.
  4. `products`: `id (UUID)`, `seller_id`, `category_id`, `title`, `slug (unique)`, `description`, `base_price`, `sale_price`, `sku`, `stock_quantity`, `is_featured`, `is_active`, `rating_avg`, `rating_count`, `metadata (jsonb)`.
  5. `product_images`: `id (UUID)`, `product_id`, `image_url`, `alt_text`, `is_primary`, `display_order`.
  6. `inventory`: `id (UUID)`, `product_id`, `sku`, `warehouse_location`, `quantity_available`, `quantity_reserved`, `restock_threshold`.
  7. `cart_items`: `id (UUID)`, `user_id`, `product_id`, `variant_selection (jsonb)`, `quantity`, `created_at`.
  8. `wishlists`: `id (UUID)`, `user_id`, `product_id`, `created_at`.
  9. `addresses`: `id (UUID)`, `user_id`, `recipient_name`, `phone`, `street_address`, `apartment`, `city`, `state`, `postal_code`, `country`, `is_default`.
  10. `orders`: `id (UUID)`, `order_number (unique)`, `user_id`, `status (enum: 'pending','processing','shipped','delivered','cancelled')`, `payment_status (enum: 'pending','paid','failed','refunded')`, `subtotal`, `discount_amount`, `shipping_fee`, `total_amount`, `shipping_address (jsonb)`, `tracking_number`, `created_at`.
  11. `order_items`: `id (UUID)`, `order_id`, `product_id`, `seller_id`, `product_title`, `unit_price`, `quantity`, `total_price`, `variant_selection (jsonb)`.
  12. `payments`: `id (UUID)`, `order_id`, `transaction_ref`, `payment_method (enum: 'card_sim','upi_sim','cod_sim')`, `amount`, `currency`, `status`, `payment_response (jsonb)`, `created_at`.
  13. `reviews`: `id (UUID)`, `product_id`, `user_id`, `order_id`, `rating (1-5)`, `title`, `comment`, `is_verified_purchase`, `is_approved`, `created_at`.
  14. `coupons`: `id (UUID)`, `code (unique uppercase)`, `discount_type (enum: 'percentage','fixed')`, `discount_value`, `min_order_amount`, `max_discount_amount`, `usage_limit`, `used_count`, `starts_at`, `expires_at`, `is_active`.
  15. `notifications`: `id (UUID)`, `user_id`, `title`, `message`, `type (enum: 'order','promo','system')`, `is_read`, `created_at`.
- **Task 3.2: Constraints, Foreign Keys & Trigger Functions**
  - Enforce cascading constraints (`ON DELETE CASCADE` for images, cart items; `ON DELETE RESTRICT` for products with orders).
  - Automated `updated_at` trigger across all mutating tables.
  - Profile auto-provision trigger: `ON auth.users AFTER INSERT` creates corresponding `profiles` row with default role `customer`.
- **Task 3.3: Row Level Security (RLS) & Policies**
  - Enable RLS across all 15 tables.
  - Profiles: Users can select/update their own profile; Admins have read/write access.
  - Products & Categories: Public read access for `is_active = true`; Sellers can manage their own products; Admins manage all.
  - Cart, Wishlist, Addresses, Orders: Strictly restricted to `auth.uid() = user_id`, with Admin read access and Seller read access to relevant `order_items`.
  - Database Indexes: B-Tree indexes on `products(slug)`, `products(category_id)`, `products(seller_id)`, `orders(user_id)`, `orders(order_number)`, `reviews(product_id)`.

---

### Phase 4: Authentication & Authorization
- **Task 4.1: Supabase Auth Frontend Integration**
  - Implement `AuthContext` with Supabase client listener (`onAuthStateChange`).
  - Build persistent session synchronization and token refresh.
  - Customer Email + Password registration and login flows with field validation.
  - Google OAuth integration with redirect handling.
  - Password reset request & confirm reset view.
- **Task 4.2: Role-Based Access Control (RBAC)**
  - Roles defined: `customer`, `seller`, `admin`.
  - Frontend Route Guards:
    - `<ProtectedRoute>`: Restricts route to authenticated sessions.
    - `<RoleRoute allowedRoles={['admin']}>`: Restricts to administrative staff.
    - `<RoleRoute allowedRoles={['seller']}>`: Restricts to approved sellers.
- **Task 4.3: Backend Token Verification & Security Middleware**
  - Express middleware `authenticateUser`: Extracts Bearer token, validates JWT via Supabase Admin SDK or Auth API, injects `req.user` (`id`, `email`, `role`).
  - Express middleware `requireRole(...roles)`: Verifies role claim from user profile.
  - Express middleware `requireSellerStatus('approved')`: Checks seller account status before granting inventory operations.

---

### Phase 5: Product Management System
- **Task 5.1: Backend Product & Category REST APIs**
  - Category endpoints: `GET /api/categories`, `POST /api/categories`, `PUT /api/categories/:id`, `DELETE /api/categories/:id`.
  - Product endpoints:
    - `GET /api/products`: Full query engine with search query (`q`), category slug, price bounds (`min_price`, `max_price`), rating filter, sorting (`sort_by`), pagination (`page`, `limit`).
    - `GET /api/products/:slug`: Single product detail with images, category, seller info, and rating summary.
    - `POST /api/products`: Authenticated seller/admin product creation with validation.
    - `PUT /api/products/:id`: Authenticated update with ownership verification.
    - `DELETE /api/products/:id`: Soft delete / status toggling.
- **Task 5.2: Product Image & Media Management**
  - Supabase Storage Bucket setup: `product-images` (public read, authenticated seller write).
  - Backend/Direct client image uploader supporting file type verification (JPEG, PNG, WEBP), file size caps (max 5MB), and auto-generation of display order and primary image flags.
- **Task 5.3: Inventory Tracking & Stock Mechanics**
  - Real-time stock calculation: `quantity_available - quantity_reserved`.
  - Stock threshold alerts when item reaches low stock level.
  - Variant matrix storage (JSON schema containing SKU, size, color, added price differential, and variant-specific inventory).

---

### Phase 6: Shopping Cart & Wishlist System
- **Task 6.1: Dual-Mode Shopping Cart Architecture**
  - Guest Cart: Stored in browser `localStorage`.
  - Authenticated Cart: Stored in PostgreSQL `cart_items` table.
  - Auto-Merge on Login: When a guest logs in, their local cart items seamlessly merge into their server cart without duplicate entries.
- **Task 6.2: Cart Operations & Dynamic Calculation**
  - Add to cart with variant specifications and instant inventory pre-check.
  - Update quantity with stock ceiling protection.
  - Remove item and clear cart functions.
  - Pricing Engine: Real-time calculation of subtotal, product discounts, simulated shipping fees (e.g., Free shipping over \$50, else \$5 standard), and estimated tax.
- **Task 6.3: Coupon Validation Engine**
  - Endpoint `POST /api/coupons/apply`: Validates coupon code existence, active status, date validity, minimum order spend, and user usage limits.
  - Dynamic deduction: Fixed dollar off or percentage off (capped by `max_discount_amount`).
- **Task 6.4: Wishlist System**
  - Instant toggle in product cards and product details.
  - Single-click "Move to Cart" action which adds to cart and removes from wishlist.

---

### Phase 7: Checkout & Order Management (Simulation Mode)
- **Task 7.1: Multi-Step Checkout Flow**
  - Step 1: Delivery Address Selection (choose saved address or enter new address).
  - Step 2: Delivery Option (Standard Shipping simulation, Express simulation).
  - Step 3: Payment Method Selection (Credit Card Simulation, UPI / Instant NetBanking Simulation, Cash on Delivery Simulation).
  - Step 4: Final Review & Order Placement.
- **Task 7.2: Server-Side Price & Inventory Lock**
  - Before order creation, server re-fetches product prices and available stock from database to prevent client tampering.
  - Atomic transaction: Deducts stock from `inventory`, creates `orders` record, creates `order_items` records, clears user's `cart_items`.
- **Task 7.3: Payment Gateway Simulator**
  - Simulated payment processing with realistic delay (1.5s), customizable outcomes (`success`, `insufficient_funds_simulation`, `bank_timeout_simulation`).
  - Records transaction log in `payments` table.
- **Task 7.4: Order Status Machine & Tracking**
  - Status progression: `Pending` ➔ `Confirmed` ➔ `Processing` ➔ `Shipped` ➔ `Delivered`.
  - Tracking timeline interface on the frontend with interactive step visualizer.
  - Order cancellation flow: Permitted while status is `Pending` or `Confirmed`; auto-restores inventory stock upon cancellation.
  - Simulated Return / Refund request mechanism with status updates.
  - Printable / Downloadable HTML/PDF Order Invoice view.

---

### Phase 8: Admin Dashboard
- **Task 8.1: Dedicated Admin Portal (`/admin`)**
  - Sidebar layout: Overview, Products, Categories, Orders, Customers, Sellers, Coupons, Banners, Settings.
- **Task 8.2: Analytics & Metrics Overview**
  - Summary cards: Total Revenue (GMV), Total Orders, Total Customers, Active Sellers.
  - Interactive charts (Revenue over time, Orders by category, Top selling products).
- **Task 8.3: Platform Management Modules**
  - Product Catalog Management: Global view, inspect, approve, feature, or deactivate any product.
  - Category Management: Create, edit, reorder, and upload category icons.
  - Order Management: Global order feed, filter by payment/fulfillment status, override status.
  - User & Seller Moderation: View all profiles, suspend abusive accounts, approve seller applications.
  - Coupon Manager: Create new promotional discount codes with limits and validity dates.
  - Review Moderation: Filter pending/flagged reviews, approve or remove.
  - Homepage Banner Manager: Update hero slider graphics, titles, and target redirect URLs.

---

### Phase 9: Seller Dashboard
- **Task 9.1: Seller Onboarding & Store Setup (`/seller/register`)**
  - Seller application form: Store name, description, business contact, tax ID/simulation details.
  - Status management: Submitted sellers start as `pending` until approved by Admin.
- **Task 9.2: Dedicated Seller Workspace (`/seller`)**
  - Store Overview: Seller sales volume, pending shipments, low stock alerts.
  - Seller Product Management: Add new product with multi-image uploader, variant setup, and description rich-editor. Edit existing listings and pricing.
  - Seller Inventory Control: Batch stock adjustments, track units sold vs units available.
  - Incoming Order Management: View orders containing products sold by this seller; update shipping status (e.g. mark as `Shipped`, assign simulated tracking number).
  - Financial & Payout Summary: Real-time calculation of gross sales, marketplace commission deductions, and net pending payouts (simulation).

---

### Phase 10: Additional Marketplace Features
- **Task 10.1: Ratings, Reviews & Social Proof**
  - Customer review submission modal (accessible only for verified purchases of that item).
  - 1-5 star ratings with title, comment, and verified buyer badge.
  - Rating distribution breakdown bar (e.g., 75% 5-star, 15% 4-star, etc.).
- **Task 10.2: Discovery & Recommendation Features**
  - "Recently Viewed Products" tray stored in browser session.
  - "Related Products" recommendation engine based on shared category and tags.
  - "Product Comparison" tool: Compare up to 4 items side-by-side (specs, price, rating).
  - Flash Sale banner with live countdown timer and discount percent badge.
- **Task 10.3: Customer Support, Notifications & UX Polish**
  - In-app notification center: Updates on order status changes and promotional offers.
  - Expandable FAQ section & customer support contact form.
  - Dark / Light mode theme switcher with persistent preference.
  - Polished empty states for Cart, Wishlist, Search Results, and Orders, plus custom 404 and error boundaries.

---

### Phase 11: Backend & API Integration Standards
- **Task 11.1: RESTful Architecture & Controllers**
  - Modular controller structure matching all domain entities.
  - Request validation using Zod schemas for every `POST`/`PUT` endpoint.
  - Centralized error-handling middleware that catches operational errors and returns predictable JSON payloads.
- **Task 11.2: Pagination, Filtering & Search Standards**
  - Universal pagination helper: default 12 items/page, max 50 items/page, returning `{ data, meta: { total, page, totalPages, hasNext, hasPrev } }`.
  - Secure parameterized queries to Supabase preventing SQL injection.
  - Rate limiting on sensitive routes (auth, checkout, reviews).

---

### Phase 12: Security & Testing Suite
- **Task 12.1: Security Hardening**
  - Helmet HTTP security headers, strict CORS configuration matching frontend URL.
  - Input sanitization against XSS and malicious script payloads.
  - Database Row Level Security validation (verifying customers cannot view other customers' orders or modify products).
- **Task 12.2: Automated & Integration Testing**
  - API endpoint testing with Vitest/Supertest (Auth, Cart calculations, Order creation).
  - Calculation integrity tests: Subtotal, coupon discounts, shipping thresholds, tax logic.
  - Role escalation tests: Verify normal customers cannot access `/api/admin` or `/api/seller` routes.
- **Task 12.3: Cross-Device Responsiveness & Manual Verification**
  - Responsive audit across mobile (375px), tablet (768px), and desktop (1280px+).
  - End-to-end checkout flow verification in simulation mode.

---

### Phase 13: Deployment & Live Production Setup
- **Task 13.1: Backend Deployment on Render**
  - Prepare `render.yaml` / web service settings.
  - Configure environment variables (`NODE_ENV=production`, `PORT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_URL`).
  - Configure keep-alive health check.
- **Task 13.2: Frontend Deployment on Vercel**
  - Configure `vercel.json` with SPA routing rewrites (`{"source": "/(.*)", "destination": "/index.html"}`).
  - Configure production environment variables (`VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
  - Deploy and configure custom domain or Vercel production URL.
- **Task 13.3: Production Verification & Smoke Test**
  - Verify live Supabase database connectivity and RLS rules.
  - Test live authentication (Register, Login, Google Auth).
  - Run full simulated purchase flow on live frontend and confirm order/payment records in live database.

---

### Implementation Phasing & Dependency Flow

```
[Phase 1: Project Foundation]
            │
            ▼
[Phase 3: Database & RLS] ──► [Phase 4: Auth & RBAC]
            │                           │
            ▼                           ▼
[Phase 2: UI/UX System] ───► [Phase 5: Product Catalog]
                                        │
                                        ▼
[Phase 6: Cart & Wishlist] ──► [Phase 7: Checkout & Orders]
                                        │
            ┌───────────────────────────┴───────────────────────────┐
            ▼                                                       ▼
[Phase 8: Admin Dashboard]                                 [Phase 9: Seller Dashboard]
            │                                                       │
            └───────────────────────────┬───────────────────────────┘
                                        ▼
                           [Phase 10: Additional Features]
                                        │
                                        ▼
                           [Phase 11: API Hardening]
                                        │
                                        ▼
                           [Phase 12: Security & Testing]
                                        │
                                        ▼
                           [Phase 13: Cloud Deployment]
```

---

### Decision & Approval Checkpoint
This implementation plan covers all requirements, data structures, UI flows, and backend logic in exact phase order.

**Awaiting user authorization to begin execution.** When ready, inform me to proceed with Phase 1.
