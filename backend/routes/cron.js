import express from 'express';
import { getTrackedProducts, recordScrapeAttempt } from '../database/index.js';
import { scrapeProductWithRetries } from '../scraper/resilient-scraper.js';

const router = express.Router();

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// POST /api/cron/scrape
// Triggered every 2 hours via cron-job.org
router.all('/scrape', async (req, res) => {
  const secret = req.headers['x-cron-secret'] || req.headers['authorization']?.replace('Bearer ', '') || req.query.secret;
  const configuredSecret = process.env.CRON_SECRET || 'cron_sec_ine_2026';

  if (configuredSecret && secret !== configuredSecret) {
    return res.status(401).json({ error: 'Unauthorized: Invalid cron secret' });
  }

  console.log(`[Cron Trigger] Scheduled 2-hour scrape initiated at ${new Date().toISOString()}`);

  try {
    const products = await getTrackedProducts();
    if (!products || products.length === 0) {
      return res.json({ message: 'No active tracked products found to scrape', processed: 0 });
    }

    console.log(`[Cron Trigger] Processing ${products.length} tracked product(s)...`);

    const results = [];
    let successes = 0;
    let retried = 0;
    let failures = 0;

    for (const product of products) {
      try {
        console.log(`[Cron Scraper] Scraping ${product.product_name} (${product.selected_option_label})...`);
        const scrapeResult = await scrapeProductWithRetries(product.store_product_id, product.selected_option_id);

        const log = await recordScrapeAttempt({
          tracked_product_id: product.id,
          store_product_id: product.store_product_id,
          product_name: product.product_name,
          selected_option: product.selected_option_label,
          price: scrapeResult.price,
          stock: scrapeResult.stock,
          outcome: scrapeResult.outcome,
          retry_count: scrapeResult.retryCount,
          error_message: scrapeResult.errorMessage,
          duration_ms: scrapeResult.durationMs,
          timestamp: scrapeResult.timestamp
        });

        if (scrapeResult.outcome === 'success') successes++;
        else if (scrapeResult.outcome === 'retried') retried++;
        else failures++;

        results.push(log);
      } catch (itemErr) {
        console.error(`[Cron Scraper] Failed for product ${product.id}:`, itemErr.message);
        failures++;
      }

      // 800ms gentle delay between items to prevent rate limits
      await wait(800);
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      total_processed: products.length,
      stats: { successes, retried, failures },
      results
    });
  } catch (err) {
    console.error('[Cron Scraper Fatal Error]:', err.message);
    res.status(500).json({ error: 'Scheduled scrape failed', details: err.message });
  }
});

export default router;
