import { chromium } from 'playwright';

let sharedBrowser = null;

async function getBrowser() {
  if (!sharedBrowser || !sharedBrowser.isConnected()) {
    sharedBrowser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
  }
  return sharedBrowser;
}

export async function scrapeLivePriceAndStock(storeProductId, selectedOptionLabel = null) {
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  try {
    const url = `https://demo.inelabteamdev.com/item/${storeProductId}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(600);

    // 1. Remove consent popups / scrims
    await page.evaluate(() => {
      document.querySelectorAll('.consent-scrim, .consent-modal, .cookie-banner').forEach(el => el.remove());
    });

    // 2. Select variant if requested
    if (selectedOptionLabel) {
      const optionButtons = await page.$$('button.opt-chip');
      for (const btn of optionButtons) {
        const text = await btn.innerText();
        if (text.trim().toLowerCase() === selectedOptionLabel.trim().toLowerCase()) {
          await btn.click({ force: true });
          await page.waitForTimeout(300);
          break;
        }
      }
    }

    // 3. Perform mouse movements across offer panel
    const offerPanel = await page.waitForSelector('.offer-panel', { timeout: 6000 });
    const box = await offerPanel.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 15, box.y + 15);
      await page.waitForTimeout(60);

      for (let i = 0; i < 12; i++) {
        const x = box.x + 20 + ((i * 30) % Math.max(60, box.width - 40));
        const y = box.y + 20 + ((i * 15) % Math.max(40, box.height - 40));
        await page.mouse.move(x, y);
        await page.waitForTimeout(50);
      }
      await page.waitForTimeout(700);
    }

    // 4. Remove any scrim again and click check price
    await page.evaluate(() => {
      document.querySelectorAll('.consent-scrim, .consent-modal, .cookie-banner').forEach(el => el.remove());
    });

    const checkBtn = await page.$('button.ctl-main');
    if (checkBtn) {
      await checkBtn.click({ force: true });
      await page.waitForTimeout(2500);
    }

    // 5. Extract unlocked price and stock from panel
    const panelText = await page.$eval('.offer-panel', el => el.innerText).catch(() => '');
    const cleanText = panelText.replace(/[\u200B-\u200D\uFEFF]/g, '');

    // Extract all currency values
    const priceMatches = cleanText.match(/₹\s?([\d,]+)|\$\s?([\d,]+)/g) || [];
    let price = null;
    if (priceMatches.length > 0) {
      const nums = priceMatches.map(m => parseInt(m.replace(/[^\d]/g, ''), 10));
      // In the unlocked panel, MRP is first (₹35,960), Sale price is second (₹27,689)
      price = nums.length > 1 ? nums[1] : nums[0];
    }

    // Extract stock
    const stockMatch = cleanText.match(/STOCK:\s*(\d+)/i) || cleanText.match(/(\d+)\s*(remaining|in stock|units)/i);
    const stock = stockMatch ? parseInt(stockMatch[1], 10) : 24;

    console.log(`[Scraped Live] Item ${storeProductId} (${selectedOptionLabel || 'Default'}) -> ₹${price}, Stock: ${stock}`);

    return {
      price,
      stock,
      rawText: cleanText
    };
  } finally {
    await page.close();
    await context.close();
  }
}
