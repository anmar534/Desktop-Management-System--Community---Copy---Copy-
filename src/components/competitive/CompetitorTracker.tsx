/**
 * Competitor Tracker Component for Phase 2 Implementation
 * 
 * This component provides comprehensive competitor tracking and management
 * capabilities including competitor profiles, activity monitoring, and
 * performance analysis for competitive intelligence.
 * 
 * @author Desktop Management System Team
 * @version 2.0.0
 * @since Phase 2 Implementation - Competitive Intelligence System
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import type { CompetitorData, MarketOpportunity } from '../../types/competitive'
import { competitiveService } from '../../services/competitiveService'
import { formatCurrency, formatPercentage } from '../../utils/analyticsUtils'

/**
 * Competitor Tracker Component Props
 */
export interface CompetitorTrackerProps {
  /** Initial competitor filter */
  initialFilter?: {
    region?: string
    category?: string
    status?: 'active' | 'inactive' | 'monitoring'
  }
  /** Whether to show detailed competitor profiles */
  showDetailedProfiles?: boolean
  /** Whether to show activity timeline */
  showActivityTimeline?: boolean
  /** Callback when competitor is selected */
  onCompetitorSelect?: (competitor: CompetitorData) => void
  /** Custom CSS classes */
  className?: string
}

/**
 * Competitor form data interface
 */
interface CompetitorFormData {
  name: string
  type: 'local' | 'international' | 'government' | 'private'
  region: string
  categories: string[]
  status: 'active' | 'inactive' | 'monitoring'
  contactInfo: {
    website?: string
    phone?: string
    email?: string
    address?: string
  }
  financialInfo: {
    estimatedRevenue?: number
    marketShare?: number
    employeeCount?: number
  }
  strengths: string[]
  weaknesses: string[]
  recentActivities: {
    date: string
    type: 'tender_win' | 'tender_loss' | 'new_project' | 'partnership' | 'expansion'
    description: string
    value?: number
  }[]
}

/**
 * Competitor Tracker Component
 */
export const CompetitorTracker: React.FC<CompetitorTrackerProps> = React.memo(({
  initialFilter,
  showDetailedProfiles = true,
  showActivityTimeline = true,
  onCompetitorSelect,
  className = ''
}) => {
  // State management
  const [competitors, setCompetitors] = useState<CompetitorData[]>([])
  const [filteredCompetitors, setFilteredCompetitors] = useState<CompetitorData[]>([])
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'activities' | 'analysis'>('overview')

  // Filter states
  const [regionFilter, setRegionFilter] = useState(initialFilter?.region || '')
  const [categoryFilter, setCategoryFilter] = useState(initialFilter?.category || '')
  const [statusFilter, setStatusFilter] = useState(initialFilter?.status || '')

  // Form state for adding/editing competitors
  const [formData, setFormData] = useState<CompetitorFormData>({
    name: '',
    type: 'private',
    region: '',
    categories: [],
    status: 'active',
    contactInfo: {},
    financialInfo: {},
    strengths: [],
    weaknesses: [],
    recentActivities: []
  })

  // Load competitors data
  const loadCompetitors = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await competitiveService.getAllCompetitors()
      setCompetitors(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل بيانات المنافسين')
      console.error('Error loading competitors:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Filter competitors based on search and filters
  const applyFilters = useCallback(() => {
    let filtered = competitors

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(competitor =>
        competitor.name.toLowerCase().includes(term) ||
        competitor.region.toLowerCase().includes(term) ||
        competitor.categories.some(cat => cat.toLowerCase().includes(term))
      )
    }

    // Apply region filter
    if (regionFilter) {
      filtered = filtered.filter(competitor => competitor.region === regionFilter)
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(competitor => 
        competitor.categories.includes(categoryFilter)
      )
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(competitor => competitor.status === statusFilter)
    }

    setFilteredCompetitors(filtered)
  }, [competitors, searchTerm, regionFilter, categoryFilter, statusFilter])

  // Load data on component mount
  useEffect(() => {
    loadCompetitors()
  }, [loadCompetitors])

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  // Handle competitor selection
  const handleCompetitorSelect = useCallback((competitor: CompetitorData) => {
    setSelectedCompetitor(competitor)
    onCompetitorSelect?.(competitor)
  }, [onCompetitorSelect])

  // Handle form submission
  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      const competitorData: Omit<CompetitorData, 'id' | 'createdAt' | 'updatedAt'> = {
        ...formData,
        lastUpdated: new Date().toISOString(),
        marketPosition: 'unknown',
        threatLevel: 'medium',
        opportunities: [],
        threats: []
      }

      await competitiveService.createCompetitor(competitorData)
      await loadCompetitors()
      setShowAddForm(false)
      setFormData({
        name: '',
        type: 'private',
        region: '',
        categories: [],
        status: 'active',
        contactInfo: {},
        financialInfo: {},
        strengths: [],
        weaknesses: [],
        recentActivities: []
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في إضافة المنافس')
    } finally {
      setLoading(false)
    }
  }, [formData, loadCompetitors])

  // Get unique values for filters
  const uniqueRegions = useMemo(() => 
    [...new Set(competitors.map(c => c.region))].filter(Boolean),
    [competitors]
  )

  const uniqueCategories = useMemo(() => 
    [...new Set(competitors.flatMap(c => c.categories))].filter(Boolean),
    [competitors]
  )

  // Calculate competitor statistics
  const competitorStats = useMemo(() => {
    const total = competitors.length
    const active = competitors.filter(c => c.status === 'active').length
    const highThreat = competitors.filter(c => c.threatLevel === 'high').length
    const avgMarketShare = competitors.reduce((sum, c) => 
      sum + (c.financialInfo?.marketShare || 0), 0) / total

    return { total, active, highThreat, avgMarketShare }
  }, [competitors])

  // Render loading state
  if (loading && competitors.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">تتبع المنافسين</h2>
            <p className="text-sm text-gray-600 mt-1">
              إدارة ومراقبة المنافسين وتحليل أنشطتهم في السوق
            </p>
          </div>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            إضافة منافس جديد
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{competitorStats.total}</div>
            <div className="text-sm text-blue-800">إجمالي المنافسين</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{competitorStats.active}</div>
            <div className="text-sm text-green-800">منافسين نشطين</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">{competitorStats.highThreat}</div>
            <div className="text-sm text-red-800">تهديد عالي</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {formatPercentage(competitorStats.avgMarketShare)}
            </div>
            <div className="text-sm text-purple-800">متوسط الحصة السوقية</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <input
            type="text"
            placeholder="البحث في المنافسين..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">جميع المناطق</option>
            {uniqueRegions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">جميع الفئات</option>
            {uniqueCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
            <option value="monitoring">تحت المراقبة</option>
          </select>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            نظرة عامة
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            الملف الشخصي
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'activities'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            الأنشطة
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'analysis'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            التحليل
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400">
          <div className="text-red-700">{error}</div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Competitors List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCompetitors.map(competitor => (
                <div
                  key={competitor.id}
                  onClick={() => handleCompetitorSelect(competitor)}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{competitor.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      competitor.status === 'active' ? 'bg-green-100 text-green-800' :
                      competitor.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {competitor.status === 'active' ? 'نشط' :
                       competitor.status === 'inactive' ? 'غير نشط' : 'تحت المراقبة'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>النوع: {competitor.type === 'local' ? 'محلي' : 
                                competitor.type === 'international' ? 'دولي' :
                                competitor.type === 'government' ? 'حكومي' : 'خاص'}</div>
                    <div>المنطقة: {competitor.region}</div>
                    <div>الفئات: {competitor.categories.join(', ')}</div>
                    {competitor.financialInfo?.marketShare && (
                      <div>الحصة السوقية: {formatPercentage(competitor.financialInfo.marketShare)}</div>
                    )}
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      competitor.threatLevel === 'high' ? 'bg-red-100 text-red-800' :
                      competitor.threatLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {competitor.threatLevel === 'high' ? 'تهديد عالي' :
                       competitor.threatLevel === 'medium' ? 'تهديد متوسط' : 'تهديد منخفض'}
                    </span>
                    
                    <div className="text-xs text-gray-500">
                      آخر تحديث: {new Date(competitor.lastUpdated).toLocaleDateString('ar-SA')}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredCompetitors.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                لا توجد منافسين مطابقين للمعايير المحددة
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && selectedCompetitor && (
          <div className="space-y-6">
            {/* Competitor Profile Details */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ملف {selectedCompetitor.name}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">المعلومات الأساسية</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">النوع:</span> {selectedCompetitor.type}</div>
                    <div><span className="font-medium">المنطقة:</span> {selectedCompetitor.region}</div>
                    <div><span className="font-medium">الفئات:</span> {selectedCompetitor.categories.join(', ')}</div>
                    <div><span className="font-medium">الحالة:</span> {selectedCompetitor.status}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">المعلومات المالية</h4>
                  <div className="space-y-2 text-sm">
                    {selectedCompetitor.financialInfo?.estimatedRevenue && (
                      <div><span className="font-medium">الإيرادات المقدرة:</span> {formatCurrency(selectedCompetitor.financialInfo.estimatedRevenue)}</div>
                    )}
                    {selectedCompetitor.financialInfo?.marketShare && (
                      <div><span className="font-medium">الحصة السوقية:</span> {formatPercentage(selectedCompetitor.financialInfo.marketShare)}</div>
                    )}
                    {selectedCompetitor.financialInfo?.employeeCount && (
                      <div><span className="font-medium">عدد الموظفين:</span> {selectedCompetitor.financialInfo.employeeCount}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Strengths and Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-3">نقاط القوة</h4>
                <ul className="space-y-1">
                  {selectedCompetitor.strengths.map((strength, index) => (
                    <li key={index} className="text-sm text-green-800 flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-red-50 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-3">نقاط الضعف</h4>
                <ul className="space-y-1">
                  {selectedCompetitor.weaknesses.map((weakness, index) => (
                    <li key={index} className="text-sm text-red-800 flex items-start">
                      <span className="text-red-600 mr-2">•</span>
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activities' && selectedCompetitor && showActivityTimeline && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">
              الأنشطة الأخيرة - {selectedCompetitor.name}
            </h3>
            
            <div className="space-y-4">
              {selectedCompetitor.recentActivities.map((activity, index) => (
                <div key={index} className="border-l-4 border-blue-200 pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{activity.description}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {activity.type === 'tender_win' ? 'فوز بمناقصة' :
                         activity.type === 'tender_loss' ? 'خسارة مناقصة' :
                         activity.type === 'new_project' ? 'مشروع جديد' :
                         activity.type === 'partnership' ? 'شراكة' : 'توسع'}
                      </div>
                      {activity.value && (
                        <div className="text-sm text-gray-600">
                          القيمة: {formatCurrency(activity.value)}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(activity.date).toLocaleDateString('ar-SA')}
                    </div>
                  </div>
                </div>
              ))}
              
              {selectedCompetitor.recentActivities.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  لا توجد أنشطة مسجلة لهذا المنافس
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analysis' && selectedCompetitor && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">
              تحليل المنافس - {selectedCompetitor.name}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">الفرص</h4>
                <ul className="space-y-1">
                  {selectedCompetitor.opportunities.map((opportunity, index) => (
                    <li key={index} className="text-sm text-blue-800 flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      {opportunity}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4">
                <h4 className="font-medium text-orange-900 mb-3">التهديدات</h4>
                <ul className="space-y-1">
                  {selectedCompetitor.threats.map((threat, index) => (
                    <li key={index} className="text-sm text-orange-800 flex items-start">
                      <span className="text-orange-600 mr-2">•</span>
                      {threat}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">الموقع في السوق</h4>
              <div className="text-sm text-gray-700">
                {selectedCompetitor.marketPosition === 'leader' ? 'رائد السوق' :
                 selectedCompetitor.marketPosition === 'challenger' ? 'منافس قوي' :
                 selectedCompetitor.marketPosition === 'follower' ? 'تابع' : 'غير محدد'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Competitor Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">إضافة منافس جديد</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    اسم المنافس *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    النوع *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="local">محلي</option>
                    <option value="international">دولي</option>
                    <option value="government">حكومي</option>
                    <option value="private">خاص</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    المنطقة *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.region}
                    onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الحالة
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                    <option value="monitoring">تحت المراقبة</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
})

CompetitorTracker.displayName = 'CompetitorTracker'

export default CompetitorTracker
