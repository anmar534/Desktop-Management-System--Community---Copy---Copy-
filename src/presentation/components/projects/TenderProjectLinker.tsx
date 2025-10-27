/**
 * TenderProjectLinker Component
 * Week 4 - Task 1.3: UI Components for Tender-Project Linking
 *
 * مكون ربط المشروع بالمنافسة
 * يسمح بربط/فك ربط مشروع من منافسة مع واجهة مستخدم بسيطة
 */

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Link2, Unlink, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getEnhancedProjectRepository } from '@/application/services/serviceRegistry'
import { getTenderRepository } from '@/application/services/serviceRegistry'
import type { Tender } from '@/data/centralData'
import type { TenderProjectLink } from '@/types/projects'

// ============================================================================
// Types
// ============================================================================

export interface TenderProjectLinkerProps {
  /** معرّف المشروع */
  projectId: string

  /** وظيفة رد الاتصال عند نجاح الربط */
  onLinkSuccess?: (link: TenderProjectLink) => void

  /** وظيفة رد الاتصال عند نجاح فك الربط */
  onUnlinkSuccess?: () => void

  /** عرض كزر مضغوط */
  compact?: boolean
}

// ============================================================================
// Component
// ============================================================================

export const TenderProjectLinker: React.FC<TenderProjectLinkerProps> = ({
  projectId,
  onLinkSuccess,
  onUnlinkSuccess,
  compact = false,
}) => {
  // State Management
  const [tenders, setTenders] = useState<Tender[]>([])
  const [currentLink, setCurrentLink] = useState<TenderProjectLink | null>(null)
  const [selectedTenderId, setSelectedTenderId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingTenders, setIsFetchingTenders] = useState(false)
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [isUnlinkDialogOpen, setIsUnlinkDialogOpen] = useState(false)

  // Repositories
  const projectRepo = getEnhancedProjectRepository()
  const tenderRepo = getTenderRepository()

  // ============================================================================
  // Effects
  // ============================================================================

  /**
   * تحميل المنافسات عند فتح نافذة الربط
   */
  useEffect(() => {
    if (isLinkDialogOpen && tenders.length === 0) {
      fetchTenders()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLinkDialogOpen])

  /**
   * تحميل الربط الحالي عند تحميل المكون
   */
  useEffect(() => {
    loadCurrentLink()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  // ============================================================================
  // Data Fetching
  // ============================================================================

  /**
   * تحميل الربط الحالي للمشروع
   */
  const loadCurrentLink = async () => {
    try {
      const link = await projectRepo.getTenderLink(projectId)
      setCurrentLink(link)
    } catch (error) {
      console.error('Failed to load tender link:', error)
    }
  }

  /**
   * تحميل قائمة المنافسات
   */
  const fetchTenders = async () => {
    setIsFetchingTenders(true)
    try {
      const allTenders = await tenderRepo.getAll()
      // تصفية المنافسات: فقط الفائزة أو قيد التنفيذ
      const eligibleTenders = allTenders.filter(
        (t) => t.status === 'won' || t.status === 'submitted',
      )
      setTenders(eligibleTenders)
    } catch (error) {
      console.error('Failed to fetch tenders:', error)
      toast.error('فشل تحميل المنافسات', {
        description: 'حدث خطأ أثناء تحميل قائمة المنافسات',
      })
    } finally {
      setIsFetchingTenders(false)
    }
  }

  // ============================================================================
  // Action Handlers
  // ============================================================================

  /**
   * ربط المشروع بمنافسة
   */
  const handleLinkToTender = async () => {
    if (!selectedTenderId) {
      toast.error('لم يتم اختيار منافسة', {
        description: 'يرجى اختيار منافسة من القائمة',
      })
      return
    }

    setIsLoading(true)
    try {
      const link = await projectRepo.linkToTender(
        projectId,
        selectedTenderId,
        'related_to', // نوع الربط الافتراضي
      )

      setCurrentLink(link)
      setIsLinkDialogOpen(false)
      setSelectedTenderId('')

      toast.success('تم ربط المشروع بالمنافسة', {
        description: `تم ربط المشروع بالمنافسة بنجاح`,
      })

      onLinkSuccess?.(link)
    } catch (error) {
      console.error('Failed to link tender:', error)
      toast.error('فشل ربط المنافسة', {
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء ربط المنافسة',
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * فك ربط المشروع من المنافسة
   */
  const handleUnlinkFromTender = async () => {
    if (!currentLink) return

    setIsLoading(true)
    try {
      const success = await projectRepo.unlinkFromTender(projectId, currentLink.tenderId)

      if (success) {
        setCurrentLink(null)
        setIsUnlinkDialogOpen(false)

        toast.success('تم فك الربط', {
          description: 'تم فك ربط المشروع من المنافسة بنجاح',
        })

        onUnlinkSuccess?.()
      } else {
        throw new Error('فشل فك الربط')
      }
    } catch (error) {
      console.error('Failed to unlink tender:', error)
      toast.error('فشل فك الربط', {
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء فك الربط',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // ============================================================================
  // Render Helpers
  // ============================================================================

  /**
   * عرض شارة الحالة الحالية
   */
  const renderCurrentStatus = () => {
    if (currentLink) {
      const tender = tenders.find((t) => t.id === currentLink.tenderId)
      return (
        <div className="flex items-center gap-2">
          <Badge variant="success" className="flex items-center gap-1">
            <Link2 className="h-3 w-3" />
            مرتبط بمنافسة
          </Badge>
          {tender && <span className="text-sm text-muted-foreground">{tender.name}</span>}
        </div>
      )
    }

    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Unlink className="h-3 w-3" />
        غير مرتبط
      </Badge>
    )
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="flex items-center gap-2">
      {/* Current Status */}
      {!compact && renderCurrentStatus()}

      {/* Link Button */}
      {!currentLink && (
        <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size={compact ? 'sm' : 'default'}
              className="flex items-center gap-2"
            >
              <Link2 className="h-4 w-4" />
              ربط بمنافسة
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>ربط المشروع بمنافسة</DialogTitle>
              <DialogDescription>اختر المنافسة التي تريد ربطها بهذا المشروع</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">المنافسة</label>
                <Select
                  value={selectedTenderId}
                  onValueChange={setSelectedTenderId}
                  disabled={isFetchingTenders}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر منافسة..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {isFetchingTenders ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="mr-2 text-sm">جاري التحميل...</span>
                        </div>
                      ) : tenders.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          لا توجد منافسات متاحة
                        </div>
                      ) : (
                        tenders.map((tender) => (
                          <SelectItem key={tender.id} value={tender.id}>
                            <div className="flex flex-col">
                              <span>{tender.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {tender.client} - {tender.value.toLocaleString('ar-SA')} ريال
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsLinkDialogOpen(false)}
                disabled={isLoading}
              >
                إلغاء
              </Button>
              <Button onClick={handleLinkToTender} disabled={!selectedTenderId || isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري الربط...
                  </>
                ) : (
                  <>
                    <Link2 className="mr-2 h-4 w-4" />
                    ربط
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Unlink Button */}
      {currentLink && (
        <Dialog open={isUnlinkDialogOpen} onOpenChange={setIsUnlinkDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size={compact ? 'sm' : 'default'}
              className="flex items-center gap-2"
            >
              <Unlink className="h-4 w-4" />
              فك الربط
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>فك ربط المشروع من المنافسة</DialogTitle>
              <DialogDescription>
                هل أنت متأكد من فك ربط هذا المشروع من المنافسة؟
                <br />
                يمكنك إعادة الربط لاحقاً إذا لزم الأمر.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsUnlinkDialogOpen(false)}
                disabled={isLoading}
              >
                إلغاء
              </Button>
              <Button variant="destructive" onClick={handleUnlinkFromTender} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري فك الربط...
                  </>
                ) : (
                  <>
                    <Unlink className="mr-2 h-4 w-4" />
                    فك الربط
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default TenderProjectLinker
