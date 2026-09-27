import test from 'node:test';
import assert from 'node:assert';
import { scrapeProductWithRetries } from '../scraper/resilient-scraper.js';

test('Resilient Scraper - Live product scrape produces valid schema', async () => {
  const result = await scrapeProductWithRetries('2428', 'o1', 2);
  assert.ok(result.storeProductId === '2428', 'Matches store product ID');
  assert.ok(typeof result.price === 'number' || result.price === null, 'Price is valid');
  assert.ok(['success', 'retried', 'failed'].includes(result.outcome), 'Outcome is valid enum');
});

test('Resilient Scraper - Honest failure classification for invalid product', async () => {
  const result = await scrapeProductWithRetries('invalid_nonexistent_99999', 'o1', 1);
  assert.strictEqual(result.success, false, 'Failed flag is set');
  assert.strictEqual(result.outcome, 'failed', 'Outcome is strictly failed');
  assert.strictEqual(result.price, null, 'Price MUST be null on failure');
  assert.strictEqual(result.stock, null, 'Stock MUST be null on failure');
  assert.ok(result.errorMessage !== null, 'Error message is recorded honestly');
});
