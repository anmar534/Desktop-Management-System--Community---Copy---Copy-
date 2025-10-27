/**
 * ProjectStatsCards Component Tests
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  ProjectStatsCards,
  type ProjectStats,
} from '@/presentation/components/projects/ProjectStatsCards'

describe('ProjectStatsCards', () => {
  const mockStats: ProjectStats = {
    totalProjects: 10,
    activeProjects: 5,
    completedProjects: 3,
    onHoldProjects: 2,
    totalBudget: 1000000,
    totalContractValue: 850000,
    averageProgress: 65.5,
  }

  it('displays all stat cards with correct values', () => {
    render(<ProjectStatsCards stats={mockStats} />)

    expect(screen.getByText('إجمالي المشاريع')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()

    expect(screen.getByText('مشاريع نشطة')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()

    expect(screen.getByText('مشاريع مكتملة')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()

    expect(screen.getByText('متوقفة أو قيد الانتظار')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('displays financial stats correctly', () => {
    render(<ProjectStatsCards stats={mockStats} />)

    expect(screen.getByText('إجمالي الميزانية')).toBeInTheDocument()
    expect(screen.getByText('إجمالي قيمة العقود')).toBeInTheDocument()
    expect(screen.getByText('متوسط الإنجاز')).toBeInTheDocument()
    expect(screen.getByText('66%')).toBeInTheDocument() // Rounded average
  })

  it('renders correctly with zero stats', () => {
    const zeroStats: ProjectStats = {
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      onHoldProjects: 0,
      totalBudget: 0,
      totalContractValue: 0,
      averageProgress: 0,
    }

    render(<ProjectStatsCards stats={zeroStats} />)

    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThan(0)
  })
})
