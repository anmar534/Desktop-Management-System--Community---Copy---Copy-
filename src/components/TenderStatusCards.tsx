'use client'

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { EmptyState } from './PageLayout'
import { 
  Trophy,
  Clock,
  Target,
  TrendingUp,
  DollarSign,
  CheckCircle,
  Plus,
  BarChart3,
  Search,
  Zap
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatCurrency } from '../utils/formatters'
import { useMemo } from 'react'
import { useFinancialState } from '@/application/context'
import { calculateTenderStats } from '../calculations/tender'
import type { Tender } from '../data/centralData'

interface TenderStatusCardsProps {
  onSectionChange: (
    section:
      | "dashboard"
      | "projects"
      | "new-project"
      | "tenders"
      | "new-tender"
      | "clients"
      | "new-client"
      | "financial"
      | "purchases"
      | "new-purchase-order"
      | "reports"
      | "settings",
  ) => void;
}

export function TenderStatusCards({ onSectionChange }: TenderStatusCardsProps) {
  const { tenders: tendersState } = useFinancialState()
  const { tenders, isLoading } = tendersState

  // إحصائيات موحدة للمنافسات
  const tenderStats = useMemo(() => calculateTenderStats(tenders), [tenders])

  // قائمة المنافسات العاجلة (لعرض أبرز 4 عناصر فقط)
  const urgentTenders = useMemo(() => (
    tenders.filter((tender: Tender) => {
      if (!tender.deadline) return false
      const deadlineDate = new Date(tender.deadline)
      const today = new Date()
      const diffTime = deadlineDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays <= 7 && diffDays >= 0 && ['new', 'under_action'].includes(tender.status)
    }).slice(0, 4)
  ), [tenders])

  // استخدام الإحصائيات الموحدة
  const performanceData = {
    thisMonth: {
      submitted: tenderStats.waitingResults,
      won: tenderStats.won,
      lost: tenderStats.lost,
      pending: tenderStats.waitingResults,
      winRate: tenderStats.winRate,
      // إجمالي قيمة المنافسات المقدمة (ليس جزءاً من calculateTenderStats)
      totalValue: (
        tenders.filter((t) => t.status === 'submitted').reduce((sum, t) => sum + (t.value || 0), 0)
      ) / 1000000
    },
    lastMonth: {
      submitted: 6,
      won: 3,
      lost: 3,
      winRate: 50,
      totalValue: 32.1
    }
  }

  const improvement = {
    winRate: performanceData.thisMonth.winRate - performanceData.lastMonth.winRate,
    value: performanceData.thisMonth.totalValue - performanceData.lastMonth.totalValue
  }

  // دالة للحصول على classes للمنافسات العاجلة
  const getUrgencyClasses = (daysLeft: number) => {
    if (daysLeft <= 1) return "text-red-600 bg-red-50 border-red-200"
    if (daysLeft <= 3) return "text-orange-600 bg-orange-50 border-orange-200"
    if (daysLeft <= 7) return "text-yellow-600 bg-yellow-50 border-yellow-200"
    return "text-blue-600 bg-blue-50 border-blue-200"
  }

  // دالة حساب الأيام المتبقية
  const getDaysRemainingLocal = (deadline: string) => {
    if (!deadline) return 0
    const deadlineDate = new Date(deadline)
    const today = new Date()
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return Math.max(0, diffDays)
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
        <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* بطاقة المنافسات العاجلة */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-300 h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              المنافسات العاجلة
              <Badge variant="destructive" className="text-xs">
                {tenderStats.urgent} عاجل
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              المنافسات التي تحتاج إجراء فوري خلال الأسبوع القادم
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            
            {/* إحصائيات سريعة */}
                        {/* إحصائيات سريعة */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <div className="text-center">
                <div className="text-lg font-bold text-destructive">{tenderStats.expired}</div>
                <div className="text-xs text-muted-foreground">منتهية الصلاحية</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-warning">{tenderStats.underAction}</div>
                <div className="text-xs text-muted-foreground">قيد الإجراء</div>
              </div>
            </div>

            {/* قائمة المنافسات العاجلة */}
            <div className="space-y-3">
              {urgentTenders.length > 0 ? (
                urgentTenders.map((tender: Tender, index: number) => (
                  <motion.div
                    key={tender.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                    className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:border-warning transition-colors cursor-pointer"
                    onClick={() => onSectionChange('tenders')}
                  >
                    {/* أيقونة المنافسة مع لون موحد للعاجلة */}
                    <div className={`p-2 rounded-lg ${
                      (() => {
                        const daysLeft = getDaysRemainingLocal(tender.deadline);
                        return getUrgencyClasses(daysLeft);
                      })()
                    }`}>
                      <Trophy className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground truncate">
                        {tender.title || tender.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{tender.client}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-primary">{formatCurrency(tender.value)}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge variant={
                        (() => {
                          const daysLeft = getDaysRemainingLocal(tender.deadline);
                          return daysLeft <= 1 ? 'destructive' : daysLeft <= 3 ? 'secondary' : 'outline'
                        })()
                      } className="text-xs">
                        {getDaysRemainingLocal(tender.deadline)} أيام
                      </Badge>
                    </div>
                  </motion.div>
                ))
              ) : (
                <EmptyState
                  icon={CheckCircle}
                  title="لا توجد منافسات عاجلة"
                  description="جميع المنافسات ضمن الجدول الزمني المحدد."
                  actionLabel="عرض جميع المنافسات"
                  onAction={() => onSectionChange('tenders')}
                />
              )}
            </div>

            {/* إجراءات سريعة */}
            <div className="flex gap-2 pt-3 border-t border-border">
              <Button 
                size="sm" 
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200 group"
                onClick={() => onSectionChange('tenders')}
              >
                <Search className="h-4 w-4 ml-1 group-hover:scale-110 transition-transform" />
                استعراض المنافسات
              </Button>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-md hover:shadow-lg transition-all duration-200 group"
                onClick={() => onSectionChange('new-tender')}
              >
                <Plus className="h-4 w-4 ml-1 group-hover:rotate-90 transition-transform" />
                إضافة منافسة
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* بطاقة تحليل أداء المنافسات */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-300 h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
              تحليل أداء المنافسات
              <Badge variant={improvement.winRate > 0 ? 'success' : 'destructive'} className="text-xs">
                {improvement.winRate > 0 ? 'تحسن' : 'تراجع'}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              مقارنة أداء هذا الشهر مع الشهر الماضي
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            
            {/* مقارنة معدل الفوز */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-foreground/80">معدل الفوز</h4>
                <div className="flex items-center gap-1">
                  {improvement.winRate > 0 ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-destructive rotate-180" />
                  )}
                  <span className={`text-sm font-medium ${
                    improvement.winRate > 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {improvement.winRate > 0 ? '+' : ''}{improvement.winRate}%
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="text-center">
                    <div className="text-xl font-bold text-primary">
                      {performanceData.thisMonth.winRate}%
                    </div>
                    <div className="text-xs text-muted-foreground">هذا الشهر</div>
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg border border-border">
                  <div className="text-center">
                    <div className="text-xl font-bold text-muted-foreground">
                      {performanceData.lastMonth.winRate}%
                    </div>
                    <div className="text-xs text-muted-foreground">الشهر الماضي</div>
                  </div>
                </div>
              </div>
            </div>

            {/* تفاصيل المنافسات */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground/80">تفصيل المنافسات (هذا الشهر)</h4>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-2 bg-primary/10 rounded-lg">
                  <div className="text-lg font-bold text-primary">{performanceData.thisMonth.submitted}</div>
                  <div className="text-xs text-muted-foreground">مُقدمة</div>
                </div>
                <div className="text-center p-2 bg-success/10 rounded-lg">
                  <div className="text-lg font-bold text-success">{performanceData.thisMonth.won}</div>
                  <div className="text-xs text-muted-foreground">فائزة</div>
                </div>
                <div className="text-center p-2 bg-destructive/10 rounded-lg">
                  <div className="text-lg font-bold text-destructive">{performanceData.thisMonth.lost}</div>
                  <div className="text-xs text-muted-foreground">خاسرة</div>
                </div>
                <div className="text-center p-2 bg-warning/10 rounded-lg">
                  <div className="text-lg font-bold text-warning">{performanceData.thisMonth.pending}</div>
                  <div className="text-xs text-muted-foreground">منتظرة</div>
                </div>
              </div>
            </div>

            {/* القيمة الإجمالية */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">القيمة الإجمالية للفوز</span>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-success" />
                  <span className="text-sm font-bold text-success">
                    {formatCurrency(performanceData.thisMonth.totalValue)}
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                زيادة {formatCurrency(improvement.value)} من الشهر الماضي
              </div>
            </div>

            {/* إجراءات */}
            <div className="flex gap-2 pt-3 border-t border-border">
              <Button 
                size="sm" 
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md hover:shadow-lg transition-all duration-200 group"
                onClick={() => onSectionChange('reports')}
              >
                <BarChart3 className="h-4 w-4 ml-1 group-hover:scale-110 transition-transform" />
                تقرير مفصل
              </Button>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-md hover:shadow-lg transition-all duration-200 group"
                onClick={() => onSectionChange('tenders')}
              >
                <Zap className="h-4 w-4 ml-1 group-hover:scale-110 transition-transform" />
                عرض سريع
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}