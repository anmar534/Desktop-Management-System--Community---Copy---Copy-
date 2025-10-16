/**
 * اختبارات مكون التكامل الشامل للنظام
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import UnifiedSystemIntegration from '../../../src/components/integration/UnifiedSystemIntegration'
import { unifiedSystemIntegrationService } from '../../../src/services/unifiedSystemIntegrationService'

const mockService = unifiedSystemIntegrationService as any

// Mock the service
vi.mock('../../../src/services/unifiedSystemIntegrationService', () => ({
  unifiedSystemIntegrationService: {
    initialize: vi.fn(),
    getSystemModules: vi.fn(),
    getDataFlows: vi.fn(),
    getIntegrationSummary: vi.fn(),
    getPendingConflicts: vi.fn(),
    getRecentUpdates: vi.fn(),
    syncAllData: vi.fn()
  }
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}))

describe('UnifiedSystemIntegration', () => {
  const mockModules = [
    {
      id: 'tenders',
      name: 'إدارة المنافسات',
      nameEn: 'Tender Management',
      status: 'active',
      version: '2.1.0',
      lastSync: '2024-01-15T10:00:00Z',
      dependencies: [],
      dataCount: 25,
      errorCount: 0
    },
    {
      id: 'projects',
      name: 'إدارة المشاريع',
      nameEn: 'Project Management',
      status: 'active',
      version: '2.0.0',
      lastSync: '2024-01-15T10:00:00Z',
      dependencies: ['tenders'],
      dataCount: 15,
      errorCount: 1
    }
  ]

  const mockDataFlows = [
    {
      id: 'tenders-to-projects',
      sourceModule: 'tenders',
      targetModule: 'projects',
      dataType: 'tender_awards',
      status: 'active',
      lastSync: '2024-01-15T10:00:00Z',
      recordsProcessed: 100,
      errorCount: 0,
      syncFrequency: 'realtime'
    }
  ]

  const mockSummary = {
    totalModules: 4,
    activeModules: 4,
    totalDataFlows: 5,
    activeDataFlows: 5,
    lastFullSync: '2024-01-15T10:00:00Z',
    systemHealth: 'excellent' as const,
    overallSyncStatus: 'synced' as const,
    dataConsistencyScore: 95,
    performanceScore: 88
  }

  const mockConflicts = [
    {
      id: 'conflict-1',
      conflictType: 'data_mismatch' as const,
      sourceModule: 'tenders',
      targetModule: 'projects',
      description: 'تضارب في بيانات المشروع',
      severity: 'high' as const,
      status: 'pending' as const,
      resolutionStrategy: '',
      createdAt: '2024-01-15T09:00:00Z'
    }
  ]

  const mockUpdates = [
    {
      id: 'update-1',
      moduleId: 'tenders',
      dataType: 'tender',
      operation: 'create' as const,
      recordId: 'tender-123',
      timestamp: '2024-01-15T10:30:00Z',
      propagated: true,
      affectedModules: ['projects']
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockService.initialize.mockResolvedValue(undefined)
    mockService.getSystemModules.mockResolvedValue(mockModules)
    mockService.getDataFlows.mockResolvedValue(mockDataFlows)
    mockService.getIntegrationSummary.mockResolvedValue(mockSummary)
    mockService.getPendingConflicts.mockResolvedValue(mockConflicts)
    mockService.getRecentUpdates.mockResolvedValue(mockUpdates)
    mockService.syncAllData.mockResolvedValue(undefined)
  })

  it('يجب أن يعرض شاشة التحميل في البداية', () => {
    render(<UnifiedSystemIntegration />)
    
    expect(screen.getByText('جاري تحميل بيانات التكامل...')).toBeInTheDocument()
  })

  it('يجب أن يعرض العنوان والوصف بشكل صحيح', async () => {
    render(<UnifiedSystemIntegration />)
    
    await waitFor(() => {
      expect(screen.getByText('التكامل الشامل للنظام')).toBeInTheDocument()
      expect(screen.getByText('مراقبة وإدارة التكامل بين جميع وحدات النظام')).toBeInTheDocument()
    })
  })

  it('يجب أن يعرض بطاقات الملخص بشكل صحيح', async () => {
    render(<UnifiedSystemIntegration />)
    
    await waitFor(() => {
      expect(screen.getByText('وحدات النظام')).toBeInTheDocument()
      expect(screen.getByText('4/4')).toBeInTheDocument()
      expect(screen.getByText('تدفقات البيانات')).toBeInTheDocument()
      expect(screen.getByText('5/5')).toBeInTheDocument()
      expect(screen.getByText('صحة النظام')).toBeInTheDocument()
      expect(screen.getByText('ممتازة')).toBeInTheDocument()
      expect(screen.getByText('اتساق البيانات')).toBeInTheDocument()
      expect(screen.getByText('95%')).toBeInTheDocument()
    })
  })

  it('يجب أن يعرض وحدات النظام في التبويب الأول', async () => {
    render(<UnifiedSystemIntegration />)
    
    await waitFor(() => {
      expect(screen.getByText('إدارة المنافسات')).toBeInTheDocument()
      expect(screen.getByText('Tender Management')).toBeInTheDocument()
      expect(screen.getByText('إدارة المشاريع')).toBeInTheDocument()
      expect(screen.getByText('Project Management')).toBeInTheDocument()
    })
  })

  it('يجب أن يعرض تفاصيل الوحدة بشكل صحيح', async () => {
    render(<UnifiedSystemIntegration />)
    
    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument() // عدد البيانات للمنافسات
      expect(screen.getByText('15')).toBeInTheDocument() // عدد البيانات للمشاريع
      expect(screen.getByText('2.1.0')).toBeInTheDocument() // إصدار المنافسات
      expect(screen.getByText('2.0.0')).toBeInTheDocument() // إصدار المشاريع
    })
  })

  it('يجب أن يعرض تدفقات البيانات عند النقر على التبويب', async () => {
    render(<UnifiedSystemIntegration />)
    
    await waitFor(() => {
      const dataFlowsTab = screen.getByText('تدفقات البيانات')
      fireEvent.click(dataFlowsTab)
    })
    
    await waitFor(() => {
      expect(screen.getByText('إدارة المنافسات → إدارة المشاريع')).toBeInTheDocument()
      expect(screen.getByText('tender_awards')).toBeInTheDocument()
      expect(screen.getByText('فوري')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument() // السجلات المعالجة
    })
  })

  it('يجب أن يعرض التضاربات عند النقر على التبويب', async () => {
    render(<UnifiedSystemIntegration />)
    
    await waitFor(() => {
      const conflictsTab = screen.getByText('التضاربات')
      fireEvent.click(conflictsTab)
    })
    
    await waitFor(() => {
      expect(screen.getByText('تضارب في البيانات')).toBeInTheDocument()
      expect(screen.getByText('تضارب في بيانات المشروع')).toBeInTheDocument()
      expect(screen.getByText('عالي')).toBeInTheDocument()
      expect(screen.getByText('حل التضارب')).toBeInTheDocument()
    })
  })

  it('يجب أن يعرض التحديثات الأخيرة عند النقر على التبويب', async () => {
    render(<UnifiedSystemIntegration />)
    
    await waitFor(() => {
      const updatesTab = screen.getByText('التحديثات الأخيرة')
      fireEvent.click(updatesTab)
    })
    
    await waitFor(() => {
      expect(screen.getByText('التحديثات الأخيرة')).toBeInTheDocument()
      expect(screen.getByText('إنشاء tender')).toBeInTheDocument()
      expect(screen.getByText('في إدارة المنافسات')).toBeInTheDocument()
      expect(screen.getByText('تم النشر')).toBeInTheDocument()
    })
  })

  it('يجب أن يستدعي مزامنة البيانات عند النقر على الزر', async () => {
    render(<UnifiedSystemIntegration />)
    
    await waitFor(() => {
      const syncButton = screen.getByText('مزامنة جميع البيانات')
      fireEvent.click(syncButton)
    })
    
    expect(mockService.syncAllData).toHaveBeenCalledTimes(1)
  })

  it('يجب أن يستدعي تحديث البيانات عند النقر على زر التحديث', async () => {
    render(<UnifiedSystemIntegration />)
    
    await waitFor(() => {
      const refreshButton = screen.getByText('تحديث')
      fireEvent.click(refreshButton)
    })
    
    // يجب أن يستدعي جميع دوال التحميل مرة أخرى
    expect(mockService.getSystemModules).toHaveBeenCalledTimes(2) // مرة في التحميل الأولي ومرة في التحديث
  })

  it('يجب أن يعرض رسالة عدم وجود تضاربات عندما تكون القائمة فارغة', async () => {
    mockService.getPendingConflicts.mockResolvedValue([])
    
    render(<UnifiedSystemIntegration />)
    
    await waitFor(() => {
      const conflictsTab = screen.getByText('التضاربات')
      fireEvent.click(conflictsTab)
    })
    
    await waitFor(() => {
      expect(screen.getByText('لا توجد تضاربات')).toBeInTheDocument()
      expect(screen.getByText('جميع البيانات متسقة ولا توجد تضاربات تحتاج إلى حل')).toBeInTheDocument()
    })
  })

  it('يجب أن يعرض رسالة عدم وجود تحديثات عندما تكون القائمة فارغة', async () => {
    mockService.getRecentUpdates.mockResolvedValue([])
    
    render(<UnifiedSystemIntegration />)
    
    await waitFor(() => {
      const updatesTab = screen.getByText('التحديثات الأخيرة')
      fireEvent.click(updatesTab)
    })
    
    await waitFor(() => {
      expect(screen.getByText('لا توجد تحديثات حديثة')).toBeInTheDocument()
    })
  })

  it('يجب أن يعرض حالة المزامنة بشكل صحيح', async () => {
    render(<UnifiedSystemIntegration />)
    
    await waitFor(() => {
      const syncButton = screen.getByText('مزامنة جميع البيانات')
      fireEvent.click(syncButton)
    })
    
    // أثناء المزامنة
    expect(screen.getByText('جاري المزامنة...')).toBeInTheDocument()
  })

  it('يجب أن يعرض الألوان الصحيحة لحالة الصحة', async () => {
    const summaryWithWarning = { ...mockSummary, systemHealth: 'warning' as const }
    mockService.getIntegrationSummary.mockResolvedValue(summaryWithWarning)
    
    render(<UnifiedSystemIntegration />)
    
    await waitFor(() => {
      expect(screen.getByText('تحذير')).toBeInTheDocument()
    })
  })

  it('يجب أن يعرض التبعيات للوحدات بشكل صحيح', async () => {
    render(<UnifiedSystemIntegration />)
    
    await waitFor(() => {
      expect(screen.getByText('يعتمد على:')).toBeInTheDocument()
      expect(screen.getByText('إدارة المنافسات')).toBeInTheDocument() // تبعية وحدة المشاريع
    })
  })

  it('يجب أن يتعامل مع الأخطاء بشكل صحيح', async () => {
    mockService.initialize.mockRejectedValue(new Error('خطأ في التحميل'))
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    render(<UnifiedSystemIntegration />)
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('خطأ في تحميل بيانات التكامل:', expect.any(Error))
    })
    
    consoleSpy.mockRestore()
  })
})
