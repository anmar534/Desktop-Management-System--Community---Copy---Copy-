/**
 * @fileoverview Competitor Database Component
 * @description Comprehensive competitor intelligence management interface for Phase 3.
 * Provides competitor profile management, search, analysis, and reporting capabilities.
 *
 * @author Desktop Management System Team
 * @version 3.0.0
 * @since Phase 3 Implementation
 *
 * @example
 * ```tsx
 * import { CompetitorDatabase } from '@/presentation/components/competitive/CompetitorDatabase'
 * 
 * function CompetitiveIntelligencePage() {
 *   return (
 *     <div className="p-6">
 *       <CompetitorDatabase />
 *     </div>
 *   )
 * }
 * ```
 */

import type React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  Building2,
  MapPin,
  Users,
  Award,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  FileText,
  RefreshCw
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { Separator } from '../ui/separator'
import { Progress } from '../ui/progress'

import { competitorDatabaseService } from '../../services/competitorDatabaseService'
import type {
  Competitor,
  CompetitorType,
  CompetitorStatus,
  MarketSegment,
  CompetitorSearchFilters,
  CompetitiveAnalysisResult
} from '@/shared/types/competitive'

// ===== COMPONENT INTERFACES =====

interface CompetitorDatabaseProps {
  className?: string
  onCompetitorSelect?: (competitor: Competitor) => void
  showAnalytics?: boolean
  compactMode?: boolean
}

interface CompetitorCardProps {
  competitor: Competitor
  onView: (competitor: Competitor) => void
  onEdit: (competitor: Competitor) => void
  onDelete: (competitor: Competitor) => void
  onAnalyze: (competitor: Competitor) => void
}

interface FilterPanelProps {
  filters: CompetitorSearchFilters
  onFiltersChange: (filters: CompetitorSearchFilters) => void
  onClearFilters: () => void
}

// ===== MAIN COMPONENT =====

export const CompetitorDatabase: React.FC<CompetitorDatabaseProps> = ({
  className = '',
  onCompetitorSelect,
  showAnalytics = true,
  compactMode = false
}) => {
  // ===== STATE MANAGEMENT =====
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [filteredCompetitors, setFilteredCompetitors] = useState<Competitor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<CompetitorSearchFilters>({})
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'marketShare' | 'winRate' | 'lastUpdated'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // ===== DATA LOADING =====
  const loadCompetitors = useCallback(async () => {
    try {
      setLoading(true)
      const data = await competitorDatabaseService.getAllCompetitors()
      setCompetitors(data)
      setFilteredCompetitors(data)
    } catch (error) {
      console.error('Error loading competitors:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCompetitors()
  }, [loadCompetitors])

  // ===== SEARCH AND FILTERING =====
  const searchAndFilter = useCallback(async () => {
    try {
      const searchFilters: CompetitorSearchFilters = {
        ...filters,
        searchTerm: searchTerm.trim() || undefined
      }

      const results = await competitorDatabaseService.searchCompetitors(searchFilters)
      setFilteredCompetitors(results)
    } catch (error) {
      console.error('Error searching competitors:', error)
    }
  }, [searchTerm, filters])

  useEffect(() => {
    searchAndFilter()
  }, [searchAndFilter])

  // ===== SORTING =====
  const sortedCompetitors = useMemo(() => {
    const sorted = [...filteredCompetitors].sort((a, b) => {
      let aValue: any = a[sortBy]
      let bValue: any = b[sortBy]

      if (sortBy === 'name') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return sorted
  }, [filteredCompetitors, sortBy, sortOrder])

  // ===== EVENT HANDLERS =====
  const handleCompetitorView = useCallback((competitor: Competitor) => {
    setSelectedCompetitor(competitor)
    onCompetitorSelect?.(competitor)
  }, [onCompetitorSelect])

  const handleCompetitorEdit = useCallback((competitor: Competitor) => {
    // TODO: Open edit dialog
    console.log('Edit competitor:', competitor.id)
  }, [])

  const handleCompetitorDelete = useCallback(async (competitor: Competitor) => {
    if (window.confirm(`هل أنت متأكد من حذف المنافس "${competitor.name}"؟`)) {
      try {
        await competitorDatabaseService.deleteCompetitor(competitor.id)
        await loadCompetitors()
      } catch (error) {
        console.error('Error deleting competitor:', error)
      }
    }
  }, [loadCompetitors])

  const handleCompetitorAnalyze = useCallback((competitor: Competitor) => {
    // TODO: Open analysis dialog
    console.log('Analyze competitor:', competitor.id)
  }, [])

  const handleFiltersChange = useCallback((newFilters: CompetitorSearchFilters) => {
    setFilters(newFilters)
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilters({})
    setSearchTerm('')
  }, [])

  const handleExport = useCallback(async (format: 'json' | 'csv') => {
    try {
      const data = await competitorDatabaseService.exportCompetitors(format)
      const blob = new Blob([data], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `competitors.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting competitors:', error)
    }
  }, [])

  // ===== STATISTICS =====
  const statistics = useMemo(() => {
    const total = competitors.length
    const active = competitors.filter(c => c.status === 'active').length
    const avgMarketShare = competitors.length > 0 
      ? competitors.reduce((sum, c) => sum + c.marketShare, 0) / competitors.length 
      : 0
    const avgWinRate = competitors.length > 0 
      ? competitors.reduce((sum, c) => sum + c.winRate, 0) / competitors.length 
      : 0

    return { total, active, avgMarketShare, avgWinRate }
  }, [competitors])

  // ===== RENDER =====
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            قاعدة بيانات المنافسين
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            إدارة شاملة لمعلومات المنافسين والتحليل التنافسي
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            تصدير CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('json')}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            تصدير JSON
          </Button>
          <Button
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            إضافة منافس
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {showAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المنافسين</p>
                  <p className="text-2xl font-bold">{statistics.total}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">المنافسين النشطين</p>
                  <p className="text-2xl font-bold text-green-600">{statistics.active}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">متوسط الحصة السوقية</p>
                  <p className="text-2xl font-bold">{statistics.avgMarketShare.toFixed(1)}%</p>
                </div>
                <PieChart className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">متوسط معدل الفوز</p>
                  <p className="text-2xl font-bold">{statistics.avgWinRate.toFixed(1)}%</p>
                </div>
                <Target className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="البحث في المنافسين..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                فلترة
              </Button>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">الاسم</SelectItem>
                  <SelectItem value="marketShare">الحصة السوقية</SelectItem>
                  <SelectItem value="winRate">معدل الفوز</SelectItem>
                  <SelectItem value="lastUpdated">آخر تحديث</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={loadCompetitors}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t"
              >
                <FilterPanel
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onClearFilters={handleClearFilters}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Competitors List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : sortedCompetitors.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                لا توجد منافسين
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                ابدأ بإضافة معلومات المنافسين لبناء قاعدة بيانات شاملة
              </p>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة منافس جديد
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={`grid gap-4 ${compactMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}>
            {sortedCompetitors.map((competitor) => (
              <CompetitorCard
                key={competitor.id}
                competitor={competitor}
                onView={handleCompetitorView}
                onEdit={handleCompetitorEdit}
                onDelete={handleCompetitorDelete}
                onAnalyze={handleCompetitorAnalyze}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ===== COMPETITOR CARD COMPONENT =====

const CompetitorCard: React.FC<CompetitorCardProps> = ({
  competitor,
  onView,
  onEdit,
  onDelete,
  onAnalyze
}) => {
  const getStatusColor = (status: CompetitorStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      case 'monitoring': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'archived': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getTypeColor = (type: CompetitorType) => {
    switch (type) {
      case 'direct': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'indirect': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'potential': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'substitute': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getTypeLabel = (type: CompetitorType) => {
    const labels = {
      direct: 'منافس مباشر',
      indirect: 'منافس غير مباشر',
      potential: 'منافس محتمل',
      substitute: 'منافس بديل'
    }
    return labels[type]
  }

  const getStatusLabel = (status: CompetitorStatus) => {
    const labels = {
      active: 'نشط',
      inactive: 'غير نشط',
      monitoring: 'تحت المراقبة',
      archived: 'مؤرشف'
    }
    return labels[status]
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {competitor.name}
              </CardTitle>
              {competitor.nameEn && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {competitor.nameEn}
                </p>
              )}
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getTypeColor(competitor.type)}>
                  {getTypeLabel(competitor.type)}
                </Badge>
                <Badge className={getStatusColor(competitor.status)}>
                  {getStatusLabel(competitor.status)}
                </Badge>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(competitor)}>
                  <Eye className="h-4 w-4 mr-2" />
                  عرض التفاصيل
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAnalyze(competitor)}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  تحليل تنافسي
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(competitor)}>
                  <Edit className="h-4 w-4 mr-2" />
                  تعديل
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(competitor)}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  حذف
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Location */}
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="h-4 w-4" />
              <span>{competitor.headquarters}</span>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">الحصة السوقية</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {competitor.marketShare.toFixed(1)}%
                  </p>
                  <Progress value={competitor.marketShare} className="flex-1 h-2" />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">معدل الفوز</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {competitor.winRate.toFixed(1)}%
                  </p>
                  <Progress value={competitor.winRate} className="flex-1 h-2" />
                </div>
              </div>
            </div>

            {/* Specializations */}
            {competitor.specializations.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">التخصصات</p>
                <div className="flex flex-wrap gap-1">
                  {competitor.specializations.slice(0, 3).map((spec, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {spec}
                    </Badge>
                  ))}
                  {competitor.specializations.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{competitor.specializations.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Market Segments */}
            {competitor.marketSegments.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">القطاعات السوقية</p>
                <div className="flex flex-wrap gap-1">
                  {competitor.marketSegments.slice(0, 2).map((segment, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {segment === 'residential' && 'سكني'}
                      {segment === 'commercial' && 'تجاري'}
                      {segment === 'industrial' && 'صناعي'}
                      {segment === 'infrastructure' && 'بنية تحتية'}
                      {segment === 'government' && 'حكومي'}
                    </Badge>
                  ))}
                  {competitor.marketSegments.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{competitor.marketSegments.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Last Updated */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>آخر تحديث: {new Date(competitor.lastUpdated).toLocaleDateString('ar-SA')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${
                  competitor.confidenceLevel === 'high' ? 'bg-green-500' :
                  competitor.confidenceLevel === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span>
                  {competitor.confidenceLevel === 'high' && 'موثوق'}
                  {competitor.confidenceLevel === 'medium' && 'متوسط'}
                  {competitor.confidenceLevel === 'low' && 'ضعيف'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ===== FILTER PANEL COMPONENT =====

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  onClearFilters
}) => {
  const handleFilterChange = (key: keyof CompetitorSearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const competitorTypes: CompetitorType[] = ['direct', 'indirect', 'potential', 'substitute']
  const competitorStatuses: CompetitorStatus[] = ['active', 'inactive', 'monitoring', 'archived']
  const marketSegments: MarketSegment[] = ['residential', 'commercial', 'industrial', 'infrastructure', 'government']

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Competitor Type Filter */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            نوع المنافس
          </label>
          <div className="space-y-2">
            {competitorTypes.map((type) => (
              <div key={type} className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id={`type-${type}`}
                  checked={filters.type?.includes(type) || false}
                  onCheckedChange={(checked) => {
                    const currentTypes = filters.type || []
                    if (checked) {
                      handleFilterChange('type', [...currentTypes, type])
                    } else {
                      handleFilterChange('type', currentTypes.filter(t => t !== type))
                    }
                  }}
                />
                <label htmlFor={`type-${type}`} className="text-sm text-gray-600 dark:text-gray-400">
                  {type === 'direct' && 'منافس مباشر'}
                  {type === 'indirect' && 'منافس غير مباشر'}
                  {type === 'potential' && 'منافس محتمل'}
                  {type === 'substitute' && 'منافس بديل'}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            الحالة
          </label>
          <div className="space-y-2">
            {competitorStatuses.map((status) => (
              <div key={status} className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id={`status-${status}`}
                  checked={filters.status?.includes(status) || false}
                  onCheckedChange={(checked) => {
                    const currentStatuses = filters.status || []
                    if (checked) {
                      handleFilterChange('status', [...currentStatuses, status])
                    } else {
                      handleFilterChange('status', currentStatuses.filter(s => s !== status))
                    }
                  }}
                />
                <label htmlFor={`status-${status}`} className="text-sm text-gray-600 dark:text-gray-400">
                  {status === 'active' && 'نشط'}
                  {status === 'inactive' && 'غير نشط'}
                  {status === 'monitoring' && 'تحت المراقبة'}
                  {status === 'archived' && 'مؤرشف'}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Market Segments Filter */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            القطاعات السوقية
          </label>
          <div className="space-y-2">
            {marketSegments.map((segment) => (
              <div key={segment} className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id={`segment-${segment}`}
                  checked={filters.marketSegments?.includes(segment) || false}
                  onCheckedChange={(checked) => {
                    const currentSegments = filters.marketSegments || []
                    if (checked) {
                      handleFilterChange('marketSegments', [...currentSegments, segment])
                    } else {
                      handleFilterChange('marketSegments', currentSegments.filter(s => s !== segment))
                    }
                  }}
                />
                <label htmlFor={`segment-${segment}`} className="text-sm text-gray-600 dark:text-gray-400">
                  {segment === 'residential' && 'سكني'}
                  {segment === 'commercial' && 'تجاري'}
                  {segment === 'industrial' && 'صناعي'}
                  {segment === 'infrastructure' && 'بنية تحتية'}
                  {segment === 'government' && 'حكومي'}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Range Filters */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              نطاق الحصة السوقية (%)
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="من"
                min="0"
                max="100"
                value={filters.marketShareRange?.[0] || ''}
                onChange={(e) => {
                  const min = parseFloat(e.target.value) || 0
                  const max = filters.marketShareRange?.[1] || 100
                  handleFilterChange('marketShareRange', [min, max])
                }}
                className="w-20"
              />
              <span className="text-gray-500">-</span>
              <Input
                type="number"
                placeholder="إلى"
                min="0"
                max="100"
                value={filters.marketShareRange?.[1] || ''}
                onChange={(e) => {
                  const max = parseFloat(e.target.value) || 100
                  const min = filters.marketShareRange?.[0] || 0
                  handleFilterChange('marketShareRange', [min, max])
                }}
                className="w-20"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              نطاق معدل الفوز (%)
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="من"
                min="0"
                max="100"
                value={filters.winRateRange?.[0] || ''}
                onChange={(e) => {
                  const min = parseFloat(e.target.value) || 0
                  const max = filters.winRateRange?.[1] || 100
                  handleFilterChange('winRateRange', [min, max])
                }}
                className="w-20"
              />
              <span className="text-gray-500">-</span>
              <Input
                type="number"
                placeholder="إلى"
                min="0"
                max="100"
                value={filters.winRateRange?.[1] || ''}
                onChange={(e) => {
                  const max = parseFloat(e.target.value) || 100
                  const min = filters.winRateRange?.[0] || 0
                  handleFilterChange('winRateRange', [min, max])
                }}
                className="w-20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Clear Filters Button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          مسح جميع الفلاتر
        </Button>
      </div>
    </div>
  )
}


