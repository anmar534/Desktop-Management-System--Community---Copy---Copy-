/**
 * ProjectTenderBadge Component Tests
 * Week 4 - Task 1.3: UI Components for Tender-Project Linking
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProjectTenderBadge from '@/presentation/components/projects/ProjectTenderBadge'
import type { ITenderRepository } from '@/repository/providers/tender.local'
import type { Tender } from '@/data/centralData'
import type { TenderProjectLink } from '@/types/projects'

// Mock service registry
const mockTenderRepo: Partial<ITenderRepository> = {
  getById: vi.fn(),
}

vi.mock('@/application/services/serviceRegistry', () => ({
  getTenderRepository: () => mockTenderRepo,
}))

// ============================================================================
// Test Data
// ============================================================================

const mockTender: Tender = {
  id: 'tender_1',
  name: 'مشروع بناء مدرسة',
  title: 'مشروع بناء مدرسة',
  client: 'وزارة التعليم',
  value: 5000000,
  status: 'won',
  deadline: '2025-12-31',
  submissionDate: '2025-01-01',
  type: 'construction',
  location: 'الرياض',
  category: 'building',
  phase: 'execution',
  daysLeft: 30,
  progress: 50,
  priority: 'high',
  team: 'Team A',
  manager: 'أحمد محمد',
  winChance: 85,
  competition: 'medium',
  competitors: [],
  lastAction: 'تم التقديم',
  requirements: [],
  documents: [],
  proposals: [],
  evaluationCriteria: [],
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  lastUpdate: '2025-01-01',
}

const mockTenderLink: TenderProjectLink = {
  id: 'link_1',
  tenderId: 'tender_1',
  projectId: 'project_1',
  linkType: 'created_from',
  linkDate: '2025-01-15T00:00:00Z',
  notes: 'تم إنشاء المشروع من المنافسة الفائزة',
  metadata: {},
}

// ============================================================================
// Tests
// ============================================================================

describe('ProjectTenderBadge Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // Rendering Tests
  // ==========================================================================

  it('should render nothing when no tender link is provided', () => {
    const { container } = render(<ProjectTenderBadge tenderLink={null} />)

    expect(container.firstChild).toBeNull()
  })

  it('should show loading state while fetching tender data', async () => {
    ;(mockTenderRepo.getById as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockTender), 100)),
    )

    render(<ProjectTenderBadge tenderLink={mockTenderLink} />)

    expect(screen.getByText('جاري التحميل...')).toBeInTheDocument()
  })

  it('should display badge variant by default', async () => {
    ;(mockTenderRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(mockTender)

    render(<ProjectTenderBadge tenderLink={mockTenderLink} variant="badge" />)

    await waitFor(() => {
      expect(screen.getByText('مشروع بناء مدرسة')).toBeInTheDocument()
    })
  })

  it('should display card variant when specified', async () => {
    ;(mockTenderRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(mockTender)

    render(<ProjectTenderBadge tenderLink={mockTenderLink} variant="card" showDetails />)

    await waitFor(() => {
      expect(screen.getByText('مشروع بناء مدرسة')).toBeInTheDocument()
      expect(screen.getByText('وزارة التعليم')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Link Type Display Tests
  // ==========================================================================

  it('should display correct link type label for created_from', async () => {
    ;(mockTenderRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(mockTender)

    const linkWithType = { ...mockTenderLink, linkType: 'created_from' as const }
    render(<ProjectTenderBadge tenderLink={linkWithType} variant="badge" />)

    await waitFor(() => {
      expect(screen.getByText('تم إنشاؤه من')).toBeInTheDocument()
    })
  })

  it('should display correct link type label for related_to', async () => {
    ;(mockTenderRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(mockTender)

    const linkWithType = { ...mockTenderLink, linkType: 'related_to' as const }
    render(<ProjectTenderBadge tenderLink={linkWithType} variant="badge" />)

    await waitFor(() => {
      expect(screen.getByText('مرتبط بـ')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Card Variant Details Tests
  // ==========================================================================

  it('should show tender details in card variant', async () => {
    ;(mockTenderRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(mockTender)

    render(<ProjectTenderBadge tenderLink={mockTenderLink} variant="card" showDetails />)

    await waitFor(() => {
      // Check for client
      expect(screen.getByText('العميل:')).toBeInTheDocument()
      expect(screen.getByText('وزارة التعليم')).toBeInTheDocument()

      // Check for value
      expect(screen.getByText('القيمة:')).toBeInTheDocument()
    })
  })

  it('should show notes in card variant when available', async () => {
    ;(mockTenderRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(mockTender)

    render(<ProjectTenderBadge tenderLink={mockTenderLink} variant="card" showDetails />)

    await waitFor(() => {
      expect(screen.getByText('تم إنشاء المشروع من المنافسة الفائزة')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Navigation Tests
  // ==========================================================================

  it('should call onNavigateToTender when clicking badge', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()

    ;(mockTenderRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(mockTender)

    render(
      <ProjectTenderBadge
        tenderLink={mockTenderLink}
        variant="badge"
        onNavigateToTender={onNavigate}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('مشروع بناء مدرسة')).toBeInTheDocument()
    })

    const badge = screen.getByText('مشروع بناء مدرسة').closest('[class*="cursor-pointer"]')
    if (badge) {
      await user.click(badge)
      expect(onNavigate).toHaveBeenCalledWith('tender_1')
    }
  })

  it('should show navigate button in card variant', async () => {
    const onNavigate = vi.fn()

    ;(mockTenderRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(mockTender)

    render(
      <ProjectTenderBadge
        tenderLink={mockTenderLink}
        variant="card"
        onNavigateToTender={onNavigate}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('عرض تفاصيل المنافسة')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  it('should show error state when tender is not found', async () => {
    ;(mockTenderRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    render(<ProjectTenderBadge tenderLink={mockTenderLink} />)

    await waitFor(() => {
      expect(screen.getByText('منافسة غير موجودة')).toBeInTheDocument()
    })
  })
})
