Product Price Tracker & Resilient Web Scraper

A full-stack web application that allows users to search products on the INE Mock Storefront (`https://demo.inelabteamdev.com/`), track specific product options (size, kit, pack), monitor prices and inventory over time on a 2-hour schedule, visualize price/stock trends, and export complete audit logs as CSV.

Live Deployments

- **Frontend (Vercel)**: [https://ine-price-tracker.vercel.app](https://ine-price-tracker.vercel.app) *(or your Vercel deployment URL)*
- **Backend API (Render)**: [https://ine-price-tracker-backend-l2zl.onrender.com](https://ine-price-tracker-backend-l2zl.onrender.com)
- **Database**: Supabase (PostgreSQL)
- **Target Mock Store**: [https://demo.inelabteamdev.com](https://demo.inelabteamdev.com)
- **2-Hour Cron Webhook**: `https://ine-price-tracker-backend-l2zl.onrender.com/api/cron/scrape`



## 📁 Repository Structure

```plaintext
ine-assignment/
├── backend/
│   ├── database/
│   │   ├── index.js          # Supabase client + local fallback adapter
│   │   └── schema.sql        # Supabase PostgreSQL schema
│   ├── routes/
│   │   ├── products.js       # Catalog search & option discovery
│   │   ├── tracked.js        # Tracked products CRUD & on-demand scrape
│   │   ├── export.js         # RFC 4180 CSV export endpoint
│   │   └── cron.js           # Authenticated 2-hour cron scrape endpoint
│   ├── scraper/
│   │   ├── resilient-scraper.js # Resilient scraper (exponential backoff + jitter)
│   │   └── headed-scraper.js    # Observable headed Playwright runner
│   ├── scripts/
│   │   ├── run-headed.js     # CLI runner for observable headed mode
│   │   └── seed.js           # Seeds pre-populated tracked items & history
│   ├── test/
│   │   ├── scraper.test.js   # Scraper resilience & failure classification tests
│   │   └── csv.test.js       # CSV schema & format compliance tests
│   ├── package.json
│   └── server.js             # Express API entrypoint
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Header navigation & export button
│   │   │   ├── StatsOverview.jsx # High-level tracking metrics
│   │   │   ├── SearchModal.jsx   # Catalog search & variant selector
│   │   │   ├── ProductCard.jsx   # Product card & on-demand scrape
│   │   │   ├── PriceChart.jsx    # SVG interactive price/stock chart
│   │   │   └── ScrapeLogTable.jsx# Scrape attempt audit log table
│   │   ├── App.jsx           # Main application state & coordinator
│   │   ├── index.css         # Glassmorphic dark styling & responsive UI
│   │   └── main.jsx          # React DOM entrypoint
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── document/
│   ├── SPECIFICATION.md      # Full feature specifications sheet
│   └── DESIGN_NOTE.md        # Scraping reliability, trade-offs, AI disclosures
├── .editorconfig
├── .gitignore
└── README.md
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=production
FRONTEND_URL=*
STORE_BASE_URL=https://demo.inelabteamdev.com

# Supabase PostgreSQL
SUPABASE_URL=https://wxafjjulwqzkrihcagkd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_publishable_oX5axFkCaqQl7HgHplxINA_0GSs29Oi
SUPABASE_ANON_KEY=sb_publishable_oX5axFkCaqQl7HgHplxINA_0GSs29Oi

# Cron Webhook Authentication
CRON_SECRET=cron_sec_ine_2026
```

### Frontend (`frontend/.env` & Vercel)

```env
VITE_API_BASE_URL=https://ine-price-tracker-backend-l2zl.onrender.com/api
```

---

## 💻 Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/ishikamanchanda30/ine-assignment.git
cd ine-assignment
```

### 2. Run Backend
```bash
cd backend
npm install
npm run seed     # Seeds initial tracked products
npm run dev      # Starts Express server on http://localhost:5000
```

### 3. Run Frontend
```bash
cd ../frontend
npm install
npm run dev      # Starts Vite dev server on http://localhost:3000
```

### 4. Run Unit Tests
```bash
cd ../backend
npm test
```

### 5. Run Observable Headed Scraper (Video Recording Demo)
```bash
cd ../backend
npm run scrape:headed -- 2428 0
```
*This launches Chromium in visible GUI mode, navigates to item 2428, clicks options, triggers price unlocking, and logs all steps.*

---

## ⏰ Scraping Schedule & Sleeping Backend Mitigation

- **Schedule**: Every 2 hours (`0 */2 * * *`)
- **Trigger**: Configured on [cron-job.org](https://cron-job.org) targeting `POST /api/cron/scrape` with header `x-cron-secret: cron_sec_ine_2026`.
- **Warm-Up Ping**: Scheduled every 10 minutes against `GET /health` to keep Render warm and avoid cold-start timeouts.

---

## 📊 CSV Export Format

Clicking **Export CSV** downloads a standardized RFC 4180 file:
- **Columns**: `store_product_id,product_name,selected_option,timestamp,price,stock,outcome`
- **ISO 8601 UTC Timestamps**: e.g., `2026-09-27T14:00:00.000Z`
- **Honest Failures**: Failed scrape attempts are recorded with `price` and `stock` left completely blank.

---

## 📄 Documentation Deliverables

- Detailed Specifications: [`document/SPECIFICATION.md`](./document/SPECIFICATION.md)
- Design Note & AI Disclosures: [`document/DESIGN_NOTE.md`](./document/DESIGN_NOTE.md)
