import { UnifiedKPICard } from '@/presentation/components/kpi/UnifiedKPICard'
import type { KPICardData } from '@/application/hooks/useKPIs'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'

interface DashboardKPICardsProps {
  kpis: KPICardData[]
  isLoading: boolean
  maxCards: number
  hasGoals: boolean
  onSectionChange: (section: string) => void
  onAddGoals: () => void
  onCustomize: () => void
}

export function DashboardKPICards({
  kpis,
  isLoading,
  maxCards,
  hasGoals,
  onSectionChange,
  onAddGoals,
  onCustomize,
}: DashboardKPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[...Array(maxCards)].map((_, index) => (
          <div key={index} className="h-40 rounded-lg border border-border bg-card animate-pulse" />
        ))}
      </div>
    )
  }

  if (!hasGoals) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/50 bg-muted/20 p-8 text-center">
        <Badge variant="outline" className="text-muted-foreground">
          لا توجد أهداف مسجلة
        </Badge>
        <p className="text-sm text-muted-foreground">
          أضف أهدافاً في إدارة التطوير لعرض مؤشرات الأداء الرئيسية هنا.
        </p>
        <Button onClick={onAddGoals} className="rounded-full px-6">
          الانتقال إلى إدارة التطوير
        </Button>
      </div>
    )
  }

  if (kpis.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/40 bg-card/70 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          جميع الأهداف مخفية حالياً. قم باختيار المؤشرات التي ترغب بعرضها من خلال تخصيص لوحة التحكم.
        </p>
        <Button variant="outline" onClick={onCustomize} className="rounded-full px-6">
          تخصيص المؤشرات
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      {kpis.map((card) => (
        <UnifiedKPICard
          key={card.id}
          title={card.title}
          icon={<card.icon className={`h-4 w-4 ${card.colorClass}`} />}
          current={card.current}
          target={card.target}
          unit={card.unit}
          colorClass={card.colorClass}
          bgClass={card.bgClass}
          onClick={() => onSectionChange(card.link)}
        />
      ))}
    </div>
  )
}
