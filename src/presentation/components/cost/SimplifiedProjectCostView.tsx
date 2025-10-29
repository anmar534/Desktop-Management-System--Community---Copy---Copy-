import React, { useState, useCallback, useEffect } from 'react'
import {
  Loader2,
  FileDown,
  Calculator,
  AlertCircle,
  CheckCircle2,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { useBOQ } from '@/application/hooks/useBOQ'
import { useRepository } from '@/application/services/RepositoryProvider'
import { getBOQRepository } from '@/application/services/serviceRegistry'
import { TenderPricingRepository } from '@/infrastructure/repositories/TenderPricingRepository'
import type { BOQItem } from '@/shared/types/boq'
import { useCurrencyFormatter } from '@/application/hooks/useCurrencyFormatter'
import { CostItemBreakdown } from './CostItemBreakdown'

interface SimplifiedProjectCostViewProps {
  projectId: string
  tenderId?: string
}

export const SimplifiedProjectCostView: React.FC<SimplifiedProjectCostViewProps> = ({
  projectId,
  tenderId,
}) => {
  const { items = [] } = useBOQ({ projectId, tenderId })
  const boqRepository = useRepository(getBOQRepository)
  const { formatCurrencyValue } = useCurrencyFormatter()

  const [isLoading, setIsLoading] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editedItems, setEditedItems] = useState<
    Map<string, { quantity?: number; unitPrice?: number; totalPrice?: number }>
  >(new Map())
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (items.length >= 0) {
      setIsLoading(false)
    }
  }, [items])

  useEffect(() => {
    console.log('📦 [SimplifiedProjectCostView] Loaded:', {
      count: items.length,
      projectId,
      tenderId,
      sample: items[0],
      allItems: items,
    })
    if (items.length > 0) {
      // Check estimated data structure
      items.forEach((item, idx) => {
        console.log(`📊 [Item ${idx + 1}] ${item.description}:`, {
          hasEstimated: !!item.estimated,
          estimatedStructure: item.estimated
            ? {
                hasMaterials: !!item.estimated.materials,
                materialsCount: item.estimated.materials?.length || 0,
                hasLabor: !!item.estimated.labor,
                laborCount: item.estimated.labor?.length || 0,
                hasEquipment: !!item.estimated.equipment,
                equipmentCount: item.estimated.equipment?.length || 0,
                hasSubcontractors: !!item.estimated.subcontractors,
                subcontractorsCount: item.estimated.subcontractors?.length || 0,
                additionalPercentages: item.estimated.additionalPercentages,
              }
            : null,
          rawEstimated: item.estimated,
        })
      })

      console.log('🔍 [SimplifiedProjectCostView] First item details:', {
        id: items[0].id,
        description: items[0].description,
        canonicalDescription: items[0].canonicalDescription,
        unit: items[0].unit,
        category: items[0].category,
        estimated: items[0].estimated,
        estimatedQuantity: items[0].estimatedQuantity,
        estimatedUnitPrice: items[0].estimatedUnitPrice,
        estimatedTotal: items[0].estimatedTotal,
        actual: items[0].actual,
        actualQuantity: items[0].actualQuantity,
        actualUnitPrice: items[0].actualUnitPrice,
        actualTotal: items[0].actualTotal,
        allKeys: Object.keys(items[0]),
      })
    }
  }, [items, projectId, tenderId])

  const toggleExpand = React.useCallback((itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }, [])

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }, [])

  const handleImportFromTender = useCallback(async () => {
    if (!tenderId) {
      showMessage('error', 'لا يوجد معرف منافسة مرتبط بهذا المشروع')
      return
    }

    setIsImporting(true)
    try {
      console.log('� [Import] استيراد BOQ من المنافسة:', tenderId)

      // ✅ نسخ BOQ من المنافسة مباشرة إلى المشروع
      const tenderBOQ = await boqRepository.getByTenderId(tenderId)

      if (!tenderBOQ || !tenderBOQ.items || tenderBOQ.items.length === 0) {
        showMessage(
          'error',
          'لا يوجد جدول كميات في المنافسة. يرجى فتح صفحة تسعير المنافسة أولاً وحفظ التسعير.',
        )
        return
      }

      console.log('📋 [Import] عدد البنود في BOQ المنافسة:', tenderBOQ.items.length)
      console.log('📋 [Import] عينة من البند الأول:', {
        id: tenderBOQ.items[0].id,
        description: tenderBOQ.items[0].description,
        hasMaterials: tenderBOQ.items[0].estimated?.materials?.length || 0,
        hasLabor: tenderBOQ.items[0].estimated?.labor?.length || 0,
        hasEquipment: tenderBOQ.items[0].estimated?.equipment?.length || 0,
      })

      // ✅ تحقق من وجود تفاصيل التكلفة
      const hasBreakdownData = tenderBOQ.items.some(
        (item) =>
          (item.estimated?.materials && item.estimated.materials.length > 0) ||
          (item.estimated?.labor && item.estimated.labor.length > 0) ||
          (item.estimated?.equipment && item.estimated.equipment.length > 0) ||
          (item.estimated?.subcontractors && item.estimated.subcontractors.length > 0),
      )

      if (!hasBreakdownData) {
        showMessage(
          'error',
          '⚠️ BOQ المنافسة لا يحتوي على تفاصيل التكلفة (مواد، عمالة، معدات). يرجى:\n1. فتح صفحة تسعير المنافسة\n2. إدخال تفاصيل التسعير لكل بند\n3. حفظ التسعير\n4. العودة هنا والمحاولة مرة أخرى',
        )
        return
      }

      // ✅ نسخ BOQ إلى المشروع
      await boqRepository.createOrUpdate({
        id: `boq_project_${projectId}`,
        projectId,
        tenderId,
        items: tenderBOQ.items.map((item) => ({
          ...item,
          id: `${projectId}_${item.id}`,
          originalId: item.id,
        })),
        totalValue: tenderBOQ.totalValue,
        lastUpdated: new Date().toISOString(),
      })

      showMessage('success', `✅ تم استيراد ${tenderBOQ.items.length} بند بنجاح من المنافسة`)
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      console.error('❌ Import error:', error)
      showMessage(
        'error',
        `فشل الاستيراد: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`,
      )
    } finally {
      setIsImporting(false)
    }
  }, [tenderId, projectId, boqRepository, showMessage])

  const handleActualChange = useCallback(
    (itemId: string, field: 'quantity' | 'unitPrice', value: string) => {
      const numValue = parseFloat(value) || 0

      setEditedItems((prev) => {
        const newMap = new Map(prev)
        const current = newMap.get(itemId) || {}

        const newData = {
          ...current,
          [field]: numValue,
        }

        if (field === 'quantity') {
          newData.totalPrice = numValue * (current.unitPrice || 0)
        } else {
          newData.totalPrice = (current.quantity || 0) * numValue
        }

        newMap.set(itemId, newData)
        return newMap
      })
    },
    [],
  )

  const handleSaveChanges = useCallback(async () => {
    if (editedItems.size === 0) {
      showMessage('error', 'لا توجد تعديلات للحفظ')
      return
    }

    setIsSaving(true)
    try {
      const currentBOQ = await boqRepository.getByProjectId(projectId)

      if (!currentBOQ) {
        showMessage('error', 'لم يتم العثور على جدول الكميات')
        return
      }

      const updatedItems = currentBOQ.items.map((item: BOQItem) => {
        const edits = editedItems.get(item.id)
        if (edits) {
          return {
            ...item,
            actual: {
              ...item.actual,
              quantity: edits.quantity ?? item.actual?.quantity ?? 0,
              unitPrice: edits.unitPrice ?? item.actual?.unitPrice ?? 0,
              totalPrice: edits.totalPrice ?? item.actual?.totalPrice ?? 0,
            },
          }
        }
        return item
      })

      const totalValue = updatedItems.reduce((sum, item) => {
        return sum + (item.actual?.totalPrice || item.estimated?.totalPrice || 0)
      }, 0)

      await boqRepository.createOrUpdate({
        ...currentBOQ,
        items: updatedItems,
        totalValue,
        lastUpdated: new Date().toISOString(),
      })

      setEditedItems(new Map())
      showMessage('success', `تم حفظ ${editedItems.size} تعديل بنجاح`)
    } catch (error) {
      console.error('❌ Save error:', error)
      showMessage('error', 'فشل الحفظ، حاول مرة أخرى')
    } finally {
      setIsSaving(false)
    }
  }, [editedItems, projectId, boqRepository, showMessage])

  const handleDeleteItem = useCallback(
    async (itemId: string) => {
      if (!confirm('هل أنت متأكد من حذف هذا البند؟')) return

      try {
        const currentBOQ = await boqRepository.getByProjectId(projectId)
        if (!currentBOQ) return

        const updatedItems = currentBOQ.items.filter((item: BOQItem) => item.id !== itemId)
        const totalValue = updatedItems.reduce((sum, item) => {
          return sum + (item.actual?.totalPrice || item.estimated?.totalPrice || 0)
        }, 0)

        await boqRepository.createOrUpdate({
          ...currentBOQ,
          items: updatedItems,
          totalValue,
          lastUpdated: new Date().toISOString(),
        })

        showMessage('success', 'تم حذف البند')
        setTimeout(() => window.location.reload(), 1000)
      } catch (error) {
        console.error('❌ Delete error:', error)
        showMessage('error', 'فشل الحذف')
      }
    },
    [projectId, boqRepository, showMessage],
  )

  const totals = React.useMemo(() => {
    let estimatedTotal = 0
    let actualTotal = 0

    items.forEach((item) => {
      const edits = editedItems.get(item.id)

      estimatedTotal += item.estimated?.totalPrice || item.estimatedTotal || 0
      actualTotal += edits?.totalPrice || item.actualTotal || 0
    })

    const variance = actualTotal - estimatedTotal
    const variancePercent = estimatedTotal > 0 ? (variance / estimatedTotal) * 100 : 0

    return { estimatedTotal, actualTotal, variance, variancePercent }
  }, [items, editedItems])

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">جاري تحميل بيانات التكاليف...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {message && (
        <div
          className={`rounded-lg border p-4 ${
            message.type === 'success'
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">بنود التكلفة</h1>
            <p className="text-sm text-muted-foreground">
              إدارة التكاليف التقديرية والفعلية للمشروع
            </p>
          </div>
          <div className="flex items-center gap-2">
            {tenderId && (
              <button
                onClick={handleRebuildBOQ}
                disabled={isImporting}
                className="flex items-center gap-2 rounded-lg bg-info px-4 py-2 text-sm text-info-foreground hover:bg-info/90 disabled:opacity-50"
                title="إعادة بناء جدول الكميات من المنافسة (يصلح مشكلة الأوصاف المفقودة)"
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                {isImporting ? 'جاري إعادة البناء...' : 'إعادة بناء من المنافسة'}
              </button>
            )}
            {editedItems.size > 0 && (
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Calculator className="h-4 w-4" />
                )}
                {isSaving ? 'جاري الحفظ...' : `حفظ التعديلات (${editedItems.size})`}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-info/30 bg-info/10 p-4 text-center">
            <p className="text-sm text-info">الإجمالي التقديري</p>
            <p className="text-2xl font-bold text-info">
              {formatCurrencyValue(totals.estimatedTotal)}
            </p>
          </div>
          <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-center">
            <p className="text-sm text-success">الإجمالي الفعلي</p>
            <p className="text-2xl font-bold text-success">
              {formatCurrencyValue(totals.actualTotal)}
            </p>
          </div>
          <div
            className={`rounded-lg border p-4 text-center ${totals.variance > 0 ? 'border-destructive/30 bg-destructive/10' : 'border-success/30 bg-success/10'}`}
          >
            <p className={`text-sm ${totals.variance > 0 ? 'text-destructive' : 'text-success'}`}>
              الفارق
            </p>
            <p
              className={`text-2xl font-bold ${totals.variance > 0 ? 'text-destructive' : 'text-success'}`}
            >
              {totals.variance > 0 ? '+' : ''}
              {formatCurrencyValue(totals.variance)}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-4 text-center">
            <p className="text-sm text-muted-foreground">نسبة الفارق</p>
            <p
              className={`text-2xl font-bold ${Math.abs(totals.variancePercent) > 10 ? 'text-destructive' : 'text-foreground'}`}
            >
              {totals.variancePercent > 0 ? '+' : ''}
              {totals.variancePercent.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">لا توجد بنود تكلفة</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {tenderId
              ? 'استخدم زر "استيراد من المنافسة" لجلب البنود'
              : 'لم يتم العثور على بنود تكلفة لهذا المشروع'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="border-b">
                  <th className="px-2 py-3 text-center font-semibold w-12"></th>
                  <th className="px-4 py-3 text-right font-semibold">#</th>
                  <th className="px-4 py-3 text-right font-semibold">الوصف</th>
                  <th className="px-4 py-3 text-center font-semibold">الوحدة</th>
                  <th className="px-4 py-3 text-center font-semibold">الكمية التقديرية</th>
                  <th className="px-4 py-3 text-center font-semibold">السعر التقديري</th>
                  <th className="px-4 py-3 text-center font-semibold">الإجمالي التقديري</th>
                  <th className="px-4 py-3 text-center font-semibold bg-success/10">
                    الكمية الفعلية
                  </th>
                  <th className="px-4 py-3 text-center font-semibold bg-success/10">
                    السعر الفعلي
                  </th>
                  <th className="px-4 py-3 text-center font-semibold bg-success/10">
                    الإجمالي الفعلي
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">الفارق</th>
                  <th className="px-4 py-3 text-center font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index: number) => {
                  const edits = editedItems.get(item.id)
                  const estimatedQty = item.estimated?.quantity || item.estimatedQuantity || 0
                  const estimatedPrice = item.estimated?.unitPrice || item.estimatedUnitPrice || 0
                  const estimatedTotal =
                    item.estimated?.totalPrice ||
                    item.estimatedTotal ||
                    estimatedQty * estimatedPrice

                  const actualQty = edits?.quantity ?? item.actualQuantity ?? 0
                  const actualPrice = edits?.unitPrice ?? item.actualUnitPrice ?? 0
                  const actualTotal =
                    edits?.totalPrice ?? item.actualTotal ?? actualQty * actualPrice

                  const variance = actualTotal - estimatedTotal
                  const isEdited = editedItems.has(item.id)
                  const isExpanded = expandedItems.has(item.id)

                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        className={`border-b hover:bg-muted/20 ${isEdited ? 'bg-primary/5' : ''}`}
                      >
                        <td className="px-2 py-3 text-center">
                          <button
                            onClick={() => toggleExpand(item.id)}
                            className="rounded p-1 hover:bg-muted/40 transition-colors"
                            title={isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center font-medium">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {item.canonicalDescription || item.description || 'بدون وصف'}
                          </div>
                          {item.category && (
                            <div className="text-xs text-muted-foreground">{item.category}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">{item.unit || '-'}</td>
                        <td className="px-4 py-3 text-center">{estimatedQty.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          {formatCurrencyValue(estimatedPrice)}
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-info">
                          {formatCurrencyValue(estimatedTotal)}
                        </td>
                        <td className="px-4 py-3 text-center bg-success/5">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={actualQty}
                            onBlur={(e) => handleActualChange(item.id, 'quantity', e.target.value)}
                            className="w-24 rounded border border-input bg-background px-2 py-1 text-center focus:border-success focus:outline-none focus:ring-1 focus:ring-success"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="px-4 py-3 text-center bg-success/5">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={actualPrice}
                            onBlur={(e) => handleActualChange(item.id, 'unitPrice', e.target.value)}
                            className="w-24 rounded border border-input bg-background px-2 py-1 text-center focus:border-success focus:outline-none focus:ring-1 focus:ring-success"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-success bg-success/5">
                          {formatCurrencyValue(actualTotal)}
                        </td>
                        <td
                          className={`px-4 py-3 text-center font-medium ${variance > 0 ? 'text-destructive' : variance < 0 ? 'text-success' : 'text-muted-foreground'}`}
                        >
                          {variance > 0 ? '+' : ''}
                          {formatCurrencyValue(variance)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="inline-flex items-center justify-center rounded p-1 hover:bg-destructive/10 hover:text-destructive"
                            title="حذف البند"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>

                      {/* Breakdown details when expanded - using separate component */}
                      <CostItemBreakdown item={item} isExpanded={isExpanded} />
                    </React.Fragment>
                  )
                })}
              </tbody>
              <tfoot className="bg-muted/20 font-semibold">
                <tr className="border-t-2">
                  <td></td>
                  <td colSpan={5} className="px-4 py-3 text-right">
                    الإجمالي
                  </td>
                  <td className="px-4 py-3 text-center text-info">
                    {formatCurrencyValue(totals.estimatedTotal)}
                  </td>
                  <td colSpan={2} className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-center text-success">
                    {formatCurrencyValue(totals.actualTotal)}
                  </td>
                  <td
                    className={`px-4 py-3 text-center ${totals.variance > 0 ? 'text-destructive' : 'text-success'}`}
                  >
                    {totals.variance > 0 ? '+' : ''}
                    {formatCurrencyValue(totals.variance)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="rounded-lg border border-dashed border-muted bg-muted/10 p-4">
          <p className="text-sm text-muted-foreground">
            💡 <strong>تعليمات:</strong> أدخل الكميات والأسعار الفعلية في الخانات الخضراء، ثم اضغط
            على &quot;حفظ التعديلات&quot; لحفظ التغييرات. سيتم حساب الإجمالي والفارق تلقائياً.
          </p>
        </div>
      )}
    </div>
  )
}

export default SimplifiedProjectCostView
