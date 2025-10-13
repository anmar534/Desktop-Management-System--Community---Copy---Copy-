/**
 * SWOT Analysis Component for Phase 2 Implementation
 * 
 * This component provides comprehensive SWOT (Strengths, Weaknesses, 
 * Opportunities, Threats) analysis capabilities for strategic planning
 * and competitive positioning in the construction bidding market.
 * 
 * @author Desktop Management System Team
 * @version 2.0.0
 * @since Phase 2 Implementation - Competitive Intelligence System
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import type { CompetitorData, MarketOpportunity } from '../../types/competitive'
import type { BidPerformance } from '../../types/analytics'
import { competitiveService } from '../../services/competitiveService'
import { analyticsService } from '../../services/analyticsService'

/**
 * SWOT Analysis Component Props
 */
export interface SWOTAnalysisProps {
  /** Target entity for SWOT analysis */
  target?: 'company' | 'competitor' | 'market'
  /** Competitor ID if analyzing a specific competitor */
  competitorId?: string
  /** Whether to show detailed analysis */
  showDetailedAnalysis?: boolean
  /** Whether to allow editing SWOT items */
  allowEditing?: boolean
  /** Callback when SWOT analysis is updated */
  onAnalysisUpdate?: (analysis: SWOTData) => void
  /** Custom CSS classes */
  className?: string
}

/**
 * SWOT data structure
 */
export interface SWOTData {
  id: string
  title: string
  target: 'company' | 'competitor' | 'market'
  targetId?: string
  strengths: SWOTItem[]
  weaknesses: SWOTItem[]
  opportunities: SWOTItem[]
  threats: SWOTItem[]
  analysis: {
    strategicRecommendations: string[]
    priorityActions: string[]
    riskMitigation: string[]
    competitiveAdvantages: string[]
  }
  createdAt: string
  updatedAt: string
  createdBy: string
}

/**
 * Individual SWOT item
 */
export interface SWOTItem {
  id: string
  text: string
  impact: 'high' | 'medium' | 'low'
  urgency: 'high' | 'medium' | 'low'
  category: string
  evidence?: string[]
  metrics?: {
    value: number
    unit: string
    trend: 'improving' | 'stable' | 'declining'
  }
  actionItems?: string[]
}

/**
 * SWOT Analysis Component
 */
export const SWOTAnalysis: React.FC<SWOTAnalysisProps> = React.memo(({
  target = 'company',
  competitorId,
  showDetailedAnalysis = true,
  allowEditing = true,
  onAnalysisUpdate,
  className = ''
}) => {
  // State management
  const [swotData, setSWOTData] = useState<SWOTData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<{
    category: 'strengths' | 'weaknesses' | 'opportunities' | 'threats'
    index: number
  } | null>(null)
  const [newItemText, setNewItemText] = useState('')
  const [activeQuadrant, setActiveQuadrant] = useState<'strengths' | 'weaknesses' | 'opportunities' | 'threats'>('strengths')
  const [showAddForm, setShowAddForm] = useState(false)

  // Form state for new SWOT items
  const [newItem, setNewItem] = useState<Partial<SWOTItem>>({
    text: '',
    impact: 'medium',
    urgency: 'medium',
    category: '',
    evidence: [],
    actionItems: []
  })

  // Load SWOT analysis data
  const loadSWOTData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // In a real implementation, this would load from a SWOT service
      // For now, we'll generate sample data based on the target
      const sampleSWOT: SWOTData = {
        id: `swot_${target}_${competitorId || 'company'}`,
        title: target === 'company' ? 'تحليل SWOT للشركة' : 
               target === 'competitor' ? 'تحليل SWOT للمنافس' : 'تحليل SWOT للسوق',
        target,
        targetId: competitorId,
        strengths: [
          {
            id: 's1',
            text: 'فريق هندسي متخصص وذو خبرة عالية',
            impact: 'high',
            urgency: 'medium',
            category: 'الموارد البشرية',
            evidence: ['شهادات مهنية', 'مشاريع سابقة ناجحة'],
            metrics: { value: 85, unit: '%', trend: 'improving' },
            actionItems: ['الاستثمار في التدريب المستمر', 'جذب المواهب الجديدة']
          },
          {
            id: 's2',
            text: 'سمعة ممتازة في السوق المحلي',
            impact: 'high',
            urgency: 'low',
            category: 'العلامة التجارية',
            evidence: ['تقييمات العملاء', 'معدل تكرار العمل'],
            metrics: { value: 92, unit: '%', trend: 'stable' }
          },
          {
            id: 's3',
            text: 'نظام إدارة مشاريع متقدم',
            impact: 'medium',
            urgency: 'low',
            category: 'التكنولوجيا',
            evidence: ['كفاءة التسليم', 'رضا العملاء']
          }
        ],
        weaknesses: [
          {
            id: 'w1',
            text: 'قدرة مالية محدودة للمشاريع الكبيرة',
            impact: 'high',
            urgency: 'high',
            category: 'المالية',
            evidence: ['تقارير مالية', 'حدود الائتمان'],
            actionItems: ['البحث عن شراكات', 'تحسين التدفق النقدي']
          },
          {
            id: 'w2',
            text: 'اعتماد كبير على السوق المحلي',
            impact: 'medium',
            urgency: 'medium',
            category: 'التنويع',
            evidence: ['توزيع الإيرادات الجغرافي'],
            actionItems: ['استكشاف أسواق جديدة', 'تطوير قدرات دولية']
          }
        ],
        opportunities: [
          {
            id: 'o1',
            text: 'مشاريع رؤية 2030 الضخمة',
            impact: 'high',
            urgency: 'high',
            category: 'السوق',
            evidence: ['إعلانات حكومية', 'خطط التنمية'],
            metrics: { value: 500, unit: 'مليار ريال', trend: 'improving' }
          },
          {
            id: 'o2',
            text: 'التحول الرقمي في قطاع البناء',
            impact: 'medium',
            urgency: 'medium',
            category: 'التكنولوجيا',
            evidence: ['اتجاهات السوق', 'طلب العملاء']
          }
        ],
        threats: [
          {
            id: 't1',
            text: 'دخول شركات دولية كبيرة للسوق',
            impact: 'high',
            urgency: 'high',
            category: 'المنافسة',
            evidence: ['إعلانات الشركات', 'تحليل السوق'],
            actionItems: ['تعزيز الميزة التنافسية', 'تطوير الخدمات المتخصصة']
          },
          {
            id: 't2',
            text: 'تقلبات أسعار المواد الخام',
            impact: 'medium',
            urgency: 'medium',
            category: 'الاقتصاد',
            evidence: ['تقارير السوق', 'تحليل الأسعار']
          }
        ],
        analysis: {
          strategicRecommendations: [
            'الاستفادة من السمعة الممتازة لدخول مشاريع رؤية 2030',
            'تطوير شراكات استراتيجية لتعزيز القدرة المالية',
            'الاستثمار في التكنولوجيا للتميز عن المنافسين'
          ],
          priorityActions: [
            'تأمين تمويل إضافي للمشاريع الكبيرة',
            'تطوير فريق التطوير التجاري',
            'إنشاء قسم للابتكار والتكنولوجيا'
          ],
          riskMitigation: [
            'تنويع مصادر التمويل',
            'بناء علاقات قوية مع الموردين',
            'تطوير خطط طوارئ للمخاطر المالية'
          ],
          competitiveAdvantages: [
            'الخبرة المحلية العميقة',
            'المرونة في التعامل مع العملاء',
            'السرعة في اتخاذ القرارات'
          ]
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'current_user'
      }

      setSWOTData(sampleSWOT)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل تحليل SWOT')
      console.error('Error loading SWOT data:', err)
    } finally {
      setLoading(false)
    }
  }, [target, competitorId])

  // Load data on component mount
  useEffect(() => {
    loadSWOTData()
  }, [loadSWOTData])

  // Handle adding new SWOT item
  const handleAddItem = useCallback(async () => {
    if (!swotData || !newItem.text) return

    try {
      const item: SWOTItem = {
        id: `${activeQuadrant}_${Date.now()}`,
        text: newItem.text,
        impact: newItem.impact || 'medium',
        urgency: newItem.urgency || 'medium',
        category: newItem.category || '',
        evidence: newItem.evidence || [],
        actionItems: newItem.actionItems || []
      }

      const updatedSWOT = {
        ...swotData,
        [activeQuadrant]: [...swotData[activeQuadrant], item],
        updatedAt: new Date().toISOString()
      }

      setSWOTData(updatedSWOT)
      onAnalysisUpdate?.(updatedSWOT)
      
      // Reset form
      setNewItem({
        text: '',
        impact: 'medium',
        urgency: 'medium',
        category: '',
        evidence: [],
        actionItems: []
      })
      setShowAddForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في إضافة العنصر')
    }
  }, [swotData, newItem, activeQuadrant, onAnalysisUpdate])

  // Handle deleting SWOT item
  const handleDeleteItem = useCallback(async (category: keyof Pick<SWOTData, 'strengths' | 'weaknesses' | 'opportunities' | 'threats'>, itemId: string) => {
    if (!swotData) return

    try {
      const updatedSWOT = {
        ...swotData,
        [category]: swotData[category].filter(item => item.id !== itemId),
        updatedAt: new Date().toISOString()
      }

      setSWOTData(updatedSWOT)
      onAnalysisUpdate?.(updatedSWOT)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في حذف العنصر')
    }
  }, [swotData, onAnalysisUpdate])

  // Get quadrant color classes
  const getQuadrantColors = useCallback((quadrant: string) => {
    switch (quadrant) {
      case 'strengths':
        return 'bg-green-50 border-green-200 text-green-900'
      case 'weaknesses':
        return 'bg-red-50 border-red-200 text-red-900'
      case 'opportunities':
        return 'bg-blue-50 border-blue-200 text-blue-900'
      case 'threats':
        return 'bg-orange-50 border-orange-200 text-orange-900'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900'
    }
  }, [])

  // Get impact/urgency color
  const getImpactColor = useCallback((level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
    }
  }, [])

  // Render loading state
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!swotData) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center text-gray-500">
          لا توجد بيانات تحليل SWOT متاحة
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
            <h2 className="text-xl font-bold text-gray-900">{swotData.title}</h2>
            <p className="text-sm text-gray-600 mt-1">
              تحليل نقاط القوة والضعف والفرص والتهديدات
            </p>
          </div>
          
          {allowEditing && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              إضافة عنصر جديد
            </button>
          )}
        </div>

        {/* Quadrant Selector */}
        <div className="flex space-x-1 mt-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveQuadrant('strengths')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeQuadrant === 'strengths'
                ? 'bg-green-100 text-green-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            نقاط القوة ({swotData.strengths.length})
          </button>
          <button
            onClick={() => setActiveQuadrant('weaknesses')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeQuadrant === 'weaknesses'
                ? 'bg-red-100 text-red-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            نقاط الضعف ({swotData.weaknesses.length})
          </button>
          <button
            onClick={() => setActiveQuadrant('opportunities')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeQuadrant === 'opportunities'
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            الفرص ({swotData.opportunities.length})
          </button>
          <button
            onClick={() => setActiveQuadrant('threats')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeQuadrant === 'threats'
                ? 'bg-orange-100 text-orange-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            التهديدات ({swotData.threats.length})
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400">
          <div className="text-red-700">{error}</div>
        </div>
      )}

      {/* SWOT Matrix */}
      <div className="p-6">
        {!showDetailedAnalysis ? (
          /* Compact Matrix View */
          <div className="grid grid-cols-2 gap-6">
            {/* Strengths */}
            <div className={`rounded-lg border-2 p-4 ${getQuadrantColors('strengths')}`}>
              <h3 className="font-bold text-lg mb-3">نقاط القوة</h3>
              <div className="space-y-2">
                {swotData.strengths.map(item => (
                  <div key={item.id} className="text-sm">
                    • {item.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Weaknesses */}
            <div className={`rounded-lg border-2 p-4 ${getQuadrantColors('weaknesses')}`}>
              <h3 className="font-bold text-lg mb-3">نقاط الضعف</h3>
              <div className="space-y-2">
                {swotData.weaknesses.map(item => (
                  <div key={item.id} className="text-sm">
                    • {item.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Opportunities */}
            <div className={`rounded-lg border-2 p-4 ${getQuadrantColors('opportunities')}`}>
              <h3 className="font-bold text-lg mb-3">الفرص</h3>
              <div className="space-y-2">
                {swotData.opportunities.map(item => (
                  <div key={item.id} className="text-sm">
                    • {item.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Threats */}
            <div className={`rounded-lg border-2 p-4 ${getQuadrantColors('threats')}`}>
              <h3 className="font-bold text-lg mb-3">التهديدات</h3>
              <div className="space-y-2">
                {swotData.threats.map(item => (
                  <div key={item.id} className="text-sm">
                    • {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Detailed Analysis View */
          <div className="space-y-6">
            {/* Active Quadrant Details */}
            <div className={`rounded-lg border-2 p-6 ${getQuadrantColors(activeQuadrant)}`}>
              <h3 className="font-bold text-lg mb-4">
                {activeQuadrant === 'strengths' ? 'نقاط القوة' :
                 activeQuadrant === 'weaknesses' ? 'نقاط الضعف' :
                 activeQuadrant === 'opportunities' ? 'الفرص' : 'التهديدات'}
              </h3>
              
              <div className="space-y-4">
                {swotData[activeQuadrant].map((item, index) => (
                  <div key={item.id} className="bg-white bg-opacity-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{item.text}</h4>
                      {allowEditing && (
                        <button
                          onClick={() => handleDeleteItem(activeQuadrant, item.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(item.impact)}`}>
                        التأثير: {item.impact === 'high' ? 'عالي' : item.impact === 'medium' ? 'متوسط' : 'منخفض'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(item.urgency)}`}>
                        الأولوية: {item.urgency === 'high' ? 'عالية' : item.urgency === 'medium' ? 'متوسطة' : 'منخفضة'}
                      </span>
                      {item.category && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          {item.category}
                        </span>
                      )}
                    </div>

                    {item.evidence && item.evidence.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-sm font-medium mb-1">الأدلة:</h5>
                        <ul className="text-sm space-y-1">
                          {item.evidence.map((evidence, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="mr-2">•</span>
                              {evidence}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {item.metrics && (
                      <div className="mb-3">
                        <div className="text-sm">
                          <span className="font-medium">المقياس:</span> {item.metrics.value} {item.metrics.unit}
                          <span className={`ml-2 ${
                            item.metrics.trend === 'improving' ? 'text-green-600' :
                            item.metrics.trend === 'declining' ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            ({item.metrics.trend === 'improving' ? 'متحسن' :
                              item.metrics.trend === 'declining' ? 'متراجع' : 'مستقر'})
                          </span>
                        </div>
                      </div>
                    )}

                    {item.actionItems && item.actionItems.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium mb-1">إجراءات مقترحة:</h5>
                        <ul className="text-sm space-y-1">
                          {item.actionItems.map((action, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="mr-2">→</span>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Strategic Analysis */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-bold text-lg mb-4">التحليل الاستراتيجي</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">التوصيات الاستراتيجية</h4>
                  <ul className="space-y-1 text-sm">
                    {swotData.analysis.strategicRecommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">الإجراءات ذات الأولوية</h4>
                  <ul className="space-y-1 text-sm">
                    {swotData.analysis.priorityActions.map((action, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-600 mr-2">•</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">تخفيف المخاطر</h4>
                  <ul className="space-y-1 text-sm">
                    {swotData.analysis.riskMitigation.map((risk, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-orange-600 mr-2">•</span>
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">المزايا التنافسية</h4>
                  <ul className="space-y-1 text-sm">
                    {swotData.analysis.competitiveAdvantages.map((advantage, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-purple-600 mr-2">•</span>
                        {advantage}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddForm && allowEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                إضافة عنصر جديد - {
                  activeQuadrant === 'strengths' ? 'نقاط القوة' :
                  activeQuadrant === 'weaknesses' ? 'نقاط الضعف' :
                  activeQuadrant === 'opportunities' ? 'الفرص' : 'التهديدات'
                }
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  النص *
                </label>
                <textarea
                  value={newItem.text}
                  onChange={(e) => setNewItem(prev => ({ ...prev, text: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="اكتب وصف العنصر..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    التأثير
                  </label>
                  <select
                    value={newItem.impact}
                    onChange={(e) => setNewItem(prev => ({ ...prev, impact: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">منخفض</option>
                    <option value="medium">متوسط</option>
                    <option value="high">عالي</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الأولوية
                  </label>
                  <select
                    value={newItem.urgency}
                    onChange={(e) => setNewItem(prev => ({ ...prev, urgency: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">منخفضة</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">عالية</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الفئة
                </label>
                <input
                  type="text"
                  value={newItem.category}
                  onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="مثل: التكنولوجيا، المالية، الموارد البشرية..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddItem}
                disabled={!newItem.text}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                إضافة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

SWOTAnalysis.displayName = 'SWOTAnalysis'

export default SWOTAnalysis
