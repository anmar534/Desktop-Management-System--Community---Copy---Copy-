/**
 * Quantity Table Section Component
 *
 * @fileoverview Table component for managing tender quantity items (BOQ).
 * Extracted from NewTenderForm.tsx for better reusability.
 *
 * @module presentation/components/tenders/QuantityTableSection
 */

import { useCallback, useRef, type ChangeEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Plus, Upload, X, FileText } from 'lucide-react'
import type { QuantityItem } from '@/shared/types/contracts'
import { ExcelProcessor } from '@/shared/utils/data/excelProcessor'
import { createEmptyQuantityRow } from '@/shared/utils/tender/tenderFormDefaults'

/**
 * Props for QuantityTableSection component
 */
export interface QuantityTableSectionProps {
  /** Array of quantity items */
  quantities: QuantityItem[]
  /** Callback when quantities change */
  onQuantitiesChange: (quantities: QuantityItem[]) => void
  /** Loading state */
  isLoading?: boolean
}

/**
 * QuantityTableSection Component
 *
 * Displays editable table for tender quantity items with Excel import support.
 *
 * @example
 * ```tsx
 * <QuantityTableSection
 *   quantities={quantities}
 *   onQuantitiesChange={setQuantities}
 *   isLoading={false}
 * />
 * ```
 */
export function QuantityTableSection({
  quantities,
  onQuantitiesChange,
  isLoading = false,
}: QuantityTableSectionProps) {
  const excelInputRef = useRef<HTMLInputElement | null>(null)

  const addQuantityRow = useCallback(() => {
    onQuantitiesChange([...quantities, createEmptyQuantityRow()])
  }, [quantities, onQuantitiesChange])

  const removeQuantityRow = useCallback(
    (id: number) => {
      if (quantities.length <= 1) {
        return
      }
      onQuantitiesChange(quantities.filter((row) => row.id !== id))
    },
    [quantities, onQuantitiesChange],
  )

  const handleQuantityChange = useCallback(
    (id: number, field: keyof QuantityItem, value: string) => {
      onQuantitiesChange(
        quantities.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
      )
    },
    [quantities, onQuantitiesChange],
  )

  const handleExcelImport = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const inputElement = event.currentTarget
      const file = inputElement.files?.[0]
      if (!file) {
        return
      }

      try {
        console.log('بدء معالجة الملف:', file.name)

        const processedData = await ExcelProcessor.processExcelFile(file)

        if (processedData.length > 0) {
          console.log(`تم معالجة ${processedData.length} صف بنجاح`)
          onQuantitiesChange(processedData)
          alert(`تم استيراد ${processedData.length} صف بنجاح!`)
        } else {
          console.warn('لم يتم العثور على بيانات صالحة في الملف')
          alert(
            'لم يتم العثور على بيانات صالحة في الملف. تأكد من وجود أعمدة: الرقم، الوحدة، الكمية، المواصفات',
          )
        }
      } catch (error) {
        console.error('خطأ في معالجة الملف:', error)
        alert('حدث خطأ أثناء معالجة الملف. تأكد من تنسيق البيانات.')
      } finally {
        inputElement.value = ''
      }
    },
    [onQuantitiesChange],
  )

  const openExcelImport = useCallback(() => {
    excelInputRef.current?.click()
  }, [])

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          جداول الكميات
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* أزرار إدارة الجدول */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            onClick={addQuantityRow}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            إضافة صف
          </Button>

          <div className="relative">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={openExcelImport}
              disabled={isLoading}
            >
              <Upload className="h-4 w-4" />
              {isLoading ? 'جاري المعالجة...' : 'استيراد من Excel/CSV'}
            </Button>
            <input
              id="excel-import"
              type="file"
              accept=".xlsx,.xls,.csv,.tsv,.txt"
              ref={excelInputRef}
              onChange={handleExcelImport}
              className="hidden"
              title="استيراد ملف Excel أو CSV"
              placeholder="اختر ملف للاستيراد"
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          يدعم: Excel (.xlsx, .xls), CSV, TSV, TXT (الأعمدة المتوقعة: رقم، وحدة، كمية، مواصفات)
        </p>

        {/* جدول الكميات */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="border p-3 text-right">الرقم التسلسلي</th>
                <th className="border p-3 text-right">الوحدة</th>
                <th className="border p-3 text-right">الكمية</th>
                <th className="border p-3 text-right">المواصفات</th>
                <th className="border p-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {quantities.map((row, index) => (
                <tr key={row.id}>
                  <td className="border p-2">
                    <Input
                      value={row.serialNumber}
                      onChange={(e) => handleQuantityChange(row.id, 'serialNumber', e.target.value)}
                      placeholder={`${index + 1}`}
                      className="bg-background"
                    />
                  </td>
                  <td className="border p-2">
                    <Input
                      value={row.unit}
                      onChange={(e) => handleQuantityChange(row.id, 'unit', e.target.value)}
                      placeholder="متر، م²، قطعة"
                      className="bg-background"
                    />
                  </td>
                  <td className="border p-2">
                    <Input
                      value={row.quantity}
                      onChange={(e) => handleQuantityChange(row.id, 'quantity', e.target.value)}
                      placeholder="الكمية"
                      type="number"
                      className="bg-background"
                    />
                  </td>
                  <td className="border p-2">
                    <Input
                      value={row.specifications}
                      onChange={(e) =>
                        handleQuantityChange(row.id, 'specifications', e.target.value)
                      }
                      placeholder="المواصفات والتفاصيل"
                      className="bg-background"
                    />
                  </td>
                  <td className="border p-2 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuantityRow(row.id)}
                      disabled={quantities.length === 1}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
