/**
 * ProjectPagination Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectPagination } from '@/presentation/components/projects/ProjectPagination'

describe('ProjectPagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    pageSize: 10,
    totalItems: 50,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
  }

  it('renders pagination info correctly', () => {
    render(<ProjectPagination {...defaultProps} />)

    expect(screen.getByText('عرض 1 - 10 من 50 مشروع')).toBeInTheDocument()
  })

  it('disables previous button on first page', () => {
    render(<ProjectPagination {...defaultProps} currentPage={1} />)

    const prevButton = screen.getByRole('button', { name: 'السابق' })
    expect(prevButton).toBeDisabled()
  })

  it('disables next button on last page', () => {
    render(<ProjectPagination {...defaultProps} currentPage={5} totalPages={5} />)

    const nextButton = screen.getByRole('button', { name: 'التالي' })
    expect(nextButton).toBeDisabled()
  })

  it('calls onPageChange when clicking page number', async () => {
    const user = userEvent.setup()
    render(<ProjectPagination {...defaultProps} />)

    const page3Button = screen.getByRole('button', { name: '3' })
    await user.click(page3Button)

    expect(defaultProps.onPageChange).toHaveBeenCalledWith(3)
  })

  it('does not render when totalPages is 1', () => {
    const { container } = render(<ProjectPagination {...defaultProps} totalPages={1} />)

    expect(container.firstChild).toBeNull()
  })

  it('renders all page number buttons', () => {
    render(<ProjectPagination {...defaultProps} totalPages={5} />)

    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument()
  })
})
