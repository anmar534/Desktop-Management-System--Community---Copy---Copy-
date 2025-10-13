/**
 * Integration Service Tests
 * Comprehensive test suite for integration and API development functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { integrationService } from '../../src/services/integrationService'
import type { IntegrationConfig, SyncType } from '../../src/types/integration'

// Mock the storage utility
vi.mock('../../src/utils/storage', () => ({
  asyncStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    hasItem: vi.fn()
  }
}))

describe('IntegrationService', () => {
  let mockAsyncStorage: any

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Get the mocked storage
    const { asyncStorage } = await import('../../src/utils/storage')
    mockAsyncStorage = vi.mocked(asyncStorage)
    
    // Setup default mock implementations
    mockAsyncStorage.getItem.mockResolvedValue([])
    mockAsyncStorage.setItem.mockResolvedValue(undefined)
    mockAsyncStorage.removeItem.mockResolvedValue(undefined)
    mockAsyncStorage.hasItem.mockResolvedValue(false)
  })

  describe('Configuration Management', () => {
    it('should create a new integration configuration', async () => {
      const newConfig = {
        name: 'تكامل قاعدة بيانات المواد',
        nameEn: 'Material Database Integration',
        type: 'material_cost_db' as const,
        status: 'disconnected' as const,
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
            recipients: ['admin@company.com']
          }
        },
        lastSync: new Date().toISOString(),
        nextSync: new Date().toISOString(),
        isActive: true
      }

      mockAsyncStorage.getItem.mockResolvedValue([])

      const result = await integrationService.createIntegration(newConfig)

      expect(result).toMatchObject({
        ...newConfig,
        id: expect.stringMatching(/^integration_\d+_[a-z0-9]+$/),
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      })

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'integrations',
        expect.arrayContaining([expect.objectContaining(newConfig)])
      )
    })

    it('should update an existing integration', async () => {
      const existingIntegration: IntegrationConfig = {
        id: 'integration_123',
        name: 'تكامل قديم',
        type: 'material_cost_db',
        status: 'disconnected',
        endpoint: 'https://old.api.com',
        settings: {
          syncInterval: 30,
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
        lastSync: '2024-01-01T00:00:00.000Z',
        nextSync: '2024-01-01T01:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        isActive: false
      }

      mockAsyncStorage.getItem.mockResolvedValue([existingIntegration])

      const updates = {
        name: 'تكامل محدث',
        status: 'connected' as const,
        isActive: true
      }

      const result = await integrationService.updateIntegration('integration_123', updates)

      expect(result).toMatchObject({
        ...existingIntegration,
        ...updates,
        updatedAt: expect.any(String)
      })

      expect(mockAsyncStorage.setItem).toHaveBeenCalled()
    })

    it('should delete an integration', async () => {
      const existingIntegration: IntegrationConfig = {
        id: 'integration_123',
        name: 'تكامل للحذف',
        type: 'material_cost_db',
        status: 'disconnected',
        endpoint: 'https://api.example.com',
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
        lastSync: '2024-01-01T00:00:00.000Z',
        nextSync: '2024-01-01T01:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        isActive: true
      }

      mockAsyncStorage.getItem.mockResolvedValue([existingIntegration])

      await integrationService.deleteIntegration('integration_123')

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('integrations', [])
    })

    it('should get a specific integration', async () => {
      const existingIntegration: IntegrationConfig = {
        id: 'integration_123',
        name: 'تكامل للاستعلام',
        type: 'economic_data',
        status: 'connected',
        endpoint: 'https://api.example.com',
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
        lastSync: '2024-01-01T00:00:00.000Z',
        nextSync: '2024-01-01T01:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        isActive: true
      }

      mockAsyncStorage.getItem.mockResolvedValue([existingIntegration])

      const result = await integrationService.getIntegration('integration_123')

      expect(result).toEqual(existingIntegration)
    })

    it('should get all integrations', async () => {
      const integrations: IntegrationConfig[] = [
        {
          id: 'integration_1',
          name: 'تكامل 1',
          type: 'material_cost_db',
          status: 'connected',
          endpoint: 'https://api1.example.com',
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
          lastSync: '2024-01-01T00:00:00.000Z',
          nextSync: '2024-01-01T01:00:00.000Z',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          isActive: true
        },
        {
          id: 'integration_2',
          name: 'تكامل 2',
          type: 'economic_data',
          status: 'disconnected',
          endpoint: 'https://api2.example.com',
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
          lastSync: '2024-01-01T00:00:00.000Z',
          nextSync: '2024-01-01T02:00:00.000Z',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          isActive: false
        }
      ]

      mockAsyncStorage.getItem.mockResolvedValue(integrations)

      const result = await integrationService.getAllIntegrations()

      expect(result).toEqual(integrations)
      expect(result).toHaveLength(2)
    })
  })

  describe('Connection Management', () => {
    it('should test connection successfully', async () => {
      const integration: IntegrationConfig = {
        id: 'integration_123',
        name: 'تكامل للاختبار',
        type: 'material_cost_db',
        status: 'disconnected',
        endpoint: 'https://api.example.com',
        apiKey: 'valid-api-key',
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
        lastSync: '2024-01-01T00:00:00.000Z',
        nextSync: '2024-01-01T01:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        isActive: true
      }

      mockAsyncStorage.getItem
        .mockResolvedValueOnce([integration]) // getIntegration call
        .mockResolvedValueOnce([integration]) // updateIntegration call

      const result = await integrationService.testConnection('integration_123')

      expect(result).toBe(true)
      expect(mockAsyncStorage.setItem).toHaveBeenCalled()
    })

    it('should connect an integration', async () => {
      const integration: IntegrationConfig = {
        id: 'integration_123',
        name: 'تكامل للاتصال',
        type: 'government_tender',
        status: 'disconnected',
        endpoint: 'https://api.example.com',
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
        lastSync: '2024-01-01T00:00:00.000Z',
        nextSync: '2024-01-01T01:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        isActive: false
      }

      mockAsyncStorage.getItem
        .mockResolvedValueOnce([integration]) // getIntegration call
        .mockResolvedValueOnce([integration]) // updateIntegration call

      await integrationService.connectIntegration('integration_123')

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'integrations',
        expect.arrayContaining([
          expect.objectContaining({
            status: 'connected',
            isActive: true
          })
        ])
      )
    })

    it('should disconnect an integration', async () => {
      const integration: IntegrationConfig = {
        id: 'integration_123',
        name: 'تكامل لقطع الاتصال',
        type: 'accounting_system',
        status: 'connected',
        endpoint: 'https://api.example.com',
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
        lastSync: '2024-01-01T00:00:00.000Z',
        nextSync: '2024-01-01T01:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        isActive: true
      }

      mockAsyncStorage.getItem
        .mockResolvedValueOnce([integration]) // getIntegration call
        .mockResolvedValueOnce([integration]) // updateIntegration call

      await integrationService.disconnectIntegration('integration_123')

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'integrations',
        expect.arrayContaining([
          expect.objectContaining({
            status: 'disconnected',
            isActive: false
          })
        ])
      )
    })
  })

  describe('Sync Operations', () => {
    it('should start a sync operation', async () => {
      const integration: IntegrationConfig = {
        id: 'integration_123',
        name: 'تكامل للمزامنة',
        type: 'material_cost_db',
        status: 'connected',
        endpoint: 'https://api.example.com',
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
        lastSync: '2024-01-01T00:00:00.000Z',
        nextSync: '2024-01-01T01:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        isActive: true
      }

      mockAsyncStorage.getItem
        .mockResolvedValueOnce([integration]) // getIntegration call
        .mockResolvedValueOnce([]) // getSyncOperations call
        .mockResolvedValueOnce([integration]) // updateIntegration call

      const syncType: SyncType = 'manual'
      const result = await integrationService.startSync('integration_123', syncType)

      expect(result).toMatchObject({
        id: expect.stringMatching(/^sync_\d+_[a-z0-9]+$/),
        integrationId: 'integration_123',
        type: 'manual',
        direction: 'import',
        status: 'running',
        startTime: expect.any(String),
        recordsProcessed: 0,
        recordsSuccess: 0,
        recordsError: 0,
        errors: [],
        summary: expect.objectContaining({
          totalRecords: 0,
          newRecords: 0,
          updatedRecords: 0,
          deletedRecords: 0,
          skippedRecords: 0,
          errorRecords: 0,
          dataQualityScore: 0,
          recommendations: []
        })
      })

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'sync_operations',
        expect.arrayContaining([expect.objectContaining({ type: 'manual' })])
      )
    })

    it('should get sync history for an integration', async () => {
      const syncOperations = [
        {
          id: 'sync_1',
          integrationId: 'integration_123',
          type: 'manual',
          direction: 'import',
          status: 'completed',
          startTime: '2024-01-01T10:00:00.000Z',
          endTime: '2024-01-01T10:05:00.000Z',
          duration: 300,
          recordsProcessed: 100,
          recordsSuccess: 95,
          recordsError: 5,
          errors: [],
          summary: {
            totalRecords: 100,
            newRecords: 30,
            updatedRecords: 65,
            deletedRecords: 0,
            skippedRecords: 0,
            errorRecords: 5,
            dataQualityScore: 95,
            recommendations: []
          }
        },
        {
          id: 'sync_2',
          integrationId: 'integration_456',
          type: 'scheduled',
          direction: 'import',
          status: 'completed',
          startTime: '2024-01-01T09:00:00.000Z',
          endTime: '2024-01-01T09:03:00.000Z',
          duration: 180,
          recordsProcessed: 50,
          recordsSuccess: 50,
          recordsError: 0,
          errors: [],
          summary: {
            totalRecords: 50,
            newRecords: 10,
            updatedRecords: 40,
            deletedRecords: 0,
            skippedRecords: 0,
            errorRecords: 0,
            dataQualityScore: 100,
            recommendations: []
          }
        }
      ]

      mockAsyncStorage.getItem.mockResolvedValue(syncOperations)

      const result = await integrationService.getSyncHistory('integration_123')

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'sync_1',
        integrationId: 'integration_123'
      })
    })
  })

  describe('Data Access', () => {
    it('should get material costs with filters', async () => {
      const materialCosts = [
        {
          id: 'mat_001',
          materialCode: 'CEMENT_OPC_42.5',
          materialName: 'أسمنت بورتلاندي عادي 42.5',
          category: 'cement',
          unit: 'ton',
          unitPrice: 450,
          currency: 'SAR',
          region: 'Riyadh',
          supplier: 'Saudi Cement Company',
          effectiveDate: '2024-01-01T00:00:00.000Z',
          expiryDate: '2024-02-01T00:00:00.000Z',
          source: 'supplier_api',
          lastUpdated: '2024-01-01T00:00:00.000Z',
          priceHistory: []
        },
        {
          id: 'mat_002',
          materialCode: 'STEEL_REBAR_16MM',
          materialName: 'حديد تسليح 16 مم',
          category: 'steel',
          unit: 'ton',
          unitPrice: 2850,
          currency: 'SAR',
          region: 'Jeddah',
          supplier: 'Hadeed Steel',
          effectiveDate: '2024-01-01T00:00:00.000Z',
          expiryDate: '2024-02-01T00:00:00.000Z',
          source: 'market_data',
          lastUpdated: '2024-01-01T00:00:00.000Z',
          priceHistory: []
        }
      ]

      mockAsyncStorage.getItem.mockResolvedValue(materialCosts)

      const result = await integrationService.getMaterialCosts({ category: 'cement' })

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        category: 'cement',
        materialCode: 'CEMENT_OPC_42.5'
      })
    })

    it('should get economic data by indicator', async () => {
      const economicData = [
        {
          id: 'econ_001',
          indicator: 'inflation_rate',
          value: 2.3,
          unit: 'percentage',
          period: '2024-Q3',
          region: 'Saudi Arabia',
          source: 'SAMA',
          lastUpdated: '2024-01-01T00:00:00.000Z',
          forecast: []
        },
        {
          id: 'econ_002',
          indicator: 'construction_index',
          value: 108.5,
          unit: 'index',
          period: '2024-Q3',
          region: 'Saudi Arabia',
          source: 'GASTAT',
          lastUpdated: '2024-01-01T00:00:00.000Z',
          forecast: []
        }
      ]

      mockAsyncStorage.getItem.mockResolvedValue(economicData)

      const result = await integrationService.getEconomicData('inflation_rate')

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        indicator: 'inflation_rate',
        value: 2.3
      })
    })

    it('should get government tenders with filters', async () => {
      const tenders = [
        {
          id: 'tender_001',
          tenderNumber: 'MOH-2024-001',
          title: 'إنشاء مستشفى عام بمدينة الرياض',
          agency: 'وزارة الصحة',
          category: 'healthcare',
          estimatedValue: 150000000,
          currency: 'SAR',
          status: 'open',
          publishDate: '2024-01-01T00:00:00.000Z',
          submissionDeadline: '2024-02-15T00:00:00.000Z',
          openingDate: '2024-02-20T00:00:00.000Z',
          location: 'Riyadh',
          requirements: [],
          documents: [],
          source: 'etimad',
          lastUpdated: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 'tender_002',
          tenderNumber: 'MOE-2024-002',
          title: 'إنشاء مدرسة ابتدائية',
          agency: 'وزارة التعليم',
          category: 'education',
          estimatedValue: 50000000,
          currency: 'SAR',
          status: 'closed',
          publishDate: '2024-01-01T00:00:00.000Z',
          submissionDeadline: '2024-01-30T00:00:00.000Z',
          openingDate: '2024-02-05T00:00:00.000Z',
          location: 'Jeddah',
          requirements: [],
          documents: [],
          source: 'etimad',
          lastUpdated: '2024-01-01T00:00:00.000Z'
        }
      ]

      mockAsyncStorage.getItem.mockResolvedValue(tenders)

      const result = await integrationService.getGovernmentTenders({ status: 'open' })

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        status: 'open',
        tenderNumber: 'MOH-2024-001'
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'))

      await expect(integrationService.getAllIntegrations()).rejects.toThrow('Failed to get integrations')
    })

    it('should handle update of non-existent integration', async () => {
      mockAsyncStorage.getItem.mockResolvedValue([])

      await expect(
        integrationService.updateIntegration('non_existent', { name: 'Updated' })
      ).rejects.toThrow('Integration with id non_existent not found')
    })

    it('should handle sync start for disconnected integration', async () => {
      const disconnectedIntegration: IntegrationConfig = {
        id: 'integration_123',
        name: 'تكامل غير متصل',
        type: 'material_cost_db',
        status: 'disconnected',
        endpoint: 'https://api.example.com',
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
        lastSync: '2024-01-01T00:00:00.000Z',
        nextSync: '2024-01-01T01:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        isActive: false
      }

      mockAsyncStorage.getItem.mockResolvedValue([disconnectedIntegration])

      await expect(
        integrationService.startSync('integration_123', 'manual')
      ).rejects.toThrow('Integration must be connected to start sync')
    })
  })

  describe('Validation', () => {
    it('should validate integration configuration correctly', async () => {
      const validConfig: IntegrationConfig = {
        id: 'integration_123',
        name: 'تكامل صحيح',
        type: 'material_cost_db',
        status: 'disconnected',
        endpoint: 'https://api.example.com',
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
        lastSync: '2024-01-01T00:00:00.000Z',
        nextSync: '2024-01-01T01:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        isActive: true
      }

      const result = await integrationService.validateConfiguration(validConfig)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect invalid configuration', async () => {
      const invalidConfig: IntegrationConfig = {
        id: 'integration_123',
        name: '', // Invalid: empty name
        type: 'material_cost_db',
        status: 'disconnected',
        endpoint: 'invalid-url', // Invalid: not a valid URL
        settings: {
          syncInterval: 0, // Invalid: zero interval
          autoSync: true,
          retryAttempts: 3,
          timeout: 5, // Warning: very short timeout
          batchSize: 100,
          notificationSettings: {
            onSuccess: true,
            onError: false, // Suggestion: should enable error notifications
            onWarning: true,
            emailNotifications: true,
            smsNotifications: false,
            recipients: []
          }
        },
        lastSync: '2024-01-01T00:00:00.000Z',
        nextSync: '2024-01-01T01:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        isActive: true
      }

      const result = await integrationService.validateConfiguration(invalidConfig)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.suggestions.length).toBeGreaterThan(0)
    })
  })

  describe('Utility Functions', () => {
    it('should export integration configuration', async () => {
      const integration: IntegrationConfig = {
        id: 'integration_123',
        name: 'تكامل للتصدير',
        type: 'material_cost_db',
        status: 'connected',
        endpoint: 'https://api.example.com',
        apiKey: 'secret-key',
        credentials: {
          username: 'user',
          password: 'pass'
        },
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
        lastSync: '2024-01-01T00:00:00.000Z',
        nextSync: '2024-01-01T01:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        isActive: true
      }

      mockAsyncStorage.getItem.mockResolvedValue([integration])

      const result = await integrationService.exportConfiguration('integration_123')
      const exportedConfig = JSON.parse(result)

      expect(exportedConfig).not.toHaveProperty('credentials')
      expect(exportedConfig).not.toHaveProperty('apiKey')
      expect(exportedConfig).toHaveProperty('name', 'تكامل للتصدير')
    })

    it('should get system health status', async () => {
      const integrations: IntegrationConfig[] = [
        {
          id: 'integration_1',
          name: 'تكامل 1',
          type: 'material_cost_db',
          status: 'connected',
          endpoint: 'https://api1.example.com',
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
          lastSync: '2024-01-01T00:00:00.000Z',
          nextSync: '2024-01-01T01:00:00.000Z',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          isActive: true
        },
        {
          id: 'integration_2',
          name: 'تكامل 2',
          type: 'economic_data',
          status: 'disconnected',
          endpoint: 'https://api2.example.com',
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
          lastSync: '2024-01-01T00:00:00.000Z',
          nextSync: '2024-01-01T02:00:00.000Z',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          isActive: true
        }
      ]

      mockAsyncStorage.getItem.mockResolvedValue(integrations)

      const result = await integrationService.getSystemHealth()

      expect(result).toMatchObject({
        totalIntegrations: 2,
        activeIntegrations: 2,
        connectedIntegrations: 1,
        healthScore: 50, // 1 connected out of 2 active = 50%
        lastUpdated: expect.any(String)
      })
    })
  })
})
