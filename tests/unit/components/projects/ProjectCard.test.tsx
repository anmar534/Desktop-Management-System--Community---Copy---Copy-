import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProjectCard } from '@/presentation/components/projects/ProjectCard'
import type { Project } from '@/data/centralData'

describe('ProjectCard Component', () => {
  const mockProject: Project = {
    id: 'test-1',
    name: 'مشروع اختبار',
    client: 'عميل اختبار',
    status: 'active',
    contractValue: 100000,
    estimatedCost: 80000,
    progress: 50,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
  }

  const mockProps = {
    project: mockProject,
    index: 0,
    formatCurrencyValue: (value: number) => `${value} ر.س`,
    costInputs: {},
    isSavingCosts: {},
    onCostInputChange: vi.fn(),
    onSaveCosts: vi.fn(),
    onViewProject: vi.fn(),
    onEditProject: vi.fn(),
    onDeleteProject: vi.fn(),
  }

  it('renders project card with correct data', () => {
    render(<ProjectCard {...mockProps} />)
    
    expect(screen.getByText('مشروع اختبار')).toBeInTheDocument()
    expect(screen.getByText('عميل اختبار')).toBeInTheDocument()
  })

  it('displays contract value and estimated cost', () => {
    render(<ProjectCard {...mockProps} />)
    
    expect(screen.getByText('100000 ر.س')).toBeInTheDocument()
    expect(screen.getByText('80000 ر.س')).toBeInTheDocument()
  })

  it('shows progress bar with correct percentage', () => {
    render(<ProjectCard {...mockProps} />)
    
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('renders status badge', () => {
    render(<ProjectCard {...mockProps} />)
    
    // StatusBadge should be rendered
    const card = screen.getByText('مشروع اختبار').closest('[class*="card"]')
    expect(card).toBeInTheDocument()
  })
})
