# Phase 2 API Reference - Advanced Analytics & Competitive Intelligence

## 📋 **Overview**

This document provides a comprehensive API reference for all Phase 2 services, utilities, and components. Use this as a quick reference when developing or integrating with Phase 2 features.

---

## 📊 **Analytics Service API**

### **File**: `src/services/analyticsService.ts`

#### **Bid Performance Operations**

```typescript
// Get all bid performances
getAllBidPerformances(): Promise<BidPerformance[]>

// Get bid performance by ID
getBidPerformanceById(id: string): Promise<BidPerformance | null>

// Create new bid performance
createBidPerformance(performance: Omit<BidPerformance, 'id'>): Promise<BidPerformance>

// Update existing bid performance
updateBidPerformance(id: string, updates: Partial<BidPerformance>): Promise<BidPerformance>

// Delete bid performance
deleteBidPerformance(id: string): Promise<void>
```

#### **Analytics Operations**

```typescript
// Get performance summary with optional filters
getPerformanceSummary(filters?: AnalyticsFilters): Promise<PerformanceSummary>

// Get performance trends for a specific period
getPerformanceTrends(period: TimePeriod): Promise<TrendData[]>

// Get bid performances by category
getBidPerformancesByCategory(category: TenderCategory): Promise<BidPerformance[]>

// Get bid performances by date range
getBidPerformancesByDateRange(start: Date, end: Date): Promise<BidPerformance[]>

// Get bid performances by region
getBidPerformancesByRegion(region: string): Promise<BidPerformance[]>

// Get bid performances by value range
getBidPerformancesByValueRange(min: number, max: number): Promise<BidPerformance[]>
```

#### **Statistical Calculations**

```typescript
// Calculate win rate from performances
calculateWinRate(performances: BidPerformance[]): number

// Calculate average margin
calculateAverageMargin(performances: BidPerformance[]): number

// Calculate ROI
calculateROI(performances: BidPerformance[]): number

// Calculate efficiency score
calculateEfficiencyScore(performance: BidPerformance): number
```

#### **Data Types**

```typescript
interface BidPerformance {
  id: string
  tenderId: string
  tenderTitle: string
  category: TenderCategory
  region: string
  submissionDate: Date
  bidAmount: number
  estimatedCost: number
  margin: number
  status: 'won' | 'lost' | 'pending'
  competitorCount: number
  winProbability: number
  actualDuration?: number
  estimatedDuration: number
  profitMargin?: number
  lessonsLearned?: string[]
  riskFactors?: string[]
}

interface PerformanceSummary {
  totalBids: number
  wonBids: number
  winRate: number
  totalValue: number
  averageMargin: number
  averageBidAmount: number
  averageCompetitorCount: number
  topCategory: TenderCategory
  topRegion: string
  trends: {
    winRateTrend: 'up' | 'down' | 'stable'
    valueTrend: 'up' | 'down' | 'stable'
    marginTrend: 'up' | 'down' | 'stable'
  }
}

interface AnalyticsFilters {
  dateRange?: { start: Date; end: Date }
  category?: TenderCategory[]
  region?: string[]
  valueRange?: { min: number; max: number }
  status?: ('won' | 'lost' | 'pending')[]
  competitorCountRange?: { min: number; max: number }
}
```

---

## 🏆 **Competitive Service API**

### **File**: `src/services/competitiveService.ts`

#### **Market Opportunities**

```typescript
// Get all market opportunities with optional filters
getMarketOpportunities(filters?: MarketFilters): Promise<MarketOpportunity[]>

// Create new market opportunity
createMarketOpportunity(opportunity: Omit<MarketOpportunity, 'id'>): Promise<MarketOpportunity>

// Update market opportunity
updateMarketOpportunity(id: string, updates: Partial<MarketOpportunity>): Promise<MarketOpportunity>

// Delete market opportunity
deleteMarketOpportunity(id: string): Promise<void>

// Get opportunity by ID
getMarketOpportunityById(id: string): Promise<MarketOpportunity | null>
```

#### **Market Trends**

```typescript
// Get market trends for a period
getMarketTrends(period?: TimePeriod): Promise<MarketTrend[]>

// Analyze market trend from data
analyzeMarketTrend(data: MarketData[]): MarketTrendAnalysis

// Get market indicators
getMarketIndicators(): Promise<MarketIndicators>
```

#### **Competitor Management**

```typescript
// Get all competitors
getCompetitors(): Promise<Competitor[]>

// Add new competitor
addCompetitor(competitor: Omit<Competitor, 'id'>): Promise<Competitor>

// Update competitor information
updateCompetitor(id: string, updates: Partial<Competitor>): Promise<Competitor>

// Remove competitor
removeCompetitor(id: string): Promise<void>

// Get competitor by ID
getCompetitorById(id: string): Promise<Competitor | null>
```

#### **Data Types**

```typescript
interface MarketOpportunity {
  id: string
  title: string
  category: TenderCategory
  estimatedValue: number
  region: string
  deadline: Date
  competitorCount: number
  suitabilityScore: number
  riskLevel: 'low' | 'medium' | 'high'
  description: string
  source: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

interface Competitor {
  id: string
  name: string
  type: 'local' | 'regional' | 'international'
  specialties: string[]
  regions: string[]
  winRate: number
  averageBid: number
  lastActivity: Date
  strengths: string[]
  weaknesses: string[]
  marketShare: number
  recentProjects: string[]
}

interface MarketTrend {
  id: string
  period: string
  category: TenderCategory
  region: string
  totalOpportunities: number
  totalValue: number
  averageValue: number
  competitionLevel: 'low' | 'medium' | 'high'
  growthRate: number
  trend: 'up' | 'down' | 'stable'
}
```

---

## 🤖 **Recommendation Service API**

### **File**: `src/services/recommendationService.ts`

#### **Template Recommendations**

```typescript
// Get template recommendations based on context
getTemplateRecommendations(context: TenderContext): Promise<TemplateRecommendation[]>

// Get contextual recommendations for a tender
getContextualRecommendations(tender: Tender): Promise<ContextualRecommendation[]>

// Analyze template performance
analyzeTemplatePerformance(templates: PricingTemplate[]): Promise<TemplateAnalysis[]>

// Generate pricing insights
generatePricingInsights(tender: Tender, historical: BidPerformance[]): Promise<PricingInsight[]>
```

#### **AI Recommendations**

```typescript
// Get AI-powered recommendations
getAIRecommendations(context: RecommendationContext): Promise<AIRecommendation[]>

// Get risk-based recommendations
getRiskBasedRecommendations(riskFactors: RiskFactor[]): Promise<RiskRecommendation[]>

// Get competitive recommendations
getCompetitiveRecommendations(competitors: Competitor[], tender: Tender): Promise<CompetitiveRecommendation[]>
```

#### **Data Types**

```typescript
interface TemplateRecommendation {
  templateId: string
  score: number
  reasons: string[]
  confidence: number
  suitabilityFactors: {
    categoryMatch: number
    valueRange: number
    regionMatch: number
    complexityMatch: number
  }
}

interface TenderContext {
  category: TenderCategory
  estimatedValue: number
  region: string
  complexity: 'low' | 'medium' | 'high'
  deadline: Date
  requirements: string[]
}

interface AIRecommendation {
  type: 'pricing' | 'strategy' | 'risk' | 'competitive'
  title: string
  description: string
  confidence: number
  impact: 'low' | 'medium' | 'high'
  actionItems: string[]
  reasoning: string[]
}
```

---

## 🔮 **Prediction Models API**

### **File**: `src/utils/predictionModels.ts`

#### **Win Probability Prediction**

```typescript
// Predict win probability for a tender
predictWinProbability(
  tender: Tender,
  historical: BidPerformance[],
  competitors: Competitor[]
): WinPrediction

// Calculate confidence score for prediction
calculatePredictionConfidence(
  prediction: WinPrediction,
  dataQuality: DataQualityMetrics
): number
```

#### **Price Optimization**

```typescript
// Optimize price for maximum win probability
optimizePrice(
  tender: Tender,
  marketData: MarketData[],
  targetMargin: number
): PriceOptimization

// Calculate optimal margin range
calculateOptimalMarginRange(
  tender: Tender,
  riskTolerance: number
): MarginRange
```

#### **Market Forecasting**

```typescript
// Forecast market trends
forecastMarketTrend(
  historical: MarketData[],
  forecastPeriod: number
): MarketForecast

// Predict market opportunities
predictMarketOpportunities(
  trends: MarketTrend[],
  timeframe: number
): OpportunityForecast[]
```

#### **Risk Assessment**

```typescript
// Assess project risk
assessRisk(
  tender: Tender,
  factors: RiskFactor[]
): RiskAssessment

// Calculate risk-adjusted margin
calculateRiskAdjustedMargin(
  baseMargin: number,
  riskScore: number
): number
```

#### **Data Types**

```typescript
interface WinPrediction {
  probability: number
  confidence: number
  factors: PredictionFactor[]
  recommendations: string[]
  riskLevel: 'low' | 'medium' | 'high'
}

interface PriceOptimization {
  recommendedPrice: number
  priceRange: { min: number; max: number }
  expectedMargin: number
  winProbability: number
  reasoning: string[]
  alternatives: PriceAlternative[]
}

interface MarketForecast {
  period: { start: Date; end: Date }
  expectedGrowth: number
  opportunityCount: number
  averageValue: number
  competitionLevel: 'low' | 'medium' | 'high'
  confidence: number
  keyTrends: string[]
}

interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high'
  riskScore: number
  factors: RiskFactor[]
  mitigationStrategies: string[]
  recommendedMargin: number
}
```

---

## 📊 **Analytics Utils API**

### **File**: `src/utils/analyticsUtils.ts`

#### **Statistical Functions**

```typescript
// Basic statistics
calculateMean(values: number[]): number
calculateMedian(values: number[]): number
calculateMode(values: number[]): number
calculateStandardDeviation(values: number[]): number
calculateVariance(values: number[]): number

// Advanced statistics
calculateCorrelation(x: number[], y: number[]): number
calculateLinearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number }
calculatePercentile(values: number[], percentile: number): number
calculateQuartiles(values: number[]): { q1: number; q2: number; q3: number }
```

#### **Performance Metrics**

```typescript
// Business metrics
calculateWinRate(performances: BidPerformance[]): number
calculateROI(performances: BidPerformance[]): number
calculateAverageMargin(performances: BidPerformance[]): number
calculateEfficiencyScore(performance: BidPerformance): number
calculateCompetitiveIndex(performance: BidPerformance, market: MarketData): number

// Trend analysis
calculateTrend(values: number[]): 'up' | 'down' | 'stable'
calculateGrowthRate(oldValue: number, newValue: number): number
calculateMovingAverage(values: number[], window: number): number[]
calculateSeasonality(data: TimeSeriesData[]): SeasonalityAnalysis
```

#### **Data Transformations**

```typescript
// Chart data transformations
transformToChartData(data: BidPerformance[], type: ChartType): ChartData
transformToTimeSeriesData(data: BidPerformance[]): TimeSeriesData[]
aggregateByPeriod(data: BidPerformance[], period: 'day' | 'week' | 'month' | 'year'): AggregatedData[]
groupByCategory(data: BidPerformance[]): CategoryGroupedData

// Data filtering and sorting
filterByDateRange(data: BidPerformance[], start: Date, end: Date): BidPerformance[]
filterByCategory(data: BidPerformance[], categories: TenderCategory[]): BidPerformance[]
sortByField(data: BidPerformance[], field: keyof BidPerformance, order: 'asc' | 'desc'): BidPerformance[]
```

#### **Export Functions**

```typescript
// Data export
exportToCSV(data: any[], filename: string): void
exportToExcel(data: any[], filename: string, sheetName?: string): void
exportToPDF(data: any[], title: string, filename: string): void
exportChart(chartElement: HTMLElement, filename: string, format: 'png' | 'jpg' | 'svg'): void

// Report generation
generatePerformanceReport(data: BidPerformance[], options: ReportOptions): Report
generateCompetitiveReport(competitors: Competitor[], market: MarketData[]): Report
generateTrendReport(trends: TrendData[], period: TimePeriod): Report
```

---

## 🎯 **Context API**

### **File**: `src/components/analytics/AnalyticsContext.tsx`

#### **Context Provider**

```typescript
// Provider component
<AnalyticsProvider>
  {children}
</AnalyticsProvider>

// Hook to use context
const analytics = useAnalytics()
```

#### **Context Interface**

```typescript
interface AnalyticsContextType {
  // Data state
  performanceData: BidPerformance[]
  competitorData: Competitor[]
  marketData: MarketOpportunity[]
  
  // UI state
  loading: boolean
  error: string | null
  filters: AnalyticsFilters
  
  // Computed values
  summary: PerformanceSummary
  trends: TrendData[]
  insights: Insight[]
  
  // Actions
  refreshData: () => Promise<void>
  updateFilters: (filters: AnalyticsFilters) => void
  exportData: (format: ExportFormat, data?: any[]) => void
  clearError: () => void
  
  // Data operations
  addPerformance: (performance: Omit<BidPerformance, 'id'>) => Promise<void>
  updatePerformance: (id: string, updates: Partial<BidPerformance>) => Promise<void>
  deletePerformance: (id: string) => Promise<void>
}
```

---

## 🔧 **Component Props Reference**

### **AnalyticsRouter**

```typescript
interface AnalyticsRouterProps {
  className?: string
  defaultTab?: string
  onTabChange?: (tab: string) => void
}
```

### **AnalyticsDashboard**

```typescript
interface AnalyticsDashboardProps {
  className?: string
  showFilters?: boolean
  showExport?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}
```

### **PerformanceMetricsCards**

```typescript
interface PerformanceMetricsCardsProps {
  data: BidPerformance[]
  loading?: boolean
  className?: string
  onMetricClick?: (metric: string) => void
  showTrends?: boolean
  showTargets?: boolean
}
```

### **AnalyticsCharts**

```typescript
interface AnalyticsChartsProps {
  data: BidPerformance[]
  chartType: 'line' | 'bar' | 'pie' | 'area' | 'scatter'
  title: string
  className?: string
  height?: number
  showLegend?: boolean
  showTooltip?: boolean
  onDataPointClick?: (data: any) => void
}
```

### **AnalyticsFilters**

```typescript
interface AnalyticsFiltersProps {
  filters: AnalyticsFilters
  onFiltersChange: (filters: AnalyticsFilters) => void
  className?: string
  showDateRange?: boolean
  showCategory?: boolean
  showRegion?: boolean
  showValueRange?: boolean
  showStatus?: boolean
}
```

---

## 🚀 **Usage Examples**

### **Basic Analytics Dashboard**

```typescript
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'

function MyAnalyticsPage() {
  return (
    <div className="analytics-page">
      <AnalyticsDashboard 
        showFilters={true}
        showExport={true}
        autoRefresh={true}
        refreshInterval={30000}
      />
    </div>
  )
}
```

### **Custom Analytics Component**

```typescript
import { useAnalytics } from '@/components/analytics/AnalyticsContext'
import { calculateWinRate } from '@/utils/analyticsUtils'

function CustomMetric() {
  const { performanceData, loading } = useAnalytics()
  
  const winRate = useMemo(() => {
    return calculateWinRate(performanceData)
  }, [performanceData])
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div className="metric-card">
      <h3>Win Rate</h3>
      <p>{winRate.toFixed(1)}%</p>
    </div>
  )
}
```

### **Data Export**

```typescript
import { exportToCSV, exportToPDF } from '@/utils/analyticsUtils'
import { useAnalytics } from '@/components/analytics/AnalyticsContext'

function ExportButton() {
  const { performanceData, exportData } = useAnalytics()
  
  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      exportToCSV(performanceData, 'performance-data.csv')
    } else {
      exportToPDF(performanceData, 'Performance Report', 'performance-report.pdf')
    }
  }
  
  return (
    <div>
      <button onClick={() => handleExport('csv')}>Export CSV</button>
      <button onClick={() => handleExport('pdf')}>Export PDF</button>
    </div>
  )
}
```

### **Prediction Integration**

```typescript
import { predictWinProbability } from '@/utils/predictionModels'
import { useAnalytics } from '@/components/analytics/AnalyticsContext'

function WinProbabilityPredictor({ tender }: { tender: Tender }) {
  const { performanceData, competitorData } = useAnalytics()
  
  const prediction = useMemo(() => {
    return predictWinProbability(tender, performanceData, competitorData)
  }, [tender, performanceData, competitorData])
  
  return (
    <div className="prediction-card">
      <h3>Win Probability</h3>
      <p>{(prediction.probability * 100).toFixed(1)}%</p>
      <p>Confidence: {(prediction.confidence * 100).toFixed(1)}%</p>
      <ul>
        {prediction.recommendations.map((rec, index) => (
          <li key={index}>{rec}</li>
        ))}
      </ul>
    </div>
  )
}
```

---

## 🔍 **Error Handling**

### **Service Errors**

```typescript
try {
  const data = await analyticsService.getAllBidPerformances()
  // Handle success
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation error
  } else if (error instanceof NetworkError) {
    // Handle network error
  } else {
    // Handle generic error
  }
}
```

### **Component Error Boundaries**

```typescript
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

function AnalyticsPage() {
  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <AnalyticsDashboard />
    </ErrorBoundary>
  )
}
```

---

## 📚 **Type Definitions**

All TypeScript interfaces and types are available in:
- `src/types/analytics.ts` - Analytics-related types
- `src/types/competitive.ts` - Competitive intelligence types
- `src/types/predictions.ts` - Prediction and AI types

---

## 🔄 **Versioning**

**Current Version**: 2.0.0
**API Stability**: Stable
**Breaking Changes**: None planned

---

**Last Updated**: December 2024  
**Maintained By**: Development Team
