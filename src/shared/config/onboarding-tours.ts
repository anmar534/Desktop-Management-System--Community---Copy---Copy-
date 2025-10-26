/**
 * Onboarding Tours Configuration - إعدادات الجولات التعريفية
 * Sprint 5.4.5: جولة تعريفية تفاعلية
 */

import type { TourStep } from '@/components/onboarding/OnboardingTour'

// ============================================================================
// Main Application Tour
// ============================================================================

export const mainAppTour: TourStep[] = [
  {
    id: 'welcome',
    target: 'body',
    title: 'Welcome to Desktop Management System',
    titleAr: 'مرحباً بك في نظام إدارة المقاولات',
    content: "Let's take a quick tour to help you get started with the system.",
    contentAr: 'دعنا نأخذ جولة سريعة لمساعدتك على البدء مع النظام.',
    placement: 'bottom',
  },
  {
    id: 'sidebar',
    target: '[data-tour="sidebar"]',
    title: 'Navigation Sidebar',
    titleAr: 'القائمة الجانبية',
    content:
      'Use the sidebar to navigate between different sections of the application. You can collapse it by clicking the menu icon.',
    contentAr:
      'استخدم القائمة الجانبية للتنقل بين أقسام التطبيق المختلفة. يمكنك طيها بالنقر على أيقونة القائمة.',
    placement: 'right',
  },
  {
    id: 'search',
    target: '[data-tour="search"]',
    title: 'Quick Search',
    titleAr: 'البحث السريع',
    content:
      'Search for anything in the system using the search bar. You can also use Ctrl+K to open the command palette.',
    contentAr:
      'ابحث عن أي شيء في النظام باستخدام شريط البحث. يمكنك أيضاً استخدام Ctrl+K لفتح لوحة الأوامر.',
    placement: 'bottom',
  },
  {
    id: 'notifications',
    target: '[data-tour="notifications"]',
    title: 'Notifications',
    titleAr: 'الإشعارات',
    content: 'Stay updated with important notifications and alerts.',
    contentAr: 'ابق على اطلاع بالإشعارات والتنبيهات المهمة.',
    placement: 'bottom',
  },
  {
    id: 'user-menu',
    target: '[data-tour="user-menu"]',
    title: 'User Menu',
    titleAr: 'قائمة المستخدم',
    content: 'Access your profile, settings, and logout from here.',
    contentAr: 'الوصول إلى ملفك الشخصي والإعدادات وتسجيل الخروج من هنا.',
    placement: 'bottom',
  },
  {
    id: 'complete',
    target: 'body',
    title: "You're All Set!",
    titleAr: 'أنت جاهز الآن!',
    content:
      'You can always access this tour again from the help menu. Press ? to see keyboard shortcuts.',
    contentAr:
      'يمكنك دائماً الوصول إلى هذه الجولة مرة أخرى من قائمة المساعدة. اضغط ? لرؤية اختصارات لوحة المفاتيح.',
    placement: 'bottom',
  },
]

// ============================================================================
// Tenders Page Tour
// ============================================================================

export const tendersTour: TourStep[] = [
  {
    id: 'tenders-list',
    target: '[data-tour="tenders-list"]',
    title: 'Tenders List',
    titleAr: 'قائمة المنافسات',
    content: 'View all your tenders here. You can filter, sort, and search through them.',
    contentAr: 'اعرض جميع منافساتك هنا. يمكنك التصفية والترتيب والبحث خلالها.',
    placement: 'top',
  },
  {
    id: 'new-tender',
    target: '[data-tour="new-tender"]',
    title: 'Create New Tender',
    titleAr: 'إنشاء منافسة جديدة',
    content: 'Click here to create a new tender. You can also use the keyboard shortcut N.',
    contentAr: 'انقر هنا لإنشاء منافسة جديدة. يمكنك أيضاً استخدام اختصار لوحة المفاتيح N.',
    placement: 'bottom',
  },
  {
    id: 'tender-filters',
    target: '[data-tour="tender-filters"]',
    title: 'Filter Tenders',
    titleAr: 'تصفية المنافسات',
    content: 'Use filters to find specific tenders by status, date, or other criteria.',
    contentAr: 'استخدم الفلاتر للعثور على منافسات محددة حسب الحالة أو التاريخ أو معايير أخرى.',
    placement: 'left',
  },
  {
    id: 'tender-actions',
    target: '[data-tour="tender-actions"]',
    title: 'Tender Actions',
    titleAr: 'إجراءات المنافسة',
    content: 'Perform actions like edit, delete, or export tenders from the actions menu.',
    contentAr: 'قم بإجراءات مثل التعديل أو الحذف أو التصدير من قائمة الإجراءات.',
    placement: 'left',
  },
]

// ============================================================================
// Projects Page Tour
// ============================================================================

export const projectsTour: TourStep[] = [
  {
    id: 'projects-overview',
    target: '[data-tour="projects-overview"]',
    title: 'Projects Overview',
    titleAr: 'نظرة عامة على المشاريع',
    content: 'Get a quick overview of all your projects, their status, and progress.',
    contentAr: 'احصل على نظرة عامة سريعة على جميع مشاريعك وحالتها وتقدمها.',
    placement: 'top',
  },
  {
    id: 'project-timeline',
    target: '[data-tour="project-timeline"]',
    title: 'Project Timeline',
    titleAr: 'الجدول الزمني للمشروع',
    content: 'View project timelines and milestones in the Gantt chart view.',
    contentAr: 'اعرض الجداول الزمنية للمشاريع والمعالم في عرض مخطط جانت.',
    placement: 'bottom',
  },
  {
    id: 'project-team',
    target: '[data-tour="project-team"]',
    title: 'Project Team',
    titleAr: 'فريق المشروع',
    content: 'Manage your project team members and their roles.',
    contentAr: 'إدارة أعضاء فريق المشروع وأدوارهم.',
    placement: 'right',
  },
]

// ============================================================================
// Financial Page Tour
// ============================================================================

export const financialTour: TourStep[] = [
  {
    id: 'financial-dashboard',
    target: '[data-tour="financial-dashboard"]',
    title: 'Financial Dashboard',
    titleAr: 'لوحة المالية',
    content: 'Monitor your financial health with real-time insights and reports.',
    contentAr: 'راقب صحتك المالية مع رؤى وتقارير في الوقت الفعلي.',
    placement: 'top',
  },
  {
    id: 'invoices',
    target: '[data-tour="invoices"]',
    title: 'Invoices',
    titleAr: 'الفواتير',
    content: 'Create, manage, and track all your invoices here.',
    contentAr: 'إنشاء وإدارة وتتبع جميع فواتيرك هنا.',
    placement: 'bottom',
  },
  {
    id: 'financial-reports',
    target: '[data-tour="financial-reports"]',
    title: 'Financial Reports',
    titleAr: 'التقارير المالية',
    content:
      'Generate detailed financial reports including income statements, balance sheets, and cash flow.',
    contentAr:
      'إنشاء تقارير مالية مفصلة بما في ذلك بيانات الدخل والميزانيات العمومية والتدفقات النقدية.',
    placement: 'left',
  },
]

// ============================================================================
// Settings Page Tour
// ============================================================================

export const settingsTour: TourStep[] = [
  {
    id: 'general-settings',
    target: '[data-tour="general-settings"]',
    title: 'General Settings',
    titleAr: 'الإعدادات العامة',
    content: 'Configure general application settings like language, theme, and notifications.',
    contentAr: 'تكوين إعدادات التطبيق العامة مثل اللغة والسمة والإشعارات.',
    placement: 'right',
  },
  {
    id: 'user-preferences',
    target: '[data-tour="user-preferences"]',
    title: 'User Preferences',
    titleAr: 'تفضيلات المستخدم',
    content: 'Customize your personal preferences and display options.',
    contentAr: 'تخصيص تفضيلاتك الشخصية وخيارات العرض.',
    placement: 'right',
  },
  {
    id: 'security-settings',
    target: '[data-tour="security-settings"]',
    title: 'Security Settings',
    titleAr: 'إعدادات الأمان',
    content: 'Manage your password, two-factor authentication, and security preferences.',
    contentAr: 'إدارة كلمة المرور والمصادقة الثنائية وتفضيلات الأمان.',
    placement: 'right',
  },
]

// ============================================================================
// Export All Tours
// ============================================================================

export const allTours = {
  mainApp: mainAppTour,
  tenders: tendersTour,
  projects: projectsTour,
  financial: financialTour,
  settings: settingsTour,
}

export default allTours
