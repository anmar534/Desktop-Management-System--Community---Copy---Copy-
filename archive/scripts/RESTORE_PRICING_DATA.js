
// Pricing Data Restoration Script
const pricingData = {
  "tender_1757843036209_hjt6pa9ei": {
    "totalItems": 41,
    "pricedItems": 8,
    "completionPercentage": 19.51219512195122,
    "totalValue": 363492,
    "averageUnitPrice": 72.7129425885177,
    "lastUpdated": "2025-09-14T23:48:04.702Z"
  }
};

// Run this in the browser console at http://localhost:3014
// to restore the pricing data to the application

if (typeof electronAPI !== 'undefined') {
    // Electron environment
    electronAPI.store.set('app_pricing_data', pricingData);
    console.log('✅ Pricing data restored to Electron store');
} else if (typeof localStorage !== 'undefined') {
    // Browser environment
    localStorage.setItem('app_pricing_data', JSON.stringify(pricingData));
    console.log('✅ Pricing data restored to localStorage');
} else {
    console.log('❌ No storage method available');
}

console.log('📊 Restored data for tenders:', Object.keys(pricingData));
