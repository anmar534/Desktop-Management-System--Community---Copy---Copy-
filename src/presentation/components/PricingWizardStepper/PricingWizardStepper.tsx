/**
 * @fileoverview Pricing wizard stepper component
 * @module components/PricingWizardStepper
 *
 * Multi-step wizard navigation component for pricing workflow.
 * Displays progress, allows navigation, shows validation states.
 * Integrates with pricingWizardStore for state management.
 */

import { useMemo } from 'react'
import type { WizardStep } from '../../../application/stores/pricingWizardStore'
import './PricingWizardStepper.css'

/**
 * Step configuration interface
 */
export interface StepConfig {
  /** Step identifier */
  id: WizardStep
  /** Display label */
  label: string
  /** Icon or emoji */
  icon?: string
  /** Step description */
  description?: string
  /** Whether step is optional */
  optional?: boolean
}

/**
 * Step status type
 */
export type StepStatus = 'completed' | 'current' | 'pending' | 'error'

/**
 * Props for PricingWizardStepper component
 */
export interface PricingWizardStepperProps {
  /** Current active step */
  currentStep: WizardStep
  /** Set of completed steps */
  completedSteps: Set<WizardStep>
  /** Steps configuration */
  steps: StepConfig[]
  /** Callback when step is clicked */
  onStepClick?: (step: WizardStep) => void
  /** Map of step validation errors */
  stepErrors?: Map<WizardStep, string[]>
  /** Whether navigation is disabled */
  disabled?: boolean
  /** Orientation (horizontal or vertical) */
  orientation?: 'horizontal' | 'vertical'
  /** Show step numbers */
  showNumbers?: boolean
  /** Show progress percentage */
  showProgress?: boolean
  /** Show step descriptions */
  showDescriptions?: boolean
  /** Compact mode */
  compact?: boolean
  /** Additional CSS class */
  className?: string
}

/**
 * PricingWizardStepper Component
 *
 * Displays wizard steps with navigation and progress tracking.
 *
 * @example
 * ```tsx
 * const steps = [
 *   { id: 'boq-review', label: 'مراجعة BOQ', icon: '📋' },
 *   { id: 'pricing', label: 'التسعير', icon: '💰' },
 * ];
 *
 * <PricingWizardStepper
 *   currentStep="pricing"
 *   completedSteps={new Set(['boq-review'])}
 *   steps={steps}
 *   onStepClick={(step) => console.log(step)}
 * />
 * ```
 */
export function PricingWizardStepper({
  currentStep,
  completedSteps,
  steps,
  onStepClick,
  stepErrors,
  disabled = false,
  orientation = 'horizontal',
  showNumbers = true,
  showProgress = true,
  showDescriptions = false,
  compact = false,
  className = '',
}: PricingWizardStepperProps) {
  /**
   * Calculate step status
   */
  const getStepStatus = (stepId: WizardStep): StepStatus => {
    if (stepErrors?.get(stepId)?.length) {
      return 'error'
    }
    if (stepId === currentStep) {
      return 'current'
    }
    if (completedSteps.has(stepId)) {
      return 'completed'
    }
    return 'pending'
  }

  /**
   * Check if step is clickable
   */
  const isStepClickable = (stepId: WizardStep, index: number): boolean => {
    if (disabled) return false
    if (!onStepClick) return false

    // Current step is always clickable
    if (stepId === currentStep) return true

    // Completed steps are clickable
    if (completedSteps.has(stepId)) return true

    // Next step after completed is clickable
    const currentIndex = steps.findIndex((s) => s.id === currentStep)
    const allPreviousCompleted = steps
      .slice(0, index)
      .every((s) => s.id === currentStep || completedSteps.has(s.id))

    return allPreviousCompleted && index <= currentIndex + 1
  }

  /**
   * Calculate progress percentage
   */
  const progressPercentage = useMemo(() => {
    if (!showProgress) return 0
    const completed = completedSteps.size
    const total = steps.length
    return Math.round((completed / total) * 100)
  }, [completedSteps.size, steps.length, showProgress])

  /**
   * Handle step click
   */
  const handleStepClick = (stepId: WizardStep, index: number) => {
    if (isStepClickable(stepId, index)) {
      onStepClick?.(stepId)
    }
  }

  /**
   * Get step number
   */
  const getStepNumber = (index: number): string => {
    return (index + 1).toString()
  }

  /**
   * Get status icon
   */
  const getStatusIcon = (status: StepStatus): string => {
    switch (status) {
      case 'completed':
        return '✓'
      case 'current':
        return '●'
      case 'error':
        return '✕'
      case 'pending':
        return '○'
    }
  }

  /**
   * Build CSS classes for container
   */
  const containerClasses = [
    'pricing-wizard-stepper',
    `pricing-wizard-stepper--${orientation}`,
    compact && 'pricing-wizard-stepper--compact',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  /**
   * Build CSS classes for step
   */
  const getStepClasses = (stepId: WizardStep, index: number): string => {
    const status = getStepStatus(stepId)
    const clickable = isStepClickable(stepId, index)

    return [
      'pricing-wizard-stepper-step',
      `pricing-wizard-stepper-step--${status}`,
      clickable && 'pricing-wizard-stepper-step--clickable',
      disabled && 'pricing-wizard-stepper-step--disabled',
    ]
      .filter(Boolean)
      .join(' ')
  }

  return (
    <div className={containerClasses}>
      {/* Progress bar */}
      {showProgress && (
        <div className="pricing-wizard-stepper-progress">
          <div className="pricing-wizard-stepper-progress-label">التقدم: {progressPercentage}%</div>
          <div className="pricing-wizard-stepper-progress-bar">
            <div
              className="pricing-wizard-stepper-progress-fill"
              role="progressbar"
              aria-label={`تقدم المعالج: ${progressPercentage}%`}
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              style={{ '--progress-width': `${progressPercentage}%` } as React.CSSProperties}
            />
          </div>
        </div>
      )}

      {/* Steps list */}
      <div className="pricing-wizard-stepper-steps">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id)
          const clickable = isStepClickable(step.id, index)
          const errors = stepErrors?.get(step.id) || []

          return (
            <div key={step.id} className="pricing-wizard-stepper-step-wrapper">
              {/* Connector line (not for last step) */}
              {index < steps.length - 1 && <div className="pricing-wizard-stepper-connector" />}

              {/* Step item */}
              <div
                className={getStepClasses(step.id, index)}
                onClick={() => handleStepClick(step.id, index)}
                role="button"
                tabIndex={clickable ? 0 : -1}
                aria-current={status === 'current' ? 'step' : undefined}
                aria-disabled={clickable ? undefined : true}
              >
                {/* Step indicator */}
                <div className="pricing-wizard-stepper-step-indicator">
                  {step.icon && !compact ? (
                    <span className="pricing-wizard-stepper-step-icon">{step.icon}</span>
                  ) : showNumbers ? (
                    <span className="pricing-wizard-stepper-step-number">
                      {status === 'completed' || status === 'error'
                        ? getStatusIcon(status)
                        : getStepNumber(index)}
                    </span>
                  ) : (
                    <span className="pricing-wizard-stepper-step-status">
                      {getStatusIcon(status)}
                    </span>
                  )}
                </div>

                {/* Step content */}
                {!compact && (
                  <div className="pricing-wizard-stepper-step-content">
                    <div className="pricing-wizard-stepper-step-label">
                      {step.label}
                      {step.optional && (
                        <span className="pricing-wizard-stepper-step-optional"> (اختياري)</span>
                      )}
                    </div>

                    {showDescriptions && step.description && (
                      <div className="pricing-wizard-stepper-step-description">
                        {step.description}
                      </div>
                    )}

                    {/* Error messages */}
                    {errors.length > 0 && (
                      <div className="pricing-wizard-stepper-step-errors">
                        {errors.map((error, i) => (
                          <div key={i} className="pricing-wizard-stepper-step-error">
                            {error}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PricingWizardStepper
