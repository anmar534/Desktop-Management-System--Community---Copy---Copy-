/**
 * 💰 Project Costs Tab Component
 * Displays detailed project cost management with pricing synchronization
 *
 * Already refactored and delegates to SimplifiedProjectCostView
 * BOQ sync logic remains in parent (Phase 1.4 will move to useBOQSync)
 * Phase 1.3 - No changes needed
 */

import { Button } from '@/presentation/components/ui/button'
import { BarChart3 } from 'lucide-react'
import { SimplifiedProjectCostView } from '@/presentation/components/cost/SimplifiedProjectCostView'
import type { Tender } from '@/data/centralData'

// ===============================
// 📎 Types & Interfaces
// ===============================

interface BOQAvailability {
  hasProjectBOQ: boolean
  hasTenderBOQ: boolean
}

interface ProjectCostsTabProps {
  projectId: string
  relatedTender: Tender | null
  boqAvailability: BOQAvailability
  onSyncPricing: () => void
  onImportBOQ: () => void
}

// ===============================
// 🎨 Component
// ===============================

export function ProjectCostsTab({
  projectId,
  relatedTender,
  boqAvailability,
  onSyncPricing,
  onImportBOQ,
}: ProjectCostsTabProps) {
  return (
    <div className="space-y-4">
      {/* أدوات تسعير المشروع */}
      {relatedTender && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-muted bg-muted/10 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            أدوات تسعير المشروع
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={onSyncPricing}>
              🔄 إعادة مزامنة التسعير
            </Button>
            {!boqAvailability.hasProjectBOQ && boqAvailability.hasTenderBOQ && (
              <Button size="sm" onClick={onImportBOQ}>
                📥 استيراد BOQ من المنافسة
              </Button>
            )}
          </div>
        </div>
      )}

      {/* عرض التكاليف المبسط */}
      <SimplifiedProjectCostView projectId={projectId} tenderId={relatedTender?.id} />

      {/* ملاحظة توضيحية */}
      <div className="text-xs text-muted-foreground leading-relaxed border border-dashed border-muted rounded-lg px-4 py-3">
        تم تطبيق العرض المبسط الجديد لإدارة التكاليف المستوحى من تصميم صفحات التسعير في المناقصات.
        التصميم يركز على الوضوح والبساطة.
      </div>
    </div>
  )
}
