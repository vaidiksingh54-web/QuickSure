# QuickSure – Project Memory Bank & Context State

**Initialized:** 2026-11-20  
**Current Phase:** Pre-Execution (Governance & Architecture Defined)  
**Next Immediate Action:** Stage 1 Foundation & Database Migration Execution  

---

## 1. Project Overview & Tech Stack

- **Project:** QuickSure – Multi-Category Multi-Seller E-Commerce Marketplace
- **Architecture:** Decoupled Three-Tier Gateway (React ➔ Express ➔ Supabase)
- **Frontend:** React 19 + Vite, Tailwind CSS, Lucide React, Axios, TanStack Query, React Router DOM, Zustand
- **Backend API:** Node.js (v20+), Express.js (ESM), Zod, Helmet, Morgan, CORS, `@supabase/supabase-js`
- **Database & Storage:** Supabase PostgreSQL 15, Supabase Auth, Supabase Storage
- **Deployment:** Vercel (Frontend), Render (Backend API), Supabase Cloud (Data & Storage)
- **Fulfillment Model:** Courier-based parcel delivery simulation (Amazon/Flipkart model)
- **Payment Model:** Deterministic payment simulation engine

---

## 2. Core Architectural Invariants

1. **No Direct Frontend-to-DB Access:** React communicates exclusively with Express REST APIs (`/api/*`). React holds only `VITE_SUPABASE_ANON_KEY` for Supabase Auth tokens.
2. **Authoritative Backend Pricing:** Server calculates prices, taxes, shipping, and coupon discounts from PostgreSQL. Client prices are display-only.
3. **Atomic Stock Decrement:** Concurrency protection using atomic SQL:
   `UPDATE product_variants SET stock_quantity = stock_quantity - $qty WHERE id = $variant_id AND stock_quantity >= $qty`.
4. **Parent-Child Multi-Seller Orders:** Single customer checkout creates 1 parent `orders` record and multiple `sub_orders` partitioned by `seller_id`.
5. **Strict RBAC:** Three roles: `customer`, `seller`, `admin`. Users cannot alter their own role.

---

## 3. Database Schema Overview (17 Tables)

1. `profiles`: User metadata & roles (`customer`, `seller`, `admin`)
2. `addresses`: User shipping & billing address book
3. `sellers`: Merchant store profiles & approval status
4. `categories`: Taxonomy with hierarchical parent-child relationships
5. `products`: Parent product catalog entries
6. `product_variants`: Individual SKUs (size, color, price, stock quantity)
7. `product_images`: Multi-image CDN URLs with primary flag
8. `carts`: Customer cart containers
9. `cart_items`: Variant lines inside customer carts
10. `wishlists`: Customer wishlist container
11. `wishlist_items`: Favorited products
12. `orders`: Parent checkout records (financial payment & delivery address)
13. `sub_orders`: Seller-specific shipments with tracking numbers
14. `order_items`: Snapshot line items per sub-order
15. `payments`: Payment simulation transaction logs
16. `order_status_history`: Timestamped state transition audit logs
17. `coupons` & `coupon_redemptions`: Promotional campaigns and 1-time user redemptions

---

## 4. Directory Structure Blueprint

```
QuickSure/
├── client/                     # Frontend React 19 + Vite
│   ├── public/
│   ├── src/
│   │   ├── components/         # Atomic UI, layout, product, cart, checkout, admin, seller
│   │   ├── context/            # AuthContext, CartContext, WishlistContext
│   │   ├── hooks/              # useAuth, useCart, useProducts
│   │   ├── pages/              # storefront, auth, account, admin, seller
│   │   ├── routes/             # AppRoutes, ProtectedRoute, RoleRoute
│   │   ├── services/           # api.js, authService, productService
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── server/                     # Backend REST API
│   ├── src/
│   │   ├── config/             # supabase.js, env.js
│   │   ├── controllers/        # auth, products, categories, cart, orders, seller, admin
│   │   ├── middlewares/        # requireAuth, requireRole, errorHandler, rateLimiter, validate
│   │   ├── routes/             # authRoutes, productRoutes, orderRoutes, etc.
│   │   ├── services/           # pricingService, orderService, paymentSimulator
│   │   ├── validators/         # zod schemas
│   │   ├── utils/              # apiResponse.js, logger.js
│   │   └── app.js
│   ├── server.js
│   └── package.json
├── supabase/                   # Migrations & Seeds
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   └── 003_triggers_and_indexes.sql
│   └── seed/
│       └── demo_seed.sql
├── docs/                       # Architectural & Planning Artifacts
│   ├── architecture/
│   │   └── system-architecture.md
│   └── plans/
│       └── 2026-11-20-quicksure-implementation-plan.md
├── prd.md                      # Product Requirements Document
├── architecture.md             # System Architecture & Technical Boundaries
├── rules.md                    # Unbreakable Rules & Security Boundaries
├── phases.md                   # Phased Roadmap & Verification Gates
├── design.md                   # UI/UX Design System & Tokens
├── memory.md                   # This project context & memory bank
└── package.json                # Monorepo root workspace runner
```

---

## 5. Development Progress Tracker

| Stage | Description | Status |
| :--- | :--- | :--- |
| **Governance** | PRD, Architecture, Rules, Phases, Design, Memory | ✅ **COMPLETE** |
| **Stage 1** | Foundation & PostgreSQL DB (17 Tables) | ✅ **COMPLETE** (Monorepo, Express Gateway, 17-Table Schema, RLS, Client Vite Scaffolding verified) |
| **Stage 2** | Auth & Role-Based Access Control | ✅ **COMPLETE** (JWT & RBAC Middlewares, 10/10 Tests Passed, AuthContext, Persona Sandbox) |
| **Stage 3** | Backend Catalog & Storage CDN | ✅ **COMPLETE** (Category Tree, Product & Variant Engine, Storage CDN, 14/14 Tests Passed) |
| **Stage 4** | Cart, Pricing & Atomic Concurrency | ⏳ Next Priority |
| **Stage 5** | Multi-Seller Order Splitting & Simulation | ⏳ Queued |
| **Stage 6** | Admin Management Portal | ⏳ Queued |
| **Stage 7** | Seller Management Portal | ⏳ Queued |
| **Stage 8** | Customer Storefront & Catalog UI | ⏳ Queued |
| **Stage 9** | Accordion Checkout & Tracking UI | ⏳ Queued |
| **Stage 10** | Hardening, Testing & Deployment | ⏳ Queued |
