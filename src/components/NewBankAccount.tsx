'use client'

import { useState } from 'react'
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { 
  Landmark,
  ArrowRight,
  Save,
  CheckCircle
} from 'lucide-react'

interface NewBankAccountProps {
  onSectionChange: (section: string) => void
}

export function NewBankAccount({ onSectionChange }: NewBankAccountProps) {
  interface BankAccountFormState {
    accountName: string;
    bankName: string;
    accountNumber: string;
    iban: string;
    accountType: string;
    initialBalance: string;
    currency: 'SAR' | 'USD' | 'EUR';
    isActive: boolean;
  }

  const [formData, setFormData] = useState<BankAccountFormState>({
    accountName: '',
    bankName: '',
    accountNumber: '',
    iban: '',
    accountType: '',
    initialBalance: '',
    currency: 'SAR',
    isActive: true
  })

  const parseInitialBalance = (value: string): number => {
    const parsed = Number.parseFloat(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }

  // البنوك السعودية
  const saudiBanks = [
    'البنك الأهلي السعودي',
    'بنك الرياض',
    'بنك ساب',
    'البنك السعودي للاستثمار',
    'البنك السعودي الفرنسي',
    'بنك الجزيرة',
    'بنك الإنماء',
    'البنك العربي الوطني',
    'مصرف الراجحي',
    'البنك السعودي البريطاني ساب'
  ]

  // أنواع الحسابات
  const accountTypes = [
    { value: 'current', label: 'حساب جاري' },
    { value: 'savings', label: 'حساب توفير' },
    { value: 'investment', label: 'حساب استثماري' },
    { value: 'project', label: 'حساب مشروع' }
  ]

  // حفظ الحساب
  const handleSave = () => {
    if (formData.accountName.trim() === '' || formData.bankName.trim() === '' || formData.accountNumber.trim() === '') {
      alert('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    const sanitizedData = {
      ...formData,
      initialBalance: parseInitialBalance(formData.initialBalance)
    }

    console.log('حفظ الحساب الجديد:', sanitizedData)
    alert('تم إنشاء الحساب البنكي بنجاح!')
    onSectionChange('bank-accounts')
  }

  const quickActions = [
    {
      label: 'العودة للحسابات البنكية',
      icon: ArrowRight,
      onClick: () => onSectionChange('bank-accounts'),
      variant: 'outline' as const
    },
    {
      label: 'حفظ الحساب',
      icon: Save,
      onClick: handleSave,
      primary: true
    }
  ]

  const NOT_SET_LABEL = 'لم يتم تحديده'

  const getDisplayValue = (value: string): string => (value.trim() === '' ? NOT_SET_LABEL : value)

  const accountNameDisplay = getDisplayValue(formData.accountName)
  const bankNameDisplay = getDisplayValue(formData.bankName)
  const accountTypeLabel = accountTypes.find(type => type.value === formData.accountType)?.label ?? NOT_SET_LABEL
  const formattedAccountNumber = formData.accountNumber.trim() === ''
    ? NOT_SET_LABEL
    : formData.accountNumber.replace(/(.{4})/g, '$1 ').trim()
  const formattedIban = getDisplayValue(formData.iban)
  const { formatCurrencyValue } = useCurrencyFormatter(formData.currency)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      
      {/* الهيدر */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Landmark className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">حساب بنكي جديد</h1>
                <p className="text-sm text-muted-foreground">إضافة حساب بنكي جديد للمؤسسة</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.primary ? 'default' : action.variant ?? 'outline'}
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
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">

            {/* المعلومات الأساسية */}
            <Card>
              <CardHeader>
                <CardTitle>المعلومات الأساسية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accountName">اسم الحساب *</Label>
                    <Input
                      id="accountName"
                      value={formData.accountName}
                      onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                      placeholder="الحساب الرئيسي للشركة"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankName">اسم البنك *</Label>
                    <Select value={formData.bankName} onValueChange={(value: string) => setFormData(prev => ({ ...prev, bankName: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر البنك" />
                      </SelectTrigger>
                      <SelectContent>
                        {saudiBanks.map((bank) => (
                          <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="accountType">نوع الحساب *</Label>
                    <Select value={formData.accountType} onValueChange={(value: string) => setFormData(prev => ({ ...prev, accountType: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع الحساب" />
                      </SelectTrigger>
                      <SelectContent>
                        {accountTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currency">العملة</Label>
                    <Select value={formData.currency} onValueChange={(value: string) => setFormData(prev => ({ ...prev, currency: value as BankAccountFormState['currency'] }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                        <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                        <SelectItem value="EUR">يورو (EUR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* تفاصيل الحساب */}
            <Card>
              <CardHeader>
                <CardTitle>تفاصيل الحساب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accountNumber">رقم الحساب *</Label>
                    <Input
                      id="accountNumber"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                      placeholder="1234567890123456"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="iban">رقم الآيبان (IBAN)</Label>
                    <Input
                      id="iban"
                      value={formData.iban}
                      onChange={(e) => setFormData(prev => ({ ...prev, iban: e.target.value.toUpperCase() }))}
                      placeholder="SA0340000001234567890123456"
                    />
                  </div>
                  <div>
                    <Label htmlFor="initialBalance">الرصيد الافتتاحي</Label>
                    <Input
                      id="initialBalance"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.initialBalance}
                      onChange={(e) => setFormData(prev => ({ ...prev, initialBalance: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded border-gray-300"
                      aria-label="حساب نشط"
                    />
                    <Label htmlFor="isActive" className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      حساب نشط
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* معاينة البيانات */}
            <Card>
              <CardHeader>
                <CardTitle>معاينة البيانات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">اسم الحساب:</span>
                    <span className="font-medium">{accountNameDisplay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">البنك:</span>
                    <span className="font-medium">{bankNameDisplay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">نوع الحساب:</span>
                    <span className="font-medium">
                      {accountTypeLabel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">رقم الحساب:</span>
                    <span className="font-medium font-mono">
                      {formattedAccountNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الآيبان:</span>
                    <span className="font-medium font-mono">{formattedIban}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الرصيد الافتتاحي:</span>
                    <span className="font-medium">{formatCurrencyValue(parseInitialBalance(formData.initialBalance), {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">حالة الحساب:</span>
                    <span className={`font-medium ${formData.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                      {formData.isActive ? 'نشط' : 'غير نشط'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}
