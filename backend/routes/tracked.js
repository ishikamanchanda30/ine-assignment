import express from 'express';
import {
  getTrackedProducts,
  getTrackedProductById,
  addTrackedProduct,
  removeTrackedProduct,
  recordScrapeAttempt,
  getProductHistory
} from '../database/index.js';
import { scrapeProductWithRetries, fetchItemDetails } from '../scraper/resilient-scraper.js';

const router = express.Router();

// Get all tracked products with latest scrape information
router.get('/', async (req, res) => {
  try {
    const products = await getTrackedProducts();
    const enriched = await Promise.all(products.map(async (p) => {
      const history = await getProductHistory(p.id);
      const latestSuccess = history.find(h => h.outcome !== 'failed' && h.price !== null);
      const latestAttempt = history[0] || null;
      return {
        ...p,
        current_price: latestSuccess ? latestSuccess.price : null,
        current_stock: latestSuccess ? latestSuccess.stock : null,
        latest_outcome: latestAttempt ? latestAttempt.outcome : null,
        total_scrapes: history.length,
        history_preview: history.slice(0, 10)
      };
    }));
    res.json(enriched);
  } catch (err) {
    console.error('[API] Get tracked products error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Add new product option to track and perform initial scrape
router.post('/', async (req, res) => {
  try {
    const { store_product_id, product_name, selected_option_id, selected_option_label, option_axis, target_price_threshold } = req.body;
    if (!store_product_id || !selected_option_id) {
      return res.status(400).json({ error: 'store_product_id and selected_option_id are required' });
    }

    // Resolve name/label if missing
    let resolvedName = product_name;
    let resolvedLabel = selected_option_label;
    let resolvedAxis = option_axis || 'Option';

    if (!resolvedName || !resolvedLabel) {
      try {
        const item = await fetchItemDetails(store_product_id);
        resolvedName = resolvedName || item.name;
        resolvedAxis = item.optionAxis || resolvedAxis;
        const opt = (item.options || []).find(o => o.id === selected_option_id) || item.options?.[0];
        resolvedLabel = resolvedLabel || opt?.label || 'Default';
      } catch (e) {
        console.warn('Could not fetch item detail during add:', e.message);
      }
    }

    const tracked = await addTrackedProduct({
      store_product_id,
      product_name: resolvedName || `Product ${store_product_id}`,
      selected_option_id,
      selected_option_label: resolvedLabel || `Option ${selected_option_id}`,
      option_axis: resolvedAxis,
      target_price_threshold
    });

    // Run initial resilient scrape
    const scrapeResult = await scrapeProductWithRetries(store_product_id, selected_option_id);
    await recordScrapeAttempt({
      tracked_product_id: tracked.id,
      store_product_id,
      product_name: tracked.product_name,
      selected_option: tracked.selected_option_label,
      price: scrapeResult.price,
      stock: scrapeResult.stock,
      outcome: scrapeResult.outcome,
      retry_count: scrapeResult.retryCount,
      error_message: scrapeResult.errorMessage,
      duration_ms: scrapeResult.durationMs,
      timestamp: scrapeResult.timestamp
    });

    const updated = await getTrackedProductById(tracked.id);
    res.status(201).json({ product: updated, initialScrape: scrapeResult });
  } catch (err) {
    console.error('[API] Add tracked product error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Remove / Untrack product
router.delete('/:id', async (req, res) => {
  try {
    await removeTrackedProduct(req.params.id);
    res.json({ success: true, message: 'Product removed from tracking' });
  } catch (err) {
    console.error('[API] Remove tracked product error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get price/stock history & audit logs for single tracked product
router.get('/:id/history', async (req, res) => {
  try {
    const product = await getTrackedProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Tracked product not found' });

    const history = await getProductHistory(req.params.id);
    res.json({
      product,
      history
    });
  } catch (err) {
    console.error(`[API] Get history error for ${req.params.id}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// Trigger manual on-demand scrape
router.post('/:id/scrape', async (req, res) => {
  try {
    const product = await getTrackedProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Tracked product not found' });

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

    res.json({ success: true, scrapeResult, log });
  } catch (err) {
    console.error(`[API] Scrape error for ${req.params.id}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
