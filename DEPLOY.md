# Deploy — GNS Booking (Vite + React + Spring Boot)

This repo is a **static SPA** built with **Vite**. All APIs live on your **Spring Boot** backend. The browser needs **`VITE_*` env vars at build time** (they are inlined into the JS bundle).

## Local dev

```bash
npm install
npm run dev
```

- UI: **http://localhost:3000** (see `vite.config.ts` → `server.port`)
- API base: set **`VITE_API_URL`** in `.env.local`, e.g. `http://localhost:9090` or `http://localhost:9090/api`

## Production build

```bash
npm run build
```

Output: **`dist/`** — host as static files (nginx, S3+CloudFront, Netlify, Vercel static, etc.).

Set env vars **before** `npm run build` (CI or hosting UI):

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Public API base (no trailing slash), e.g. `https://api.yourdomain.com` |
| `VITE_UPI_ID` | Optional UPI VPA |
| `VITE_UPI_PAYEE_NAME` | Optional payee name |
| `VITE_UPI_QR_IMAGE` | Optional path under `/public` |
| `VITE_ADMIN_BOOKINGS_STATIC` | Optional `true` for static admin demo |

## CORS

The browser calls your API from the SPA origin. Your Spring Boot app must allow that origin (CORS), including `OPTIONS` preflight for `POST` with JSON.

## Preview production build locally

```bash
npm run preview
```
