/**
 * Compact Item Selector - Sidebar Version
 * محدد البنود المدمج للشريط الجانبي
 *
 * تصميم مدمج للشريط الجانبي:
 * - عرض ضيق ومدمج
 * - بحث سريع
 * - فلتر بسيط
 * - تنقل سهل
 */

import { useState, useMemo } from 'react'
import { Search, CheckCircle, Clock, ChevronUp, ChevronDown } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/components/ui/utils'
import type { MockPricingItem } from '../mockData'

interface CompactItemSelectorProps {
  items: MockPricingItem[]
  currentIndex: number
  onSelectItem: (index: number) => void
  onNext: () => void
  onPrevious: () => void
  formatCurrency: (value: number) => string
}

type FilterType = 'all' | 'priced' | 'unpriced'

export const CompactItemSelector: React.FC<CompactItemSelectorProps> = ({
  items,
  currentIndex,
  onSelectItem,
  onNext,
  onPrevious,
  formatCurrency,
}) => {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')

  const currentItem = items[currentIndex]

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const searchLower = search.toLowerCase()
      const matchesSearch =
        search === '' ||
        item.description.toLowerCase().includes(searchLower) ||
        item.itemNumber.includes(search)

      const matchesFilter =
        filter === 'all' ? true : filter === 'priced' ? item.isPriced : !item.isPriced

      return matchesSearch && matchesFilter
    })
  }, [items, search, filter])

  const pricedCount = items.filter((i) => i.isPriced).length
  const unpricedCount = items.length - pricedCount

  return (
    <Card className="h-full flex flex-col border-2">
      <CardHeader className="pb-3 space-y-3">
        {/* البند الحالي */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">البند الحالي</span>
            <span className="text-xs font-semibold text-primary">
              {currentIndex + 1} / {items.length}
            </span>
          </div>
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-primary">
                {currentItem.itemNumber}
              </span>
              {currentItem.isPriced && <CheckCircle className="h-3 w-3 text-success" />}
            </div>
            <p className="text-xs leading-relaxed line-clamp-2 text-foreground">
              {currentItem.description}
            </p>
          </div>
        </div>

        {/* أزرار التنقل */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevious}
            disabled={currentIndex === 0}
            className="h-8"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={currentIndex === items.length - 1}
            className="h-8"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        {/* البحث */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث..."
            className="pl-8 h-8 text-xs"
          />
        </div>

        {/* الفلاتر - أزرار صغيرة */}
        <div className="flex gap-1">
          <Button
            variant={filter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
            className="flex-1 h-7 text-xs px-1"
          >
            الكل ({items.length})
          </Button>
          <Button
            variant={filter === 'priced' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('priced')}
            className={cn(
              'flex-1 h-7 text-xs px-1',
              filter === 'priced'
                ? 'bg-success hover:bg-success/90'
                : 'text-success hover:bg-success/10',
            )}
          >
            <CheckCircle className="h-3 w-3" />
            {pricedCount}
          </Button>
          <Button
            variant={filter === 'unpriced' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('unpriced')}
            className={cn(
              'flex-1 h-7 text-xs px-1',
              filter === 'unpriced'
                ? 'bg-warning hover:bg-warning/90'
                : 'text-warning hover:bg-warning/10',
            )}
          >
            <Clock className="h-3 w-3" />
            {unpricedCount}
          </Button>
        </div>
      </CardHeader>

      {/* القائمة */}
      <CardContent className="flex-1 px-2 pt-0 pb-2">
        <ScrollArea className="h-full">
          <div className="space-y-1 pr-2">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const itemIndex = items.indexOf(item)
                const isActive = itemIndex === currentIndex

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectItem(itemIndex)}
                    className={cn(
                      'w-full text-right p-2 rounded-md transition-all',
                      'border',
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary shadow-md'
                        : 'bg-card hover:bg-muted/50 border-transparent hover:border-primary/20',
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span
                          className={cn(
                            'text-[10px] font-mono font-semibold px-1 rounded',
                            isActive
                              ? 'bg-primary-foreground/20 text-primary-foreground'
                              : 'bg-primary/10 text-primary',
                          )}
                        >
                          {item.itemNumber}
                        </span>
                        {item.isPriced && (
                          <CheckCircle
                            className={cn(
                              'h-3 w-3',
                              isActive ? 'text-primary-foreground' : 'text-success',
                            )}
                          />
                        )}
                      </div>
                      <p
                        className={cn(
                          'text-[10px] leading-relaxed line-clamp-2',
                          isActive ? 'text-primary-foreground' : 'text-foreground',
                        )}
                      >
                        {item.description}
                      </p>
                      {item.isPriced && (
                        <span
                          className={cn(
                            'text-[10px] font-semibold tabular-nums',
                            isActive ? 'text-primary-foreground' : 'text-success',
                          )}
                        >
                          {formatCurrency(item.totalPrice ?? 0)}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-xs text-muted-foreground">لا توجد نتائج</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
