Product Price Tracker & Resilient Web Scraper

A full-stack web application that allows users to search products on the INE Mock Storefront (`https://demo.inelabteamdev.com/`), track specific product options (size, kit, pack), monitor prices and inventory over time on a 2-hour schedule, visualize price/stock trends, and export complete audit logs as CSV.

Live Deployments

- **Frontend (Vercel)**: [https://ine-price-tracker.vercel.app](https://ine-price-tracker.vercel.app) 
- **Backend API (Render)**: [https://ine-price-tracker-backend-l2zl.onrender.com](https://ine-price-tracker-backend-l2zl.onrender.com)
- **Database**: Supabase (PostgreSQL)
- **Target Mock Store**: [https://demo.inelabteamdev.com](https://demo.inelabteamdev.com)
- **2-Hour Cron Webhook**: `https://ine-price-tracker-backend-l2zl.onrender.com/api/cron/scrape`



Repository Structure

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
---


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


