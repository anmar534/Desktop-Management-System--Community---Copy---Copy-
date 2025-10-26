/**
 * Keyboard Shortcuts Configuration - إعدادات اختصارات لوحة المفاتيح
 * Sprint 5.4.4: اختصارات لوحة المفاتيح
 */

import type { KeyboardShortcut } from '@/application/hooks/useKeyboardShortcuts'

// ============================================================================
// Global Shortcuts
// ============================================================================

export const globalShortcuts: Omit<KeyboardShortcut, 'callback'>[] = [
  // Command Palette
  {
    id: 'open-command-palette',
    keys: ['Ctrl', 'K'],
    description: 'Open command palette',
    descriptionAr: 'فتح لوحة الأوامر',
    category: 'Global',
    enabled: true,
    preventDefault: true,
    allowInInput: true,
  },

  // Search
  {
    id: 'focus-search',
    keys: ['Ctrl', 'F'],
    description: 'Focus search',
    descriptionAr: 'التركيز على البحث',
    category: 'Global',
    enabled: true,
    preventDefault: true,
  },

  // Navigation
  {
    id: 'go-home',
    keys: ['Ctrl', 'H'],
    description: 'Go to home',
    descriptionAr: 'الذهاب إلى الرئيسية',
    category: 'Navigation',
    enabled: true,
    preventDefault: true,
  },
  {
    id: 'go-tenders',
    keys: ['Ctrl', 'T'],
    description: 'Go to tenders',
    descriptionAr: 'الذهاب إلى المنافسات',
    category: 'Navigation',
    enabled: true,
    preventDefault: true,
  },
  {
    id: 'go-projects',
    keys: ['Ctrl', 'P'],
    description: 'Go to projects',
    descriptionAr: 'الذهاب إلى المشاريع',
    category: 'Navigation',
    enabled: true,
    preventDefault: true,
  },
  {
    id: 'go-financial',
    keys: ['Ctrl', 'M'],
    description: 'Go to financial',
    descriptionAr: 'الذهاب إلى المالية',
    category: 'Navigation',
    enabled: true,
    preventDefault: true,
  },
  {
    id: 'go-settings',
    keys: ['Ctrl', ','],
    description: 'Go to settings',
    descriptionAr: 'الذهاب إلى الإعدادات',
    category: 'Navigation',
    enabled: true,
    preventDefault: true,
  },

  // Actions
  {
    id: 'save',
    keys: ['Ctrl', 'S'],
    description: 'Save',
    descriptionAr: 'حفظ',
    category: 'Actions',
    enabled: true,
    preventDefault: true,
  },
  {
    id: 'new',
    keys: ['Ctrl', 'N'],
    description: 'Create new',
    descriptionAr: 'إنشاء جديد',
    category: 'Actions',
    enabled: true,
    preventDefault: true,
  },
  {
    id: 'edit',
    keys: ['Ctrl', 'E'],
    description: 'Edit',
    descriptionAr: 'تعديل',
    category: 'Actions',
    enabled: true,
    preventDefault: true,
  },
  {
    id: 'delete',
    keys: ['Ctrl', 'D'],
    description: 'Delete',
    descriptionAr: 'حذف',
    category: 'Actions',
    enabled: true,
    preventDefault: true,
  },
  {
    id: 'print',
    keys: ['Ctrl', 'P'],
    description: 'Print',
    descriptionAr: 'طباعة',
    category: 'Actions',
    enabled: true,
    preventDefault: true,
  },
  {
    id: 'refresh',
    keys: ['Ctrl', 'R'],
    description: 'Refresh',
    descriptionAr: 'تحديث',
    category: 'Actions',
    enabled: true,
    preventDefault: true,
  },

  // View
  {
    id: 'toggle-sidebar',
    keys: ['Ctrl', 'B'],
    description: 'Toggle sidebar',
    descriptionAr: 'إظهار/إخفاء القائمة الجانبية',
    category: 'View',
    enabled: true,
    preventDefault: true,
  },
  {
    id: 'toggle-theme',
    keys: ['Ctrl', 'Shift', 'D'],
    description: 'Toggle dark mode',
    descriptionAr: 'تبديل الوضع الداكن',
    category: 'View',
    enabled: true,
    preventDefault: true,
  },
  {
    id: 'toggle-language',
    keys: ['Ctrl', 'Shift', 'L'],
    description: 'Toggle language',
    descriptionAr: 'تبديل اللغة',
    category: 'View',
    enabled: true,
    preventDefault: true,
  },
  {
    id: 'zoom-in',
    keys: ['Ctrl', '+'],
    description: 'Zoom in',
    descriptionAr: 'تكبير',
    category: 'View',
    enabled: true,
    preventDefault: true,
  },
  {
    id: 'zoom-out',
    keys: ['Ctrl', '-'],
    description: 'Zoom out',
    descriptionAr: 'تصغير',
    category: 'View',
    enabled: true,
    preventDefault: true,
  },
  {
    id: 'reset-zoom',
    keys: ['Ctrl', '0'],
    description: 'Reset zoom',
    descriptionAr: 'إعادة تعيين التكبير',
    category: 'View',
    enabled: true,
    preventDefault: true,
  },

  // Help
  {
    id: 'show-shortcuts',
    keys: ['?'],
    description: 'Show keyboard shortcuts',
    descriptionAr: 'عرض اختصارات لوحة المفاتيح',
    category: 'Help',
    enabled: true,
    preventDefault: true,
  },
  {
    id: 'show-help',
    keys: ['F1'],
    description: 'Show help',
    descriptionAr: 'عرض المساعدة',
    category: 'Help',
    enabled: true,
    preventDefault: true,
  },
]

// ============================================================================
// Tenders Page Shortcuts
// ============================================================================

export const tendersShortcuts: Omit<KeyboardShortcut, 'callback'>[] = [
  {
    id: 'tenders-new',
    keys: ['N'],
    description: 'Create new tender',
    descriptionAr: 'إنشاء منافسة جديدة',
    category: 'Tenders',
    enabled: true,
    preventDefault: true,
  },
  {
    id: 'tenders-filter',
    keys: ['F'],
    description: 'Filter tenders',
    descriptionAr: 'تصفية المنافسات',
    category: 'Tenders',
    enabled: true,
    preventDefault: true,
  },
  {
    id: 'tenders-export',
    keys: ['E'],
    description: 'Export tenders',
    descriptionAr: 'تصدير المنافسات',
    category: 'Tenders',
    enabled: true,
    preventDefault: true,
  },
]

// ============================================================================
// Projects Page Shortcuts
// ============================================================================

export const projectsShortcuts: Omit<KeyboardShortcut, 'callback'>[] = [
  {
    id: 'projects-new',
    keys: ['N'],
    description: 'Create new project',
    descriptionAr: 'إنشاء مشروع جديد',
    category: 'Projects',
    enabled: true,
    preventDefault: true,
  },
  {
    id: 'projects-filter',
    keys: ['F'],
    description: 'Filter projects',
    descriptionAr: 'تصفية المشاريع',
    category: 'Projects',
    enabled: true,
    preventDefault: true,
  },
  {
    id: 'projects-gantt',
    keys: ['G'],
    description: 'Show Gantt chart',
    descriptionAr: 'عرض مخطط جانت',
    category: 'Projects',
    enabled: true,
    preventDefault: true,
  },
]

// ============================================================================
// Financial Page Shortcuts
// ============================================================================

export const financialShortcuts: Omit<KeyboardShortcut, 'callback'>[] = [
  {
    id: 'financial-new-invoice',
    keys: ['I'],
    description: 'Create new invoice',
    descriptionAr: 'إنشاء فاتورة جديدة',
    category: 'Financial',
    enabled: true,
    preventDefault: true,
  },
  {
    id: 'financial-new-payment',
    keys: ['P'],
    description: 'Record payment',
    descriptionAr: 'تسجيل دفعة',
    category: 'Financial',
    enabled: true,
    preventDefault: true,
  },
  {
    id: 'financial-reports',
    keys: ['R'],
    description: 'View reports',
    descriptionAr: 'عرض التقارير',
    category: 'Financial',
    enabled: true,
    preventDefault: true,
  },
]

// ============================================================================
// Table Shortcuts
// ============================================================================

export const tableShortcuts: Omit<KeyboardShortcut, 'callback'>[] = [
  {
    id: 'table-select-all',
    keys: ['Ctrl', 'A'],
    description: 'Select all rows',
    descriptionAr: 'تحديد جميع الصفوف',
    category: 'Table',
    enabled: true,
    preventDefault: true,
  },
  {
    id: 'table-next-row',
    keys: ['Down'],
    description: 'Next row',
    descriptionAr: 'الصف التالي',
    category: 'Table',
    enabled: true,
    preventDefault: false,
  },
  {
    id: 'table-prev-row',
    keys: ['Up'],
    description: 'Previous row',
    descriptionAr: 'الصف السابق',
    category: 'Table',
    enabled: true,
    preventDefault: false,
  },
  {
    id: 'table-first-row',
    keys: ['Home'],
    description: 'First row',
    descriptionAr: 'الصف الأول',
    category: 'Table',
    enabled: true,
    preventDefault: true,
  },
  {
    id: 'table-last-row',
    keys: ['End'],
    description: 'Last row',
    descriptionAr: 'الصف الأخير',
    category: 'Table',
    enabled: true,
    preventDefault: true,
  },
]

// ============================================================================
// Form Shortcuts
// ============================================================================

export const formShortcuts: Omit<KeyboardShortcut, 'callback'>[] = [
  {
    id: 'form-submit',
    keys: ['Ctrl', 'Enter'],
    description: 'Submit form',
    descriptionAr: 'إرسال النموذج',
    category: 'Form',
    enabled: true,
    preventDefault: true,
    allowInInput: true,
  },
  {
    id: 'form-cancel',
    keys: ['Escape'],
    description: 'Cancel',
    descriptionAr: 'إلغاء',
    category: 'Form',
    enabled: true,
    preventDefault: true,
  },
  {
    id: 'form-next-field',
    keys: ['Tab'],
    description: 'Next field',
    descriptionAr: 'الحقل التالي',
    category: 'Form',
    enabled: true,
    preventDefault: false,
  },
  {
    id: 'form-prev-field',
    keys: ['Shift', 'Tab'],
    description: 'Previous field',
    descriptionAr: 'الحقل السابق',
    category: 'Form',
    enabled: true,
    preventDefault: false,
  },
]

// ============================================================================
// Export All
// ============================================================================

export const allShortcuts = [
  ...globalShortcuts,
  ...tendersShortcuts,
  ...projectsShortcuts,
  ...financialShortcuts,
  ...tableShortcuts,
  ...formShortcuts,
]

export default {
  global: globalShortcuts,
  tenders: tendersShortcuts,
  projects: projectsShortcuts,
  financial: financialShortcuts,
  table: tableShortcuts,
  form: formShortcuts,
  all: allShortcuts,
}
