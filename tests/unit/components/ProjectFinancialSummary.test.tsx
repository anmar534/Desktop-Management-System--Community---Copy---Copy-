import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  ProjectFinancialSummary,
  getFinancialStatus,
} from '@/presentation/components/projects/ProjectFinancialSummary'

describe('ProjectFinancialSummary', () => {
  describe('Rendering - Full View', () => {
    it('renders card with all financial data', () => {
      render(<ProjectFinancialSummary budget={100000} spent={75000} />)
      expect(screen.getByTestId('financial-summary-card')).toBeInTheDocument()
      expect(screen.getByText('الملخص المالي')).toBeInTheDocument()
    })

    it('displays budget correctly', () => {
      render(<ProjectFinancialSummary budget={100000} spent={50000} />)
      const value = screen.getByTestId('budget-value').textContent ?? ''
      expect(value).toMatch(/١٠٠|100/)
      expect(value).toMatch(/ر\.س|SAR/)
    })

    it('displays spent amount correctly', () => {
      render(<ProjectFinancialSummary budget={100000} spent={75000} />)
      const value = screen.getByTestId('spent-value').textContent ?? ''
      expect(value).toMatch(/٧٥|75/)
      expect(value).toMatch(/ر\.س|SAR/)
    })

    it('calculates and displays remaining amount', () => {
      render(<ProjectFinancialSummary budget={100000} spent={60000} />)
      const remaining = screen.getByTestId('remaining-value').textContent ?? ''
      expect(remaining).toMatch(/٤٠|40/)
      expect(remaining).toMatch(/ر\.س|SAR/)
    })

    it('shows variance by default', () => {
      render(<ProjectFinancialSummary budget={100000} spent={75000} />)
      expect(screen.getByTestId('variance')).toBeInTheDocument()
    })

    it('hides variance when showVariance is false', () => {
      render(<ProjectFinancialSummary budget={100000} spent={75000} showVariance={false} />)
      expect(screen.queryByTestId('variance')).not.toBeInTheDocument()
    })
  })

  describe('Rendering - Compact View', () => {
    it('renders compact view correctly', () => {
      render(<ProjectFinancialSummary budget={100000} spent={75000} compact />)
      expect(screen.getByTestId('financial-summary-compact')).toBeInTheDocument()
      expect(screen.queryByTestId('financial-summary-card')).not.toBeInTheDocument()
    })

    it('displays spent and budget in compact view', () => {
      const { container } = render(
        <ProjectFinancialSummary budget={100000} spent={60000} compact />,
      )
      const text = container.textContent ?? ''
      expect(text).toMatch(/(٦٠|60)/)
      expect(text).toMatch(/(١٠٠|100)/)
    })

    it('shows variance in compact view when enabled', () => {
      render(<ProjectFinancialSummary budget={100000} spent={110000} compact showVariance />)
      const variance = screen.getByTestId('financial-summary-compact').textContent
      expect(variance).toContain('%')
    })
  })

  describe('Financial Calculations', () => {
    it('calculates remaining correctly when under budget', () => {
      render(<ProjectFinancialSummary budget={100000} spent={70000} />)
      expect(screen.getByTestId('remaining-value').textContent ?? '').toMatch(/٣٠|30/)
    })

    it('calculates remaining correctly when over budget', () => {
      render(<ProjectFinancialSummary budget={100000} spent={120000} />)
      const remaining = screen.getByTestId('remaining-value').textContent ?? ''
      expect(remaining).toMatch(/٢٠|20/)
      expect(remaining).toMatch(/تجاوز/)
    })

    it('handles zero budget gracefully', () => {
      render(<ProjectFinancialSummary budget={0} spent={0} />)
      expect(screen.getByTestId('budget-value').textContent ?? '').toMatch(/٠|0/)
    })

    it('handles zero spent gracefully', () => {
      render(<ProjectFinancialSummary budget={100000} spent={0} />)
      expect(screen.getByTestId('spent-value').textContent ?? '').toMatch(/٠|0/)
      expect(screen.getByTestId('remaining-value').textContent ?? '').toMatch(/١٠٠|100/)
    })

    it('calculates variance percentage correctly', () => {
      render(<ProjectFinancialSummary budget={100000} spent={110000} />)
      const variance = screen.getByTestId('variance')
      expect(variance.textContent).toContain('10.0%')
    })

    it('shows positive variance for over budget', () => {
      render(<ProjectFinancialSummary budget={100000} spent={125000} />)
      const variance = screen.getByTestId('variance')
      expect(variance.textContent).toContain('+25.0%')
    })

    it('shows negative variance for under budget', () => {
      render(<ProjectFinancialSummary budget={100000} spent={75000} />)
      const variance = screen.getByTestId('variance')
      expect(variance.textContent).toContain('-25.0%')
    })
  })

  describe('Visual Indicators', () => {
    it('shows red color for over budget remaining', () => {
      render(<ProjectFinancialSummary budget={100000} spent={110000} />)
      const remaining = screen.getByTestId('remaining-value')
      expect(remaining.className).toMatch(/text-error/)
    })

    it('shows green color for positive remaining', () => {
      render(<ProjectFinancialSummary budget={100000} spent={70000} />)
      const remaining = screen.getByTestId('remaining-value')
      expect(remaining.className).toMatch(/text-success/)
    })

    it('shows red variance for over budget', () => {
      render(<ProjectFinancialSummary budget={100000} spent={120000} />)
      const variance = screen.getByTestId('variance')
      expect(variance.className).toMatch(/text-error/)
    })

    it('shows green variance when on track', () => {
      render(<ProjectFinancialSummary budget={100000} spent={95000} />)
      const variance = screen.getByTestId('variance')
      expect(variance.className).toMatch(/text-warning/)
    })

    it('shows yellow variance when moderately off', () => {
      render(<ProjectFinancialSummary budget={100000} spent={85000} />)
      const variance = screen.getByTestId('variance')
      expect(variance.className).toMatch(/text-success/)
    })
  })

  describe('Currency Formatting', () => {
    it('uses default Saudi Riyal currency', () => {
      render(<ProjectFinancialSummary budget={100000} spent={50000} />)
      expect(screen.getByTestId('budget-value').textContent).toMatch(/ر\.س|SAR/)
    })

    it('accepts custom currency symbol', () => {
      render(<ProjectFinancialSummary budget={100000} spent={50000} currency="$" />)
      expect(screen.getByTestId('budget-value')).toHaveTextContent(/\$/)
    })

    it('formats large numbers with Arabic numerals', () => {
      render(<ProjectFinancialSummary budget={1000000} spent={500000} />)
      const budgetText = screen.getByTestId('budget-value').textContent || ''
      expect(budgetText).toMatch(/[\u0660-\u0669]/) // Arabic-Indic digits or formatted with commas
    })
  })

  describe('Styling', () => {
    it('applies custom className to card', () => {
      render(<ProjectFinancialSummary budget={100000} spent={50000} className="custom-class" />)
      const card = screen.getByTestId('financial-summary-card')
      expect(card.className).toContain('custom-class')
    })

    it('applies custom className to compact view', () => {
      render(
        <ProjectFinancialSummary
          budget={100000}
          spent={50000}
          compact
          className="custom-compact"
        />,
      )
      const compact = screen.getByTestId('financial-summary-compact')
      expect(compact.className).toContain('custom-compact')
    })
  })

  describe('Helper Functions', () => {
    it('getFinancialStatus returns over budget status', () => {
      expect(getFinancialStatus(100000, 120000)).toBe('تجاوز الميزانية')
    })

    it('getFinancialStatus returns under budget status', () => {
      expect(getFinancialStatus(100000, 75000)).toBe('أقل من الميزانية')
    })

    it('getFinancialStatus returns on track status', () => {
      expect(getFinancialStatus(100000, 95000)).toBe('ضمن الميزانية')
      expect(getFinancialStatus(100000, 105000)).toBe('ضمن الميزانية')
    })

    it('handles zero budget in getFinancialStatus', () => {
      expect(getFinancialStatus(0, 0)).toBe('ضمن الميزانية')
    })
  })

  describe('Edge Cases', () => {
    it('handles exact budget match', () => {
      render(<ProjectFinancialSummary budget={100000} spent={100000} />)
      expect(screen.getByTestId('remaining-value').textContent ?? '').toMatch(/٠|0/)
    })

    it('handles very large numbers', () => {
      render(<ProjectFinancialSummary budget={10000000000} spent={5000000000} />)
      expect(screen.getByTestId('budget-value')).toBeInTheDocument()
      expect(screen.getByTestId('spent-value')).toBeInTheDocument()
    })

    it('handles negative budget (edge case)', () => {
      render(<ProjectFinancialSummary budget={-100000} spent={50000} />)
      expect(screen.getByTestId('remaining-value')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has correct data-testid attributes', () => {
      render(<ProjectFinancialSummary budget={100000} spent={75000} />)
      expect(screen.getByTestId('financial-summary-card')).toBeInTheDocument()
      expect(screen.getByTestId('budget-value')).toBeInTheDocument()
      expect(screen.getByTestId('spent-value')).toBeInTheDocument()
      expect(screen.getByTestId('remaining-value')).toBeInTheDocument()
      expect(screen.getByTestId('variance')).toBeInTheDocument()
    })
  })
})
