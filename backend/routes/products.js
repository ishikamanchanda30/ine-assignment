import express from 'express';
import { fetchStoreCatalog, fetchItemDetails } from '../scraper/resilient-scraper.js';

const router = express.Router();

// Search store catalog
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '50', 10);
    const data = await fetchStoreCatalog(query, page, limit);
    res.json(data);
  } catch (err) {
    console.error('[API] Product search error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get single product details with options
router.get('/:id', async (req, res) => {
  try {
    const item = await fetchItemDetails(req.params.id);
    res.json(item);
  } catch (err) {
    console.error(`[API] Item ${req.params.id} fetch error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
