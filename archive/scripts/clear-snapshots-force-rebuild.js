// 🔄 Script لمسح Snapshots وإجبار إعادة البناء ببيانات التسعير الصحيحة
// شغل هذا في Console لمسح البيانات الخاطئة وإعادة البناء

console.log("🔄 Starting snapshots cleanup and force rebuild...");

// 1. فحص بيانات التسعير المحفوظة
function checkPricingData() {
    const pricingData = localStorage.getItem('PRICING_DATA');
    if (!pricingData) {
        console.log("❌ No PRICING_DATA found in localStorage");
        return null;
    }
    
    try {
        const parsed = JSON.parse(pricingData);
        console.log("📊 PRICING_DATA found:", Object.keys(parsed));
        
        // عرض تفاصيل كل منافسة
        Object.entries(parsed).forEach(([tenderId, data]) => {
            console.log(`📋 Tender ${tenderId}:`, {
                itemsCount: data?.items?.length || 0,
                sampleItem: data?.items?.[0] || null,
                hasValidPricing: data?.items?.some(item => item.unitPrice > 0 || item.totalPrice > 0)
            });
        });
        
        return parsed;
    } catch (error) {
        console.error("❌ Error parsing PRICING_DATA:", error);
        return null;
    }
}

// 2. فحص Snapshots الحالية
function checkCurrentSnapshots() {
    const snapshots = localStorage.getItem('PRICING_SNAPSHOTS');
    if (!snapshots) {
        console.log("📭 No PRICING_SNAPSHOTS found");
        return null;
    }
    
    try {
        const parsed = JSON.parse(snapshots);
        console.log("📸 Current snapshots:", Object.keys(parsed));
        
        Object.entries(parsed).forEach(([tenderId, snapshot]) => {
            const totals = snapshot?.totals;
            console.log(`📊 Snapshot ${tenderId}:`, {
                totalValue: totals?.totalValue || 0,
                itemsCount: snapshot?.items?.length || 0,
                isZero: totals?.totalValue === 0,
                isSuspicious: totals?.totalValue > 10000000
            });
        });
        
        return parsed;
    } catch (error) {
        console.error("❌ Error parsing PRICING_SNAPSHOTS:", error);
        return null;
    }
}

// 3. مسح جميع Snapshots
function clearAllSnapshots() {
    console.log("🗑️ Clearing all pricing snapshots...");
    localStorage.removeItem('PRICING_SNAPSHOTS');
    console.log("✅ All snapshots cleared");
}

// 4. إجبار إعادة تحميل الصفحة لتشغيل إعادة البناء
function forcePageReload() {
    console.log("🔄 Forcing page reload to trigger rebuild...");
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// تشغيل العملية كاملة
function runFullCleanup() {
    console.log("=".repeat(50));
    console.log("🚀 STARTING FULL CLEANUP AND REBUILD");
    console.log("=".repeat(50));
    
    // فحص البيانات الحالية
    console.log("\n1️⃣ Checking current pricing data...");
    const pricingData = checkPricingData();
    
    console.log("\n2️⃣ Checking current snapshots...");
    const snapshots = checkCurrentSnapshots();
    
    if (!pricingData) {
        console.log("❌ No pricing data found - cannot rebuild properly");
        return;
    }
    
    // مسح Snapshots
    console.log("\n3️⃣ Clearing snapshots...");
    clearAllSnapshots();
    
    console.log("\n4️⃣ Reloading page to trigger rebuild...");
    forcePageReload();
}

// تشغيل تلقائي
runFullCleanup();