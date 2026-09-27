# Engineering Design Note: Resilient Web Scraping & Architecture

## 1. How the Scraping Was Made Reliable

The INE mock storefront (`https://demo.inelabteamdev.com/`) introduces several deliberate obstacles designed to simulate real-world e-commerce scraping friction:
- Client-side Single Page Application (React SPA) rendering
- Dynamic CSS class generation derived from runtime UI manifests (`/api/v2/ui/manifest`)
- Delayed asynchronous price and stock hydration
- Transient HTTP 5xx errors, simulated network latency spikes, and socket timeouts
- Free-tier backend hosting (Render) that sleeps after 15 minutes of inactivity

To achieve resilient, unattended 2-hour multi-run scraping, we implemented a dual-engine extraction architecture:

### A. Exponential Backoff with Jitter
Every scrape attempt executes under a retry supervisor:
- **Retry Bounds**: Maximum 3 retries per product.
- **Backoff Formula**: $\text{Delay} = \text{BaseDelay} \times 2^{\text{attempt}} \pm \text{Jitter}$, where jitter is a randomized $\pm 20\%$ variance to avoid thundering-herd collisions.
- **Outcome Classification**: Attempts that succeed on the first try are logged as `success`. Attempts that succeed following a transient failure are logged as `retried`. Runs that exhaust all retries are recorded honestly as `failed`.
- **Data Integrity Guarantee**: On failed attempts, `price` and `stock` remain strictly `null` (and blank in CSV exports). Stale, fake, or corrupted zero values are never persisted as truth.

### B. Dual-Mode Scraping Seams (Lightweight vs. Headed Playwright)
- **Production Scheduled Runs**: Direct catalog & item option extraction with manifest mapping for high-speed, memory-efficient unattended cron execution.
- **Observable Headed Execution (`npm run scrape:headed`)**: A full Chromium browser automation pipeline using Playwright that visibly launches the browser GUI, navigates the DOM, interacts with option chips, triggers asynchronous price unlocking, and logs step-by-step progress—perfect for demonstration and the required 2–4 minute video recording.

### C. Sleeping Backend Mitigation (External Cron Hook)
Because free-tier instances on Render sleep after 15 minutes, an internal `setInterval` loop cannot guarantee execution. We implemented an authenticated webhook endpoint (`POST /api/cron/scrape`) triggered externally via `cron-job.org` every 2 hours, paired with a lightweight `/health` warm-up ping.

---

## 2. Architectural Trade-offs & Decisions

1. **Lightweight API/DOM Resolution vs. Full Headless Browser for Cron**:
   - *Trade-off*: Running headless Chromium on Render's free tier consumes ~300MB RAM and 10–15s per run.
   - *Decision*: We created a dual approach—a lightweight resilient HTTP engine for automated 2-hour cron runs, alongside a full Playwright headed runner for visual observation, local inspection, and video recording.
2. **Supabase PostgreSQL with Local File Fallback**:
   - *Trade-off*: Network latency or missing remote credentials during local development.
   - *Decision*: Implemented a hybrid database client in `backend/database/index.js` that connects to Supabase in production and falls back smoothly to a local structured store if offline, guaranteeing zero setup friction.
3. **Strict CSV Export Standard (RFC 4180)**:
   - *Trade-off*: Handling complex commas or quotes in product descriptions.
   - *Decision*: Implemented strict RFC 4180 escaping with blank fields for failed scrape outcomes to ensure automated analytics pipelines parse the data without schema errors.

---

## 3. AI Tool Usage Disclosure & First-Attempt Corrections

### AI Tool Usage
AI was utilized in accordance with the assignment guidelines to assist with scaffolding boilerplate, synthesizing the comprehensive specification sheet ([`document/SPECIFICATION.md`](./SPECIFICATION.md)), generating schema definitions, and structuring unit tests.

### What AI Got Wrong on the First Attempt & How It Was Corrected
1. **Initial Assumption of Static HTML Scraping**:
   - *Initial Output*: The AI initially suggested scraping product pages using basic Cheerio CSS selectors (`.price`, `.stock`).
   - *Store Reality*: Inspection of `https://demo.inelabteamdev.com/` revealed it is a Client-Side Rendered (CSR) application where prices are initially rendered as "Price locked" and dynamically loaded via runtime manifests and JS hydration.
   - *Correction*: Refactored the scraper to resolve dynamic endpoints (`/api/v2/items/:id`, `/api/v2/ui/manifest`) and created a full Playwright browser automation runner with explicit element hydration and click interactions.
2. **Handling Failed Scrape Records in CSV Export**:
   - *Initial Output*: Initial AI code formatted failed rows by defaulting numeric values to `0` or `"N/A"`.
   - *Correction*: The assignment specification strictly requires that failed attempts leave price and stock empty. Corrected the CSV serializer to output empty fields between commas (`2428,Junova Resistance Bands Flex,Regular,2026-09-27T14:00:00.000Z,,,failed`) to maintain mathematical integrity in downstream price calculations.
3. **Internal Node Scheduling on Sleeping Containers**:
   - *Initial Output*: AI initially proposed using `node-cron` inside the Express process.
   - *Correction*: Identified that Render free-tier containers go to sleep when inactive, killing in-memory timers. Replaced internal loops with an authenticated external webhook (`POST /api/cron/scrape`) designed for `cron-job.org`.
