// 🗑️ حذف snapshot الخاطئ لإجبار إعادة البناء
// نسخ ولصق في Console المتصفح

const targetTenderId = 'tender_1757965294269_2w0r2sye9';

async function clearCorruptedSnapshot() {
  try {
    if (window.electronAPI) {
      console.log('🗑️ حذف snapshot الخاطئ...');
      
      // قراءة snapshots الحالية
      const snapshots = await window.electronAPI.storage.get('app_pricing_snapshots') || {};
      
      if (snapshots[targetTenderId]) {
        console.log('📊 القيم الحالية الخاطئة:', snapshots[targetTenderId].totals);
        
        // حذف snapshot الخاطئ
        delete snapshots[targetTenderId];
        
        // حفظ البيانات المحدثة
        await window.electronAPI.storage.set('app_pricing_snapshots', snapshots);
        
        console.log('✅ تم حذف snapshot الخاطئ');
        console.log('🔄 سيتم إعادة بناء snapshot تلقائياً عند إعادة تحميل الصفحة');
        
        // إعادة تحميل الصفحة لإعادة بناء snapshot
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
      } else {
        console.log('⚠️ لم يتم العثور على snapshot للعطاء المحدد');
      }
    } else {
      console.error('❌ Electron API غير متوفر');
    }
  } catch (error) {
    console.error('❌ خطأ في حذف snapshot:', error);
  }
}

clearCorruptedSnapshot();