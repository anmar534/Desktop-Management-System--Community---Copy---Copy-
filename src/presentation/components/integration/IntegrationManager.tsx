/**
 * Integration Manager Component
 * Comprehensive UI for managing external data integrations and ERP connectivity
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Progress } from '../ui/progress'
import { Alert, AlertDescription } from '../ui/alert'
import {
  Database,
  Settings,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Search,
  Filter,
  BarChart3,
  Zap,
  Globe,
  Server,
} from 'lucide-react'

import { integrationService } from '@/application/services/integrationService'
import type {
  IntegrationConfig,
  SyncOperation,
  IntegrationStatus,
  IntegrationType,
  SyncType,
} from '../../types/integration'

interface IntegrationManagerProps {
  onIntegrationUpdate?: (integration: IntegrationConfig) => void
  onSyncComplete?: (operation: SyncOperation) => void
  className?: string
}

const IntegrationManager: React.FC<IntegrationManagerProps> = React.memo(
  ({ onIntegrationUpdate, onSyncComplete, className = '' }) => {
    // State management
    const [activeTab, setActiveTab] = useState('overview')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [integrations, setIntegrations] = useState<IntegrationConfig[]>([])
    const [syncOperations, setSyncOperations] = useState<SyncOperation[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<IntegrationStatus | 'all'>('all')
    const [typeFilter, setTypeFilter] = useState<IntegrationType | 'all'>('all')
    const [systemHealth, setSystemHealth] = useState<any>(null)
    const [dataSummary, setDataSummary] = useState<any>(null)

    // Load data
    const loadData = useCallback(async () => {
      try {
        setLoading(true)
        setError(null)

        const [integrationsData, healthData, summaryData] = await Promise.all([
          integrationService.getAllIntegrations(),
          integrationService.getSystemHealth(),
          integrationService.getDataSummary(),
        ])

        setIntegrations(integrationsData)
        setSystemHealth(healthData)
        setDataSummary(summaryData)

        // Load sync operations for active integrations
        if (integrationsData.length > 0) {
          const allSyncOps: SyncOperation[] = []
          for (const integration of integrationsData) {
            const syncHistory = await integrationService.getSyncHistory(integration.id)
            allSyncOps.push(...syncHistory.slice(0, 5)) // Latest 5 operations per integration
          }
          setSyncOperations(
            allSyncOps.sort(
              (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
            ),
          )
        }
      } catch (err) {
        console.error('Error loading integration data:', err)
        setError('فشل في تحميل بيانات التكامل')
      } finally {
        setLoading(false)
      }
    }, [])

    useEffect(() => {
      loadData()
    }, [loadData])

    // Filtered integrations
    const filteredIntegrations = useMemo(() => {
      return integrations.filter((integration) => {
        const matchesSearch =
          !searchTerm ||
          integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          integration.nameEn?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === 'all' || integration.status === statusFilter
        const matchesType = typeFilter === 'all' || integration.type === typeFilter

        return matchesSearch && matchesStatus && matchesType
      })
    }, [integrations, searchTerm, statusFilter, typeFilter])

    // Handle integration actions
    const handleTestConnection = useCallback(
      async (integrationId: string) => {
        try {
          setLoading(true)
          const result = await integrationService.testConnection(integrationId)

          if (result) {
            setError(null)
            await loadData() // Refresh data
          } else {
            setError('فشل في اختبار الاتصال')
          }
        } catch (err) {
          console.error('Error testing connection:', err)
          setError('فشل في اختبار الاتصال')
        } finally {
          setLoading(false)
        }
      },
      [loadData],
    )

    const handleStartSync = useCallback(
      async (integrationId: string, syncType: SyncType = 'manual') => {
        try {
          setLoading(true)
          const operation = await integrationService.startSync(integrationId, syncType)

          setSyncOperations((prev) => [operation, ...prev])
          onSyncComplete?.(operation)

          // Refresh data after a delay to show updated sync status
          setTimeout(loadData, 2000)
        } catch (err) {
          console.error('Error starting sync:', err)
          setError('فشل في بدء عملية المزامنة')
        } finally {
          setLoading(false)
        }
      },
      [loadData, onSyncComplete],
    )

    const handleToggleIntegration = useCallback(
      async (integrationId: string, currentStatus: IntegrationStatus) => {
        try {
          setLoading(true)

          if (currentStatus === 'connected') {
            await integrationService.disconnectIntegration(integrationId)
          } else {
            await integrationService.connectIntegration(integrationId)
          }

          await loadData()
        } catch (err) {
          console.error('Error toggling integration:', err)
          setError('فشل في تغيير حالة التكامل')
        } finally {
          setLoading(false)
        }
      },
      [loadData],
    )

    // Status badge component
    const StatusBadge: React.FC<{ status: IntegrationStatus }> = ({ status }) => {
      const statusConfig = {
        connected: { label: 'متصل', variant: 'default' as const, icon: CheckCircle },
        disconnected: { label: 'غير متصل', variant: 'secondary' as const, icon: AlertCircle },
        syncing: { label: 'يتم المزامنة', variant: 'default' as const, icon: RefreshCw },
        error: { label: 'خطأ', variant: 'destructive' as const, icon: AlertCircle },
        pending: { label: 'في الانتظار', variant: 'secondary' as const, icon: Clock },
        maintenance: { label: 'صيانة', variant: 'secondary' as const, icon: Settings },
      }

      const config = statusConfig[status]
      const Icon = config.icon

      return (
        <Badge variant={config.variant} className="flex items-center gap-1">
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
      )
    }

    // Type icon component
    const TypeIcon: React.FC<{ type: IntegrationType }> = ({ type }) => {
      const iconMap = {
        material_cost_db: Database,
        economic_data: BarChart3,
        government_tender: Globe,
        industry_association: Activity,
        weather_data: Activity,
        accounting_system: Server,
        project_management: Settings,
        crm_system: Database,
        document_management: Database,
        business_intelligence: BarChart3,
      }

      const Icon = iconMap[type] || Database
      return <Icon className="h-4 w-4" />
    }

    if (loading && integrations.length === 0) {
      return (
        <div className={`flex items-center justify-center h-64 ${className}`} dir="rtl">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">جاري تحميل بيانات التكامل...</p>
          </div>
        </div>
      )
    }

    return (
      <div className={`space-y-6 ${className}`} dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">إدارة التكامل والواجهات البرمجية</h2>
            <p className="text-gray-600 mt-1">
              إدارة الاتصالات مع الأنظمة الخارجية ومصادر البيانات
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={loadData} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 ml-2" />
              إضافة تكامل
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* System Health Overview */}
        {systemHealth && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">إجمالي التكاملات</p>
                    <p className="text-2xl font-bold">{systemHealth.totalIntegrations}</p>
                  </div>
                  <Database className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">التكاملات النشطة</p>
                    <p className="text-2xl font-bold">{systemHealth.activeIntegrations}</p>
                  </div>
                  <Zap className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">التكاملات المتصلة</p>
                    <p className="text-2xl font-bold">{systemHealth.connectedIntegrations}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">صحة النظام</p>
                    <p className="text-2xl font-bold">{Math.round(systemHealth.healthScore)}%</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
                <Progress value={systemHealth.healthScore} className="mt-2" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="integrations">التكاملات</TabsTrigger>
            <TabsTrigger value="sync">المزامنة</TabsTrigger>
            <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {dataSummary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">حالة التكاملات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>المتصلة:</span>
                        <span className="font-semibold text-green-600">
                          {dataSummary.integrations.connected}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>النشطة:</span>
                        <span className="font-semibold">{dataSummary.integrations.active}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>الإجمالي:</span>
                        <span className="font-semibold">{dataSummary.integrations.total}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">عمليات المزامنة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>مكتملة:</span>
                        <span className="font-semibold text-green-600">
                          {dataSummary.syncOperations.completed}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>فاشلة:</span>
                        <span className="font-semibold text-red-600">
                          {dataSummary.syncOperations.failed}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>الإجمالي:</span>
                        <span className="font-semibold">{dataSummary.syncOperations.total}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">البيانات المتاحة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>أسعار المواد:</span>
                        <span className="font-semibold">{dataSummary.data.materialCosts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>البيانات الاقتصادية:</span>
                        <span className="font-semibold">{dataSummary.data.economicIndicators}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>المناقصات الحكومية:</span>
                        <span className="font-semibold">{dataSummary.data.governmentTenders}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="البحث في التكاملات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as IntegrationStatus | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">جميع الحالات</option>
                <option value="connected">متصل</option>
                <option value="disconnected">غير متصل</option>
                <option value="error">خطأ</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as IntegrationType | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">جميع الأنواع</option>
                <option value="material_cost_db">قواعد بيانات المواد</option>
                <option value="economic_data">البيانات الاقتصادية</option>
                <option value="government_tender">المناقصات الحكومية</option>
                <option value="accounting_system">أنظمة المحاسبة</option>
              </select>
            </div>

            {/* Integrations List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredIntegrations.map((integration) => (
                <Card key={integration.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TypeIcon type={integration.type} />
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                      </div>
                      <StatusBadge status={integration.status} />
                    </div>
                    {integration.nameEn && <CardDescription>{integration.nameEn}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600">
                        <p>
                          آخر مزامنة: {new Date(integration.lastSync).toLocaleDateString('ar-SA')}
                        </p>
                        <p>
                          المزامنة التلقائية: {integration.settings.autoSync ? 'مفعلة' : 'معطلة'}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTestConnection(integration.id)}
                          disabled={loading}
                        >
                          اختبار الاتصال
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartSync(integration.id)}
                          disabled={loading || integration.status !== 'connected'}
                        >
                          <RefreshCw className="h-4 w-4 ml-1" />
                          مزامنة
                        </Button>
                        <Button
                          size="sm"
                          variant={integration.status === 'connected' ? 'destructive' : 'default'}
                          onClick={() =>
                            handleToggleIntegration(integration.id, integration.status)
                          }
                          disabled={loading}
                        >
                          {integration.status === 'connected' ? 'قطع الاتصال' : 'اتصال'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredIntegrations.length === 0 && (
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">لا توجد تكاملات تطابق المعايير المحددة</p>
              </div>
            )}
          </TabsContent>

          {/* Sync Operations Tab */}
          <TabsContent value="sync" className="space-y-4">
            <div className="space-y-4">
              {syncOperations.map((operation) => (
                <Card key={operation.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        <span className="font-medium">عملية مزامنة {operation.type}</span>
                      </div>
                      <Badge
                        variant={
                          operation.status === 'completed'
                            ? 'default'
                            : operation.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {operation.status === 'completed'
                          ? 'مكتملة'
                          : operation.status === 'failed'
                            ? 'فاشلة'
                            : operation.status === 'running'
                              ? 'قيد التشغيل'
                              : operation.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">السجلات المعالجة</p>
                        <p className="font-semibold">{operation.recordsProcessed}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">نجحت</p>
                        <p className="font-semibold text-green-600">{operation.recordsSuccess}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">فشلت</p>
                        <p className="font-semibold text-red-600">{operation.recordsError}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">المدة</p>
                        <p className="font-semibold">
                          {operation.duration ? `${operation.duration}ث` : '-'}
                        </p>
                      </div>
                    </div>

                    {operation.status === 'running' && (
                      <Progress
                        value={
                          (operation.recordsProcessed /
                            Math.max(operation.summary.totalRecords, 1)) *
                          100
                        }
                        className="mt-3"
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {syncOperations.length === 0 && (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">لا توجد عمليات مزامنة حديثة</p>
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">تحليلات التكامل قيد التطوير</p>
              <p className="text-sm text-gray-500 mt-2">
                ستتوفر قريباً تقارير مفصلة عن أداء التكاملات
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    )
  },
)

IntegrationManager.displayName = 'IntegrationManager'

export default IntegrationManager
