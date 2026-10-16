# ProShop

A full-stack TypeScript e-commerce app built to demonstrate production-grade
architecture, secure auth, Stripe payments, and a layered REST API.

**Live demo:** [proshop.moh-sa.dev](https://proshop.moh-sa.dev) · **Portfolio:**
[moh-sa.dev](https://moh-sa.dev) · **LinkedIn:**
[linkedin.com/in/moh-sa](https://linkedin.com/in/moh-sa)

## Screenshots

![ProShop storefront](assets/hero.webp)

<details>
<summary>More screenshots</summary>

![Product detail](assets/product-detail.webp)
![Admin dashboard](assets/dashboard.webp) ![Shopping cart](assets/cart.webp)
![Order confirmation](assets/order-confirmation.webp)
![Order history](assets/order-history.webp)

</details>

## Features

- Product catalog with search and product detail pages.
- Shopping cart and Stripe Checkout with webhook-driven order status updates.
- User accounts: registration, sign-in, profile management, and order history.
- Product reviews with user-owned create, edit, and delete per product.
- Admin panel: manage products, orders, users, and reviews. Stats dashboard.
- Session-based auth with a single httpOnly cookie. Users can sign out
  everywhere; admins can ban users, which signs them out immediately.
- Demo sign-in page includes one-click login as customer or admin. No account
  creation needed.
- REST API at `/api/v1` with role-based access control (user and admin roles).
- Error monitoring via Sentry on both client and server.

## Engineering highlights

- **Auth:** Opaque server-side sessions in MongoDB; only a SHA-256 hash of the
  token is stored. `__Host-` cookie (HttpOnly, Secure, SameSite=Strict) with a
  7-day idle and 30-day absolute timeout. Revocation and bans take effect on the
  next request. Argon2 password hashing. Rate-limited auth routes.
- **Payments:** Orders created on the server. Stripe Checkout session. Webhooks
  verify signatures and update order status.
- **API design:** Layered architecture — Routers → Controllers → Managers →
  Services → Repositories. Zod validation. Centralized error handling and
  middleware chains (`userGuard`, `adminGuard`).
- **Caching:** Custom in-memory caching service (`node-cache`) used for product
  queries and rate limiting. Zod-validated inputs and memory capacity guards.
- **Security:** Single origin (no CORS). CSRF blocked with `SameSite=Strict`
  plus a `Sec-Fetch-Site`/`Origin` check. Helmet, mongo sanitization. Real
  client IP behind Cloudflare for rate limiting.
- **Frontend:** File-based TanStack Router with authenticated and admin layouts.
  React Query for server state. Optimistic updates where appropriate.
- **Testing:** 1,371 tests (776 unit, 595 integration, including HTTP tests of
  the auth flow) with 96% line coverage.
- **Observability:** Structured logging (Pino), Sentry on both apps.

## Tech stack

| Layer             | Technologies                                                                      |
| ----------------- | --------------------------------------------------------------------------------- |
| **Frontend**      | React 19, Vite, TypeScript, TanStack Router & Query, Tailwind CSS, Zustand, Axios |
| **Backend**       | Node.js, Express, TypeScript, Mongoose, Zod                                       |
| **Data**          | MongoDB                                                                           |
| **Payments**      | Stripe (Checkout + webhooks)                                                      |
| **Media**         | Cloudinary                                                                        |
| **Observability** | Sentry, Pino                                                                      |

## Architecture

### Auth and session flow

```mermaid
sequenceDiagram
  participant Browser
  participant Client as React client
  participant API as Express API
  participant DB as MongoDB

  Browser->>Client: Sign in
  Client->>API: POST /api/v1/auth/signin
  API->>DB: Verify password, store hash of a new random token
  API-->>Browser: Set __Host-session cookie (HttpOnly, Secure, SameSite=Strict)
  Client->>API: Protected request + cookie (same origin)
  API->>DB: Find session by token hash, load user
  alt Session live and user not banned
    API-->>Client: 200 + data
  else Expired, revoked or banned
    API-->>Browser: 401 + clear cookie
    Client->>Client: Drop cached user, redirect to sign-in
  end
```

### Order and Stripe flow

```mermaid
sequenceDiagram
  participant Browser
  participant Client as React client
  participant API as Express API
  participant Stripe as Stripe
  participant DB as MongoDB

  Browser->>Client: Checkout
  Client->>API: POST /api/v1/orders (authenticated)
  API->>DB: Create order
  API->>Stripe: Create Checkout Session
  API-->>Client: checkout URL
  Client->>Stripe: Redirect to pay
  Stripe-->>Browser: Success / cancel redirect
  Stripe->>API: POST /api/v1/webhooks/stripe
  API->>API: Verify signature
  API->>DB: Update order payment status
```

## Quick start

**Prerequisites:** Node.js 22+, pnpm 10+, MongoDB,
[Stripe CLI](https://stripe.com/docs/stripe-cli), and accounts for Stripe,
Cloudinary, and Sentry.

```bash
# Terminal 1 — API (default: http://localhost:5000)
cd server && pnpm install && cp .env.example .env
pnpm dev

# Terminal 2 — Stripe webhook forwarding
stripe listen --forward-to http://localhost:5000/api/v1/webhooks/stripe

# Terminal 3 — Client (default: https://localhost:5173)
cd client && pnpm install && cp .env.example .env
pnpm dev

# Run server tests
cd server && pnpm test
```

**Stripe webhooks:** Run `stripe listen` once first to get your webhook signing
secret, then set `STRIPE_WEBHOOK_SECRET` in `server/.env` and restart the API.

Fill in all remaining values in each `.env` file. Both `.env.example` files
document every required variable.
