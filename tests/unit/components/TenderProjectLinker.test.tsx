/**
 * TenderProjectLinker Component Tests
 * Week 4 - Task 1.3: UI Components for Tender-Project Linking
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TenderProjectLinker from '@/presentation/components/projects/TenderProjectLinker'
import type { IEnhancedProjectRepository } from '@/repository/enhancedProject.repository'
import type { ITenderRepository } from '@/repository/providers/tender.local'
import type { Tender } from '@/data/centralData'
import type { TenderProjectLink } from '@/types/projects'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock service registry
const mockEnhancedProjectRepo: Partial<IEnhancedProjectRepository> = {
  getTenderLink: vi.fn(),
  linkToTender: vi.fn(),
  unlinkFromTender: vi.fn(),
}

const mockTenderRepo: Partial<ITenderRepository> = {
  getAll: vi.fn(),
}

vi.mock('@/application/services/serviceRegistry', () => ({
  getEnhancedProjectRepository: () => mockEnhancedProjectRepo,
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
  linkType: 'related_to',
  linkDate: '2025-01-15T00:00:00Z',
  metadata: {},
}

// ============================================================================
// Tests
// ============================================================================

describe('TenderProjectLinker Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // Rendering Tests
  // ==========================================================================

  it('should render link button when no tender is linked', async () => {
    ;(mockEnhancedProjectRepo.getTenderLink as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    render(<TenderProjectLinker projectId="project_1" />)

    await waitFor(() => {
      expect(screen.getByText('ربط بمنافسة')).toBeInTheDocument()
    })
  })

  it('should render unlink button when tender is linked', async () => {
    ;(mockEnhancedProjectRepo.getTenderLink as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTenderLink,
    )

    render(<TenderProjectLinker projectId="project_1" />)

    await waitFor(() => {
      expect(screen.getByText('فك الربط')).toBeInTheDocument()
    })
  })

  it('should show current status badge when not in compact mode', async () => {
    ;(mockEnhancedProjectRepo.getTenderLink as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    render(<TenderProjectLinker projectId="project_1" compact={false} />)

    await waitFor(() => {
      expect(screen.getByText('غير مرتبط')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Link Dialog Tests
  // ==========================================================================

  it('should open link dialog when clicking link button', async () => {
    const user = userEvent.setup()
    ;(mockEnhancedProjectRepo.getTenderLink as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    ;(mockTenderRepo.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([mockTender])

    render(<TenderProjectLinker projectId="project_1" />)

    await waitFor(() => {
      expect(screen.getByText('ربط بمنافسة')).toBeInTheDocument()
    })

    await user.click(screen.getByText('ربط بمنافسة'))

    await waitFor(() => {
      expect(screen.getByText('ربط المشروع بمنافسة')).toBeInTheDocument()
    })
  })

  it('should load tenders when link dialog is opened', async () => {
    const user = userEvent.setup()
    ;(mockEnhancedProjectRepo.getTenderLink as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    ;(mockTenderRepo.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([mockTender])

    render(<TenderProjectLinker projectId="project_1" />)

    await user.click(screen.getByText('ربط بمنافسة'))

    await waitFor(() => {
      expect(mockTenderRepo.getAll).toHaveBeenCalled()
    })
  })

  it('should show loading state while fetching tenders', async () => {
    const user = userEvent.setup()
    ;(mockEnhancedProjectRepo.getTenderLink as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    ;(mockTenderRepo.getAll as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([mockTender]), 100)),
    )

    render(<TenderProjectLinker projectId="project_1" />)

    await user.click(screen.getByText('ربط بمنافسة'))

    await waitFor(() => {
      expect(screen.getByText('جاري التحميل...')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Link Action Tests
  // ==========================================================================

  it('should successfully link project to tender', async () => {
    const user = userEvent.setup()
    const onLinkSuccess = vi.fn()

    ;(mockEnhancedProjectRepo.getTenderLink as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    ;(mockTenderRepo.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([mockTender])
    ;(mockEnhancedProjectRepo.linkToTender as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTenderLink,
    )

    render(<TenderProjectLinker projectId="project_1" onLinkSuccess={onLinkSuccess} />)

    // Open dialog
    await user.click(screen.getByText('ربط بمنافسة'))

    await waitFor(() => {
      expect(screen.getByText('ربط المشروع بمنافسة')).toBeInTheDocument()
    })

    // Select tender
    const selectTrigger = screen.getByRole('combobox')
    await user.click(selectTrigger)

    await waitFor(() => {
      expect(screen.getByText('مشروع بناء مدرسة')).toBeInTheDocument()
    })

    await user.click(screen.getByText('مشروع بناء مدرسة'))

    // Click link button
    const linkButton = screen.getAllByRole('button').find((btn) => btn.textContent?.includes('ربط'))
    if (linkButton) {
      await user.click(linkButton)
    }

    await waitFor(() => {
      expect(mockEnhancedProjectRepo.linkToTender).toHaveBeenCalledWith(
        'project_1',
        'tender_1',
        'related_to',
      )
      expect(onLinkSuccess).toHaveBeenCalledWith(mockTenderLink)
    })
  })

  // ==========================================================================
  // Unlink Tests
  // ==========================================================================

  it('should successfully unlink project from tender', async () => {
    const user = userEvent.setup()
    const onUnlinkSuccess = vi.fn()

    ;(mockEnhancedProjectRepo.getTenderLink as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTenderLink,
    )
    ;(mockEnhancedProjectRepo.unlinkFromTender as ReturnType<typeof vi.fn>).mockResolvedValue(true)

    render(<TenderProjectLinker projectId="project_1" onUnlinkSuccess={onUnlinkSuccess} />)

    await waitFor(() => {
      expect(screen.getByText('فك الربط')).toBeInTheDocument()
    })

    // Open unlink dialog
    await user.click(screen.getByText('فك الربط'))

    await waitFor(() => {
      expect(screen.getByText('فك ربط المشروع من المنافسة')).toBeInTheDocument()
    })

    // Confirm unlink
    const unlinkButton = screen
      .getAllByRole('button')
      .find((btn) => btn.textContent?.includes('فك الربط'))
    if (unlinkButton) {
      await user.click(unlinkButton)
    }

    await waitFor(() => {
      expect(mockEnhancedProjectRepo.unlinkFromTender).toHaveBeenCalledWith('project_1', 'tender_1')
      expect(onUnlinkSuccess).toHaveBeenCalled()
    })
  })

  it('should show confirmation dialog before unlinking', async () => {
    const user = userEvent.setup()
    ;(mockEnhancedProjectRepo.getTenderLink as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTenderLink,
    )

    render(<TenderProjectLinker projectId="project_1" />)

    await user.click(screen.getByText('فك الربط'))

    await waitFor(() => {
      expect(
        screen.getByText(/هل أنت متأكد من فك ربط هذا المشروع من المنافسة؟/),
      ).toBeInTheDocument()
    })
  })
})
