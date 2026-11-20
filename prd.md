# QuickSure – Product Requirements Document (PRD)

**Document Version:** 1.0.0  
**Status:** APPROVED FOR IMPLEMENTATION  
**Product:** QuickSure Multi-Category E-Commerce Marketplace  
**Target Market:** Multi-Vendor Online Retail (Electronics, Fashion, Home, Beauty, Books, Sports)  

---

## 1. Product Overview & Vision

QuickSure is a full-stack, multi-category e-commerce marketplace connecting retail customers, verified independent sellers, and platform administrators. Inspired by the catalog clarity and logistics of Amazon/Flipkart, QuickSure enables multi-vendor order fulfillment with atomic inventory reservations, transparent pricing, and robust administrative oversight.

### 1.1 Core Value Propositions
- **For Customers:** Seamless multi-category shopping, faceted search & discovery, transparent price breakdowns, real-time stock availability, and consolidated courier order tracking.
- **For Sellers:** Streamlined store registration, variant matrix catalog management (size/color/price/stock), incoming order dispatch tracking, and financial payout logs.
- **For Administrators:** End-to-end platform control, vendor KYC/approval workflows, catalog moderation, promotional coupon engines, and platform GMV analytics.

### 1.2 Logistics & Financial Operations (Simulation Mode)
- **Courier-Based Delivery:** Standard parcel dispatch (Amazon/Flipkart model with courier name and tracking ID). Swiggy-style on-demand instant driver GPS tracking is explicitly excluded from the MVP.
- **Simulated Payment Gateway:** Deterministic test cards/methods simulating payment authorization, card declines, and instant settlement before real banking APIs are attached.
- **Simulated Seller Payouts:** Automated platform commission deductions and payout ledger logs without direct merchant bank account wire integrations in MVP.

---

## 2. User Roles & Personas

| Role | Description | Core Capabilities |
| :--- | :--- | :--- |
| **Guest / Anonymous** | Unauthenticated browser | Browse catalog, search/filter products, add items to temporary `localStorage` cart, view reviews. |
| **Customer (Buyer)** | Registered authenticated user | Manage profile and delivery addresses, sync persistent cart, apply coupons, execute checkouts, view order history and tracking, submit reviews. |
| **Seller (Vendor)** | Verified merchant store owner | Manage store settings, publish products and variant SKUs, manage inventory levels, process and dispatch sub-orders with courier tracking. |
| **Administrator** | Marketplace platform operator | Platform overview (GMV, volume), approve/reject sellers, moderate/approve product listings, oversee orders, configure site-wide coupons. |

---

## 3. Detailed Functional Requirements

### 3.1 Customer Storefront & Catalog Discovery
- **Homepage:** Hero promotional carousel, featured category icon grid, trending products carousel, trust badges (Simulated Free Delivery, 7-Day Returns, Secure Payments).
- **Product Listing Page (PLP):**
  - Left-hand faceted filter sidebar: Categories, price range slider, brand checkboxes, customer rating filter (4★ & above), in-stock toggle.
  - Sorting: Featured, Price: Low to High, Price: High to Low, Highest Rated, Newest Arrivals.
  - View modes: Responsive Grid and List views with server-side pagination (12 items/page).
- **Product Detail Page (PDP):**
  - Interactive multi-image gallery with zoom preview and thumbnail selector.
  - Variant selection matrix: Color swatches, size buttons, dynamic SKU update.
  - Live stock status badge: "In Stock", "Only X left", or "Out of Stock" (disabling add-to-cart).
  - Price display: Base price, discounted sale price, discount percentage badge.
  - Customer review summary: Average star rating (1-5) and verified buyer feedback.
- **Search System:** Header search bar with debounced query suggestions and partial keyword matching.

### 3.2 Cart & Shopping Experience
- **Dual-Mode Cart:** Unauthenticated users utilize a local storage cart; authenticated users utilize a persistent database cart.
- **Auto-Merge on Login:** When a guest logs in, their local cart items automatically merge into their database cart without duplicating line items.
- **Cart Controls:** Increment/decrement quantity with stock ceiling enforcement (max 10 units/item), remove item, clear cart.
- **Wishlist:** Single-click toggle from product cards or PDP; one-click "Move to Cart".

### 3.3 Checkout & Order Processing
- **Accordion-Style Single-Page Checkout:**
  - Step 1: Shipping Address Selection (select existing saved address or add new).
  - Step 2: Delivery Option (Standard courier simulation).
  - Step 3: Payment Method (Simulated Card, Simulated UPI, Simulated Cash on Delivery).
  - Step 4: Authoritative Order Review & Total Confirmation.
- **Server-Authoritative Pricing:** Subtotal, shipping fees, tax, and coupon discounts are calculated strictly on the backend. Frontend prices are treated as display-only.
- **Idempotency Protection:** Checkout requests pass an `Idempotency-Key` header to prevent duplicate orders from double clicks or network retries.
- **Multi-Seller Order Splitting:** Checkouts containing items from multiple sellers automatically partition into one parent `orders` record and multiple seller-specific `sub_orders`.

### 3.4 Seller Management Portal (`/seller`)
- **Seller Application Flow:** Registered users apply with store name, description, and business contact. State starts as `pending`.
- **Store Overview:** Gross store sales, active listings count, pending sub-orders, and out-of-stock SKU alerts.
- **Product & Variant Catalog:** Create and update parent products; define multiple SKU variants with individual stock, pricing, and attributes. Upload product photos.
- **Order Fulfillment:** Filter incoming sub-orders by status (`pending`, `confirmed`, `packed`, `shipped`, `delivered`). Assign courier name and tracking number upon dispatch.
- **Payout Ledger:** Transparent view of gross sales, platform commission deduction (default 10%), and net seller payable.

### 3.5 Administrative Portal (`/admin`)
- **Executive Analytics:** Real-time KPI summary cards (Total GMV, Orders Count, Active Customers, Verified Sellers).
- **Seller Moderation:** View seller applications; approve, reject, or suspend seller accounts.
- **Catalog Moderation:** Approve pending seller products before they become visible to customers; feature or deactivate listings.
- **Order Oversight:** View global parent and sub-orders; filter by status and inspect delivery addresses.
- **Coupon Campaign Manager:** Create promotional codes (`percentage` or `fixed` discount, minimum spend, expiry date, single-use limits).

---

## 4. Non-Functional Requirements (NFRs)

- **Performance:**
  - First Contentful Paint (FCP) < 1.2s; Largest Contentful Paint (LCP) < 2.5s on mobile 4G.
  - API response time (p95) < 200ms for catalog reads; < 500ms for checkout writes.
- **Security & Data Integrity:**
  - Full OWASP Top 10 mitigation: Parameterized SQL (via Supabase client), Helmet HTTP headers, CORS origin whitelisting, Zod input sanitization.
  - Zero direct client database access.
  - Atomic concurrency control for inventory decrements to prevent overselling.
- **Reliability:**
  - Graceful error boundaries on frontend with retry options.
  - Centralized Express error handler returning predictable error payloads `{ success: false, error: { message, code } }`.
- **Compatibility:**
  - 100% responsive across mobile (375px), tablet (768px), and desktop (1280px+).
  - Modern evergreen browsers (Chrome, Safari, Firefox, Edge).

---

## 5. Scope Boundaries & MVP Non-Goals

To maintain an achievable, production-grade medium-scale system, the following features are **explicitly out of scope** for the MVP:
- ❌ **No Live GPS Driver Tracking:** Parcel delivery operates on standard courier tracking numbers, not real-time map telemetry.
- ❌ **No Real Banking Payment Gateways:** Real Stripe/Razorpay keys are excluded until business verification; simulated payment engine handles realistic flows.
- ❌ **No Real Bank Wire Payouts:** Seller payouts are computed and logged in simulation ledger tables.
- ❌ **No Dark/Light Theme Switching:** Focus strictly on high-contrast, clean retail UI.
- ❌ **No Product Comparison Matrix:** Deferred to post-launch.
- ❌ **No Multi-Tier Admin Roles:** Consolidated into a single `admin` privilege level.
