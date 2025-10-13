// فحص مباشر لبيانات BOQ في التطبيق
const fs = require('fs');

console.log('🔍 فحص بيانات BOQ المباشرة في التطبيق');
console.log('='.repeat(60));

// قراءة البيانات المحفوظة
const dataFiles = [
    './DATA_BACKUP.json',
    './ALL_RECOVERED_DATA.json',
    './app_clients_data.json',
    './MINIMAL_RECOVERY.json',
    './RECOVERED_DATA_BACKUP.json'
];

let projectData = null;

for (const file of dataFiles) {
    if (fs.existsSync(file)) {
        try {
            const data = JSON.parse(fs.readFileSync(file, 'utf8'));
            console.log(`\n📂 فحص ${file}:`);
            
            // البحث عن بيانات المشاريع
            if (data.projects && Array.isArray(data.projects) && data.projects.length > 0) {
                const project = data.projects[0];
                console.log(`   ✅ وُجد ${data.projects.length} مشروع`);
                
                if (project.items && Array.isArray(project.items)) {
                    console.log(`   📋 المشروع الأول يحتوي على ${project.items.length} بند`);
                    
                    // فحص أول 3 بنود
                    console.log('\n   🔍 فحص أول 3 بنود:');
                    project.items.slice(0, 3).forEach((item, index) => {
                        console.log(`\n   البند ${index + 1}:`);
                        console.log(`     ID: ${item.id} (نوع: ${typeof item.id})`);
                        console.log(`     description: "${item.description || 'غير موجود'}"`);
                        console.log(`     itemName: "${item.itemName || 'غير موجود'}"`);
                        console.log(`     name: "${item.name || 'غير موجود'}"`);
                        console.log(`     المفاتيح المتاحة: [${Object.keys(item).join(', ')}]`);
                    });
                    
                    projectData = project;
                    break;
                }
            }
            
            // البحث في app_projects_data
            if (data.app_projects_data && Array.isArray(data.app_projects_data) && data.app_projects_data.length > 0) {
                const project = data.app_projects_data[0];
                console.log(`   ✅ وُجد ${data.app_projects_data.length} مشروع في app_projects_data`);
                
                if (project.items && Array.isArray(project.items)) {
                    console.log(`   📋 المشروع الأول يحتوي على ${project.items.length} بند`);
                    
                    // فحص أول 3 بنود
                    console.log('\n   🔍 فحص أول 3 بنود من app_projects_data:');
                    project.items.slice(0, 3).forEach((item, index) => {
                        console.log(`\n   البند ${index + 1}:`);
                        console.log(`     ID: ${item.id} (نوع: ${typeof item.id})`);
                        console.log(`     description: "${item.description || 'غير موجود'}"`);
                        console.log(`     itemName: "${item.itemName || 'غير موجود'}"`);
                        console.log(`     name: "${item.name || 'غير موجود'}"`);
                        console.log(`     المفاتيح المتاحة: [${Object.keys(item).join(', ')}]`);
                    });
                    
                    projectData = project;
                    break;
                }
            }
            
        } catch (error) {
            console.log(`   ❌ خطأ في قراءة ${file}: ${error.message}`);
        }
    }
}

if (projectData) {
    console.log('\n\n🎯 تحليل البيانات الموجودة:');
    console.log('='.repeat(50));
    
    const sampleItem = projectData.items[0];
    console.log(`📊 نموذج بند من البيانات الحقيقية:`);
    console.log(JSON.stringify(sampleItem, null, 2));
    
    // فحص أنواع ID
    const idTypes = {};
    projectData.items.slice(0, 10).forEach(item => {
        const type = typeof item.id;
        idTypes[type] = (idTypes[type] || 0) + 1;
    });
    
    console.log(`\n🔢 أنواع ID في أول 10 بنود:`);
    Object.entries(idTypes).forEach(([type, count]) => {
        console.log(`   ${type}: ${count} بند`);
    });
    
    // فحص الوصف
    const descriptionSources = {
        description: 0,
        itemName: 0,
        name: 0,
        desc: 0,
        none: 0
    };
    
    projectData.items.slice(0, 10).forEach(item => {
        if (item.description && item.description.trim()) {
            descriptionSources.description++;
        } else if (item.itemName && item.itemName.trim()) {
            descriptionSources.itemName++;
        } else if (item.name && item.name.trim()) {
            descriptionSources.name++;
        } else if (item.desc && item.desc.trim()) {
            descriptionSources.desc++;
        } else {
            descriptionSources.none++;
        }
    });
    
    console.log(`\n📝 مصادر الوصف في أول 10 بنود:`);
    Object.entries(descriptionSources).forEach(([source, count]) => {
        console.log(`   ${source}: ${count} بند`);
    });
}

console.log('\n\n💡 التوصيات:');
console.log('='.repeat(30));
console.log('1. تم إصلاح مشكلة id.replace بتحويل ID إلى string');
console.log('2. يجب التحقق من أن التطبيق يستخدم normalizePricing');
console.log('3. فحص تبويب الملخص للتأكد من استخدام البيانات المعدلة');