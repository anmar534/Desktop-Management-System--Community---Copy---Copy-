// ملف مركزي لتعريف رسائل التأكيد / التحذير المستخدمة في النظام
// الهدف: توحيد النصوص + سهولة الترجمة + إعادة الاستخدام

export const confirmationMessages = {
  approveOfficial: {
    title: 'اعتماد التسعير الرسمي',
    description:
      'سيتم ترقية المسودة الحالية إلى نسخة رسمية معتمدة وسيتم استبدال أي نسخة رسمية سابقة. هل ترغب بالمتابعة؟',
    confirmText: 'اعتماد',
    cancelText: 'إلغاء',
  },
  saveItem: {
    title: 'حفظ تسعير البند',
    description: 'سيتم حفظ بيانات تسعير هذا البند واعتباره مكتملاً. هل تريد المتابعة؟',
    confirmText: 'حفظ',
    cancelText: 'إلغاء',
  },
  leaveDirty: {
    title: 'مغادرة مع تغييرات غير معتمدة',
    description:
      'هناك تغييرات غير معتمدة وربما غير محفوظة رسمياً. مغادرة الصفحة قد يؤدي لفقدان الاعتماد الرسمي. هل تريد المتابعة؟',
    confirmText: 'مغادرة',
    cancelText: 'البقاء',
  },

  // رسائل المشاريع
  project: {
    // رسائل النجاح
    success: {
      updated: 'تم تحديث المشروع بنجاح',
      deleted: 'تم حذف المشروع بنجاح',
      boqImported: 'تم استيراد جدول الكميات من المنافسة إلى هذا المشروع',
      pricingSynced: 'تمت مزامنة بيانات التسعير بنجاح',
      fileUploaded: 'تم رفع الملف بنجاح',
      sectionOpened: 'تم فتح القسم المطلوب',
      dataRepaired: (count: number) => `تم إصلاح ${count} بند وإعادة مزامنة البيانات بنجاح`,
    },

    // رسائل المعلومات
    info: {
      noBOQ: 'لا يوجد جدول كميات أو بيانات تسعير مرتبطة بهذه المنافسة',
      syncingPricing: 'جاري إعادة مزامنة بيانات التسعير من تبويب الملخص...',
      dataUpToDate: 'جميع البيانات محدثة بالفعل - لا حاجة للإصلاح',
      electronNavigation: 'سيتم دعم التنقل المباشر في بيئة Electron أثناء التشغيل الفعلي',
    },

    // رسائل الأخطاء
    error: {
      importFailed: 'تعذر استيراد جدول الكميات',
      noProjectOrTender: 'لا يوجد مشروع أو منافسة مرتبطة',
      noBOQData: 'لا يوجد جدول كميات للمشروع',
      noPricingData: 'لا توجد بيانات تسعير في المنافسة المرتبطة',
      syncFailed: 'تعذرت إعادة مزامنة بيانات التسعير',
      budgetLoadFailed: 'تعذر تحميل بيانات مقارنة الميزانية',
      uploadFailed: 'فشل في رفع الملف',
      downloadFailed: 'تعذر تنزيل الملف',
      updateFailed: 'حدث خطأ في تحديث المشروع',
    },
  },
} as const

export type ConfirmationMessageKey = keyof typeof confirmationMessages
