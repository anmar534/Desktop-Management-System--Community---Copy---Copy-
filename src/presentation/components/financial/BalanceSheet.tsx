/**
 * مكون الميزانية العمومية
 * يعرض الميزانية العمومية مع التحليلات المالية
 */

import type React from 'react'
import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import {
  Building2,
  Wallet,
  CreditCard,
  PieChart,
  Download,
  RefreshCw,
  Calendar,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  financialStatementsService,
  type BalanceSheet as BalanceSheetType,
} from '@/application/services/financialStatementsService'
import { formatCurrency } from '@/shared/utils/formatters/formatters'

// ===========================
// 📊 Types & Interfaces
// ===========================

interface BalanceSheetProps {
  asOfDate?: string
  onDateChange?: (date: string) => void
  showRatios?: boolean
}

interface BalanceSheetSection {
  title: string
  items: BalanceSheetItem[]
  total: number
  icon: React.ReactNode
  color: string
}

interface BalanceSheetItem {
  label: string
  value: number
  percentage: number
}

// ===========================
// 🎨 Component
// ===========================

export const BalanceSheet: React.FC<BalanceSheetProps> = ({
  asOfDate = new Date().toISOString().split('T')[0],
  onDateChange,
  showRatios = true,
}) => {
  const [balanceSheets, setBalanceSheets] = useState<BalanceSheetType[]>([])
  const [currentBalanceSheet, setCurrentBalanceSheet] = useState<BalanceSheetType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // ===========================
  // 🔄 Data Loading
  // ===========================

  const loadBalanceSheets = async () => {
    try {
      setIsLoading(true)
      const sheets = await financialStatementsService.getBalanceSheets()
      setBalanceSheets(sheets)

      // البحث عن الميزانية الأقرب للتاريخ المحدد
      const current = sheets
        .filter((sheet) => sheet.asOfDate <= asOfDate)
        .sort((a, b) => new Date(b.asOfDate).getTime() - new Date(a.asOfDate).getTime())[0]

      setCurrentBalanceSheet(current || null)
    } catch (error) {
      console.error('خطأ في تحميل الميزانيات العمومية:', error)
      toast.error('فشل في تحميل الميزانيات العمومية')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    await loadBalanceSheets()
    setIsRefreshing(false)
    toast.success('تم تحديث البيانات بنجاح')
  }

  useEffect(() => {
    loadBalanceSheets()
  }, [asOfDate])

  // ===========================
  // 📊 Calculations
  // ===========================

  const balanceSheetSections = useMemo((): BalanceSheetSection[] => {
    if (!currentBalanceSheet) return []

    const { assets, liabilities, equity } = currentBalanceSheet

    return [
      {
        title: 'الأصول',
        icon: <Building2 className="h-5 w-5" />,
        color: 'blue',
        total: assets.totalAssets,
        items: [
          {
            label: 'النقدية وما في حكمها',
            value: assets.currentAssets.cash,
            percentage: (assets.currentAssets.cash / assets.totalAssets) * 100,
          },
          {
            label: 'العملاء والذمم المدينة',
            value: assets.currentAssets.accountsReceivable,
            percentage: (assets.currentAssets.accountsReceivable / assets.totalAssets) * 100,
          },
          {
            label: 'المخزون',
            value: assets.currentAssets.inventory,
            percentage: (assets.currentAssets.inventory / assets.totalAssets) * 100,
          },
          {
            label: 'الممتلكات والمعدات',
            value: assets.nonCurrentAssets.propertyPlantEquipment,
            percentage: (assets.nonCurrentAssets.propertyPlantEquipment / assets.totalAssets) * 100,
          },
          {
            label: 'أصول أخرى',
            value:
              assets.currentAssets.otherCurrentAssets +
              assets.nonCurrentAssets.otherNonCurrentAssets,
            percentage:
              ((assets.currentAssets.otherCurrentAssets +
                assets.nonCurrentAssets.otherNonCurrentAssets) /
                assets.totalAssets) *
              100,
          },
        ],
      },
      {
        title: 'الخصوم',
        icon: <CreditCard className="h-5 w-5" />,
        color: 'red',
        total: liabilities.totalLiabilities,
        items: [
          {
            label: 'الموردون والذمم الدائنة',
            value: liabilities.currentLiabilities.accountsPayable,
            percentage:
              liabilities.totalLiabilities > 0
                ? (liabilities.currentLiabilities.accountsPayable / liabilities.totalLiabilities) *
                  100
                : 0,
          },
          {
            label: 'القروض قصيرة الأجل',
            value: liabilities.currentLiabilities.shortTermDebt,
            percentage:
              liabilities.totalLiabilities > 0
                ? (liabilities.currentLiabilities.shortTermDebt / liabilities.totalLiabilities) *
                  100
                : 0,
          },
          {
            label: 'القروض طويلة الأجل',
            value: liabilities.nonCurrentLiabilities.longTermDebt,
            percentage:
              liabilities.totalLiabilities > 0
                ? (liabilities.nonCurrentLiabilities.longTermDebt / liabilities.totalLiabilities) *
                  100
                : 0,
          },
          {
            label: 'المصروفات المستحقة',
            value: liabilities.currentLiabilities.accruedExpenses,
            percentage:
              liabilities.totalLiabilities > 0
                ? (liabilities.currentLiabilities.accruedExpenses / liabilities.totalLiabilities) *
                  100
                : 0,
          },
          {
            label: 'خصوم أخرى',
            value:
              liabilities.currentLiabilities.otherCurrentLiabilities +
              liabilities.nonCurrentLiabilities.otherNonCurrentLiabilities,
            percentage:
              liabilities.totalLiabilities > 0
                ? ((liabilities.currentLiabilities.otherCurrentLiabilities +
                    liabilities.nonCurrentLiabilities.otherNonCurrentLiabilities) /
                    liabilities.totalLiabilities) *
                  100
                : 0,
          },
        ],
      },
      {
        title: 'حقوق الملكية',
        icon: <Wallet className="h-5 w-5" />,
        color: 'green',
        total: equity.totalEquity,
        items: [
          {
            label: 'رأس المال المدفوع',
            value: equity.paidInCapital,
            percentage:
              equity.totalEquity > 0 ? (equity.paidInCapital / equity.totalEquity) * 100 : 0,
          },
          {
            label: 'الأرباح المحتجزة',
            value: equity.retainedEarnings,
            percentage:
              equity.totalEquity > 0 ? (equity.retainedEarnings / equity.totalEquity) * 100 : 0,
          },
          {
            label: 'حقوق ملكية أخرى',
            value: equity.otherEquity,
            percentage:
              equity.totalEquity > 0 ? (equity.otherEquity / equity.totalEquity) * 100 : 0,
          },
        ],
      },
    ]
  }, [currentBalanceSheet])

  const financialRatios = useMemo(() => {
    if (!currentBalanceSheet) return null

    const { assets, liabilities, equity } = currentBalanceSheet

    // نسب السيولة
    const currentRatio =
      liabilities.currentLiabilities.totalCurrentLiabilities > 0
        ? assets.currentAssets.totalCurrentAssets /
          liabilities.currentLiabilities.totalCurrentLiabilities
        : 0

    const quickAssets = assets.currentAssets.totalCurrentAssets - assets.currentAssets.inventory
    const quickRatio =
      liabilities.currentLiabilities.totalCurrentLiabilities > 0
        ? quickAssets / liabilities.currentLiabilities.totalCurrentLiabilities
        : 0

    // نسب المديونية
    const debtToAssets =
      assets.totalAssets > 0 ? (liabilities.totalLiabilities / assets.totalAssets) * 100 : 0

    const debtToEquity =
      equity.totalEquity > 0 ? (liabilities.totalLiabilities / equity.totalEquity) * 100 : 0

    const equityRatio = assets.totalAssets > 0 ? (equity.totalEquity / assets.totalAssets) * 100 : 0

    return {
      liquidity: [
        { label: 'نسبة التداول', value: currentRatio, benchmark: 2.0, isGood: currentRatio >= 1.5 },
        { label: 'النسبة السريعة', value: quickRatio, benchmark: 1.0, isGood: quickRatio >= 1.0 },
      ],
      leverage: [
        {
          label: 'نسبة الدين إلى الأصول',
          value: debtToAssets,
          benchmark: 50,
          isGood: debtToAssets <= 50,
          isPercentage: true,
        },
        {
          label: 'نسبة الدين إلى حقوق الملكية',
          value: debtToEquity,
          benchmark: 100,
          isGood: debtToEquity <= 100,
          isPercentage: true,
        },
        {
          label: 'نسبة حقوق الملكية',
          value: equityRatio,
          benchmark: 50,
          isGood: equityRatio >= 50,
          isPercentage: true,
        },
      ],
    }
  }, [currentBalanceSheet])

  const isBalanced = useMemo(() => {
    if (!currentBalanceSheet) return false
    const { assets, liabilities, equity } = currentBalanceSheet
    const difference = Math.abs(
      assets.totalAssets - (liabilities.totalLiabilities + equity.totalEquity),
    )
    return difference < 0.01
  }, [currentBalanceSheet])

  // ===========================
  // 🎨 Render
  // ===========================

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-96 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!currentBalanceSheet) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <PieChart className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد ميزانية عمومية</h3>
          <p className="text-gray-500 text-center mb-4">
            لم يتم إنشاء ميزانية عمومية لهذا التاريخ بعد
          </p>
          <Button
            onClick={() => {
              /* TODO: إضافة وظيفة إنشاء ميزانية جديدة */
            }}
          >
            إنشاء ميزانية عمومية جديدة
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">الميزانية العمومية</h2>
          <p className="text-gray-600 mt-1">
            كما في {new Date(currentBalanceSheet.asOfDate).toLocaleDateString('ar-SA')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isBalanced ? (
            <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              متوازنة
            </Badge>
          ) : (
            <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
              <AlertTriangle className="h-3 w-3 mr-1" />
              غير متوازنة
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={refreshData} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            تصدير
          </Button>
        </div>
      </div>

      {/* Balance Sheet Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {balanceSheetSections.map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full">
              <CardHeader className={`bg-${section.color}-50 border-b`}>
                <CardTitle className={`flex items-center gap-2 text-${section.color}-800`}>
                  {section.icon}
                  {section.title}
                </CardTitle>
                <div className={`text-2xl font-bold text-${section.color}-600`}>
                  {formatCurrency(section.total)}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-medium">{formatCurrency(item.value)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={item.percentage} className="h-2 flex-1" />
                        <span className="text-xs text-gray-500 w-12">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Financial Ratios */}
      {showRatios && financialRatios && (
        <Tabs defaultValue="liquidity" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="liquidity">نسب السيولة</TabsTrigger>
            <TabsTrigger value="leverage">نسب المديونية</TabsTrigger>
          </TabsList>

          <TabsContent value="liquidity">
            <Card>
              <CardHeader>
                <CardTitle>نسب السيولة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {financialRatios.liquidity.map((ratio, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{ratio.label}</span>
                        {ratio.isGood ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="text-2xl font-bold mb-1">{ratio.value.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">المعيار: {ratio.benchmark}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leverage">
            <Card>
              <CardHeader>
                <CardTitle>نسب المديونية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {financialRatios.leverage.map((ratio, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{ratio.label}</span>
                        {ratio.isGood ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="text-2xl font-bold mb-1">
                        {ratio.value.toFixed(1)}
                        {ratio.isPercentage ? '%' : ''}
                      </div>
                      <div className="text-sm text-gray-500">
                        المعيار: {ratio.benchmark}
                        {ratio.isPercentage ? '%' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

export default BalanceSheet
