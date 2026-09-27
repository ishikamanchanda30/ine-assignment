import { addTrackedProduct, recordScrapeAttempt, getTrackedProducts } from '../database/index.js';
import { scrapeProductWithRetries } from '../scraper/resilient-scraper.js';

const SEED_PRODUCTS = [
  {
    store_product_id: '2428',
    product_name: 'Junova Resistance Bands Flex',
    selected_option_id: 'o2',
    selected_option_label: 'Regular',
    option_axis: 'Level',
    product_url: 'https://demo.inelabteamdev.com/item/2428'
  },
  {
    store_product_id: '2081',
    product_name: 'Mosella Mirrorless Camera Go',
    selected_option_id: 'o1',
    selected_option_label: 'Body only',
    option_axis: 'Kit',
    product_url: 'https://demo.inelabteamdev.com/item/2081'
  },
  {
    store_product_id: '2714',
    product_name: 'Saffrix Mesh System Duo',
    selected_option_id: 'o2',
    selected_option_label: '2-pack',
    option_axis: 'Pack',
    product_url: 'https://demo.inelabteamdev.com/item/2714'
  }
];

export async function seedDatabase() {
  console.log('Seeding initial products and history into database...');

  for (const item of SEED_PRODUCTS) {
    const tracked = await addTrackedProduct(item);
    console.log(`[Seed] Added tracked product: ${tracked.product_name} (${tracked.selected_option_label})`);

    // Generate historical scrape logs for past 12 hours (spaced every 2 hours)
    const now = Date.now();
    const historyPoints = [
      { hoursAgo: 10, price: 1499, stock: 32, outcome: 'success', retry_count: 0 },
      { hoursAgo: 8, price: 1499, stock: 28, outcome: 'success', retry_count: 0 },
      { hoursAgo: 6, price: null, stock: null, outcome: 'failed', retry_count: 3, error_message: 'HTTP 503 Service Unavailable' },
      { hoursAgo: 4, price: 1399, stock: 20, outcome: 'retried', retry_count: 1 },
      { hoursAgo: 2, price: 1399, stock: 18, outcome: 'success', retry_count: 0 }
    ];

    for (const pt of historyPoints) {
      const timestamp = new Date(now - pt.hoursAgo * 60 * 60 * 1000).toISOString();
      await recordScrapeAttempt({
        tracked_product_id: tracked.id,
        store_product_id: tracked.store_product_id,
        product_name: tracked.product_name,
        selected_option: tracked.selected_option_label,
        timestamp,
        price: pt.price,
        stock: pt.stock,
        outcome: pt.outcome,
        retry_count: pt.retry_count,
        error_message: pt.error_message || null,
        duration_ms: Math.floor(400 + Math.random() * 800)
      });
    }

    // Execute 1 live scrape now
    console.log(`[Seed] Executing live scrape for ${tracked.product_name}...`);
    const liveScrape = await scrapeProductWithRetries(tracked.store_product_id, tracked.selected_option_id);
    await recordScrapeAttempt({
      tracked_product_id: tracked.id,
      store_product_id: tracked.store_product_id,
      product_name: tracked.product_name,
      selected_option: tracked.selected_option_label,
      timestamp: liveScrape.timestamp,
      price: liveScrape.price,
      stock: liveScrape.stock,
      outcome: liveScrape.outcome,
      retry_count: liveScrape.retryCount,
      error_message: liveScrape.errorMessage,
      duration_ms: liveScrape.durationMs
    });
  }

  console.log('[Seed] Database seeding completed successfully!');
}

if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
