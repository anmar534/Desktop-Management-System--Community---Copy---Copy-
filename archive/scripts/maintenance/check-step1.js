const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('=== STEP 1: Checking localStorage on port 3014 ===');
  console.log('Timestamp:', new Date().toISOString());
  
  await page.goto('http://localhost:3014');
  
  // Wait for app to load
  await page.waitForSelector('body', { timeout: 10000 });
  
  // Check localStorage contents
  const localStorageData = await page.evaluate(() => {
    const storageKeys = {
      TENDERS: 'app_tenders_data',
      PROJECTS: 'app_projects_data', 
      CLIENTS: 'app_clients_data',
      FINANCIAL: 'app_financial_data',
      SETTINGS: 'app_settings_data',
      PURCHASE_ORDERS: 'app_purchase_orders_data',
      EXPENSES: 'app_expenses_data',
      BOQ_DATA: 'app_boq_data',
      PRICING_DATA: 'app_pricing_data',
      RELATIONS: 'app_entity_relations',
      TENDER_BACKUPS: 'app_tender_backups',
      TENDER_STATS: 'app_tender_stats'
    };
    
    const result = {};
    for (const [name, key] of Object.entries(storageKeys)) {
      const value = localStorage.getItem(key);
      result[name] = value ? JSON.parse(value) : null;
    }
    
    return result;
  });
  
  console.log('localStorage contents:');
  for (const [key, value] of Object.entries(localStorageData)) {
    console.log(`${key}:`, Array.isArray(value) ? `Array(${value.length})` : value ? 'Object' : 'null');
    if (Array.isArray(value) && value.length > 0) {
      console.log(`  Sample: ${JSON.stringify(value[0], null, 2).substring(0, 200)}...`);
    }
  }
  
  // Take screenshot
  await page.screenshot({ path: 'step1-port3014-app.png', fullPage: true });
  console.log('Screenshot saved as step1-port3014-app.png');
  
  await browser.close();
})().catch(console.error);