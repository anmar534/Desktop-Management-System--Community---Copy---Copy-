import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  ProjectProgressBar,
  getProgressStatus,
} from '@/presentation/components/projects/ProjectProgressBar'

describe('ProjectProgressBar', () => {
  describe('Rendering', () => {
    it('renders progress bar with correct value', () => {
      render(<ProjectProgressBar progress={75} />)
      expect(screen.getByTestId('progress-bar')).toBeInTheDocument()
    })

    it('renders outside label by default', () => {
      render(<ProjectProgressBar progress={50} />)
      expect(screen.getByTestId('progress-label-outside')).toHaveTextContent('50%')
    })

    it('renders inside label when labelPosition is inside', () => {
      render(<ProjectProgressBar progress={60} labelPosition="inside" />)
      expect(screen.getByTestId('progress-label-inside')).toHaveTextContent('60%')
    })

    it('renders both labels when labelPosition is both', () => {
      render(<ProjectProgressBar progress={80} labelPosition="both" />)
      expect(screen.getByTestId('progress-label-outside')).toBeInTheDocument()
      expect(screen.getByTestId('progress-label-inside')).toBeInTheDocument()
    })

    it('hides labels when showLabel is false', () => {
      render(<ProjectProgressBar progress={40} showLabel={false} />)
      expect(screen.queryByTestId('progress-label-outside')).not.toBeInTheDocument()
      expect(screen.queryByTestId('progress-label-inside')).not.toBeInTheDocument()
    })
  })

  describe('Progress Clamping', () => {
    it('clamps negative progress to 0', () => {
      render(<ProjectProgressBar progress={-10} />)
      expect(screen.getByTestId('progress-label-outside')).toHaveTextContent('0%')
    })

    it('clamps progress over 100 to 100', () => {
      render(<ProjectProgressBar progress={150} />)
      expect(screen.getByTestId('progress-label-outside')).toHaveTextContent('100%')
    })

    it('handles decimal progress values', () => {
      render(<ProjectProgressBar progress={45.7} />)
      expect(screen.getByTestId('progress-label-outside')).toHaveTextContent('46%')
    })

    it('handles zero progress', () => {
      render(<ProjectProgressBar progress={0} />)
      expect(screen.getByTestId('progress-label-outside')).toHaveTextContent('0%')
    })

    it('handles full progress', () => {
      render(<ProjectProgressBar progress={100} />)
      expect(screen.getByTestId('progress-label-outside')).toHaveTextContent('100%')
    })
  })

  describe('Height Variants', () => {
    it('renders small height correctly', () => {
      const { container } = render(<ProjectProgressBar progress={50} height="sm" />)
      const progressBar = container.querySelector('[data-testid="progress-bar"]')
      expect(progressBar?.className).toMatch(/h-2/)
    })

    it('renders medium height correctly', () => {
      const { container } = render(<ProjectProgressBar progress={50} height="md" />)
      const progressBar = container.querySelector('[data-testid="progress-bar"]')
      expect(progressBar?.className).toMatch(/h-3/)
    })

    it('renders large height correctly', () => {
      const { container } = render(<ProjectProgressBar progress={50} height="lg" />)
      const progressBar = container.querySelector('[data-testid="progress-bar"]')
      expect(progressBar?.className).toMatch(/h-4/)
    })

    it('does not show inside label for small height', () => {
      render(<ProjectProgressBar progress={50} height="sm" labelPosition="inside" />)
      expect(screen.queryByTestId('progress-label-inside')).not.toBeInTheDocument()
    })
  })

  describe('Color Variants', () => {
    const getIndicatorClass = (container: HTMLElement | Document) =>
      container.querySelector<HTMLElement>('[data-slot="progress-indicator"]')?.className ?? ''

    it('auto color shows info tone for high progress (>=80%)', () => {
      const { container } = render(<ProjectProgressBar progress={85} variant="auto" />)
      expect(getIndicatorClass(container)).toMatch(/bg-info/)
    })

    it('auto color shows warning tone for medium progress (60-79%)', () => {
      const { container } = render(<ProjectProgressBar progress={65} variant="auto" />)
      expect(getIndicatorClass(container)).toMatch(/bg-warning/)
    })

    it('auto color shows error tone for low progress (<60%)', () => {
      const { container } = render(<ProjectProgressBar progress={30} variant="auto" />)
      expect(getIndicatorClass(container)).toMatch(/bg-error/)
    })

    it('auto color keeps error tone for very low progress (<20%)', () => {
      const { container } = render(<ProjectProgressBar progress={10} variant="auto" />)
      expect(getIndicatorClass(container)).toMatch(/bg-error/)
    })

    it('applies success variant color', () => {
      const { container } = render(<ProjectProgressBar progress={30} variant="success" />)
      expect(getIndicatorClass(container)).toMatch(/bg-success/)
    })

    it('applies warning variant color', () => {
      const { container } = render(<ProjectProgressBar progress={80} variant="warning" />)
      expect(getIndicatorClass(container)).toMatch(/bg-warning/)
    })

    it('applies danger variant color', () => {
      const { container } = render(<ProjectProgressBar progress={90} variant="danger" />)
      expect(getIndicatorClass(container)).toMatch(/bg-error/)
    })

    it('applies info variant color', () => {
      const { container } = render(<ProjectProgressBar progress={90} variant="info" />)
      expect(getIndicatorClass(container)).toMatch(/bg-info/)
    })
  })

  describe('Styling', () => {
    it('applies custom className', () => {
      render(<ProjectProgressBar progress={50} className="custom-class" />)
      const container = screen.getByTestId('progress-bar-container')
      expect(container.className).toContain('custom-class')
    })
  })

  describe('Helper Functions', () => {
    it('getProgressStatus returns correct status for 0%', () => {
      expect(getProgressStatus(0)).toBe('لم يبدأ')
    })

    it('getProgressStatus returns correct status for 100%', () => {
      expect(getProgressStatus(100)).toBe('مكتمل')
    })

    it('getProgressStatus returns correct status for >=80%', () => {
      expect(getProgressStatus(80)).toBe('متقدم جيداً')
    })

    it('getProgressStatus returns correct status for 60-79%', () => {
      expect(getProgressStatus(60)).toBe('في المسار')
    })

    it('getProgressStatus returns correct status for 30-59%', () => {
      expect(getProgressStatus(40)).toBe('في البداية')
    })

    it('getProgressStatus returns correct status for <25%', () => {
      expect(getProgressStatus(15)).toBe('متأخر')
    })
  })

  describe('Accessibility', () => {
    it('has correct data-testid attributes', () => {
      render(<ProjectProgressBar progress={50} />)
      expect(screen.getByTestId('progress-bar-container')).toBeInTheDocument()
      expect(screen.getByTestId('progress-bar')).toBeInTheDocument()
    })

    it('inside label has aria-hidden', () => {
      const { container } = render(<ProjectProgressBar progress={50} labelPosition="inside" />)
      const insideLabel = container.querySelector('[data-testid="progress-label-inside"]')
      expect(insideLabel).toHaveAttribute('aria-hidden', 'true')
    })
  })
})
