/**
 * Mock Integration Service for Testing
 */

import type {
  IntegrationConfig,
  SyncOperation,
  IntegrationStatus,
  IntegrationType,
  SyncType
} from '../../types/integration'

// Mock data
const mockIntegrations: IntegrationConfig[] = [
  {
    id: 'integration_1',
    name: 'تكامل قاعدة بيانات المواد',
    nameEn: 'Material Database Integration',
    type: 'material_cost_db',
    status: 'connected',
    endpoint: 'https://api.materials.example.com',
    settings: {
      syncInterval: 60,
      autoSync: true,
      retryAttempts: 3,
      timeout: 30,
      batchSize: 100,
      notificationSettings: {
        onSuccess: true,
        onError: true,
        onWarning: true,
        emailNotifications: true,
        smsNotifications: false,
        recipients: []
      }
    },
    lastSync: '2024-01-01T10:00:00.000Z',
    nextSync: '2024-01-01T11:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    isActive: true
  },
  {
    id: 'integration_2',
    name: 'تكامل البيانات الاقتصادية',
    nameEn: 'Economic Data Integration',
    type: 'economic_data',
    status: 'disconnected',
    endpoint: 'https://api.economic.example.com',
    settings: {
      syncInterval: 120,
      autoSync: false,
      retryAttempts: 2,
      timeout: 20,
      batchSize: 50,
      notificationSettings: {
        onSuccess: false,
        onError: true,
        onWarning: false,
        emailNotifications: true,
        smsNotifications: false,
        recipients: []
      }
    },
    lastSync: '2024-01-01T08:00:00.000Z',
    nextSync: '2024-01-01T10:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    isActive: false
  },
  {
    id: 'integration_3',
    name: 'تكامل المناقصات الحكومية',
    nameEn: 'Government Tenders Integration',
    type: 'government_tender',
    status: 'error',
    endpoint: 'https://api.tenders.example.com',
    settings: {
      syncInterval: 240,
      autoSync: true,
      retryAttempts: 5,
      timeout: 60,
      batchSize: 200,
      notificationSettings: {
        onSuccess: true,
        onError: true,
        onWarning: true,
        emailNotifications: true,
        smsNotifications: true,
        recipients: ['admin@company.com']
      }
    },
    lastSync: '2024-01-01T06:00:00.000Z',
    nextSync: '2024-01-01T10:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    isActive: true
  }
]

const mockSystemHealth = {
  totalIntegrations: 3,
  activeIntegrations: 2,
  connectedIntegrations: 1,
  healthScore: 50,
  lastUpdated: '2024-01-01T12:00:00.000Z'
}

const mockDataSummary = {
  integrations: {
    total: 3,
    active: 2,
    connected: 1
  },
  syncOperations: {
    total: 10,
    completed: 8,
    failed: 2
  },
  data: {
    materialCosts: 150,
    economicIndicators: 25,
    governmentTenders: 45
  },
  lastUpdated: '2024-01-01T12:00:00.000Z'
}

const mockSyncOperations: SyncOperation[] = [
  {
    id: 'sync_1',
    integrationId: 'integration_1',
    type: 'manual',
    direction: 'import',
    status: 'completed',
    startTime: '2024-01-01T10:00:00.000Z',
    endTime: '2024-01-01T10:05:00.000Z',
    duration: 300,
    recordsProcessed: 100,
    recordsSuccess: 95,
    recordsError: 5,
    summary: {
      totalRecords: 100,
      processedRecords: 100,
      successfulRecords: 95,
      failedRecords: 5,
      skippedRecords: 0
    },
    errors: [],
    metadata: {}
  }
]

// Mock service implementation
export const integrationService = {
  async getAllIntegrations(): Promise<IntegrationConfig[]> {
    return Promise.resolve(mockIntegrations)
  },

  async getSystemHealth(): Promise<any> {
    return Promise.resolve(mockSystemHealth)
  },

  async getDataSummary(): Promise<any> {
    return Promise.resolve(mockDataSummary)
  },

  async getSyncHistory(integrationId: string): Promise<SyncOperation[]> {
    return Promise.resolve(mockSyncOperations.filter(op => op.integrationId === integrationId))
  },

  async testConnection(id: string): Promise<boolean> {
    return Promise.resolve(true)
  },

  async startSync(integrationId: string, syncType: SyncType = 'manual'): Promise<SyncOperation> {
    return Promise.resolve(mockSyncOperations[0])
  },

  async connectIntegration(id: string): Promise<void> {
    return Promise.resolve()
  },

  async disconnectIntegration(id: string): Promise<void> {
    return Promise.resolve()
  }
}
