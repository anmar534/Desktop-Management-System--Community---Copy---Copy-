/**
 * اختبار مباشر للتحقق من منطق أزرار العودة
 */

// محاكاة بيانات المنافسة كما تظهر في الصورة
const tenderFromImage = {
  id: 'test-tender',
  name: 'تحت الإجراء',
  status: 'ready_to_submit', // لأن زر الإجراء الرئيسي هو "إرسال"
  // ... باقي البيانات
};

console.log('🔍 تحليل منطق زر العودة للمنافسة في الصورة');
console.log('==============================================');

console.log('📋 بيانات المنافسة:');
console.log(`   الاسم: ${tenderFromImage.name}`);
console.log(`   الحالة: ${tenderFromImage.status}`);
console.log(`   زر الإجراء الرئيسي المتوقع: إرسال`);

console.log('');
console.log('🔧 فحص شرط ظهور زر العودة:');
console.log(`   الشرط: (tender.status === 'submitted' || tender.status === 'ready_to_submit')`);
console.log(`   submitted: ${tenderFromImage.status === 'submitted'}`);
console.log(`   ready_to_submit: ${tenderFromImage.status === 'ready_to_submit'}`);
console.log(`   النتيجة: ${tenderFromImage.status === 'submitted' || tenderFromImage.status === 'ready_to_submit'}`);

if (tenderFromImage.status === 'submitted' || tenderFromImage.status === 'ready_to_submit') {
  const returnText = tenderFromImage.status === 'submitted' ? 'عودة للإرسال' : 'عودة للتسعير';
  console.log(`   ✅ يجب أن يظهر زر العودة مع النص: "${returnText}"`);
} else {
  console.log('   ❌ لن يظهر زر العودة');
}

console.log('');
console.log('🎯 التشخيص المحتمل:');
console.log('1. إذا كانت الحالة فعلاً ready_to_submit، فالمنطق صحيح ويجب أن يظهر الزر');
console.log('2. قد تكون المشكلة في أن الحالة الفعلية مختلفة عن المتوقع');
console.log('3. قد تكون مشكلة في عرض CSS أو ترتيب العناصر');
console.log('4. قد تكون البيانات محملة من مصدر آخر (electron-store)');

console.log('');
console.log('🔍 للتحقق من السبب:');
console.log('1. افحص حالة المنافسة الفعلية في البيانات');
console.log('2. تأكد من أن الشرط يتم تقييمه بشكل صحيح');
console.log('3. افحص console.log في المتصفح للأخطاء');
console.log('4. تأكد من أن onRevertStatus تم تمريرها بشكل صحيح');