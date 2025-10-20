/**
 * Analytics Filters Component for Phase 2 Implementation
 * 
 * This component provides comprehensive filtering capabilities for analytics data
 * including date ranges, categories, regions, outcomes, and value ranges.
 * 
 * @author Desktop Management System Team
 * @version 2.0.0
 * @since Phase 2 Implementation
 */

import React, { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Checkbox } from '../ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Calendar } from '../ui/calendar'
import { 
  Filter, 
  Calendar as CalendarIcon, 
  X, 
  RotateCcw,
  Search,
  MapPin,
  Building,
  DollarSign,
  Target
} from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import type { AnalyticsFilter } from '@/shared/types/analytics'
import { formatCurrency } from '@/shared/utils/analytics/analyticsUtils'

/**
 * Props for the Analytics Filters component
 */
export interface AnalyticsFiltersProps {
  /** Current filter state */
  filters: AnalyticsFilter
  /** Callback when filters change */
  onFiltersChange: (filters: AnalyticsFilter) => void
  /** Available categories for filtering */
  availableCategories?: string[]
  /** Available regions for filtering */
  availableRegions?: string[]
  /** Available outcomes for filtering */
  availableOutcomes?: ('won' | 'lost' | 'pending' | 'cancelled')[]
  /** Whether to show advanced filters */
  showAdvancedFilters?: boolean
  /** Whether filters are being applied (loading state) */
  isApplying?: boolean
}

/**
 * Default filter values
 */
const DEFAULT_FILTERS: AnalyticsFilter = {
  dateRange: {
    start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  }
}

/**
 * Analytics Filters Component
 * 
 * Provides comprehensive filtering capabilities for analytics data with
 * date ranges, categories, regions, outcomes, and value ranges.
 */
export const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = React.memo(({
  filters,
  onFiltersChange,
  availableCategories = ['سكني', 'تجاري', 'بنية تحتية', 'صناعي'],
  availableRegions = ['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة'],
  availableOutcomes = ['won', 'lost', 'pending', 'cancelled'],
  showAdvancedFilters = true,
  isApplying = false
}) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [isExpanded, setIsExpanded] = useState(false)
  const [tempFilters, setTempFilters] = useState<AnalyticsFilter>(filters)

  // Date picker states
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  /**
   * Count active filters
   */
  const activeFiltersCount = useMemo(() => {
    let count = 0
    
    if (filters.dateRange) count++
    if (filters.categories?.length) count++
    if (filters.regions?.length) count++
    if (filters.outcomes?.length) count++
    if (filters.valueRange) count++
    if (filters.searchTerm) count++
    
    return count
  }, [filters])

  /**
   * Check if filters have been modified
   */
  const hasChanges = useMemo(() => {
    return JSON.stringify(filters) !== JSON.stringify(tempFilters)
  }, [filters, tempFilters])

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle filter updates
   */
  const updateFilter = useCallback((key: keyof AnalyticsFilter, value: any) => {
    setTempFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }, [])

  /**
   * Apply filters
   */
  const applyFilters = useCallback(() => {
    onFiltersChange(tempFilters)
  }, [tempFilters, onFiltersChange])

  /**
   * Reset filters to default
   */
  const resetFilters = useCallback(() => {
    const defaultFilters = { ...DEFAULT_FILTERS }
    setTempFilters(defaultFilters)
    onFiltersChange(defaultFilters)
  }, [onFiltersChange])

  /**
   * Cancel changes and revert to current filters
   */
  const cancelChanges = useCallback(() => {
    setTempFilters(filters)
  }, [filters])

  /**
   * Handle category selection
   */
  const handleCategoryChange = useCallback((category: string, checked: boolean) => {
    const currentCategories = tempFilters.categories || []
    const newCategories = checked
      ? [...currentCategories, category]
      : currentCategories.filter(c => c !== category)
    
    updateFilter('categories', newCategories.length > 0 ? newCategories : undefined)
  }, [tempFilters.categories, updateFilter])

  /**
   * Handle region selection
   */
  const handleRegionChange = useCallback((region: string, checked: boolean) => {
    const currentRegions = tempFilters.regions || []
    const newRegions = checked
      ? [...currentRegions, region]
      : currentRegions.filter(r => r !== region)
    
    updateFilter('regions', newRegions.length > 0 ? newRegions : undefined)
  }, [tempFilters.regions, updateFilter])

  /**
   * Handle outcome selection
   */
  const handleOutcomeChange = useCallback((outcome: string, checked: boolean) => {
    const currentOutcomes = tempFilters.outcomes || []
    const newOutcomes = checked
      ? [...currentOutcomes, outcome as any]
      : currentOutcomes.filter(o => o !== outcome)
    
    updateFilter('outcomes', newOutcomes.length > 0 ? newOutcomes : undefined)
  }, [tempFilters.outcomes, updateFilter])

  /**
   * Handle value range changes
   */
  const handleValueRangeChange = useCallback((type: 'min' | 'max', value: string) => {
    const numValue = parseFloat(value) || 0
    const currentRange = tempFilters.valueRange || { min: 0, max: 100000000 }
    
    const newRange = {
      ...currentRange,
      [type]: numValue
    }
    
    updateFilter('valueRange', newRange)
  }, [tempFilters.valueRange, updateFilter])

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  /**
   * Render outcome label in Arabic
   */
  const getOutcomeLabel = (outcome: string) => {
    switch (outcome) {
      case 'won': return 'مكتسبة'
      case 'lost': return 'مفقودة'
      case 'pending': return 'قيد الانتظار'
      case 'cancelled': return 'ملغية'
      default: return outcome
    }
  }

  /**
   * Render active filters summary
   */
  const renderActiveFilters = () => {
    if (activeFiltersCount === 0) return null

    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {filters.dateRange && (
          <Badge variant="secondary" className="flex items-center space-x-1">
            <CalendarIcon className="h-3 w-3" />
            <span>
              {format(new Date(filters.dateRange.start), 'dd/MM/yyyy', { locale: ar })} - 
              {format(new Date(filters.dateRange.end), 'dd/MM/yyyy', { locale: ar })}
            </span>
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => updateFilter('dateRange', undefined)}
            />
          </Badge>
        )}
        
        {filters.categories?.map(category => (
          <Badge key={category} variant="secondary" className="flex items-center space-x-1">
            <Building className="h-3 w-3" />
            <span>{category}</span>
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => handleCategoryChange(category, false)}
            />
          </Badge>
        ))}
        
        {filters.regions?.map(region => (
          <Badge key={region} variant="secondary" className="flex items-center space-x-1">
            <MapPin className="h-3 w-3" />
            <span>{region}</span>
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => handleRegionChange(region, false)}
            />
          </Badge>
        ))}
        
        {filters.outcomes?.map(outcome => (
          <Badge key={outcome} variant="secondary" className="flex items-center space-x-1">
            <Target className="h-3 w-3" />
            <span>{getOutcomeLabel(outcome)}</span>
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => handleOutcomeChange(outcome, false)}
            />
          </Badge>
        ))}
        
        {filters.valueRange && (
          <Badge variant="secondary" className="flex items-center space-x-1">
            <DollarSign className="h-3 w-3" />
            <span>
              {formatCurrency(filters.valueRange.min)} - {formatCurrency(filters.valueRange.max)}
            </span>
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => updateFilter('valueRange', undefined)}
            />
          </Badge>
        )}
      </div>
    )
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>مرشحات التحليلات</span>
              {activeFiltersCount > 0 && (
                <Badge variant="default">{activeFiltersCount}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              قم بتخصيص المرشحات لتحليل البيانات حسب احتياجاتك
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'إخفاء' : 'إظهار'} المرشحات
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                إعادة تعيين
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      {renderActiveFilters()}
      
      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">نطاق التاريخ</Label>
            <div className="flex items-center space-x-2">
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {tempFilters.dateRange?.start 
                      ? format(new Date(tempFilters.dateRange.start), 'dd/MM/yyyy', { locale: ar })
                      : 'تاريخ البداية'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={tempFilters.dateRange?.start ? new Date(tempFilters.dateRange.start) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        updateFilter('dateRange', {
                          ...tempFilters.dateRange,
                          start: date.toISOString().split('T')[0]
                        })
                      }
                      setStartDateOpen(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <span className="text-muted-foreground">إلى</span>
              
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {tempFilters.dateRange?.end 
                      ? format(new Date(tempFilters.dateRange.end), 'dd/MM/yyyy', { locale: ar })
                      : 'تاريخ النهاية'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={tempFilters.dateRange?.end ? new Date(tempFilters.dateRange.end) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        updateFilter('dateRange', {
                          ...tempFilters.dateRange,
                          end: date.toISOString().split('T')[0]
                        })
                      }
                      setEndDateOpen(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Search Term */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">البحث</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث في المناقصات..."
                value={tempFilters.searchTerm || ''}
                onChange={(e) => updateFilter('searchTerm', e.target.value || undefined)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Categories Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">الفئات</Label>
            <div className="grid grid-cols-2 gap-2">
              {availableCategories.map(category => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category}`}
                    checked={tempFilters.categories?.includes(category) || false}
                    onCheckedChange={(checked) => handleCategoryChange(category, checked as boolean)}
                  />
                  <Label htmlFor={`category-${category}`} className="text-sm">
                    {category}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Regions Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">المناطق</Label>
            <div className="grid grid-cols-2 gap-2">
              {availableRegions.map(region => (
                <div key={region} className="flex items-center space-x-2">
                  <Checkbox
                    id={`region-${region}`}
                    checked={tempFilters.regions?.includes(region) || false}
                    onCheckedChange={(checked) => handleRegionChange(region, checked as boolean)}
                  />
                  <Label htmlFor={`region-${region}`} className="text-sm">
                    {region}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Outcomes Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">النتائج</Label>
            <div className="grid grid-cols-2 gap-2">
              {availableOutcomes.map(outcome => (
                <div key={outcome} className="flex items-center space-x-2">
                  <Checkbox
                    id={`outcome-${outcome}`}
                    checked={tempFilters.outcomes?.includes(outcome) || false}
                    onCheckedChange={(checked) => handleOutcomeChange(outcome, checked as boolean)}
                  />
                  <Label htmlFor={`outcome-${outcome}`} className="text-sm">
                    {getOutcomeLabel(outcome)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Value Range Filter */}
          {showAdvancedFilters && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">نطاق القيمة</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="الحد الأدنى"
                  value={tempFilters.valueRange?.min || ''}
                  onChange={(e) => handleValueRangeChange('min', e.target.value)}
                />
                <span className="text-muted-foreground">إلى</span>
                <Input
                  type="number"
                  placeholder="الحد الأعلى"
                  value={tempFilters.valueRange?.max || ''}
                  onChange={(e) => handleValueRangeChange('max', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t">
            {hasChanges && (
              <Button variant="ghost" onClick={cancelChanges}>
                إلغاء
              </Button>
            )}
            <Button 
              onClick={applyFilters} 
              disabled={isApplying || !hasChanges}
            >
              {isApplying ? 'جاري التطبيق...' : 'تطبيق المرشحات'}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
})

AnalyticsFilters.displayName = 'AnalyticsFilters'


