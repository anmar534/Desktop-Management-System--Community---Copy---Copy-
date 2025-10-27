import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProjectTabs } from '@/presentation/components/projects/ProjectTabs'
import type { Project } from '@/data/centralData'
import type { ProjectTabConfig } from '@/shared/config/projectTabsConfig'
import { FolderOpen } from 'lucide-react'

describe('ProjectTabs Component', () => {
  const mockProjects: Project[] = [
    {
      id: '1',
      name: 'مشروع 1',
      client: 'عميل 1',
      status: 'active',
      contractValue: 100000,
      estimatedCost: 80000,
      progress: 50,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
    },
    {
      id: '2',
      name: 'مشروع 2',
      client: 'عميل 2',
      status: 'completed',
      contractValue: 200000,
      estimatedCost: 150000,
      progress: 100,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    },
  ]

  const mockTabs: ProjectTabConfig[] = [
    {
      id: 'all',
      label: 'الكل',
      icon: FolderOpen,
      count: 2,
      color: 'text-primary',
      activeColor: 'bg-primary text-primary-foreground',
      hoverColor: 'hover:bg-primary/10',
      badgeStatus: 'default',
    },
  ]

  const mockProps = {
    tabs: mockTabs,
    activeTab: 'all',
    onTabChange: vi.fn(),
    filteredProjects: mockProjects,
    totalCount: 2,
    formatCurrencyValue: (value: number) => `${value} ر.س`,
    costInputs: {},
    isSavingCosts: {},
    onCostInputChange: vi.fn(),
    onSaveCosts: vi.fn(),
    onViewProject: vi.fn(),
    onEditProject: vi.fn(),
    onDeleteProject: vi.fn(),
    onSectionChange: vi.fn(),
  }

  it('renders tabs component with header', () => {
    render(<ProjectTabs {...mockProps} />)
    
    expect(screen.getByText('تصنيف المشاريع')).toBeInTheDocument()
    expect(screen.getByText('2 من 2 مشروع')).toBeInTheDocument()
  })

  it('displays all project cards', () => {
    render(<ProjectTabs {...mockProps} />)
    
    expect(screen.getByText('مشروع 1')).toBeInTheDocument()
    expect(screen.getByText('مشروع 2')).toBeInTheDocument()
  })

  it('calls onTabChange when tab is clicked', () => {
    const onTabChange = vi.fn()
    render(<ProjectTabs {...mockProps} onTabChange={onTabChange} />)
    
    const tabButton = screen.getByText('الكل').closest('button')
    if (tabButton) {
      fireEvent.click(tabButton)
      expect(onTabChange).toHaveBeenCalledWith('all')
    }
  })

  it('shows empty state when no projects', () => {
    render(<ProjectTabs {...mockProps} filteredProjects={[]} />)
    
    expect(screen.getByText('لا توجد مشاريع')).toBeInTheDocument()
  })
})
