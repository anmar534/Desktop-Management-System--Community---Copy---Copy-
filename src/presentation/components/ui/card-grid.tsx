/**
 * Card Grid Component
 *
 * نظام Grid محسّن لعرض البطاقات بشكل متجاوب
 * مستوحى من أفضل الممارسات في Procore و Autodesk ACC
 *
 * @version 1.0.0
 * @date 2025-10-08
 */

import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

export type GridVariant = 'auto' | 'dashboard' | 'financial' | 'projects' | 'custom'

interface CardGridProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * نوع Grid المطلوب
   * - auto: يتكيف تلقائياً (auto-fit, minmax)
   * - dashboard: للوحة التحكم (1/2/3/4 أعمدة حسب الشاشة)
   * - financial: للصفحات المالية (1/2/3 أعمدة)
   * - projects: لصفحات المشاريع (1/2/3 أعمدة)
   * - custom: تخصيص يدوي عبر className
   */
  variant?: GridVariant

  /**
   * الحد الأدنى لعرض البطاقة (يستخدم مع variant="auto")
   * @default "300px"
   */
  minCardWidth?: string

  /**
   * المسافة بين البطاقات
   * @default "1.5rem" (24px)
   */
  gap?: string

  /**
   * عناصر الأطفال (البطاقات)
   */
  children: ReactNode
}

export function CardGrid({
  variant = 'auto',
  minCardWidth = '300px',
  gap = '1.5rem',
  className,
  children,
  style,
  ...props
}: CardGridProps) {
  const variantStyles: Record<GridVariant, string> = {
    auto: 'card-grid',
    dashboard: 'dashboard-grid',
    financial: 'financial-grid',
    projects: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    custom: '',
  }

  const gridStyle: CSSProperties =
    variant === 'auto'
      ? {
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(${minCardWidth}, 1fr))`,
          gap,
          ...style,
        }
      : {
          gap,
          ...style,
        }

  return (
    <div className={cn(variantStyles[variant], className)} style={gridStyle} {...props}>
      {children}
    </div>
  )
}

/**
 * Card Grid Item - wrapper للبطاقة الفردية مع دعم الـ elevation والتفاعل
 */
interface CardGridItemProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * إضافة تأثير الارتفاع عند التمرير
   * @default false
   */
  elevated?: boolean

  /**
   * البطاقة قابلة للنقر
   * @default false
   */
  clickable?: boolean

  /**
   * عناصر الأطفال
   */
  children: ReactNode
}

export function CardGridItem({
  elevated = false,
  clickable = false,
  className,
  children,
  ...props
}: CardGridItemProps) {
  return (
    <div
      className={cn(
        'h-full',
        elevated && 'card-elevated',
        clickable && 'cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * KPI Cards Grid - شبكة خاصة بعرض مؤشرات الأداء الرئيسية
 */
interface KPICardsGridProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * عدد الأعمدة في الشاشات الكبيرة
   * @default 4
   */
  columns?: 2 | 3 | 4 | 5 | 6

  children: ReactNode
}

export function KPICardsGrid({ columns = 4, className, children, ...props }: KPICardsGridProps) {
  const columnClasses: Record<number, string> = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
    5: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  }

  return (
    <div className={cn('grid grid-cols-1', columnClasses[columns], 'gap-4', className)} {...props}>
      {children}
    </div>
  )
}

/**
 * Status Cards Grid - شبكة خاصة بعرض بطاقات الحالة (مثل حالة المنافسات)
 */
interface StatusCardsGridProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * نمط العرض
   * - compact: مدمج (4-5 بطاقات في الصف)
   * - comfortable: مريح (2-3 بطاقات في الصف)
   * @default "comfortable"
   */
  density?: 'compact' | 'comfortable'

  children: ReactNode
}

export function StatusCardsGrid({
  density = 'comfortable',
  className,
  children,
  ...props
}: StatusCardsGridProps) {
  const densityClasses = {
    compact: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3',
    comfortable: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
  }

  return (
    <div className={cn('grid', densityClasses[density], className)} {...props}>
      {children}
    </div>
  )
}
