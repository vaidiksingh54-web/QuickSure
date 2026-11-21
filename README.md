# QuickSure — Multi-Category Multi-Seller E-Commerce Marketplace

> A production-ready, full-stack e-commerce marketplace platform built with **React 19 + Vite** (frontend), **Node.js + Express** (backend API), and **Supabase** (PostgreSQL 15, Auth & Storage).

---

## 🚀 Live Demo

| Layer | URL |
|---|---|
| **Frontend (Vercel)** | *(deploy via Vercel — see below)* |
| **Backend API (Render)** | *(deploy via Render — see below)* |

---

## 🏗️ Architecture

```
Customer Browser (React 19 + Vite)
        │  REST API calls (/api/*)
        ▼
Express Gateway (Node.js v20+)
        │  SQL queries (via @supabase/supabase-js)
        ▼
Supabase (PostgreSQL 15 + Auth + Storage CDN)
```

**Key invariants:**
- No direct frontend → database access. All data flows through Express REST API.
- Backend is the **authoritative pricing engine** — all prices, taxes, discounts computed server-side.
- Atomic stock decrement prevents overselling under concurrent load.
- Parent/child order model: 1 checkout → 1 parent order + N sub-orders (one per seller).

---

## 📦 Project Stages (All 10 Complete ✅)

| Stage | Feature | Status |
|---|---|---|
| Governance | PRD, Architecture, Rules, Phases, Design, Memory | ✅ |
| Stage 1 | Foundation & PostgreSQL 17-Table Schema + RLS | ✅ |
| Stage 2 | Auth & Role-Based Access Control (JWT + RBAC) | ✅ |
| Stage 3 | Backend Catalog & Supabase Storage CDN | ✅ |
| Stage 4 | Cart, Server-Side Pricing Engine & Coupon System | ✅ |
| Stage 5 | Multi-Seller Order Splitting & Payment Simulation | ✅ |
| Stage 6 | Admin Management Portal (Analytics, Approvals, Commissions) | ✅ |
| Stage 7 | Seller Management Portal (Catalog, Inventory, Fulfillment) | ✅ |
| Stage 8 | Customer Storefront & Catalog UI | ✅ |
| Stage 9 | Accordion Checkout & Live Order Tracking UI | ✅ |
| Stage 10 | Security Hardening, 79-Test E2E Suite & Deployment Config | ✅ |

---

## 🛠️ Local Development Setup

### Prerequisites
- Node.js v20+
- npm v10+
- A Supabase project (or use mock mode with placeholder URL)

### 1. Clone the repo
```bash
git clone https://github.com/vaidiksingh54-web/QuickSure.git
cd QuickSure
```

### 2. Install all dependencies
```bash
npm install
npm install --prefix client
npm install --prefix server
```

### 3. Configure environment variables

**Backend** — create `server/.env`:
```env
PORT=5000
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
CORS_ORIGIN=http://localhost:5173
```

**Frontend** — create `client/.env.local`:
```env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> **Mock Mode:** If `SUPABASE_URL` contains `placeholder.supabase.co`, the server runs entirely with in-memory mock data — no Supabase project needed for local testing.

### 4. Run in development
```bash
# Start backend (port 5000)
npm run dev --prefix server

# Start frontend (port 5173)  
npm run dev --prefix client
```

### 5. Run all tests
```bash
npm test --prefix server
# Expected: 79/79 tests pass (65 unit + 14 E2E)
```

---

## ☁️ Production Deployment

### Frontend → Vercel

1. Import the GitHub repo in [Vercel Dashboard](https://vercel.com/new).
2. Set **Root Directory** to `client`.
3. Set **Build Command** to `npm run build`.
4. Set **Output Directory** to `dist`.
5. Add environment variables:
   ```
   VITE_API_URL=https://your-render-backend.onrender.com
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
6. Click **Deploy**. The `client/vercel.json` handles SPA rewrites and security headers automatically.

### Backend → Render

1. Create a new **Web Service** in [Render Dashboard](https://render.com).
2. Connect your GitHub repo.
3. Use these settings (or use `render.yaml` for auto-deploy):
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Node Version:** 20
4. Add environment variables:
   ```
   NODE_ENV=production
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   JWT_SECRET=your-production-secret-min-32-chars
   CORS_ORIGIN=https://your-vercel-app.vercel.app
   PORT=10000
   ```

### Database → Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. Run migrations in order via **SQL Editor**:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_triggers_and_indexes.sql`
3. Optionally seed demo data:
   - `supabase/seed/demo_seed.sql`

---

## 🧪 Test Suite

```
server/
├── test/
│   ├── health.test.js          # Stage 1: API gateway health & latency
│   ├── auth.test.js            # Stage 2: Register, login, RBAC enforcement
│   ├── catalog.test.js         # Stage 3: Category tree, product search, PDPs
│   ├── cart-pricing.test.js    # Stage 4: Cart ops, pricing engine, coupons
│   ├── orders.test.js          # Stage 5: Checkout, sub-order splitting, payments
│   ├── admin.test.js           # Stage 6: Analytics, seller approvals, commission
│   ├── seller.test.js          # Stage 7: Store onboarding, inventory, dispatch
│   └── e2e-marketplace.test.js # Stage 10: 14-test E2E security & integration
```

**Run:** `npm test --prefix server`  
**Expected:** ✅ 79/79 tests pass

---

## 🔐 Security Features

- **Helmet.js** — HTTP security headers
- **CORS** — Origin whitelist enforcement
- **Rate Limiting** — Per-IP request throttling
- **RBAC Middleware** — Role-enforced route protection (`customer`, `seller`, `admin`)
- **IDOR Guards** — Sellers can only mutate their own product variants
- **Idempotency Keys** — Duplicate checkout prevention
- **Zod Validation** — Input sanitization on all POST/PUT endpoints
- **Server-Side Pricing** — Client price inputs strictly ignored

---

## 📁 Repository Structure

```
QuickSure/
├── client/                     # React 19 + Vite Frontend
│   ├── public/
│   │   └── _redirects          # SPA fallback for Netlify/Render Static
│   ├── src/
│   │   ├── components/         # CategoryBar, HeroBanner, ProductCard, Modals...
│   │   ├── context/            # AuthContext, CartContext, WishlistContext
│   │   └── App.jsx
│   └── vercel.json             # Vercel SPA + security headers config
├── server/                     # Node.js + Express Backend API
│   ├── src/
│   │   ├── controllers/        # auth, products, cart, orders, seller, admin
│   │   ├── middlewares/        # auth, role, rateLimiter, errorHandler
│   │   ├── routes/             # all API routes
│   │   ├── services/           # pricingService, orderService, paymentService
│   │   └── validators/         # Zod schemas
│   └── test/                   # 8 test suites (79 tests total)
├── supabase/                   # DB migrations & seed data
├── render.yaml                 # Render deployment manifest
├── architecture.md             # System design & technical boundaries
├── phases.md                   # Phased delivery roadmap
├── rules.md                    # Unbreakable business & security rules
└── memory.md                   # Project context & progress tracker
```

---

## 👤 Author

**Vaidik Singh** — Full-Stack Developer  
GitHub: [@vaidiksingh54-web](https://github.com/vaidiksingh54-web)

---

*Built with ❤️ — QuickSure is a complete, production-ready marketplace platform.*
