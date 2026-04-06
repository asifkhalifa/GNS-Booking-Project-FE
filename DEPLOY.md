# Full deployment guide — GNS Booking (Next.js + Firestore)

This app runs as a **single Next.js** project. APIs are under `/api/*`. Data lives in **Google Firestore**. Email uses **SMTP** (Gmail or any provider).

---

## Where you can deploy

| Platform | Best for | Notes |
|----------|----------|--------|
| **[Vercel](https://vercel.com)** | **Recommended** — built for Next.js, zero-config, free tier | Use this guide below. |
| [Netlify](https://netlify.com) | Next.js with adapter | Similar to Vercel; set same env vars. |
| [Railway](https://railway.app) / [Render](https://render.com) | Docker or Node `npm start` | Run `npm run build` then `npm start`; set env vars in dashboard. |
| **Your own VPS** | Full control | Install Node 20+, `npm ci`, `npm run build`, run `npm start` behind nginx; set env in systemd or `.env`. |

**This guide uses Vercel** — it is the fastest path for this repo.

---

## Phase A — Prepare Firebase (once)

1. Open [Firebase Console](https://console.firebase.google.com/) → **Add project** (or pick existing).
2. **Build → Firestore Database** → **Create database** (Production or Test mode; tighten rules later).
3. **Build → Firestore** → confirm the database exists (project id, e.g. `gns-db`).
4. **Project settings (gear) → Service accounts** → **Generate new private key** → download the `.json` file.  
   **Keep it secret** — never commit it to Git.
5. In [Google Cloud Console](https://console.cloud.google.com/) → select the **same project** → **APIs & Services** → ensure **Cloud Firestore API** is **Enabled**.

---

## Phase B — Prepare Gmail SMTP (for OTP / booking emails)

1. Google Account → **Security** → **2-Step Verification** (required).
2. **App passwords** → create an app password for “Mail” → copy the 16-character password (you can paste with spaces; the app strips them).

You will set `SMTP_USER`, `SMTP_PASS`, etc. in Phase E.

---

## Phase C — Put code on GitHub

1. Create a **new repository** on [GitHub](https://github.com/new) (empty, no README required).
2. On your machine (project folder):

   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git branch -M main
   git push -u origin main
   ```

3. Confirm **`.gitignore`** includes `.env.local` and `config/firebase-service-account.json` so secrets are not pushed.

---

## Phase D — Create the Firebase secret for Vercel

On your machine (with the downloaded service account JSON):

```bash
cd /path/to/GNS-Booking-Project-FE
npm run firebase:encode-key -- /path/to/your-service-account.json
```

Copy the **entire line** it prints, e.g.  
`FIREBASE_SERVICE_ACCOUNT_BASE64=eyJ...`  
You will paste the **name** and **value** separately in Vercel (see next section).

---

## Phase E — Deploy on Vercel (step by step)

### 1. Sign up

Go to [vercel.com](https://vercel.com) → sign up with **GitHub** (recommended).

### 2. Import the project

1. **Add New… → Project**.
2. **Import** your GitHub repository.
3. **Framework Preset:** Next.js (auto-detected).
4. **Root Directory:** `./` (default).
5. **Build Command:** `npm run build` (default).
6. **Output Directory:** leave default (Next.js handles it).
7. **Install Command:** `npm install` (default).

### 3. Add environment variables (before first deploy)

Open **Environment Variables** and add these for **Production** (and **Preview** if you want staging to work the same).

**Required for the app to work**

| Name | Example value | Sensitive? |
|------|----------------|------------|
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Output from `npm run firebase:encode-key` (value only, base64 string) | Yes |

**Required for real emails (OTP, booking, etc.)**

| Name | Example |
|------|---------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `your@gmail.com` |
| `SMTP_PASS` | Gmail app password (16 chars) |
| `SMTP_FROM` | `your@gmail.com` |

**Strongly recommended**

| Name | Example |
|------|---------|
| `ADMIN_EMAILS` | `admin1@gmail.com,admin2@gmail.com` |

**Public (browser) — safe to expose**

| Name | Example |
|------|---------|
| `NEXT_PUBLIC_UPI_ID` | `yourvpa@paytm` |
| `NEXT_PUBLIC_UPI_PAYEE_NAME` | `Your payee name` |
| `NEXT_PUBLIC_UPI_QR_IMAGE` | `/upi-paytm-qr.png` |

**Optional**

| Name | Purpose |
|------|---------|
| `SEAT_RESEED_SECRET` | Long random string; protects `POST /api/admin/reseed-seats` |
| `EXPIRE_BOOKINGS_MIN_INTERVAL_MS` | Default `45000` — throttle for background cleanup |

**Do not set** `NEXT_PUBLIC_API_BASE_URL` unless the front-end calls APIs on a **different domain** (unusual for this app).

Mark **Sensitive** for: Firebase base64, SMTP password, any secret.

### 4. Deploy

Click **Deploy**. Wait for the build to finish. You get a URL like `https://your-project.vercel.app`.

### 5. Redeploy after env changes

Whenever you change env vars: **Deployments → … → Redeploy** (or push a new commit).

---

## Phase F — Verify production

1. Open `https://YOUR-APP.vercel.app/seats` — seat map should load.
2. **Book ticket** → OTP email should arrive (check spam).
3. Complete booking → **booking created** email (if SMTP is set).
4. Log in as **admin** (`ADMIN_EMAILS`) → admin tickets → mark **PAID** → **approved ticket** email.

### Firestore index

If the app or logs show a link to **create an index** for `locks` (`expiresAt`), open the link once in Firebase and create the index.

---

## Phase G — Custom domain (optional)

1. Vercel → **Project → Settings → Domains** → **Add**.
2. Add your domain and follow **DNS** instructions (A/CNAME at your registrar).
3. Wait for SSL (automatic).

---

## Phase H — Troubleshooting

| Problem | What to check |
|---------|----------------|
| Build fails | Run `npm run build` locally; fix errors. |
| 500 on `/api/*` | `FIREBASE_SERVICE_ACCOUNT_BASE64` set correctly; Firestore API enabled; DB created. |
| No emails | SMTP vars; Gmail app password; spam folder. |
| Admin UI missing | `ADMIN_EMAILS` matches login email exactly; sign out and OTP again. |
| Slow seat map | Normal: full `seats` read; see performance notes in this file (throttle + lock query already in code). |

---

## Local production smoke test (before Vercel)

```bash
npm run build
npm start
```

Open `http://localhost:3000`. Set env in `.env.local` (same as Vercel). This uses `next start`, same as many hosts.

---

## Alternative: Docker / VPS (outline)

1. Install **Node 20+** on the server.
2. Clone repo, `npm ci`, `npm run build`.
3. Run `npm start` (port `3000` by default; set `PORT` if needed).
4. Put **nginx** or **Caddy** in front with HTTPS reverse proxy to `127.0.0.1:3000`.
5. Export the same environment variables as in Phase E (or use a `.env` file **not** committed).

---

## Security checklist

- [ ] Service account JSON **never** committed.
- [ ] Firebase rules reviewed for production.
- [ ] `SEAT_RESEED_SECRET` set if you expose reseed API.
- [ ] Rotate keys if they were ever exposed in chat or logs.

---

## Quick reference — env var list (copy)

```
FIREBASE_SERVICE_ACCOUNT_BASE64=
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
ADMIN_EMAILS=
NEXT_PUBLIC_UPI_ID=
NEXT_PUBLIC_UPI_PAYEE_NAME=
NEXT_PUBLIC_UPI_QR_IMAGE=/upi-paytm-qr.png
```

Optional: `SEAT_RESEED_SECRET=`, `EXPIRE_BOOKINGS_MIN_INTERVAL_MS=45000`
