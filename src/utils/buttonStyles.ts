// نظام الأزرار الموحد للتطبيق
// Unified button system for the entire application

export const BUTTON_STYLES = {
  // أزرار الإجراءات الأساسية
  view: {
    className: "h-8 px-2 transition-colors group hover:bg-info/10 hover:text-info",
    variant: "ghost" as const,
    iconClass: "h-4 w-4 transition-transform group-hover:scale-110 group-hover:text-info"
  },
  
  edit: {
    className: "h-8 px-2 transition-colors group hover:bg-warning/10 hover:text-warning", 
    variant: "ghost" as const,
    iconClass: "h-4 w-4 transition-transform group-hover:scale-110 group-hover:text-warning"
  },
  
  delete: {
    className: "h-8 px-2 text-destructive transition-colors group hover:text-destructive hover:bg-destructive/10",
    variant: "ghost" as const,
    iconClass: "h-4 w-4 transition-all group-hover:scale-110 group-hover:text-destructive"
  },
  
  // أزرار الإجراءات الرئيسية
  primary: {
    className: "h-8 bg-primary text-primary-foreground shadow-md transition-all duration-200 group hover:bg-primary/90 hover:shadow-lg",
    variant: "default" as const,
    iconClass: "h-4 w-4 mr-1 group-hover:scale-110 transition-transform"
  },
  
  success: {
    className: "h-8 bg-success text-success-foreground shadow-md transition-all duration-200 group hover:bg-success/90 hover:shadow-lg",
    variant: "default" as const,
    iconClass: "h-4 w-4 mr-1 group-hover:scale-110 transition-transform"
  },
  
  warning: {
    className: "h-8 bg-warning text-warning-foreground shadow-md transition-all duration-200 group hover:bg-warning/90 hover:shadow-lg",
    variant: "default" as const,
    iconClass: "h-4 w-4 mr-1 group-hover:scale-110 transition-transform"
  },
  
  secondary: {
    className: "h-8 bg-muted text-muted-foreground shadow-md transition-all duration-200 group hover:bg-muted/80 hover:shadow-lg",
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