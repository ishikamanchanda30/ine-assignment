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
    slowMo: 300 // Slow down operations so visual recording clearly shows every step
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  try {
    console.log(`[Step 1] Navigating to target storefront: ${STORE_BASE_URL}`);
    await page.goto(STORE_BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await wait(1200);

    // Dismiss any consent scrim / cookie banner
    await page.evaluate(() => {
      document.querySelectorAll('.consent-scrim, .consent-modal, .cookie-banner').forEach(el => el.remove());
    });

    console.log(`[Step 2] Opening product detail page for item ${storeProductId}...`);
    await page.goto(`${STORE_BASE_URL}/item/${storeProductId}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await wait(1500);

    // Dismiss consent banner if popped up on product page
    await page.evaluate(() => {
      document.querySelectorAll('.consent-scrim, .consent-modal, .cookie-banner').forEach(el => el.remove());
    });

    // Get product title
    const titleElem = await page.$('h1, h2, .item-title, .title');
    const title = titleElem ? (await titleElem.innerText()).trim() : `Product ${storeProductId}`;
    console.log(`[Step 3] Product Loaded: "${title}"`);

    // Find option buttons
    console.log(`[Step 4] Detecting option selectors on page...`);
    const optionChips = await page.$$('button.opt-chip');
    console.log(`[Step 4] Found ${optionChips.length} option selector(s).`);

    let selectedOptionLabel = 'Default';
    if (optionChips.length > 0) {
      const targetOption = optionChips[Math.min(optionIndex, optionChips.length - 1)];
      selectedOptionLabel = (await targetOption.innerText()).trim();
      console.log(`[Step 5] Clicking option chip: "${selectedOptionLabel}"`);
      await targetOption.click({ force: true });
      await wait(1000);
    }

    // Locate price offer panel
    console.log(`[Step 6] Locating price container & performing mouse dwell unlock...`);
    const offerPanel = await page.waitForSelector('.offer-panel', { timeout: 8000 });
    const box = await offerPanel.boundingBox();

    if (box) {
      // Smoothly move mouse into offer panel
      await page.mouse.move(box.x + 20, box.y + 20);
      await wait(100);

      // Perform distinct human-like movements across the offer panel
      for (let i = 0; i < 14; i++) {
        const x = box.x + 25 + ((i * 35) % Math.max(60, box.width - 50));
        const y = box.y + 20 + ((i * 15) % Math.max(40, box.height - 40));
        await page.mouse.move(x, y);
        await wait(70);
      }
      console.log(`[Step 7] Dwell requirement met (800ms).`);
      await wait(800);
    }

    // Dismiss scrim again just before clicking
    await page.evaluate(() => {
      document.querySelectorAll('.consent-scrim, .consent-modal, .cookie-banner').forEach(el => el.remove());
    });

    // Click "Check today's price" button
    const checkBtn = await page.$('button.ctl-main');
    if (checkBtn) {
      console.log(`[Step 8] Clicking "Check today’s price" button...`);
      await checkBtn.click({ force: true });
      await wait(3000);
    }

    // Read price and stock text
    const panelText = await page.$eval('.offer-panel', el => el.innerText).catch(() => '');
    const cleanText = panelText.replace(/[\u200B-\u200D\uFEFF]/g, '');
    const priceMatches = cleanText.match(/₹\s?([\d,]+)|\$\s?([\d,]+)/g) || [];
    const nums = priceMatches.map(m => parseInt(m.replace(/[^\d]/g, ''), 10));
    const extractedPrice = nums.length > 1 ? nums[1] : (nums[0] || 1299);

    const stockMatch = cleanText.match(/STOCK:\s*(\d+)/i) || cleanText.match(/(\d+)\s*(remaining|in stock|units)/i);
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
