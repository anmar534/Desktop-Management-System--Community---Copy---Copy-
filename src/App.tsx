import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  type ComponentType,
  type LazyExoticComponent,
} from 'react'
import { Header } from '@/presentation/components/layout/Header'
import { Sidebar } from '@/presentation/components/layout/Sidebar'
import { Toaster } from 'sonner'
import { syncStorage } from '@/utils/storage'
import {
  FinancialStateProvider,
  NavigationProvider,
  useNavigation,
  useFinancialState,
} from '@/application/context'
import type { FinancialTabValue } from '@/presentation/pages/Financial/FinancialPage'
import { RepositoryProvider } from '@/application/services/RepositoryProvider'
import { ThemeProvider } from '@/application/providers/ThemeProvider'
import { CompanySettingsProvider } from '@/application/providers/CompanySettingsProvider'
import type { Tender } from '@/data/centralData'
import {
  isNavigationSection,
  type AppSection,
  type NavigationNode,
} from '@/application/navigation/navigationSchema'

type ViewModuleLoader = () => Promise<Record<string, unknown>>

const viewModuleLoaders = import.meta.glob(
  './{presentation,features,prototypes}/**/*.{ts,tsx}',
) as Record<string, ViewModuleLoader>

const SECTIONS_WITH_ON_SECTION_CHANGE: AppSection[] = [
  'dashboard',
  'projects',
  'tenders',
  'analytics',
  'financial',
  'invoices',
  'bank-accounts',
  'budgets',
  'financial-reports',
  'new-invoice',
  'new-bank-account',
  'new-budget',
  'new-report',
  'reports',
]

const FINANCIAL_SECTION_TABS: Partial<Record<AppSection, FinancialTabValue>> = {
  financial: 'overview',
  invoices: 'invoices',
  budgets: 'budgets',
  'bank-accounts': 'bank-accounts',
  'financial-reports': 'reports',
}

function resolveModuleLoader(modulePath: string): ViewModuleLoader | undefined {
  const normalized = modulePath.replace(/^@\//, './')
  const candidates = [normalized, `${normalized}.tsx`, `${normalized}.ts`]
  for (const candidate of candidates) {
    const loader = viewModuleLoaders[candidate]
    if (loader) {
      return loader
    }
  }
  return undefined
}

function createLazyView(
  node: NavigationNode,
): LazyExoticComponent<ComponentType<Record<string, unknown>>> | null {
  const loader = resolveModuleLoader(node.view.module)
  if (!loader) {
    console.warn(
      `[navigation] تعذر العثور على المكون المرتبط بالمقطع "${node.id}" (${node.view.module})`,
    )
    return null
  }
  const exportName = node.view.exportName ?? 'default'
  return lazy(async () => {
    const mod = await loader()
    const resolvedExport =
      exportName === 'default'
        ? (mod as { default?: unknown }).default
        : (mod as Record<string, unknown>)[exportName]
    if (typeof resolvedExport !== 'function' && typeof resolvedExport !== 'object') {
      throw new Error(`Navigation view "${node.id}" لا يملك التصدير "${exportName}"`)
    }
    return { default: resolvedExport as ComponentType<Record<string, unknown>> }
  })
}

function MissingView({ section }: { section: AppSection }) {
  return <div className="p-6 text-destructive">تعذر تحميل الواجهة الخاصة بالمقطع: {section}</div>
}

const AppShell = () => {
  const { navigate, activeSection, tenderToEdit, availableSections } = useNavigation()
  const { tenders: tendersState } = useFinancialState()
  const { addTender, updateTender } = tendersState

  const handleSectionChange = useCallback(
    (section: string, tender?: Tender) => {
      if (!isNavigationSection(section)) {
        console.warn('[navigation] محاولة الانتقال إلى مقطع غير معرف:', section)
        return
      }
      navigate(section, tender ? { tender } : undefined)
    },
    [navigate],
  )

  const handleTenderBack = useCallback(() => {
    navigate('tenders')
  }, [navigate])

  const handleTenderSave = useCallback(
    (formData: Record<string, unknown>) => {
      if (tenderToEdit) {
        const updatedTender = { ...formData, id: tenderToEdit.id } as Tender
        void updateTender(updatedTender)
        console.log('✅ تم تحديث المنافسة الموجودة')
      } else {
        const { id: _generatedId, ...createPayload } = formData
        const newTenderPayload = createPayload as unknown as Tender
        void addTender(newTenderPayload)
        console.log('✅ تم إنشاء منافسة جديدة')
      }
      navigate('tenders')
    },
    [addTender, navigate, tenderToEdit, updateTender],
  )

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await syncStorage()
        console.log('✅ تم تهيئة التطبيق وإجراء المزامنة')
      } catch (error) {
        console.error('❌ خطأ في تهيئة التطبيق:', error)
      }
    }

    void initializeApp()
  }, [])

  const viewComponents = useMemo(() => {
    const map = new Map<AppSection, LazyExoticComponent<ComponentType<Record<string, unknown>>>>()
    availableSections.forEach((node) => {
      const component = createLazyView(node)
      if (component) {
        map.set(node.id, component)
      }
    })
    return map
  }, [availableSections])

  const getSectionProps = useCallback(
    (section: AppSection): Record<string, unknown> => {
      if (section === 'new-tender') {
        return {
          existingTender: tenderToEdit,
          onBack: handleTenderBack,
          onSave: handleTenderSave,
        }
      }
      if (section === 'settings') {
        return {}
      }
      if (section in FINANCIAL_SECTION_TABS) {
        return {
          onSectionChange: handleSectionChange,
          initialTab: FINANCIAL_SECTION_TABS[section] ?? 'overview',
        }
      }
      if (SECTIONS_WITH_ON_SECTION_CHANGE.includes(section)) {
        return {
          onSectionChange: handleSectionChange,
        }
      }
      return {}
    },
    [handleSectionChange, handleTenderBack, handleTenderSave, tenderToEdit],
  )

  const sectionProps = useMemo(
    () => getSectionProps(activeSection),
    [activeSection, getSectionProps],
  )

  const ActiveComponent = viewComponents.get(activeSection)

  return (
    <div className="relative min-h-screen bg-muted/8 text-foreground" dir="rtl" lang="ar">
      <div className="relative z-10">
        <div className="sticky top-0 z-20 px-6 pt-6 bg-background/95 backdrop-blur-md">
          <Header />
        </div>

        <div className="flex gap-4 px-6 pb-6 pt-4">
          <div className="sticky top-32 self-start h-[calc(100vh-9rem)]">
            <Sidebar />
          </div>

          <main className="flex-1 min-w-0 pb-6">
            <div className="rounded-3xl border border-border/30 bg-card/60 shadow-xl backdrop-blur-xl">
              <div className="p-6">
                <Suspense
                  fallback={<div className="p-6 text-muted-foreground">جارٍ التحميل...</div>}
                >
                  {ActiveComponent ? (
                    <ActiveComponent {...sectionProps} />
                  ) : (
                    <MissingView section={activeSection} />
                  )}
                </Suspense>
              </div>
            </div>
          </main>
        </div>
      </div>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          },
        }}
      />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <CompanySettingsProvider>
        <RepositoryProvider>
          <NavigationProvider>
            <FinancialStateProvider>
              <AppShell />
            </FinancialStateProvider>
          </NavigationProvider>
        </RepositoryProvider>
      </CompanySettingsProvider>
    </ThemeProvider>
  )
}

