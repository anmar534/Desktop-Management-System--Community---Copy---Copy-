/**
 * Risk Assessment Matrix Component
 * مكون مصفوفة تقييم المخاطر
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { riskManagementService } from '../../services/riskManagementService'
import type { Risk, RiskMatrix, RiskProbability, RiskImpact, RiskCategory } from '../../types/risk'

interface RiskAssessmentMatrixProps {
  projectId: string
  onRiskSelect?: (risk: Risk) => void
  className?: string
}

interface MatrixCell {
  probability: RiskProbability
  impact: RiskImpact
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  risks: Risk[]
}

const PROBABILITY_LABELS = {
  1: { en: 'Very Low', ar: 'منخفض جداً' },
  2: { en: 'Low', ar: 'منخفض' },
  3: { en: 'Medium', ar: 'متوسط' },
  4: { en: 'High', ar: 'عالي' },
  5: { en: 'Very High', ar: 'عالي جداً' }
} as const

const IMPACT_LABELS = {
  1: { en: 'Very Low', ar: 'منخفض جداً' },
  2: { en: 'Low', ar: 'منخفض' },
  3: { en: 'Medium', ar: 'متوسط' },
  4: { en: 'High', ar: 'عالي' },
  5: { en: 'Very High', ar: 'عالي جداً' }
} as const

const RISK_LEVEL_COLORS = {
  low: 'bg-green-100 border-green-300 text-green-800',
  medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  high: 'bg-orange-100 border-orange-300 text-orange-800',
  critical: 'bg-red-100 border-red-300 text-red-800'
}

const CATEGORY_COLORS = {
  technical: 'bg-blue-100 text-blue-800',
  financial: 'bg-green-100 text-green-800',
  schedule: 'bg-purple-100 text-purple-800',
  resource: 'bg-orange-100 text-orange-800',
  quality: 'bg-pink-100 text-pink-800',
  safety: 'bg-red-100 text-red-800',
  environmental: 'bg-teal-100 text-teal-800',
  regulatory: 'bg-indigo-100 text-indigo-800',
  external: 'bg-gray-100 text-gray-800',
  operational: 'bg-yellow-100 text-yellow-800'
}

export function RiskAssessmentMatrix({ projectId, onRiskSelect, className }: RiskAssessmentMatrixProps) {
  const [matrix, setMatrix] = useState<RiskMatrix | null>(null)
  const [risks, setRisks] = useState<Risk[]>([])
  const [filteredRisks, setFilteredRisks] = useState<Risk[]>([])
  const [selectedCategory, setSelectedCategory] = useState<RiskCategory | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [projectId])

  useEffect(() => {
    filterRisks()
  }, [risks, selectedCategory, searchTerm])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [matrixData, risksData] = await Promise.all([
        riskManagementService.getRiskMatrix(projectId),
        riskManagementService.getRisksByProject(projectId)
      ])

      setMatrix(matrixData)
      setRisks(risksData)
    } catch (err) {
      console.error('Error loading risk data:', err)
      setError('فشل في تحميل بيانات المخاطر')
    } finally {
      setLoading(false)
    }
  }

  const filterRisks = () => {
    let filtered = risks

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(risk => risk.category === selectedCategory)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(risk => 
        risk.title.toLowerCase().includes(term) ||
        risk.titleAr.toLowerCase().includes(term) ||
        risk.description.toLowerCase().includes(term) ||
        risk.descriptionAr.toLowerCase().includes(term)
      )
    }

    setFilteredRisks(filtered)
  }

  const createMatrixCells = (): MatrixCell[][] => {
    const cells: MatrixCell[][] = []

    // Create 5x5 matrix (probability x impact)
    for (let probability = 5; probability >= 1; probability--) {
      const row: MatrixCell[] = []
      for (let impact = 1; impact <= 5; impact++) {
        const riskScore = probability * impact
        const riskLevel = getRiskLevel(riskScore)
        const cellRisks = filteredRisks.filter(risk => 
          risk.probability === probability && risk.impact === impact
        )

        row.push({
          probability: probability as RiskProbability,
          impact: impact as RiskImpact,
          riskScore,
          riskLevel,
          risks: cellRisks
        })
      }
      cells.push(row)
    }

    return cells
  }

  const getRiskLevel = (score: number): 'low' | 'medium' | 'high' | 'critical' => {
    if (score <= 4) return 'low'
    if (score <= 9) return 'medium'
    if (score <= 16) return 'high'
    return 'critical'
  }

  const getRiskLevelLabel = (level: string) => {
    const labels = {
      low: { en: 'Low', ar: 'منخفض' },
      medium: { en: 'Medium', ar: 'متوسط' },
      high: { en: 'High', ar: 'عالي' },
      critical: { en: 'Critical', ar: 'حرج' }
    }
    return labels[level as keyof typeof labels] || { en: level, ar: level }
  }

  const handleCellClick = (cell: MatrixCell) => {
    if (cell.risks.length === 1 && onRiskSelect) {
      onRiskSelect(cell.risks[0])
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">جاري تحميل مصفوفة المخاطر...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">{error}</p>
            <Button onClick={loadData} variant="outline">
              إعادة المحاولة
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const matrixCells = createMatrixCells()

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* Header and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>مصفوفة تقييم المخاطر</span>
            <Badge variant="outline">
              {filteredRisks.length} مخاطر
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="البحث في المخاطر..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as RiskCategory | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="فئة المخاطر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات</SelectItem>
                  <SelectItem value="technical">تقني</SelectItem>
                  <SelectItem value="financial">مالي</SelectItem>
                  <SelectItem value="schedule">جدولة</SelectItem>
                  <SelectItem value="resource">موارد</SelectItem>
                  <SelectItem value="quality">جودة</SelectItem>
                  <SelectItem value="safety">سلامة</SelectItem>
                  <SelectItem value="environmental">بيئي</SelectItem>
                  <SelectItem value="regulatory">تنظيمي</SelectItem>
                  <SelectItem value="external">خارجي</SelectItem>
                  <SelectItem value="operational">تشغيلي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">مستوى المخاطر:</span>
              {Object.entries(RISK_LEVEL_COLORS).map(([level, colorClass]) => (
                <div key={level} className={`px-2 py-1 rounded text-xs border ${colorClass}`}>
                  {getRiskLevelLabel(level).ar}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Matrix */}
      <Card>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Matrix Table */}
              <div className="grid grid-cols-6 gap-1">
                {/* Header Row */}
                <div className="text-center font-medium p-2"></div>
                {[1, 2, 3, 4, 5].map(impact => (
                  <div key={impact} className="text-center font-medium p-2 bg-gray-50">
                    <div className="text-xs text-gray-600">التأثير</div>
                    <div className="text-sm">{IMPACT_LABELS[impact as RiskImpact].ar}</div>
                    <div className="text-xs text-gray-500">({impact})</div>
                  </div>
                ))}

                {/* Matrix Rows */}
                {matrixCells.map((row, rowIndex) => (
                  <React.Fragment key={rowIndex}>
                    {/* Probability Label */}
                    <div className="text-center font-medium p-2 bg-gray-50 flex flex-col justify-center">
                      <div className="text-xs text-gray-600">الاحتمالية</div>
                      <div className="text-sm">{PROBABILITY_LABELS[row[0].probability].ar}</div>
                      <div className="text-xs text-gray-500">({row[0].probability})</div>
                    </div>

                    {/* Matrix Cells */}
                    {row.map((cell, cellIndex) => (
                      <TooltipProvider key={cellIndex}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`
                                p-2 border-2 cursor-pointer transition-all hover:scale-105
                                ${RISK_LEVEL_COLORS[cell.riskLevel]}
                                ${cell.risks.length > 0 ? 'border-solid' : 'border-dashed opacity-50'}
                              `}
                              onClick={() => handleCellClick(cell)}
                            >
                              <div className="text-center">
                                <div className="text-lg font-bold">{cell.riskScore}</div>
                                <div className="text-xs">{getRiskLevelLabel(cell.riskLevel).ar}</div>
                                {cell.risks.length > 0 && (
                                  <div className="text-xs mt-1">
                                    {cell.risks.length} مخاطر
                                  </div>
                                )}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="space-y-2">
                              <div>
                                <strong>النقاط: {cell.riskScore}</strong> ({getRiskLevelLabel(cell.riskLevel).ar})
                              </div>
                              <div>
                                الاحتمالية: {PROBABILITY_LABELS[cell.probability].ar} ({cell.probability})
                              </div>
                              <div>
                                التأثير: {IMPACT_LABELS[cell.impact].ar} ({cell.impact})
                              </div>
                              {cell.risks.length > 0 && (
                                <div>
                                  <div className="font-medium">المخاطر:</div>
                                  {cell.risks.slice(0, 3).map(risk => (
                                    <div key={risk.id} className="text-xs">
                                      • {risk.titleAr}
                                    </div>
                                  ))}
                                  {cell.risks.length > 3 && (
                                    <div className="text-xs">و {cell.risks.length - 3} مخاطر أخرى...</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Summary */}
      <Card>
        <CardHeader>
          <CardTitle>ملخص المخاطر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(RISK_LEVEL_COLORS).map(([level, colorClass]) => {
              const count = filteredRisks.filter(risk => getRiskLevel(risk.riskScore) === level).length
              return (
                <div key={level} className={`p-3 rounded border ${colorClass}`}>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm">{getRiskLevelLabel(level).ar}</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
