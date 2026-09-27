import { runHeadedScrape } from '../scraper/headed-scraper.js';

const productId = process.argv[2] || '2428';
const optionIndex = parseInt(process.argv[3] || '0', 10);

console.log(`Starting headed scraper execution for item: ${productId}`);

runHeadedScrape(productId, optionIndex)
  .then(res => {
    console.log('Headed scrape finished successfully.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Headed scrape failed:', err);
    process.exit(1);
  });
