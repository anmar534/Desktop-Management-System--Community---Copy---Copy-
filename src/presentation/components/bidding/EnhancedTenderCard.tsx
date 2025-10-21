/**
 * @fileoverview Enhanced Tender Card Component
 * @description Advanced tender card component with enhanced features including win chance indicators,
 * urgency badges, progress tracking, and improved visual design for the bidding system.
 *
 * @author Desktop Management System Team
 * @version 1.0.0
 * @since Phase 1 Implementation
 */

import { memo, useCallback, useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  DollarSign,
  User,
  Building2,
  FileText,
  AlertTriangle,
  AlertCircle,
  RotateCw,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Target,
  Brain,
  Zap,
  Users,
  BarChart3,
  TrendingDown
} from 'lucide-react'

import { Card, CardContent } from '../ui/card'
import { Progress } from '../ui/progress'
import { StatusBadge } from '../ui/status-badge'
import { InlineAlert } from '../ui/inline-alert'
import { EntityActions } from '../ui/ActionButtons'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import type { Tender } from '@/data/centralData'
import { useTenderStatus } from '@/application/hooks/useTenderStatus'
import { calculateTenderProgress } from '@/shared/utils/tender/tenderProgressCalculator'
import {
  formatTenderName,
  formatTenderClient,
  formatTenderDate,
  formatTenderType
} from '@/shared/utils/formatters/formatters'
import type { CurrencyOptions } from '@/shared/utils/formatters/formatters'
import { predictWinProbability } from '@/shared/utils/ml/predictionModels'
import { optimizeBidAmount } from '@/shared/utils/pricing/priceOptimization'
import { analyticsService } from '@/application/services/analyticsService'
import { competitiveService } from '@/application/services/competitiveService'
import type { BidPerformance, CompetitorData } from '@/shared/types/analytics'

// Helper function to get tender document price
const parseNumericValue = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = Number.parseFloat(String(value))
  return Number.isFinite(parsed) ? parsed : 0
}

const getTenderDocumentPrice = (tender: Tender): number => {
  const price = parseNumericValue(tender.documentPrice)
  return price > 0 ? price : parseNumericValue(tender.bookletPrice)
}

/**
 * Props interface for the Enhanced Tender Card component
 *
 * @interface EnhancedTenderCardProps
 * @description Defines the properties required for the enhanced tender card component
 */
interface EnhancedTenderCardProps {
  /** The tender object containing all tender information */
  tender: Tender
  /** The index of the tender in the list for animation purposes */
  index: number
  /** Callback function to open tender details */
  onOpenDetails: (tender: Tender) => void
  /** Callback function to start the pricing process */
  onStartPricing: (tender: Tender) => void
  /** Callback function to submit the tender */
  onSubmitTender: (tender: Tender) => void
  /** Callback function to edit the tender */
  onEdit: (tender: Tender) => void
  /** Callback function to delete the tender */
  onDelete: (tender: Tender) => void
  /** Optional callback function to open tender results */
  onOpenResults?: (tender: Tender) => void
  /** Optional callback function to revert tender status */
  onRevertStatus?: (tender: Tender, newStatus: Tender['status']) => void
  /** Function to format currency values with proper localization */
  formatCurrencyValue: (amount: number | string | null | undefined, options?: CurrencyOptions) => string
  /** Optional flag to enable predictive analytics features */
  enablePredictiveAnalytics?: boolean
  /** Optional callback for viewing predictive analytics */
  onViewAnalytics?: (tender: Tender) => void
}

/**
 * Enhanced Tender Card Component
 *
 * @component
 * @description A sophisticated tender card component that displays tender information with enhanced features:
 * - Win chance indicators and progress tracking
 * - Urgency badges and status indicators
 * - Improved visual design with animations
 * - Comprehensive action buttons
 * - Currency formatting and localization support
 * - Responsive design for different screen sizes
 *
 * @param {EnhancedTenderCardProps} props - The component props
 * @returns {JSX.Element} The rendered enhanced tender card
 *
 * @example
 * ```tsx
 * <EnhancedTenderCard
 *   tender={tenderData}
 *   index={0}
 *   onOpenDetails={handleOpenDetails}
 *   onStartPricing={handleStartPricing}
 *   onSubmitTender={handleSubmitTender}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   formatCurrencyValue={formatCurrency}
 * />
 * ```
 */
const EnhancedTenderCard = memo<EnhancedTenderCardProps>(({
  tender,
  index,
  onOpenDetails,
  onStartPricing,
  onSubmitTender,
  onEdit,
  onDelete,
  onOpenResults,
  onRevertStatus,
  formatCurrencyValue,
  enablePredictiveAnalytics = false,
  onViewAnalytics
}) => {
  const {
    statusInfo,
    urgencyInfo,
    completionInfo,
    shouldShowSubmitButton,
    shouldShowPricingButton
  } = useTenderStatus(tender)

  // Predictive analytics state
  const [predictiveData, setPredictiveData] = useState<{
    winProbability: number | null
    confidence: number | null
    recommendedBid: number | null
    riskLevel: 'low' | 'medium' | 'high' | null
    competitorCount: number
    marketTrend: 'up' | 'down' | 'stable' | null
    loading: boolean
  }>({
    winProbability: null,
    confidence: null,
    recommendedBid: null,
    riskLevel: null,
    competitorCount: 0,
    marketTrend: null,
    loading: false
  })

  // Load predictive analytics data
  useEffect(() => {
    if (!enablePredictiveAnalytics) return

    const loadPredictiveData = async () => {
      setPredictiveData(prev => ({ ...prev, loading: true }))

      try {
        // Load historical performance data
        const historicalPerformances = await analyticsService.getAllBidPerformances({
          filters: {
            categories: [tender.category],
            regions: [tender.location]
          }
        })

        // Load competitor data
        const competitors = await competitiveService.getAllCompetitors({
          categories: [tender.category],
          regions: [tender.location]
        })

        // Map tender data to prediction format
        const tenderData = {
          estimatedValue: tender.value,
          category: tender.category,
          region: tender.location,
          competitorCount: tender.competitors?.length || 3,
          clientType: tender.client.includes('حكوم') || tender.client.includes('وزارة') ? 'government' : 'private',
          deadline: tender.deadline
        }

        // Generate win probability prediction
        const winPrediction = predictWinProbability(
          tender.value,
          tender.value,
          tenderData.competitorCount,
          tenderData.category,
          tenderData.region,
          tenderData.clientType,
          historicalPerformances,
          competitors
        )

        // Generate price optimization
        const priceOptimization = optimizeBidAmount(
          tender.value,
          tenderData.category,
          tenderData.region,
          tenderData.competitorCount,
          tenderData.clientType,
          historicalPerformances,
          competitors,
          {
            minMargin: 10,
            maxMargin: 25,
            targetWinProbability: 60,
            riskTolerance: 'medium',
            objective: 'balanced',
            marketConditions: 'neutral'
          }
        )

        // Determine market trend based on recent opportunities
        const marketOpportunities = await competitiveService.getMarketOpportunities()
        const recentOpportunities = marketOpportunities.filter(o =>
          o.category === tenderData.category &&
          o.region === tenderData.region &&
          new Date(o.createdAt) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
        )

        const marketTrend = recentOpportunities.length > 5 ? 'up' :
                           recentOpportunities.length < 2 ? 'down' : 'stable'

        setPredictiveData({
          winProbability: Math.round(winPrediction.probability),
          confidence: Math.round(winPrediction.confidence),
          recommendedBid: priceOptimization.recommendedBid,
          riskLevel: priceOptimization.riskLevel,
          competitorCount: tenderData.competitorCount,
          marketTrend,
          loading: false
        })
      } catch (error) {
        console.error('Error loading predictive data:', error)
        setPredictiveData(prev => ({ ...prev, loading: false }))
      }
    }

    loadPredictiveData()
  }, [enablePredictiveAnalytics, tender.id, tender.category, tender.location, tender.value])

  // Event handlers
  const handleOpenDetails = useCallback(() => {
    onOpenDetails(tender)
  }, [onOpenDetails, tender])

  const handleStartPricing = useCallback(() => {
    onStartPricing(tender)
  }, [onStartPricing, tender])

  const handleSubmitTender = useCallback(() => {
    onSubmitTender(tender)
  }, [onSubmitTender, tender])

  const handleEdit = useCallback(() => {
    onEdit(tender)
  }, [onEdit, tender])

  const handleDelete = useCallback(() => {
    onDelete(tender)
  }, [onDelete, tender])

  // Calculated values
  const documentPrice = getTenderDocumentPrice(tender)
  const contractValue = typeof tender.totalValue === 'number' && Number.isFinite(tender.totalValue)
    ? tender.totalValue
    : typeof tender.value === 'number' && Number.isFinite(tender.value)
      ? tender.value
      : 0

  const progress = calculateTenderProgress(tender)

  // Revert configuration
  const revertConfig = useMemo(() => {
    if (tender.status === 'submitted') {
      return {
        targetStatus: 'ready_to_submit' as const,
        label: 'عودة للإرسال',
        title: 'عودة للإرسال'
      }
    }

    if (tender.status === 'won' || tender.status === 'lost') {
      return {
        targetStatus: 'submitted' as const,
        label: 'عودة للنتائج',
        title: 'عودة للنتائج'
      }
    }

    if (
      tender.status === 'ready_to_submit' ||
      (tender.status === 'under_action' && shouldShowSubmitButton)
    ) {
      return {
        targetStatus: 'under_action' as const,
        label: 'عودة للتسعير',
        title: 'عودة للتسعير'
      }
    }

    return null
  }, [shouldShowSubmitButton, tender.status])

  const handleRevertClick = useCallback(() => {
    if (revertConfig && onRevertStatus) {
      onRevertStatus(tender, revertConfig.targetStatus)
    }
  }, [onRevertStatus, revertConfig, tender])

  // Enhanced status indicators
  const getStatusIcon = () => {
    switch (tender.status) {
      case 'won':
        return <CheckCircle2 className="h-4 w-4 text-success" />
      case 'lost':
        return <XCircle className="h-4 w-4 text-destructive" />
      case 'submitted':
        return <Clock className="h-4 w-4 text-warning" />
      case 'ready_to_submit':
        return <Target className="h-4 w-4 text-primary" />
      default:
        return <TrendingUp className="h-4 w-4 text-muted-foreground" />
    }
  }

  // Enhanced card styling based on status
  const getCardClassName = () => {
    const baseClasses = "bg-card border shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer"
    
    switch (tender.status) {
      case 'won':
        return `${baseClasses} border-success/40 bg-success/5 hover:bg-success/10`
      case 'lost':
        return `${baseClasses} border-destructive/30 bg-destructive/5 hover:bg-destructive/10`
      case 'ready_to_submit':
        return `${baseClasses} border-primary/30 bg-primary/5 hover:bg-primary/10`
      case 'submitted':
        return `${baseClasses} border-warning/30 bg-warning/5 hover:bg-warning/10`
      default:
        return `${baseClasses} hover:border-primary/20`
    }
  }

  // Win chance indicator
  const getWinChanceColor = (chance: number) => {
    if (chance >= 70) return 'text-success'
    if (chance >= 40) return 'text-warning'
    return 'text-destructive'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -2 }}
    >
      <Card className={getCardClassName()}>
        <CardContent className="p-5">
          {/* Header Section */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon()}
                <h3 
                  className="font-semibold text-card-foreground group-hover:text-primary transition-colors underline-offset-2 hover:underline cursor-pointer truncate"
                  onClick={handleOpenDetails}
                  title={formatTenderName(tender.name)}
                >
                  {formatTenderName(tender.name)}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <User className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{formatTenderClient(tender.client)}</span>
              </div>
              {/* Enhanced Win Probability with Predictive Analytics */}
              {enablePredictiveAnalytics && predictiveData.loading ? (
                <div className="flex items-center gap-2 text-sm">
                  <Brain className="h-4 w-4 flex-shrink-0 text-primary animate-pulse" />
                  <span className="text-muted-foreground">جاري تحليل البيانات...</span>
                </div>
              ) : enablePredictiveAnalytics && predictiveData.winProbability !== null ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Brain className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span className="text-muted-foreground">احتمالية الفوز (AI):</span>
                    <span className={`font-medium ${getWinChanceColor(predictiveData.winProbability)}`}>
                      {predictiveData.winProbability}%
                    </span>
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      ثقة {predictiveData.confidence}%
                    </Badge>
                  </div>

                  {/* Additional Predictive Insights */}
                  <div className="flex items-center gap-4 text-xs">
                    {predictiveData.riskLevel && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className={`h-3 w-3 ${
                          predictiveData.riskLevel === 'high' ? 'text-destructive' :
                          predictiveData.riskLevel === 'medium' ? 'text-warning' : 'text-success'
                        }`} />
                        <span className="text-muted-foreground">
                          مخاطر {predictiveData.riskLevel === 'high' ? 'عالية' :
                                 predictiveData.riskLevel === 'medium' ? 'متوسطة' : 'منخفضة'}
                        </span>
                      </div>
                    )}

                    {predictiveData.marketTrend && (
                      <div className="flex items-center gap-1">
                        {predictiveData.marketTrend === 'up' ? (
                          <TrendingUp className="h-3 w-3 text-success" />
                        ) : predictiveData.marketTrend === 'down' ? (
                          <TrendingDown className="h-3 w-3 text-destructive" />
                        ) : (
                          <BarChart3 className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className="text-muted-foreground">
                          السوق {predictiveData.marketTrend === 'up' ? 'نامي' :
                                 predictiveData.marketTrend === 'down' ? 'متراجع' : 'مستقر'}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{predictiveData.competitorCount} منافسين</span>
                    </div>
                  </div>
                </div>
              ) : tender.winChance > 0 ? (
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">فرصة الفوز:</span>
                  <span className={`font-medium ${getWinChanceColor(tender.winChance)}`}>
                    {tender.winChance}%
                  </span>
                </div>
              ) : null}
            </div>
            
            {/* Status Badges */}
            <div className="flex flex-col items-end gap-2 ml-4">
              <StatusBadge
                status={statusInfo.badgeStatus}
                label={statusInfo.text}
                size="sm"
                className="shadow-none"
              />
              {completionInfo.isReadyToSubmit && !['submitted', 'won', 'lost'].includes(tender.status) && (
                <StatusBadge
                  status="success"
                  label="جاهزة للإرسال"
                  size="sm"
                  className="shadow-none"
                />
              )}
              {completionInfo.isPricingCompleted && !completionInfo.isTechnicalFilesUploaded && !['submitted', 'won', 'lost'].includes(tender.status) && (
                <StatusBadge
                  status="warning"
                  label="يحتاج ملفات فنية"
                  size="sm"
                  className="shadow-none"
                />
              )}
              <StatusBadge
                status={urgencyInfo.badgeStatus}
                label={urgencyInfo.text}
                size="sm"
                className="shadow-none"
              />
            </div>
          </div>

          {/* Alert Messages */}
          {urgencyInfo.badgeStatus === 'overdue' && (
            <InlineAlert
              variant="destructive"
              icon={<AlertTriangle className="h-4 w-4" />}
              title="الموعد النهائي انتهى"
              description="راجع حالة المنافسة أو حدّث الموعد النهائي لتفادي فقدان الفرصة."
              className="mb-4"
            />
          )}

          {completionInfo.isPricingCompleted && !completionInfo.isTechnicalFilesUploaded && (
            <InlineAlert
              variant="warning"
              icon={<AlertCircle className="h-4 w-4" />}
              title="ملفات فنية مطلوبة"
              description="أكمل رفع الملفات الفنية قبل إرسال المنافسة لضمان جاهزيتها."
              className="mb-4"
            />
          )}

          {/* Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-sm text-muted-foreground block">الموعد النهائي</span>
                <div className="font-medium text-card-foreground truncate">
                  {formatTenderDate(tender.deadline)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <DollarSign className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-sm text-muted-foreground block">القيمة</span>
                <div className="font-medium text-success truncate">
                  {formatCurrencyValue(contractValue)}
                </div>
                {documentPrice > 0 && (
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>سعر الكراسة:</span>
                    <span className="font-medium text-card-foreground">{formatCurrencyValue(documentPrice)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress Section */}
          {tender.status !== 'won' && tender.status !== 'lost' && tender.status !== 'expired' && tender.status !== 'cancelled' && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">التقدم</span>
                <span className="font-medium text-card-foreground">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              {revertConfig ? (
                <button
                  type="button"
                  className="group relative flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
                  title={revertConfig.title}
                  onClick={handleRevertClick}
                >
                  <RotateCw className="h-4 w-4 text-warning group-hover:text-warning/80" />
                  <span className="text-sm text-warning group-hover:text-warning/80 font-medium">
                    {revertConfig.label}
                  </span>
                </button>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {formatTenderType(tender.type)}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Predictive Analytics Button */}
              {enablePredictiveAnalytics && onViewAnalytics && !predictiveData.loading && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewAnalytics(tender)}
                  className="gap-1 text-xs"
                >
                  <Brain className="h-3 w-3" />
                  تحليلات
                </Button>
              )}

              {tender.status === 'submitted' ? (
                <EntityActions 
                  onView={handleOpenDetails}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onPrimary={() => onOpenResults && onOpenResults(tender)}
                  primaryText="النتيجة"
                  primaryIcon="FileText"
                  primaryVariant="primary"
                />
              ) : shouldShowSubmitButton ? (
                <EntityActions 
                  onView={handleOpenDetails}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onPrimary={handleSubmitTender}
                  primaryText="ارسال"
                  primaryIcon="Send"
                  primaryVariant="success"
                />
              ) : shouldShowPricingButton ? (
                <EntityActions 
                  onView={handleOpenDetails}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onPrimary={handleStartPricing}
                  primaryText="تسعير"
                  primaryIcon="Calculator"
                  primaryVariant="secondary"
                />
              ) : (
                <EntityActions 
                  onView={handleOpenDetails}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})

EnhancedTenderCard.displayName = 'EnhancedTenderCard'

export { EnhancedTenderCard }



