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
  DecisionCriteria
} from '../types/decisionSupport'

class DecisionSupportServiceImpl implements DecisionSupportService {
  private readonly FRAMEWORKS_KEY = 'decision_frameworks'
  private readonly SCENARIOS_KEY = 'decision_scenarios'
  private readonly TEMPLATES_KEY = 'scenario_templates'
  private readonly HISTORY_KEY = 'decision_history'
  private readonly COMPARISONS_KEY = 'scenario_comparisons'

  // Framework Management
  async createFramework(framework: Omit<BidNoBidFramework, 'id' | 'createdAt' | 'updatedAt'>): Promise<BidNoBidFramework> {
    try {
      const newFramework: BidNoBidFramework = {
        ...framework,
        id: `framework_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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

  async updateFramework(id: string, updates: Partial<BidNoBidFramework>): Promise<BidNoBidFramework> {
    try {
      const frameworks = await this.getAllFrameworks()
      const index = frameworks.findIndex(f => f.id === id)
      
      if (index === -1) {
        throw new Error(`Framework with id ${id} not found`)
      }

      const updatedFramework = {
        ...frameworks[index],
        ...updates,
        updatedAt: new Date().toISOString()
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
      const filteredFrameworks = frameworks.filter(f => f.id !== id)
      await asyncStorage.setItem(this.FRAMEWORKS_KEY, filteredFrameworks)
    } catch (error) {
      console.error('Error deleting framework:', error)
      throw new Error('Failed to delete decision framework')
    }
  }

  async getFramework(id: string): Promise<BidNoBidFramework | null> {
    try {
      const frameworks = await this.getAllFrameworks()
      return frameworks.find(f => f.id === id) || null
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
  async createScenario(scenario: Omit<DecisionScenario, 'id' | 'createdAt' | 'updatedAt' | 'analysisResults'>): Promise<DecisionScenario> {
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
            market: 0
          },
          keyFactors: {
            positive: [],
            negative: [],
            neutral: []
          },
          criticalIssues: [],
          opportunities: [],
          threats: [],
          assumptions: []
        }
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
      const index = scenarios.findIndex(s => s.id === id)
      
      if (index === -1) {
        throw new Error(`Scenario with id ${id} not found`)
      }

      const updatedScenario = {
        ...scenarios[index],
        ...updates,
        updatedAt: new Date().toISOString()
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
      const filteredScenarios = scenarios.filter(s => s.id !== id)
      await asyncStorage.setItem(this.SCENARIOS_KEY, filteredScenarios)
    } catch (error) {
      console.error('Error deleting scenario:', error)
      throw new Error('Failed to delete decision scenario')
    }
  }

  async getScenario(id: string): Promise<DecisionScenario | null> {
    try {
      const scenarios = await this.getAllScenarios()
      return scenarios.find(s => s.id === id) || null
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
        scenarios = scenarios.filter(s => filters.status!.includes(s.status))
      }

      if (filters.projectId) {
        scenarios = scenarios.filter(s => s.projectId === filters.projectId)
      }

      if (filters.createdBy) {
        scenarios = scenarios.filter(s => s.createdBy === filters.createdBy)
      }

      if (filters.recommendation && filters.recommendation.length > 0) {
        scenarios = scenarios.filter(s => filters.recommendation!.includes(s.analysisResults.recommendation))
      }

      if (filters.dateRange) {
        const startDate = new Date(filters.dateRange.start)
        const endDate = new Date(filters.dateRange.end)
        scenarios = scenarios.filter(s => {
          const createdDate = new Date(s.createdAt)
          return createdDate >= startDate && createdDate <= endDate
        })
      }

      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase()
        scenarios = scenarios.filter(s =>
          (s.name && s.name.toLowerCase().includes(searchLower)) ||
          (s.nameEn && s.nameEn.toLowerCase().includes(searchLower)) ||
          (s.description && s.description.toLowerCase().includes(searchLower)) ||
          (s.projectName && s.projectName.toLowerCase().includes(searchLower))
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
        status: 'completed'
      })

      return analysis
    } catch (error) {
      console.error('Error analyzing scenario:', error)
      if (error instanceof Error && (error.message.includes('not found') || error.message.includes('Scenario with id') || error.message.includes('Framework with id'))) {
        throw error
      }
      throw new Error('Failed to analyze scenario')
    }
  }

  private async performScenarioAnalysis(scenario: DecisionScenario, framework: BidNoBidFramework): Promise<ScenarioAnalysis> {
    // Calculate category scores based on criteria and weights
    const categoryScores = {
      financial: this.calculateCategoryScore(scenario, framework, 'financial'),
      strategic: this.calculateCategoryScore(scenario, framework, 'strategic'),
      operational: this.calculateCategoryScore(scenario, framework, 'operational'),
      risk: this.calculateCategoryScore(scenario, framework, 'risk'),
      market: this.calculateCategoryScore(scenario, framework, 'market')
    }

    // Calculate overall weighted score
    const overallScore = (
      categoryScores.financial * framework.weightingScheme.financial +
      categoryScores.strategic * framework.weightingScheme.strategic +
      categoryScores.operational * framework.weightingScheme.operational +
      categoryScores.risk * framework.weightingScheme.risk +
      categoryScores.market * framework.weightingScheme.market
    ) / 100

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
      assumptions
    }
  }

  private calculateCategoryScore(scenario: DecisionScenario, framework: BidNoBidFramework, category: string): number {
    const categoryCriteria = framework.criteria.filter(c => c.category === category)
    if (categoryCriteria.length === 0) return 0

    let totalScore = 0
    let totalWeight = 0

    categoryCriteria.forEach(criteria => {
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

  private calculateRiskLevel(categoryScores: any, overallScore: number): 'low' | 'medium' | 'high' | 'critical' {
    const riskScore = 100 - categoryScores.risk
    const combinedRisk = (riskScore + (100 - overallScore)) / 2

    if (combinedRisk >= 80) return 'critical'
    if (combinedRisk >= 60) return 'high'
    if (combinedRisk >= 40) return 'medium'
    return 'low'
  }

  private identifyKeyFactors(scenario: DecisionScenario, framework: BidNoBidFramework, categoryScores: any) {
    const positive: string[] = []
    const negative: string[] = []
    const neutral: string[] = []

    Object.entries(categoryScores).forEach(([category, score]) => {
      if (score >= 70) {
        positive.push(`قوة في ${this.translateCategory(category)} / Strong ${category} performance`)
      } else if (score <= 30) {
        negative.push(`ضعف في ${this.translateCategory(category)} / Weak ${category} performance`)
      } else {
        neutral.push(`أداء متوسط في ${this.translateCategory(category)} / Average ${category} performance`)
      }
    })

    return { positive, negative, neutral }
  }

  private identifyCriticalIssues(scenario: DecisionScenario, framework: BidNoBidFramework, categoryScores: any): string[] {
    const issues: string[] = []

    if (categoryScores.financial < 40) {
      issues.push('مخاوف مالية كبيرة تتطلب مراجعة / Significant financial concerns requiring review')
    }

    if (categoryScores.risk < 30) {
      issues.push('مستوى مخاطر عالي يتطلب استراتيجية تخفيف / High risk level requiring mitigation strategy')
    }

    if (categoryScores.operational < 35) {
      issues.push('تحديات تشغيلية قد تؤثر على التنفيذ / Operational challenges may impact execution')
    }

    return issues
  }

  private identifyOpportunities(scenario: DecisionScenario, framework: BidNoBidFramework, categoryScores: any): string[] {
    const opportunities: string[] = []

    if (categoryScores.market > 70) {
      opportunities.push('فرصة سوقية ممتازة للنمو / Excellent market opportunity for growth')
    }

    if (categoryScores.strategic > 75) {
      opportunities.push('توافق استراتيجي قوي مع أهداف الشركة / Strong strategic alignment with company goals')
    }

    if (categoryScores.financial > 80) {
      opportunities.push('عائد مالي مجزي متوقع / Attractive financial returns expected')
    }

    return opportunities
  }

  private identifyThreats(scenario: DecisionScenario, framework: BidNoBidFramework, categoryScores: any): string[] {
    const threats: string[] = []

    if (categoryScores.market < 40) {
      threats.push('ظروف السوق غير مواتية / Unfavorable market conditions')
    }

    if (categoryScores.risk < 35) {
      threats.push('مخاطر عالية قد تؤثر على النجاح / High risks may impact success')
    }

    return threats
  }

  private identifyAssumptions(scenario: DecisionScenario, framework: BidNoBidFramework): string[] {
    return [
      'افتراض استقرار الظروف الاقتصادية / Assumption of stable economic conditions',
      'افتراض توفر الموارد المطلوبة / Assumption of required resources availability',
      'افتراض عدم تغيير متطلبات المشروع / Assumption of no major project requirement changes'
    ]
  }

  private translateCategory(category: string): string {
    const translations: Record<string, string> = {
      financial: 'المالية',
      strategic: 'الاستراتيجية',
      operational: 'التشغيلية',
      risk: 'المخاطر',
      market: 'السوق'
    }
    return translations[category] || category
  }

  // Scenario Comparison
  async compareScenarios(scenarioIds: string[]): Promise<ScenarioComparison> {
    try {
      if (scenarioIds.length < 2) {
        throw new Error('At least 2 scenarios are required for comparison')
      }

      const scenarios = await Promise.all(
        scenarioIds.map(id => this.getScenario(id))
      )

      const validScenarios = scenarios.filter(s => s !== null) as DecisionScenario[]

      if (validScenarios.length < 2) {
        throw new Error('At least 2 valid scenarios are required for comparison')
      }

      // Create comparison matrix
      const comparisonMatrix = this.createComparisonMatrix(validScenarios)

      // Generate insights
      const insights = this.generateComparisonInsights(validScenarios, comparisonMatrix)

      // Generate recommendations
      const recommendations = this.generateComparisonRecommendations(validScenarios, comparisonMatrix)

      const comparison: ScenarioComparison = {
        id: `comparison_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `مقارنة السيناريوهات ${new Date().toLocaleDateString('ar-SA')}`,
        description: `مقارنة شاملة بين ${validScenarios.length} سيناريوهات`,
        scenarios: validScenarios.map(s => s.id),
        comparisonMatrix,
        insights,
        recommendations,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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

    const matrixScenarios = scenarios.map(scenario => ({
      id: scenario.id,
      name: scenario.name,
      scores: criteria.map(criterion => scenario.analysisResults.categoryScores[criterion as keyof typeof scenario.analysisResults.categoryScores]),
      overallScore: scenario.analysisResults.overallScore,
      recommendation: scenario.analysisResults.recommendation
    }))

    // Calculate weighted scores (assuming equal weights for simplicity)
    const weightedScores = matrixScenarios.map(scenario =>
      scenario.scores.map(score => score * 0.2) // Equal weights of 20% each
    )

    // Calculate rankings
    const rankings = matrixScenarios
      .map((scenario, index) => ({
        scenarioId: scenario.id,
        rank: 0,
        score: scenario.overallScore
      }))
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }))

    return {
      criteria,
      scenarios: matrixScenarios,
      weightedScores,
      rankings
    }
  }

  private generateComparisonInsights(scenarios: DecisionScenario[], matrix: ComparisonMatrix): ComparisonInsight[] {
    const insights: ComparisonInsight[] = []

    // Find best performing scenario
    const bestScenario = matrix.rankings[0]
    insights.push({
      type: 'strength',
      category: 'overall',
      description: `السيناريو الأفضل أداءً بنتيجة ${bestScenario.score}`,
      impact: 'high',
      confidence: 90,
      affectedScenarios: [bestScenario.scenarioId]
    })

    // Find category leaders
    matrix.criteria.forEach((criterion, criterionIndex) => {
      const bestInCategory = matrix.scenarios.reduce((best, current) =>
        current.scores[criterionIndex] > best.scores[criterionIndex] ? current : best
      )

      insights.push({
        type: 'opportunity',
        category: criterion,
        description: `أفضل أداء في ${this.translateCategory(criterion)}: ${bestInCategory.name}`,
        impact: 'medium',
        confidence: 85,
        affectedScenarios: [bestInCategory.id]
      })
    })

    return insights
  }

  private generateComparisonRecommendations(scenarios: DecisionScenario[], matrix: ComparisonMatrix): string[] {
    const recommendations: string[] = []

    const topScenario = matrix.rankings[0]
    recommendations.push(`يُنصح بالتركيز على السيناريو الأعلى تقييماً (المرتبة ${topScenario.rank})`)

    if (matrix.rankings.length > 2) {
      recommendations.push('مراجعة السيناريوهات منخفضة الأداء لتحديد فرص التحسين')
    }

    recommendations.push('إجراء تحليل حساسية للعوامل الحرجة في السيناريوهات المختارة')

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
        conditions: this.getConditions(analysis)
      }
      recommendations.push(primaryRec)

      // Alternative recommendations
      if (analysis.recommendation === 'conditional_bid') {
        const alternativeRec: DecisionRecommendation = {
          id: `rec_alt_${Date.now()}`,
          type: 'alternative',
          action: 'إجراء تحليل إضافي قبل اتخاذ القرار النهائي',
          rationale: 'النتيجة في المنطقة الحدية تتطلب مراجعة إضافية',
          priority: 'medium',
          timeline: 'أسبوع واحد',
          expectedOutcome: 'قرار أكثر دقة ووضوحاً',
          requiredResources: ['فريق التحليل', 'بيانات إضافية'],
          riskMitigation: ['مراجعة الافتراضات', 'تحليل الحساسية'],
          successMetrics: ['وضوح القرار', 'ثقة أعلى في النتيجة'],
          conditions: ['توفر البيانات المطلوبة', 'الوقت الكافي للتحليل']
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
  async createTemplate(template: Omit<ScenarioTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<ScenarioTemplate> {
    try {
      const newTemplate: ScenarioTemplate = {
        ...template,
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0
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
        templates = templates.filter(t => t.category === category)
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
          ...template.defaultValues
        }
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
    return templates.find(t => t.id === id) || null
  }

  private async incrementTemplateUsage(templateId: string): Promise<void> {
    const templates = await this.getTemplates()
    const index = templates.findIndex(t => t.id === templateId)

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
        id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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
      const bidDecisions = history.filter(h => h.decision === 'bid').length
      const noBidDecisions = history.filter(h => h.decision === 'no_bid').length
      const conditionalDecisions = history.filter(h => h.decision === 'conditional_bid').length

      // Calculate win rate (only for decisions that have outcomes)
      const decisionsWithOutcome = history.filter(h => h.outcome && h.outcome !== 'pending')
      const wonDecisions = decisionsWithOutcome.filter(h => h.outcome === 'won').length
      const winRate = decisionsWithOutcome.length > 0 ? (wonDecisions / decisionsWithOutcome.length) * 100 : 0

      // Calculate average accuracy
      const decisionsWithAccuracy = history.filter(h => h.accuracy !== undefined)
      const averageAccuracy = decisionsWithAccuracy.length > 0
        ? decisionsWithAccuracy.reduce((sum, h) => sum + h.accuracy, 0) / decisionsWithAccuracy.length
        : 0

      // Category performance (placeholder - would need more detailed data)
      const categoryPerformance = {
        financial: 75,
        strategic: 80,
        operational: 70,
        risk: 65,
        market: 85
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
        improvementAreas
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
        history = history.filter(h => h.scenarioId === filters.scenarioId)
      }

      if (filters.decision && filters.decision.length > 0) {
        history = history.filter(h => filters.decision!.includes(h.decision))
      }

      if (filters.outcome && filters.outcome.length > 0) {
        history = history.filter(h => h.outcome && filters.outcome!.includes(h.outcome))
      }

      if (filters.dateRange) {
        const startDate = new Date(filters.dateRange.start)
        const endDate = new Date(filters.dateRange.end)
        history = history.filter(h => {
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

      const monthHistory = history.filter(h => {
        const decisionDate = new Date(h.decisionDate)
        return decisionDate >= monthStart && decisionDate <= monthEnd
      })

      const monthDecisions = monthHistory.length
      const monthAccuracy = monthHistory.length > 0
        ? monthHistory.reduce((sum, h) => sum + (h.accuracy || 0), 0) / monthHistory.length
        : 0

      const monthWins = monthHistory.filter(h => h.outcome === 'won').length
      const monthWinRate = monthHistory.length > 0 ? (monthWins / monthHistory.length) * 100 : 0

      trends.unshift({
        period: monthStart.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' }),
        decisions: monthDecisions,
        accuracy: monthAccuracy,
        winRate: monthWinRate
      })
    }

    return trends
  }

  private identifyImprovementAreas(history: DecisionHistory[], categoryPerformance: Record<string, number>): string[] {
    const areas: string[] = []

    // Find lowest performing categories
    const sortedCategories = Object.entries(categoryPerformance)
      .sort(([,a], [,b]) => a - b)

    if (sortedCategories[0][1] < 70) {
      areas.push(`تحسين أداء ${this.translateCategory(sortedCategories[0][0])}`)
    }

    // Check accuracy trends
    const recentHistory = history.slice(-10)
    const recentAccuracy = recentHistory.length > 0
      ? recentHistory.reduce((sum, h) => sum + (h.accuracy || 0), 0) / recentHistory.length
      : 0

    if (recentAccuracy < 75) {
      areas.push('تحسين دقة التنبؤات والتحليل')
    }

    // Check win rate
    const recentWins = recentHistory.filter(h => h.outcome === 'won').length
    const recentWinRate = recentHistory.length > 0 ? (recentWins / recentHistory.length) * 100 : 0

    if (recentWinRate < 60) {
      areas.push('تحسين استراتيجية اختيار المناقصات')
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
      errors.push(`مجموع الأوزان يجب أن يساوي 100% (الحالي: ${totalWeight}%)`)
    }

    // Check criteria
    if (framework.criteria.length === 0) {
      errors.push('يجب إضافة معايير للتقييم')
    }

    // Check thresholds
    if (framework.thresholds.bidThreshold <= framework.thresholds.noBidThreshold) {
      errors.push('حد المناقصة يجب أن يكون أعلى من حد عدم المناقصة')
    }

    // Warnings
    if (framework.criteria.length < 5) {
      warnings.push('يُنصح بإضافة المزيد من المعايير للحصول على تقييم شامل')
    }

    // Suggestions
    if (framework.criteria.filter(c => c.category === 'risk').length === 0) {
      suggestions.push('إضافة معايير تقييم المخاطر')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
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
        name: scenarioData.name || 'سيناريو مستورد',
        nameEn: scenarioData.nameEn,
        description: scenarioData.description || 'سيناريو تم استيراده من ملف خارجي',
        projectId: scenarioData.projectId || 'imported',
        projectName: scenarioData.projectName || 'مشروع مستورد',
        tenderId: scenarioData.tenderId,
        tenderName: scenarioData.tenderName,
        createdBy: 'system',
        status: 'draft',
        criteriaValues: scenarioData.criteriaValues || {},
        recommendations: [],
        confidenceScore: 0,
        lastAnalyzed: new Date().toISOString()
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
    let report = `# تقرير السيناريو / Scenario Report\n\n`
    report += `**الاسم / Name:** ${scenario.name}\n`
    report += `**المشروع / Project:** ${scenario.projectName}\n`
    report += `**الحالة / Status:** ${scenario.status}\n`
    report += `**تاريخ الإنشاء / Created:** ${scenario.createdAt}\n\n`

    report += `## نتائج التحليل / Analysis Results\n\n`
    report += `**النتيجة الإجمالية / Overall Score:** ${scenario.analysisResults?.overallScore || 0}\n`
    report += `**التوصية / Recommendation:** ${scenario.analysisResults?.recommendation || 'N/A'}\n`
    report += `**مستوى المخاطر / Risk Level:** ${scenario.analysisResults?.riskLevel || 'N/A'}\n\n`

    report += `## نتائج الفئات / Category Scores\n\n`
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

    lines.forEach(line => {
      const [key, value] = line.split(',')
      if (key && value) {
        data[key.trim()] = value.trim()
      }
    })

    return {
      name: data.Name || 'سيناريو مستورد',
      projectName: data.Project || 'مشروع مستورد',
      description: 'سيناريو تم استيراده من ملف CSV',
      criteriaValues: {}
    }
  }

  // Helper methods for recommendation generation
  private getActionFromRecommendation(recommendation: string): string {
    const actions = {
      'bid': 'المشاركة في المناقصة',
      'no_bid': 'عدم المشاركة في المناقصة',
      'conditional_bid': 'المشاركة المشروطة في المناقصة'
    }
    return actions[recommendation as keyof typeof actions] || 'مراجعة إضافية مطلوبة'
  }

  private generateRationale(analysis: ScenarioAnalysis): string {
    return `بناءً على التحليل الشامل، النتيجة الإجمالية ${analysis.overallScore} ومستوى المخاطر ${analysis.riskLevel}`
  }

  private getTimelineFromRecommendation(recommendation: string): string {
    const timelines = {
      'bid': 'فوري - البدء في إعداد العرض',
      'no_bid': 'فوري - إشعار عدم المشاركة',
      'conditional_bid': 'أسبوع واحد - مراجعة الشروط'
    }
    return timelines[recommendation as keyof typeof timelines] || 'حسب الحاجة'
  }

  private getExpectedOutcome(analysis: ScenarioAnalysis): string {
    if (analysis.overallScore > 80) {
      return 'احتمالية عالية للنجاح والربحية'
    } else if (analysis.overallScore > 60) {
      return 'احتمالية متوسطة للنجاح مع مراقبة المخاطر'
    } else {
      return 'احتمالية منخفضة للنجاح - يتطلب تحليل إضافي'
    }
  }

  private getRequiredResources(analysis: ScenarioAnalysis): string[] {
    const resources = ['فريق إعداد العروض', 'البيانات المالية']

    if (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical') {
      resources.push('خبير إدارة المخاطر')
    }

    if (analysis.categoryScores.technical < 70) {
      resources.push('استشاري تقني')
    }

    return resources
  }

  private getRiskMitigation(analysis: ScenarioAnalysis): string[] {
    const mitigation = []

    if (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical') {
      mitigation.push('وضع خطة شاملة لإدارة المخاطر')
    }

    if (analysis.categoryScores.financial < 60) {
      mitigation.push('مراجعة التكاليف والهوامش')
    }

    mitigation.push('مراقبة مستمرة للمؤشرات الرئيسية')

    return mitigation
  }

  private getSuccessMetrics(analysis: ScenarioAnalysis): string[] {
    return [
      'تحقيق الهوامش المستهدفة',
      'الالتزام بالجدولة الزمنية',
      'رضا العميل',
      'جودة التنفيذ'
    ]
  }

  private getConditions(analysis: ScenarioAnalysis): string[] {
    const conditions = ['موافقة الإدارة العليا']

    if (analysis.recommendation === 'conditional_bid') {
      conditions.push('مراجعة الشروط التعاقدية')
      conditions.push('تأكيد توفر الموارد')
    }

    return conditions
  }
}

// Export singleton instance
export const decisionSupportService = new DecisionSupportServiceImpl()
export default decisionSupportService
