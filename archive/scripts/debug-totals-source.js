const fs = require('fs');
const path = require('path');

console.log('🔍 فحص مصدر البيانات الخاطئة في Totals...\n');

// قراءة بيانات العطاءات
let tendersData = [];
try {
  const appDataPath = path.join(__dirname, 'src', 'data', 'appData.json');
  if (fs.existsSync(appDataPath)) {
    const appData = JSON.parse(fs.readFileSync(appDataPath, 'utf8'));
    tendersData = appData.tenders || [];
  } else {
    console.log('⚠️ ملف appData.json غير موجود');
  }
} catch (e) {
  console.error('❌ خطأ في قراءة appData.json:', e.message);
}

console.log(`📊 العدد الكلي للعطاءات: ${tendersData.length}\n`);

// البحث عن العطاء المتأثر
const targetTenderId = 'tender_1757965294269_2w0r2sye9';
const targetTender = tendersData.find(t => t.id === targetTenderId);

if (targetTender) {
  console.log('🎯 تم العثور على العطاء المستهدف:');
  console.log(`ID: ${targetTender.id}`);
  console.log(`اسم العطاء: ${targetTender.name || 'غير محدد'}`);
  
  // فحص بيانات الكميات الأساسية
  const quantities = targetTender.quantityTable || targetTender.quantities || targetTender.items || targetTender.boqItems || targetTender.quantityItems || [];
  console.log(`\n📋 عدد بنود الكميات: ${quantities.length}`);
  
  if (quantities.length > 0) {
    console.log('\n🔍 عينة من بيانات الكميات:');
    quantities.slice(0, 3).forEach((item, idx) => {
      console.log(`البند ${idx + 1}:`);
      console.log(`  الوصف: ${item.description || item.desc || item.name || 'غير محدد'}`);
      console.log(`  الكمية: ${item.quantity || 'غير محدد'}`);
      console.log(`  الوحدة: ${item.unit || item.uom || 'غير محدد'}`);
      console.log(`  سعر الوحدة: ${item.unitPrice || 'غير محدد'}`);
      console.log(`  القيمة الإجمالية: ${item.totalPrice || 'غير محدد'}`);
      if (item.breakdown) {
        console.log(`  Breakdown Total: ${item.breakdown.total || 'غير محدد'}`);
      }
      console.log('');
    });
  }
  
  // حساب إجمالي تقريبي
  let totalFromQuantities = 0;
  quantities.forEach(item => {
    const qty = item.quantity || 0;
    const unitPrice = item.unitPrice || 0;
    const totalPrice = item.totalPrice || (unitPrice * qty);
    totalFromQuantities += totalPrice;
  });
  
  console.log(`💰 الإجمالي المحسوب من البيانات الأساسية: ${totalFromQuantities.toLocaleString('ar-SA')} ر.س`);
  console.log(`📊 مقارنة مع القيم الخاطئة: 578,764,891 ر.س`);
  console.log(`📊 مقارنة مع القيم الصحيحة: 251,026 ر.س`);
  
} else {
  console.log(`❌ لم يتم العثور على العطاء بالمعرف: ${targetTenderId}`);
}

// فحص ملفات التخزين الأخرى
console.log('\n🔍 فحص ملفات التخزين...');
const storageFiles = [
  'storage.ts.json',
  'config.json', 
  'electron-store.json',
  'app-storage.json'
];

storageFiles.forEach(fileName => {
  const filePath = path.join(__dirname, fileName);
  if (fs.existsSync(filePath)) {
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`✅ تم العثور على ${fileName}`);
      
      // البحث عن snapshots
      if (content.app_pricing_snapshots) {
        const snapshots = content.app_pricing_snapshots;
        console.log(`  📸 عدد Snapshots: ${Object.keys(snapshots).length}`);
        
        if (snapshots[targetTenderId]) {
          const snap = snapshots[targetTenderId];
          console.log(`  🎯 Snapshot للعطاء المستهدف:`);
          console.log(`    تاريخ الإنشاء: ${snap.meta?.createdAt}`);
          console.log(`    المصدر: ${snap.meta?.source}`);
          console.log(`    عدد البنود: ${snap.items?.length || 0}`);
          if (snap.totals) {
            console.log(`    Totals: totalValue=${snap.totals.totalValue}, vatAmount=${snap.totals.vatAmount}`);
          }
        }
      }
    } catch (e) {
      console.log(`❌ خطأ في قراءة ${fileName}: ${e.message}`);
    }
  }
});