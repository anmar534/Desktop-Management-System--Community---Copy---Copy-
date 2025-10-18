/**
 * Tender Pricing V2 Prototype
 * نموذج أولي لنظام التسعير المحسّن
 *
 * هذا نموذج تجريبي يجمع جميع التحسينات المقترحة:
 * - محدد بنود محسّن مع بحث وفلترة
 * - جداول موارد محسّنة مع inline editing
 * - ملخص تسعير محسّن مع ألوان وتباعد أفضل
 * - مؤشرات حفظ واضحة
 * - تجربة مستخدم محسّنة بالكامل
 *
 * @version 2.0 - Prototype
 * @date 2025-10-18
 */

import { useState, useMemo, useCallback } from 'react'
import { Save, CheckCircle, Loader2, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { motion, AnimatePresence } from 'framer-motion'
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter'

import { EnhancedItemSelector } from './components/EnhancedItemSelector'
import { EnhancedResourceTable } from './components/EnhancedResourceTable'
import { EnhancedPricingSummary } from './components/EnhancedPricingSummary'

import {
  mockItems,
  mockTender,
  mockPricingDataMap,
  type MockPricingItem,
  type MockPricingData,
  type MockMaterialRow,
  type MockLaborRow,
  type MockEquipmentRow,
  type MockSubcontractorRow,
} from './mockData'

type SaveStatus = 'idle' | 'saving' | 'saved'

export const TenderPricingV2Prototype: React.FC = () => {
  const { formatCurrencyValue } = useCurrencyFormatter()

  // حالة البند الحالي
  const [currentIndex, setCurrentIndex] = useState(0)

  // بيانات التسعير لكل بند
  const [pricingMap, setPricingMap] = useState<Record<string, MockPricingData>>(mockPricingDataMap)

  // حالة الحفظ
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  const currentItem = mockItems[currentIndex]
  const currentPricing = pricingMap[currentItem.id] || {
    materials: [],
    labor: [],
    equipment: [],
    subcontractors: [],
    percentages: {
      administrative: 5,
      operational: 5,
      profit: 15,
    },
  }

  // حساب الإجماليات
  const calculations = useMemo(() => {
    const materialsTotal = currentPricing.materials.reduce((sum, m) => sum + m.total, 0)
    const laborTotal = currentPricing.labor.reduce((sum, l) => sum + l.total, 0)
    const equipmentTotal = currentPricing.equipment.reduce((sum, e) => sum + e.total, 0)
    const subcontractorsTotal = currentPricing.subcontractors.reduce((sum, s) => sum + s.total, 0)

    const baseSubtotal = materialsTotal + laborTotal + equipmentTotal + subcontractorsTotal

    const administrative = baseSubtotal * (currentPricing.percentages.administrative / 100)
    const operational = baseSubtotal * (currentPricing.percentages.operational / 100)
    const profit = baseSubtotal * (currentPricing.percentages.profit / 100)

    const adminOperational = administrative + operational
    const totalValue = baseSubtotal + adminOperational + profit

    const vatRate = 0.15
    const vatAmount = totalValue * vatRate
    const totalWithVat = totalValue + vatAmount

    return {
      materialsTotal,
      laborTotal,
      equipmentTotal,
      subcontractorsTotal,
      baseSubtotal,
      administrative,
      operational,
      profit,
      adminOperational,
      totalValue,
      vatRate,
      vatAmount,
      totalWithVat,
      profitPercentage: baseSubtotal > 0 ? (profit / baseSubtotal) * 100 : 0,
      adminOperationalPercentage: totalValue > 0 ? (adminOperational / totalValue) * 100 : 0,
    }
  }, [currentPricing])

  // حساب التقدم الإجمالي
  const progress = useMemo(() => {
    const pricedCount = mockItems.filter((item) => item.isPriced).length
    const percentage = (pricedCount / mockItems.length) * 100
    return { pricedCount, total: mockItems.length, percentage }
  }, [])

  // تحديث بيانات قسم معين
  const updateSection = useCallback(
    (
      section: 'materials' | 'labor' | 'equipment' | 'subcontractors',
      data: MockMaterialRow[] | MockLaborRow[] | MockEquipmentRow[] | MockSubcontractorRow[],
    ) => {
      setPricingMap((prev) => ({
        ...prev,
        [currentItem.id]: {
          ...currentPricing,
          [section]: data,
        },
      }))

      // محاكاة الحفظ
      setSaveStatus('saving')
      setTimeout(() => {
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      }, 500)
    },
    [currentItem.id, currentPricing],
  )

  // التنقل بين البنود
  const handleNext = useCallback(() => {
    if (currentIndex < mockItems.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }, [currentIndex])

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }, [currentIndex])

  const handleSelectItem = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      {/* الهيدر */}
      <div className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70">
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-foreground">نظام التسعير المحسّن</h1>
                    <Badge variant="secondary" className="font-semibold">
                      v2.0 نموذج أولي
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {mockTender.name} • {mockTender.client}
                  </p>
                </div>
              </div>
            </div>

            {/* مؤشر الحفظ */}
            <AnimatePresence mode="wait">
              {saveStatus !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor:
                      saveStatus === 'saved'
                        ? 'hsl(var(--success) / 0.1)'
                        : 'hsl(var(--primary) / 0.1)',
                    borderColor:
                      saveStatus === 'saved'
                        ? 'hsl(var(--success) / 0.3)'
                        : 'hsl(var(--primary) / 0.3)',
                  }}
                >
                  {saveStatus === 'saving' && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm font-medium text-primary">جاري الحفظ...</span>
                    </>
                  )}
                  {saveStatus === 'saved' && (
                    <>
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium text-success">تم الحفظ</span>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* شريط التقدم */}
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-l from-primary/5 via-card/40 to-background border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">التقدم الإجمالي</span>
              <span className="text-2xl font-bold text-primary tabular-nums">
                {progress.percentage.toFixed(0)}%
              </span>
            </div>
            <Progress value={progress.percentage} className="h-3 mb-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {progress.pricedCount} من {progress.total} بند مكتمل
              </span>
              <span>{progress.total - progress.pricedCount} بند متبقي</span>
            </div>
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* محدد البنود */}
          <EnhancedItemSelector
            items={mockItems}
            currentIndex={currentIndex}
            onSelectItem={handleSelectItem}
            onNext={handleNext}
            onPrevious={handlePrevious}
            formatCurrency={formatCurrencyValue}
          />

          {/* ملخص التسعير */}
          <EnhancedPricingSummary totals={calculations} formatCurrency={formatCurrencyValue} />

          {/* جداول الموارد */}
          <div className="space-y-6">
            <EnhancedResourceTable
              type="materials"
              resources={currentPricing.materials}
              onChange={(data) => updateSection('materials', data as MockMaterialRow[])}
              formatCurrency={formatCurrencyValue}
            />

            <EnhancedResourceTable
              type="labor"
              resources={currentPricing.labor}
              onChange={(data) => updateSection('labor', data as MockLaborRow[])}
              formatCurrency={formatCurrencyValue}
            />

            <EnhancedResourceTable
              type="equipment"
              resources={currentPricing.equipment}
              onChange={(data) => updateSection('equipment', data as MockEquipmentRow[])}
              formatCurrency={formatCurrencyValue}
            />

            <EnhancedResourceTable
              type="subcontractors"
              resources={currentPricing.subcontractors}
              onChange={(data) => updateSection('subcontractors', data as MockSubcontractorRow[])}
              formatCurrency={formatCurrencyValue}
            />
          </div>

          {/* أزرار الإجراءات */}
          <Card className="p-6 sticky bottom-4 shadow-xl border-primary/20 bg-card/95 backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                >
                  البند السابق
                </Button>
                <Button
                  size="lg"
                  onClick={handleNext}
                  disabled={currentIndex === mockItems.length - 1}
                  className="gap-2 font-bold"
                >
                  <span>حفظ والانتقال للبند التالي</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">إجمالي البند:</span>
                <span className="text-2xl font-bold text-success tabular-nums">
                  {formatCurrencyValue(calculations.totalWithVat)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ملاحظة النموذج الأولي */}
      <div className="fixed bottom-4 left-4 max-w-md">
        <Card className="p-4 border-info/30 bg-info/5 backdrop-blur">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-info mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-info mb-1">نموذج أولي تجريبي</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                هذه نسخة تجريبية محسّنة لنظام التسعير تتضمن جميع التحسينات المقترحة في التقرير.
                البيانات المعروضة تجريبية ولا تؤثر على النظام الفعلي.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
