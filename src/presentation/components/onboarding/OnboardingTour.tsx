/**
 * Onboarding Tour Component - مكون الجولة التعريفية
 * Sprint 5.4.5: جولة تعريفية تفاعلية
 */

import type React from 'react'
import { useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { designTokens } from '@/styles/design-system'

// ============================================================================
// Types
// ============================================================================

export interface TourStep {
  /** Unique identifier / معرف فريد */
  id: string

  /** Target element selector / محدد العنصر المستهدف */
  target: string

  /** Title / العنوان */
  title: string

  /** Arabic title / العنوان بالعربية */
  titleAr?: string

  /** Content / المحتوى */
  content: string

  /** Arabic content / المحتوى بالعربية */
  contentAr?: string

  /** Placement / الموضع */
  placement?: 'top' | 'bottom' | 'left' | 'right'

  /** Action to perform before showing / إجراء قبل العرض */
  beforeShow?: () => void | Promise<void>

  /** Action to perform after showing / إجراء بعد العرض */
  afterShow?: () => void
}

export interface OnboardingTourProps {
  /** Tour steps / خطوات الجولة */
  steps: TourStep[]

  /** Show/hide state / حالة الإظهار/الإخفاء */
  open: boolean

  /** On close callback / عند الإغلاق */
  onClose: () => void

  /** On complete callback / عند الإكمال */
  onComplete?: () => void

  /** RTL mode / وضع RTL */
  rtl?: boolean

  /** Show progress / عرض التقدم */
  showProgress?: boolean
}

// ============================================================================
// Styled Components
// ============================================================================

const Overlay = styled.div<{ show: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: ${designTokens.zIndex.modal};
  opacity: ${(props) => (props.show ? 1 : 0)};
  visibility: ${(props) => (props.show ? 'visible' : 'hidden')};
  transition: all ${designTokens.transitions.duration.fast}
    ${designTokens.transitions.timing.easeOut};
`

const Spotlight = styled.div<{ rect: DOMRect | null }>`
  position: fixed;
  ${(props) =>
    props.rect &&
    `
    top: ${props.rect.top - 8}px;
    left: ${props.rect.left - 8}px;
    width: ${props.rect.width + 16}px;
    height: ${props.rect.height + 16}px;
  `}
  border-radius: ${designTokens.borderRadius.lg};
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
  pointer-events: none;
  transition: all ${designTokens.transitions.duration.normal}
    ${designTokens.transitions.timing.easeOut};
  z-index: ${designTokens.zIndex.modal + 1};
`

const Tooltip = styled.div<{ rect: DOMRect | null; placement: string }>`
  position: fixed;
  ${(props) => {
    if (!props.rect) return ''

    const offset = 16
    let top = 0
    let left = 0

    switch (props.placement) {
      case 'top':
        top = props.rect.top - offset
        left = props.rect.left + props.rect.width / 2
        return `
          top: ${top}px;
          left: ${left}px;
          transform: translate(-50%, -100%);
        `
      case 'bottom':
        top = props.rect.bottom + offset
        left = props.rect.left + props.rect.width / 2
        return `
          top: ${top}px;
          left: ${left}px;
          transform: translate(-50%, 0);
        `
      case 'left':
        top = props.rect.top + props.rect.height / 2
        left = props.rect.left - offset
        return `
          top: ${top}px;
          left: ${left}px;
          transform: translate(-100%, -50%);
        `
      case 'right':
        top = props.rect.top + props.rect.height / 2
        left = props.rect.right + offset
        return `
          top: ${top}px;
          left: ${left}px;
          transform: translate(0, -50%);
        `
      default:
        return ''
    }
  }}
  max-width: 400px;
  background-color: ${designTokens.colors.background.paper};
  border-radius: ${designTokens.borderRadius.xl};
  box-shadow: ${designTokens.shadows['2xl']};
  z-index: ${designTokens.zIndex.modal + 2};
  opacity: ${(props) => (props.rect ? 1 : 0)};
  visibility: ${(props) => (props.rect ? 'visible' : 'hidden')};
  transition: all ${designTokens.transitions.duration.normal}
    ${designTokens.transitions.timing.easeOut};
`

const TooltipHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${designTokens.spacing[4]} ${designTokens.spacing[5]};
  border-bottom: 1px solid ${designTokens.colors.border.light};
`

const TooltipTitle = styled.h3`
  font-size: ${designTokens.typography.fontSize.lg};
  font-weight: ${designTokens.typography.fontWeight.semibold};
  color: ${designTokens.colors.text.primary};
  margin: 0;
`

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background-color: transparent;
  color: ${designTokens.colors.text.secondary};
  border-radius: ${designTokens.borderRadius.md};
  cursor: pointer;
  transition: ${designTokens.transitions.fast};

  &:hover {
    background-color: ${designTokens.colors.neutral[100]};
    color: ${designTokens.colors.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${designTokens.colors.primary[500]};
    outline-offset: 2px;
  }
`

const TooltipContent = styled.div`
  padding: ${designTokens.spacing[5]};
  font-size: ${designTokens.typography.fontSize.sm};
  line-height: ${designTokens.typography.lineHeight.relaxed};
  color: ${designTokens.colors.text.secondary};
`

const TooltipFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${designTokens.spacing[4]} ${designTokens.spacing[5]};
  border-top: 1px solid ${designTokens.colors.border.light};
`

const Progress = styled.div`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing[2]};
  font-size: ${designTokens.typography.fontSize.sm};
  color: ${designTokens.colors.text.hint};
`

const ProgressDots = styled.div`
  display: flex;
  gap: ${designTokens.spacing[1]};
`

const ProgressDot = styled.div<{ active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: ${designTokens.borderRadius.full};
  background-color: ${(props) =>
    props.active ? designTokens.colors.primary[500] : designTokens.colors.neutral[300]};
  transition: ${designTokens.transitions.fast};
`

const Actions = styled.div`
  display: flex;
  gap: ${designTokens.spacing[2]};
`

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing[2]};
  padding: ${designTokens.spacing[2]} ${designTokens.spacing[4]};
  border: none;
  background-color: ${(props) =>
    props.variant === 'primary' ? designTokens.colors.primary[500] : 'transparent'};
  color: ${(props) =>
    props.variant === 'primary'
      ? designTokens.colors.neutral[0]
      : designTokens.colors.text.secondary};
  font-size: ${designTokens.typography.fontSize.sm};
  font-weight: ${designTokens.typography.fontWeight.medium};
  border-radius: ${designTokens.borderRadius.md};
  cursor: pointer;
  transition: ${designTokens.transitions.fast};

  &:hover {
    background-color: ${(props) =>
      props.variant === 'primary'
        ? designTokens.colors.primary[600]
        : designTokens.colors.neutral[100]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${designTokens.colors.primary[500]};
    outline-offset: 2px;
  }
`

// ============================================================================
// Component
// ============================================================================

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  steps,
  open,
  onClose,
  onComplete,
  rtl = false,
  showProgress = true,
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const step = steps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  // Update target element position
  const updateTargetRect = useCallback(() => {
    if (!step) return

    const element = document.querySelector(step.target)
    if (element) {
      const rect = element.getBoundingClientRect()
      setTargetRect(rect)

      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [step])

  // Update position on step change
  useEffect(() => {
    if (!open || !step) return

    const runBeforeShow = async () => {
      if (step.beforeShow) {
        await step.beforeShow()
      }

      // Wait for DOM updates
      setTimeout(updateTargetRect, 100)
    }

    runBeforeShow()

    if (step.afterShow) {
      step.afterShow()
    }
  }, [open, step, updateTargetRect])

  // Update position on window resize
  useEffect(() => {
    if (!open) return

    window.addEventListener('resize', updateTargetRect)
    window.addEventListener('scroll', updateTargetRect)

    return () => {
      window.removeEventListener('resize', updateTargetRect)
      window.removeEventListener('scroll', updateTargetRect)
    }
  }, [open, updateTargetRect])

  const handleNext = () => {
    if (isLastStep) {
      handleComplete()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleComplete = () => {
    onComplete?.()
    onClose()
  }

  const handleSkip = () => {
    onClose()
  }

  if (!open || !step) return null

  const title = rtl && step.titleAr ? step.titleAr : step.title
  const content = rtl && step.contentAr ? step.contentAr : step.content

  return (
    <>
      <Overlay show={open} />
      <Spotlight rect={targetRect} />
      <Tooltip rect={targetRect} placement={step.placement || 'bottom'}>
        <TooltipHeader>
          <TooltipTitle>{title}</TooltipTitle>
          <CloseButton onClick={handleSkip} aria-label="Close">
            <X size={20} />
          </CloseButton>
        </TooltipHeader>

        <TooltipContent>{content}</TooltipContent>

        <TooltipFooter>
          {showProgress && (
            <Progress>
              <ProgressDots>
                {steps.map((_, index) => (
                  <ProgressDot key={index} active={index === currentStep} />
                ))}
              </ProgressDots>
              <span>
                {currentStep + 1} / {steps.length}
              </span>
            </Progress>
          )}

          <Actions>
            {!isFirstStep && (
              <Button onClick={handlePrev}>
                {rtl ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                {rtl ? 'السابق' : 'Previous'}
              </Button>
            )}

            <Button variant="primary" onClick={handleNext}>
              {isLastStep ? (
                <>
                  <Check size={16} />
                  {rtl ? 'إنهاء' : 'Finish'}
                </>
              ) : (
                <>
                  {rtl ? 'التالي' : 'Next'}
                  {rtl ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </>
              )}
            </Button>
          </Actions>
        </TooltipFooter>
      </Tooltip>
    </>
  )
}

export default OnboardingTour
