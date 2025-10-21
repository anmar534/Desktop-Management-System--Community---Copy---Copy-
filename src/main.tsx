import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import { syncStorage, installLegacyStorageGuard, isStorageReady, whenStorageReady } from '@/shared/utils/storage/storage'

// تحديد اللغة والاتجاه العربي
document.documentElement.setAttribute('dir', 'rtl')
document.documentElement.setAttribute('lang', 'ar')

// تثبيت حارس مفاتيح التخزين القديمة ومن ثم مزامنة التخزين (الهجرة تتم تلقائياً داخل storage.ts)
try {
  installLegacyStorageGuard()
  void syncStorage()
} catch (e) {
  console.warn('Storage guard/sync init warning:', e)
}

// مكوّن إقلاع صغير يضمن جاهزية التخزين قبل تركيب التطبيق
function Boot() {
  const [ready, setReady] = useState<boolean>(isStorageReady())
  // مراقبة عدادات التسعير (تشغيل اختياري عبر FEATURE_PRICING_MONITOR_LOG)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null

    const startMonitor = async (): Promise<void> => {
      try {
        const { PRICING_FLAGS } = await import('@/shared/utils/pricing/pricingHelpers')
        const isMonitorEnabled = Boolean(
          (PRICING_FLAGS as Record<string, unknown>).FEATURE_PRICING_MONITOR_LOG
        )
        if (isMonitorEnabled) {
          // @vite-ignore
          const { pricingRuntime } = await import('@/domain/monitoring/pricingRuntimeMonitor')
          interval = setInterval(() => {
            try {
              const snap = pricingRuntime.snapshot()
              console.log('[PricingHealth]', {
                domain: snap.domainComputations
              })
            } catch (error) {
              console.warn('Pricing monitor tick failed:', error)
            }
          }, 60000)
          console.info('[PricingHealth] Runtime monitor logging ENABLED (60s interval)')
        }
      } catch (error) {
        console.warn('Pricing monitor init skipped:', error)
      }
    }

    void startMonitor()

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [])

  useEffect(() => {
    if (!ready) {
      let mounted = true
      void whenStorageReady()
        .catch(() => undefined)
        .finally(() => {
          if (mounted) setReady(true)
        })
      return () => {
        mounted = false
      }
    }
  }, [ready])

  if (!ready) {
    // شاشة انتظار بسيطة (تظهر لوقت قصير جداً داخل Electron)
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <span className="text-sm text-muted-foreground">جارٍ تهيئة البيانات…</span>
      </div>
    )
  }

  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Boot />
)