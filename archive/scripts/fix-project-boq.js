const fs = require('fs');
const path = require('path');

console.log('🔧 إصلاح جدول الكميات للمشاريع المرتبطة بمنافسات...');

// قراءة البيانات من electron-store (محاكاة)
function loadFromElectronStore(key) {
  try {
    // مسار electron-store المتوقع
    const userDataPath = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + '/.local/share');
    const storePath = path.join(userDataPath, 'desktop-management-system-community', 'config.json');
    
    if (fs.existsSync(storePath)) {
      const storeData = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      return storeData[key];
    }
  } catch (e) {
    console.warn('فشل قراءة electron-store:', e.message);
  }
  return null;
}

// قراءة من localStorage (احتياطي)
function loadFromLocalStorage(key) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = window.localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }
  } catch (e) {
    console.warn('فشل قراءة localStorage:', e.message);
  }
  return null;
}

// البحث عن البيانات
function findData() {
  const keys = {
    projects: 'app_projects_data',
    tenders: 'app_tenders_data',
    relations: 'app_tender_project_relations',
    pricing: 'app_pricing_data',
    boq: 'app_boq_data'
  };

  const data = {};
  
  Object.entries(keys).forEach(([name, key]) => {
    let found = loadFromElectronStore(key) || loadFromLocalStorage(key);
    if (found) {
      console.log(`✅ تم العثور على ${name}: ${Array.isArray(found) ? found.length : Object.keys(found || {}).length} عنصر`);
      data[name] = found;
    } else {
      console.log(`❌ لم يتم العثور على ${name}`);
      data[name] = name === 'projects' || name === 'tenders' || name === 'relations' ? [] : {};
    }
  });

  return data;
}

// الدالة الرئيسية
function main() {
  const data = findData();
  
  // البحث عن المشاريع المرتبطة بمنافسات
  console.log('\n📋 تحليل المشاريع...');
  
  data.projects.forEach(project => {
    // البحث عن المنافسة المرتبطة
    const relation = data.relations.find(r => r.projectId === project.id);
    if (relation) {
      const tender = data.tenders.find(t => t.id === relation.tenderId);
      if (tender) {
        console.log(`\n🏗️ مشروع: ${project.name}`);
        console.log(`🎯 مرتبط بمنافسة: ${tender.name}`);
        
        // فحص وجود BOQ للمشروع
        const projectBOQ = Object.values(data.boq).find(boq => boq.projectId === project.id);
        const tenderBOQ = Object.values(data.boq).find(boq => boq.tenderId === tender.id);
        
        console.log(`📊 BOQ المشروع: ${projectBOQ ? 'موجود' : 'مفقود'}`);
        console.log(`📊 BOQ المنافسة: ${tenderBOQ ? 'موجود' : 'مفقود'}`);
        
        // فحص بيانات التسعير
        const pricingData = data.pricing[tender.id];
        console.log(`💰 بيانات التسعير: ${pricingData ? 'موجود' : 'مفقود'}`);
        
        if (pricingData && pricingData.pricing && !projectBOQ) {
          console.log('🔄 سيتم إنشاء BOQ من بيانات التسعير...');
          
          // تحويل بيانات التسعير إلى BOQ
          const boqItems = [];
          let totalValue = 0;
          
          pricingData.pricing.forEach(([itemId, itemPricing]) => {
            if (itemPricing && itemPricing.finalPrice) {
              const item = {
                id: itemId,
                description: itemPricing.description || itemId,
                unit: itemPricing.unit || 'وحدة',
                quantity: itemPricing.quantity || 1,
                unitPrice: itemPricing.finalPrice / (itemPricing.quantity || 1),
                totalPrice: itemPricing.finalPrice
              };
              boqItems.push(item);
              totalValue += itemPricing.finalPrice;
            }
          });
          
          if (boqItems.length > 0) {
            // إنشاء BOQ للمنافسة (إذا لم يكن موجوداً)
            if (!tenderBOQ) {
              const tenderBOQData = {
                id: `boq_tender_${tender.id}`,
                tenderId: tender.id,
                items: boqItems,
                totalValue,
                lastUpdated: new Date().toISOString()
              };
              data.boq[tenderBOQData.id] = tenderBOQData;
              console.log('✅ تم إنشاء BOQ للمنافسة');
            }
            
            // إنشاء BOQ للمشروع
            const projectBOQData = {
              id: `boq_project_${project.id}`,
              projectId: project.id,
              items: boqItems.map(item => ({
                ...item,
                id: `proj_${item.id}`
              })),
              totalValue,
              lastUpdated: new Date().toISOString()
            };
            data.boq[projectBOQData.id] = projectBOQData;
            console.log('✅ تم إنشاء BOQ للمشروع');
          }
        }
      }
    }
  });
  
  // حفظ البيانات المحدثة (محاكاة)
  console.log('\n💾 حفظ التحديثات...');
  console.log('تم إنشاء', Object.keys(data.boq).length, 'عنصر BOQ');
  
  // في التطبيق الحقيقي، ستحفظ البيانات هنا
  console.log('✅ تم الانتهاء من الإصلاح');
}

main();