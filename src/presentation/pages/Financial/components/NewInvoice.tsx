import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Textarea } from '@/presentation/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'
import { FileText, ArrowRight, Plus, Trash2, Save, Send } from 'lucide-react'

interface NewInvoiceProps {
  onSectionChange: (section: string) => void
}

interface InvoiceItem {
  id: number
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface InvoiceFormState {
  clientName: string
  clientEmail: string
  clientPhone: string
  clientAddress: string
  projectName: string
  invoiceDate: string
  dueDate: string
  paymentTerms: string
  notes: string
  items: InvoiceItem[]
}

interface InvoiceTotals {
  subtotal: number
  tax: number
  taxRate: number
  total: number
}

export function NewInvoice({ onSectionChange }: NewInvoiceProps) {
  const [formData, setFormData] = useState<InvoiceFormState>({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    projectName: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    paymentTerms: '30',
    notes: '',
    items: [
      {
        id: 1,
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0,
      },
    ],
  })

  const [totals, setTotals] = useState<InvoiceTotals>({
    subtotal: 0,
    tax: 0,
    taxRate: 15,
    total: 0,
  })

  const recalculateTotals = (items: InvoiceItem[]) => {
    setTotals((prev) => {
      const subtotal = items.reduce((sum, item) => sum + item.total, 0)
      const tax = subtotal * (prev.taxRate / 100)
      const total = subtotal + tax
      return {
        ...prev,
        subtotal,
        tax,
        total,
      }
    })
  }

  const handleItemsChange = (items: InvoiceItem[]) => {
    setFormData((prev) => ({ ...prev, items }))
    recalculateTotals(items)
  }

  const updateItem = <Field extends keyof InvoiceItem>(
    id: number,
    field: Field,
    value: InvoiceItem[Field],
  ) => {
    const updatedItems = formData.items.map((item) => {
      if (item.id !== id) {
        return item
      }

      const nextItem: InvoiceItem = {
        ...item,
        [field]: value,
      }

      if (field === 'quantity' || field === 'unitPrice') {
        nextItem.total = nextItem.quantity * nextItem.unitPrice
      }

      return nextItem
    })

    handleItemsChange(updatedItems)
  }

  const parseNumberInput = (raw: string, defaultValue: number) => {
    const parsed = Number.parseFloat(raw)
    return Number.isNaN(parsed) ? defaultValue : parsed
  }

  // إضافة عنصر جديد
  const addItem = () => {
    const nextId = formData.items.reduce((maxId, current) => Math.max(maxId, current.id), 0) + 1
    const newItem: InvoiceItem = {
      id: nextId,
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    }

    handleItemsChange([...formData.items, newItem])
  }

  // حذف عنصر
  const removeItem = (id: number) => {
    if (formData.items.length > 1) {
      const nextItems = formData.items.filter((item) => item.id !== id)
      handleItemsChange(nextItems)
    }
  }

  // حفظ الفاتورة
  const handleSave = () => {
    console.log('حفظ الفاتورة:', { ...formData, totals })
    alert('تم حفظ الفاتورة بنجاح!')
    onSectionChange('invoices')
  }

  // إرسال الفاتورة
  const handleSendInvoice = () => {
    console.log('إرسال الفاتورة:', { ...formData, totals })
    alert('تم إرسال الفاتورة بنجاح!')
    onSectionChange('invoices')
  }

  const quickActions = [
    {
      label: 'العودة للفواتير',
      icon: ArrowRight,
      onClick: () => onSectionChange('invoices'),
      variant: 'outline' as const,
    },
    {
      label: 'حفظ',
      icon: Save,
      onClick: handleSave,
      variant: 'outline' as const,
    },
    {
      label: 'حفظ وإرسال',
      icon: Send,
      onClick: handleSendInvoice,
      primary: true,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-primary/5">
      {/* الهيدر */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">فاتورة جديدة</h1>
                <p className="text-sm text-muted-foreground">إنشاء فاتورة جديدة للعميل</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.primary ? 'default' : (action.variant ?? 'outline')}
                  onClick={action.onClick}
                  className="flex items-center gap-2"
                >
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* المحتوى */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-6">
            {/* معلومات العميل */}
            <Card>
              <CardHeader>
                <CardTitle>معلومات العميل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientName">اسم العميل</Label>
                    <Input
                      id="clientName"
                      value={formData.clientName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, clientName: e.target.value }))
                      }
                      placeholder="أدخل اسم العميل"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientEmail">البريد الإلكتروني</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, clientEmail: e.target.value }))
                      }
                      placeholder="client@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientPhone">رقم الهاتف</Label>
                    <Input
                      id="clientPhone"
                      value={formData.clientPhone}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, clientPhone: e.target.value }))
                      }
                      placeholder="05xxxxxxxx"
                    />
                  </div>
                  <div>
                    <Label htmlFor="projectName">اسم المشروع</Label>
                    <Input
                      id="projectName"
                      value={formData.projectName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, projectName: e.target.value }))
                      }
                      placeholder="أدخل اسم المشروع"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="clientAddress">عنوان العميل</Label>
                  <Textarea
                    id="clientAddress"
                    value={formData.clientAddress}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, clientAddress: e.target.value }))
                    }
                    placeholder="أدخل عنوان العميل الكامل"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* تفاصيل الفاتورة */}
            <Card>
              <CardHeader>
                <CardTitle>تفاصيل الفاتورة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="invoiceDate">تاريخ الفاتورة</Label>
                    <Input
                      id="invoiceDate"
                      type="date"
                      value={formData.invoiceDate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, invoiceDate: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="dueDate">تاريخ الاستحقاق</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentTerms">مدة السداد (يوم)</Label>
                    <Select
                      value={formData.paymentTerms}
                      onValueChange={(value: string) =>
                        setFormData((prev) => ({ ...prev, paymentTerms: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر مدة السداد" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 يوم</SelectItem>
                        <SelectItem value="30">30 يوم</SelectItem>
                        <SelectItem value="45">45 يوم</SelectItem>
                        <SelectItem value="60">60 يوم</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* عناصر الفاتورة */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>عناصر الفاتورة</CardTitle>
                <Button onClick={addItem} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  إضافة عنصر
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* رأس الجدول */}
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                    <div className="col-span-5">الوصف</div>
                    <div className="col-span-2">الكمية</div>
                    <div className="col-span-2">السعر</div>
                    <div className="col-span-2">الإجمالي</div>
                    <div className="col-span-1">الإجراء</div>
                  </div>

                  {/* عناصر الفاتورة */}
                  {formData.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder="وصف العنصر"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const value = Math.max(1, parseNumberInput(e.target.value, 1))
                            updateItem(item.id, 'quantity', value)
                          }}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const value = Math.max(0, parseNumberInput(e.target.value, 0))
                            updateItem(item.id, 'unitPrice', value)
                          }}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="col-span-2">
                        <div className="p-2 bg-muted/30 rounded text-center font-medium">
                          {item.total.toFixed(2)} ريال
                        </div>
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          disabled={formData.items.length === 1}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* الإجماليات */}
                <div className="border-t pt-4 mt-6">
                  <div className="flex justify-end">
                    <div className="w-80 space-y-2">
                      <div className="flex justify-between">
                        <span>المجموع الفرعي:</span>
                        <span className="font-medium">{totals.subtotal.toFixed(2)} ريال</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ضريبة القيمة المضافة ({totals.taxRate}%):</span>
                        <span className="font-medium">{totals.tax.toFixed(2)} ريال</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 text-lg font-bold">
                        <span>الإجمالي:</span>
                        <span>{totals.total.toFixed(2)} ريال</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ملاحظات */}
            <Card>
              <CardHeader>
                <CardTitle>ملاحظات إضافية</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="أدخل أي ملاحظات إضافية للفاتورة..."
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
