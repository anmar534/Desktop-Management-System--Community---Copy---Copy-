/**
 * مكون مقارنة الربحية
 * Profitability Comparison Component
 *
 * مقارنة تفاعلية لربحية المشاريع والعملاء مع إمكانيات التصفية والتصدير
 * Interactive comparison of project and client profitability with filtering and export capabilities
 */

import type React from 'react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  Download,
  Filter,
  Search,
  Plus,
  Minus,
} from 'lucide-react'
import type { ProfitabilityComparison } from '@/application/services/profitabilityAnalysisService'
import { ProfitabilityAnalysisService } from '@/application/services/profitabilityAnalysisService'

interface ProfitabilityComparisonProps {
  className?: string
}

const profitabilityService = new ProfitabilityAnalysisService()

export const ProfitabilityComparisonComponent: React.FC<ProfitabilityComparisonProps> = ({
  className,
}) => {
  const [loading, setLoading] = useState(false)
  const [comparisonType, setComparisonType] = useState<'projects' | 'clients'>('projects')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [availableItems, setAvailableItems] = useState<any[]>([])
  const [comparison, setComparison] = useState<ProfitabilityComparison | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // تحميل العناصر المتاحة
  useEffect(() => {
    loadAvailableItems()
  }, [comparisonType])

  const loadAvailableItems = async () => {
    try {
      setLoading(true)

      if (comparisonType === 'projects') {
        const projects = await profitabilityService.getMostProfitableProjects(50)
        setAvailableItems(
          projects.map((p) => ({
            id: p.projectId,
            name: p.projectName,
            nameEn: p.projectNameEn,
            revenue: p.totalRevenue,
            profit: p.netProfit,
            margin: p.netProfitMargin,
          })),
        )
      } else {
        const clients = await profitabilityService.getMostProfitableClients(50)
        setAvailableItems(
          clients.map((c) => ({
            id: c.clientId,
            name: c.clientName,
            nameEn: c.clientNameEn,
            revenue: c.totalRevenue,
            profit: c.totalProfit,
            margin: c.averageProfitMargin,
          })),
        )
      }
    } catch (error) {
      console.error('Error loading available items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleItemToggle = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
    )
  }

  const handleCreateComparison = async () => {
    if (selectedItems.length < 2) {
      alert('يرجى اختيار عنصرين على الأقل للمقارنة')
      return
    }

    try {
      setLoading(true)
      const newComparison = await profitabilityService.createProfitabilityComparison(
        comparisonType,
        selectedItems,
      )
      setComparison(newComparison)
    } catch (error) {
      console.error('Error creating comparison:', error)
      alert('فشل في إنشاء المقارنة')
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = availableItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nameEn?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // بيانات المخطط الشعاعي
  const radarData =
    comparison?.items.slice(0, 5).map((item) => ({
      name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
      revenue: (item.revenue / 1000000) * 100, // تحويل إلى نسبة مئوية
      profit: (item.profit / 1000000) * 100,
      margin: item.profitMargin,
      roi: item.roi,
    })) || []

  // بيانات المخطط العمودي
  const barData =
    comparison?.items.map((item) => ({
      name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
      revenue: item.revenue,
      profit: item.profit,
      margin: item.profitMargin,
      roi: item.roi,
    })) || []

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">مقارنة الربحية</h1>
          <p className="text-muted-foreground">مقارنة تفاعلية لربحية المشاريع والعملاء</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateComparison} disabled={selectedItems.length < 2 || loading}>
            <BarChart3 className="h-4 w-4 ml-2" />
            إنشاء مقارنة
          </Button>
          {comparison && (
            <Button variant="outline">
              <Download className="h-4 w-4 ml-2" />
              تصدير المقارنة
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* لوحة التحكم */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>إعدادات المقارنة</CardTitle>
            <CardDescription>اختر العناصر للمقارنة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* نوع المقارنة */}
            <div className="space-y-2">
              <Label>نوع المقارنة</Label>
              <Select
                value={comparisonType}
                onValueChange={(value: 'projects' | 'clients') => setComparisonType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="projects">المشاريع</SelectItem>
                  <SelectItem value="clients">العملاء</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* البحث */}
            <div className="space-y-2">
              <Label>البحث</Label>
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`البحث في ${comparisonType === 'projects' ? 'المشاريع' : 'العملاء'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            {/* قائمة العناصر */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>العناصر المتاحة</Label>
                <Badge variant="secondary">{selectedItems.length} محدد</Badge>
              </div>
              <div className="max-h-96 overflow-y-auto space-y-2 border rounded-md p-2">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-2 space-x-reverse p-2 hover:bg-muted rounded"
                  >
                    <Checkbox
                      id={item.id}
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => handleItemToggle(item.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <label htmlFor={item.id} className="text-sm font-medium cursor-pointer">
                        {item.name}
                      </label>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{item.revenue.toLocaleString('ar-SA')} ر.س</span>
                        <span>{item.margin.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* معلومات المقارنة */}
            {comparison && (
              <div className="space-y-2 pt-4 border-t">
                <Label>معلومات المقارنة</Label>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>إجمالي الإيرادات:</span>
                    <span className="font-medium">
                      {comparison.totalRevenue.toLocaleString('ar-SA')} ر.س
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>إجمالي الأرباح:</span>
                    <span className="font-medium text-green-600">
                      {comparison.totalProfit.toLocaleString('ar-SA')} ر.س
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>متوسط الهامش:</span>
                    <span className="font-medium">
                      {comparison.averageProfitMargin.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>الأفضل أداءً:</span>
                    <span className="font-medium text-green-600">{comparison.bestPerformer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الأضعف أداءً:</span>
                    <span className="font-medium text-red-600">{comparison.worstPerformer}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* نتائج المقارنة */}
        <div className="lg:col-span-2 space-y-6">
          {comparison ? (
            <>
              {/* مخطط المقارنة العمودي */}
              <Card>
                <CardHeader>
                  <CardTitle>مقارنة الإيرادات والأرباح</CardTitle>
                  <CardDescription>مقارنة مرئية للإيرادات والأرباح</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name) => [
                          name === 'revenue' || name === 'profit'
                            ? `${Number(value).toLocaleString('ar-SA')} ر.س`
                            : `${Number(value).toFixed(1)}%`,
                          name === 'revenue'
                            ? 'الإيرادات'
                            : name === 'profit'
                              ? 'الأرباح'
                              : name === 'margin'
                                ? 'هامش الربح'
                                : 'العائد على الاستثمار',
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="revenue" fill="#3b82f6" name="الإيرادات" />
                      <Bar dataKey="profit" fill="#10b981" name="الأرباح" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* المخطط الشعاعي */}
              <Card>
                <CardHeader>
                  <CardTitle>تحليل الأداء الشامل</CardTitle>
                  <CardDescription>مقارنة متعددة الأبعاد للأداء المالي</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" />
                      <PolarRadiusAxis />
                      <Radar
                        name="الإيرادات"
                        dataKey="revenue"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.1}
                      />
                      <Radar
                        name="الأرباح"
                        dataKey="profit"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.1}
                      />
                      <Radar
                        name="هامش الربح"
                        dataKey="margin"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.1}
                      />
                      <Radar
                        name="العائد على الاستثمار"
                        dataKey="roi"
                        stroke="#ef4444"
                        fill="#ef4444"
                        fillOpacity={0.1}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* جدول التفاصيل */}
              <Card>
                <CardHeader>
                  <CardTitle>تفاصيل المقارنة</CardTitle>
                  <CardDescription>جدول مفصل بجميع المؤشرات المالية</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right p-2">الترتيب</th>
                          <th className="text-right p-2">الاسم</th>
                          <th className="text-right p-2">الإيرادات</th>
                          <th className="text-right p-2">التكاليف</th>
                          <th className="text-right p-2">الأرباح</th>
                          <th className="text-right p-2">هامش الربح</th>
                          <th className="text-right p-2">العائد على الاستثمار</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparison.items.map((item, index) => (
                          <tr key={item.id} className="border-b hover:bg-muted/50">
                            <td className="p-2">
                              <Badge variant={index < 3 ? 'default' : 'secondary'}>
                                #{item.rank}
                              </Badge>
                            </td>
                            <td className="p-2 font-medium">{item.name}</td>
                            <td className="p-2">{item.revenue.toLocaleString('ar-SA')} ر.س</td>
                            <td className="p-2">{item.costs.toLocaleString('ar-SA')} ر.س</td>
                            <td className="p-2 text-green-600 font-medium">
                              {item.profit.toLocaleString('ar-SA')} ر.س
                            </td>
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <span>{item.profitMargin.toFixed(1)}%</span>
                                {item.profitMargin >= 20 ? (
                                  <TrendingUp className="h-4 w-4 text-green-500" />
                                ) : item.profitMargin >= 10 ? (
                                  <TrendingUp className="h-4 w-4 text-yellow-500" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                            </td>
                            <td className="p-2">{item.roi.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-96">
                <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا توجد مقارنة</h3>
                <p className="text-muted-foreground text-center mb-4">
                  اختر عنصرين أو أكثر من القائمة الجانبية وانقر على "إنشاء مقارنة" لبدء المقارنة
                </p>
                <Button onClick={handleCreateComparison} disabled={selectedItems.length < 2}>
                  إنشاء مقارنة
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
