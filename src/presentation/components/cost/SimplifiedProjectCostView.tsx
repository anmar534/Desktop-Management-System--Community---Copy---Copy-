import React, { useState, useMemo, useEffect } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  ChevronDown,
  ChevronUp,
  Grid3X3,
  Calculator,
  FileText,
  Settings,
  Plus,
  ExternalLink,
  AlertTriangle,
  Trash2,
  ShoppingCart,
  Save,
  MoreHorizontal,
  Loader2,
} from 'lucide-react'
import { useProjectBOQ } from '@/application/hooks/useProjectBOQ'
import { projectCostService } from '@/application/services/projectCostService'
import type {
  ProjectCostItem,
  CostBreakdownSet,
  BreakdownRow,
} from '@/application/services/projectCostService'
import { DeleteConfirmation, SaveConfirmation } from '../ui/confirmation-dialog'
import { useCurrencyFormatter } from '@/application/hooks/useCurrencyFormatter'
import { EmptyState } from '@/presentation/components/layout/PageLayout'

interface SimplifiedProjectCostViewProps {
  projectId: string
  tenderId?: string
}

export const SimplifiedProjectCostView: React.FC<SimplifiedProjectCostViewProps> = ({
  projectId,
  tenderId,
}) => {
  const { draft, loading, refresh, mergeFromTender, ensure } = useProjectBOQ(projectId)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [expandedBreakdownSections, setExpandedBreakdownSections] = useState<Set<string>>(new Set())
  const [actionMessage, setActionMessage] = useState<string>('')
  const [forceUpdateKey, setForceUpdateKey] = useState(0)
  const [isImporting, setIsImporting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    console.log('🧭 [SimplifiedProjectCostView] tenderId prop:', tenderId ?? '<none>')
  }, [tenderId])

  const items = useMemo<ProjectCostItem[]>(() => draft?.items ?? [], [draft?.items])
  const defaultPercentages: Readonly<Record<'administrative' | 'operational' | 'profit', number>> =
    {
      administrative: 5,
      operational: 3,
      profit: 10,
    }
  useEffect(() => {
    if (!items.length) return
    setExpandedItems((prev) => {
      if (prev.size > 0) return prev
      const next = new Set(prev)
      next.add(items[0].id)
      return next
    })
  }, [items])

  const severityMap = useMemo(() => {
    const map: Record<string, string> = {}
    return map
  }, [])

  const { formatCurrencyValue, baseCurrency } = useCurrencyFormatter()

  const formatCurrency = (
    value: number | undefined | null,
    options?: Parameters<typeof formatCurrencyValue>[1],
  ) => {
    return formatCurrencyValue(value ?? 0, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    })
  }

  const formatDecimal = (value: number | undefined | null, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    }).format(value ?? 0)
  }

  const formatInteger = (value: number | undefined | null) => {
    return new Intl.NumberFormat('ar-SA').format(value ?? 0)
  }

  interface LegacyProjectCostItem extends ProjectCostItem {
    actualQuantity?: number
    actualUnitPrice?: number
    unitPrice?: number
    totalPrice?: number
  }

  type ActionButtonTone = 'primary' | 'warning' | 'success' | 'danger' | 'neutral'

  const actionToneStyles: Record<ActionButtonTone, string> = {
    primary: 'border-info/30 text-info hover:bg-info/10 hover:text-info',
    warning: 'border-warning/30 text-warning hover:bg-warning/10 hover:text-warning',
    success: 'border-success/30 text-success hover:bg-success/10 hover:text-success',
    danger: 'border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive',
    neutral: 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
  }

  interface ActionRoundButtonProps {
    icon: LucideIcon
    label: string
    tone: ActionButtonTone
    onClick?: () => void
    tooltip: string
    disabled?: boolean
  }

  const ActionRoundButton = React.forwardRef<HTMLButtonElement, ActionRoundButtonProps>(
    ({ icon: Icon, label, tone, onClick, tooltip, disabled }, ref) => (
      <button
        ref={ref}
        type="button"
        className={`inline-flex items-center justify-center w-9 h-9 rounded-full border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${actionToneStyles[tone]} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        title={tooltip}
        aria-label={label}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
      >
        <Icon className="w-4 h-4" />
      </button>
    ),
  )
  ActionRoundButton.displayName = 'ActionRoundButton'

  const sumRows = (rows: readonly BreakdownRow[] | undefined): number => {
    if (!rows?.length) {
      return 0
    }
    return rows.reduce((sum, row) => {
      const total = row.totalCost ?? row.quantity * row.unitCost
      return sum + (Number.isFinite(total) ? total : 0)
    }, 0)
  }

  const parseNumericInput = (input: string): number => {
    const parsed = Number.parseFloat(input)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const resolveRowId = (row: BreakdownRow, fallbackPrefix: string, index: number): string => {
    const rawId = typeof row.id === 'string' ? row.id.trim() : ''
    if (rawId.length > 0) {
      return rawId
    }
    const fallbackName = typeof row.name === 'string' ? row.name.trim() : 'row'
    const safeName = fallbackName.length > 0 ? fallbackName : 'row'
    return `${fallbackPrefix}-${index}-${safeName}`
  }

  // التحقق من تطابق الحسابات بين جدول التكاليف وجدول البنود
  const validateCalculationConsistency = (item: ProjectCostItem): boolean => {
    const breakdown = item.actual?.breakdown
    if (!breakdown) return true

    const calculatedBase =
      sumRows(breakdown.materials) +
      sumRows(breakdown.labor) +
      sumRows(breakdown.equipment) +
      sumRows(breakdown.subcontractors)

    const admin = calculatedBase * ((item.actual?.additionalPercentages?.administrative ?? 0) / 100)
    const operational =
      calculatedBase * ((item.actual?.additionalPercentages?.operational ?? 0) / 100)
    const profit = calculatedBase * ((item.actual?.additionalPercentages?.profit ?? 0) / 100)
    const calculatedTotal = calculatedBase + admin + operational + profit

    const currentTotal = item.actual?.totalPrice ?? 0
    const tolerance = 0.01 // هامش خطأ مقبول

    return Math.abs(calculatedTotal - currentTotal) <= tolerance
  }

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const toggleBreakdownSection = (itemId: string, section: string) => {
    const key = `${itemId}:${section}`
    setExpandedBreakdownSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const handleRecalculateItemFromBreakdown = (itemId: string) => {
    console.log(
      `🚀 [بدء إعادة الحساب] تم استدعاء handleRecalculateItemFromBreakdown للبند: ${itemId}`,
    )
    try {
      projectCostService.saveDraft(projectId, (draft) => {
        const item = draft.items.find((i) => i.id === itemId)
        if (!item) return

        const breakdown = item.actual?.breakdown
        if (!breakdown) {
          console.log(`⚠️ [${itemId}] لا يوجد تحليل تكلفة فعلي لإعادة الحساب.`)
          return
        }

        const materialsTotal = sumRows(breakdown.materials)
        const laborTotal = sumRows(breakdown.labor)
        const equipmentTotal = sumRows(breakdown.equipment)
        const subcontractorsTotal = sumRows(breakdown.subcontractors)
        const base = materialsTotal + laborTotal + equipmentTotal + subcontractorsTotal

        console.log(`🔍 [تحليل البند] ${itemId}:`, {
          materials: materialsTotal,
          labor: laborTotal,
          equipment: equipmentTotal,
          subcontractors: subcontractorsTotal,
          base,
          hasBreakdownData: base > 0,
          breakdownStructure: {
            materials: breakdown.materials.length,
            labor: breakdown.labor.length,
            equipment: breakdown.equipment.length,
            subcontractors: breakdown.subcontractors.length,
          },
        })

        if (base > 0) {
          const administrativePct =
            item.actual.additionalPercentages?.administrative ?? defaultPercentages.administrative
          const operationalPct =
            item.actual.additionalPercentages?.operational ?? defaultPercentages.operational
          const profitPct = item.actual.additionalPercentages?.profit ?? defaultPercentages.profit

          const admin = base * (administrativePct / 100)
          const operational = base * (operationalPct / 100)
          const profit = base * (profitPct / 100)
          const total = base + admin + operational + profit

          // تطبيق نفس معادلة التسعير المستخدمة في المناقصات - التأكد من أن الكمية أكبر من صفر
          const normalizedQuantity =
            item.actual.quantity && item.actual.quantity > 0 ? item.actual.quantity : 1
          item.actual.quantity = normalizedQuantity

          // حساب سعر الوحدة = المجموع الكلي ÷ الكمية
          const calculatedUnitPrice = +(total / normalizedQuantity).toFixed(4)
          const calculatedTotalPrice = +total.toFixed(2)

          console.log(`🧮 [المعادلة] حساب البند ${itemId}:`, {
            total: total.toFixed(2),
            quantity: normalizedQuantity,
            unitPriceCalculation: `${total.toFixed(2)} ÷ ${normalizedQuantity} = ${calculatedUnitPrice}`,
            oldUnitPrice: item.actual.unitPrice,
            newUnitPrice: calculatedUnitPrice,
          })

          item.actual.unitPrice = calculatedUnitPrice
          item.actual.totalPrice = calculatedTotalPrice

          const legacyItem = item as LegacyProjectCostItem
          legacyItem.actualQuantity = normalizedQuantity
          legacyItem.actualUnitPrice = calculatedUnitPrice
          legacyItem.unitPrice = calculatedUnitPrice
          legacyItem.totalPrice = calculatedTotalPrice

          console.log(`✅ تم تحديث البند ${itemId}:`, {
            base: base.toFixed(2),
            admin: admin.toFixed(2),
            operational: operational.toFixed(2),
            profit: profit.toFixed(2),
            total: total.toFixed(2),
            quantity: normalizedQuantity,
            calculatedUnitPrice: calculatedUnitPrice,
            calculatedTotalPrice: calculatedTotalPrice,
            savedUnitPrice: item.actual.unitPrice,
            savedTotalPrice: item.actual.totalPrice,
            mainTableUnitPrice: legacyItem.unitPrice,
            mainTableTotalPrice: legacyItem.totalPrice,
          })
        } else {
          console.log(
            `⚠️ [البند ${itemId}] لا يحتوي على بيانات تكلفة في التحليل (base = 0) - تخطي إعادة الحساب`,
          )
          console.log(`   للبند "${item.description?.substring(0, 50)}..."`)
          console.log(`   تحقق من وجود بيانات في: المواد، العمالة، المعدات، أو المقاولين من الباطن`)
        }

        // Clear the pending sync flag
        item.state = { ...item.state, isModified: true, breakdownDirty: false }
      })

      // Force a refresh to update the UI
      console.log('🔄 [SimplifiedProjectCostView] استدعاء refresh() بعد الحفظ...')

      // فحص البيانات مباشرة من المخزن
      const updatedEnvelope = projectCostService.getEnvelope(projectId)
      const updatedItem = updatedEnvelope?.draft?.items?.find(
        (draftItem) => draftItem.id === itemId,
      )
      console.log('📊 [SimplifiedProjectCostView] البيانات المحدثة في المخزن:', {
        itemId,
        updatedUnitPrice: updatedItem?.actual.unitPrice,
        updatedTotalPrice: updatedItem?.actual.totalPrice,
        draftItemsCount: updatedEnvelope?.draft?.items.length,
      })

      refresh()

      // فرض إعادة rendering للمكون
      setForceUpdateKey((prev) => prev + 1)

      // إضافة تأخير قصير للتأكد من تحديث الواجهة
      setTimeout(() => {
        console.log('🔄 [SimplifiedProjectCostView] استدعاء refresh() إضافي للتأكد...')
        refresh()
        setForceUpdateKey((prev) => prev + 1)
      }, 100)

      setActionMessage('تم تحديث سعر البند بناءً على التحليل.')
      setTimeout(() => setActionMessage(''), 4000)
    } catch (error) {
      console.error('Error saving item:', error)
      setActionMessage('❌ حدث خطأ أثناء حفظ البيانات')
      setTimeout(() => setActionMessage(''), 4000)
    }
  }

  type BreakdownEditableField = 'name' | 'unit' | 'quantity' | 'unitCost'

  const handleBreakdownRowChange = (
    itemId: string,
    section: keyof CostBreakdownSet,
    rowId: string,
    field: BreakdownEditableField,
    value: string,
  ) => {
    projectCostService.saveDraft(projectId, (draft) => {
      const item = draft.items.find((i) => i.id === itemId)
      if (!item) return

      const rows = item.actual.breakdown[section]
      let row = rows.find((r) => r.id === rowId)

      if (!row) {
        row = {
          id: rowId,
          name: 'عنصر جديد',
          quantity: 0,
          unitCost: 0,
          totalCost: 0,
          origin: 'actual-only',
        }
        rows.push(row)
      }

      if (field === 'quantity' || field === 'unitCost') {
        const numericValue = parseNumericInput(value)
        if (field === 'quantity') {
          row.quantity = numericValue
        } else {
          row.unitCost = numericValue
        }
        row.totalCost = +(row.quantity * row.unitCost).toFixed(2)

        // تحديث فوري لحالة البند وتفعيل تسجيل التغيير
        item.state = { ...item.state, isModified: true, breakdownDirty: true }

        // إعطاء تغذية راجعة فورية للمستخدم
        console.log(`📝 تم تحديث ${section} - ${field}: ${value} للبند ${itemId}`)
      } else if (field === 'name') {
        row.name = value
        item.state = { ...item.state, isModified: true, breakdownDirty: true }
      } else if (field === 'unit') {
        row.unit = value
        item.state = { ...item.state, isModified: true, breakdownDirty: true }
      }
    })

    // تحديث الواجهة فوراً لإظهار التغييرات
    refresh()
  }

  const handleImportFromTender = async () => {
    console.log('▶️ [SimplifiedProjectCostView] Import button clicked:', {
      tenderId: tenderId ?? null,
      isImporting,
    })

    if (!tenderId || isImporting) {
      if (!tenderId) {
        console.warn('⛔ [SimplifiedProjectCostView] Import blocked: no tenderId provided')
      }
      if (isImporting) {
        console.warn('⏳ [SimplifiedProjectCostView] Import already in progress')
      }
      return
    }

    console.info('▶️ [SimplifiedProjectCostView] Import requested for tender:', tenderId)
    setIsImporting(true)
    setActionMessage('')
    setErrorMessage(null)

    try {
      ensure()
      const result = await mergeFromTender(tenderId)
      refresh()
      setForceUpdateKey((prev) => prev + 1)

      const summaryParts: string[] = []
      if (result?.added) {
        summaryParts.push(`${result.added} بند جديد`)
      }
      if (result?.updated) {
        summaryParts.push(`${result.updated} بند محدث`)
      }
      if (result?.conflicted) {
        summaryParts.push(`${result.conflicted} بند بحاجة للمراجعة`)
      }
      const summary =
        summaryParts.length > 0
          ? `تم استيراد بنود التكلفة من المنافسة (${summaryParts.join('، ')}).`
          : 'تم تحديث بنود التكلفة من المنافسة.'

      setActionMessage(summary)
      setTimeout(() => setActionMessage(''), 6000)
    } catch (error) {
      console.error('❌ [SimplifiedProjectCostView] Failed to import from tender:', error)
      setErrorMessage('تعذر استيراد البنود من المنافسة. حاول مرة أخرى.')
      setTimeout(() => setErrorMessage(null), 6000)
    } finally {
      setIsImporting(false)
    }
  }

  type PercentageKey = 'administrative' | 'operational' | 'profit'

  const handlePercentagesChange = (itemId: string, type: PercentageKey, value: string) => {
    projectCostService.saveDraft(projectId, (draft) => {
      const item = draft.items.find((i) => i.id === itemId)
      if (!item) return

      const numericValue = parseNumericInput(value)
      item.actual.additionalPercentages = {
        ...item.actual.additionalPercentages,
        [type]: numericValue,
      }
      item.state = { ...item.state, isModified: true, breakdownDirty: true }
    })
  }

  const handleAddBreakdownRow = (itemId: string, section: keyof CostBreakdownSet) => {
    const rowId = `new-${Date.now()}`
    handleBreakdownRowChange(itemId, section, rowId, 'name', `عنصر جديد ${Date.now()}`)
  }

  const handleDeleteBreakdownRow = (
    itemId: string,
    section: keyof CostBreakdownSet,
    rowId: string,
  ) => {
    projectCostService.saveDraft(projectId, (draft) => {
      const item = draft.items.find((i) => i.id === itemId)
      if (!item) return

      const rows = item.actual.breakdown[section]
      const index = rows.findIndex((r) => r.id === rowId)

      if (index >= 0) {
        rows.splice(index, 1)
        item.state = { ...item.state, isModified: true, breakdownDirty: true }
      }
    })
  }

  const handleIssuePurchaseOrder = (itemId: string) => {
    // Implementation for purchase order
    console.log('Issue purchase order for item:', itemId)
  }

  const handleDeleteItem = (itemId: string) => {
    const itemName = items.find((item) => item.id === itemId)?.description ?? 'البند'
    projectCostService.saveDraft(projectId, (draft) => {
      draft.items = draft.items.filter((i) => i.id !== itemId)
    })
    refresh()
    setActionMessage(`❌ تم حذف "${itemName}" وجميع بياناته بنجاح`)
    setTimeout(() => setActionMessage(''), 4000)
  }

  const renderPricingSummary = () => {
    const totals = draft?.totals ?? {
      estimatedTotal: 0,
      actualTotal: 0,
      varianceTotal: 0,
      variancePct: 0,
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-lg border border-info/30 bg-info/10 p-4">
          <div className="mb-1 text-sm text-info">التكلفة التقديرية</div>
          <div className="text-2xl font-bold text-info">
            {formatCurrency(totals.estimatedTotal)}
          </div>
        </div>
        <div className="rounded-lg border border-success/30 bg-success/10 p-4">
          <div className="mb-1 text-sm text-success">التكلفة الفعلية</div>
          <div className="text-2xl font-bold text-success">
            {formatCurrency(totals.actualTotal)}
          </div>
        </div>
        <div
          className={`rounded-lg border p-4 ${
            totals.varianceTotal >= 0
              ? 'border-destructive/20 bg-destructive/10'
              : 'border-success/20 bg-success/10'
          }`}
        >
          <div
            className={`mb-1 text-sm ${
              totals.varianceTotal >= 0 ? 'text-destructive' : 'text-success'
            }`}
          >
            فارق التكلفة
          </div>
          <div
            className={`text-2xl font-bold ${
              totals.varianceTotal >= 0 ? 'text-destructive' : 'text-success'
            }`}
          >
            {formatCurrency(Math.abs(totals.varianceTotal))}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-muted p-4">
          <div className="mb-1 text-sm text-muted-foreground">نسبة الفارق</div>
          <div
            className={`text-2xl font-bold ${
              totals.variancePct >= 0 ? 'text-destructive' : 'text-success'
            }`}
          >
            {totals.variancePct.toFixed(1)}%
          </div>
        </div>
      </div>
    )
  }

  const renderBreakdownAnalysis = (item: ProjectCostItem) => {
    const sections: {
      key: keyof CostBreakdownSet
      label: string
      dotClass: string
      badgeClass: string
    }[] = [
      {
        key: 'materials',
        label: 'المواد',
        dotClass: 'bg-warning',
        badgeClass: 'bg-warning/10 text-warning',
      },
      { key: 'labor', label: 'العمالة', dotClass: 'bg-info', badgeClass: 'bg-info/10 text-info' },
      {
        key: 'equipment',
        label: 'المعدات',
        dotClass: 'bg-success',
        badgeClass: 'bg-success/10 text-success',
      },
      {
        key: 'subcontractors',
        label: 'مقاولو الباطن',
        dotClass: 'bg-accent',
        badgeClass: 'bg-accent/20 text-accent-foreground',
      },
    ]

    const hasPendingSync = Boolean(item.state?.breakdownDirty)
    const breakdown = item.actual.breakdown
    const baseAmount =
      sumRows(breakdown.materials) +
      sumRows(breakdown.labor) +
      sumRows(breakdown.equipment) +
      sumRows(breakdown.subcontractors)

    const administrativePercent =
      item.actual.additionalPercentages?.administrative ?? defaultPercentages.administrative
    const operationalPercent =
      item.actual.additionalPercentages?.operational ?? defaultPercentages.operational
    const profitPercent = item.actual.additionalPercentages?.profit ?? defaultPercentages.profit

    const administrativeAmount = baseAmount * (administrativePercent / 100)
    const operationalAmount = baseAmount * (operationalPercent / 100)
    const profitAmount = baseAmount * (profitPercent / 100)

    const subtotalWithoutVAT = baseAmount + administrativeAmount + operationalAmount + profitAmount
    const vatAmount = subtotalWithoutVAT * 0.15
    const totalWithVAT = subtotalWithoutVAT + vatAmount
    const unitPrice = item.actual.quantity > 0 ? subtotalWithoutVAT / item.actual.quantity : 0

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            <div className="rounded-md border border-border bg-card p-3 text-center">
              <div className="mb-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <span>التكلفة الأساسية</span>
                {validateCalculationConsistency(item) ? (
                  <span
                    className="rounded bg-success/10 px-1 text-xs text-success"
                    title="الحسابات متطابقة"
                  >
                    ✓
                  </span>
                ) : (
                  <span
                    className="rounded bg-warning/10 px-1 text-xs text-warning"
                    title="يحتاج إعادة حساب"
                  >
                    ⚠
                  </span>
                )}
              </div>
              <div className="text-lg font-bold text-foreground">{formatCurrency(baseAmount)}</div>
              <div className="text-xs text-muted-foreground">{baseCurrency}</div>
            </div>

            <div className="rounded-md border border-info/30 bg-info/10 p-3 text-center">
              <div className="mb-1 text-xs font-medium text-info">التكاليف الإدارية</div>
              <div className="mb-1 inline-block rounded-full border border-info/40 px-2 py-0.5 text-xs font-bold text-info">
                {administrativePercent.toFixed(1)}%
              </div>
              <div className="text-lg font-bold text-info">
                {formatCurrency(administrativeAmount)}
              </div>
              <div className="text-xs text-info">{baseCurrency}</div>
            </div>

            <div className="rounded-md border border-success/30 bg-success/10 p-3 text-center">
              <div className="mb-1 text-xs font-medium text-success">التكاليف التشغيلية</div>
              <div className="mb-1 inline-block rounded-full border border-success/40 px-2 py-0.5 text-xs font-bold text-success">
                {operationalPercent.toFixed(1)}%
              </div>
              <div className="text-lg font-bold text-success">
                {formatCurrency(operationalAmount)}
              </div>
              <div className="text-xs text-success">{baseCurrency}</div>
            </div>

            <div className="rounded-md border border-primary/30 bg-primary/10 p-3 text-center">
              <div className="mb-1 text-xs font-medium text-primary">إجمالي الربح</div>
              <div className="mb-1 inline-block rounded-full border border-primary/40 px-2 py-0.5 text-xs font-bold text-primary">
                {profitPercent.toFixed(1)}%
              </div>
              <div className="text-xl font-bold text-primary">{formatCurrency(profitAmount)}</div>
              <div className="mt-1 text-xs text-primary">{baseCurrency}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-center">
              <div className="mb-1 text-xs font-medium text-warning">قيمة الضريبة</div>
              <div className="mb-1 inline-block rounded-full border border-warning/40 px-2 py-0.5 text-xs font-bold text-warning">
                15%
              </div>
              <div className="text-lg font-bold text-warning">{formatCurrency(vatAmount)}</div>
              <div className="text-xs text-warning">{baseCurrency}</div>
            </div>

            <div className="rounded-md border border-accent/30 bg-accent/10 p-3 text-center">
              <div className="mb-1 text-xs font-medium text-accent-foreground">
                الإجمالي مع الضريبة
              </div>
              <div className="text-lg font-bold text-accent-foreground">
                {formatCurrency(totalWithVAT)}
              </div>
              <div className="text-xs text-accent-foreground">{baseCurrency}</div>
            </div>

            <div className="rounded-md border border-info/30 bg-info/10 p-3 text-center">
              <div className="mb-1 text-xs font-medium text-info">سعر البند (للوحدة)</div>
              <div className="text-lg font-bold text-info">{formatCurrency(unitPrice)}</div>
              <div className="text-xs text-info">{baseCurrency}</div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-dashed border-info/30 bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-info">
              <Settings className="w-4 h-4" />
              النسب الافتراضية للبند
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              <span>الإدارية (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                defaultValue={administrativePercent.toFixed(1)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                onBlur={(e) => handlePercentagesChange(item.id, 'administrative', e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              <span>التشغيلية (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                defaultValue={operationalPercent.toFixed(1)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                onBlur={(e) => handlePercentagesChange(item.id, 'operational', e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              <span>الربح (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                defaultValue={profitPercent.toFixed(1)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                onBlur={(e) => handlePercentagesChange(item.id, 'profit', e.target.value)}
              />
            </label>
          </div>
        </div>

        {sections.map((section) => {
          const sectionKey = `${item.id}:${section.key}`
          const isOpen = expandedBreakdownSections.has(sectionKey)

          const estimatedRows = item.estimated?.breakdown?.[section.key] ?? []
          const actualRows = item.actual?.breakdown?.[section.key] ?? []

          const estimatedPairs = estimatedRows.map((row, idx) => {
            const id = resolveRowId(row, `est-${section.key}`, idx)
            return [id, row] as const
          })
          const actualPairs = actualRows.map((row, idx) => {
            const id = resolveRowId(row, `act-${section.key}`, idx)
            return [id, row] as const
          })

          const estimatedRowMap = new Map(estimatedPairs)
          const actualRowMap = new Map(actualPairs)
          const allRowIds = Array.from(new Set([...estimatedRowMap.keys(), ...actualRowMap.keys()]))

          const estimatedTotal = sumRows(estimatedRows)
          const actualTotal = sumRows(actualRows)
          const varianceValue = actualTotal - estimatedTotal
          const variancePct = estimatedTotal > 0 ? (varianceValue / estimatedTotal) * 100 : 0
          const varianceClass =
            varianceValue > 0
              ? 'text-destructive'
              : varianceValue < 0
                ? 'text-success'
                : 'text-muted-foreground'
          const displayedRowCount =
            actualRows.length !== 0 ? actualRows.length : estimatedRows.length

          return (
            <div
              key={section.key}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <button
                type="button"
                onClick={() => toggleBreakdownSection(item.id, section.key)}
                className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-muted"
                aria-controls={`${sectionKey}-panel`}
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${section.dotClass}`} />
                    <span className="font-medium text-foreground">{section.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${section.badgeClass}`}>
                      {formatInteger(displayedRowCount)} عناصر
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-info">تقديري: {formatCurrency(estimatedTotal)}</span>
                  <span className="text-success">فعلي: {formatCurrency(actualTotal)}</span>
                  <span className={`${varianceClass} font-medium`}>
                    الفارق: {formatCurrency(Math.abs(varianceValue))} ({variancePct.toFixed(1)}%)
                  </span>
                </div>
              </button>

              {isOpen && (
                <div
                  className="space-y-3 border-t border-border/40 p-3 md:p-4"
                  id={`${sectionKey}-panel`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      تفاصيل {section.label}
                    </p>
                    <button
                      className="flex items-center gap-1 text-sm text-success hover:text-success"
                      onClick={() => handleAddBreakdownRow(item.id, section.key)}
                    >
                      <Plus className="w-4 h-4" />
                      إضافة عنصر
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-border/40">
                    <table className="w-full text-xs md:text-sm">
                      <thead className="bg-muted text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 text-right whitespace-nowrap">الوصف</th>
                          <th className="px-3 py-2 text-center whitespace-nowrap">الوحدة</th>
                          <th className="px-3 py-2 text-center whitespace-nowrap">الكمية</th>
                          <th className="px-3 py-2 text-center whitespace-nowrap">السعر</th>
                          <th className="px-3 py-2 text-center whitespace-nowrap">الإجمالي</th>
                          <th className="px-3 py-2 text-center whitespace-nowrap">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allRowIds.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-3 py-6">
                              <EmptyState
                                icon={FileText}
                                title="لا توجد عناصر في هذا القسم بعد"
                                description='استخدم زر "إضافة عنصر" في الأعلى لبدء إدخال التكاليف.'
                              />
                            </td>
                          </tr>
                        )}
                        {allRowIds.map((rowId, idx) => {
                          const estimatedRow = estimatedRowMap.get(rowId)
                          const actualRow = actualRowMap.get(rowId)
                          const fallbackName =
                            actualRow?.name ?? estimatedRow?.name ?? `عنصر ${idx + 1}`
                          const quantity = actualRow?.quantity ?? estimatedRow?.quantity ?? 0
                          const unitCost = actualRow?.unitCost ?? estimatedRow?.unitCost ?? 0
                          const unit = estimatedRow?.unit ?? actualRow?.unit ?? '-'
                          const totalCost = quantity * unitCost

                          return (
                            <tr key={rowId} className="odd:bg-background even:bg-muted">
                              <td className="px-3 py-2 align-middle">
                                {estimatedRow ? (
                                  <span className="text-foreground">{estimatedRow.name}</span>
                                ) : (
                                  <input
                                    className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
                                    defaultValue={fallbackName}
                                    placeholder="وصف العنصر"
                                    onBlur={(e) =>
                                      handleBreakdownRowChange(
                                        item.id,
                                        section.key,
                                        rowId,
                                        'name',
                                        e.target.value,
                                      )
                                    }
                                  />
                                )}
                              </td>
                              <td className="px-3 py-2 text-center align-middle text-muted-foreground">
                                {unit}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <input
                                  className="w-20 md:w-24 rounded border border-input bg-background px-2 py-1 text-sm text-center"
                                  defaultValue={quantity.toFixed(2)}
                                  title="الكمية"
                                  placeholder="0.00"
                                  onBlur={(e) =>
                                    handleBreakdownRowChange(
                                      item.id,
                                      section.key,
                                      rowId,
                                      'quantity',
                                      e.target.value,
                                    )
                                  }
                                />
                              </td>
                              <td className="px-3 py-2 text-center">
                                <input
                                  className="w-20 md:w-24 rounded border border-input bg-background px-2 py-1 text-sm text-center"
                                  defaultValue={unitCost.toFixed(2)}
                                  title="سعر الوحدة"
                                  placeholder="0.00"
                                  onBlur={(e) =>
                                    handleBreakdownRowChange(
                                      item.id,
                                      section.key,
                                      rowId,
                                      'unitCost',
                                      e.target.value,
                                    )
                                  }
                                />
                              </td>
                              <td className="px-3 py-2 text-center font-medium text-foreground">
                                {formatCurrency(totalCost)}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <div className="flex items-center justify-center">
                                  {estimatedRow ? (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  ) : (
                                    <DeleteConfirmation
                                      itemName={fallbackName}
                                      onConfirm={() =>
                                        handleDeleteBreakdownRow(item.id, section.key, rowId)
                                      }
                                      trigger={
                                        <ActionRoundButton
                                          icon={Trash2}
                                          label={`حذف ${fallbackName}`}
                                          tone="danger"
                                          tooltip="حذف العنصر من تحليل التكلفة"
                                        />
                                      }
                                    />
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {(hasPendingSync || !validateCalculationConsistency(item)) && (
          <div className="space-y-3">
            {hasPendingSync && (
              <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
                <div className="text-sm text-warning">
                  <p className="font-medium">تحديث مطلوب</p>
                  <p>
                    تم تعديل بيانات التكاليف. يرجى النقر على &quot;حفظ وتحديث&quot; لتطبيق التغييرات
                    على سعر البند.
                  </p>
                </div>
              </div>
            )}
            {!validateCalculationConsistency(item) && !hasPendingSync && (
              <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
                <div className="text-sm text-warning">
                  <p className="font-medium">تحذير: عدم تطابق في الحسابات</p>
                  <p>
                    الحسابات الحالية لا تتطابق مع سعر البند المعروض. يُنصح بإعادة الحساب للتأكد من
                    الدقة.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 rounded-lg border border-info/30 bg-muted/10 p-4">
              <div className="flex flex-col items-center justify-between gap-4 lg:flex-row lg:gap-6">
                <div className="flex items-center gap-3">
                  {hasPendingSync ? (
                    <SaveConfirmation
                      onConfirm={() => handleRecalculateItemFromBreakdown(item.id)}
                      trigger={
                        <button
                          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
                          aria-label="حفظ وتحديث سعر البند"
                          title="حفظ وتحديث سعر البند"
                        >
                          <Save className="w-4 h-4" />
                          حفظ وتحديث سعر البند
                        </button>
                      }
                    />
                  ) : (
                    <button
                      className="flex items-center gap-2 rounded-lg bg-warning px-5 py-2.5 font-medium text-warning-foreground shadow-lg transition-colors hover:bg-warning/90"
                      aria-label="حفظ وتحديث سعر البند"
                      title="إعادة حساب سعر البند"
                      onClick={() => handleRecalculateItemFromBreakdown(item.id)}
                    >
                      <Calculator className="w-4 h-4" />
                      إعادة حساب سعر البند
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {validateCalculationConsistency(item) ? (
                    <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-success">
                      <span className="text-success">✓</span>
                      <span className="text-sm font-medium">الحسابات متطابقة</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-warning">
                      <span className="text-warning">⚠</span>
                      <span className="text-sm font-medium">يحتاج إعادة حساب</span>
                    </div>
                  )}

                  {hasPendingSync && (
                    <div className="flex items-center gap-2 rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-info">
                      <span className="animate-pulse text-info">💾</span>
                      <span className="text-sm font-medium">تغييرات غير محفوظة</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center mt-2">
                <p className="text-xs text-muted-foreground">
                  💡 قم بتعديل البيانات في الجداول أعلاه ثم اضغط على زر الحفظ لتحديث السعر النهائي
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">جاري التحميل...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20" dir="rtl">
      <div className="p-6 space-y-6">
        {actionMessage && (
          <div
            className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success shadow-sm"
            role="status"
            aria-live="polite"
          >
            <span className="text-lg" role="img" aria-hidden="true">
              ✅
            </span>
            <span>{actionMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div
            className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm"
            role="alert"
          >
            <span className="text-lg" role="img" aria-hidden="true">
              ⚠️
            </span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
                <Calculator className="h-6 w-6 text-info" />
                بنود التكلفة
              </h1>
              <p className="mt-1 text-muted-foreground">
                إدارة وتحليل التكاليف التقديرية والفعلية للمشروع
              </p>
            </div>
            <div className="flex items-center gap-2">
              {tenderId && (
                <button
                  type="button"
                  onClick={handleImportFromTender}
                  disabled={isImporting}
                  className="flex items-center gap-2 rounded-lg bg-info px-4 py-2 text-sm text-info-foreground transition-colors hover:bg-info/90 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="استيراد بنود التكلفة من المنافسة"
                >
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <ExternalLink className="h-4 w-4" />
                  )}
                  {isImporting ? 'جاري الاستيراد...' : 'استيراد من المنافسة'}
                </button>
              )}
              <button className="flex items-center gap-2 rounded-lg bg-muted-foreground px-4 py-2 text-sm text-background transition-colors hover:bg-muted-foreground/90">
                <Settings className="h-4 w-4" />
                الإعدادات
              </button>
            </div>
          </div>

          {/* Pricing Summary Cards */}
          {renderPricingSummary()}
        </div>

        {/* Main Table */}
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-4">
            <h2 className="flex items-center gap-2 text-lg font-medium text-foreground">
              <Grid3X3 className="h-5 w-5 text-success" />
              جدول بنود التكلفة
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table key={`table-${forceUpdateKey}`} className="w-full min-w-[1400px] table-fixed">
              <colgroup>
                <col className="w-[5%]" />
                <col className="w-[6%]" />
                <col className="w-[24%]" />
                <col className="w-[6%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
                <col className="w-[9%]" />
                <col className="w-[8%]" />
                <col className="w-[9%]" />
                <col className="w-[9%]" />
                <col className="w-[10%]" />
                <col className="w-[5%]" />
                <col className="w-[5%]" />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-card">
                <tr className="border-b border-border bg-muted/40">
                  <th className="border border-border px-3 py-2 text-center text-sm font-semibold text-muted-foreground">
                    إجراءات
                  </th>
                  <th className="border border-border px-3 py-2 text-center text-sm font-semibold text-muted-foreground">
                    فارق %
                  </th>
                  <th className="border border-border px-3 py-2 text-center text-sm font-semibold text-muted-foreground">
                    فارق القيمة
                  </th>
                  <th className="border border-border px-3 py-2 text-center text-sm font-semibold text-muted-foreground">
                    الإجمالي الفعلي
                  </th>
                  <th className="border border-border px-3 py-2 text-center text-sm font-semibold text-muted-foreground">
                    السعر الفعلي
                  </th>
                  <th className="border border-border px-3 py-2 text-center text-sm font-semibold text-muted-foreground">
                    الكمية الفعلية
                  </th>
                  <th className="border border-border px-3 py-2 text-center text-sm font-semibold text-muted-foreground">
                    الإجمالي التقديري
                  </th>
                  <th className="border border-border px-3 py-2 text-center text-sm font-semibold text-muted-foreground">
                    السعر التقديري
                  </th>
                  <th className="border border-border px-3 py-2 text-center text-sm font-semibold text-muted-foreground">
                    الكمية التقديرية
                  </th>
                  <th className="border border-border px-3 py-2 text-center text-sm font-semibold text-muted-foreground">
                    الوحدة
                  </th>
                  <th className="border border-border px-3 py-2 text-right text-sm font-semibold text-muted-foreground">
                    وصف البند
                  </th>
                  <th className="border border-border px-3 py-2 text-right text-sm font-semibold text-muted-foreground">
                    رقم البند
                  </th>
                  <th className="border border-border px-3 py-2 text-center text-sm font-semibold text-muted-foreground">
                    عرض
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const isExpanded = expandedItems.has(item.id)
                  const estimatedQuantity = item.estimated?.quantity ?? 0
                  const estimatedUnitPrice = item.estimated?.unitPrice ?? 0
                  const estimatedTotal =
                    item.estimated?.totalPrice ??
                    +(estimatedQuantity * estimatedUnitPrice).toFixed(2)
                  const actualQuantity = item.actual?.quantity ?? 0
                  const actualUnitPrice = item.actual?.unitPrice ?? 0
                  const actualTotal =
                    item.actual?.totalPrice ?? +(actualQuantity * actualUnitPrice).toFixed(2)

                  // تشخيص: فحص حالة البيانات لكل بند
                  if (actualUnitPrice > 0 || actualTotal > 0) {
                    const hasBreakdownData =
                      item.actual?.breakdown &&
                      (item.actual.breakdown.materials?.length > 0 ||
                        item.actual.breakdown.labor?.length > 0 ||
                        item.actual.breakdown.equipment?.length > 0 ||
                        item.actual.breakdown.subcontractors?.length > 0)

                    const isCalculationCorrect =
                      actualQuantity > 0 &&
                      Math.abs(actualUnitPrice * actualQuantity - actualTotal) < 1

                    console.log(`📊 [UI Render] البند ${index + 1} (${item.id}):`, {
                      description: item.description?.substring(0, 40) + '...',
                      actualQuantity,
                      actualUnitPrice,
                      actualTotal,
                      hasBreakdownData,
                      isCalculationCorrect,
                      calculationCheck: `${actualUnitPrice} × ${actualQuantity} = ${(actualUnitPrice * actualQuantity).toFixed(2)} ${isCalculationCorrect ? '✅' : '❌'}`,
                      status: isCalculationCorrect ? '✅ صحيح' : '❌ يحتاج إعادة حساب',
                    })
                  }
                  const varianceValue = actualTotal - estimatedTotal
                  const variancePct = estimatedTotal ? (varianceValue / estimatedTotal) * 100 : 0
                  const varianceClass =
                    varianceValue > 0
                      ? 'text-destructive'
                      : varianceValue < 0
                        ? 'text-success'
                        : 'text-muted-foreground'
                  const varianceBg =
                    varianceValue !== 0
                      ? varianceValue > 0
                        ? 'bg-destructive/10'
                        : 'bg-success/10'
                      : 'bg-muted/20'
                  const severity = severityMap[item.id]
                  const severityStyles: Record<string, { label: string; className: string }> = {
                    critical: {
                      label: 'تجاوز حرج',
                      className: 'bg-destructive/10 text-destructive',
                    },
                    warning: { label: 'تنبيه', className: 'bg-warning/10 text-warning' },
                    info: { label: 'ملاحظة', className: 'bg-info/10 text-info' },
                  }
                  const severityBadge = severity ? severityStyles[severity] : null

                  return (
                    <React.Fragment key={`${item.id}-${actualUnitPrice}-${actualTotal}`}>
                      <tr className="border-b border-border bg-card odd:bg-card even:bg-muted/10 transition-colors hover:bg-info/10">
                        <td className="border border-border px-2 py-2 text-center align-top min-w-[50px] w-[5%]">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            {(() => {
                              const hasPendingSync = Boolean(item.state?.breakdownDirty)
                              if (hasPendingSync) {
                                return (
                                  <SaveConfirmation
                                    onConfirm={() => handleRecalculateItemFromBreakdown(item.id)}
                                    trigger={
                                      <ActionRoundButton
                                        icon={Save}
                                        label="حفظ وتحديث سعر البند"
                                        tone="primary"
                                        tooltip="حفظ وتحديث سعر البند - يوجد تغييرات غير محفوظة"
                                      />
                                    }
                                  />
                                )
                              }
                              return (
                                <ActionRoundButton
                                  icon={Calculator}
                                  label="إعادة حساب سعر البند"
                                  tone="warning"
                                  tooltip="إعادة حساب سعر البند بناءً على التحليل"
                                  onClick={() => handleRecalculateItemFromBreakdown(item.id)}
                                />
                              )
                            })()}

                            <ActionRoundButton
                              icon={ShoppingCart}
                              label="إصدار أمر شراء"
                              tone="success"
                              tooltip="إصدار أمر شراء للبند"
                              onClick={() => handleIssuePurchaseOrder(item.id)}
                            />

                            <DeleteConfirmation
                              itemName={item.description ?? 'البند'}
                              onConfirm={() => handleDeleteItem(item.id)}
                              trigger={
                                <ActionRoundButton
                                  icon={Trash2}
                                  label="حذف البند"
                                  tone="danger"
                                  tooltip="حذف البند من جدول التكاليف"
                                />
                              }
                            />

                            <ActionRoundButton
                              icon={MoreHorizontal}
                              label="خيارات إضافية"
                              tone="neutral"
                              tooltip="خيارات إضافية (سيتم دعمها لاحقًا)"
                              disabled
                            />
                          </div>
                        </td>
                        <td
                          className={`border border-border px-2 py-2 text-center font-semibold ${varianceClass} ${varianceBg} min-w-[60px] w-[6%]`}
                        >
                          {variancePct.toFixed(1)}%
                        </td>
                        <td
                          className={`border border-border px-2 py-2 text-center font-semibold ${varianceClass} ${varianceBg} min-w-[120px] w-[24%]`}
                        >
                          {formatCurrency(varianceValue)}
                        </td>
                        <td className="border border-border px-2 py-2 text-center font-medium text-success min-w-[90px] w-[6%]">
                          {formatCurrency(actualTotal)}
                        </td>
                        <td className="border border-border px-2 py-2 text-center text-foreground min-w-[90px] w-[8%]">
                          {Number.isFinite(actualUnitPrice) ? formatCurrency(actualUnitPrice) : '—'}
                        </td>
                        <td className="border border-border px-2 py-2 text-center text-foreground min-w-[80px] w-[8%]">
                          {Number.isFinite(actualQuantity) ? formatDecimal(actualQuantity) : '—'}
                        </td>
                        <td className="border border-border px-2 py-2 text-center font-medium text-info min-w-[90px] w-[9%]">
                          {formatCurrency(estimatedTotal)}
                        </td>
                        <td className="border border-border px-2 py-2 text-center min-w-[80px] w-[8%]">
                          {formatCurrency(estimatedUnitPrice)}
                        </td>
                        <td className="border border-border px-2 py-2 text-center min-w-[80px] w-[9%]">
                          {formatDecimal(estimatedQuantity)}
                        </td>
                        <td className="border border-border px-2 py-2 text-center font-medium min-w-[60px] w-[9%]">
                          {item.unit ?? '-'}
                        </td>
                        <td className="border border-border px-2 py-2 text-right w-[10%]">
                          <div>
                            <div className="font-medium text-foreground">{item.description}</div>
                            {item.category && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                {item.category}
                              </div>
                            )}
                            {severityBadge && (
                              <div
                                className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${severityBadge.className}`}
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {severityBadge.label}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="border border-border px-2 py-2 text-center font-medium min-w-[60px] w-[5%]">
                          {formatInteger(index + 1)}
                        </td>
                        <td className="border border-border px-2 py-2 text-center min-w-[50px] w-[5%]">
                          <button
                            onClick={() => toggleExpanded(item.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-info hover:text-info"
                            title={isExpanded ? 'إخفاء تحليل التكلفة' : 'عرض تحليل التكلفة'}
                            aria-controls={`analysis-${item.id}`}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Breakdown Analysis Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={13} className="bg-muted/10 p-0">
                            <div
                              className="m-2 rounded-lg border border-border bg-card p-4"
                              id={`analysis-${item.id}`}
                              data-testid={`analysis-panel-${item.id}`}
                            >
                              <div className="mb-3 font-semibold flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-info" />
                                  <span className="text-info">تحليل تكلفة البند</span>
                                </div>
                              </div>
                              {renderBreakdownAnalysis(item)}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimplifiedProjectCostView
