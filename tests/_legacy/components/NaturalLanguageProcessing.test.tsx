/**
 * Natural Language Processing Component Tests
 * Comprehensive test suite for NLP component functionality
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import NaturalLanguageProcessing from '../../../src/components/ai/NaturalLanguageProcessing'

// Mock the NLP service
vi.mock('../../../src/services/naturalLanguageProcessingService', () => ({
  naturalLanguageProcessingService: {
    processDocument: vi.fn(),
    getProcessingJobs: vi.fn(),
    getReportTemplates: vi.fn(),
    getProcessingStatistics: vi.fn(),
    getAccuracyMetrics: vi.fn(),
    getProcessingJob: vi.fn(),
    extractBOQ: vi.fn(),
    analyzeSpecifications: vi.fn(),
    identifyRisks: vi.fn(),
    categorizeDocument: vi.fn(),
    generateReport: vi.fn()
  }
}))

describe('NaturalLanguageProcessing Component', () => {
  let mockService: any

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Get the mocked service
    const { naturalLanguageProcessingService } = await import('../../../src/services/naturalLanguageProcessingService')
    mockService = naturalLanguageProcessingService

    // Setup default mock implementations
    mockService.getProcessingJobs.mockResolvedValue([])
    mockService.getReportTemplates.mockResolvedValue([])
    mockService.getProcessingStatistics.mockResolvedValue({
      totalDocuments: 10,
      totalExtractions: 25,
      averageProcessingTime: 3000,
      successRate: 0.92,
      errorRate: 0.08,
      byType: {
        boq_extraction: 10,
        specification_analysis: 8,
        risk_identification: 5,
        compliance_checking: 2,
        categorization: 0,
        summary_generation: 0
      },
      byLanguage: { ar: 20, en: 5, auto: 0 },
      trends: []
    })
    mockService.getAccuracyMetrics.mockResolvedValue({
      overallAccuracy: 0.89,
      boqAccuracy: 0.92,
      specificationAccuracy: 0.87,
      riskAccuracy: 0.85,
      categorizationAccuracy: 0.91,
      byDocumentType: {
        tender_document: 0.90,
        specification: 0.87,
        boq: 0.94,
        technical_requirements: 0.85,
        contract: 0.88,
        proposal: 0.86,
        report: 0.89,
        correspondence: 0.82,
        drawing: 0.75,
        other: 0.80
      },
      confidenceDistribution: {
        high: 0.65,
        medium: 0.25,
        low: 0.08,
        veryLow: 0.02
      }
    })
  })

  describe('Component Rendering', () => {
    it('should render component with header and tabs', () => {
      render(<NaturalLanguageProcessing />)
      
      expect(screen.getByText('معالجة اللغة الطبيعية')).toBeInTheDocument()
      expect(screen.getByText('تحليل المستندات واستخراج البيانات بالذكاء الاصطناعي')).toBeInTheDocument()
      expect(screen.getByText('AI-Powered')).toBeInTheDocument()
    })

    it('should render all tab triggers', () => {
      render(<NaturalLanguageProcessing />)
      
      expect(screen.getByText('رفع المستندات')).toBeInTheDocument()
      expect(screen.getByText('المعالجة')).toBeInTheDocument()
      expect(screen.getByText('الاستخراجات')).toBeInTheDocument()
      expect(screen.getByText('التقارير')).toBeInTheDocument()
      expect(screen.getByText('التحليلات')).toBeInTheDocument()
    })

    it('should render upload tab by default', () => {
      render(<NaturalLanguageProcessing />)
      
      expect(screen.getByText('رفع مستند جديد')).toBeInTheDocument()
      expect(screen.getByText('ارفع المستندات لتحليلها واستخراج البيانات منها باستخدام الذكاء الاصطناعي')).toBeInTheDocument()
    })

    it('should have proper RTL direction', () => {
      const { container } = render(<NaturalLanguageProcessing />)
      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveAttribute('dir', 'rtl')
    })
  })

  describe('Document Upload Tab', () => {
    it('should render file upload input', () => {
      render(<NaturalLanguageProcessing />)
      
      const fileInput = screen.getByLabelText('اختر المستند')
      expect(fileInput).toBeInTheDocument()
      expect(fileInput).toHaveAttribute('type', 'file')
      expect(fileInput).toHaveAttribute('accept', '.pdf,.doc,.docx,.txt')
    })

    it('should render extraction type checkboxes', () => {
      render(<NaturalLanguageProcessing />)
      
      expect(screen.getByText('استخراج جدول الكميات')).toBeInTheDocument()
      expect(screen.getByText('تحليل المواصفات')).toBeInTheDocument()
      expect(screen.getByText('تحديد المخاطر')).toBeInTheDocument()
      expect(screen.getByText('التصنيف')).toBeInTheDocument()
    })

    it('should show selected file information', async () => {
      const user = userEvent.setup()
      render(<NaturalLanguageProcessing />)
      
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      const fileInput = screen.getByLabelText('اختر المستند')
      
      await user.upload(fileInput, file)
      
      await waitFor(() => {
        expect(screen.getByText(/الملف المحدد: test.pdf/)).toBeInTheDocument()
      })
    })

    it('should handle extraction type selection', async () => {
      const user = userEvent.setup()
      render(<NaturalLanguageProcessing />)
      
      const specAnalysisCheckbox = screen.getByRole('checkbox', { name: /تحليل المواصفات/ })
      await user.click(specAnalysisCheckbox)
      
      expect(specAnalysisCheckbox).toBeChecked()
    })

    it('should process document when button is clicked', async () => {
      const user = userEvent.setup()
      const mockJob = {
        id: 'job_001',
        type: 'boq_extraction' as const,
        documentId: 'doc_001',
        status: 'pending' as const,
        progress: 0,
        startedAt: '2024-01-01T00:00:00Z'
      }

      mockService.processDocument.mockResolvedValue(mockJob)
      mockService.getProcessingJob.mockResolvedValue({ ...mockJob, status: 'completed', progress: 100 })

      render(<NaturalLanguageProcessing />)
      
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      const fileInput = screen.getByLabelText('اختر المستند')
      await user.upload(fileInput, file)
      
      const processButton = screen.getByText('بدء المعالجة')
      await user.click(processButton)
      
      expect(mockService.processDocument).toHaveBeenCalled()
    })

    it('should show error when no file is selected', async () => {
      const user = userEvent.setup()
      render(<NaturalLanguageProcessing />)
      
      const processButton = screen.getByText('بدء المعالجة')
      await user.click(processButton)
      
      await waitFor(() => {
        expect(screen.getByText('يرجى اختيار ملف للمعالجة')).toBeInTheDocument()
      })
    })
  })

  describe('Processing Tab', () => {
    it('should switch to processing tab', async () => {
      const user = userEvent.setup()
      render(<NaturalLanguageProcessing />)
      
      const processingTab = screen.getByText('المعالجة')
      await user.click(processingTab)
      
      expect(screen.getByText('مهام المعالجة')).toBeInTheDocument()
    })

    it('should render search input in processing tab', async () => {
      const user = userEvent.setup()
      render(<NaturalLanguageProcessing />)
      
      const processingTab = screen.getByText('المعالجة')
      await user.click(processingTab)
      
      expect(screen.getByPlaceholderText('البحث في المهام...')).toBeInTheDocument()
    })

    it('should show no jobs message when empty', async () => {
      const user = userEvent.setup()
      render(<NaturalLanguageProcessing />)
      
      const processingTab = screen.getByText('المعالجة')
      await user.click(processingTab)
      
      await waitFor(() => {
        expect(screen.getByText('لا توجد مهام معالجة')).toBeInTheDocument()
      })
    })

    it('should display processing jobs when available', async () => {
      const user = userEvent.setup()
      const mockJobs = [
        {
          id: 'job_001',
          type: 'boq_extraction' as const,
          documentId: 'doc_001',
          status: 'completed' as const,
          progress: 100,
          startedAt: '2024-01-01T00:00:00Z',
          completedAt: '2024-01-01T00:05:00Z'
        }
      ]

      mockService.getProcessingJobs.mockResolvedValue(mockJobs)

      render(<NaturalLanguageProcessing />)
      
      const processingTab = screen.getByText('المعالجة')
      await user.click(processingTab)
      
      await waitFor(() => {
        expect(screen.getByText(/مهمة/)).toBeInTheDocument()
        expect(screen.getByText('مكتملة')).toBeInTheDocument()
      })
    })
  })

  describe('Extractions Tab', () => {
    it('should switch to extractions tab', async () => {
      const user = userEvent.setup()
      render(<NaturalLanguageProcessing />)
      
      const extractionsTab = screen.getByText('الاستخراجات')
      await user.click(extractionsTab)
      
      expect(screen.getByText('استخراجات جدول الكميات')).toBeInTheDocument()
      expect(screen.getByText('تحليلات المواصفات')).toBeInTheDocument()
    })

    it('should show extraction counts', async () => {
      const user = userEvent.setup()
      render(<NaturalLanguageProcessing />)
      
      const extractionsTab = screen.getByText('الاستخراجات')
      await user.click(extractionsTab)
      
      await waitFor(() => {
        expect(screen.getByText('0 استخراج متاح')).toBeInTheDocument()
        expect(screen.getByText('0 تحليل متاح')).toBeInTheDocument()
      })
    })
  })

  describe('Reports Tab', () => {
    it('should switch to reports tab', async () => {
      const user = userEvent.setup()
      render(<NaturalLanguageProcessing />)
      
      const reportsTab = screen.getByText('التقارير')
      await user.click(reportsTab)
      
      expect(screen.getByText('التقارير المُنشأة')).toBeInTheDocument()
      expect(screen.getByText('إنشاء وإدارة التقارير من نتائج التحليل')).toBeInTheDocument()
    })

    it('should show no reports message when empty', async () => {
      const user = userEvent.setup()
      render(<NaturalLanguageProcessing />)
      
      const reportsTab = screen.getByText('التقارير')
      await user.click(reportsTab)
      
      await waitFor(() => {
        expect(screen.getByText('لا توجد تقارير منشأة')).toBeInTheDocument()
      })
    })
  })

  describe('Analytics Tab', () => {
    it('should switch to analytics tab', async () => {
      const user = userEvent.setup()
      render(<NaturalLanguageProcessing />)
      
      const analyticsTab = screen.getByText('التحليلات')
      await user.click(analyticsTab)
      
      expect(screen.getByText('إحصائيات المعالجة')).toBeInTheDocument()
      expect(screen.getByText('مقاييس الدقة')).toBeInTheDocument()
    })

    it('should display processing statistics', async () => {
      const user = userEvent.setup()
      render(<NaturalLanguageProcessing />)
      
      const analyticsTab = screen.getByText('التحليلات')
      await user.click(analyticsTab)
      
      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument() // Total documents
        expect(screen.getByText('92%')).toBeInTheDocument() // Success rate
      })
    })

    it('should display accuracy metrics', async () => {
      const user = userEvent.setup()
      render(<NaturalLanguageProcessing />)
      
      const analyticsTab = screen.getByText('التحليلات')
      await user.click(analyticsTab)
      
      await waitFor(() => {
        expect(screen.getByText('89%')).toBeInTheDocument() // Overall accuracy
        expect(screen.getByText('87%')).toBeInTheDocument() // Specification accuracy
        expect(screen.getByText('85%')).toBeInTheDocument() // Risk accuracy
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message when service fails', async () => {
      mockService.getProcessingJobs.mockRejectedValue(new Error('Service error'))
      
      render(<NaturalLanguageProcessing />)
      
      await waitFor(() => {
        expect(screen.getByText('فشل في تحميل بيانات معالجة اللغة الطبيعية')).toBeInTheDocument()
      })
    })

    it('should handle document processing errors', async () => {
      const user = userEvent.setup()
      mockService.processDocument.mockRejectedValue(new Error('Processing error'))
      
      render(<NaturalLanguageProcessing />)
      
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      const fileInput = screen.getByLabelText('اختر المستند')
      await user.upload(fileInput, file)
      
      const processButton = screen.getByText('بدء المعالجة')
      await user.click(processButton)
      
      await waitFor(() => {
        expect(screen.getByText('فشل في معالجة المستند')).toBeInTheDocument()
      })
    })
  })

  describe('User Interactions', () => {
    it('should handle search functionality', async () => {
      const user = userEvent.setup()
      const mockJobs = [
        {
          id: 'job_001',
          type: 'boq_extraction' as const,
          documentId: 'doc_001',
          status: 'completed' as const,
          progress: 100,
          startedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'job_002',
          type: 'specification_analysis' as const,
          documentId: 'doc_002',
          status: 'processing' as const,
          progress: 50,
          startedAt: '2024-01-01T00:01:00Z'
        }
      ]

      mockService.getProcessingJobs.mockResolvedValue(mockJobs)

      render(<NaturalLanguageProcessing />)
      
      const processingTab = screen.getByText('المعالجة')
      await user.click(processingTab)
      
      await waitFor(() => {
        expect(screen.getAllByText(/مهمة/)).toHaveLength(2)
      })
      
      const searchInput = screen.getByPlaceholderText('البحث في المهام...')
      await user.type(searchInput, 'job_001')
      
      // Note: This test verifies the search input works, actual filtering would need more complex testing
      expect(searchInput).toHaveValue('job_001')
    })

    it('should call onDocumentProcessed callback', async () => {
      const user = userEvent.setup()
      const onDocumentProcessed = vi.fn()
      const mockJob = {
        id: 'job_001',
        type: 'boq_extraction' as const,
        documentId: 'doc_001',
        status: 'pending' as const,
        progress: 0,
        startedAt: '2024-01-01T00:00:00Z'
      }

      mockService.processDocument.mockResolvedValue(mockJob)

      render(<NaturalLanguageProcessing onDocumentProcessed={onDocumentProcessed} />)
      
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      const fileInput = screen.getByLabelText('اختر المستند')
      await user.upload(fileInput, file)
      
      const processButton = screen.getByText('بدء المعالجة')
      await user.click(processButton)
      
      await waitFor(() => {
        expect(onDocumentProcessed).toHaveBeenCalledWith(mockJob)
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<NaturalLanguageProcessing />)
      
      const fileInput = screen.getByLabelText('اختر المستند')
      expect(fileInput).toBeInTheDocument()
      
      const processButton = screen.getByRole('button', { name: 'بدء المعالجة' })
      expect(processButton).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<NaturalLanguageProcessing />)
      
      // Tab through the interface
      await user.tab()
      expect(screen.getByText('رفع المستندات')).toHaveFocus()
      
      await user.tab()
      expect(screen.getByText('المعالجة')).toHaveFocus()
    })
  })
})
