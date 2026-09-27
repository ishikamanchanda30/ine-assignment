import test from 'node:test';
import assert from 'node:assert';
import { generateScrapeHistoryCsv } from '../routes/export.js';

test('CSV Export - Generates strict RFC 4180 format with correct header columns', () => {
  const mockRecords = [
    {
      store_product_id: '2428',
      product_name: 'Junova Resistance Bands Flex',
      selected_option: 'Regular',
      timestamp: '2026-09-27T12:00:00.000Z',
      price: 1499,
      stock: 25,
      outcome: 'success'
    },
    {
      store_product_id: '2428',
      product_name: 'Junova Resistance Bands Flex',
      selected_option: 'Regular',
      timestamp: '2026-09-27T14:00:00.000Z',
      price: null,
      stock: null,
      outcome: 'failed'
    }
  ];

  const csv = generateScrapeHistoryCsv(mockRecords);
  const lines = csv.split('\r\n');

  assert.strictEqual(lines[0], 'store_product_id,product_name,selected_option,timestamp,price,stock,outcome');

  // Verify success row
  assert.ok(lines[1].includes('2428,Junova Resistance Bands Flex,Regular,2026-09-27T12:00:00.000Z,1499,25,success'));

  // Verify failed row has empty price and stock
  assert.ok(lines[2].includes('2428,Junova Resistance Bands Flex,Regular,2026-09-27T14:00:00.000Z,,,failed'), 'Failed row must leave price and stock empty');
});
