/**
 * @fileoverview Tests for PricingWizardStepper component
 * @module components/PricingWizardStepper/__tests__
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PricingWizardStepper } from '../../../src/presentation/components/PricingWizardStepper'
import type { StepConfig } from '../../../src/presentation/components/PricingWizardStepper'
import type { WizardStep } from '../../../src/application/stores/pricingWizardStore'

/**
 * Default test steps
 */
const defaultSteps: StepConfig[] = [
  {
    id: 'boq-review' as WizardStep,
    label: 'مراجعة BOQ',
    icon: '📋',
    description: 'مراجعة جدول الكميات',
  },
  {
    id: 'pricing' as WizardStep,
    label: 'التسعير',
    icon: '💰',
    description: 'إدخال الأسعار',
  },
  {
    id: 'costs' as WizardStep,
    label: 'التكاليف',
    icon: '📊',
    description: 'التكاليف الإضافية',
    optional: true,
  },
  {
    id: 'review' as WizardStep,
    label: 'المراجعة',
    icon: '✓',
    description: 'المراجعة النهائية',
  },
]

describe('PricingWizardStepper', () => {
  describe('Basic Rendering', () => {
    it('renders all steps', () => {
      render(
        <PricingWizardStepper
          currentStep="boq-review"
          completedSteps={new Set()}
          steps={defaultSteps}
        />,
      )

      defaultSteps.forEach((step) => {
        expect(screen.getByText(step.label)).toBeInTheDocument()
      })
    })

    it('renders with custom className', () => {
      const { container } = render(
        <PricingWizardStepper
          currentStep="boq-review"
          completedSteps={new Set()}
          steps={defaultSteps}
          className="custom-class"
        />,
      )

      const stepper = container.querySelector('.pricing-wizard-stepper')
      expect(stepper).toHaveClass('custom-class')
    })

    it('renders in horizontal orientation by default', () => {
      const { container } = render(
        <PricingWizardStepper
          currentStep="boq-review"
          completedSteps={new Set()}
          steps={defaultSteps}
        />,
      )

      const stepper = container.querySelector('.pricing-wizard-stepper')
      expect(stepper).toHaveClass('pricing-wizard-stepper--horizontal')
    })

    it('renders in vertical orientation when specified', () => {
      const { container } = render(
        <PricingWizardStepper
          currentStep="boq-review"
          completedSteps={new Set()}
          steps={defaultSteps}
          orientation="vertical"
        />,
      )

      const stepper = container.querySelector('.pricing-wizard-stepper')
      expect(stepper).toHaveClass('pricing-wizard-stepper--vertical')
    })

    it('renders in compact mode', () => {
      const { container } = render(
        <PricingWizardStepper
          currentStep="boq-review"
          completedSteps={new Set()}
          steps={defaultSteps}
          compact
        />,
      )

      const stepper = container.querySelector('.pricing-wizard-stepper')
      expect(stepper).toHaveClass('pricing-wizard-stepper--compact')
    })
  })

  describe('Progress Bar', () => {
    it('shows progress bar by default', () => {
      render(
        <PricingWizardStepper
          currentStep="pricing"
          completedSteps={new Set(['boq-review'])}
          steps={defaultSteps}
        />,
      )

      expect(screen.getByText(/التقدم:/)).toBeInTheDocument()
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('hides progress bar when showProgress is false', () => {
      render(
        <PricingWizardStepper
          currentStep="pricing"
          completedSteps={new Set(['boq-review'])}
          steps={defaultSteps}
          showProgress={false}
        />,
      )

      expect(screen.queryByText(/التقدم:/)).not.toBeInTheDocument()
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })

    it('calculates progress percentage correctly', () => {
      render(
        <PricingWizardStepper
          currentStep="costs"
          completedSteps={new Set(['boq-review', 'pricing'])}
          steps={defaultSteps}
        />,
      )

      // 2 completed out of 4 = 50%
      expect(screen.getByText('التقدم: 50%')).toBeInTheDocument()
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '50')
    })

    it('shows 0% when no steps completed', () => {
      render(
        <PricingWizardStepper
          currentStep="boq-review"
          completedSteps={new Set()}
          steps={defaultSteps}
        />,
      )

      expect(screen.getByText('التقدم: 0%')).toBeInTheDocument()
    })

    it('shows 100% when all steps completed', () => {
      render(
        <PricingWizardStepper
          currentStep="review"
          completedSteps={new Set(['boq-review', 'pricing', 'costs', 'review'])}
          steps={defaultSteps}
        />,
      )

      expect(screen.getByText('التقدم: 100%')).toBeInTheDocument()
    })
  })

  describe('Step Status', () => {
    it('marks current step with current status', () => {
      const { container } = render(
        <PricingWizardStepper
          currentStep="pricing"
          completedSteps={new Set(['boq-review'])}
          steps={defaultSteps}
        />,
      )

      const steps = container.querySelectorAll('.pricing-wizard-stepper-step')
      expect(steps[1]).toHaveClass('pricing-wizard-stepper-step--current')
    })

    it('marks completed steps with completed status', () => {
      const { container } = render(
        <PricingWizardStepper
          currentStep="costs"
          completedSteps={new Set(['boq-review', 'pricing'])}
          steps={defaultSteps}
        />,
      )

      const steps = container.querySelectorAll('.pricing-wizard-stepper-step')
      expect(steps[0]).toHaveClass('pricing-wizard-stepper-step--completed')
      expect(steps[1]).toHaveClass('pricing-wizard-stepper-step--completed')
    })

    it('marks pending steps with pending status', () => {
      const { container } = render(
        <PricingWizardStepper
          currentStep="pricing"
          completedSteps={new Set(['boq-review'])}
          steps={defaultSteps}
        />,
      )

      const steps = container.querySelectorAll('.pricing-wizard-stepper-step')
      expect(steps[2]).toHaveClass('pricing-wizard-stepper-step--pending')
      expect(steps[3]).toHaveClass('pricing-wizard-stepper-step--pending')
    })

    it('marks steps with errors with error status', () => {
      const stepErrors = new Map([['pricing' as WizardStep, ['خطأ في السعر']]])

      const { container } = render(
        <PricingWizardStepper
          currentStep="pricing"
          completedSteps={new Set(['boq-review'])}
          steps={defaultSteps}
          stepErrors={stepErrors}
        />,
      )

      const steps = container.querySelectorAll('.pricing-wizard-stepper-step')
      expect(steps[1]).toHaveClass('pricing-wizard-stepper-step--error')
    })
  })

  describe('Step Navigation', () => {
    it('calls onStepClick when clicking current step', async () => {
      const user = userEvent.setup()
      const onStepClick = vi.fn()

      const { container } = render(
        <PricingWizardStepper
          currentStep="pricing"
          completedSteps={new Set(['boq-review'])}
          steps={defaultSteps}
          onStepClick={onStepClick}
        />,
      )

      const steps = container.querySelectorAll('.pricing-wizard-stepper-step')
      await user.click(steps[1])

      expect(onStepClick).toHaveBeenCalledWith('pricing')
    })

    it('calls onStepClick when clicking completed step', async () => {
      const user = userEvent.setup()
      const onStepClick = vi.fn()

      const { container } = render(
        <PricingWizardStepper
          currentStep="pricing"
          completedSteps={new Set(['boq-review'])}
          steps={defaultSteps}
          onStepClick={onStepClick}
        />,
      )

      const steps = container.querySelectorAll('.pricing-wizard-stepper-step')
      await user.click(steps[0])

      expect(onStepClick).toHaveBeenCalledWith('boq-review')
    })

    it('does not call onStepClick when clicking disabled pending step', async () => {
      const user = userEvent.setup()
      const onStepClick = vi.fn()

      const { container } = render(
        <PricingWizardStepper
          currentStep="boq-review"
          completedSteps={new Set()}
          steps={defaultSteps}
          onStepClick={onStepClick}
        />,
      )

      const steps = container.querySelectorAll('.pricing-wizard-stepper-step')
      await user.click(steps[2]) // costs step

      expect(onStepClick).not.toHaveBeenCalled()
    })

    it('does not call onStepClick when disabled prop is true', async () => {
      const user = userEvent.setup()
      const onStepClick = vi.fn()

      const { container } = render(
        <PricingWizardStepper
          currentStep="pricing"
          completedSteps={new Set(['boq-review'])}
          steps={defaultSteps}
          onStepClick={onStepClick}
          disabled
        />,
      )

      const steps = container.querySelectorAll('.pricing-wizard-stepper-step')
      await user.click(steps[1])

      expect(onStepClick).not.toHaveBeenCalled()
    })

    it('allows clicking next step when all previous completed', async () => {
      const user = userEvent.setup()
      const onStepClick = vi.fn()

      const { container } = render(
        <PricingWizardStepper
          currentStep="pricing"
          completedSteps={new Set(['boq-review'])}
          steps={defaultSteps}
          onStepClick={onStepClick}
        />,
      )

      const steps = container.querySelectorAll('.pricing-wizard-stepper-step')
      await user.click(steps[2]) // costs step (next)

      expect(onStepClick).toHaveBeenCalledWith('costs')
    })
  })

  describe('Step Content', () => {
    it('shows step icons when provided', () => {
      render(
        <PricingWizardStepper
          currentStep="boq-review"
          completedSteps={new Set()}
          steps={defaultSteps}
        />,
      )

      expect(screen.getByText('📋')).toBeInTheDocument()
      expect(screen.getByText('💰')).toBeInTheDocument()
    })

    it('shows step numbers when showNumbers is true and no icons', () => {
      const stepsWithoutIcons: StepConfig[] = [
        { id: 'boq-review' as WizardStep, label: 'مراجعة BOQ' },
        { id: 'pricing' as WizardStep, label: 'التسعير' },
        { id: 'costs' as WizardStep, label: 'التكاليف' },
        { id: 'review' as WizardStep, label: 'المراجعة' },
      ]

      const { container } = render(
        <PricingWizardStepper
          currentStep="pricing"
          completedSteps={new Set(['boq-review'])}
          steps={stepsWithoutIcons}
          showNumbers={true}
        />,
      )

      // Pending and current steps should show numbers
      const stepNumbers = container.querySelectorAll('.pricing-wizard-stepper-step-number')
      expect(stepNumbers.length).toBeGreaterThan(0)

      // Check specific numbers are shown
      expect(screen.getByText('2')).toBeInTheDocument() // current step
      expect(screen.getByText('3')).toBeInTheDocument() // pending step
    })

    it('shows step descriptions when showDescriptions is true', () => {
      render(
        <PricingWizardStepper
          currentStep="boq-review"
          completedSteps={new Set()}
          steps={defaultSteps}
          showDescriptions={true}
        />,
      )

      expect(screen.getByText('مراجعة جدول الكميات')).toBeInTheDocument()
      expect(screen.getByText('إدخال الأسعار')).toBeInTheDocument()
    })

    it('hides descriptions when showDescriptions is false', () => {
      render(
        <PricingWizardStepper
          currentStep="boq-review"
          completedSteps={new Set()}
          steps={defaultSteps}
          showDescriptions={false}
        />,
      )

      expect(screen.queryByText('مراجعة جدول الكميات')).not.toBeInTheDocument()
    })

    it('shows optional indicator for optional steps', () => {
      render(
        <PricingWizardStepper
          currentStep="boq-review"
          completedSteps={new Set()}
          steps={defaultSteps}
        />,
      )

      expect(screen.getByText('(اختياري)')).toBeInTheDocument()
    })

    it('hides content in compact mode', () => {
      render(
        <PricingWizardStepper
          currentStep="boq-review"
          completedSteps={new Set()}
          steps={defaultSteps}
          compact={true}
        />,
      )

      // Labels should not be visible in compact mode
      expect(screen.queryByText('مراجعة BOQ')).not.toBeInTheDocument()
    })
  })

  describe('Error Display', () => {
    it('displays step errors when provided', () => {
      const stepErrors = new Map([
        ['pricing' as WizardStep, ['السعر مطلوب', 'السعر يجب أن يكون موجباً']],
      ])

      render(
        <PricingWizardStepper
          currentStep="pricing"
          completedSteps={new Set(['boq-review'])}
          steps={defaultSteps}
          stepErrors={stepErrors}
        />,
      )

      expect(screen.getByText('السعر مطلوب')).toBeInTheDocument()
      expect(screen.getByText('السعر يجب أن يكون موجباً')).toBeInTheDocument()
    })

    it('displays multiple errors for multiple steps', () => {
      const stepErrors = new Map([
        ['pricing' as WizardStep, ['خطأ في التسعير']],
        ['costs' as WizardStep, ['خطأ في التكاليف']],
      ])

      render(
        <PricingWizardStepper
          currentStep="review"
          completedSteps={new Set(['boq-review', 'pricing', 'costs'])}
          steps={defaultSteps}
          stepErrors={stepErrors}
        />,
      )

      expect(screen.getByText('خطأ في التسعير')).toBeInTheDocument()
      expect(screen.getByText('خطأ في التكاليف')).toBeInTheDocument()
    })

    it('does not show errors when stepErrors is not provided', () => {
      const { container } = render(
        <PricingWizardStepper
          currentStep="pricing"
          completedSteps={new Set(['boq-review'])}
          steps={defaultSteps}
        />,
      )

      const errors = container.querySelectorAll('.pricing-wizard-stepper-step-error')
      expect(errors.length).toBe(0)
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes on progress bar', () => {
      render(
        <PricingWizardStepper
          currentStep="pricing"
          completedSteps={new Set(['boq-review'])}
          steps={defaultSteps}
        />,
      )

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '25')
      expect(progressBar).toHaveAttribute('aria-valuemin', '0')
      expect(progressBar).toHaveAttribute('aria-valuemax', '100')
      expect(progressBar).toHaveAttribute('aria-label')
    })

    it('marks current step with aria-current', () => {
      const { container } = render(
        <PricingWizardStepper
          currentStep="pricing"
          completedSteps={new Set(['boq-review'])}
          steps={defaultSteps}
        />,
      )

      const steps = container.querySelectorAll('.pricing-wizard-stepper-step')
      expect(steps[1]).toHaveAttribute('aria-current', 'step')
    })

    it('has proper tabIndex for clickable steps', () => {
      const { container } = render(
        <PricingWizardStepper
          currentStep="pricing"
          completedSteps={new Set(['boq-review'])}
          steps={defaultSteps}
          onStepClick={vi.fn()}
        />,
      )

      const steps = container.querySelectorAll('.pricing-wizard-stepper-step')

      // Current and completed steps should be focusable
      expect(steps[0]).toHaveAttribute('tabIndex', '0') // completed
      expect(steps[1]).toHaveAttribute('tabIndex', '0') // current
    })

    it('has proper tabIndex for non-clickable steps', () => {
      const { container } = render(
        <PricingWizardStepper
          currentStep="boq-review"
          completedSteps={new Set()}
          steps={defaultSteps}
          onStepClick={vi.fn()}
        />,
      )

      const steps = container.querySelectorAll('.pricing-wizard-stepper-step')

      // Pending steps should not be focusable
      expect(steps[2]).toHaveAttribute('tabIndex', '-1')
      expect(steps[3]).toHaveAttribute('tabIndex', '-1')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty steps array', () => {
      const { container } = render(
        <PricingWizardStepper currentStep="boq-review" completedSteps={new Set()} steps={[]} />,
      )

      const steps = container.querySelectorAll('.pricing-wizard-stepper-step')
      expect(steps.length).toBe(0)
    })

    it('handles single step', () => {
      const singleStep: StepConfig[] = [{ id: 'boq-review' as WizardStep, label: 'مراجعة' }]

      render(
        <PricingWizardStepper
          currentStep="boq-review"
          completedSteps={new Set()}
          steps={singleStep}
        />,
      )

      expect(screen.getByText('مراجعة')).toBeInTheDocument()
      expect(screen.getByText('التقدم: 0%')).toBeInTheDocument()
    })

    it('handles all steps completed', () => {
      const allCompleted = new Set<WizardStep>(['boq-review', 'pricing', 'costs'])

      const { container } = render(
        <PricingWizardStepper
          currentStep="review"
          completedSteps={allCompleted}
          steps={defaultSteps}
        />,
      )

      // 3 completed + 1 current = all 4 steps should be marked appropriately
      const completedSteps = container.querySelectorAll('.pricing-wizard-stepper-step--completed')
      const currentStep = container.querySelector('.pricing-wizard-stepper-step--current')

      expect(completedSteps.length).toBe(3)
      expect(currentStep).toBeInTheDocument()
    })

    it('renders without onStepClick callback', () => {
      const { container } = render(
        <PricingWizardStepper
          currentStep="pricing"
          completedSteps={new Set(['boq-review'])}
          steps={defaultSteps}
        />,
      )

      const steps = container.querySelectorAll('.pricing-wizard-stepper-step')
      expect(steps[0]).not.toHaveClass('pricing-wizard-stepper-step--clickable')
    })

    it('handles very long step labels', () => {
      const longLabelSteps: StepConfig[] = [
        {
          id: 'boq-review' as WizardStep,
          label: 'هذا عنوان خطوة طويل جداً جداً جداً يجب أن يتم التعامل معه بشكل صحيح',
        },
      ]

      render(
        <PricingWizardStepper
          currentStep="boq-review"
          completedSteps={new Set()}
          steps={longLabelSteps}
        />,
      )

      expect(screen.getByText(/هذا عنوان خطوة طويل جداً/)).toBeInTheDocument()
    })
  })
})
