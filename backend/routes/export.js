import express from 'express';
import { getAllScrapeHistory } from '../database/index.js';

const router = express.Router();

function escapeCsvField(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateScrapeHistoryCsv(records) {
  const headers = ['store_product_id', 'product_name', 'selected_option', 'timestamp', 'price', 'stock', 'outcome'];
  const rows = records.map(record => {
    // Exact schema requirements:
    // store's product ID (as shown in product page URL), product name, selected option, timestamp (ISO 8601, UTC), price, stock, outcome
    // Failed attempts MUST have price and stock left completely empty!
    const isFailed = record.outcome === 'failed';
    const priceVal = isFailed || record.price === null || record.price === undefined ? '' : record.price;
    const stockVal = isFailed || record.stock === null || record.stock === undefined ? '' : record.stock;
    const timestampUtc = new Date(record.timestamp).toISOString();

    return [
      escapeCsvField(record.store_product_id),
      escapeCsvField(record.product_name),
      escapeCsvField(record.selected_option),
      escapeCsvField(timestampUtc),
      escapeCsvField(priceVal),
      escapeCsvField(stockVal),
      escapeCsvField(record.outcome)
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

// GET /api/export/csv
router.get('/csv', async (req, res) => {
  try {
    const history = await getAllScrapeHistory();
    const csvContent = generateScrapeHistoryCsv(history);
    const filename = `scrape-history-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (err) {
    console.error('[API] CSV export error:', err.message);
    res.status(500).json({ error: 'Failed to generate CSV export' });
  }
});

export default router;
