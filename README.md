# NEON — Premium Thrift & Streetwear E-Commerce Platform

Complete full-stack e-commerce foundation for **NEON**: premium thrifted streetwear store with storefront, cart, checkout (Paystack), order tracking, admin dashboard, Supabase backend, multi-currency, and light/dark themes.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Zustand/Context, Lucide |
| Backend | Python, FastAPI, Pydantic, HTTPX |
| Database | Supabase PostgreSQL + Auth + Storage + RLS |
| Payments | Paystack Inline + backend init/verify + webhooks |
| Analytics | Google Analytics 4 (configurable) + internal sales analytics |

## Project structure

```
neon-ecommerce/
├── frontend/          # React + Vite storefront & admin UI
├── backend/           # FastAPI API
├── supabase/
│   └── setup.sql      # Full schema, RLS, seed data (NO Alembic)
├── docs/
└── README.md
```

## What is implemented

- Premium monochrome storefront (Home, Shop, About, Contact, Account)
- Announcement bar, navbar, footer, newsletter
- Product grid, filters, sorting, category routes
- Cart drawer with session persistence
- Currency switcher (NGN default, USD/GBP/EUR) with backend rates
- Light / dark / system theme
- Admin dashboard shell + live analytics overview
- FastAPI: products, categories, cart, checkout init, Paystack verify/webhooks, tracking, discounts, shipping, settings, media upload, newsletter, admin product/order APIs
- Full SQL schema + RLS + seed categories/settings/pages
- `.env.example` for frontend and backend

**Extend further:** product quick-view modal, multi-step checkout UI, full admin CRUD screens, rich-text page editor, GA4 event helpers — hooks and API routes are ready.

---

## 1. Supabase — create these resources

### A. New project
1. Go to [supabase.com](https://supabase.com) → New project  
2. Note **Project URL**, **anon key**, **service_role key** (Settings → API)  
3. Note **Database password** and connection string (Settings → Database)

### B. Run SQL
1. Open **SQL Editor**  
2. Paste and run entire file: `supabase/setup.sql`  
3. Confirm tables exist under **Table Editor**

### C. Storage buckets (Dashboard → Storage → New bucket)

| Bucket       | Public |
|--------------|--------|
| products     | Yes    |
| categories   | Yes    |
| collections  | Yes    |
| homepage     | Yes    |
| banners      | Yes    |
| instagram    | Yes    |
| brand        | Yes    |
| media        | Yes    |

For each public bucket, add a policy allowing `SELECT` for `anon` / `authenticated`, and allow `INSERT`/`UPDATE`/`DELETE` only for service role or authenticated admins.

### D. Auth
1. Enable Email provider (Auth → Providers)  
2. Create your admin user (Auth → Users → Add user)  
3. In SQL:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'you@example.com';
INSERT INTO public.admin_users (user_id)
SELECT id FROM public.profiles WHERE email = 'you@example.com'
ON CONFLICT DO NOTHING;
```

### E. Optional
- Auth redirect URLs: `http://localhost:5173/**`, your production domain  
- Realtime on `orders` if desired  

---

## 2. Paystack

1. Create account at [paystack.com](https://paystack.com)  
2. Copy **Test Secret Key** and **Test Public Key**  
3. Webhook URL: `https://YOUR_BACKEND_URL/api/webhooks/paystack`  
4. Set webhook secret if available; store as `PAYSTACK_WEBHOOK_SECRET`

---

## 3. Google Analytics 4 (optional)

1. Create GA4 property → Measurement ID (`G-XXXXXXXX`)  
2. Set `VITE_GA_MEASUREMENT_ID` and/or admin setting `ga_measurement_id`  
3. Load gtag in `index.html` or a React effect when ID is present  

---

## 4. Environment files

**backend/.env** (copy from `.env.example`):

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql+asyncpg://postgres:PASSWORD@db.xxxx.supabase.co:5432/postgres
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_WEBHOOK_SECRET=
SECRET_KEY=long-random-string
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
ENVIRONMENT=development
```

**frontend/.env**:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_BASE_URL=http://localhost:8000
VITE_PAYSTACK_PUBLIC_KEY=pk_test_...
VITE_GA_MEASUREMENT_ID=
```

---

## 5. Run locally (desktop / WSL / Linux / macOS)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # then edit .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health: http://localhost:8000/health  
Docs: http://localhost:8000/docs  

### Frontend
```bash
cd frontend
npm install
cp .env.example .env       # then edit .env
npm run dev
```

Storefront: http://localhost:5173  
Admin: http://localhost:5173/admin  

---

## 6. Run on Termux (Android)

Termux can run the **backend** and a lightweight frontend build, or you can develop frontend on a PC and point API to a phone-hosted backend. Full Node + Python stack on Termux is possible but heavy.

### Prerequisites in Termux
```bash
pkg update && pkg upgrade
pkg install python nodejs git curl
```

### Backend on Termux
```bash
cd neon-ecommerce/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Create .env with Supabase + Paystack keys
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Use your phone’s LAN IP (e.g. `http://192.168.x.x:8000`) as `VITE_API_BASE_URL` from another device.

### Frontend on Termux
```bash
cd neon-ecommerce/frontend
npm install
# Edit .env — VITE_API_BASE_URL=http://127.0.0.1:8000
npm run dev -- --host 0.0.0.0
```

Open the shown URL in the phone browser.  
For production-like use: `npm run build` then serve `dist/` with any static server.

**Notes for Termux**
- Long-running processes: use `termux-wake-lock` and consider `tmux`  
- Port forwarding / firewall on some networks may block LAN access  
- Prefer cloud Supabase; do not host Postgres on the phone  

---

## 7. Deployment sketch

| Service   | Suggestion                                      |
|-----------|--------------------------------------------------|
| Frontend  | Vercel, Netlify, Cloudflare Pages                |
| Backend   | Railway, Render, Fly.io, a VPS with Uvicorn/Gunicorn |
| Database  | Supabase (managed)                               |
| Domain    | Point DNS; set CORS `FRONTEND_URL` / `BACKEND_URL` |

Set production env vars; never commit real secrets.

---

## 8. API overview

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health + config flags |
| GET | `/api/products` | List/filter products |
| GET | `/api/products/{slug}` | Product detail |
| GET | `/api/categories` | Categories |
| GET/POST/PATCH/DELETE | `/api/cart` … | Cart |
| POST | `/api/checkout/init` | Create order + Paystack init |
| POST | `/api/payments/verify` | Verify transaction |
| POST | `/api/webhooks/paystack` | Webhook |
| POST | `/api/tracking` | Track order (order # + email/phone) |
| GET | `/api/settings/public` | Public settings |
| GET | `/api/currency/rates` | FX rates |
| GET | `/api/analytics/overview` | Admin KPIs |
| GET/POST/PATCH | `/api/admin/products` | Admin products |
| GET/PATCH | `/api/admin/orders` | Admin orders |
| POST | `/api/media/upload` | Upload to Storage |
| POST | `/api/newsletter/subscribe` | Newsletter |

Interactive docs: `/docs` when the API is running.

---

## 9. Security reminders

- Never put `SUPABASE_SERVICE_ROLE_KEY` or `PAYSTACK_SECRET_KEY` in the frontend  
- Always verify Paystack on the backend; webhooks must check signature  
- Order tracking requires email or phone in addition to order number  
- Admin routes must verify `profiles.role` on the server (extend JWT checks)  
- RLS is enabled; service role is used only on the backend  

---

## 10. License / brand

NEON brand name and design system as specified in the project prompt.  
Build further modules on this foundation for production use.

---

**Quick checklist**

- [ ] Supabase project + `setup.sql`  
- [ ] Storage buckets  
- [ ] Admin user role  
- [ ] Backend `.env`  
- [ ] Frontend `.env`  
- [ ] Paystack keys + webhook  
- [ ] `uvicorn` + `npm run dev`  
- [ ] Add first product via admin API or SQL  

Then open http://localhost:5173 and http://localhost:5173/admin.