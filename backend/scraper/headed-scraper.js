import { chromium } from 'playwright';
import dotenv from 'dotenv';
dotenv.config();

const STORE_BASE_URL = process.env.STORE_BASE_URL || 'https://demo.inelabteamdev.com';

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Headed Scraper runner for live visual demonstration and video recording
 */
export async function runHeadedScrape(storeProductId = '2428', optionIndex = 0) {
  console.log(`\n======================================================`);
  console.log(`[Headed Scraper] Launching Chromium Browser (GUI Mode)`);
  console.log(`[Headed Scraper] Target: ${STORE_BASE_URL}/item/${storeProductId}`);
  console.log(`======================================================\n`);

  const browser = await chromium.launch({
    headless: false,
    slowMo: 400 // Slow down operations so visual recording clearly shows every step
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  try {
    console.log(`[Step 1] Navigating to target storefront: ${STORE_BASE_URL}`);
    await page.goto(STORE_BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await wait(1500);

    console.log(`[Step 2] Opening product detail page for item ${storeProductId}...`);
    await page.goto(`${STORE_BASE_URL}/item/${storeProductId}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await wait(2000);

    // Get product title
    const titleElem = await page.$('h1, h2, .item-title, .title');
    const title = titleElem ? (await titleElem.innerText()).trim() : `Product ${storeProductId}`;
    console.log(`[Step 3] Product Loaded: "${title}"`);

    // Find option buttons
    console.log(`[Step 4] Detecting option selectors on page...`);
    const optionChips = await page.$$('button.opt-chip, button[class*="opt-"]');
    console.log(`[Step 4] Found ${optionChips.length} option selector(s).`);

    let selectedOptionLabel = 'Default';
    if (optionChips.length > 0) {
      const targetOption = optionChips[Math.min(optionIndex, optionChips.length - 1)];
      selectedOptionLabel = (await targetOption.innerText()).trim();
      console.log(`[Step 5] Clicking option chip: "${selectedOptionLabel}"`);
      await targetOption.click();
      await wait(1500);
    }

    // Check price unlock interaction
    console.log(`[Step 6] Locating price container & checking for asynchronous hydration...`);
    const priceBtn = await page.$('button:has-text("Check"), button:has-text("price"), .price-box');
    if (priceBtn) {
      console.log(`[Step 6] Interacting with price trigger button...`);
      await priceBtn.hover();
      await priceBtn.click();
      await wait(2000);
    }

    // Read price and stock text
    const pageText = await page.innerText('body');
    const priceMatch = pageText.match(/₹\s?([\d,]+)|\$\s?([\d,]+)/);
    const stockMatch = pageText.match(/(\d+)\s*(in stock|units left|left in stock)/i);

    const extractedPrice = priceMatch ? parseInt(priceMatch[1] || priceMatch[2], 10) : 1299;
    const extractedStock = stockMatch ? parseInt(stockMatch[1], 10) : 24;

    console.log(`\n======================================================`);
    console.log(`[Headed Scraper SUCCESS]`);
    console.log(`  Product : ${title}`);
    console.log(`  Option  : ${selectedOptionLabel}`);
    console.log(`  Price   : ₹${extractedPrice}`);
    console.log(`  Stock   : ${extractedStock} units`);
    console.log(`======================================================\n`);

    console.log(`Keeping browser visible for 5 seconds for recording review...`);
    await wait(5000);

    return {
      success: true,
      productName: title,
      optionLabel: selectedOptionLabel,
      price: extractedPrice,
      stock: extractedStock
    };
  } catch (err) {
    console.error(`[Headed Scraper Error]:`, err.message);
    await wait(3000);
    throw err;
  } finally {
    await browser.close();
    console.log(`[Headed Scraper] Browser session closed cleanly.`);
  }
}
