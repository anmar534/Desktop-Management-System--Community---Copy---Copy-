/**
 * TenderTabs component for displaying tender filter tabs
 */

import { StatusBadge } from '@/presentation/components/ui/status-badge'
import type { TenderTabId } from '@/shared/utils/tender/tenderFilters'
import type { TenderTabDefinition } from '@/shared/utils/tender/tenderTabHelpers'

interface TenderTabsProps {
  tabs: Array<TenderTabDefinition & { count: number }>
  activeTab: TenderTabId
  onTabChange: (tabId: TenderTabId) => void
}

export function TenderTabs({ tabs, activeTab, onTabChange }: TenderTabsProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/80 p-4 shadow-sm backdrop-blur">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`group flex flex-col items-center justify-center gap-1 rounded-xl border px-3 py-2 transition-all duration-200 ${
                isActive
                  ? 'border-primary/60 bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'border-transparent bg-transparent text-muted-foreground hover:border-primary/20 hover:bg-muted/40 hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold">
                <tab.icon
                  className={`h-4 w-4 ${
                    isActive
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground group-hover:text-primary'
                  }`}
                />
                <span>{tab.label}</span>
              </div>
              <StatusBadge
                status={isActive ? tab.badgeStatus : 'default'}
                label={String(tab.count)}
                size="sm"
                showIcon={false}
                className={`h-5 min-w-[24px] justify-center px-2 py-0.5 text-xs shadow-none ${
                  isActive
                    ? 'bg-primary/15 text-primary-foreground border-primary/40'
                    : 'bg-muted/30'
                }`}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
