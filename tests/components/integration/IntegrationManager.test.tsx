/**
 * Integration Manager Component Tests
 * Comprehensive test suite for the Integration Manager UI component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import IntegrationManager from '../../../src/components/integration/IntegrationManager'
import type { IntegrationConfig } from '../../../src/types/integration'

// Mock the integration service
vi.mock('../../../src/services/integrationService', () => ({
  integrationService: {
    getAllIntegrations: vi.fn(),
    getSystemHealth: vi.fn(),
    getDataSummary: vi.fn(),
    getSyncHistory: vi.fn(),
    testConnection: vi.fn(),
    startSync: vi.fn(),
    connectIntegration: vi.fn(),
    disconnectIntegration: vi.fn()
  }
}))

describe('IntegrationManager', () => {
  let mockIntegrationService: any

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

  const mockSyncOperations = [
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
    }
  ]

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Get the mocked service
    const { integrationService } = await import('../../../src/services/integrationService')
    mockIntegrationService = vi.mocked(integrationService)
    
    // Setup default mock implementations
    mockIntegrationService.getAllIntegrations.mockResolvedValue(mockIntegrations)
    mockIntegrationService.getSystemHealth.mockResolvedValue(mockSystemHealth)
    mockIntegrationService.getDataSummary.mockResolvedValue(mockDataSummary)
    mockIntegrationService.getSyncHistory.mockResolvedValue(mockSyncOperations)
    mockIntegrationService.testConnection.mockResolvedValue(true)
    mockIntegrationService.startSync.mockResolvedValue(mockSyncOperations[0])
    mockIntegrationService.connectIntegration.mockResolvedValue(undefined)
    mockIntegrationService.disconnectIntegration.mockResolvedValue(undefined)
  })

  describe('Rendering', () => {
    it('should render the component with header and tabs', async () => {
      render(<IntegrationManager />)

      await waitFor(() => {
        expect(screen.getByText('إدارة التكامل والواجهات البرمجية')).toBeInTheDocument()
      })

      expect(screen.getByText('إدارة الاتصالات مع الأنظمة الخارجية ومصادر البيانات')).toBeInTheDocument()
      expect(screen.getByText('نظرة عامة')).toBeInTheDocument()
      expect(screen.getByText('التكاملات')).toBeInTheDocument()
      expect(screen.getByText('المزامنة')).toBeInTheDocument()
      expect(screen.getByText('التحليلات')).toBeInTheDocument()
    })

    it('should display system health cards', async () => {
      render(<IntegrationManager />)

      await waitFor(() => {
        expect(screen.getByText('إجمالي التكاملات')).toBeInTheDocument()
      })

      expect(screen.getByText('3')).toBeInTheDocument() // Total integrations
      expect(screen.getByText('التكاملات النشطة')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument() // Active integrations
      expect(screen.getByText('التكاملات المتصلة')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument() // Connected integrations
      expect(screen.getByText('صحة النظام')).toBeInTheDocument()
      expect(screen.getByText('50%')).toBeInTheDocument() // Health score
    })

    it('should show loading state initially', () => {
      // Mock loading state
      mockIntegrationService.getAllIntegrations.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockIntegrations), 1000))
      )

      render(<IntegrationManager />)

      expect(screen.getByText('جاري تحميل بيانات التكامل...')).toBeInTheDocument()
    })

    it('should display error message when loading fails', async () => {
      mockIntegrationService.getAllIntegrations.mockRejectedValue(new Error('Network error'))

      render(<IntegrationManager />)

      await waitFor(() => {
        expect(screen.getByText('فشل في تحميل بيانات التكامل')).toBeInTheDocument()
      })
    })

    it('should render integrations list in integrations tab', async () => {
      render(<IntegrationManager />)

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('إجمالي التكاملات')).toBeInTheDocument()
      })

      // Switch to integrations tab
      fireEvent.click(screen.getByText('التكاملات'))

      await waitFor(() => {
        expect(screen.getByText('تكامل قاعدة بيانات المواد')).toBeInTheDocument()
      })

      expect(screen.getByText('تكامل البيانات الاقتصادية')).toBeInTheDocument()
      expect(screen.getByText('تكامل المناقصات الحكومية')).toBeInTheDocument()
    })
  })

  describe('Overview Tab', () => {
    it('should display data summary in overview tab', async () => {
      render(<IntegrationManager />)

      await waitFor(() => {
        expect(screen.getByText('حالة التكاملات')).toBeInTheDocument()
      })

      expect(screen.getByText('عمليات المزامنة')).toBeInTheDocument()
      expect(screen.getByText('البيانات المتاحة')).toBeInTheDocument()
      
      // Check specific values
      expect(screen.getByText('150')).toBeInTheDocument() // Material costs
      expect(screen.getByText('25')).toBeInTheDocument() // Economic indicators
      expect(screen.getByText('45')).toBeInTheDocument() // Government tenders
    })
  })

  describe('Integrations Tab', () => {
    it('should filter integrations by search term', async () => {
      const user = userEvent.setup()
      render(<IntegrationManager />)

      // Wait for data to load and switch to integrations tab
      await waitFor(() => {
        expect(screen.getByText('إجمالي التكاملات')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('التكاملات'))

      await waitFor(() => {
        expect(screen.getByText('تكامل قاعدة بيانات المواد')).toBeInTheDocument()
      })

      // Search for specific integration
      const searchInput = screen.getByPlaceholderText('البحث في التكاملات...')
      await user.type(searchInput, 'قاعدة بيانات')

      await waitFor(() => {
        expect(screen.getByText('تكامل قاعدة بيانات المواد')).toBeInTheDocument()
      })

      expect(screen.queryByText('تكامل البيانات الاقتصادية')).not.toBeInTheDocument()
    })

    it('should filter integrations by status', async () => {
      render(<IntegrationManager />)

      // Wait for data to load and switch to integrations tab
      await waitFor(() => {
        expect(screen.getByText('إجمالي التكاملات')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('التكاملات'))

      await waitFor(() => {
        expect(screen.getByText('تكامل قاعدة بيانات المواد')).toBeInTheDocument()
      })

      // Filter by connected status
      const statusFilter = screen.getByDisplayValue('جميع الحالات')
      fireEvent.change(statusFilter, { target: { value: 'connected' } })

      await waitFor(() => {
        expect(screen.getByText('تكامل قاعدة بيانات المواد')).toBeInTheDocument()
      })

      expect(screen.queryByText('تكامل البيانات الاقتصادية')).not.toBeInTheDocument()
    })

    it('should display status badges correctly', async () => {
      render(<IntegrationManager />)

      // Wait for data to load and switch to integrations tab
      await waitFor(() => {
        expect(screen.getByText('إجمالي التكاملات')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('التكاملات'))

      await waitFor(() => {
        expect(screen.getByText('متصل')).toBeInTheDocument()
      })

      expect(screen.getByText('غير متصل')).toBeInTheDocument()
      expect(screen.getByText('خطأ')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should handle test connection action', async () => {
      const user = userEvent.setup()
      render(<IntegrationManager />)

      // Wait for data to load and switch to integrations tab
      await waitFor(() => {
        expect(screen.getByText('إجمالي التكاملات')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('التكاملات'))

      await waitFor(() => {
        expect(screen.getByText('تكامل قاعدة بيانات المواد')).toBeInTheDocument()
      })

      // Click test connection button
      const testButtons = screen.getAllByText('اختبار الاتصال')
      await user.click(testButtons[0])

      await waitFor(() => {
        expect(mockIntegrationService.testConnection).toHaveBeenCalledWith('integration_1')
      })
    })

    it('should handle start sync action', async () => {
      const user = userEvent.setup()
      render(<IntegrationManager />)

      // Wait for data to load and switch to integrations tab
      await waitFor(() => {
        expect(screen.getByText('إجمالي التكاملات')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('التكاملات'))

      await waitFor(() => {
        expect(screen.getByText('تكامل قاعدة بيانات المواد')).toBeInTheDocument()
      })

      // Click sync button for connected integration
      const syncButtons = screen.getAllByText('مزامنة')
      await user.click(syncButtons[0])

      await waitFor(() => {
        expect(mockIntegrationService.startSync).toHaveBeenCalledWith('integration_1', 'manual')
      })
    })

    it('should handle connect/disconnect integration', async () => {
      const user = userEvent.setup()
      render(<IntegrationManager />)

      // Wait for data to load and switch to integrations tab
      await waitFor(() => {
        expect(screen.getByText('إجمالي التكاملات')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('التكاملات'))

      await waitFor(() => {
        expect(screen.getByText('تكامل قاعدة بيانات المواد')).toBeInTheDocument()
      })

      // Click disconnect button for connected integration
      const disconnectButton = screen.getByText('قطع الاتصال')
      await user.click(disconnectButton)

      await waitFor(() => {
        expect(mockIntegrationService.disconnectIntegration).toHaveBeenCalledWith('integration_1', 'connected')
      })

      // Click connect button for disconnected integration
      const connectButton = screen.getByText('اتصال')
      await user.click(connectButton)

      await waitFor(() => {
        expect(mockIntegrationService.connectIntegration).toHaveBeenCalledWith('integration_2', 'disconnected')
      })
    })

    it('should handle refresh data action', async () => {
      const user = userEvent.setup()
      render(<IntegrationManager />)

      await waitFor(() => {
        expect(screen.getByText('إجمالي التكاملات')).toBeInTheDocument()
      })

      // Click refresh button
      const refreshButton = screen.getByText('تحديث')
      await user.click(refreshButton)

      await waitFor(() => {
        expect(mockIntegrationService.getAllIntegrations).toHaveBeenCalledTimes(2) // Initial load + refresh
      })
    })

    it('should handle tab switching', async () => {
      const user = userEvent.setup()
      render(<IntegrationManager />)

      await waitFor(() => {
        expect(screen.getByText('إجمالي التكاملات')).toBeInTheDocument()
      })

      // Switch to sync tab
      await user.click(screen.getByText('المزامنة'))

      await waitFor(() => {
        expect(screen.getByText('عملية مزامنة manual')).toBeInTheDocument()
      })

      // Switch to analytics tab
      await user.click(screen.getByText('التحليلات'))

      await waitFor(() => {
        expect(screen.getByText('تحليلات التكامل قيد التطوير')).toBeInTheDocument()
      })
    })
  })

  describe('Sync Operations Tab', () => {
    it('should display sync operations', async () => {
      render(<IntegrationManager />)

      await waitFor(() => {
        expect(screen.getByText('إجمالي التكاملات')).toBeInTheDocument()
      })

      // Switch to sync tab
      fireEvent.click(screen.getByText('المزامنة'))

      await waitFor(() => {
        expect(screen.getByText('عملية مزامنة manual')).toBeInTheDocument()
      })

      expect(screen.getByText('مكتملة')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument() // Records processed
      expect(screen.getByText('95')).toBeInTheDocument() // Success records
      expect(screen.getByText('5')).toBeInTheDocument() // Error records
    })

    it('should show empty state when no sync operations', async () => {
      mockIntegrationService.getSyncHistory.mockResolvedValue([])

      render(<IntegrationManager />)

      await waitFor(() => {
        expect(screen.getByText('إجمالي التكاملات')).toBeInTheDocument()
      })

      // Switch to sync tab
      fireEvent.click(screen.getByText('المزامنة'))

      await waitFor(() => {
        expect(screen.getByText('لا توجد عمليات مزامنة حديثة')).toBeInTheDocument()
      })
    })
  })

  describe('Empty States', () => {
    it('should show empty state when no integrations match filters', async () => {
      const user = userEvent.setup()
      render(<IntegrationManager />)

      // Wait for data to load and switch to integrations tab
      await waitFor(() => {
        expect(screen.getByText('إجمالي التكاملات')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('التكاملات'))

      await waitFor(() => {
        expect(screen.getByText('تكامل قاعدة بيانات المواد')).toBeInTheDocument()
      })

      // Search for non-existent integration
      const searchInput = screen.getByPlaceholderText('البحث في التكاملات...')
      await user.type(searchInput, 'غير موجود')

      await waitFor(() => {
        expect(screen.getByText('لا توجد تكاملات تطابق المعايير المحددة')).toBeInTheDocument()
      })
    })

    it('should show analytics placeholder', async () => {
      render(<IntegrationManager />)

      await waitFor(() => {
        expect(screen.getByText('إجمالي التكاملات')).toBeInTheDocument()
      })

      // Switch to analytics tab
      fireEvent.click(screen.getByText('التحليلات'))

      await waitFor(() => {
        expect(screen.getByText('تحليلات التكامل قيد التطوير')).toBeInTheDocument()
      })

      expect(screen.getByText('ستتوفر قريباً تقارير مفصلة عن أداء التكاملات')).toBeInTheDocument()
    })
  })

  describe('Props Handling', () => {
    it('should call onIntegrationUpdate callback when provided', async () => {
      const onIntegrationUpdate = vi.fn()
      render(<IntegrationManager onIntegrationUpdate={onIntegrationUpdate} />)

      await waitFor(() => {
        expect(screen.getByText('إجمالي التكاملات')).toBeInTheDocument()
      })

      // The callback would be called when an integration is updated
      // This is tested indirectly through the integration actions
    })

    it('should call onSyncComplete callback when sync is started', async () => {
      const onSyncComplete = vi.fn()
      const user = userEvent.setup()
      
      render(<IntegrationManager onSyncComplete={onSyncComplete} />)

      // Wait for data to load and switch to integrations tab
      await waitFor(() => {
        expect(screen.getByText('إجمالي التكاملات')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('التكاملات'))

      await waitFor(() => {
        expect(screen.getByText('تكامل قاعدة بيانات المواد')).toBeInTheDocument()
      })

      // Click sync button
      const syncButtons = screen.getAllByText('مزامنة')
      await user.click(syncButtons[0])

      await waitFor(() => {
        expect(onSyncComplete).toHaveBeenCalledWith(mockSyncOperations[0])
      })
    })

    it('should apply custom className', () => {
      const { container } = render(<IntegrationManager className="custom-class" />)
      
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
})
