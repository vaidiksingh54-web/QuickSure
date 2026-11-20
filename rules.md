# QuickSure – Development Rules & Security Boundaries

**Status:** UNBREAKABLE CONTRACT  
**Rule Violation Policy:** Any code, pull request, or commit that violates any rule in this document must be rejected immediately.

---

## 1. Absolute Security Boundaries (DO NOT BREAK)

### Rule 1: Zero Client-Side Price Calculation
- **Statement:** The backend Express API must NEVER accept monetary values, item prices, subtotals, tax figures, shipping costs, or discount totals computed on the client.
- **Enforcement:** The checkout endpoint (`POST /api/orders/checkout`) and quote endpoint (`POST /api/orders/quote`) accept ONLY `{ shipping_address_id, payment_method, coupon_code }`. The server independently reads `product_variants.price` from PostgreSQL, executes tax/shipping calculations, validates the coupon code against database rules, and writes immutable totals to `orders`.

### Rule 2: Zero Direct Database Access from Frontend
- **Statement:** The React frontend must NEVER query Supabase PostgreSQL tables or invoke stored procedures directly.
- **Enforcement:** The frontend possesses only `VITE_SUPABASE_ANON_KEY` for Supabase Auth session token generation. All data reading and writing must route through Express endpoints (`/api/*`). The privileged `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the client.

### Rule 3: Strict Role Immutability
- **Statement:** Normal users must NEVER be able to modify their own `role` in the `profiles` table.
- **Enforcement:** The profile update endpoint (`PUT /api/auth/profile`) explicitly filters out `role`, `is_active`, and `id`. Roles can only be changed by database triggers or authorized administrator endpoints with verified `admin` claims.

### Rule 4: Atomic Inventory Concurrency Control
- **Statement:** Stock quantity decrements must NEVER use separate "read-then-write" application logic.
- **Enforcement:** Inventory decrements must be executed via conditional atomic SQL queries:
  ```sql
  UPDATE product_variants
  SET stock_quantity = stock_quantity - $qty
  WHERE id = $variant_id AND stock_quantity >= $qty
  RETURNING id, stock_quantity;
  ```
  If zero rows are updated, the checkout transaction MUST abort immediately and return HTTP 409 Conflict.

### Rule 5: Multi-Tenant Seller Isolation (Zero IDOR)
- **Statement:** Sellers must NEVER be able to read, update, or delete products, inventory, or orders belonging to another seller.
- **Enforcement:** Every seller endpoint must derive `seller_id` from the verified session (`req.seller.id`) and bind it to the SQL query (`WHERE seller_id = $seller_id`). Never accept `seller_id` from unauthenticated client request bodies or URL parameters without verification.

### Rule 6: Mandatory Idempotency on Financial Transactions
- **Statement:** All checkout and payment simulation requests must require an `Idempotency-Key` HTTP header.
- **Enforcement:** The backend stores and checks idempotency keys before processing. Duplicate requests with the same key return the previously cached order response rather than creating duplicate orders.

### Rule 7: Soft Deletes on Catalog Items
- **Statement:** Products and variants with existing order history must NEVER be hard-deleted from the database.
- **Enforcement:** Mutating deletion endpoints set `deleted_at = NOW()` and `is_active = FALSE`. The storefront catalog queries filter with `WHERE deleted_at IS NULL AND is_active = TRUE`.

### Rule 8: Simulation Sandbox Policy
- **Statement:** Real production payment gateway API keys (e.g., Stripe, Razorpay) and real banking payout credentials must NEVER be placed in environment variables or code during the MVP phase.
- **Enforcement:** Payment processing, delivery tracking events, and seller payout ledgers operate in deterministic simulation mode.

---

## 2. Architectural & Code Quality Boundaries

### Rule 9: Uniform REST Response Envelope
- **Statement:** Every API endpoint on the Express server must return data inside the standardized JSON envelope:
  ```json
  {
    "success": true,
    "message": "Human-readable status",
    "data": {},
    "error": null,
    "meta": {}
  }
  ```
- **Error Responses:** Must return `{ "success": false, "message": "Error details", "data": null, "error": { "code": "STRING_CODE", "details": ... } }` with appropriate HTTP status codes (400, 401, 403, 404, 409, 500).

### Rule 10: Mandatory Input Schema Validation
- **Statement:** Every `POST`, `PUT`, and `PATCH` endpoint must validate incoming payloads with **Zod** schemas before entering controller logic.
- **Enforcement:** Unvalidated parameters must be stripped; schema violations must return HTTP 422 Unprocessable Entity with structured field error messages.

### Rule 11: Mandatory Pagination on All Collections
- **Statement:** Endpoints returning collections of products, orders, reviews, or seller items must NEVER return unpaginated lists.
- **Enforcement:** Standard query parameters: `page` (default 1) and `limit` (default 12, max 50). Responses must include `meta: { total, page, totalPages, hasNext, hasPrev }`.

### Rule 12: Sequential Milestone Progression Gate
- **Statement:** Developers and AI subagents must NEVER begin implementing frontend UI views (Stage 8/9) before completing and verifying the prerequisite Database Migrations (Stage 1), Auth/RBAC (Stage 2), and Core Backend APIs (Stage 3-5).
