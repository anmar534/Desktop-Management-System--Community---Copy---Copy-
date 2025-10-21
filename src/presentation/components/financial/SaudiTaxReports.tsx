/**
 * مكون التقارير الضريبية السعودية
 * Saudi Tax Reports Component
 */

import type React from 'react';
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { 
  FileText, 
  Calculator, 
  Download, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  DollarSign,
  Receipt,
  Building
} from 'lucide-react'
import type { VATReturn, VATTransaction, ZakatCalculation, TaxSettings } from '@/services/saudiTaxService';
import { SaudiTaxService } from '@/services/saudiTaxService'

export const SaudiTaxReports: React.FC = () => {
  const [service] = useState(() => new SaudiTaxService())
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  
  // البيانات
  const [vatReturns, setVatReturns] = useState<VATReturn[]>([])
  const [vatTransactions, setVatTransactions] = useState<VATTransaction[]>([])
  const [zakatCalculations, setZakatCalculations] = useState<ZakatCalculation[]>([])
  const [taxSettings, setTaxSettings] = useState<TaxSettings | null>(null)
  
  // نموذج إنشاء إقرار ضريبي جديد
  const [newReturnPeriod, setNewReturnPeriod] = useState('')
  const [newReturnType, setNewReturnType] = useState<'monthly' | 'quarterly'>('monthly')
  
  // إحصائيات سريعة
  const [quickStats, setQuickStats] = useState({
    totalVATPayable: 0,
    totalVATRefundable: 0,
    pendingReturns: 0,
    lastReturnPeriod: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [returnsData, transactionsData, zakatData, settingsData] = await Promise.all([
        service.getAllVATReturns(),
        service.getAllVATTransactions(),
        service.getAllZakatCalculations(),
        service.getTaxSettings()
      ])
      
      setVatReturns(returnsData)
      setVatTransactions(transactionsData)
      setZakatCalculations(zakatData)
      setTaxSettings(settingsData)
      
      // حساب الإحصائيات السريعة
      const totalVATPayable = returnsData.reduce((sum, r) => sum + r.vatPayable, 0)
      const totalVATRefundable = returnsData.reduce((sum, r) => sum + r.vatRefundable, 0)
      const pendingReturns = returnsData.filter(r => r.status === 'draft').length
      const lastReturn = returnsData.sort((a, b) => b.period.localeCompare(a.period))[0]
      
      setQuickStats({
        totalVATPayable,
        totalVATRefundable,
        pendingReturns,
        lastReturnPeriod: lastReturn?.period || 'لا يوجد'
      })
    } catch (error) {
      console.error('Error loading tax data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateVATReturn = async () => {
    if (!newReturnPeriod) return
    
    try {
      await service.generateVATReturn(newReturnPeriod, newReturnType)
      await loadData()
      setNewReturnPeriod('')
    } catch (error) {
      console.error('Error creating VAT return:', error)
    }
  }

  const handleExportVATReturn = async (returnId: string) => {
    try {
      const xml = await service.exportVATReturnXML(returnId)
      const blob = new Blob([xml], { type: 'application/xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vat_return_${returnId}.xml`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting VAT return:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: 'مسودة', variant: 'secondary' as const },
      submitted: { label: 'مرسل', variant: 'default' as const },
      approved: { label: 'معتمد', variant: 'success' as const },
      rejected: { label: 'مرفوض', variant: 'destructive' as const }
    }
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.draft
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>جاري تحميل البيانات الضريبية...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">التقارير الضريبية السعودية</h1>
          <p className="text-muted-foreground">إدارة ضريبة القيمة المضافة والزكاة</p>
        </div>
        <Button onClick={loadData} variant="outline">
          <TrendingUp className="h-4 w-4 ml-2" />
          تحديث البيانات
        </Button>
      </div>

      {/* بطاقات الإحصائيات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ضريبة مستحقة</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {quickStats.totalVATPayable.toLocaleString('ar-SA')} ريال
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ضريبة مستردة</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {quickStats.totalVATRefundable.toLocaleString('ar-SA')} ريال
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إقرارات معلقة</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {quickStats.pendingReturns}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">آخر فترة</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quickStats.lastReturnPeriod}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التحقق من الإعدادات */}
      {!taxSettings && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            يجب إعداد بيانات الشركة الضريبية أولاً في تبويب "الإعدادات"
          </AlertDescription>
        </Alert>
      )}

      {/* التبويبات الرئيسية */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="vat-returns">إقرارات ضريبة القيمة المضافة</TabsTrigger>
          <TabsTrigger value="transactions">المعاملات الضريبية</TabsTrigger>
          <TabsTrigger value="zakat">حساب الزكاة</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        {/* تبويب النظرة العامة */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* إقرارات ضريبة القيمة المضافة الحديثة */}
            <Card>
              <CardHeader>
                <CardTitle>إقرارات ضريبة القيمة المضافة الحديثة</CardTitle>
                <CardDescription>آخر 5 إقرارات ضريبية</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {vatReturns.slice(0, 5).map((vatReturn) => (
                    <div key={vatReturn.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{vatReturn.period}</div>
                        <div className="text-sm text-muted-foreground">
                          {vatReturn.periodType === 'monthly' ? 'شهري' : 'ربع سنوي'}
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="font-medium">
                          {vatReturn.netVAT >= 0 ? '+' : ''}{vatReturn.netVAT.toLocaleString('ar-SA')} ريال
                        </div>
                        {getStatusBadge(vatReturn.status)}
                      </div>
                    </div>
                  ))}
                  {vatReturns.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      لا توجد إقرارات ضريبية
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* حسابات الزكاة */}
            <Card>
              <CardHeader>
                <CardTitle>حسابات الزكاة</CardTitle>
                <CardDescription>حسابات الزكاة السنوية</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {zakatCalculations.slice(0, 5).map((zakat) => (
                    <div key={zakat.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">سنة {zakat.year}</div>
                        <div className="text-sm text-muted-foreground">
                          صافي الأصول: {zakat.netZakatableAssets.toLocaleString('ar-SA')} ريال
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-green-600">
                          {zakat.zakatDue.toLocaleString('ar-SA')} ريال
                        </div>
                        <div className="text-sm text-muted-foreground">زكاة مستحقة</div>
                      </div>
                    </div>
                  ))}
                  {zakatCalculations.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      لا توجد حسابات زكاة
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تبويب إقرارات ضريبة القيمة المضافة */}
        <TabsContent value="vat-returns" className="space-y-4">
          {/* إنشاء إقرار جديد */}
          <Card>
            <CardHeader>
              <CardTitle>إنشاء إقرار ضريبي جديد</CardTitle>
              <CardDescription>إنشاء إقرار ضريبة القيمة المضافة لفترة محددة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="period">الفترة (YYYY-MM)</Label>
                  <Input
                    id="period"
                    type="month"
                    value={newReturnPeriod}
                    onChange={(e) => setNewReturnPeriod(e.target.value)}
                    placeholder="2024-01"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="type">نوع الفترة</Label>
                  <Select value={newReturnType} onValueChange={(value: 'monthly' | 'quarterly') => setNewReturnType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">شهري</SelectItem>
                      <SelectItem value="quarterly">ربع سنوي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateVATReturn} disabled={!newReturnPeriod}>
                  <Calculator className="h-4 w-4 ml-2" />
                  إنشاء الإقرار
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* قائمة الإقرارات */}
          <Card>
            <CardHeader>
              <CardTitle>إقرارات ضريبة القيمة المضافة</CardTitle>
              <CardDescription>جميع الإقرارات الضريبية المسجلة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vatReturns.map((vatReturn) => (
                  <div key={vatReturn.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">فترة {vatReturn.period}</h3>
                        <p className="text-sm text-muted-foreground">
                          {vatReturn.periodType === 'monthly' ? 'إقرار شهري' : 'إقرار ربع سنوي'} • 
                          من {vatReturn.startDate} إلى {vatReturn.endDate}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(vatReturn.status)}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExportVATReturn(vatReturn.id)}
                        >
                          <Download className="h-4 w-4 ml-1" />
                          تصدير XML
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">إجمالي المبيعات</div>
                        <div className="font-medium">{vatReturn.totalSales.toLocaleString('ar-SA')} ريال</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">ضريبة المخرجات</div>
                        <div className="font-medium">{vatReturn.outputVAT.toLocaleString('ar-SA')} ريال</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">ضريبة المدخلات</div>
                        <div className="font-medium">{vatReturn.inputVAT.toLocaleString('ar-SA')} ريال</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">صافي الضريبة</div>
                        <div className={`font-medium ${vatReturn.netVAT >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {vatReturn.netVAT >= 0 ? '+' : ''}{vatReturn.netVAT.toLocaleString('ar-SA')} ريال
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {vatReturns.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد إقرارات ضريبية</p>
                    <p className="text-sm">قم بإنشاء إقرار ضريبي جديد للبدء</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* باقي التبويبات ستتم إضافتها */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>المعاملات الضريبية</CardTitle>
              <CardDescription>جميع المعاملات الخاضعة لضريبة القيمة المضافة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>سيتم تطوير هذا القسم قريباً</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zakat">
          <Card>
            <CardHeader>
              <CardTitle>حساب الزكاة</CardTitle>
              <CardDescription>حساب الزكاة السنوية وفقاً للأنظمة السعودية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>سيتم تطوير هذا القسم قريباً</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الضرائب</CardTitle>
              <CardDescription>إعداد بيانات الشركة والمعلومات الضريبية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>سيتم تطوير هذا القسم قريباً</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


