# E-Commerce API – Bruno Collection

Bruno API collection for all Express routes in `src/routes`.

## Setup

1. Open [Bruno](https://www.usebruno.com/) and add this folder as a collection.
2. Select the **Local** environment (baseURL: `http://localhost:5000/api`).
3. Start the server: `npm run dev` (from `server/`).

## Authentication Flow

1. **Sign Up** or **Sign In** – both store `accessToken` and `refreshToken` cookies via post-response scripts.
2. Bruno sends these cookies automatically on subsequent requests to the same origin.
3. **Refresh Access Token** – updates the access token cookie when it expires.

## Environment Variables

| Variable    | Description                | Example                     |
| ----------- | -------------------------- | --------------------------- |
| `baseUrl`   | API base URL               | `http://localhost:5000/api` |
| `userId`    | User ID for path params    | `69ab61eca15b40e3269e158b`  |
| `productId` | Product ID for path params | `69a6190c0ea478743f8ce5b0`  |
| `orderId`   | Order ID for path params   | `69961f180601efc7063af465`  |
| `reviewId`  | Review ID for path params  | `69abbb8db73f69704f50dd81`  |

Update these in `environments/Local.bru` after creating users, products, orders, or reviews.

## Folders & Requests

| Folder       | Requests                                                                       |
| ------------ | ------------------------------------------------------------------------------ |
| **Auth**     | Sign Up, Sign In, Sign Out (current/all), Refresh Token, Sessions (get/revoke) |
| **Users**    | Profile (get/update), Admin (get all/by id, update, delete)                    |
| **Products** | Get all/top-rated/by id, Admin create/update/delete                            |
| **Orders**   | Create, Get by user/id, Admin get all/update payment                           |
| **Reviews**  | Get by product/user, count, exists, create, update, delete, Admin endpoints    |
| **Webhooks** | Stripe webhook (add `stripe-signature` header for production)                  |
