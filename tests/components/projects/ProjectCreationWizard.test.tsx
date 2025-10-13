/**
 * Project Creation Wizard Component Tests
 * اختبارات مكون معالج إنشاء المشاريع
 */

import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProjectCreationWizard from '../../../src/components/projects/ProjectCreationWizard'

// Mock the enhanced project service
vi.mock('../../../src/services/enhancedProjectService', () => ({
  enhancedProjectService: {
    createProjectFromTender: vi.fn(),
    getTenderData: vi.fn()
  }
}))

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn()
  }
}))

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}))

describe('ProjectCreationWizard', () => {
  const mockTenderData = {
    id: 'tender-123',
    title: 'مشروع إنشاء مجمع سكني',
    titleEn: 'Residential Complex Construction Project',
    description: 'إنشاء مجمع سكني يتكون من 50 وحدة سكنية',
    client: 'شركة التطوير العقاري المحدودة',
    value: 15000000,
    currency: 'SAR',
    startDate: '2024-11-01',
    endDate: '2025-10-31',
    location: 'الرياض، المملكة العربية السعودية',
    category: 'construction',
    status: 'won',
    boq: [
      {
        id: '1',
        description: 'أعمال الحفر والأساسات',
        quantity: 1000,
        unit: 'م3',
        unitPrice: 150,
        totalPrice: 150000
      }
    ]
  }

  const mockCreatedProject = {
    id: 'project-456',
    name: 'مشروع إنشاء مجمع سكني',
    description: 'إنشاء مجمع سكني يتكون من 50 وحدة سكنية',
    client: 'شركة التطوير العقاري المحدودة',
    status: 'planning',
    priority: 'high',
    category: 'construction',
    startDate: '2024-11-01',
    endDate: '2025-10-31',
    budget: {
      total: 15000000,
      spent: 0,
      remaining: 15000000,
      contingency: 1500000,
      currency: 'SAR'
    }
  }

  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    const { enhancedProjectService } = require('../../../src/services/enhancedProjectService')
    enhancedProjectService.getTenderData.mockResolvedValue(mockTenderData)
    enhancedProjectService.createProjectFromTender.mockResolvedValue(mockCreatedProject)
  })

  describe('Wizard Navigation', () => {
    it('should render initial step with tender information', async () => {
      render(<ProjectCreationWizard tenderId="tender-123" />)

      await waitFor(() => {
        expect(screen.getByText('إنشاء مشروع من مناقصة')).toBeInTheDocument()
        expect(screen.getByText('الخطوة 1 من 5')).toBeInTheDocument()
        expect(screen.getByText('معلومات المناقصة')).toBeInTheDocument()
        expect(screen.getByText('مشروع إنشاء مجمع سكني')).toBeInTheDocument()
        expect(screen.getByText('شركة التطوير العقاري المحدودة')).toBeInTheDocument()
      })
    })

    it('should navigate to next step', async () => {
      render(<ProjectCreationWizard tenderId="tender-123" />)

      await waitFor(() => {
        const nextButton = screen.getByText('التالي')
        fireEvent.click(nextButton)
      })

      await waitFor(() => {
        expect(screen.getByText('الخطوة 2 من 5')).toBeInTheDocument()
        expect(screen.getByText('تفاصيل المشروع')).toBeInTheDocument()
      })
    })

    it('should navigate back to previous step', async () => {
      render(<ProjectCreationWizard tenderId="tender-123" />)

      // الانتقال للخطوة الثانية
      await waitFor(() => {
        const nextButton = screen.getByText('التالي')
        fireEvent.click(nextButton)
      })

      // العودة للخطوة الأولى
      await waitFor(() => {
        const backButton = screen.getByText('السابق')
        fireEvent.click(backButton)
      })

      await waitFor(() => {
        expect(screen.getByText('الخطوة 1 من 5')).toBeInTheDocument()
        expect(screen.getByText('معلومات المناقصة')).toBeInTheDocument()
      })
    })

    it('should show progress indicator', async () => {
      render(<ProjectCreationWizard tenderId="tender-123" />)

      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar')
        expect(progressBar).toHaveAttribute('aria-valuenow', '20') // 1/5 = 20%
      })
    })
  })

  describe('Step 2: Project Details', () => {
    beforeEach(async () => {
      render(<ProjectCreationWizard tenderId="tender-123" />)
      
      await waitFor(() => {
        const nextButton = screen.getByText('التالي')
        fireEvent.click(nextButton)
      })
    })

    it('should render project details form', async () => {
      await waitFor(() => {
        expect(screen.getByLabelText('اسم المشروع')).toBeInTheDocument()
        expect(screen.getByLabelText('الاسم بالإنجليزية')).toBeInTheDocument()
        expect(screen.getByLabelText('وصف المشروع')).toBeInTheDocument()
        expect(screen.getByLabelText('أولوية المشروع')).toBeInTheDocument()
        expect(screen.getByLabelText('فئة المشروع')).toBeInTheDocument()
      })
    })

    it('should pre-fill form with tender data', async () => {
      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('مشروع إنشاء مجمع سكني')
        const nameEnInput = screen.getByDisplayValue('Residential Complex Construction Project')
        const descriptionInput = screen.getByDisplayValue('إنشاء مجمع سكني يتكون من 50 وحدة سكنية')
        
        expect(nameInput).toBeInTheDocument()
        expect(nameEnInput).toBeInTheDocument()
        expect(descriptionInput).toBeInTheDocument()
      })
    })

    it('should validate required fields', async () => {
      await waitFor(() => {
        const nameInput = screen.getByLabelText('اسم المشروع')
        fireEvent.change(nameInput, { target: { value: '' } })
        
        const nextButton = screen.getByText('التالي')
        fireEvent.click(nextButton)
      })

      await waitFor(() => {
        expect(screen.getByText('اسم المشروع مطلوب')).toBeInTheDocument()
      })
    })

    it('should allow editing project details', async () => {
      await waitFor(() => {
        const nameInput = screen.getByLabelText('اسم المشروع')
        fireEvent.change(nameInput, { target: { value: 'مشروع محدث' } })
        
        expect(screen.getByDisplayValue('مشروع محدث')).toBeInTheDocument()
      })
    })
  })

  describe('Step 3: Budget and Schedule', () => {
    beforeEach(async () => {
      render(<ProjectCreationWizard tenderId="tender-123" />)
      
      // الانتقال للخطوة الثالثة
      await waitFor(() => {
        fireEvent.click(screen.getByText('التالي'))
      })
      await waitFor(() => {
        fireEvent.click(screen.getByText('التالي'))
      })
    })

    it('should render budget and schedule form', async () => {
      await waitFor(() => {
        expect(screen.getByText('الخطوة 3 من 5')).toBeInTheDocument()
        expect(screen.getByText('الميزانية والجدولة')).toBeInTheDocument()
        expect(screen.getByLabelText('تاريخ البداية')).toBeInTheDocument()
        expect(screen.getByLabelText('تاريخ النهاية')).toBeInTheDocument()
        expect(screen.getByLabelText('الميزانية الإجمالية')).toBeInTheDocument()
        expect(screen.getByLabelText('نسبة الطوارئ')).toBeInTheDocument()
      })
    })

    it('should pre-fill budget from tender value', async () => {
      await waitFor(() => {
        const budgetInput = screen.getByDisplayValue('15,000,000')
        expect(budgetInput).toBeInTheDocument()
      })
    })

    it('should calculate contingency automatically', async () => {
      await waitFor(() => {
        const contingencyInput = screen.getByLabelText('نسبة الطوارئ')
        expect(contingencyInput).toHaveValue(10) // 10% default
        
        const contingencyAmount = screen.getByText('1,500,000 ر.س')
        expect(contingencyAmount).toBeInTheDocument()
      })
    })

    it('should validate date range', async () => {
      await waitFor(() => {
        const startDateInput = screen.getByLabelText('تاريخ البداية')
        const endDateInput = screen.getByLabelText('تاريخ النهاية')
        
        fireEvent.change(startDateInput, { target: { value: '2024-12-01' } })
        fireEvent.change(endDateInput, { target: { value: '2024-11-01' } })
        
        const nextButton = screen.getByText('التالي')
        fireEvent.click(nextButton)
      })

      await waitFor(() => {
        expect(screen.getByText('تاريخ النهاية يجب أن يكون بعد تاريخ البداية')).toBeInTheDocument()
      })
    })
  })

  describe('Step 4: Team and Settings', () => {
    beforeEach(async () => {
      render(<ProjectCreationWizard tenderId="tender-123" />)
      
      // الانتقال للخطوة الرابعة
      for (let i = 0; i < 3; i++) {
        await waitFor(() => {
          fireEvent.click(screen.getByText('التالي'))
        })
      }
    })

    it('should render team and settings form', async () => {
      await waitFor(() => {
        expect(screen.getByText('الخطوة 4 من 5')).toBeInTheDocument()
        expect(screen.getByText('الفريق والإعدادات')).toBeInTheDocument()
        expect(screen.getByLabelText('مدير المشروع')).toBeInTheDocument()
        expect(screen.getByText('خيارات التكامل')).toBeInTheDocument()
      })
    })

    it('should show integration options', async () => {
      await waitFor(() => {
        expect(screen.getByLabelText('استيراد BOQ من المناقصة')).toBeInTheDocument()
        expect(screen.getByLabelText('إنشاء مهام تلقائياً من المراحل')).toBeInTheDocument()
        expect(screen.getByLabelText('إعداد المعالم الرئيسية')).toBeInTheDocument()
        expect(screen.getByLabelText('تفعيل التتبع')).toBeInTheDocument()
      })
    })

    it('should allow selecting integration options', async () => {
      await waitFor(() => {
        const boqCheckbox = screen.getByLabelText('استيراد BOQ من المناقصة')
        fireEvent.click(boqCheckbox)
        
        expect(boqCheckbox).toBeChecked()
      })
    })
  })

  describe('Step 5: Review and Create', () => {
    beforeEach(async () => {
      render(<ProjectCreationWizard tenderId="tender-123" />)
      
      // الانتقال للخطوة الخامسة
      for (let i = 0; i < 4; i++) {
        await waitFor(() => {
          fireEvent.click(screen.getByText('التالي'))
        })
      }
    })

    it('should render review step', async () => {
      await waitFor(() => {
        expect(screen.getByText('الخطوة 5 من 5')).toBeInTheDocument()
        expect(screen.getByText('مراجعة وإنشاء')).toBeInTheDocument()
        expect(screen.getByText('ملخص المشروع')).toBeInTheDocument()
        expect(screen.getByText('إنشاء المشروع')).toBeInTheDocument()
      })
    })

    it('should show project summary', async () => {
      await waitFor(() => {
        expect(screen.getByText('مشروع إنشاء مجمع سكني')).toBeInTheDocument()
        expect(screen.getByText('شركة التطوير العقاري المحدودة')).toBeInTheDocument()
        expect(screen.getByText('15,000,000 ر.س')).toBeInTheDocument()
        expect(screen.getByText('2024-11-01')).toBeInTheDocument()
        expect(screen.getByText('2025-10-31')).toBeInTheDocument()
      })
    })

    it('should create project successfully', async () => {
      await waitFor(() => {
        const createButton = screen.getByText('إنشاء المشروع')
        fireEvent.click(createButton)
      })

      await waitFor(() => {
        const { enhancedProjectService } = require('../../../src/services/enhancedProjectService')
        expect(enhancedProjectService.createProjectFromTender).toHaveBeenCalledWith(
          'tender-123',
          expect.any(Object)
        )
      })
    })

    it('should show success message after creation', async () => {
      await waitFor(() => {
        const createButton = screen.getByText('إنشاء المشروع')
        fireEvent.click(createButton)
      })

      await waitFor(() => {
        expect(screen.getByText('تم إنشاء المشروع بنجاح!')).toBeInTheDocument()
        expect(screen.getByText('عرض المشروع')).toBeInTheDocument()
        expect(screen.getByText('إنشاء مشروع آخر')).toBeInTheDocument()
      })
    })

    it('should handle creation errors', async () => {
      const { enhancedProjectService } = require('../../../src/services/enhancedProjectService')
      enhancedProjectService.createProjectFromTender.mockRejectedValue(new Error('Creation failed'))

      await waitFor(() => {
        const createButton = screen.getByText('إنشاء المشروع')
        fireEvent.click(createButton)
      })

      await waitFor(() => {
        const { toast } = require('sonner')
        expect(toast.error).toHaveBeenCalledWith('فشل في إنشاء المشروع')
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading state while fetching tender data', () => {
      const { enhancedProjectService } = require('../../../src/services/enhancedProjectService')
      enhancedProjectService.getTenderData.mockReturnValue(new Promise(() => {})) // معلق

      render(<ProjectCreationWizard tenderId="tender-123" />)

      expect(screen.getByText('جاري تحميل بيانات المناقصة...')).toBeInTheDocument()
    })

    it('should show loading state during project creation', async () => {
      render(<ProjectCreationWizard tenderId="tender-123" />)
      
      // الانتقال للخطوة الأخيرة
      for (let i = 0; i < 4; i++) {
        await waitFor(() => {
          fireEvent.click(screen.getByText('التالي'))
        })
      }

      const { enhancedProjectService } = require('../../../src/services/enhancedProjectService')
      enhancedProjectService.createProjectFromTender.mockReturnValue(new Promise(() => {})) // معلق

      await waitFor(() => {
        const createButton = screen.getByText('إنشاء المشروع')
        fireEvent.click(createButton)
      })

      expect(screen.getByText('جاري إنشاء المشروع...')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle tender not found', async () => {
      const { enhancedProjectService } = require('../../../src/services/enhancedProjectService')
      enhancedProjectService.getTenderData.mockResolvedValue(null)

      render(<ProjectCreationWizard tenderId="non-existent" />)

      await waitFor(() => {
        expect(screen.getByText('المناقصة غير موجودة')).toBeInTheDocument()
      })
    })

    it('should handle network errors', async () => {
      const { enhancedProjectService } = require('../../../src/services/enhancedProjectService')
      enhancedProjectService.getTenderData.mockRejectedValue(new Error('Network error'))

      render(<ProjectCreationWizard tenderId="tender-123" />)

      await waitFor(() => {
        expect(screen.getByText('فشل في تحميل بيانات المناقصة')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<ProjectCreationWizard tenderId="tender-123" />)

      await waitFor(() => {
        expect(screen.getByLabelText('معالج إنشاء المشروع')).toBeInTheDocument()
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'تقدم المعالج')
      })
    })

    it('should support keyboard navigation', async () => {
      render(<ProjectCreationWizard tenderId="tender-123" />)

      await waitFor(() => {
        const nextButton = screen.getByText('التالي')
        expect(nextButton).toHaveAttribute('tabIndex', '0')
      })
    })

    it('should announce step changes to screen readers', async () => {
      render(<ProjectCreationWizard tenderId="tender-123" />)

      await waitFor(() => {
        const stepIndicator = screen.getByText('الخطوة 1 من 5')
        expect(stepIndicator).toHaveAttribute('aria-live', 'polite')
      })
    })
  })

  describe('RTL Support', () => {
    it('should render with RTL direction', async () => {
      render(<ProjectCreationWizard tenderId="tender-123" />)

      await waitFor(() => {
        const wizard = screen.getByLabelText('معالج إنشاء المشروع')
        expect(wizard).toHaveAttribute('dir', 'rtl')
      })
    })

    it('should display Arabic text correctly', async () => {
      render(<ProjectCreationWizard tenderId="tender-123" />)

      await waitFor(() => {
        expect(screen.getByText('إنشاء مشروع من مناقصة')).toBeInTheDocument()
        expect(screen.getByText('معلومات المناقصة')).toBeInTheDocument()
        expect(screen.getByText('مشروع إنشاء مجمع سكني')).toBeInTheDocument()
      })
    })
  })
})
