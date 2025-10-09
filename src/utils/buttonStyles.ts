// نظام الأزرار الموحد للتطبيق
// Unified button system for the entire application

export const BUTTON_STYLES = {
  // أزرار الإجراءات الأساسية
  view: {
    className: "h-8 px-2 hover:bg-blue-50 hover:text-blue-600 transition-colors group",
    variant: "ghost" as const,
    iconClass: "h-4 w-4 group-hover:scale-110 transition-transform"
  },
  
  edit: {
    className: "h-8 px-2 hover:bg-amber-50 hover:text-amber-600 transition-colors group", 
    variant: "ghost" as const,
    iconClass: "h-4 w-4 group-hover:scale-110 transition-transform"
  },
  
  delete: {
    className: "h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors group",
    variant: "ghost" as const,
    iconClass: "h-4 w-4 group-hover:scale-110 group-hover:text-red-700 transition-all"
  },
  
  // أزرار الإجراءات الرئيسية
  primary: {
    className: "h-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200 group",
    variant: "default" as const,
    iconClass: "h-4 w-4 mr-1 group-hover:scale-110 transition-transform"
  },
  
  success: {
    className: "h-8 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md hover:shadow-lg transition-all duration-200 group",
    variant: "default" as const,
    iconClass: "h-4 w-4 mr-1 group-hover:scale-110 transition-transform"
  },
  
  warning: {
    className: "h-8 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-md hover:shadow-lg transition-all duration-200 group",
    variant: "default" as const,
    iconClass: "h-4 w-4 mr-1 group-hover:scale-110 transition-transform"
  },
  
  secondary: {
    className: "h-8 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-md hover:shadow-lg transition-all duration-200 group",
    variant: "default" as const,
    iconClass: "h-4 w-4 mr-1 group-hover:scale-110 transition-transform"
  }
};

// أيقونات موحدة للإجراءات
export const BUTTON_ICONS = {
  view: "Eye",
  edit: "Edit", 
  delete: "Trash2",
  start: "Zap",
  process: "Cog",
  calculate: "Calculator",
  report: "FileText",
  add: "Plus",
  save: "Save",
  cancel: "X",
  search: "Search",
  filter: "Filter",
  export: "Download",
  import: "Upload",
  send: "Send",
  settings: "Settings",
  user: "User",
  check: "Check",
  alert: "AlertCircle"
} as const;

// نصوص موحدة للأزرار
export const BUTTON_TEXTS = {
  view: "عرض",
  edit: "تحرير", 
  delete: "حذف",
  start: "تسعير",
  pricing: "تسعير", 
  process: "معالجة",
  calculate: "حساب",
  report: "تقرير",
  add: "إضافة",
  save: "حفظ",
  cancel: "إلغاء",
  search: "بحث",
  filter: "تصفية",
  export: "تصدير",
  import: "استيراد",
  send: "إرسال",
  download: "تحميل",
  pdf: "PDF"
} as const;