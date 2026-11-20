# QuickSure

<p align="center">
  <img src="docs/assets/quicksure-logo-primary.svg" alt="QuickSure Logo" width="380">
</p>

<p align="center">
  <strong>Fast Delivery • Ironclad Assurance</strong><br>
  A modern, full-stack, multi-category e-commerce marketplace connecting customers, verified sellers, and administrators.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Architecture-Three--Tier%20Decoupled-blue.svg" alt="Architecture">
  <img src="https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB.svg" alt="React">
  <img src="https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933.svg" alt="Express">
  <img src="https://img.shields.io/badge/Database-Supabase%20PostgreSQL%2015-3ECF8E.svg" alt="Supabase">
  <img src="https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC.svg" alt="Tailwind">
</p>

---

## Overview

QuickSure is a multi-seller e-commerce marketplace that connects customers and sellers through a user-friendly platform, offering product browsing, shopping carts, secure authentication, inventory management, and order processing.

Inspired by the catalog clarity and logistics of Amazon/Flipkart, QuickSure features **parent-child multi-seller order splitting**, **atomic concurrency control** for stock reservations, and **strict role-based access control (RBAC)**.

---

## System Architecture

QuickSure enforces a strict **Three-Tier Decoupled Gateway Architecture**:

- **Tier 1: Frontend Client (React 19 + Vite SPA):** Customer Storefront, Seller Portal, and Admin Dashboard. Communicates strictly with the Express REST API via HTTPS and Bearer JWTs.
- **Tier 2: Backend Gateway (Node.js + Express):** Centralizes all business logic, server-authoritative pricing, Zod validation, rate limiting, atomic stock decrements, and mock payment simulation.
- **Tier 3: Platform Services (Supabase Cloud):** PostgreSQL 15 (17 normalized relational tables with Row Level Security), Supabase Auth, and Supabase Storage CDN.

---

## Project Structure

```
QuickSure/
├── client/                     # Frontend React 19 + Vite SPA
│   ├── public/                 # Static brand assets (logo, icon)
│   ├── src/
│   │   ├── components/         # Atomic UI, layout, product, cart, checkout, admin, seller
│   │   ├── services/           # Axios API client with Bearer JWT interceptors
│   │   ├── App.jsx             # Main application layout
│   │   └── main.jsx
│   ├── tailwind.config.js      # Brand color tokens (Royal Blue, Velocity Amber, Obsidian Slate)
│   └── vite.config.js          # Vite configuration with API reverse proxy
├── server/                     # Backend REST API Gateway
│   ├── src/
│   │   ├── config/             # Zod environment validation & Supabase Admin SDK
│   │   ├── middlewares/        # Centralized error handler, rate limiter, auth guards
│   │   ├── routes/             # Health, auth, product, cart, and order endpoints
│   │   ├── utils/              # Standardized API response and structured logger
│   │   └── app.js              # Express app configuration
│   ├── test/                   # Automated API integration test suite
│   └── server.js               # HTTP server entrypoint
├── supabase/                   # Database Architecture
│   ├── migrations/             # 17 Relational tables, indexes, audit triggers & RLS policies
│   └── seed/                   # Multi-category demo catalog and active coupons
├── docs/                       # Project Documentation & Architecture
│   ├── architecture/           # System architecture blueprint & ADRs
│   ├── assets/                 # Vector brandmarks and icons
│   └── plans/                  # Phased implementation roadmaps
├── prd.md                      # Product Requirements Document
├── architecture.md             # System Architecture & Technical Boundaries
├── rules.md                    # Unbreakable Development & Security Rules
├── phases.md                   # 10 Sequential Implementation Stages & Verification Gates
├── design.md                   # UI/UX Design System Specification
└── memory.md                   # Project Memory Bank & Context State
```

---

## Quick Start

### Prerequisites
- **Node.js:** v20.x or higher
- **npm:** v10.x or higher

### 1. Installation
Install dependencies across both `server` and `client` workspaces:
```bash
# In the repository root
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

### 2. Environment Configuration
Copy the example environment files and supply your credentials:
```bash
# Backend environment
cp server/.env.example server/.env

# Frontend environment
cp client/.env.example client/.env
```

### 3. Run Development Servers
```bash
# Run Express Backend (Port 5000)
npm run dev:server

# In a separate terminal, run Vite Frontend (Port 5173)
npm run dev:client
```

### 4. Run Backend Health Test
```bash
cd server
npm test
```

---

## Security Invariants

1. **Zero Client Pricing:** All cart totals, delivery charges, discounts, and taxes are computed server-side.
2. **Zero Direct DB Access from Frontend:** The React SPA connects exclusively to Express REST APIs.
3. **Atomic Stock Locking:** Concurrency protection prevents inventory overselling (`UPDATE ... WHERE stock_quantity >= $qty`).
4. **Tenant Isolation:** Sellers cannot access or manipulate other sellers' shipments or products (No IDOR).

---

## License

This project is proprietary and confidential. All rights reserved.
