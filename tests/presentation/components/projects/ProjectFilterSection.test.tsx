/**
 * ProjectFilterSection Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectFilterSection } from '@/presentation/components/projects/ProjectFilterSection'

describe('ProjectFilterSection', () => {
  const mockClients = ['عميل 1', 'عميل 2', 'عميل 3']
  const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    statusValue: 'all',
    onStatusChange: vi.fn(),
    clientValue: 'all',
    onClientChange: vi.fn(),
    clients: mockClients,
    onClearFilters: vi.fn(),
    isFiltering: false,
  }

  it('renders search input correctly', () => {
    render(<ProjectFilterSection {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText('ابحث باسم المشروع أو العميل')
    expect(searchInput).toBeInTheDocument()
  })

  it('calls onSearchChange when typing in search input', async () => {
    const user = userEvent.setup()
    render(<ProjectFilterSection {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText('ابحث باسم المشروع أو العميل')
    await user.type(searchInput, 'test')

    expect(defaultProps.onSearchChange).toHaveBeenCalled()
  })

  it('renders status and client filters', () => {
    render(<ProjectFilterSection {...defaultProps} />)

    // Check for placeholder text shown in SelectTrigger
    expect(screen.getByText('كل الحالات')).toBeInTheDocument()
    expect(screen.getByText('كل العملاء')).toBeInTheDocument()
  })

  it('disables clear filters button when not filtering', () => {
    render(<ProjectFilterSection {...defaultProps} isFiltering={false} />)

    const clearButton = screen.getByRole('button', { name: /مسح الفلاتر/i })
    expect(clearButton).toBeDisabled()
  })

  it('enables clear filters button when filtering', () => {
    render(<ProjectFilterSection {...defaultProps} isFiltering={true} />)

    const clearButton = screen.getByRole('button', { name: /مسح الفلاتر/i })
    expect(clearButton).not.toBeDisabled()
  })
})
