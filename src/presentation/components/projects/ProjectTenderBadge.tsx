/**
 * ProjectTenderBadge Component
 * Week 4 - Task 1.3: UI Components for Tender-Project Linking
 *
 * شارة عرض ارتباط المشروع بالمنافسة
 * يعرض معلومات المنافسة المرتبطة بشكل مدمج مع إمكانية الانتقال للمنافسة
 */

import React, { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link2, ExternalLink, FileText, DollarSign, Calendar } from 'lucide-react'
import { getTenderRepository } from '@/application/services/serviceRegistry'
import type { Tender } from '@/data/centralData'
import type { TenderProjectLink } from '@/types/projects'

// ============================================================================
// Types
// ============================================================================

export interface ProjectTenderBadgeProps {
  /** رابط المنافسة-المشروع */
  tenderLink: TenderProjectLink | null

  /** وظيفة رد الاتصال عند النقر على الشارة */
  onNavigateToTender?: (tenderId: string) => void

  /** عرض معلومات موسعة */
  showDetails?: boolean

  /** حجم الشارة */
  size?: 'sm' | 'default' | 'lg'

  /** نمط العرض */
  variant?: 'badge' | 'card'
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * تنسيق قيمة المنافسة
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * تنسيق التاريخ
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

/**
 * الحصول على نص نوع الربط
 */
const getLinkTypeLabel = (linkType: string): string => {
  const labels: Record<string, string> = {
    created_from: 'تم إنشاؤه من',
    related_to: 'مرتبط بـ',
    derived_from: 'مشتق من',
  }
  return labels[linkType] || 'مرتبط بـ'
}

/**
 * الحصول على لون الحالة
 */
const getStatusColor = (status: Tender['status']): 'success' | 'warning' | 'info' | 'default' => {
  const statusColors: Record<Tender['status'], 'success' | 'warning' | 'info' | 'default'> = {
    won: 'success',
    submitted: 'info',
    under_action: 'warning',
    ready_to_submit: 'warning',
    new: 'default',
    lost: 'default',
    expired: 'default',
    cancelled: 'default',
  }
  return statusColors[status] || 'default'
}

/**
 * الحصول على نص الحالة
 */
const getStatusLabel = (status: Tender['status']): string => {
  const labels: Record<Tender['status'], string> = {
    won: 'فائزة',
    submitted: 'مقدمة',
    under_action: 'قيد العمل',
    ready_to_submit: 'جاهزة للتقديم',
    new: 'جديدة',
    lost: 'خاسرة',
    expired: 'منتهية',
    cancelled: 'ملغاة',
  }
  return labels[status] || status
}

// ============================================================================
// Component
// ============================================================================

export const ProjectTenderBadge: React.FC<ProjectTenderBadgeProps> = ({
  tenderLink,
  onNavigateToTender,
  showDetails = false,
  size = 'default',
  variant = 'badge',
}) => {
  // State Management
  const [tender, setTender] = useState<Tender | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Repository
  const tenderRepo = getTenderRepository()

  // ============================================================================
  // Effects
  // ============================================================================

  /**
   * تحميل بيانات المنافسة عند وجود رابط
   */
  useEffect(() => {
    if (tenderLink) {
      loadTender(tenderLink.tenderId)
    } else {
      setTender(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenderLink])

  // ============================================================================
  // Data Fetching
  // ============================================================================

  /**
   * تحميل بيانات المنافسة
   */
  const loadTender = async (tenderId: string) => {
    setIsLoading(true)
    try {
      const tenderData = await tenderRepo.getById(tenderId)
      setTender(tenderData)
    } catch (error) {
      console.error('Failed to load tender:', error)
      setTender(null)
    } finally {
      setIsLoading(false)
    }
  }

  // ============================================================================
  // Handlers
  // ============================================================================

  /**
   * التعامل مع النقر على الشارة
   */
  const handleClick = () => {
    if (tender && onNavigateToTender) {
      onNavigateToTender(tender.id)
    }
  }

  // ============================================================================
  // Render Helpers
  // ============================================================================

  /**
   * عرض الشارة البسيطة
   */
  const renderBadge = () => {
    if (!tender) return null

    const badgeClasses = {
      sm: 'text-xs px-2 py-0.5',
      default: 'text-sm px-2.5 py-1',
      lg: 'text-base px-3 py-1.5',
    }

    return (
      <Badge
        variant={getStatusColor(tender.status)}
        className={`flex items-center gap-1.5 ${badgeClasses[size]} cursor-pointer hover:opacity-80 transition-opacity`}
        onClick={handleClick}
      >
        <Link2 className="h-3 w-3" />
        <span>{getLinkTypeLabel(tenderLink?.linkType || 'related_to')}</span>
        <span className="font-semibold">{tender.name}</span>
        {onNavigateToTender && <ExternalLink className="h-3 w-3" />}
      </Badge>
    )
  }

  /**
   * عرض البطاقة الموسعة
   */
  const renderCard = () => {
    if (!tender) return null

    return (
      <div className="rounded-lg border bg-card p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {getLinkTypeLabel(tenderLink?.linkType || 'related_to')}
              </span>
            </div>
            <h4 className="font-semibold">{tender.name}</h4>
          </div>
          <Badge variant={getStatusColor(tender.status)}>{getStatusLabel(tender.status)}</Badge>
        </div>

        {/* Details */}
        {showDetails && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {/* Client */}
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">العميل:</span>
              <span className="font-medium">{tender.client}</span>
            </div>

            {/* Value */}
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">القيمة:</span>
              <span className="font-medium">{formatCurrency(tender.value)}</span>
            </div>

            {/* Deadline */}
            {tender.deadline && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">الموعد النهائي:</span>
                <span className="font-medium">{formatDate(tender.deadline)}</span>
              </div>
            )}

            {/* Link Date */}
            {tenderLink && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">تاريخ الربط:</span>
                <span className="font-medium">{formatDate(tenderLink.linkDate)}</span>
              </div>
            )}
          </div>
        )}

        {/* Navigate Button */}
        {onNavigateToTender && (
          <div className="pt-2">
            <Button variant="outline" size="sm" className="w-full" onClick={handleClick}>
              <ExternalLink className="mr-2 h-4 w-4" />
              عرض تفاصيل المنافسة
            </Button>
          </div>
        )}

        {/* Notes */}
        {showDetails && tenderLink?.notes && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">ملاحظات:</span> {tenderLink.notes}
            </p>
          </div>
        )}
      </div>
    )
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  // No link - render nothing
  if (!tenderLink) {
    return null
  }

  // Loading state
  if (isLoading) {
    return (
      <Badge variant="outline" className="flex items-center gap-1.5">
        <Link2 className="h-3 w-3 animate-pulse" />
        <span>جاري التحميل...</span>
      </Badge>
    )
  }

  // No tender found
  if (!tender) {
    return (
      <Badge variant="outline" className="flex items-center gap-1.5">
        <Link2 className="h-3 w-3" />
        <span>منافسة غير موجودة</span>
      </Badge>
    )
  }

  // Render based on variant
  return variant === 'badge' ? renderBadge() : renderCard()
}

export default ProjectTenderBadge
