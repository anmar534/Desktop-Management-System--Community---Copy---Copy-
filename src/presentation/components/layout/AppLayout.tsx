/**
 * Application Layout Component
 * Main layout that includes sidebar, header, and dynamic content area
 */

import { Suspense } from 'react'
import { useNavigation } from '@/application/context'
import { Sidebar } from '@/presentation/components/ui/layout/Sidebar'
import { Header } from '@/presentation/components/ui/layout/Header'

// Direct imports (no lazy loading for now to avoid errors)
import DashboardPage from '@/presentation/pages/Dashboard/DashboardPage'
import ProjectsContainer from '@/features/projects/ProjectsContainer'
import { Tenders } from '@/presentation/pages/Tenders/TendersPage'
import { NewTenderForm } from '@/presentation/pages/Tenders/components/NewTenderForm'
import { AnalyticsRouter } from '@/presentation/components/analytics/AnalyticsRouter'
import FinancialPage from '@/presentation/pages/Financial/FinancialPage'
import { NewInvoice } from '@/presentation/pages/Financial/components/NewInvoice'
import { NewBankAccount } from '@/presentation/pages/Financial/components/NewBankAccount'
import { NewBudget } from '@/presentation/pages/Financial/components/NewBudget'
import ExpenseManagement from '@/presentation/pages/Financial/components/ExpenseManagement'
import { Development } from '@/presentation/pages/Development/DevelopmentPage'
import ReportsPage from '@/presentation/pages/Reports/ReportsPage'
import { NewReport } from '@/presentation/pages/Reports/components/NewReport'
import { Settings } from '@/presentation/pages/Settings/SettingsPage'

// Page mapping by section
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PAGE_COMPONENTS: Record<string, React.ComponentType<any>> = {
  dashboard: DashboardPage,
  projects: ProjectsContainer,
  tenders: Tenders,
  'new-tender': NewTenderForm,
  analytics: AnalyticsRouter,
  financial: FinancialPage,
  invoices: FinancialPage,
  budgets: FinancialPage,
  'bank-accounts': FinancialPage,
  'financial-reports': FinancialPage,
  'new-invoice': NewInvoice,
  'new-bank-account': NewBankAccount,
  'new-budget': NewBudget,
  'new-report': NewReport,
  'administrative-expenses': ExpenseManagement,
  development: Development,
  reports: ReportsPage,
  settings: Settings,
}

// Loading fallback for lazy-loaded pages
function PageLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]" dir="rtl">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
        <p className="text-sm text-muted-foreground">جاري التحميل...</p>
      </div>
    </div>
  )
}

function AppLayout() {
  const { activeSection, navigate, tenderToEdit } = useNavigation()

  // Get the component for the active section
  const PageComponent = PAGE_COMPONENTS[activeSection]

  // Prepare props for components that need them
  const getPageProps = (): Record<string, unknown> => {
    const props: Record<string, unknown> = {}

    const sectionsWithNavigation = new Set([
      'dashboard',
      'projects',
      'tenders',
      'financial',
      'invoices',
      'budgets',
      'bank-accounts',
      'financial-reports',
      'reports',
      'new-invoice',
      'new-bank-account',
      'new-budget',
      'new-report',
    ])

    if (sectionsWithNavigation.has(activeSection)) {
      // Wrap navigate to handle tender parameter correctly
      props.onSectionChange = (section: string, tender?: unknown) => {
        console.log('[AppLayout][onSectionChange] section:', section)
        console.log('[AppLayout][onSectionChange] tender:', tender)
        navigate(section as any, tender ? { tender: tender as any } : undefined)
      }
    }

    const financialTabBySection: Record<string, string> = {
      financial: 'expenses',
      invoices: 'invoices',
      budgets: 'budgets',
      'bank-accounts': 'bank-accounts',
      'financial-reports': 'reports',
    }

    const initialTab = financialTabBySection[activeSection]
    if (initialTab) {
      props.initialTab = initialTab
    }

    // Handle NewTenderForm props
    if (activeSection === 'new-tender') {
      props.onBack = () => navigate('tenders')
      props.onSave = async (tenderData: any) => {
        try {
          console.log('[AppLayout][onSave] Received tenderData:', tenderData)
          console.log('[AppLayout][onSave] tenderData.id:', tenderData.id)
          console.log('[AppLayout][onSave] tenderToEdit:', tenderToEdit)
          console.log('[AppLayout][onSave] tenderToEdit.id:', tenderToEdit?.id)

          const { getTenderRepository } = await import('@/application/services/serviceRegistry')
          const tenderRepo = getTenderRepository()

          // Check if we're editing an existing tender
          const isEditing = tenderToEdit && (tenderData.id || tenderToEdit.id)

          console.log('[AppLayout][onSave] isEditing:', isEditing)

          if (isEditing) {
            // Update existing tender - use the ID from tenderData or fallback to tenderToEdit
            const tenderId = tenderData.id || tenderToEdit.id
            console.log('[AppLayout][onSave] Updating tender with ID:', tenderId)
            await tenderRepo.update(tenderId, tenderData)
          } else {
            // Create new tender - remove id if present
            console.log('[AppLayout][onSave] Creating new tender')
            const { id, ...dataWithoutId } = tenderData
            await tenderRepo.create(dataWithoutId)
          }

          navigate('tenders')
        } catch (error) {
          console.error('Error saving tender:', error)
          throw error
        }
      }

      // Pass existing tender if editing
      if (tenderToEdit) {
        props.existingTender = tenderToEdit
      }
    }

    return props
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area with proper margin for fixed sidebar */}
      <div className="transition-all duration-300 mr-20 lg:mr-72">
        {/* Header */}
        <Header />

        {/* Page content */}
        <main className="container mx-auto px-4 py-6">
          {PageComponent ? (
            <Suspense fallback={<PageLoadingFallback />}>
              <PageComponent {...getPageProps()} />
            </Suspense>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-foreground mb-2">الصفحة غير متاحة</h2>
              <p className="text-muted-foreground">
                القسم المطلوب ({activeSection}) غير موجود أو غير متاح حالياً
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default AppLayout
