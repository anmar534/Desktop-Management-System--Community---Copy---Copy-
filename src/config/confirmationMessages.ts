// ملف مركزي لتعريف رسائل التأكيد / التحذير المستخدمة في النظام
// الهدف: توحيد النصوص + سهولة الترجمة + إعادة الاستخدام

export const confirmationMessages = {
  approveOfficial: {
    title: 'اعتماد التسعير الرسمي',
    description: 'سيتم ترقية المسودة الحالية إلى نسخة رسمية معتمدة وسيتم استبدال أي نسخة رسمودة سابقة. هل ترغب بالمتابعة؟',
    confirmText: 'اعتماد',
    cancelText: 'إلغاء'
  },
  saveItem: {
    title: 'حفظ تسعير البند',
    description: 'سيتم حفظ بيانات تسعير هذا البند واعتباره مكتملاً. هل تريد المتابعة؟',
    confirmText: 'حفظ',
    cancelText: 'إلغاء'
  },
  leaveDirty: {
    title: 'مغادرة مع تغييرات غير معتمدة',
    description: 'هناك تغييرات غير معتمدة وربما غير محفوظة رسمياً. مغادرة الصفحة قد يؤدي لفقدان الاعتماد الرسمي. هل تريد المتابعة؟',
    confirmText: 'مغادرة',
    cancelText: 'البقاء'
  }
} as const;

export type ConfirmationMessageKey = keyof typeof confirmationMessages;