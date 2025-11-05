import { useEffect, useMemo, useState } from 'react'
import type { KPICardData } from '@/application/hooks/useKPIs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/presentation/components/ui/dialog'
import { Checkbox } from '@/presentation/components/ui/checkbox'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'

interface DashboardKPIPreferencesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  kpis: KPICardData[]
  selectedIds: string[]
  maxSelectable: number
  onSave: (ids: string[]) => void
}

function ensureLimit(ids: string[], max: number): string[] {
  const unique: string[] = []
  const seen = new Set<string>()
  for (const id of ids) {
    if (unique.length >= max) break
    if (!seen.has(id)) {
      seen.add(id)
      unique.push(id)
    }
  }
  return unique
}

export function DashboardKPIPreferencesDialog({
  open,
  onOpenChange,
  kpis,
  selectedIds,
  maxSelectable,
  onSave,
}: DashboardKPIPreferencesDialogProps) {
  const [localSelection, setLocalSelection] = useState<string[]>(selectedIds)

  useEffect(() => {
    if (open) {
      setLocalSelection(ensureLimit(selectedIds, maxSelectable))
    }
  }, [open, selectedIds, maxSelectable])

  const selectedSet = useMemo(() => new Set(localSelection), [localSelection])

  const toggleSelection = (id: string) => {
    setLocalSelection((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      }
      if (prev.length >= maxSelectable) {
        return prev
      }
      return [...prev, id]
    })
  }

  const handleSave = () => {
    onSave(ensureLimit(localSelection, maxSelectable))
    onOpenChange(false)
  }

  const allDisabled = localSelection.length >= maxSelectable

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>تخصيص مؤشرات الأداء الظاهرة</DialogTitle>
          <DialogDescription>
            يمكنك اختيار حتى {maxSelectable} بطاقات لعرضها في لوحة التحكم الرئيسية. يمكن تعديل
            الاختيارات لاحقاً في أي وقت.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 p-3 text-xs text-muted-foreground">
            <span>
              المؤشرات المختارة حالياً: {localSelection.length} / {maxSelectable}
            </span>
            {allDisabled && (
              <Badge variant="secondary" className="text-xs">
                الحد الأقصى مُستخدم
              </Badge>
            )}
          </div>

          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {kpis.map((kpi) => {
              const isChecked = selectedSet.has(kpi.id)
              const shouldDisable = !isChecked && allDisabled

              return (
                <label
                  key={kpi.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border border-border/40 bg-card/60 p-3 transition hover:border-primary/40 ${
                    shouldDisable ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  <Checkbox
                    checked={isChecked}
                    disabled={shouldDisable}
                    onCheckedChange={() => toggleSelection(kpi.id)}
                  />
                  <div className="flex flex-1 items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2 ${kpi.bgClass}`}>
                        <kpi.icon className={`h-4 w-4 ${kpi.colorClass}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{kpi.title}</p>
                        <p className="text-xs text-muted-foreground">
                          الفئة: {kpi.category || 'غير محدد'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      الهدف {kpi.target.toLocaleString()}
                    </Badge>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={localSelection.length === 0}>
            حفظ التفضيلات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
