
// إضافة منافسة تجريبية للاختبار
console.log('🚀 إضافة منافسة تجريبية للاختبار...');

const testTender = {
  "id": "debug-tender-001",
  "name": "فحص زر العودة",
  "title": "منافسة تجريبية للفحص",
  "client": "عميل تجريبي",
  "value": 100000,
  "totalValue": 100000,
  "status": "ready_to_submit",
  "totalItems": 5,
  "pricedItems": 5,
  "technicalFilesUploaded": true,
  "phase": "جاهزة للإرسال",
  "deadline": "2025-09-25T17:46:07.730Z",
  "daysLeft": 7,
  "progress": 100,
  "completionPercentage": 100,
  "priority": "high",
  "team": "فريق التسعير",
  "manager": "مدير المشروع",
  "winChance": 80,
  "competition": "متوسطة",
  "submissionDate": "",
  "lastAction": "جاهزة للتقديم - تم إكمال جميع المتطلبات",
  "lastUpdate": "2025-09-18T17:46:07.731Z",
  "category": "اختبار",
  "location": "الرياض",
  "type": "test"
};

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
