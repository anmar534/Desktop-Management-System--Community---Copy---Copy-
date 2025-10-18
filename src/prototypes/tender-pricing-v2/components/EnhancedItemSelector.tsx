/**
 * Enhanced Item Selector Component
 * محدد البنود المحسّن - نموذج أولي
 *
 * الميزات الجديدة:
 * - بحث فوري
 * - فلترة حسب الحالة
 * - معاينة البند التالي
 * - keyboard navigation
 * - مؤشرات بصرية محسّنة
 */

import { useState, useMemo } from 'react'
import { Search, CheckCircle, Clock, ChevronRight, ChevronLeft, ArrowLeft } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/components/ui/utils'
import type { MockPricingItem } from '../mockData'

interface EnhancedItemSelectorProps {
  items: MockPricingItem[]
  currentIndex: number
  onSelectItem: (index: number) => void
  onNext: () => void
  onPrevious: () => void
  formatCurrency: (value: number) => string
}

type FilterType = 'all' | 'priced' | 'unpriced'

export const EnhancedItemSelector: React.FC<EnhancedItemSelectorProps> = ({
  items,
  currentIndex,
  onSelectItem,
  onNext,
  onPrevious,
  formatCurrency,
}) => {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')

  // تصفية البنود
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // تصفية حسب البحث
      const searchLower = search.toLowerCase()
      const matchesSearch =
        search === '' ||
        item.description.toLowerCase().includes(searchLower) ||
        item.itemNumber.includes(search)

      // تصفية حسب الحالة
      const matchesFilter =
        filter === 'all' ? true : filter === 'priced' ? item.isPriced : !item.isPriced

      return matchesSearch && matchesFilter
    })
  }, [items, search, filter])

  const pricedCount = items.filter((i) => i.isPriced).length
  const unpricedCount = items.length - pricedCount
  const currentItem = items[currentIndex]
  const nextItem = currentIndex < items.length - 1 ? items[currentIndex + 1] : null

  return (
    <Card className="mb-6 border-primary/20 shadow-sm">
      <CardHeader className="pb-4 border-b bg-gradient-to-l from-primary/5 via-card/40 to-background">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-primary">البند الحالي</h3>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrevious}
              disabled={currentIndex === 0}
              className="h-9 w-9 p-0 disabled:opacity-30"
              title="البند السابق (Alt+←)"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="px-3 py-1 bg-primary/10 rounded-lg">
              <span className="text-base font-bold text-primary tabular-nums">
                {currentIndex + 1} / {items.length}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onNext}
              disabled={currentIndex === items.length - 1}
              className="h-9 w-9 p-0 disabled:opacity-30"
              title="البند التالي (Alt+→)"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* البند الحالي - معلومات موسعة */}
        <div className="mt-4 p-4 bg-card rounded-xl border-2 border-primary/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center justify-center h-7 px-3 bg-primary text-primary-foreground text-sm font-mono font-semibold rounded-md">
                  {currentItem.itemNumber}
                </span>
                {currentItem.isPriced && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-success/10 text-success text-xs font-medium rounded-md">
                    <CheckCircle className="h-3 w-3" />
                    مُسعّر
                  </span>
                )}
              </div>
              <p className="text-lg font-semibold text-foreground leading-relaxed">
                {currentItem.description}
              </p>
              <div className="flex items-center gap-6 mt-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">الكمية:</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {currentItem.quantity.toLocaleString('ar-SA')} {currentItem.unit}
                  </span>
                </div>
                {currentItem.isPriced && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">سعر الوحدة:</span>
                      <span className="font-semibold text-foreground tabular-nums">
                        {formatCurrency(currentItem.unitPrice ?? 0)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">الإجمالي:</span>
                      <span className="font-bold text-success text-base tabular-nums">
                        {formatCurrency(currentItem.totalPrice ?? 0)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* البحث */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="البحث برقم البند أو الوصف... (Ctrl+K)"
            className="pl-10 h-11 border-primary/20 focus:border-primary"
          />
        </div>

        {/* الفلاتر */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className={cn('h-11 font-semibold transition-all', filter === 'all' ? 'shadow-md' : '')}
          >
            <span className="mr-2">الكل</span>
            <span className="tabular-nums">({items.length})</span>
          </Button>
          <Button
            variant={filter === 'priced' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('priced')}
            className={cn(
              'h-11 font-semibold transition-all',
              filter === 'priced'
                ? 'bg-success hover:bg-success/90 shadow-md'
                : 'border-success/30 text-success hover:bg-success/10',
            )}
          >
            <CheckCircle className="h-4 w-4 ml-2" />
            <span className="mr-2">مُسعّر</span>
            <span className="tabular-nums">({pricedCount})</span>
          </Button>
          <Button
            variant={filter === 'unpriced' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unpriced')}
            className={cn(
              'h-11 font-semibold transition-all',
              filter === 'unpriced'
                ? 'bg-warning hover:bg-warning/90 shadow-md'
                : 'border-warning/30 text-warning hover:bg-warning/10',
            )}
          >
            <Clock className="h-4 w-4 ml-2" />
            <span className="mr-2">غير مُسعّر</span>
            <span className="tabular-nums">({unpricedCount})</span>
          </Button>
        </div>

        {/* القائمة */}
        <div className="border rounded-xl overflow-hidden bg-muted/20">
          <ScrollArea className="h-80">
            <div className="p-2 space-y-1">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const itemIndex = items.indexOf(item)
                  const isActive = itemIndex === currentIndex

                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectItem(itemIndex)}
                      className={cn(
                        'w-full text-right p-4 rounded-lg transition-all duration-200',
                        'border-2',
                        isActive
                          ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-[1.02]'
                          : 'bg-card hover:bg-muted/50 border-transparent hover:border-primary/20',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={cn(
                                'inline-flex items-center justify-center h-6 px-2 text-xs font-mono font-semibold rounded',
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
                                  'h-4 w-4',
                                  isActive ? 'text-primary-foreground' : 'text-success',
                                )}
                              />
                            )}
                          </div>
                          <p
                            className={cn(
                              'text-sm font-medium line-clamp-2 leading-relaxed',
                              isActive ? 'text-primary-foreground' : 'text-foreground',
                            )}
                          >
                            {item.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <span
                              className={cn(
                                'tabular-nums',
                                isActive ? 'text-primary-foreground/80' : 'text-muted-foreground',
                              )}
                            >
                              {item.quantity.toLocaleString('ar-SA')} {item.unit}
                            </span>
                            {item.isPriced && (
                              <span
                                className={cn(
                                  'font-semibold tabular-nums',
                                  isActive ? 'text-primary-foreground' : 'text-success',
                                )}
                              >
                                {formatCurrency(item.totalPrice ?? 0)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">لا توجد نتائج للبحث</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* معاينة البند التالي */}
        {nextItem && (
          <div className="p-4 rounded-xl border-2 border-dashed border-info/30 bg-info/5">
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-info mt-1">
                <ArrowLeft className="h-3 w-3" />
                <span>البند التالي</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-semibold text-info bg-info/10 px-2 py-0.5 rounded">
                    {nextItem.itemNumber}
                  </span>
                  {nextItem.isPriced && <CheckCircle className="h-3 w-3 text-success" />}
                </div>
                <p className="text-sm font-medium text-foreground line-clamp-1">
                  {nextItem.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center p-3 bg-primary/5 rounded-lg">
            <div className="text-2xl font-bold text-primary tabular-nums">{items.length}</div>
            <div className="text-xs text-muted-foreground mt-1">إجمالي البنود</div>
          </div>
          <div className="text-center p-3 bg-success/5 rounded-lg">
            <div className="text-2xl font-bold text-success tabular-nums">{pricedCount}</div>
            <div className="text-xs text-muted-foreground mt-1">مُسعّرة</div>
          </div>
          <div className="text-center p-3 bg-warning/5 rounded-lg">
            <div className="text-2xl font-bold text-warning tabular-nums">{unpricedCount}</div>
            <div className="text-xs text-muted-foreground mt-1">متبقية</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
