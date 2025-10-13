/**
 * Integration Service
 * Comprehensive service for external data integration and ERP connectivity
 */

import { asyncStorage } from '../utils/storage'
import type {
  IntegrationConfig,
  IntegrationService,
  SyncOperation,
  SyncType,
  MaterialCostData,
  EconomicData,
  EconomicIndicator,
  GovernmentTenderData,
  IntegrationAnalytics,
  ValidationResult,
  SyncError,
  SyncSummary,
  IntegrationStatus
} from '../types/integration'

class IntegrationServiceImpl implements IntegrationService {
  private readonly STORAGE_KEYS = {
    INTEGRATIONS: 'integrations',
    SYNC_OPERATIONS: 'sync_operations',
    MATERIAL_COSTS: 'material_costs_data',
    ECONOMIC_DATA: 'economic_data',
    GOVERNMENT_TENDERS: 'government_tenders_data',
    INTEGRATION_ANALYTICS: 'integration_analytics'
  }

  // Configuration Management
  async createIntegration(config: Omit<IntegrationConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<IntegrationConfig> {
    try {
      const integrations = await asyncStorage.getItem(this.STORAGE_KEYS.INTEGRATIONS, [])
      
      const newIntegration: IntegrationConfig = {
        ...config,
        id: `integration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      integrations.push(newIntegration)
      await asyncStorage.setItem(this.STORAGE_KEYS.INTEGRATIONS, integrations)

      return newIntegration
    } catch (error) {
      console.error('Error creating integration:', error)
      throw new Error('Failed to create integration')
    }
  }

  async updateIntegration(id: string, updates: Partial<IntegrationConfig>): Promise<IntegrationConfig> {
    try {
      const integrations = await asyncStorage.getItem(this.STORAGE_KEYS.INTEGRATIONS, [])
      const index = integrations.findIndex((integration: IntegrationConfig) => integration.id === id)
      
      if (index === -1) {
        throw new Error(`Integration with id ${id} not found`)
      }

      const updatedIntegration = {
        ...integrations[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }

      integrations[index] = updatedIntegration
      await asyncStorage.setItem(this.STORAGE_KEYS.INTEGRATIONS, integrations)

      return updatedIntegration
    } catch (error) {
      console.error('Error updating integration:', error)
      if (error instanceof Error && error.message.includes('not found')) {
        throw error
      }
      throw new Error('Failed to update integration')
    }
  }

  async deleteIntegration(id: string): Promise<void> {
    try {
      const integrations = await asyncStorage.getItem(this.STORAGE_KEYS.INTEGRATIONS, [])
      const filteredIntegrations = integrations.filter((integration: IntegrationConfig) => integration.id !== id)
      
      if (filteredIntegrations.length === integrations.length) {
        throw new Error(`Integration with id ${id} not found`)
      }

      await asyncStorage.setItem(this.STORAGE_KEYS.INTEGRATIONS, filteredIntegrations)
    } catch (error) {
      console.error('Error deleting integration:', error)
      if (error instanceof Error && error.message.includes('not found')) {
        throw error
      }
      throw new Error('Failed to delete integration')
    }
  }

  async getIntegration(id: string): Promise<IntegrationConfig | null> {
    try {
      const integrations = await asyncStorage.getItem(this.STORAGE_KEYS.INTEGRATIONS, [])
      return integrations.find((integration: IntegrationConfig) => integration.id === id) || null
    } catch (error) {
      console.error('Error getting integration:', error)
      throw new Error('Failed to get integration')
    }
  }

  async getAllIntegrations(): Promise<IntegrationConfig[]> {
    try {
      return await asyncStorage.getItem(this.STORAGE_KEYS.INTEGRATIONS, [])
    } catch (error) {
      console.error('Error getting all integrations:', error)
      throw new Error('Failed to get integrations')
    }
  }

  // Connection Management
  async testConnection(id: string): Promise<boolean> {
    try {
      const integration = await this.getIntegration(id)
      if (!integration) {
        throw new Error(`Integration with id ${id} not found`)
      }

      // Simulate connection test based on integration type
      const testResult = await this.performConnectionTest(integration)
      
      // Update integration status based on test result
      await this.updateIntegration(id, {
        status: testResult ? 'connected' : 'error',
        lastSync: new Date().toISOString()
      })

      return testResult
    } catch (error) {
      console.error('Error testing connection:', error)
      throw new Error('Failed to test connection')
    }
  }

  async connectIntegration(id: string): Promise<void> {
    try {
      const integration = await this.getIntegration(id)
      if (!integration) {
        throw new Error(`Integration with id ${id} not found`)
      }

      // Simulate connection process
      await this.establishConnection(integration)
      
      await this.updateIntegration(id, {
        status: 'connected',
        isActive: true,
        lastSync: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error connecting integration:', error)
      throw new Error('Failed to connect integration')
    }
  }

  async disconnectIntegration(id: string): Promise<void> {
    try {
      const integration = await this.getIntegration(id)
      if (!integration) {
        throw new Error(`Integration with id ${id} not found`)
      }

      await this.updateIntegration(id, {
        status: 'disconnected',
        isActive: false
      })
    } catch (error) {
      console.error('Error disconnecting integration:', error)
      throw new Error('Failed to disconnect integration')
    }
  }

  // Sync Operations
  async startSync(id: string, type: SyncType): Promise<SyncOperation> {
    try {
      const integration = await this.getIntegration(id)
      if (!integration) {
        throw new Error(`Integration with id ${id} not found`)
      }

      if (integration.status !== 'connected') {
        throw new Error('Integration must be connected to start sync')
      }

      const syncOperation: SyncOperation = {
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        integrationId: id,
        type,
        direction: 'import',
        status: 'running',
        startTime: new Date().toISOString(),
        recordsProcessed: 0,
        recordsSuccess: 0,
        recordsError: 0,
        errors: [],
        summary: {
          totalRecords: 0,
          newRecords: 0,
          updatedRecords: 0,
          deletedRecords: 0,
          skippedRecords: 0,
          errorRecords: 0,
          dataQualityScore: 0,
          recommendations: []
        }
      }

      // Save sync operation
      const syncOperations = await asyncStorage.getItem(this.STORAGE_KEYS.SYNC_OPERATIONS, [])
      syncOperations.push(syncOperation)
      await asyncStorage.setItem(this.STORAGE_KEYS.SYNC_OPERATIONS, syncOperations)

      // Update integration status
      await this.updateIntegration(id, { status: 'syncing' })

      // Start sync process (simulate async operation)
      this.performSync(syncOperation, integration)

      return syncOperation
    } catch (error) {
      console.error('Error starting sync:', error)
      if (error instanceof Error && error.message.includes('must be connected')) {
        throw error
      }
      throw new Error('Failed to start sync operation')
    }
  }

  async stopSync(operationId: string): Promise<void> {
    try {
      const syncOperations = await asyncStorage.getItem(this.STORAGE_KEYS.SYNC_OPERATIONS, [])
      const index = syncOperations.findIndex((op: SyncOperation) => op.id === operationId)
      
      if (index === -1) {
        throw new Error(`Sync operation with id ${operationId} not found`)
      }

      syncOperations[index] = {
        ...syncOperations[index],
        status: 'cancelled',
        endTime: new Date().toISOString()
      }

      await asyncStorage.setItem(this.STORAGE_KEYS.SYNC_OPERATIONS, syncOperations)
    } catch (error) {
      console.error('Error stopping sync:', error)
      throw new Error('Failed to stop sync operation')
    }
  }

  async getSyncStatus(operationId: string): Promise<SyncOperation> {
    try {
      const syncOperations = await asyncStorage.getItem(this.STORAGE_KEYS.SYNC_OPERATIONS, [])
      const operation = syncOperations.find((op: SyncOperation) => op.id === operationId)
      
      if (!operation) {
        throw new Error(`Sync operation with id ${operationId} not found`)
      }

      return operation
    } catch (error) {
      console.error('Error getting sync status:', error)
      throw new Error('Failed to get sync status')
    }
  }

  async getSyncHistory(integrationId: string): Promise<SyncOperation[]> {
    try {
      const syncOperations = await asyncStorage.getItem(this.STORAGE_KEYS.SYNC_OPERATIONS, [])
      return syncOperations
        .filter((op: SyncOperation) => op.integrationId === integrationId)
        .sort((a: SyncOperation, b: SyncOperation) => 
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        )
    } catch (error) {
      console.error('Error getting sync history:', error)
      throw new Error('Failed to get sync history')
    }
  }

  // Data Access Methods
  async getMaterialCosts(filters?: any): Promise<MaterialCostData[]> {
    try {
      const materialCosts = await asyncStorage.getItem(this.STORAGE_KEYS.MATERIAL_COSTS, [])
      
      if (!filters) {
        return materialCosts
      }

      return materialCosts.filter((cost: MaterialCostData) => {
        return Object.entries(filters).every(([key, value]) => {
          if (key === 'category' && value) {
            return cost.category.toLowerCase().includes(value.toLowerCase())
          }
          if (key === 'region' && value) {
            return cost.region.toLowerCase().includes(value.toLowerCase())
          }
          if (key === 'dateFrom' && value) {
            return new Date(cost.effectiveDate) >= new Date(value)
          }
          if (key === 'dateTo' && value) {
            return new Date(cost.effectiveDate) <= new Date(value)
          }
          return true
        })
      })
    } catch (error) {
      console.error('Error getting material costs:', error)
      throw new Error('Failed to get material costs')
    }
  }

  async getEconomicData(indicator: EconomicIndicator, period?: string): Promise<EconomicData[]> {
    try {
      const economicData = await asyncStorage.getItem(this.STORAGE_KEYS.ECONOMIC_DATA, [])
      
      return economicData.filter((data: EconomicData) => {
        const matchesIndicator = data.indicator === indicator
        const matchesPeriod = !period || data.period === period
        return matchesIndicator && matchesPeriod
      })
    } catch (error) {
      console.error('Error getting economic data:', error)
      throw new Error('Failed to get economic data')
    }
  }

  async getGovernmentTenders(filters?: any): Promise<GovernmentTenderData[]> {
    try {
      const tenders = await asyncStorage.getItem(this.STORAGE_KEYS.GOVERNMENT_TENDERS, [])
      
      if (!filters) {
        return tenders
      }

      return tenders.filter((tender: GovernmentTenderData) => {
        return Object.entries(filters).every(([key, value]) => {
          if (key === 'status' && value) {
            return tender.status === value
          }
          if (key === 'category' && value) {
            return tender.category.toLowerCase().includes(value.toLowerCase())
          }
          if (key === 'agency' && value) {
            return tender.agency.toLowerCase().includes(value.toLowerCase())
          }
          if (key === 'minValue' && value) {
            return tender.estimatedValue >= value
          }
          if (key === 'maxValue' && value) {
            return tender.estimatedValue <= value
          }
          return true
        })
      })
    } catch (error) {
      console.error('Error getting government tenders:', error)
      throw new Error('Failed to get government tenders')
    }
  }

  // Analytics
  async getIntegrationAnalytics(integrationId: string, period: string): Promise<IntegrationAnalytics> {
    try {
      const analytics = await asyncStorage.getItem(this.STORAGE_KEYS.INTEGRATION_ANALYTICS, {})
      const key = `${integrationId}_${period}`
      
      if (analytics[key]) {
        return analytics[key]
      }

      // Generate analytics if not cached
      const generatedAnalytics = await this.generateIntegrationAnalytics(integrationId, period)
      analytics[key] = generatedAnalytics
      await asyncStorage.setItem(this.STORAGE_KEYS.INTEGRATION_ANALYTICS, analytics)

      return generatedAnalytics
    } catch (error) {
      console.error('Error getting integration analytics:', error)
      throw new Error('Failed to get integration analytics')
    }
  }

  async getSystemHealth(): Promise<any> {
    try {
      const integrations = await this.getAllIntegrations()
      const activeIntegrations = integrations.filter(i => i.isActive)
      const connectedIntegrations = integrations.filter(i => i.status === 'connected')
      
      return {
        totalIntegrations: integrations.length,
        activeIntegrations: activeIntegrations.length,
        connectedIntegrations: connectedIntegrations.length,
        healthScore: connectedIntegrations.length / Math.max(activeIntegrations.length, 1) * 100,
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error getting system health:', error)
      throw new Error('Failed to get system health')
    }
  }

  // Utilities
  async validateConfiguration(config: IntegrationConfig): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    // Validate required fields
    if (!config.name || config.name.trim() === '') {
      errors.push('اسم التكامل مطلوب')
    }

    if (!config.endpoint || config.endpoint.trim() === '') {
      errors.push('نقطة النهاية (Endpoint) مطلوبة')
    }

    if (!config.type) {
      errors.push('نوع التكامل مطلوب')
    }

    // Validate endpoint URL format
    if (config.endpoint && !this.isValidUrl(config.endpoint)) {
      errors.push('تنسيق نقطة النهاية غير صحيح')
    }

    // Validate sync interval
    if (config.settings.syncInterval < 1) {
      errors.push('فترة المزامنة يجب أن تكون أكبر من 0')
    }

    if (config.settings.syncInterval < 5) {
      warnings.push('فترة المزامنة قصيرة جداً، قد تؤثر على الأداء')
    }

    // Validate timeout
    if (config.settings.timeout < 10) {
      warnings.push('مهلة الاتصال قصيرة، قد تسبب فشل في العمليات')
    }

    // Suggestions
    if (!config.settings.autoSync) {
      suggestions.push('تفعيل المزامنة التلقائية لضمان تحديث البيانات')
    }

    if (!config.settings.notificationSettings.onError) {
      suggestions.push('تفعيل إشعارات الأخطاء لمراقبة أفضل')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    }
  }

  async exportConfiguration(id: string): Promise<string> {
    try {
      const integration = await this.getIntegration(id)
      if (!integration) {
        throw new Error(`Integration with id ${id} not found`)
      }

      // Remove sensitive data before export
      const exportData = {
        ...integration,
        credentials: undefined,
        apiKey: undefined
      }

      return JSON.stringify(exportData, null, 2)
    } catch (error) {
      console.error('Error exporting configuration:', error)
      throw new Error('Failed to export configuration')
    }
  }

  async importConfiguration(configData: string): Promise<IntegrationConfig> {
    try {
      const config = JSON.parse(configData)
      
      // Validate imported configuration
      const validation = await this.validateConfiguration(config)
      if (!validation.isValid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`)
      }

      // Create new integration from imported config
      const { id, createdAt, updatedAt, ...importConfig } = config
      return await this.createIntegration(importConfig)
    } catch (error) {
      console.error('Error importing configuration:', error)
      throw new Error('Failed to import configuration')
    }
  }

  // Private helper methods
  private async performConnectionTest(integration: IntegrationConfig): Promise<boolean> {
    // Simulate connection test based on integration type
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simulate success rate based on configuration quality
    const hasCredentials = integration.credentials || integration.apiKey
    const hasValidEndpoint = this.isValidUrl(integration.endpoint)
    
    return hasCredentials && hasValidEndpoint && Math.random() > 0.1
  }

  private async establishConnection(integration: IntegrationConfig): Promise<void> {
    // Simulate connection establishment
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  private async performSync(syncOperation: SyncOperation, integration: IntegrationConfig): Promise<void> {
    // Simulate sync process
    setTimeout(async () => {
      try {
        const totalRecords = Math.floor(Math.random() * 1000) + 100
        const successRecords = Math.floor(totalRecords * 0.95)
        const errorRecords = totalRecords - successRecords

        const completedOperation: SyncOperation = {
          ...syncOperation,
          status: 'completed',
          endTime: new Date().toISOString(),
          duration: Math.floor(Math.random() * 300) + 30,
          recordsProcessed: totalRecords,
          recordsSuccess: successRecords,
          recordsError: errorRecords,
          summary: {
            totalRecords,
            newRecords: Math.floor(successRecords * 0.3),
            updatedRecords: Math.floor(successRecords * 0.6),
            deletedRecords: Math.floor(successRecords * 0.1),
            skippedRecords: 0,
            errorRecords,
            dataQualityScore: Math.floor(Math.random() * 20) + 80,
            recommendations: [
              'تحسين جودة البيانات المصدرية',
              'مراجعة إعدادات التصفية',
              'تحديث معايير التحقق'
            ]
          }
        }

        // Update sync operation
        const syncOperations = await asyncStorage.getItem(this.STORAGE_KEYS.SYNC_OPERATIONS, [])
        const index = syncOperations.findIndex((op: SyncOperation) => op.id === syncOperation.id)
        if (index !== -1) {
          syncOperations[index] = completedOperation
          await asyncStorage.setItem(this.STORAGE_KEYS.SYNC_OPERATIONS, syncOperations)
        }

        // Update integration status
        await this.updateIntegration(integration.id, {
          status: 'connected',
          lastSync: new Date().toISOString()
        })

      } catch (error) {
        console.error('Error in sync process:', error)
      }
    }, 5000)
  }

  private async generateIntegrationAnalytics(integrationId: string, period: string): Promise<IntegrationAnalytics> {
    const syncHistory = await this.getSyncHistory(integrationId)
    
    return {
      integrationId,
      period,
      metrics: {
        totalSyncs: syncHistory.length,
        successfulSyncs: syncHistory.filter(s => s.status === 'completed').length,
        failedSyncs: syncHistory.filter(s => s.status === 'failed').length,
        averageSyncTime: syncHistory.reduce((acc, s) => acc + (s.duration || 0), 0) / syncHistory.length || 0,
        dataVolume: syncHistory.reduce((acc, s) => acc + s.recordsProcessed, 0),
        uptime: 95.5,
        errorRate: 0.05
      },
      performance: {
        averageResponseTime: 1200,
        throughput: 150,
        peakUsage: 80,
        resourceUtilization: 65,
        bottlenecks: ['شبكة الاتصال', 'معالجة البيانات']
      },
      dataQuality: {
        completeness: 92,
        accuracy: 88,
        consistency: 95,
        timeliness: 90,
        validity: 94,
        issues: [
          {
            type: 'missing',
            field: 'materialCode',
            count: 15,
            severity: 'medium',
            description: 'رموز المواد مفقودة في بعض السجلات'
          }
        ]
      },
      trends: [
        {
          metric: 'dataVolume',
          trend: 'increasing',
          changePercentage: 15.5,
          period: 'last_month',
          forecast: 1250
        }
      ]
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  // Additional utility methods for data seeding and testing
  async seedSampleData(): Promise<void> {
    try {
      // Seed sample material costs
      const sampleMaterialCosts: MaterialCostData[] = [
        {
          id: 'mat_001',
          materialCode: 'CEMENT_OPC_42.5',
          materialName: 'أسمنت بورتلاندي عادي 42.5',
          materialNameEn: 'Ordinary Portland Cement 42.5',
          category: 'cement',
          unit: 'ton',
          unitPrice: 450,
          currency: 'SAR',
          region: 'Riyadh',
          supplier: 'Saudi Cement Company',
          effectiveDate: new Date().toISOString(),
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          source: 'supplier_api',
          lastUpdated: new Date().toISOString(),
          priceHistory: [
            {
              date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              price: 430,
              currency: 'SAR',
              source: 'supplier_api',
              changePercentage: 4.65
            }
          ]
        },
        {
          id: 'mat_002',
          materialCode: 'STEEL_REBAR_16MM',
          materialName: 'حديد تسليح 16 مم',
          materialNameEn: 'Steel Rebar 16mm',
          category: 'steel',
          unit: 'ton',
          unitPrice: 2850,
          currency: 'SAR',
          region: 'Riyadh',
          supplier: 'Hadeed Steel',
          effectiveDate: new Date().toISOString(),
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          source: 'market_data',
          lastUpdated: new Date().toISOString(),
          priceHistory: [
            {
              date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              price: 2780,
              currency: 'SAR',
              source: 'market_data',
              changePercentage: 2.52
            }
          ]
        }
      ]

      await asyncStorage.setItem(this.STORAGE_KEYS.MATERIAL_COSTS, sampleMaterialCosts)

      // Seed sample economic data
      const sampleEconomicData: EconomicData[] = [
        {
          id: 'econ_001',
          indicator: 'inflation_rate',
          value: 2.3,
          unit: 'percentage',
          period: '2024-Q3',
          region: 'Saudi Arabia',
          source: 'SAMA',
          lastUpdated: new Date().toISOString(),
          forecast: [
            {
              period: '2024-Q4',
              forecastValue: 2.1,
              confidence: 85,
              methodology: 'econometric_model'
            }
          ]
        },
        {
          id: 'econ_002',
          indicator: 'construction_index',
          value: 108.5,
          unit: 'index',
          period: '2024-Q3',
          region: 'Saudi Arabia',
          source: 'GASTAT',
          lastUpdated: new Date().toISOString(),
          forecast: [
            {
              period: '2024-Q4',
              forecastValue: 110.2,
              confidence: 78,
              methodology: 'trend_analysis'
            }
          ]
        }
      ]

      await asyncStorage.setItem(this.STORAGE_KEYS.ECONOMIC_DATA, sampleEconomicData)

      // Seed sample government tenders
      const sampleTenders: GovernmentTenderData[] = [
        {
          id: 'tender_001',
          tenderNumber: 'MOH-2024-001',
          title: 'إنشاء مستشفى عام بمدينة الرياض',
          titleEn: 'Construction of General Hospital in Riyadh',
          description: 'مشروع إنشاء مستشفى عام بسعة 300 سرير',
          agency: 'وزارة الصحة',
          category: 'healthcare',
          estimatedValue: 150000000,
          currency: 'SAR',
          publishDate: new Date().toISOString(),
          submissionDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          openingDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'open',
          location: 'Riyadh',
          requirements: ['تصنيف مقاولين درجة أولى', 'خبرة في المشاريع الصحية'],
          documents: [
            {
              id: 'doc_001',
              name: 'المواصفات الفنية',
              type: 'pdf',
              url: 'https://example.com/specs.pdf',
              size: 2048000
            }
          ],
          source: 'etimad',
          lastUpdated: new Date().toISOString()
        }
      ]

      await asyncStorage.setItem(this.STORAGE_KEYS.GOVERNMENT_TENDERS, sampleTenders)

      console.log('Sample data seeded successfully')
    } catch (error) {
      console.error('Error seeding sample data:', error)
      throw new Error('Failed to seed sample data')
    }
  }

  async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        asyncStorage.removeItem(this.STORAGE_KEYS.INTEGRATIONS),
        asyncStorage.removeItem(this.STORAGE_KEYS.SYNC_OPERATIONS),
        asyncStorage.removeItem(this.STORAGE_KEYS.MATERIAL_COSTS),
        asyncStorage.removeItem(this.STORAGE_KEYS.ECONOMIC_DATA),
        asyncStorage.removeItem(this.STORAGE_KEYS.GOVERNMENT_TENDERS),
        asyncStorage.removeItem(this.STORAGE_KEYS.INTEGRATION_ANALYTICS)
      ])
      console.log('All integration data cleared successfully')
    } catch (error) {
      console.error('Error clearing data:', error)
      throw new Error('Failed to clear integration data')
    }
  }

  async getDataSummary(): Promise<any> {
    try {
      const [
        integrations,
        syncOperations,
        materialCosts,
        economicData,
        tenders
      ] = await Promise.all([
        this.getAllIntegrations(),
        asyncStorage.getItem(this.STORAGE_KEYS.SYNC_OPERATIONS, []),
        asyncStorage.getItem(this.STORAGE_KEYS.MATERIAL_COSTS, []),
        asyncStorage.getItem(this.STORAGE_KEYS.ECONOMIC_DATA, []),
        asyncStorage.getItem(this.STORAGE_KEYS.GOVERNMENT_TENDERS, [])
      ])

      return {
        integrations: {
          total: integrations.length,
          active: integrations.filter(i => i.isActive).length,
          connected: integrations.filter(i => i.status === 'connected').length
        },
        syncOperations: {
          total: syncOperations.length,
          completed: syncOperations.filter((op: SyncOperation) => op.status === 'completed').length,
          failed: syncOperations.filter((op: SyncOperation) => op.status === 'failed').length
        },
        data: {
          materialCosts: materialCosts.length,
          economicIndicators: economicData.length,
          governmentTenders: tenders.length
        },
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error getting data summary:', error)
      throw new Error('Failed to get data summary')
    }
  }
}

// Export singleton instance
export const integrationService = new IntegrationServiceImpl()
