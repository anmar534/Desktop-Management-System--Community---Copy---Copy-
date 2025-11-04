import { useState, useEffect } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { RefreshCcw, Settings, Calendar, CalendarDays, Clock } from 'lucide-react'
import { DashboardKPICards } from './components/DashboardKPICards'
import { TenderStatusCards } from '@/presentation/pages/Tenders/components/TenderStatusCards'
import { RemindersCard } from './components/RemindersCard'
import { FinancialSummaryCard } from './components/FinancialSummaryCard'
import { MonthlyCalendarCard } from './components/MonthlyCalendarCard'
import { ProjectManagementCards } from './components/ProjectManagementCards'
import { LazyMonthlyExpensesChart } from '@/presentation/components/charts/LazyCharts'
import { DashboardKPIPreferencesDialog } from './components/DashboardKPIPreferencesDialog'
import { useKPIs } from '@/application/hooks/useKPIs'
import { useDashboardMetrics } from '@/application/hooks/useDashboardMetrics'
import { getHijriDate } from '../../../utils/dateFormatters'

interface DashboardProps {
  onSectionChange: (section: string) => void
}

function Dashboard({ onSectionChange }: DashboardProps) {
  const {
    allKpis,
    visibleKpis,
    selectedIds,
    setSelectedIds,
    maxCards,
    isLoading: kpiLoading,
  } = useKPIs()
  const hasGoals = allKpis.length > 0
  const [preferencesOpen, setPreferencesOpen] = useState(false)

  const { isLoading: dashboardMetricsLoading, refresh: refreshDashboardMetrics } =
    useDashboardMetrics()

  const [currentTime, setCurrentTime] = useState(new Date())

  // تحديث الوقت كل ثانية
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // تنسيق التاريخ الميلادي
  const getGregorianDate = (date: Date) => {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    const months = [
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'مايو',
      'يونيو',
      'يوليو',
      'أغسطس',
      'سبتمبر',
      'أكتوبر',
      'نوفمبر',
      'ديسمبر',
    ]

    const dayName = days[date.getDay()]
    const day = date.getDate()
    const month = months[date.getMonth()]
    const year = date.getFullYear()

    return { dayName, day, month, year }
  }

  // تنسيق الوقت
  const getFormattedTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  }

  const gregorianDate = getGregorianDate(currentTime)
  const hijriDate = getHijriDate(currentTime)
  const formattedTime = getFormattedTime(currentTime)

  const handleRefreshDashboard = () => {
    void refreshDashboardMetrics()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted">
      <div className="p-6 space-y-6 max-w-[1920px] mx-auto">
        {/* Header Section */}
        <div className="bg-card rounded-2xl shadow-lg border border-border p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Title & Description */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">لوحة التحكم التنفيذية</h1>
              <p className="text-sm text-muted-foreground mb-3">
                نظرة شاملة على مؤشرات الأداء الرئيسية والعمليات التشغيلية
              </p>
            </div>

            {/* Date, Time & Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Date & Time Display */}
              <div className="flex items-center gap-4 bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3 rounded-xl border border-primary/20">
                {/* Gregorian Date */}
                <div className="text-center">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <CalendarDays className="h-3 w-3" />
                    <span>ميلادي</span>
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {gregorianDate.dayName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {gregorianDate.day} {gregorianDate.month} {gregorianDate.year}
                  </div>
                </div>

                <div className="w-px h-12 bg-border"></div>

                {/* Hijri Date */}
                <div className="text-center">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Calendar className="h-3 w-3" />
                    <span>هجري</span>
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {hijriDate.day} {hijriDate.month}
                  </div>
                  <div className="text-xs text-muted-foreground">{hijriDate.year} هـ</div>
                </div>

                <div className="w-px h-12 bg-border"></div>

                {/* Time */}
                <div className="text-center">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Clock className="h-3 w-3" />
                    <span>الوقت</span>
                  </div>
                  <div className="text-lg font-bold text-primary font-mono">{formattedTime}</div>
                  <div className="text-xs text-muted-foreground">الرياض</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshDashboard}
                  disabled={dashboardMetricsLoading}
                  className="hover:bg-primary/10"
                >
                  <RefreshCcw
                    className={`h-4 w-4 ml-2 ${dashboardMetricsLoading ? 'animate-spin' : ''}`}
                  />
                  تحديث
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSectionChange('settings')}
                  className="hover:bg-muted/40"
                >
                  <Settings className="h-4 w-4 ml-2" />
                  الإعدادات
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* الصف الأول: بطاقات مؤشرات الأداء الرئيسية (KPIs) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">مؤشرات الأداء الرئيسية</h2>
              <p className="text-sm text-muted-foreground">
                مقارنة الإنجازات الفعلية مع الأهداف المحددة
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreferencesOpen(true)}
                disabled={!hasGoals}
                className="hover:bg-primary/10"
              >
                تخصيص المؤشرات
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSectionChange('development')}
                className="text-primary hover:text-primary/80"
              >
                إدارة الأهداف ←
              </Button>
            </div>
          </div>
          <DashboardKPICards
            kpis={visibleKpis}
            isLoading={kpiLoading}
            maxCards={maxCards}
            hasGoals={hasGoals}
            onSectionChange={onSectionChange}
            onAddGoals={() => onSectionChange('development')}
            onCustomize={() => setPreferencesOpen(true)}
          />
        </div>

        {/* الصف الثاني: المنافسات العاجلة وتحليل الأداء والتقويم */}
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-foreground">حالة المنافسات والتقويم</h2>
            <p className="text-sm text-muted-foreground">
              نظرة شاملة على المنافسات والمواعيد المهمة
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <TenderStatusCards onSectionChange={onSectionChange} />
            <MonthlyCalendarCard
              onDateClick={(date, reminders) => {
                console.log('Selected date:', date, 'Reminders:', reminders)
              }}
            />
          </div>
        </div>

        {/* الصف الثالث: بطاقات إدارة المشاريع والتذكيرات */}
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-foreground">إدارة المشاريع والتذكيرات</h2>
            <p className="text-sm text-muted-foreground">
              نظرة سريعة على أداء المشاريع والمواعيد المهمة
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ProjectManagementCards onSectionChange={onSectionChange} />
            <RemindersCard onSectionChange={onSectionChange} />
          </div>
        </div>

        {/* الصف الرابع: المصاريف الشهرية والملخص المالي */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-foreground">المصاريف الشهرية</h2>
              <p className="text-sm text-muted-foreground">
                تحليل المصاريف الشهرية مقارنة بالموازنة
              </p>
            </div>
            <LazyMonthlyExpensesChart onSectionChange={onSectionChange} />
          </div>
          <FinancialSummaryCard onSectionChange={onSectionChange} />
        </div>
      </div>
      <DashboardKPIPreferencesDialog
        open={preferencesOpen}
        onOpenChange={setPreferencesOpen}
        kpis={allKpis}
        selectedIds={selectedIds}
        maxSelectable={maxCards}
        onSave={setSelectedIds}
      />
    </div>
  )
}

export default Dashboard
