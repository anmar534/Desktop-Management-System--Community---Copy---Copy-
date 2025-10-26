/**
 * Main Application Component
 * Root component that sets up all providers and renders the navigation system
 */

import { Suspense, lazy } from 'react'
import { NavigationProvider } from '@/application/context'
import { FinancialStateProvider } from '@/application/context'
import { RepositoryProvider } from '@/application/services/RepositoryProvider'
import { ThemeProvider } from '@/application/providers/ThemeProvider'
import { CompanySettingsProvider } from '@/application/providers/CompanySettingsProvider'

// Lazy load the main layout component
const AppLayout = lazy(() => import('./presentation/components/layout/AppLayout'))

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background" dir="rtl">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">جاري تحميل التطبيق...</p>
      </div>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <CompanySettingsProvider>
        <RepositoryProvider>
          <FinancialStateProvider>
            <NavigationProvider>
              <Suspense fallback={<LoadingFallback />}>
                <AppLayout />
              </Suspense>
            </NavigationProvider>
          </FinancialStateProvider>
        </RepositoryProvider>
      </CompanySettingsProvider>
    </ThemeProvider>
  )
}

export default App
