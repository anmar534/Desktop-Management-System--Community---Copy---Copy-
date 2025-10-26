import { asyncStorage } from '@/utils/storage'
export interface LiquidityRatios {
  currentRatio: number
  quickRatio: number
  cashRatio: number
  workingCapital: number
}

export interface ProfitabilityRatios {
  grossProfitMargin: number
  netProfitMargin: number
  operatingMargin: number
  returnOnAssets: number
  returnOnEquity: number
  returnOnInvestment: number
}

export interface ActivityRatios {
  assetTurnover: number
  inventoryTurnover: number
  receivablesTurnover: number
  payablesTurnover: number
  daysSalesOutstanding: number
  daysInventoryOutstanding: number
}

export interface LeverageRatios {
  debtToAssets: number
  debtToEquity: number
  equityRatio: number
  interestCoverage: number
  debtServiceCoverage: number
}

export interface TrendAnalysis {
  period: string
  revenue: number
  expenses: number
  profit: number
  growthRate: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

export interface CashFlowForecast {
  period: string
  projectedInflow: number
  projectedOutflow: number
  netCashFlow: number
  cumulativeCashFlow: number
  confidence: number
}

export interface SeasonalityAnalysis {
  month: number
  monthName: string
  averageRevenue: number
  seasonalIndex: number
  variance: number
}

export interface EarlyWarningIndicator {
  id: string
  name: string
  nameEn: string
  currentValue: number
  threshold: number
  status: 'normal' | 'warning' | 'critical'
  trend: 'improving' | 'stable' | 'deteriorating'
  description: string
  descriptionEn: string
  lastUpdated: string
}

export interface FinancialKPI {
  id: string
  name: string
  nameEn: string
  value: number
  target: number
  unit: string
  category: 'liquidity' | 'profitability' | 'activity' | 'leverage'
  trend: 'up' | 'down' | 'stable'
  performance: 'excellent' | 'good' | 'average' | 'poor'
  lastUpdated: string
}

export interface FinancialAnalyticsData {
  companyId: string
  period: string
  liquidityRatios: LiquidityRatios
  profitabilityRatios: ProfitabilityRatios
  activityRatios: ActivityRatios
  leverageRatios: LeverageRatios
  trendAnalysis: TrendAnalysis[]
  cashFlowForecast: CashFlowForecast[]
  seasonalityAnalysis: SeasonalityAnalysis[]
  earlyWarningIndicators: EarlyWarningIndicator[]
  kpis: FinancialKPI[]
  createdAt: string
  updatedAt: string
}

export class FinancialAnalyticsService {
  private readonly storageKey = 'financial_analytics'
  async calculateLiquidityRatios(
    currentAssets: number,
    currentLiabilities: number,
    cash: number,
    marketableSecurities: number,
    inventory: number,
  ): Promise<LiquidityRatios> {
    const quickAssets = currentAssets - inventory
    const cashAndEquivalents = cash + marketableSecurities

    return {
      currentRatio: currentLiabilities > 0 ? currentAssets / currentLiabilities : 0,
      quickRatio: currentLiabilities > 0 ? quickAssets / currentLiabilities : 0,
      cashRatio: currentLiabilities > 0 ? cashAndEquivalents / currentLiabilities : 0,
      workingCapital: currentAssets - currentLiabilities,
    }
  }
  // يحسب نسب الربحية الأساسية
  async calculateProfitabilityRatios(
    revenue: number,
    costOfGoodsSold: number,
    operatingExpenses: number,
    netIncome: number,
    totalAssets: number,
    shareholdersEquity: number,
    totalInvestment: number,
  ): Promise<ProfitabilityRatios> {
    const grossProfit = revenue - costOfGoodsSold
    const operatingIncome = grossProfit - operatingExpenses

    return {
      grossProfitMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
      netProfitMargin: revenue > 0 ? (netIncome / revenue) * 100 : 0,
      operatingMargin: revenue > 0 ? (operatingIncome / revenue) * 100 : 0,
      returnOnAssets: totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0,
      returnOnEquity: shareholdersEquity > 0 ? (netIncome / shareholdersEquity) * 100 : 0,
      returnOnInvestment: totalInvestment > 0 ? (netIncome / totalInvestment) * 100 : 0,
    }
  }
  // يحسب نسب كفاءة النشاط التشغيلي
  async calculateActivityRatios(
    revenue: number,
    totalAssets: number,
    inventory: number,
    accountsReceivable: number,
    accountsPayable: number,
    costOfGoodsSold: number,
  ): Promise<ActivityRatios> {
    const assetTurnover = totalAssets > 0 ? revenue / totalAssets : 0
    const inventoryTurnover = inventory > 0 ? costOfGoodsSold / inventory : 0
    const receivablesTurnover = accountsReceivable > 0 ? revenue / accountsReceivable : 0
    const payablesTurnover = accountsPayable > 0 ? costOfGoodsSold / accountsPayable : 0

    return {
      assetTurnover,
      inventoryTurnover,
      receivablesTurnover,
      payablesTurnover,
      daysSalesOutstanding: receivablesTurnover > 0 ? 365 / receivablesTurnover : 0,
      daysInventoryOutstanding: inventoryTurnover > 0 ? 365 / inventoryTurnover : 0,
    }
  }
  async calculateLeverageRatios(
    totalDebt: number,
    totalAssets: number,
    shareholdersEquity: number,
    interestExpense: number,
    ebit: number, // الأرباح قبل الفوائد والضرائب (EBIT)
    principalPayments: number,
  ): Promise<LeverageRatios> {
    return {
      debtToAssets: totalAssets > 0 ? (totalDebt / totalAssets) * 100 : 0,
      debtToEquity: shareholdersEquity > 0 ? (totalDebt / shareholdersEquity) * 100 : 0,
      equityRatio: totalAssets > 0 ? (shareholdersEquity / totalAssets) * 100 : 0,
      interestCoverage: interestExpense > 0 ? ebit / interestExpense : 0,
      debtServiceCoverage:
        principalPayments + interestExpense > 0 ? ebit / (principalPayments + interestExpense) : 0,
    }
  }

  async analyzeTrends(
    historicalData: Array<{
      period: string
      revenue: number
      expenses: number
      profit: number
    }>,
  ): Promise<TrendAnalysis[]> {
    return historicalData.map((data, index) => {
      let growthRate = 0
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'

      if (index > 0) {
        const previousRevenue = historicalData[index - 1].revenue
        if (previousRevenue > 0) {
          growthRate = ((data.revenue - previousRevenue) / previousRevenue) * 100
          trend = growthRate > 5 ? 'increasing' : growthRate < -5 ? 'decreasing' : 'stable'
        }
      }

      return {
        period: data.period,
        revenue: data.revenue,
        expenses: data.expenses,
        profit: data.profit,
        growthRate,
        trend,
      }
    })
  }

  async forecastCashFlow(
    historicalCashFlows: Array<{
      period: string
      inflow: number
      outflow: number
    }>,
    forecastPeriods = 12,
  ): Promise<CashFlowForecast[]> {
    const forecasts: CashFlowForecast[] = []
    let cumulativeCashFlow = 0

    const avgInflow =
      historicalCashFlows.length > 0
        ? historicalCashFlows.reduce((sum, cf) => sum + cf.inflow, 0) / historicalCashFlows.length
        : 0
    const avgOutflow =
      historicalCashFlows.length > 0
        ? historicalCashFlows.reduce((sum, cf) => sum + cf.outflow, 0) / historicalCashFlows.length
        : 0

    const inflowVariance =
      historicalCashFlows.length > 0
        ? this.calculateVariance(historicalCashFlows.map((cf) => cf.inflow))
        : 0
    const outflowVariance =
      historicalCashFlows.length > 0
        ? this.calculateVariance(historicalCashFlows.map((cf) => cf.outflow))
        : 0

    const avgTotal = avgInflow + avgOutflow
    const totalVariance = inflowVariance + outflowVariance
    const relativeVariance = avgTotal > 0 ? (totalVariance / avgTotal) * 100 : 0
    const confidence = Math.max(10, Math.min(100, 100 - relativeVariance))

    for (let i = 1; i <= forecastPeriods; i++) {
      const currentDate = new Date()
      currentDate.setMonth(currentDate.getMonth() + i)
      const period = currentDate.toISOString().substring(0, 7)

      const growthFactor = 1 + (0.02 * i) / 12
      const projectedInflow = avgInflow * growthFactor
      const projectedOutflow = avgOutflow * growthFactor
      const netCashFlow = projectedInflow - projectedOutflow
      cumulativeCashFlow += netCashFlow

      forecasts.push({
        period,
        projectedInflow,
        projectedOutflow,
        netCashFlow,
        cumulativeCashFlow,
        confidence: Math.max(0, confidence - i * 5),
      })
    }

    return forecasts
  }
  async analyzeSeasonality(
    monthlyData: Array<{
      month: number
      revenue: number
    }>,
  ): Promise<SeasonalityAnalysis[]> {
    const monthlyAverages = new Map<number, number[]>()
    monthlyData.forEach((data) => {
      if (!monthlyAverages.has(data.month)) {
        monthlyAverages.set(data.month, [])
      }
      monthlyAverages.get(data.month)!.push(data.revenue)
    })

    const overallAverage =
      monthlyData.reduce((sum, data) => sum + data.revenue, 0) / monthlyData.length
    const monthNames = [
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'مايو',
      'يونيو',
      'يوليو',
      'أغسطس',
      'سبتمبر',
      'أكتوبر',
      'نوفمبر',
      'ديسمبر',
    ]

    const seasonalityAnalysis: SeasonalityAnalysis[] = []

    for (let month = 1; month <= 12; month++) {
      const monthData = monthlyAverages.get(month) || []
      const averageRevenue =
        monthData.length > 0 ? monthData.reduce((sum, rev) => sum + rev, 0) / monthData.length : 0
      const seasonalIndex = overallAverage > 0 ? (averageRevenue / overallAverage) * 100 : 100
      const variance = this.calculateVariance(monthData)

      seasonalityAnalysis.push({
        month,
        monthName: monthNames[month - 1],
        averageRevenue,
        seasonalIndex,
        variance,
      })
    }

    return seasonalityAnalysis
  }
  async generateEarlyWarningIndicators(
    currentRatios: LiquidityRatios & ProfitabilityRatios & ActivityRatios & LeverageRatios,
  ): Promise<EarlyWarningIndicator[]> {
    const indicators: EarlyWarningIndicator[] = []

    indicators.push({
      id: 'liquidity_warning',
      name: 'تحذير السيولة',
      nameEn: 'Liquidity Warning',
      currentValue: currentRatios.currentRatio,
      threshold: 1.5,
      status:
        currentRatios.currentRatio < 1.0
          ? 'critical'
          : currentRatios.currentRatio < 1.5
            ? 'warning'
            : 'normal',
      trend: 'stable',
      description: 'مؤشر يحذر من تراجع السيولة المتاحة',
      descriptionEn: 'Indicator warning of declining liquidity',
      lastUpdated: new Date().toISOString(),
    })

    indicators.push({
      id: 'profitability_warning',
      name: 'تحذير الربحية',
      nameEn: 'Profitability Warning',
      currentValue: currentRatios.netProfitMargin,
      threshold: 5.0,
      status:
        currentRatios.netProfitMargin < 0
          ? 'critical'
          : currentRatios.netProfitMargin < 5
            ? 'warning'
            : 'normal',
      trend: 'stable',
      description: 'مؤشر يحذر من تراجع هامش الربح',
      descriptionEn: 'Indicator warning of declining profitability',
      lastUpdated: new Date().toISOString(),
    })

    indicators.push({
      id: 'debt_warning',
      name: 'تحذير الديون',
      nameEn: 'Debt Warning',
      currentValue: currentRatios.debtToEquity,
      threshold: 50.0,
      status:
        currentRatios.debtToEquity > 100
          ? 'critical'
          : currentRatios.debtToEquity > 50
            ? 'warning'
            : 'normal',
      trend: 'stable',
      description: 'مؤشر يحذر من الارتفاع الكبير في الديون',
      descriptionEn: 'Indicator warning of high debt levels',
      lastUpdated: new Date().toISOString(),
    })

    return indicators
  }
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDifferences = values.map((val) => Math.pow(val - mean, 2))
    return squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length
  }

  async saveAnalyticsData(data: FinancialAnalyticsData): Promise<void> {
    const existingData = await this.getAllAnalyticsData()
    const updatedData = existingData.filter(
      (item) => !(item.companyId === data.companyId && item.period === data.period),
    )
    updatedData.push({
      ...data,
      updatedAt: new Date().toISOString(),
    })
    await asyncStorage.setItem(this.storageKey, updatedData)
  }

  async getAllAnalyticsData(): Promise<FinancialAnalyticsData[]> {
    return (await asyncStorage.getItem<FinancialAnalyticsData[]>(this.storageKey, [])) || []
  }

  async getAnalyticsDataByCompany(companyId: string): Promise<FinancialAnalyticsData[]> {
    const allData = await this.getAllAnalyticsData()
    return allData.filter((data) => data.companyId === companyId)
  }

  async getAnalyticsDataByPeriod(period: string): Promise<FinancialAnalyticsData[]> {
    const allData = await this.getAllAnalyticsData()
    return allData.filter((data) => data.period === period)
  }

  async deleteAnalyticsData(companyId: string, period: string): Promise<void> {
    const allData = await this.getAllAnalyticsData()
    const filteredData = allData.filter(
      (data) => !(data.companyId === companyId && data.period === period),
    )
    await asyncStorage.setItem(this.storageKey, filteredData)
  }
}
