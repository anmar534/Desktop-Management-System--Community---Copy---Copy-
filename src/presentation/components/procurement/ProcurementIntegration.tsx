/**
 * مكون التكامل الشامل للمشتريات
 * يعرض حالة التكامل مع الأنظمة الأخرى ويوفر أدوات الإدارة
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Package,
  Users,
  Calendar,
  BarChart3,
  Settings,
} from 'lucide-react'
import type {
  IntegrationSummary,
  ProjectIntegration,
  FinancialIntegration,
} from '@/services/procurementIntegrationService'
import { procurementIntegrationService } from '@/services/procurementIntegrationService'

interface ProcurementIntegrationProps {
  className?: string
}

export default function ProcurementIntegration({ className }: ProcurementIntegrationProps) {
  const [summary, setSummary] = useState<IntegrationSummary | null>(null)
  const [projectIntegrations, setProjectIntegrations] = useState<ProjectIntegration[]>([])
  const [financialIntegration, setFinancialIntegration] = useState<FinancialIntegration | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ProjectIntegration | null>(null)

  useEffect(() => {
    loadIntegrationData()
  }, [])

  const loadIntegrationData = async () => {
    try {
      setLoading(true)
      const [summaryData, projectsData, financialData] = await Promise.all([
        procurementIntegrationService.getIntegrationSummary(),
        procurementIntegrationService.integrateWithProjects(),
        procurementIntegrationService.integrateWithFinancials(),
      ])

      setSummary(summaryData)
      setProjectIntegrations(projectsData)
      setFinancialIntegration(financialData)
    } catch (error) {
      console.error('خطأ في تحميل بيانات التكامل:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      await procurementIntegrationService.syncAllData()
      await loadIntegrationData()
    } catch (error) {
      console.error('خطأ في المزامنة:', error)
    } finally {
      setSyncing(false)
    }
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getBudgetVarianceColor = (variance: number) => {
    if (variance <= 0) return 'text-green-600'
    if (variance <= 10) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>جاري تحميل بيانات التكامل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">التكامل الشامل للمشتريات</h1>
          <p className="text-muted-foreground">
            ربط أنظمة المشتريات مع إدارة المشاريع والنظام المالي
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSync} disabled={syncing} variant="outline">
            {syncing ? (
              <RefreshCw className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <RefreshCw className="h-4 w-4 ml-2" />
            )}
            {syncing ? 'جاري المزامنة...' : 'مزامنة البيانات'}
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 ml-2" />
            إعدادات التكامل
          </Button>
        </div>
      </div>

      {/* ملخص التكامل */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">المشاريع المتكاملة</p>
                    <p className="text-2xl font-bold">{summary.projectsIntegrated}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">إجمالي الميزانية</p>
                    <p className="text-2xl font-bold">
                      {summary.totalBudgetManaged.toLocaleString()} ريال
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">الموردون النشطون</p>
                    <p className="text-2xl font-bold">{summary.activeSuppliers}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">نقاط الأداء</p>
                    <p
                      className={`text-2xl font-bold ${getPerformanceColor(summary.performanceScore)}`}
                    >
                      {summary.performanceScore.toFixed(1)}%
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* تبويبات التكامل */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="projects">تكامل المشاريع</TabsTrigger>
          <TabsTrigger value="financial">التكامل المالي</TabsTrigger>
          <TabsTrigger value="performance">مؤشرات الأداء</TabsTrigger>
        </TabsList>

        {/* تكامل المشاريع */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تكامل المشاريع مع المشتريات</CardTitle>
              <CardDescription>عرض حالة ربط المشتريات بالمشاريع وتتبع الميزانيات</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectIntegrations.map((project) => (
                  <motion.div
                    key={project.projectId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{project.projectName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {project.procurementItems.length} عنصر مشتريات
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-muted-foreground">الميزانية المتبقية</p>
                        <p
                          className={`font-semibold ${
                            project.remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {project.remainingBudget.toLocaleString()} ريال
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>استخدام الميزانية</span>
                        <span>
                          {project.allocatedBudget > 0
                            ? ((project.spentAmount / project.allocatedBudget) * 100).toFixed(1)
                            : 0}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          project.allocatedBudget > 0
                            ? (project.spentAmount / project.allocatedBudget) * 100
                            : 0
                        }
                        className="h-2"
                      />
                    </div>

                    <div className="flex justify-between items-center mt-3">
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {project.spentAmount.toLocaleString()} ريال مُنفق
                        </Badge>
                        <Badge variant="outline">
                          {project.allocatedBudget.toLocaleString()} ريال مخصص
                        </Badge>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedProject(project)}
                          >
                            عرض التفاصيل
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl" dir="rtl">
                          <DialogHeader>
                            <DialogTitle>تفاصيل مشتريات المشروع</DialogTitle>
                            <DialogDescription>{selectedProject?.projectName}</DialogDescription>
                          </DialogHeader>
                          {selectedProject && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-3 gap-4">
                                <div className="text-center">
                                  <p className="text-sm text-muted-foreground">الميزانية المخصصة</p>
                                  <p className="text-lg font-semibold">
                                    {selectedProject.allocatedBudget.toLocaleString()} ريال
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-sm text-muted-foreground">المبلغ المُنفق</p>
                                  <p className="text-lg font-semibold text-red-600">
                                    {selectedProject.spentAmount.toLocaleString()} ريال
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-sm text-muted-foreground">المتبقي</p>
                                  <p
                                    className={`text-lg font-semibold ${
                                      selectedProject.remainingBudget >= 0
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                    }`}
                                  >
                                    {selectedProject.remainingBudget.toLocaleString()} ريال
                                  </p>
                                </div>
                              </div>

                              <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3">عناصر المشتريات</h4>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                  {selectedProject.procurementItems.map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex justify-between items-center p-2 border rounded"
                                    >
                                      <div>
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {item.supplierName} • {item.category}
                                        </p>
                                      </div>
                                      <div className="text-left">
                                        <p className="font-semibold">
                                          {item.totalPrice.toLocaleString()} ريال
                                        </p>
                                        <Badge
                                          variant={
                                            item.status === 'received'
                                              ? 'default'
                                              : item.status === 'ordered'
                                                ? 'secondary'
                                                : item.status === 'pending'
                                                  ? 'outline'
                                                  : 'destructive'
                                          }
                                        >
                                          {item.status === 'received'
                                            ? 'مستلم'
                                            : item.status === 'ordered'
                                              ? 'مطلوب'
                                              : item.status === 'pending'
                                                ? 'معلق'
                                                : 'ملغي'}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* التكامل المالي */}
        <TabsContent value="financial" className="space-y-4">
          {financialIntegration && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>ملخص الميزانية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>إجمالي ميزانية المشتريات</span>
                      <span className="font-semibold">
                        {financialIntegration.totalProcurementBudget.toLocaleString()} ريال
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>المبلغ المُنفق</span>
                      <span className="font-semibold text-red-600">
                        {financialIntegration.totalSpent.toLocaleString()} ريال
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>المبلغ المُلتزم به</span>
                      <span className="font-semibold text-yellow-600">
                        {financialIntegration.totalCommitted.toLocaleString()} ريال
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>الميزانية المتاحة</span>
                      <span
                        className={`font-semibold ${
                          financialIntegration.availableBudget >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {financialIntegration.availableBudget.toLocaleString()} ريال
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>معدل استخدام الميزانية</span>
                      <span
                        className={getBudgetVarianceColor(
                          financialIntegration.budgetUtilization - 100,
                        )}
                      >
                        {financialIntegration.budgetUtilization.toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={Math.min(100, financialIntegration.budgetUtilization)}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>تحليل الفئات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {financialIntegration.categoryBreakdown.slice(0, 5).map((category) => (
                      <div key={category.category} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{category.category}</span>
                          <span>{category.utilizationRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={Math.min(100, category.utilizationRate)} className="h-1" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* مؤشرات الأداء */}
        <TabsContent value="performance" className="space-y-4">
          {summary && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>مؤشرات الأداء الرئيسية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>نقاط الأداء الإجمالية</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold ${getPerformanceColor(summary.performanceScore)}`}
                      >
                        {summary.performanceScore.toFixed(1)}%
                      </span>
                      {summary.performanceScore >= 80 ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : summary.performanceScore >= 60 ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>انحراف الميزانية</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold ${getBudgetVarianceColor(summary.budgetVariance)}`}
                      >
                        {summary.budgetVariance > 0 ? '+' : ''}
                        {summary.budgetVariance.toFixed(1)}%
                      </span>
                      {summary.budgetVariance <= 0 ? (
                        <TrendingDown className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingUp className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>الأوامر المعلقة</span>
                    <span className="font-bold">{summary.pendingOrders}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>الأوامر المكتملة</span>
                    <span className="font-bold text-green-600">{summary.completedOrders}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>معلومات المزامنة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>آخر مزامنة</span>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(summary.lastSyncDate).toLocaleString('ar-SA')}
                      </span>
                    </div>
                  </div>

                  <Button onClick={handleSync} disabled={syncing} className="w-full">
                    {syncing ? (
                      <RefreshCw className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 ml-2" />
                    )}
                    {syncing ? 'جاري المزامنة...' : 'مزامنة الآن'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
