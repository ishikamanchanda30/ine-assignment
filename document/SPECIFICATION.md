# Feature Specification: Product Price Tracker & Resilient Web Scraper

## Problem Statement

E-commerce pricing and inventory fluctuate rapidly. Retail consumers, market analysts, and operations teams require accurate, historical visibility into price and stock dynamics to make optimal purchasing and competitive decisions. However, tracking this data automatically is hindered by modern web store architectures that actively frustrate automated data extraction. 

Target storefronts (such as the INE mock store at `https://demo.inelabteamdev.com/`) feature client-side JavaScript rendering, dynamic CSS classes generated from runtime manifests, encrypted or WebAssembly-hydrated payloads, asynchronous delayed rendering, transient HTTP 5xx/429 network errors, and deliberate latency spikes. Furthermore, free-tier backend infrastructure (e.g., Render) spins down during periods of inactivity, making standard in-memory scheduling loops (`setInterval`) unreliable. 

Without an intelligent, resilient scraping pipeline and an observable tracking interface, automated scrapers fail silently, produce corrupted or empty records, or miss crucial price-drop and restocking events.

---

## Solution

A full-stack, production-grade Product Price Tracker web application comprising:
1. **Frontend Dashboard**: A responsive, modern single-page application (deployed on Vercel) allowing users to search products by partial or full name, view specific product options (sizes, kits, packs), add target options to an active tracking list, visualize price and stock history via interactive charts and tabular views, inspect comprehensive scrape audit logs, and export the entire scrape history as a standardized CSV file.
2. **Resilient Scraping Engine**: A multi-strategy scraping subsystem featuring both a lightweight HTTP fetch parser with dynamic manifest resolution and a browser-automation engine (Playwright/Puppeteer) capable of running in both headless (unattended server) and observable headed modes (with visual execution for inspection and video recording). The engine implements exponential backoff retries, jitter, DOM mutation/hydration waits, honest failure tracking, and data integrity safeguards that guarantee empty or invalid data is never persisted as truth.
3. **Persistent Cloud Storage**: A PostgreSQL database (hosted on Supabase) storing normalized product metadata, tracked item configurations, and immutable scrape attempt logs.
4. **Reliable External Scheduling**: An externally triggered cron hook (via cron-job.org) executing every 2 hours, waking up the backend service on Render to orchestrate unattended scraping runs without relying on an always-on internal server loop.

---

## User Stories

1. As a shopper, I want to search for products on the mock store by partial or full name, so that I can quickly locate items I am interested in without browsing the entire catalog.
2. As a shopper, I want to view all available options (e.g., storage sizes, pack counts, bundles) for a selected product, so that I can choose the exact variant I intend to purchase.
3. As a shopper, I want to select a specific product option and start tracking it, so that the application monitors price and stock changes on that exact SKU over time.
4. As a shopper, I want to see a confirmation when a product option is added to my tracking list, so that I know the tracking job has been successfully registered.
5. As a shopper, I want the system to scrape current prices and stock levels automatically every 2 hours, so that I do not have to manually refresh or revisit the store.
6. As a shopper, I want to view an interactive price history chart for any tracked product, so that I can identify pricing trends, discounts, and historical highs and lows.
7. As a shopper, I want to view historical stock availability alongside the price history, so that I know if an item frequently goes out of stock.
8. As a shopper, I want to view a detailed, per-product scrape log, so that I can verify when scrape attempts occurred and what their outcomes were.
9. As an auditor, I want each scrape attempt in the log to clearly display its outcome status (`success`, `retried`, or `failed`), so that I have complete transparency into scraping reliability.
10. As an auditor, I want failed scrape attempts to record the timestamp and failure reason honestly without storing fake, zero, or corrupt price data, so that reporting integrity is maintained.
11. As an analyst, I want to export the complete scrape history to a CSV file at any time with a single click, so that I can perform offline analysis or import data into external spreadsheet tools.
12. As an analyst, I want the exported CSV to follow a strict format containing the store's product ID, product name, selected option, ISO 8601 UTC timestamp, price, stock, and outcome, so that downstream processing pipelines parse the data predictably.
13. As an analyst, I want the exported CSV to include failed scrape attempts with blank price and stock fields, so that scrape failure rates can be calculated accurately without corrupting statistical calculations.
14. As an evaluator or developer, I want to trigger a scrape run in headed browser mode locally or on demand, so that I can visually observe the browser navigate the store, handle delays, and interact with the page.
15. As an evaluator, I want the scraper to visibly recover from simulated slow responses and transient server errors during a headed run, so that I can assess its resilience and error-handling mechanics.
16. As a system administrator, I want scheduled scrapes to be triggered via an external HTTP cron webhook, so that scraping occurs reliably on schedule even if the backend host sleeps between intervals.
17. As a system administrator, I want the backend service to warm up cleanly and accept cron trigger requests without timing out or dropping tasks, so that background executions complete reliably.
18. As a user, I want to manually trigger an immediate on-demand scrape for any tracked product from the dashboard, so that I do not have to wait 2 hours to see the latest price.
19. As a user, I want to remove a product option from tracking when I am no longer interested, so that my dashboard remains uncluttered and unnecessary scraping is stopped.
20. As a user, I want to receive clear feedback and toast alerts when the store experiences prolonged downtime or consecutive scrape errors, so that I understand why new price points are delayed.
21. As a user, I want the dashboard to display at least 2 to 3 pre-tracked products with genuine historical data upon initial visit, so that I immediately see a functional system with populated charts.
22. As a user, I want to receive an in-app alert or notification when a tracked product's price drops below its previous value, so that I can take advantage of sales.
23. As a user, I want to receive an alert when an out-of-stock product comes back into stock, so that I can purchase it before it sells out again.
24. As a developer, I want the scraper to detect if the target store's page structure or UI manifest shifts significantly, so that structural breakage is flagged before silent failures accumulate.
25. As a developer, I want automated unit and integration tests covering the parsing, retry logic, and export transformations, so that regressions are caught prior to deployment.

---

## Implementation Decisions

### 1. High-Level Architecture & Modules

The system is partitioned into four primary modules:

- **Store Discovery & Search Service**:
  - Connects to the mock store catalog (`/api/v2/listings` and `/api/v2/items/:id`) or extracts catalog records.
  - Exposes debounced search and product-detail endpoints for the frontend autocomplete and selection interface.
- **Resilient Scraper Engine**:
  - **Primary/Lightweight Strategy**: Direct HTTP fetching coupled with dynamic UI manifest resolution (`/api/v2/ui/manifest`) and payload extraction. This bypasses heavyweight browser overhead for rapid, energy-efficient unattended runs.
  - **Observable Browser Strategy (Playwright)**: Full browser automation engine capable of running in headed mode (`headless: false`) and headless mode. Used for visual demonstration, video recordings, and dynamic scenarios requiring full DOM script execution and client-side WebAssembly evaluation.
  - **Retry & Resilience Supervisor**: Wraps all extraction calls with configurable exponential backoff, jitter, timeout bounds (e.g., 15s request timeout), and circuit breaking on consecutive failures.
- **Data Persistence & Export Service**:
  - Interacts with Supabase PostgreSQL via an ORM/query client.
  - Manages tracked products, option configurations, and immutable scrape history records.
  - Streams CSV generation adhering strictly to the assignment specifications.
- **Scheduler & Health Hook**:
  - Exposes an authenticated webhook endpoint (e.g., `POST /api/cron/scrape`) protected by an authorization token (`CRON_SECRET`).
  - Compatible with external cron providers (such as `cron-job.org`) to wake up the Render service every 2 hours and execute the scraping queue.
  - Provides a `/healthz` lightweight ping endpoint to support warm-up pinging.

### 2. Data Models & Schemas

The database schema in Supabase PostgreSQL uses the following structure:

```sql
-- Tracked Products Table
CREATE TABLE tracked_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_product_id VARCHAR(64) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    selected_option_id VARCHAR(64) NOT NULL,
    selected_option_label VARCHAR(128) NOT NULL,
    option_axis VARCHAR(64) DEFAULT 'Option',
    product_url VARCHAR(512) NOT NULL,
    target_price_threshold NUMERIC(10, 2),
    is_active BOOLEAN DEFAULT true,
    last_scraped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_product_option UNIQUE (store_product_id, selected_option_id)
);

-- Scrape History & Log Table
CREATE TABLE scrape_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracked_product_id UUID REFERENCES tracked_products(id) ON DELETE CASCADE,
    store_product_id VARCHAR(64) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    selected_option VARCHAR(128) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    price NUMERIC(10, 2), -- NULL on failed attempts
    stock INTEGER,        -- NULL on failed attempts
    outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('success', 'retried', 'failed')),
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for performance
CREATE INDEX idx_scrape_history_product_timestamp ON scrape_history(tracked_product_id, timestamp DESC);
CREATE INDEX idx_scrape_history_store_id ON scrape_history(store_product_id);
```

### 3. CSV Export Contract

The Export endpoint generates a standard CSV file adhering to RFC 4180 with exact field definitions:

- **Columns**: `store_product_id,product_name,selected_option,timestamp,price,stock,outcome`
- **Timestamp format**: Strict ISO 8601 UTC string (e.g., `2026-09-27T14:00:00.000Z`).
- **Null handling**: When `outcome` is `'failed'`, `price` and `stock` must be completely blank (empty string between commas, e.g., `2428,Junova Resistance Bands Flex,Regular,2026-09-27T14:00:00.000Z,,,failed`).
- **Encoding**: UTF-8 with standard `text/csv` headers and `Content-Disposition: attachment; filename="scrape-history-<timestamp>.csv"`.

### 4. API Contracts

- `GET /api/products/search?q={query}`: Search target store catalog; returns matching products with available options.
- `GET /api/tracked`: Returns all active tracked products with their latest price, stock, and last scrape status.
- `POST /api/tracked`: Registers a product option for tracking.
- `DELETE /api/tracked/:id`: Deletes or deactivates a tracked product.
- `GET /api/tracked/:id/history`: Returns price and stock time-series along with scrape attempt logs.
- `POST /api/tracked/:id/scrape`: Manually triggers an immediate scrape attempt.
- `GET /api/export/csv`: Generates and streams the global scrape history CSV file.
- `POST /api/cron/scrape`: Authenticated webhook called every 2 hours by external cron service to scrape all active tracked products.
- `GET /api/health`: Health and warm-up endpoint.

### 5. Resilient Scraping & Error Recovery Workflow

1. **Warm-up & Rate-limiting**: The scheduler executes sequentially or with a controlled concurrency limit (max 2 parallel tasks) with randomized delays (500ms–1500ms) between item requests to avoid triggering 429 rate limits.
2. **Retry Protocol**:
   - Max retries: 3 attempts per scrape cycle.
   - Backoff strategy: Exponential backoff ($1s, 2s, 4s$) with $\pm 20\%$ jitter.
   - Transient errors: HTTP 500, 502, 503, 504, 428, 429, socket timeouts, and DOM element wait timeouts trigger retries.
   - Outcome classification:
     - Scrapes that succeed on the first attempt are logged as `success` (`retry_count = 0`).
     - Scrapes that succeed after 1 or more failed tries are logged as `retried` (`retry_count > 0`).
     - Scrapes that exhaust all retries are logged as `failed`, recording the error reason while setting `price = null` and `stock = null`.
3. **Headless vs. Headed Execution Seam**:
   - The scraper engine shares a single extraction contract: `scrapeProduct(storeProductId, optionId, options: { headed: boolean }): Promise<ScrapeResult>`.
   - A dedicated CLI script (`npm run scrape:headed -- --product=<id>`) enables running the scraper locally in full Chromium GUI mode for observation, verification, and recording the required video deliverable.

### 6. External Cron & Sleeping Backend Mitigation

- Free-tier Render web services spin down after 15 minutes of inactivity and take 30–50 seconds to cold start.
- `cron-job.org` is configured to call the backend trigger endpoint every 2 hours.
- A client-side timeout on the cron caller is accommodated by setting a warm-up ping 2 minutes prior to the scheduled scrape job or by having the cron hook asynchronously dispatch background jobs and return an immediate 202 Accepted while Supabase persists the execution status.

---

## Testing Decisions

### What Makes a Good Test
- Tests must verify observable system behavior from the outside (API inputs/outputs, UI interactions, database state changes, and CSV export contents), never private internal implementation details.
- Scraper tests must verify resilience against simulated network flakiness: transient 500 responses, network timeouts, delayed element rendering, and dynamic DOM mutation.

### Seams & Scope of Testing
1. **Scraper Resilience Seam (Highest Backend Seam)**:
   - Test the extraction pipeline using mock HTTP and simulated server delays/errors.
   - Verify that when the server returns 500 twice and 200 on the third attempt, the outcome is recorded as `retried` with retry count 2.
   - Verify that when the server fails persistently, the record is stored as `failed` with empty price and stock.
2. **CSV Export Transformation Seam**:
   - Test that query data with mixed `success`, `retried`, and `failed` entries produces an RFC 4180-compliant CSV where failed rows contain blank values for price and stock.
3. **Frontend Integration Seam**:
   - Test search autocomplete, tracked list rendering, chart toggling, and export trigger.

---

## Out of Scope

- Scraping any external third-party or commercial e-commerce websites (only the INE mock store `https://demo.inelabteamdev.com/` is in scope).
- Automated user purchasing or cart checkout integration.
- Custom SMS/push notification gateways (email via SendGrid and in-app notifications are sufficient for alerts).
- Multi-tenant enterprise role-based access control (RBAC).

---

## Further Notes

- **Submission Deadline**: September 27, 2026 (Sunday) - 11:59 PM IST.
- **Pre-populated Data Requirement**: At submission time, the live deployment must have at least 2–3 active products with genuine unattended multi-run scrape history in Supabase.
- **Video Deliverable**: A 2 to 4 minute screen recording of the scraper running in headed mode (`headed: true`), visibly showcasing how it handles slow or failing mock store responses.
- **Design Note Deliverable**: A concise documentation file covering scraping reliability decisions, architectural trade-offs, and an honest disclosure of how AI tools were utilized and corrected.
