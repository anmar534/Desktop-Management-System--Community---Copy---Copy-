import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Banknote,
  BarChart3,
  Building2,
  Calculator,
  DollarSign,
  FileText,
  LayoutDashboard,
  Settings,
  Target,
  Trophy
} from 'lucide-react'

export const NAVIGATION_SECTIONS = [
  'dashboard',
  'projects',
  'tenders',
  'new-tender',
  'tender-pricing-wizard',
  'analytics',
  'financial',
  'development',
  'invoices',
  'bank-accounts',
  'budgets',
  'financial-reports',
  'new-invoice',
  'new-bank-account',
  'new-budget',
  'new-report',
  'administrative-expenses',
  'reports',
  'settings'
] as const

export type NavigationSectionId = typeof NAVIGATION_SECTIONS[number]
export type AppSection = NavigationSectionId

export const DEFAULT_NAVIGATION_SECTION: NavigationSectionId = 'dashboard'

const NAVIGATION_PERMISSION_VALUES = [
  'tenders:read',
  'tenders:write',
  'projects:read',
  'projects:write',
  'financial:read',
  'financial:write',
  'analytics:read',
  'analytics:write',
  'reports:read',
  'reports:write',
  'settings:write',
  'settings:read',
  'audit:read',
  'audit:write'
] as const

const NAVIGATION_PERMISSION_SET = new Set<string>(NAVIGATION_PERMISSION_VALUES)

export type NavigationPermission = typeof NAVIGATION_PERMISSION_VALUES[number]

export const ALL_NAVIGATION_PERMISSIONS: readonly NavigationPermission[] = NAVIGATION_PERMISSION_VALUES

export interface NavigationBreadcrumb {
  label: string
  section?: NavigationSectionId
  params?: Record<string, string>
}

export interface NavigationQuickAction {
  id: string
  label: string
  icon: LucideIcon
  targetSection: NavigationSectionId
  tooltip?: string
  params?: Record<string, string | number | boolean>
  requires?: NavigationPermission[]
}

export interface NavigationViewConfig {
  module: string
  exportName?: string
}

export interface NavigationNode {
  id: NavigationSectionId
  label: string
  description?: string
  icon: LucideIcon
  order: number
  category: 'primary' | 'workflow' | 'reporting' | 'settings'
  requires?: NavigationPermission[]
  breadcrumbs: NavigationBreadcrumb[]
  quickActions?: NavigationQuickAction[]
  hideFromMenu?: boolean
  relatedSections?: NavigationSectionId[]
  view: NavigationViewConfig
}

export function isNavigationPermission(value: unknown): value is NavigationPermission {
  return typeof value === 'string' && NAVIGATION_PERMISSION_SET.has(value)
}

export const NAVIGATION_SCHEMA: readonly NavigationNode[] = [
  {
    id: 'dashboard',
    label: 'لوحة التحكم',
    description: 'نظرة شاملة على الحالة المالية والتشغيلية اللحظية',
    icon: LayoutDashboard,
    order: 0,
    category: 'primary',
    requires: ['tenders:read', 'projects:read', 'financial:read'],
    breadcrumbs: [{ label: 'لوحة التحكم' }],
    quickActions: [
      {
        id: 'create-tender',
        label: 'منافسة جديدة',
        icon: Trophy,
        targetSection: 'new-tender',
        requires: ['tenders:write'],
        tooltip: 'بدء إنشاء منافسة جديدة'
      },
      {
        id: 'create-project',
        label: 'مشروع جديد',
        icon: Building2,
        targetSection: 'projects',
        tooltip: 'الانتقال إلى صفحة المشاريع لإضافة مشروع',
        requires: ['projects:write']
      }
    ],
    relatedSections: ['projects', 'tenders', 'financial'],
    view: {
      module: '@/features/dashboard/AdvancedDashboard'
    }
  },
  {
    id: 'projects',
    label: 'المشاريع',
    description: 'متابعة حالة المشاريع، الموازين، ومؤشرات الأداء',
    icon: Building2,
    order: 10,
    category: 'primary',
    requires: ['projects:read'],
    breadcrumbs: [
      { label: 'لوحة التحكم', section: 'dashboard' },
      { label: 'المشاريع' }
    ],
    quickActions: [
      {
        id: 'new-budget',
        label: 'ميزانية جديدة',
        icon: DollarSign,
        targetSection: 'new-budget',
        requires: ['financial:write'],
        tooltip: 'إنشاء ميزانية مشروع جديدة'
      }
    ],
    relatedSections: ['budgets', 'financial-reports'],
    view: {
      module: '@/features/projects/ProjectsContainer'
    }
  },
  {
    id: 'tenders',
    label: 'المنافسات',
    description: 'إدارة المنافسات ومتابعة التقدم ومتطلبات التسعير',
    icon: Trophy,
    order: 20,
    category: 'primary',
    requires: ['tenders:read'],
    breadcrumbs: [
      { label: 'لوحة التحكم', section: 'dashboard' },
      { label: 'المنافسات' }
    ],
    quickActions: [
      {
        id: 'start-tender',
        label: 'بدء منافسة',
        icon: Target,
        targetSection: 'new-tender',
        requires: ['tenders:write']
      },
      {
        id: 'open-pricing-wizard',
        label: 'معالج التسعير',
        icon: Calculator,
        targetSection: 'tender-pricing-wizard',
        requires: ['tenders:write'],
        tooltip: 'اتباع المعالج المتدرج لتجهيز المنافسة للإرسال'
      }
    ],
    relatedSections: ['financial', 'reports'],
    view: {
      module: '@/components/Tenders',
      exportName: 'Tenders'
    }
  },
  {
    id: 'new-tender',
    label: 'منافسة جديدة',
    description: 'إنشاء أو تعديل منافسة',
    icon: Target,
    order: 25,
    category: 'workflow',
    hideFromMenu: true,
    requires: ['tenders:write'],
    breadcrumbs: [
      { label: 'المنافسات', section: 'tenders' },
      { label: 'منافسة جديدة' }
    ],
    view: {
      module: '@/components/NewTenderForm',
      exportName: 'NewTenderForm'
    }
  },
  {
    id: 'tender-pricing-wizard',
    label: 'معالج تسعير المنافسة',
    description: 'مسار متكامل لتجهيز المنافسة من التسجيل إلى الإرسال مع الحفظ التلقائي',
    icon: Calculator,
    order: 27,
    category: 'workflow',
    hideFromMenu: true,
    requires: ['tenders:write'],
    breadcrumbs: [
      { label: 'المنافسات', section: 'tenders' },
      { label: 'معالج التسعير' }
    ],
    quickActions: [
      {
        id: 'wizard-back-to-tenders',
        label: 'قائمة المنافسات',
        icon: Trophy,
        targetSection: 'tenders',
        requires: ['tenders:read']
      }
    ],
    relatedSections: ['tenders', 'new-tender'],
    view: {
      module: '@/features/tenders/pricing/TenderPricingWizard',
      exportName: 'TenderPricingWizard'
    }
  },
  {
    id: 'analytics',
    label: 'التحليلات والذكاء التنافسي',
    description: 'تحليلات الأداء، التنبؤات، والذكاء التنافسي المتقدم',
    icon: BarChart3,
    order: 28,
    category: 'primary',
    requires: ['analytics:read'],
    breadcrumbs: [
      { label: 'لوحة التحكم', section: 'dashboard' },
      { label: 'التحليلات والذكاء التنافسي' }
    ],
    quickActions: [
      {
        id: 'predictive-analytics',
        label: 'التحليلات التنبؤية',
        icon: Activity,
        targetSection: 'analytics',
        requires: ['analytics:read'],
        tooltip: 'عرض توقعات الفوز وتحسين الأسعار'
      },
      {
        id: 'competitor-tracker',
        label: 'تتبع المنافسين',
        icon: Target,
        targetSection: 'analytics',
        requires: ['analytics:read'],
        tooltip: 'مراقبة وتحليل أنشطة المنافسين'
      }
    ],
    relatedSections: ['tenders', 'projects', 'financial'],
    view: {
      module: '@/components/analytics/AnalyticsRouter',
      exportName: 'AnalyticsRouter'
    }
  },
  {
    id: 'financial',
    label: 'المالية',
    description: 'تحليل التدفق النقدي، الموازنات، والحسابات المالية',
    icon: DollarSign,
    order: 30,
    category: 'primary',
    requires: ['financial:read'],
    breadcrumbs: [
      { label: 'لوحة التحكم', section: 'dashboard' },
      { label: 'المالية' }
    ],
    quickActions: [
      {
        id: 'new-invoice',
        label: 'فاتورة جديدة',
        icon: FileText,
        targetSection: 'new-invoice',
        requires: ['financial:write']
      }
    ],
    relatedSections: ['invoices', 'bank-accounts'],
    view: {
      module: '@/components/Financial',
      exportName: 'Financial'
    }
  },
  {
    id: 'development',
    label: 'التطوير',
    description: 'متابعة خطط التطوير والقدرات المؤسسية',
    icon: Target,
    order: 40,
    category: 'primary',
    requires: ['projects:read'],
    breadcrumbs: [
      { label: 'لوحة التحكم', section: 'dashboard' },
      { label: 'التطوير' }
    ],
    relatedSections: ['projects', 'reports'],
    view: {
      module: '@/components/Development',
      exportName: 'Development'
    }
  },
  {
    id: 'invoices',
    label: 'الفواتير',
    description: 'متابعة الفواتير وإدارتها وربطها بالمشاريع',
    icon: FileText,
    order: 50,
    category: 'primary',
    hideFromMenu: true,
    requires: ['financial:read'],
    breadcrumbs: [
      { label: 'المالية', section: 'financial' },
      { label: 'الفواتير' }
    ],
    quickActions: [
      {
        id: 'create-invoice',
        label: 'فاتورة جديدة',
        icon: FileText,
        targetSection: 'new-invoice',
        requires: ['financial:write']
      }
    ],
    relatedSections: ['financial', 'projects'],
    view: {
      module: '@/components/Financial',
      exportName: 'Financial'
    }
  },
  {
    id: 'bank-accounts',
    label: 'الحسابات البنكية',
    description: 'إدارة الحسابات البنكية ومراقبة الأرصدة',
    icon: Banknote,
    order: 60,
    category: 'primary',
    hideFromMenu: true,
    requires: ['financial:read'],
    breadcrumbs: [
      { label: 'المالية', section: 'financial' },
      { label: 'الحسابات البنكية' }
    ],
    quickActions: [
      {
        id: 'add-bank-account',
        label: 'حساب جديد',
        icon: Banknote,
        targetSection: 'new-bank-account',
        requires: ['financial:write']
      }
    ],
    relatedSections: ['financial'],
    view: {
      module: '@/components/Financial',
      exportName: 'Financial'
    }
  },
  {
    id: 'budgets',
    label: 'الموازنات',
    description: 'مراجعة واعتماد الموازنات لكل مشروع',
    icon: Calculator,
    order: 70,
    category: 'primary',
    hideFromMenu: true,
    requires: ['financial:read'],
    breadcrumbs: [
      { label: 'المالية', section: 'financial' },
      { label: 'الموازنات' }
    ],
    quickActions: [
      {
        id: 'create-budget',
        label: 'ميزانية جديدة',
        icon: Calculator,
        targetSection: 'new-budget',
        requires: ['financial:write']
      }
    ],
    relatedSections: ['projects'],
    view: {
      module: '@/components/Financial',
      exportName: 'Financial'
    }
  },
  {
    id: 'financial-reports',
    label: 'التقارير المالية',
    description: 'تقارير الأداء المالي التحليلية',
    icon: BarChart3,
    order: 80,
    category: 'reporting',
    hideFromMenu: true,
    requires: ['reports:read'],
    breadcrumbs: [
      { label: 'المالية', section: 'financial' },
      { label: 'التقارير المالية' }
    ],
    view: {
      module: '@/components/Financial',
      exportName: 'Financial'
    }
  },
  {
    id: 'new-invoice',
    label: 'فاتورة جديدة',
    description: 'إضافة فاتورة وربطها بالمشاريع والمنافسات',
    icon: FileText,
    order: 82,
    category: 'workflow',
    hideFromMenu: true,
    requires: ['financial:write'],
    breadcrumbs: [
      { label: 'الفواتير', section: 'invoices' },
      { label: 'فاتورة جديدة' }
    ],
    view: {
      module: '@/components/NewInvoice',
      exportName: 'NewInvoice'
    }
  },
  {
    id: 'new-bank-account',
    label: 'حساب بنكي جديد',
    description: 'إضافة حساب ضمن منظومة الصلاحيات الآمنة',
    icon: Banknote,
    order: 84,
    category: 'workflow',
    hideFromMenu: true,
    requires: ['financial:write'],
    breadcrumbs: [
      { label: 'الحسابات البنكية', section: 'bank-accounts' },
      { label: 'حساب جديد' }
    ],
    view: {
      module: '@/components/NewBankAccount',
      exportName: 'NewBankAccount'
    }
  },
  {
    id: 'new-budget',
    label: 'ميزانية جديدة',
    description: 'إنشاء ميزانية وربطها بالمشروع المعني',
    icon: Calculator,
    order: 86,
    category: 'workflow',
    hideFromMenu: true,
    requires: ['financial:write'],
    breadcrumbs: [
      { label: 'الموازنات', section: 'budgets' },
      { label: 'ميزانية جديدة' }
    ],
    view: {
      module: '@/components/NewBudget',
      exportName: 'NewBudget'
    }
  },
  {
    id: 'new-report',
    label: 'تقرير جديد',
    description: 'إنشاء تقرير أداء متخصص',
    icon: FileText,
    order: 88,
    category: 'workflow',
    hideFromMenu: true,
    requires: ['reports:write'],
    breadcrumbs: [
      { label: 'التقارير', section: 'reports' },
      { label: 'تقرير جديد' }
    ],
    view: {
      module: '@/components/NewReport',
      exportName: 'NewReport'
    }
  },
  {
    id: 'administrative-expenses',
    label: 'المشتريات',
    description: 'إدارة أوامر الشراء ومشتريات المنافسات',
    icon: Calculator,
    order: 90,
    category: 'primary',
    requires: ['financial:read'],
    breadcrumbs: [
      { label: 'لوحة التحكم', section: 'dashboard' },
      { label: 'المشتريات' }
    ],
    view: {
      module: '@/components/ExpenseManagement'
    }
  },
  {
    id: 'reports',
    label: 'التقارير',
    description: 'المركز الموحد للتقارير التشغيلية والمالية',
    icon: FileText,
    order: 100,
    category: 'reporting',
    requires: ['reports:read'],
    breadcrumbs: [
      { label: 'لوحة التحكم', section: 'dashboard' },
      { label: 'التقارير' }
    ],
    quickActions: [
      {
        id: 'new-report-action',
        label: 'تقرير جديد',
        icon: FileText,
        targetSection: 'new-report',
        requires: ['reports:write']
      }
    ],
    relatedSections: ['financial-reports'],
    view: {
      module: '@/components/Reports'
    }
  },
  {
    id: 'settings',
    label: 'الإعدادات',
    description: 'إدارة الحساب، الأمان، وسياسات النسخ الاحتياطي',
    icon: Settings,
    order: 110,
    category: 'settings',
    requires: ['settings:read'],
    breadcrumbs: [
      { label: 'لوحة التحكم', section: 'dashboard' },
      { label: 'الإعدادات' }
    ],
    quickActions: [
      {
        id: 'audit-log',
        label: 'سجل التدقيق',
        icon: Activity,
        targetSection: 'settings',
        requires: ['audit:read'],
        tooltip: 'عرض سجل التدقيق من إعدادات الأمان'
      }
    ],
    relatedSections: ['financial', 'reports'],
    view: {
      module: '@/components/Settings',
      exportName: 'Settings'
    }
  }
]

const NAVIGATION_MAP = new Map<NavigationSectionId, NavigationNode>(
  NAVIGATION_SCHEMA.map(node => [node.id, node])
)

export function collectNavigationPermissionsFromSchema(): NavigationPermission[] {
  const permissions = new Set<NavigationPermission>()
  NAVIGATION_SCHEMA.forEach(node => {
    node.requires?.forEach(permission => permissions.add(permission))
    node.quickActions?.forEach(action => action.requires?.forEach(permission => permissions.add(permission)))
  })
  return Array.from(permissions)
}

export function isNavigationSection(value: string | null | undefined): value is NavigationSectionId {
  return typeof value === 'string' && NAVIGATION_MAP.has(value as NavigationSectionId)
}

export function getNavigationNode(section: NavigationSectionId): NavigationNode {
  const node = NAVIGATION_MAP.get(section)
  if (!node) {
    throw new Error(`Navigation section "${section}" غير معرف في المخطط`)
  }
  return node
}

export function resolveSidebarNodes(): NavigationNode[] {
  return NAVIGATION_SCHEMA.filter(node => !node.hideFromMenu).sort((a, b) => a.order - b.order)
}

export function resolveWorkflowNodes(): NavigationNode[] {
  return NAVIGATION_SCHEMA.filter(node => node.category === 'workflow')
}

export function resolveSectionBreadcrumbs(section: NavigationSectionId): NavigationBreadcrumb[] {
  return getNavigationNode(section).breadcrumbs
}
