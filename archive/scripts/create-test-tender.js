/**
 * إنشاء منافسة تجريبية سريعة للاختبار
 */
const fs = require('fs');
const path = require('path');

// إنشاء منافسة تجريبية في localStorage simulation
const testTender = {
  id: 'debug-tender-001',
  name: 'فحص زر العودة',
  title: 'منافسة تجريبية للفحص',
  client: 'عميل تجريبي',
  value: 100000,
  totalValue: 100000,
  status: 'ready_to_submit', // هذا يجب أن يُظهر زر "إرسال" وزر "عودة للتسعير"
  totalItems: 5,
  pricedItems: 5,
  technicalFilesUploaded: true,
  phase: 'جاهزة للإرسال',
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  daysLeft: 7,
  progress: 100,
  completionPercentage: 100,
  priority: 'high',
  team: 'فريق التسعير',
  manager: 'مدير المشروع',
  winChance: 80,
  competition: 'متوسطة',
  submissionDate: '',
  lastAction: 'جاهزة للتقديم - تم إكمال جميع المتطلبات',
  lastUpdate: new Date().toISOString(),
  category: 'اختبار',
  location: 'الرياض',
  type: 'test'
};

// كتابة script بسيط لإضافة البيانات للتطبيق
const scriptContent = `
// إضافة منافسة تجريبية للاختبار
console.log('🚀 إضافة منافسة تجريبية للاختبار...');

const testTender = ${JSON.stringify(testTender, null, 2)};

// محاولة إضافة المنافسة للبيانات المركزية
if (window.electronAPI && window.electronAPI.store) {
  try {
    window.electronAPI.store.set('app_tenders_data', JSON.stringify([testTender]));
    console.log('✅ تم إضافة المنافسة التجريبية للتخزين');
    
    // إعادة تحميل الصفحة لرؤية التحديث
    setTimeout(() => {
      console.log('🔄 إعادة تحميل الصفحة...');
      window.location.reload();
    }, 1000);
  } catch (error) {
    console.error('❌ خطأ في إضافة البيانات:', error);
  }
} else {
  console.log('⚠️ electronAPI غير متاح - استخدام localStorage');
  try {
    localStorage.setItem('app_tenders_data', JSON.stringify([testTender]));
    console.log('✅ تم إضافة المنافسة التجريبية لـ localStorage');
    
    // إعادة تحميل الصفحة
    setTimeout(() => {
      console.log('🔄 إعادة تحميل الصفحة...');
      window.location.reload();
    }, 1000);
  } catch (error) {
    console.error('❌ خطأ في localStorage:', error);
  }
}
`;

fs.writeFileSync(path.join(__dirname, 'inject-test-tender.js'), scriptContent);

console.log('📝 تم إنشاء سكريبت إضافة المنافسة التجريبية');
console.log('');
console.log('📋 المنافسة التجريبية:');
console.log(`   الاسم: ${testTender.name}`);
console.log(`   الحالة: ${testTender.status}`);
console.log(`   متوقع: زر "إرسال" + زر "عودة للتسعير"`);
console.log('');
console.log('🎯 لتطبيق الاختبار:');
console.log('1. افتح التطبيق في المتصفح');
console.log('2. افتح Developer Tools (F12)');
console.log('3. انسخ محتوى inject-test-tender.js والصقه في Console');
console.log('4. اضغط Enter لتنفيذ السكريبت');
console.log('5. انتظر إعادة التحميل وتحقق من زر العودة');