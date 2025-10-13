const fs = require('fs');

console.log('=== إنشاء بيانات المناقصة من بيانات التسعير ===');

const configPath = "C:\\Users\\ammn\\AppData\\Roaming\\desktop-management-system-community\\config.json";

try {
    // قراءة الملف الحالي
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    console.log('📄 تم تحميل ملف التكوين');
    console.log('🔑 المفاتيح الحالية:', Object.keys(config));
    
    // استخراج معلومات المناقصة من بيانات التسعير
    const pricingKey = 'tender-pricing-tender_1757843036209_hjt6pa9ei';
    
    if (config[pricingKey]) {
        const pricingData = JSON.parse(config[pricingKey]);
        console.log('✅ تم العثور على بيانات التسعير');
        
        // إنشاء بيانات المناقصة الأساسية
        const tenderData = {
            id: 'tender_1757843036209_hjt6pa9ei',
            name: 'مشروع إنشاء 1/H/ 1/E (مستعاد من البيانات)',
            description: 'منافسة تم استعادتها من بيانات التسعير المحفوظة',
            status: 'under_action', // قيد التنفيذ لأن التسعير موجود
            value: 363492, // من الإحصائيات المحفوظة
            currency: 'SAR',
            submissionDate: '2025-09-20T00:00:00.000Z', // تاريخ افتراضي
            createdAt: '2025-09-14T00:00:00.000Z',
            updatedAt: new Date().toISOString(),
            client: 'عميل مستعاد',
            location: 'الموقع غير محدد',
            category: 'إنشاءات',
            priority: 'medium',
            progress: 19.5, // من الإحصائيات
            winChance: 75,
            notes: 'تم استعادة هذه المنافسة من بيانات التسعير المحفوظة. القيمة والتفاصيل مبنية على آخر بيانات متاحة.',
            recovered: true,
            originalId: 'tender_1757843036209_hjt6pa9ei'
        };
        
        // إضافة معلومات إضافية من بيانات التسعير إذا وجدت
        if (pricingData.pricing && pricingData.pricing.length > 0) {
            const latestPricing = pricingData.pricing[pricingData.pricing.length - 1];
            if (latestPricing[1] && latestPricing[1].totalCost) {
                tenderData.value = latestPricing[1].totalCost;
            }
            
            if (latestPricing[1] && latestPricing[1].materials) {
                const materialCount = latestPricing[1].materials.length;
                tenderData.notes += ` تحتوي على ${materialCount} مادة مسعرة.`;
            }
        }
        
        // إنشاء مصفوفة المناقصات
        const tenders = [tenderData];
        
        // إضافة بيانات المناقصات إلى التكوين
        config.app_tenders_data = JSON.stringify(tenders);
        
        // حفظ التكوين المحدث
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        console.log('✅ تم إنشاء وحفظ بيانات المناقصة بنجاح!');
        console.log('📊 تفاصيل المناقصة المستعادة:');
        console.log(`   🎯 الاسم: ${tenderData.name}`);
        console.log(`   🆔 المعرف: ${tenderData.id}`);
        console.log(`   💰 القيمة: ${tenderData.value.toLocaleString()} ريال`);
        console.log(`   📈 التقدم: ${tenderData.progress}%`);
        console.log(`   📋 الحالة: ${tenderData.status}`);
        
        // إنشاء تقرير الاستعادة
        const recoveryReport = {
            timestamp: new Date().toISOString(),
            action: 'Tender Data Recovery from Pricing Data',
            success: true,
            recoveredTender: tenderData,
            sourceData: {
                pricingKey: pricingKey,
                pricingEntries: pricingData.pricing ? pricingData.pricing.length : 0
            },
            restoredFields: [
                'id', 'name', 'description', 'status', 'value', 
                'currency', 'submissionDate', 'createdAt', 'updatedAt',
                'client', 'location', 'category', 'priority', 
                'progress', 'winChance', 'notes'
            ]
        };
        
        fs.writeFileSync('TENDER_RECOVERY_REPORT.json', JSON.stringify(recoveryReport, null, 2));
        console.log('📋 تقرير الاستعادة محفوظ في TENDER_RECOVERY_REPORT.json');
        
        console.log('\n🎯 الخطوات التالية:');
        console.log('====================');
        console.log('1. أعد تشغيل التطبيق (npm run dev:electron)');
        console.log('2. تحقق من ظهور المناقصة في قائمة المناقصات');
        console.log('3. تأكد من أن بيانات التسعير مرتبطة بالمناقصة');
        
    } else {
        console.log('❌ لم يتم العثور على بيانات التسعير');
        console.log('🔍 المفاتيح المتاحة:', Object.keys(config));
    }
    
} catch (error) {
    console.log('❌ خطأ في استعادة بيانات المناقصة:', error.message);
    console.log('📋 تفاصيل الخطأ:', error);
}