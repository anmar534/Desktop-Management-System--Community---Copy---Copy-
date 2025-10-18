import { RefreshCw } from 'lucide-react'
import { Button } from './button'
import { useFinancialState } from '@/application/context/FinancialStateContext'
import { formatDistanceToNow } from 'date-fns'
import { arSA } from 'date-fns/locale'

interface LastUpdateIndicatorProps {
  compact?: boolean
  showRefreshButton?: boolean
  hideFallbackLabel?: boolean
}

export function LastUpdateIndicator({
  compact = false,
  showRefreshButton = true,
  hideFallbackLabel = false,
}: LastUpdateIndicatorProps) {
  const { lastRefreshAt, isRefreshing, refreshAll } = useFinancialState()

  const getTimeLabel = () => {
    if (!lastRefreshAt) {
      return hideFallbackLabel ? '' : 'لم يتم التحديث بعد'
    }

    try {
      const distance = formatDistanceToNow(new Date(lastRefreshAt), {
        addSuffix: true,
        locale: arSA,
      })
      return `آخر تحديث ${distance}`
    } catch {
      return 'آخر تحديث: غير متاح'
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
        {getTimeLabel() && <span>{getTimeLabel()}</span>}
      </div>
    )
  }

  return (
    <div
      className={`flex items-center ${compact ? 'gap-2 text-xs text-muted-foreground' : 'gap-3 text-sm'}`}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
        {getTimeLabel() && <span>{getTimeLabel()}</span>}
      </div>
      {showRefreshButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={refreshAll}
          disabled={isRefreshing}
          className="h-8"
        >
          <RefreshCw className="h-3 w-3 ml-1" />
          تحديث البيانات
        </Button>
      )}
    </div>
  )
}
