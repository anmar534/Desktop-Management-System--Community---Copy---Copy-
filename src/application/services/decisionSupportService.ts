/**
 * Decision Support Service
 * Comprehensive bid/no-bid decision framework and scenario planning service
 */

import { asyncStorage } from '../utils/storage'
import type {
  DecisionSupportService,
  BidNoBidFramework,
  DecisionScenario,
  ScenarioAnalysis,
  DecisionRecommendation,
  ScenarioTemplate,
  ScenarioComparison,
  DecisionHistory,
  DecisionAnalytics,
  ScenarioFilters,
  AnalyticsFilters,
  HistoryFilters,
  ValidationResult,
  ComparisonMatrix,
  ComparisonInsight,
  DecisionCriteria,
} from '../types/decisionSupport'

class DecisionSupportServiceImpl implements DecisionSupportService {
  private readonly FRAMEWORKS_KEY = 'decision_frameworks'
  private readonly SCENARIOS_KEY = 'decision_scenarios'
  private readonly TEMPLATES_KEY = 'scenario_templates'
  private readonly HISTORY_KEY = 'decision_history'
  private readonly COMPARISONS_KEY = 'scenario_comparisons'

  // Framework Management
  async createFramework(
    framework: Omit<BidNoBidFramework, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<BidNoBidFramework> {
    try {
      const newFramework: BidNoBidFramework = {
        ...framework,
        id: `framework_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const frameworks = await this.getAllFrameworks()
      frameworks.push(newFramework)
      await asyncStorage.setItem(this.FRAMEWORKS_KEY, frameworks)

      return newFramework
    } catch (error) {
      console.error('Error creating framework:', error)
      throw new Error('Failed to create decision framework')
    }
  }

  async updateFramework(
    id: string,
    updates: Partial<BidNoBidFramework>,
  ): Promise<BidNoBidFramework> {
    try {
      const frameworks = await this.getAllFrameworks()
      const index = frameworks.findIndex((f) => f.id === id)

      if (index === -1) {
        throw new Error(`Framework with id ${id} not found`)
      }

      const updatedFramework = {
        ...frameworks[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      }

      frameworks[index] = updatedFramework
      await asyncStorage.setItem(this.FRAMEWORKS_KEY, frameworks)

      return updatedFramework
    } catch (error) {
      console.error('Error updating framework:', error)
      if (error instanceof Error && error.message.includes('not found')) {
        throw error
      }
      throw new Error('Failed to update decision framework')
    }
  }

  async deleteFramework(id: string): Promise<void> {
    try {
      const frameworks = await this.getAllFrameworks()
      const filteredFrameworks = frameworks.filter((f) => f.id !== id)
      await asyncStorage.setItem(this.FRAMEWORKS_KEY, filteredFrameworks)
    } catch (error) {
      console.error('Error deleting framework:', error)
      throw new Error('Failed to delete decision framework')
    }
  }

  async getFramework(id: string): Promise<BidNoBidFramework | null> {
    try {
      const frameworks = await this.getAllFrameworks()
      return frameworks.find((f) => f.id === id) || null
    } catch (error) {
      console.error('Error getting framework:', error)
      return null
    }
  }

  async getAllFrameworks(): Promise<BidNoBidFramework[]> {
    try {
      return await asyncStorage.getItem(this.FRAMEWORKS_KEY, [])
    } catch (error) {
      console.error('Error loading frameworks:', error)
      return []
    }
  }

  // Scenario Management
  async createScenario(
    scenario: Omit<DecisionScenario, 'id' | 'createdAt' | 'updatedAt' | 'analysisResults'>,
  ): Promise<DecisionScenario> {
    try {
      const newScenario: DecisionScenario = {
        ...scenario,
        id: `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        analysisResults: {
          overallScore: 0,
          recommendation: 'no_bid',
          riskLevel: 'medium',
          categoryScores: {
            financial: 0,
            strategic: 0,
            operational: 0,
            risk: 0,
            market: 0,
          },
          keyFactors: {
            positive: [],
            negative: [],
            neutral: [],
          },
          criticalIssues: [],
          opportunities: [],
          threats: [],
          assumptions: [],
        },
      }

      const scenarios = await this.getAllScenarios()
      scenarios.push(newScenario)
      await asyncStorage.setItem(this.SCENARIOS_KEY, scenarios)

      return newScenario
    } catch (error) {
      console.error('Error creating scenario:', error)
      throw new Error('Failed to create decision scenario')
    }
  }

  async updateScenario(id: string, updates: Partial<DecisionScenario>): Promise<DecisionScenario> {
    try {
      const scenarios = await this.getAllScenarios()
      const index = scenarios.findIndex((s) => s.id === id)

      if (index === -1) {
        throw new Error(`Scenario with id ${id} not found`)
      }

      const updatedScenario = {
        ...scenarios[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      }

      scenarios[index] = updatedScenario
      await asyncStorage.setItem(this.SCENARIOS_KEY, scenarios)

      return updatedScenario
    } catch (error) {
      console.error('Error updating scenario:', error)
      if (error instanceof Error && error.message.includes('not found')) {
        throw error
      }
      throw new Error('Failed to update decision scenario')
    }
  }

  async deleteScenario(id: string): Promise<void> {
    try {
      const scenarios = await this.getAllScenarios()
      const filteredScenarios = scenarios.filter((s) => s.id !== id)
      await asyncStorage.setItem(this.SCENARIOS_KEY, filteredScenarios)
    } catch (error) {
      console.error('Error deleting scenario:', error)
      throw new Error('Failed to delete decision scenario')
    }
  }

  async getScenario(id: string): Promise<DecisionScenario | null> {
    try {
      const scenarios = await this.getAllScenarios()
      return scenarios.find((s) => s.id === id) || null
    } catch (error) {
      console.error('Error getting scenario:', error)
      return null
    }
  }

  async getAllScenarios(filters?: ScenarioFilters): Promise<DecisionScenario[]> {
    try {
      let scenarios = await asyncStorage.getItem(this.SCENARIOS_KEY, [])

      if (!filters) {
        return scenarios
      }

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        scenarios = scenarios.filter((s) => filters.status!.includes(s.status))
      }

      if (filters.projectId) {
        scenarios = scenarios.filter((s) => s.projectId === filters.projectId)
      }

      if (filters.createdBy) {
        scenarios = scenarios.filter((s) => s.createdBy === filters.createdBy)
      }

      if (filters.recommendation && filters.recommendation.length > 0) {
        scenarios = scenarios.filter((s) =>
          filters.recommendation!.includes(s.analysisResults.recommendation),
        )
      }

      if (filters.dateRange) {
        const startDate = new Date(filters.dateRange.start)
        const endDate = new Date(filters.dateRange.end)
        scenarios = scenarios.filter((s) => {
          const createdDate = new Date(s.createdAt)
          return createdDate >= startDate && createdDate <= endDate
        })
      }

      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase()
        scenarios = scenarios.filter(
          (s) =>
            (s.name && s.name.toLowerCase().includes(searchLower)) ||
            (s.nameEn && s.nameEn.toLowerCase().includes(searchLower)) ||
            (s.description && s.description.toLowerCase().includes(searchLower)) ||
            (s.projectName && s.projectName.toLowerCase().includes(searchLower)),
        )
      }

      return scenarios
    } catch (error) {
      console.error('Error loading scenarios:', error)
      return []
    }
  }

  // Decision Analysis
  async analyzeScenario(scenarioId: string, frameworkId: string): Promise<ScenarioAnalysis> {
    try {
      const scenario = await this.getScenario(scenarioId)
      const framework = await this.getFramework(frameworkId)

      if (!scenario) {
        throw new Error(`Scenario with id ${scenarioId} not found`)
      }

      if (!framework) {
        throw new Error(`Framework with id ${frameworkId} not found`)
      }

      // Perform comprehensive analysis
      const analysis = await this.performScenarioAnalysis(scenario, framework)

      // Update scenario with analysis results
      await this.updateScenario(scenarioId, {
        analysisResults: analysis,
        lastAnalyzed: new Date().toISOString(),
        status: 'completed',
      })

      return analysis
    } catch (error) {
      console.error('Error analyzing scenario:', error)
      if (
        error instanceof Error &&
        (error.message.includes('not found') ||
          error.message.includes('Scenario with id') ||
          error.message.includes('Framework with id'))
      ) {
        throw error
      }
      throw new Error('Failed to analyze scenario')
    }
  }

  private async performScenarioAnalysis(
    scenario: DecisionScenario,
    framework: BidNoBidFramework,
  ): Promise<ScenarioAnalysis> {
    // Calculate category scores based on criteria and weights
    const categoryScores = {
      financial: this.calculateCategoryScore(scenario, framework, 'financial'),
      strategic: this.calculateCategoryScore(scenario, framework, 'strategic'),
      operational: this.calculateCategoryScore(scenario, framework, 'operational'),
      risk: this.calculateCategoryScore(scenario, framework, 'risk'),
      market: this.calculateCategoryScore(scenario, framework, 'market'),
    }

    // Calculate overall weighted score
    const overallScore =
      (categoryScores.financial * framework.weightingScheme.financial +
        categoryScores.strategic * framework.weightingScheme.strategic +
        categoryScores.operational * framework.weightingScheme.operational +
        categoryScores.risk * framework.weightingScheme.risk +
        categoryScores.market * framework.weightingScheme.market) /
      100

    // Determine recommendation based on thresholds
    let recommendation: 'bid' | 'no_bid' | 'conditional_bid'
    if (overallScore >= framework.thresholds.bidThreshold) {
      recommendation = 'bid'
    } else if (overallScore <= framework.thresholds.noBidThreshold) {
      recommendation = 'no_bid'
    } else {
      recommendation = 'conditional_bid'
    }

    // Determine risk level
    const riskLevel = this.calculateRiskLevel(categoryScores, overallScore)

    // Identify key factors
    const keyFactors = this.identifyKeyFactors(scenario, framework, categoryScores)

    // Generate insights
    const criticalIssues = this.identifyCriticalIssues(scenario, framework, categoryScores)
    const opportunities = this.identifyOpportunities(scenario, framework, categoryScores)
    const threats = this.identifyThreats(scenario, framework, categoryScores)
    const assumptions = this.identifyAssumptions(scenario, framework)

    return {
      overallScore: Math.round(overallScore * 100) / 100,
      recommendation,
      riskLevel,
      categoryScores,
      keyFactors,
      criticalIssues,
      opportunities,
      threats,
      assumptions,
    }
  }

  private calculateCategoryScore(
    scenario: DecisionScenario,
    framework: BidNoBidFramework,
    category: string,
  ): number {
    const categoryCriteria = framework.criteria.filter((c) => c.category === category)
    if (categoryCriteria.length === 0) return 0

    let totalScore = 0
    let totalWeight = 0

    categoryCriteria.forEach((criteria) => {
      const value = scenario.criteriaValues[criteria.id]
      if (value !== undefined && value !== null) {
        const normalizedScore = this.normalizeCriteriaValue(value, criteria)
        totalScore += normalizedScore * criteria.weight
        totalWeight += criteria.weight
      }
    })

    return totalWeight > 0 ? totalScore / totalWeight : 0
  }

  private normalizeCriteriaValue(value: any, criteria: DecisionCriteria): number {
    switch (criteria.dataType) {
      case 'boolean':
        return value ? 100 : 0
      case 'numeric':
        if (criteria.minValue !== undefined && criteria.maxValue !== undefined) {
          const normalized = (value - criteria.minValue) / (criteria.maxValue - criteria.minValue)
          return Math.max(0, Math.min(100, normalized * 100))
        }
        return Math.max(0, Math.min(100, value))
      case 'categorical':
        if (criteria.possibleValues) {
          const index = criteria.possibleValues.indexOf(value)
          return index >= 0 ? (index / (criteria.possibleValues.length - 1)) * 100 : 0
        }
        return 50 // Default for unknown categorical values
      default:
        return 50 // Default for text and unknown types
    }
  }

  private calculateRiskLevel(
    categoryScores: any,
    overallScore: number,
  ): 'low' | 'medium' | 'high' | 'critical' {
    const riskScore = 100 - categoryScores.risk
    const combinedRisk = (riskScore + (100 - overallScore)) / 2

    if (combinedRisk >= 80) return 'critical'
    if (combinedRisk >= 60) return 'high'
    if (combinedRisk >= 40) return 'medium'
    return 'low'
  }

  private identifyKeyFactors(
    scenario: DecisionScenario,
    framework: BidNoBidFramework,
    categoryScores: any,
  ) {
    const positive: string[] = []
    const negative: string[] = []
    const neutral: string[] = []

    Object.entries(categoryScores).forEach(([category, score]) => {
      if (score >= 70) {
        positive.push(
          `┘é┘ê╪ر ┘┘è ${this.translateCategory(category)} / Strong ${category} performance`,
        )
      } else if (score <= 30) {
        negative.push(
          `╪╢╪╣┘ ┘┘è ${this.translateCategory(category)} / Weak ${category} performance`,
        )
      } else {
        neutral.push(
          `╪ث╪»╪د╪ة ┘à╪ز┘ê╪│╪╖ ┘┘è ${this.translateCategory(category)} / Average ${category} performance`,
        )
      }
    })

    return { positive, negative, neutral }
  }

  private identifyCriticalIssues(
    scenario: DecisionScenario,
    framework: BidNoBidFramework,
    categoryScores: any,
  ): string[] {
    const issues: string[] = []

    if (categoryScores.financial < 40) {
      issues.push(
        '┘à╪«╪د┘ê┘ ┘à╪د┘┘è╪ر ┘â╪ذ┘è╪▒╪ر ╪ز╪ز╪╖┘╪ذ ┘à╪▒╪د╪ش╪╣╪ر / Significant financial concerns requiring review',
      )
    }

    if (categoryScores.risk < 30) {
      issues.push(
        '┘à╪│╪ز┘ê┘ë ┘à╪«╪د╪╖╪▒ ╪╣╪د┘┘è ┘è╪ز╪╖┘╪ذ ╪د╪│╪ز╪▒╪د╪ز┘è╪ش┘è╪ر ╪ز╪«┘┘è┘ / High risk level requiring mitigation strategy',
      )
    }

    if (categoryScores.operational < 35) {
      issues.push(
        '╪ز╪ص╪»┘è╪د╪ز ╪ز╪┤╪║┘è┘┘è╪ر ┘é╪» ╪ز╪ج╪س╪▒ ╪╣┘┘ë ╪د┘╪ز┘┘┘è╪░ / Operational challenges may impact execution',
      )
    }

    return issues
  }

  private identifyOpportunities(
    scenario: DecisionScenario,
    framework: BidNoBidFramework,
    categoryScores: any,
  ): string[] {
    const opportunities: string[] = []

    if (categoryScores.market > 70) {
      opportunities.push(
        '┘╪▒╪╡╪ر ╪│┘ê┘é┘è╪ر ┘à┘à╪ز╪د╪▓╪ر ┘┘┘┘à┘ê / Excellent market opportunity for growth',
      )
    }

    if (categoryScores.strategic > 75) {
      opportunities.push(
        '╪ز┘ê╪د┘┘é ╪د╪│╪ز╪▒╪د╪ز┘è╪ش┘è ┘é┘ê┘è ┘à╪╣ ╪ث┘ç╪»╪د┘ ╪د┘╪┤╪▒┘â╪ر / Strong strategic alignment with company goals',
      )
    }

    if (categoryScores.financial > 80) {
      opportunities.push(
        '╪╣╪د╪خ╪» ┘à╪د┘┘è ┘à╪ش╪▓┘è ┘à╪ز┘ê┘é╪╣ / Attractive financial returns expected',
      )
    }

    return opportunities
  }

  private identifyThreats(
    scenario: DecisionScenario,
    framework: BidNoBidFramework,
    categoryScores: any,
  ): string[] {
    const threats: string[] = []

    if (categoryScores.market < 40) {
      threats.push('╪╕╪▒┘ê┘ ╪د┘╪│┘ê┘é ╪║┘è╪▒ ┘à┘ê╪د╪ز┘è╪ر / Unfavorable market conditions')
    }

    if (categoryScores.risk < 35) {
      threats.push(
        '┘à╪«╪د╪╖╪▒ ╪╣╪د┘┘è╪ر ┘é╪» ╪ز╪ج╪س╪▒ ╪╣┘┘ë ╪د┘┘╪ش╪د╪ص / High risks may impact success',
      )
    }

    return threats
  }

  private identifyAssumptions(scenario: DecisionScenario, framework: BidNoBidFramework): string[] {
    return [
      '╪د┘╪ز╪▒╪د╪╢ ╪د╪│╪ز┘é╪▒╪د╪▒ ╪د┘╪╕╪▒┘ê┘ ╪د┘╪د┘é╪ز╪╡╪د╪»┘è╪ر / Assumption of stable economic conditions',
      '╪د┘╪ز╪▒╪د╪╢ ╪ز┘ê┘╪▒ ╪د┘┘à┘ê╪د╪▒╪» ╪د┘┘à╪╖┘┘ê╪ذ╪ر / Assumption of required resources availability',
      '╪د┘╪ز╪▒╪د╪╢ ╪╣╪»┘à ╪ز╪║┘è┘è╪▒ ┘à╪ز╪╖┘╪ذ╪د╪ز ╪د┘┘à╪┤╪▒┘ê╪╣ / Assumption of no major project requirement changes',
    ]
  }

  private translateCategory(category: string): string {
    const translations: Record<string, string> = {
      financial: '╪د┘┘à╪د┘┘è╪ر',
      strategic: '╪د┘╪د╪│╪ز╪▒╪د╪ز┘è╪ش┘è╪ر',
      operational: '╪د┘╪ز╪┤╪║┘è┘┘è╪ر',
      risk: '╪د┘┘à╪«╪د╪╖╪▒',
      market: '╪د┘╪│┘ê┘é',
    }
    return translations[category] || category
  }

  // Scenario Comparison
  async compareScenarios(scenarioIds: string[]): Promise<ScenarioComparison> {
    try {
      if (scenarioIds.length < 2) {
        throw new Error('At least 2 scenarios are required for comparison')
      }

      const scenarios = await Promise.all(scenarioIds.map((id) => this.getScenario(id)))

      const validScenarios = scenarios.filter((s) => s !== null) as DecisionScenario[]

      if (validScenarios.length < 2) {
        throw new Error('At least 2 valid scenarios are required for comparison')
      }

      // Create comparison matrix
      const comparisonMatrix = this.createComparisonMatrix(validScenarios)

      // Generate insights
      const insights = this.generateComparisonInsights(validScenarios, comparisonMatrix)

      // Generate recommendations
      const recommendations = this.generateComparisonRecommendations(
        validScenarios,
        comparisonMatrix,
      )

      const comparison: ScenarioComparison = {
        id: `comparison_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `┘à┘é╪د╪▒┘╪ر ╪د┘╪│┘è┘╪د╪▒┘è┘ê┘ç╪د╪ز ${new Date().toLocaleDateString('ar-SA')}`,
        description: `┘à┘é╪د╪▒┘╪ر ╪┤╪د┘à┘╪ر ╪ذ┘è┘ ${validScenarios.length} ╪│┘è┘╪د╪▒┘è┘ê┘ç╪د╪ز`,
        scenarios: validScenarios.map((s) => s.id),
        comparisonMatrix,
        insights,
        recommendations,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Save comparison
      const comparisons = await asyncStorage.getItem(this.COMPARISONS_KEY, [])
      comparisons.push(comparison)
      await asyncStorage.setItem(this.COMPARISONS_KEY, comparisons)

      return comparison
    } catch (error) {
      console.error('Error comparing scenarios:', error)
      throw new Error('Failed to compare scenarios')
    }
  }

  private createComparisonMatrix(scenarios: DecisionScenario[]): ComparisonMatrix {
    const criteria = ['financial', 'strategic', 'operational', 'risk', 'market']

    const matrixScenarios = scenarios.map((scenario) => ({
      id: scenario.id,
      name: scenario.name,
      scores: criteria.map(
        (criterion) =>
          scenario.analysisResults.categoryScores[
            criterion as keyof typeof scenario.analysisResults.categoryScores
          ],
      ),
      overallScore: scenario.analysisResults.overallScore,
      recommendation: scenario.analysisResults.recommendation,
    }))

    // Calculate weighted scores (assuming equal weights for simplicity)
    const weightedScores = matrixScenarios.map(
      (scenario) => scenario.scores.map((score) => score * 0.2), // Equal weights of 20% each
    )

    // Calculate rankings
    const rankings = matrixScenarios
      .map((scenario, index) => ({
        scenarioId: scenario.id,
        rank: 0,
        score: scenario.overallScore,
      }))
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }))

    return {
      criteria,
      scenarios: matrixScenarios,
      weightedScores,
      rankings,
    }
  }

  private generateComparisonInsights(
    scenarios: DecisionScenario[],
    matrix: ComparisonMatrix,
  ): ComparisonInsight[] {
    const insights: ComparisonInsight[] = []

    // Find best performing scenario
    const bestScenario = matrix.rankings[0]
    insights.push({
      type: 'strength',
      category: 'overall',
      description: `╪د┘╪│┘è┘╪د╪▒┘è┘ê ╪د┘╪ث┘╪╢┘ ╪ث╪»╪د╪ة┘ï ╪ذ┘╪ز┘è╪ش╪ر ${bestScenario.score}`,
      impact: 'high',
      confidence: 90,
      affectedScenarios: [bestScenario.scenarioId],
    })

    // Find category leaders
    matrix.criteria.forEach((criterion, criterionIndex) => {
      const bestInCategory = matrix.scenarios.reduce((best, current) =>
        current.scores[criterionIndex] > best.scores[criterionIndex] ? current : best,
      )

      insights.push({
        type: 'opportunity',
        category: criterion,
        description: `╪ث┘╪╢┘ ╪ث╪»╪د╪ة ┘┘è ${this.translateCategory(criterion)}: ${bestInCategory.name}`,
        impact: 'medium',
        confidence: 85,
        affectedScenarios: [bestInCategory.id],
      })
    })

    return insights
  }

  private generateComparisonRecommendations(
    scenarios: DecisionScenario[],
    matrix: ComparisonMatrix,
  ): string[] {
    const recommendations: string[] = []

    const topScenario = matrix.rankings[0]
    recommendations.push(
      `┘è┘┘╪╡╪ص ╪ذ╪د┘╪ز╪▒┘â┘è╪▓ ╪╣┘┘ë ╪د┘╪│┘è┘╪د╪▒┘è┘ê ╪د┘╪ث╪╣┘┘ë ╪ز┘é┘è┘è┘à╪د┘ï (╪د┘┘à╪▒╪ز╪ذ╪ر ${topScenario.rank})`,
    )

    if (matrix.rankings.length > 2) {
      recommendations.push(
        '┘à╪▒╪د╪ش╪╣╪ر ╪د┘╪│┘è┘╪د╪▒┘è┘ê┘ç╪د╪ز ┘à┘╪«┘╪╢╪ر ╪د┘╪ث╪»╪د╪ة ┘╪ز╪ص╪»┘è╪» ┘╪▒╪╡ ╪د┘╪ز╪ص╪│┘è┘',
      )
    }

    recommendations.push(
      '╪ح╪ش╪▒╪د╪ة ╪ز╪ص┘┘è┘ ╪ص╪│╪د╪│┘è╪ر ┘┘╪╣┘ê╪د┘à┘ ╪د┘╪ص╪▒╪ش╪ر ┘┘è ╪د┘╪│┘è┘╪د╪▒┘è┘ê┘ç╪د╪ز ╪د┘┘à╪«╪ز╪د╪▒╪ر',
    )

    return recommendations
  }

  async generateRecommendations(scenarioId: string): Promise<DecisionRecommendation[]> {
    try {
      const scenario = await this.getScenario(scenarioId)
      if (!scenario) {
        throw new Error(`Scenario with id ${scenarioId} not found`)
      }

      const recommendations: DecisionRecommendation[] = []
      const analysis = scenario.analysisResults

      // Primary recommendation based on analysis
      const primaryRec: DecisionRecommendation = {
        id: `rec_primary_${Date.now()}`,
        type: 'primary',
        action: this.getActionFromRecommendation(analysis.recommendation),
        rationale: this.generateRationale(analysis),
        priority: 'high',
        timeline: this.getTimelineFromRecommendation(analysis.recommendation),
        expectedOutcome: this.getExpectedOutcome(analysis),
        requiredResources: this.getRequiredResources(analysis),
        riskMitigation: this.getRiskMitigation(analysis),
        successMetrics: this.getSuccessMetrics(analysis),
        conditions: this.getConditions(analysis),
      }
      recommendations.push(primaryRec)

      // Alternative recommendations
      if (analysis.recommendation === 'conditional_bid') {
        const alternativeRec: DecisionRecommendation = {
          id: `rec_alt_${Date.now()}`,
          type: 'alternative',
          action: '╪ح╪ش╪▒╪د╪ة ╪ز╪ص┘┘è┘ ╪ح╪╢╪د┘┘è ┘é╪ذ┘ ╪د╪ز╪«╪د╪░ ╪د┘┘é╪▒╪د╪▒ ╪د┘┘┘ç╪د╪خ┘è',
          rationale: '╪د┘┘╪ز┘è╪ش╪ر ┘┘è ╪د┘┘à┘╪╖┘é╪ر ╪د┘╪ص╪»┘è╪ر ╪ز╪ز╪╖┘╪ذ ┘à╪▒╪د╪ش╪╣╪ر ╪ح╪╢╪د┘┘è╪ر',
          priority: 'medium',
          timeline: '╪ث╪│╪ذ┘ê╪╣ ┘ê╪د╪ص╪»',
          expectedOutcome: '┘é╪▒╪د╪▒ ╪ث┘â╪س╪▒ ╪»┘é╪ر ┘ê┘ê╪╢┘ê╪ص╪د┘ï',
          requiredResources: ['┘╪▒┘è┘é ╪د┘╪ز╪ص┘┘è┘', '╪ذ┘è╪د┘╪د╪ز ╪ح╪╢╪د┘┘è╪ر'],
          riskMitigation: ['┘à╪▒╪د╪ش╪╣╪ر ╪د┘╪د┘╪ز╪▒╪د╪╢╪د╪ز', '╪ز╪ص┘┘è┘ ╪د┘╪ص╪│╪د╪│┘è╪ر'],
          successMetrics: ['┘ê╪╢┘ê╪ص ╪د┘┘é╪▒╪د╪▒', '╪س┘é╪ر ╪ث╪╣┘┘ë ┘┘è ╪د┘┘╪ز┘è╪ش╪ر'],
          conditions: ['╪ز┘ê┘╪▒ ╪د┘╪ذ┘è╪د┘╪د╪ز ╪د┘┘à╪╖┘┘ê╪ذ╪ر', '╪د┘┘ê┘é╪ز ╪د┘┘â╪د┘┘è ┘┘╪ز╪ص┘┘è┘'],
        }
        recommendations.push(alternativeRec)
      }

      return recommendations
    } catch (error) {
      console.error('Error generating recommendations:', error)
      throw new Error('Failed to generate recommendations')
    }
  }

  // Template Management
  async createTemplate(
    template: Omit<ScenarioTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>,
  ): Promise<ScenarioTemplate> {
    try {
      const newTemplate: ScenarioTemplate = {
        ...template,
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0,
      }

      const templates = await this.getTemplates()
      templates.push(newTemplate)
      await asyncStorage.setItem(this.TEMPLATES_KEY, templates)

      return newTemplate
    } catch (error) {
      console.error('Error creating template:', error)
      throw new Error('Failed to create scenario template')
    }
  }

  async getTemplates(category?: string): Promise<ScenarioTemplate[]> {
    try {
      let templates = await asyncStorage.getItem(this.TEMPLATES_KEY, [])

      if (category) {
        templates = templates.filter((t) => t.category === category)
      }

      return templates
    } catch (error) {
      console.error('Error loading templates:', error)
      return []
    }
  }

  async applyTemplate(templateId: string, scenarioId: string): Promise<DecisionScenario> {
    try {
      const template = await this.getTemplateById(templateId)
      const scenario = await this.getScenario(scenarioId)

      if (!template) {
        throw new Error(`Template with id ${templateId} not found`)
      }

      if (!scenario) {
        throw new Error(`Scenario with id ${scenarioId} not found`)
      }

      // Apply template values to scenario
      const updatedScenario = await this.updateScenario(scenarioId, {
        criteriaValues: {
          ...scenario.criteriaValues,
          ...template.defaultValues,
        },
      })

      // Increment template usage count
      await this.incrementTemplateUsage(templateId)

      return updatedScenario
    } catch (error) {
      console.error('Error applying template:', error)
      throw new Error('Failed to apply template')
    }
  }

  private async getTemplateById(id: string): Promise<ScenarioTemplate | null> {
    const templates = await this.getTemplates()
    return templates.find((t) => t.id === id) || null
  }

  private async incrementTemplateUsage(templateId: string): Promise<void> {
    const templates = await this.getTemplates()
    const index = templates.findIndex((t) => t.id === templateId)

    if (index !== -1) {
      templates[index].usageCount += 1
      templates[index].updatedAt = new Date().toISOString()
      await asyncStorage.setItem(this.TEMPLATES_KEY, templates)
    }
  }

  // Decision History and Analytics
  async recordDecision(history: Omit<DecisionHistory, 'id'>): Promise<DecisionHistory> {
    try {
      const newHistory: DecisionHistory = {
        ...history,
        id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }

      const historyRecords = await this.getDecisionHistory()
      historyRecords.push(newHistory)
      await asyncStorage.setItem(this.HISTORY_KEY, historyRecords)

      return newHistory
    } catch (error) {
      console.error('Error recording decision:', error)
      throw new Error('Failed to record decision history')
    }
  }

  async getDecisionAnalytics(filters?: AnalyticsFilters): Promise<DecisionAnalytics> {
    try {
      const history = await this.getDecisionHistory(filters)

      const totalDecisions = history.length
      const bidDecisions = history.filter((h) => h.decision === 'bid').length
      const noBidDecisions = history.filter((h) => h.decision === 'no_bid').length
      const conditionalDecisions = history.filter((h) => h.decision === 'conditional_bid').length

      // Calculate win rate (only for decisions that have outcomes)
      const decisionsWithOutcome = history.filter((h) => h.outcome && h.outcome !== 'pending')
      const wonDecisions = decisionsWithOutcome.filter((h) => h.outcome === 'won').length
      const winRate =
        decisionsWithOutcome.length > 0 ? (wonDecisions / decisionsWithOutcome.length) * 100 : 0

      // Calculate average accuracy
      const decisionsWithAccuracy = history.filter((h) => h.accuracy !== undefined)
      const averageAccuracy =
        decisionsWithAccuracy.length > 0
          ? decisionsWithAccuracy.reduce((sum, h) => sum + h.accuracy, 0) /
            decisionsWithAccuracy.length
          : 0

      // Category performance (placeholder - would need more detailed data)
      const categoryPerformance = {
        financial: 75,
        strategic: 80,
        operational: 70,
        risk: 65,
        market: 85,
      }

      // Trend analysis (last 6 months)
      const trendAnalysis = this.calculateTrendAnalysis(history)

      // Improvement areas
      const improvementAreas = this.identifyImprovementAreas(history, categoryPerformance)

      return {
        totalDecisions,
        bidDecisions,
        noBidDecisions,
        conditionalDecisions,
        winRate,
        averageAccuracy,
        categoryPerformance,
        trendAnalysis,
        improvementAreas,
      }
    } catch (error) {
      console.error('Error getting decision analytics:', error)
      throw new Error('Failed to get decision analytics')
    }
  }

  async getDecisionHistory(filters?: HistoryFilters): Promise<DecisionHistory[]> {
    try {
      let history = await asyncStorage.getItem(this.HISTORY_KEY, [])

      if (!filters) {
        return history
      }

      // Apply filters
      if (filters.scenarioId) {
        history = history.filter((h) => h.scenarioId === filters.scenarioId)
      }

      if (filters.decision && filters.decision.length > 0) {
        history = history.filter((h) => filters.decision!.includes(h.decision))
      }

      if (filters.outcome && filters.outcome.length > 0) {
        history = history.filter((h) => h.outcome && filters.outcome!.includes(h.outcome))
      }

      if (filters.dateRange) {
        const startDate = new Date(filters.dateRange.start)
        const endDate = new Date(filters.dateRange.end)
        history = history.filter((h) => {
          const decisionDate = new Date(h.decisionDate)
          return decisionDate >= startDate && decisionDate <= endDate
        })
      }

      return history
    } catch (error) {
      console.error('Error loading decision history:', error)
      return []
    }
  }

  private calculateTrendAnalysis(history: DecisionHistory[]) {
    const trends = []
    const now = new Date()

    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

      const monthHistory = history.filter((h) => {
        const decisionDate = new Date(h.decisionDate)
        return decisionDate >= monthStart && decisionDate <= monthEnd
      })

      const monthDecisions = monthHistory.length
      const monthAccuracy =
        monthHistory.length > 0
          ? monthHistory.reduce((sum, h) => sum + (h.accuracy || 0), 0) / monthHistory.length
          : 0

      const monthWins = monthHistory.filter((h) => h.outcome === 'won').length
      const monthWinRate = monthHistory.length > 0 ? (monthWins / monthHistory.length) * 100 : 0

      trends.unshift({
        period: monthStart.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' }),
        decisions: monthDecisions,
        accuracy: monthAccuracy,
        winRate: monthWinRate,
      })
    }

    return trends
  }

  private identifyImprovementAreas(
    history: DecisionHistory[],
    categoryPerformance: Record<string, number>,
  ): string[] {
    const areas: string[] = []

    // Find lowest performing categories
    const sortedCategories = Object.entries(categoryPerformance).sort(([, a], [, b]) => a - b)

    if (sortedCategories[0][1] < 70) {
      areas.push(`╪ز╪ص╪│┘è┘ ╪ث╪»╪د╪ة ${this.translateCategory(sortedCategories[0][0])}`)
    }

    // Check accuracy trends
    const recentHistory = history.slice(-10)
    const recentAccuracy =
      recentHistory.length > 0
        ? recentHistory.reduce((sum, h) => sum + (h.accuracy || 0), 0) / recentHistory.length
        : 0

    if (recentAccuracy < 75) {
      areas.push('╪ز╪ص╪│┘è┘ ╪»┘é╪ر ╪د┘╪ز┘╪ذ╪ج╪د╪ز ┘ê╪د┘╪ز╪ص┘┘è┘')
    }

    // Check win rate
    const recentWins = recentHistory.filter((h) => h.outcome === 'won').length
    const recentWinRate = recentHistory.length > 0 ? (recentWins / recentHistory.length) * 100 : 0

    if (recentWinRate < 60) {
      areas.push('╪ز╪ص╪│┘è┘ ╪د╪│╪ز╪▒╪د╪ز┘è╪ش┘è╪ر ╪د╪«╪ز┘è╪د╪▒ ╪د┘┘à┘╪د┘é╪╡╪د╪ز')
    }

    return areas
  }

  // Validation and Utilities
  async validateFramework(framework: BidNoBidFramework): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    // Check weighting scheme
    const { total, ...weights } = framework.weightingScheme
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0)
    if (Math.abs(totalWeight - 100) > 0.01) {
      errors.push(
        `┘à╪ش┘à┘ê╪╣ ╪د┘╪ث┘ê╪▓╪د┘ ┘è╪ش╪ذ ╪ث┘ ┘è╪│╪د┘ê┘è 100% (╪د┘╪ص╪د┘┘è: ${totalWeight}%)`,
      )
    }

    // Check criteria
    if (framework.criteria.length === 0) {
      errors.push('┘è╪ش╪ذ ╪ح╪╢╪د┘╪ر ┘à╪╣╪د┘è┘è╪▒ ┘┘╪ز┘é┘è┘è┘à')
    }

    // Check thresholds
    if (framework.thresholds.bidThreshold <= framework.thresholds.noBidThreshold) {
      errors.push('╪ص╪» ╪د┘┘à┘╪د┘é╪╡╪ر ┘è╪ش╪ذ ╪ث┘ ┘è┘â┘ê┘ ╪ث╪╣┘┘ë ┘à┘ ╪ص╪» ╪╣╪»┘à ╪د┘┘à┘╪د┘é╪╡╪ر')
    }

    // Warnings
    if (framework.criteria.length < 5) {
      warnings.push(
        '┘è┘┘╪╡╪ص ╪ذ╪ح╪╢╪د┘╪ر ╪د┘┘à╪▓┘è╪» ┘à┘ ╪د┘┘à╪╣╪د┘è┘è╪▒ ┘┘╪ص╪╡┘ê┘ ╪╣┘┘ë ╪ز┘é┘è┘è┘à ╪┤╪د┘à┘',
      )
    }

    // Suggestions
    if (framework.criteria.filter((c) => c.category === 'risk').length === 0) {
      suggestions.push('╪ح╪╢╪د┘╪ر ┘à╪╣╪د┘è┘è╪▒ ╪ز┘é┘è┘è┘à ╪د┘┘à╪«╪د╪╖╪▒')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    }
  }

  async exportScenario(scenarioId: string, format: 'json' | 'csv' | 'pdf'): Promise<string> {
    try {
      const scenario = await this.getScenario(scenarioId)
      if (!scenario) {
        throw new Error(`Scenario with id ${scenarioId} not found`)
      }

      switch (format) {
        case 'json':
          return JSON.stringify(scenario, null, 2)

        case 'csv':
          return this.convertScenarioToCSV(scenario)

        case 'pdf':
          return this.generateScenarioPDFReport(scenario)

        default:
          throw new Error(`Unsupported export format: ${format}`)
      }
    } catch (error) {
      console.error('Error exporting scenario:', error)
      throw new Error('Failed to export scenario')
    }
  }

  async importScenario(data: string, format: 'json' | 'csv'): Promise<DecisionScenario> {
    try {
      let scenarioData: any

      switch (format) {
        case 'json':
          scenarioData = JSON.parse(data)
          break

        case 'csv':
          scenarioData = this.parseCSVToScenario(data)
          break

        default:
          throw new Error(`Unsupported import format: ${format}`)
      }

      // Create new scenario from imported data
      const newScenario = await this.createScenario({
        name: scenarioData.name || '╪│┘è┘╪د╪▒┘è┘ê ┘à╪│╪ز┘ê╪▒╪»',
        nameEn: scenarioData.nameEn,
        description:
          scenarioData.description || '╪│┘è┘╪د╪▒┘è┘ê ╪ز┘à ╪د╪│╪ز┘è╪▒╪د╪»┘ç ┘à┘ ┘à┘┘ ╪«╪د╪▒╪ش┘è',
        projectId: scenarioData.projectId || 'imported',
        projectName: scenarioData.projectName || '┘à╪┤╪▒┘ê╪╣ ┘à╪│╪ز┘ê╪▒╪»',
        tenderId: scenarioData.tenderId,
        tenderName: scenarioData.tenderName,
        createdBy: 'system',
        status: 'draft',
        criteriaValues: scenarioData.criteriaValues || {},
        recommendations: [],
        confidenceScore: 0,
        lastAnalyzed: new Date().toISOString(),
      })

      return newScenario
    } catch (error) {
      console.error('Error importing scenario:', error)
      throw new Error('Failed to import scenario')
    }
  }

  private convertScenarioToCSV(scenario: DecisionScenario): string {
    let csv = 'Field,Value\n'
    csv += `Name,${scenario.name || ''}\n`
    csv += `Project,${scenario.projectName || ''}\n`
    csv += `Status,${scenario.status || ''}\n`
    csv += `Created,${scenario.createdAt || ''}\n`
    csv += `Overall Score,${scenario.analysisResults?.overallScore || 0}\n`
    csv += `Recommendation,${scenario.analysisResults?.recommendation || ''}\n`
    csv += `Risk Level,${scenario.analysisResults?.riskLevel || ''}\n`
    csv += `Financial Score,${scenario.analysisResults?.categoryScores?.financial || 0}\n`
    csv += `Strategic Score,${scenario.analysisResults?.categoryScores?.strategic || 0}\n`
    csv += `Operational Score,${scenario.analysisResults?.categoryScores?.operational || 0}\n`
    csv += `Risk Score,${scenario.analysisResults?.categoryScores?.risk || 0}\n`
    csv += `Market Score,${scenario.analysisResults?.categoryScores?.market || 0}\n`
    csv += `Confidence Score,${scenario.confidenceScore || 0}\n`

    return csv
  }

  private generateScenarioPDFReport(scenario: DecisionScenario): string {
    // For now, return a formatted text report
    // In a real implementation, this would generate actual PDF content
    let report = `# ╪ز┘é╪▒┘è╪▒ ╪د┘╪│┘è┘╪د╪▒┘è┘ê / Scenario Report\n\n`
    report += `**╪د┘╪د╪│┘à / Name:** ${scenario.name}\n`
    report += `**╪د┘┘à╪┤╪▒┘ê╪╣ / Project:** ${scenario.projectName}\n`
    report += `**╪د┘╪ص╪د┘╪ر / Status:** ${scenario.status}\n`
    report += `**╪ز╪د╪▒┘è╪« ╪د┘╪ح┘╪┤╪د╪ة / Created:** ${scenario.createdAt}\n\n`

    report += `## ┘╪ز╪د╪خ╪ش ╪د┘╪ز╪ص┘┘è┘ / Analysis Results\n\n`
    report += `**╪د┘┘╪ز┘è╪ش╪ر ╪د┘╪ح╪ش┘à╪د┘┘è╪ر / Overall Score:** ${scenario.analysisResults?.overallScore || 0}\n`
    report += `**╪د┘╪ز┘ê╪╡┘è╪ر / Recommendation:** ${scenario.analysisResults?.recommendation || 'N/A'}\n`
    report += `**┘à╪│╪ز┘ê┘ë ╪د┘┘à╪«╪د╪╖╪▒ / Risk Level:** ${scenario.analysisResults?.riskLevel || 'N/A'}\n\n`

    report += `## ┘╪ز╪د╪خ╪ش ╪د┘┘╪خ╪د╪ز / Category Scores\n\n`
    if (scenario.analysisResults?.categoryScores) {
      Object.entries(scenario.analysisResults.categoryScores).forEach(([category, score]) => {
        report += `**${this.translateCategory(category)}:** ${score}\n`
      })
    }

    return report
  }

  private parseCSVToScenario(csvData: string): any {
    const lines = csvData.split('\n')
    const data: any = {}

    lines.forEach((line) => {
      const [key, value] = line.split(',')
      if (key && value) {
        data[key.trim()] = value.trim()
      }
    })

    return {
      name: data.Name || '╪│┘è┘╪د╪▒┘è┘ê ┘à╪│╪ز┘ê╪▒╪»',
      projectName: data.Project || '┘à╪┤╪▒┘ê╪╣ ┘à╪│╪ز┘ê╪▒╪»',
      description: '╪│┘è┘╪د╪▒┘è┘ê ╪ز┘à ╪د╪│╪ز┘è╪▒╪د╪»┘ç ┘à┘ ┘à┘┘ CSV',
      criteriaValues: {},
    }
  }

  // Helper methods for recommendation generation
  private getActionFromRecommendation(recommendation: string): string {
    const actions = {
      bid: '╪د┘┘à╪┤╪د╪▒┘â╪ر ┘┘è ╪د┘┘à┘╪د┘é╪╡╪ر',
      no_bid: '╪╣╪»┘à ╪د┘┘à╪┤╪د╪▒┘â╪ر ┘┘è ╪د┘┘à┘╪د┘é╪╡╪ر',
      conditional_bid: '╪د┘┘à╪┤╪د╪▒┘â╪ر ╪د┘┘à╪┤╪▒┘ê╪╖╪ر ┘┘è ╪د┘┘à┘╪د┘é╪╡╪ر',
    }
    return actions[recommendation as keyof typeof actions] || '┘à╪▒╪د╪ش╪╣╪ر ╪ح╪╢╪د┘┘è╪ر ┘à╪╖┘┘ê╪ذ╪ر'
  }

  private generateRationale(analysis: ScenarioAnalysis): string {
    return `╪ذ┘╪د╪ة┘ï ╪╣┘┘ë ╪د┘╪ز╪ص┘┘è┘ ╪د┘╪┤╪د┘à┘╪î ╪د┘┘╪ز┘è╪ش╪ر ╪د┘╪ح╪ش┘à╪د┘┘è╪ر ${analysis.overallScore} ┘ê┘à╪│╪ز┘ê┘ë ╪د┘┘à╪«╪د╪╖╪▒ ${analysis.riskLevel}`
  }

  private getTimelineFromRecommendation(recommendation: string): string {
    const timelines = {
      bid: '┘┘ê╪▒┘è - ╪د┘╪ذ╪»╪ة ┘┘è ╪ح╪╣╪»╪د╪» ╪د┘╪╣╪▒╪╢',
      no_bid: '┘┘ê╪▒┘è - ╪ح╪┤╪╣╪د╪▒ ╪╣╪»┘à ╪د┘┘à╪┤╪د╪▒┘â╪ر',
      conditional_bid: '╪ث╪│╪ذ┘ê╪╣ ┘ê╪د╪ص╪» - ┘à╪▒╪د╪ش╪╣╪ر ╪د┘╪┤╪▒┘ê╪╖',
    }
    return timelines[recommendation as keyof typeof timelines] || '╪ص╪│╪ذ ╪د┘╪ص╪د╪ش╪ر'
  }

  private getExpectedOutcome(analysis: ScenarioAnalysis): string {
    if (analysis.overallScore > 80) {
      return '╪د╪ص╪ز┘à╪د┘┘è╪ر ╪╣╪د┘┘è╪ر ┘┘┘╪ش╪د╪ص ┘ê╪د┘╪▒╪ذ╪ص┘è╪ر'
    } else if (analysis.overallScore > 60) {
      return '╪د╪ص╪ز┘à╪د┘┘è╪ر ┘à╪ز┘ê╪│╪╖╪ر ┘┘┘╪ش╪د╪ص ┘à╪╣ ┘à╪▒╪د┘é╪ذ╪ر ╪د┘┘à╪«╪د╪╖╪▒'
    } else {
      return '╪د╪ص╪ز┘à╪د┘┘è╪ر ┘à┘╪«┘╪╢╪ر ┘┘┘╪ش╪د╪ص - ┘è╪ز╪╖┘╪ذ ╪ز╪ص┘┘è┘ ╪ح╪╢╪د┘┘è'
    }
  }

  private getRequiredResources(analysis: ScenarioAnalysis): string[] {
    const resources = ['┘╪▒┘è┘é ╪ح╪╣╪»╪د╪» ╪د┘╪╣╪▒┘ê╪╢', '╪د┘╪ذ┘è╪د┘╪د╪ز ╪د┘┘à╪د┘┘è╪ر']

    if (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical') {
      resources.push('╪«╪ذ┘è╪▒ ╪ح╪»╪د╪▒╪ر ╪د┘┘à╪«╪د╪╖╪▒')
    }

    if (analysis.categoryScores.technical < 70) {
      resources.push('╪د╪│╪ز╪┤╪د╪▒┘è ╪ز┘é┘┘è')
    }

    return resources
  }

  private getRiskMitigation(analysis: ScenarioAnalysis): string[] {
    const mitigation = []

    if (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical') {
      mitigation.push('┘ê╪╢╪╣ ╪«╪╖╪ر ╪┤╪د┘à┘╪ر ┘╪ح╪»╪د╪▒╪ر ╪د┘┘à╪«╪د╪╖╪▒')
    }

    if (analysis.categoryScores.financial < 60) {
      mitigation.push('┘à╪▒╪د╪ش╪╣╪ر ╪د┘╪ز┘â╪د┘┘è┘ ┘ê╪د┘┘ç┘ê╪د┘à╪┤')
    }

    mitigation.push('┘à╪▒╪د┘é╪ذ╪ر ┘à╪│╪ز┘à╪▒╪ر ┘┘┘à╪ج╪┤╪▒╪د╪ز ╪د┘╪▒╪خ┘è╪│┘è╪ر')

    return mitigation
  }

  private getSuccessMetrics(analysis: ScenarioAnalysis): string[] {
    return [
      '╪ز╪ص┘é┘è┘é ╪د┘┘ç┘ê╪د┘à╪┤ ╪د┘┘à╪│╪ز┘ç╪»┘╪ر',
      '╪د┘╪د┘╪ز╪▓╪د┘à ╪ذ╪د┘╪ش╪»┘ê┘╪ر ╪د┘╪▓┘à┘┘è╪ر',
      '╪▒╪╢╪د ╪د┘╪╣┘à┘è┘',
      '╪ش┘ê╪»╪ر ╪د┘╪ز┘┘┘è╪░',
    ]
  }

  private getConditions(analysis: ScenarioAnalysis): string[] {
    const conditions = ['┘à┘ê╪د┘┘é╪ر ╪د┘╪ح╪»╪د╪▒╪ر ╪د┘╪╣┘┘è╪د']

    if (analysis.recommendation === 'conditional_bid') {
      conditions.push('┘à╪▒╪د╪ش╪╣╪ر ╪د┘╪┤╪▒┘ê╪╖ ╪د┘╪ز╪╣╪د┘é╪»┘è╪ر')
      conditions.push('╪ز╪ث┘â┘è╪» ╪ز┘ê┘╪▒ ╪د┘┘à┘ê╪د╪▒╪»')
    }

    return conditions
  }
}

// Export singleton instance
export const decisionSupportService = new DecisionSupportServiceImpl()
export default decisionSupportService
