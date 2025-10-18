/**
 * خدمة تحليل الربحية
 * Profitability Analysis Service
 * 
 * تحليل شامل لربحية المشاريع والعملاء مع مؤشرات الأداء المالي
 * Comprehensive profitability analysis for projects and clients with financial KPIs
 */

import { asyncStorage } from '../utils/storage'

// أنواع البيانات - Data Types
export interface ProjectProfitability {
  id: string
  projectId: string
  projectName: string
  projectNameEn: string
  clientId: string
  clientName: string
  clientNameEn: string
  
  // الإيرادات - Revenue
  totalRevenue: number
  contractValue: number
  additionalRevenue: number
  
  // التكاليف - Costs
  totalCosts: number
  directCosts: number
  indirectCosts: number
  laborCosts: number
  materialCosts: number
  equipmentCosts: number
  overheadCosts: number
  
  // الربحية - Profitability
  grossProfit: number
  grossProfitMargin: number
  netProfit: number
  netProfitMargin: number
  
  // مؤشرات الأداء - Performance Indicators
  roi: number // Return on Investment
  costEfficiency: number
  revenuePerDay: number
  profitPerDay: number
  
  // التواريخ والحالة - Dates and Status
  startDate: string
  endDate: string
  duration: number // بالأيام
  status: 'active' | 'completed' | 'on-hold' | 'cancelled'
  
  // البيانات الوصفية - Metadata
  createdAt: string
  updatedAt: string
  version: number
}

export interface ClientProfitability {
  id: string
  clientId: string
  clientName: string
  clientNameEn: string
  
  // إجمالي الأعمال - Total Business
  totalProjects: number
  totalRevenue: number
  totalCosts: number
  totalProfit: number
  
  // متوسطات - Averages
  averageProjectValue: number
  averageProfitMargin: number
  averageProjectDuration: number
  
  // مؤشرات العميل - Client Metrics
  clientLifetimeValue: number
  clientAcquisitionCost: number
  clientRetentionRate: number
  clientSatisfactionScore: number
  
  // التصنيف - Classification
  profitabilityRank: number
  clientTier: 'platinum' | 'gold' | 'silver' | 'bronze'
  riskLevel: 'low' | 'medium' | 'high'
  
  // المشاريع - Projects
  projects: ProjectProfitability[]
  
  // التواريخ - Dates
  firstProjectDate: string
  lastProjectDate: string
  createdAt: string
  updatedAt: string
  version: number
}

export interface ProfitabilityComparison {
  id: string
  comparisonType: 'projects' | 'clients' | 'periods'
  title: string
  titleEn: string
  
  // البيانات المقارنة - Comparison Data
  items: {
    id: string
    name: string
    nameEn: string
    revenue: number
    costs: number
    profit: number
    profitMargin: number
    roi: number
    rank: number
  }[]
  
  // الإحصائيات - Statistics
  totalRevenue: number
  totalCosts: number
  totalProfit: number
  averageProfitMargin: number
  bestPerformer: string
  worstPerformer: string
  
  // الفترة الزمنية - Time Period
  startDate: string
  endDate: string
  
  // البيانات الوصفية - Metadata
  createdAt: string
  updatedAt: string
}

export interface ProfitabilityTrend {
  id: string
  entityId: string // Project or Client ID
  entityType: 'project' | 'client'
  entityName: string
  entityNameEn: string
  
  // البيانات الشهرية - Monthly Data
  monthlyData: {
    month: string
    year: number
    revenue: number
    costs: number
    profit: number
    profitMargin: number
    cumulativeProfit: number
  }[]
  
  // الاتجاهات - Trends
  revenueGrowthRate: number
  profitGrowthRate: number
  marginTrend: 'improving' | 'stable' | 'declining'
  seasonalityFactor: number
  
  // التنبؤات - Forecasts
  projectedRevenue: number
  projectedProfit: number
  confidenceLevel: number
  
  // البيانات الوصفية - Metadata
  createdAt: string
  updatedAt: string
}

/**
 * خدمة تحليل الربحية
 * Profitability Analysis Service
 */
export class ProfitabilityAnalysisService {
  private readonly storageKey = 'profitability_analysis'
  private readonly projectProfitabilityKey = 'project_profitability'
  private readonly clientProfitabilityKey = 'client_profitability'
  private readonly comparisonsKey = 'profitability_comparisons'
  private readonly trendsKey = 'profitability_trends'

  /**
   * حساب ربحية مشروع
   * Calculate project profitability
   */
  async calculateProjectProfitability(projectId: string): Promise<ProjectProfitability> {
    try {
      // جلب بيانات المشروع من الخدمات الأخرى
      const projectData = await this.getProjectData(projectId)
      const costs = await this.getProjectCosts(projectId)
      const revenue = await this.getProjectRevenue(projectId)
      
      // حساب الربحية
      const grossProfit = revenue.totalRevenue - costs.directCosts
      const grossProfitMargin = revenue.totalRevenue > 0 ? (grossProfit / revenue.totalRevenue) * 100 : 0
      
      const netProfit = revenue.totalRevenue - costs.totalCosts
      const netProfitMargin = revenue.totalRevenue > 0 ? (netProfit / revenue.totalRevenue) * 100 : 0
      
      // حساب مؤشرات الأداء
      const duration = this.calculateDuration(projectData.startDate, projectData.endDate)
      const roi = costs.totalCosts > 0 ? (netProfit / costs.totalCosts) * 100 : 0
      const costEfficiency = revenue.totalRevenue > 0 ? (costs.totalCosts / revenue.totalRevenue) * 100 : 0
      const revenuePerDay = duration > 0 ? revenue.totalRevenue / duration : 0
      const profitPerDay = duration > 0 ? netProfit / duration : 0
      
      const profitability: ProjectProfitability = {
        id: `prof_${projectId}_${Date.now()}`,
        projectId,
        projectName: projectData.name,
        projectNameEn: projectData.nameEn,
        clientId: projectData.clientId,
        clientName: projectData.clientName,
        clientNameEn: projectData.clientNameEn,
        
        // الإيرادات
        totalRevenue: revenue.totalRevenue,
        contractValue: revenue.contractValue,
        additionalRevenue: revenue.additionalRevenue,
        
        // التكاليف
        totalCosts: costs.totalCosts,
        directCosts: costs.directCosts,
        indirectCosts: costs.indirectCosts,
        laborCosts: costs.laborCosts,
        materialCosts: costs.materialCosts,
        equipmentCosts: costs.equipmentCosts,
        overheadCosts: costs.overheadCosts,
        
        // الربحية
        grossProfit,
        grossProfitMargin,
        netProfit,
        netProfitMargin,
        
        // مؤشرات الأداء
        roi,
        costEfficiency,
        revenuePerDay,
        profitPerDay,
        
        // التواريخ والحالة
        startDate: projectData.startDate,
        endDate: projectData.endDate,
        duration,
        status: projectData.status,
        
        // البيانات الوصفية
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      }
      
      // حفظ البيانات
      await this.saveProjectProfitability(profitability)
      
      return profitability
    } catch (error) {
      console.error('Error calculating project profitability:', error)
      throw new Error('فشل في حساب ربحية المشروع')
    }
  }

  /**
   * حساب ربحية عميل
   * Calculate client profitability
   */
  async calculateClientProfitability(clientId: string): Promise<ClientProfitability> {
    try {
      // جلب جميع مشاريع العميل
      const clientProjects = await this.getClientProjects(clientId)
      const projectProfitabilities = await Promise.all(
        clientProjects.map(project => this.calculateProjectProfitability(project.id))
      )
      
      // حساب الإجماليات
      const totalProjects = projectProfitabilities.length
      const totalRevenue = projectProfitabilities.reduce((sum, p) => sum + p.totalRevenue, 0)
      const totalCosts = projectProfitabilities.reduce((sum, p) => sum + p.totalCosts, 0)
      const totalProfit = totalRevenue - totalCosts
      
      // حساب المتوسطات
      const averageProjectValue = totalProjects > 0 ? totalRevenue / totalProjects : 0
      const averageProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
      const averageProjectDuration = totalProjects > 0 
        ? projectProfitabilities.reduce((sum, p) => sum + p.duration, 0) / totalProjects 
        : 0
      
      // حساب مؤشرات العميل
      const clientLifetimeValue = this.calculateClientLifetimeValue(projectProfitabilities)
      const clientAcquisitionCost = this.calculateClientAcquisitionCost(clientId)
      const clientRetentionRate = this.calculateClientRetentionRate(clientId)
      const clientSatisfactionScore = await this.getClientSatisfactionScore(clientId)
      
      // تحديد التصنيف
      const profitabilityRank = await this.calculateClientRank(clientId, totalProfit)
      const clientTier = this.determineClientTier(totalRevenue, averageProfitMargin)
      const riskLevel = this.assessClientRisk(projectProfitabilities)
      
      // تواريخ المشاريع
      const projectDates = projectProfitabilities.map(p => new Date(p.startDate))
      const firstProjectDate = projectDates.length > 0
        ? new Date(Math.min(...projectDates.map(d => d.getTime()))).toISOString()
        : new Date().toISOString()
      const lastProjectDate = projectDates.length > 0
        ? new Date(Math.max(...projectDates.map(d => d.getTime()))).toISOString()
        : new Date().toISOString()
      
      const clientData = await this.getClientData(clientId)
      
      const clientProfitability: ClientProfitability = {
        id: `client_prof_${clientId}_${Date.now()}`,
        clientId,
        clientName: clientData.name,
        clientNameEn: clientData.nameEn,
        
        // إجمالي الأعمال
        totalProjects,
        totalRevenue,
        totalCosts,
        totalProfit,
        
        // متوسطات
        averageProjectValue,
        averageProfitMargin,
        averageProjectDuration,
        
        // مؤشرات العميل
        clientLifetimeValue,
        clientAcquisitionCost,
        clientRetentionRate,
        clientSatisfactionScore,
        
        // التصنيف
        profitabilityRank,
        clientTier,
        riskLevel,
        
        // المشاريع
        projects: projectProfitabilities,
        
        // التواريخ
        firstProjectDate,
        lastProjectDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      }
      
      // حفظ البيانات
      await this.saveClientProfitability(clientProfitability)
      
      return clientProfitability
    } catch (error) {
      console.error('Error calculating client profitability:', error)
      throw new Error('فشل في حساب ربحية العميل')
    }
  }

  /**
   * مقارنة الربحية
   * Compare profitability
   */
  async createProfitabilityComparison(
    type: 'projects' | 'clients' | 'periods',
    itemIds: string[],
    startDate?: string,
    endDate?: string
  ): Promise<ProfitabilityComparison> {
    try {
      let items: any[] = []
      let title = ''
      let titleEn = ''

      if (type === 'projects') {
        title = 'مقارنة ربحية المشاريع'
        titleEn = 'Project Profitability Comparison'

        const profitabilities = await Promise.all(
          itemIds.map(id => this.calculateProjectProfitability(id))
        )

        items = profitabilities.map((p, index) => ({
          id: p.projectId,
          name: p.projectName,
          nameEn: p.projectNameEn,
          revenue: p.totalRevenue,
          costs: p.totalCosts,
          profit: p.netProfit,
          profitMargin: p.netProfitMargin,
          roi: p.roi,
          rank: index + 1
        }))
      } else if (type === 'clients') {
        title = 'مقارنة ربحية العملاء'
        titleEn = 'Client Profitability Comparison'

        const profitabilities = await Promise.all(
          itemIds.map(id => this.calculateClientProfitability(id))
        )

        items = profitabilities.map((p, index) => ({
          id: p.clientId,
          name: p.clientName,
          nameEn: p.clientNameEn,
          revenue: p.totalRevenue,
          costs: p.totalCosts,
          profit: p.totalProfit,
          profitMargin: p.averageProfitMargin,
          roi: p.totalCosts > 0 ? (p.totalProfit / p.totalCosts) * 100 : 0,
          rank: index + 1
        }))
      }

      // ترتيب حسب الربح
      items.sort((a, b) => b.profit - a.profit)
      items.forEach((item, index) => {
        item.rank = index + 1
      })

      // حساب الإحصائيات
      const totalRevenue = items.reduce((sum, item) => sum + item.revenue, 0)
      const totalCosts = items.reduce((sum, item) => sum + item.costs, 0)
      const totalProfit = totalRevenue - totalCosts
      const averageProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

      const comparison: ProfitabilityComparison = {
        id: `comp_${type}_${Date.now()}`,
        comparisonType: type,
        title,
        titleEn,
        items,
        totalRevenue,
        totalCosts,
        totalProfit,
        averageProfitMargin,
        bestPerformer: items[0]?.name || '',
        worstPerformer: items[items.length - 1]?.name || '',
        startDate: startDate || '',
        endDate: endDate || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // حفظ المقارنة
      await this.saveComparison(comparison)

      return comparison
    } catch (error) {
      console.error('Error creating profitability comparison:', error)
      throw new Error('فشل في إنشاء مقارنة الربحية')
    }
  }

  /**
   * تحليل اتجاهات الربحية
   * Analyze profitability trends
   */
  async analyzeProfitabilityTrend(
    entityId: string,
    entityType: 'project' | 'client',
    months = 12
  ): Promise<ProfitabilityTrend> {
    try {
      const entityData = entityType === 'project'
        ? await this.getProjectData(entityId)
        : await this.getClientData(entityId)

      // جلب البيانات الشهرية
      const monthlyData = await this.getMonthlyProfitabilityData(entityId, entityType, months)

      // حساب معدلات النمو
      const revenueGrowthRate = this.calculateGrowthRate(
        monthlyData.map(m => m.revenue)
      )
      const profitGrowthRate = this.calculateGrowthRate(
        monthlyData.map(m => m.profit)
      )

      // تحديد اتجاه الهامش
      const marginTrend = this.determineTrend(
        monthlyData.map(m => m.profitMargin)
      )

      // حساب عامل الموسمية
      const seasonalityFactor = this.calculateSeasonality(monthlyData)

      // التنبؤات
      const { projectedRevenue, projectedProfit, confidenceLevel } =
        this.generateForecasts(monthlyData)

      const trend: ProfitabilityTrend = {
        id: `trend_${entityType}_${entityId}_${Date.now()}`,
        entityId,
        entityType,
        entityName: entityData.name,
        entityNameEn: entityData.nameEn,
        monthlyData,
        revenueGrowthRate,
        profitGrowthRate,
        marginTrend,
        seasonalityFactor,
        projectedRevenue,
        projectedProfit,
        confidenceLevel,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // حفظ الاتجاه
      await this.saveTrend(trend)

      return trend
    } catch (error) {
      console.error('Error analyzing profitability trend:', error)
      throw new Error('فشل في تحليل اتجاهات الربحية')
    }
  }

  /**
   * جلب أفضل المشاريع ربحية
   * Get most profitable projects
   */
  async getMostProfitableProjects(limit = 10): Promise<ProjectProfitability[]> {
    try {
      const allProfitabilities = await asyncStorage.getItem(this.projectProfitabilityKey) || []

      return allProfitabilities
        .sort((a: ProjectProfitability, b: ProjectProfitability) => b.netProfit - a.netProfit)
        .slice(0, limit)
    } catch (error) {
      console.error('Error getting most profitable projects:', error)
      throw new Error('فشل في جلب أفضل المشاريع ربحية')
    }
  }

  /**
   * جلب أفضل العملاء ربحية
   * Get most profitable clients
   */
  async getMostProfitableClients(limit = 10): Promise<ClientProfitability[]> {
    try {
      const allProfitabilities = await asyncStorage.getItem(this.clientProfitabilityKey) || []

      return allProfitabilities
        .sort((a: ClientProfitability, b: ClientProfitability) => b.totalProfit - a.totalProfit)
        .slice(0, limit)
    } catch (error) {
      console.error('Error getting most profitable clients:', error)
      throw new Error('فشل في جلب أفضل العملاء ربحية')
    }
  }

  // الوظائف المساعدة - Helper Functions

  /**
   * جلب بيانات المشروع
   * Get project data
   */
  private async getProjectData(projectId: string): Promise<any> {
    // محاكاة جلب بيانات المشروع من خدمة المشاريع
    const projects = await asyncStorage.getItem('projects') || []
    const project = projects.find((p: any) => p.id === projectId)

    if (!project) {
      throw new Error(`المشروع غير موجود: ${projectId}`)
    }

    return {
      id: project.id,
      name: project.name || project.title,
      nameEn: project.nameEn || project.titleEn,
      clientId: project.clientId,
      clientName: project.clientName,
      clientNameEn: project.clientNameEn,
      startDate: project.startDate,
      endDate: project.endDate,
      status: project.status
    }
  }

  /**
   * جلب تكاليف المشروع
   * Get project costs
   */
  private async getProjectCosts(projectId: string): Promise<any> {
    // محاكاة جلب تكاليف المشروع
    const costs = await asyncStorage.getItem('project_costs') || []
    const projectCosts = costs.filter((c: any) => c.projectId === projectId)

    const directCosts = projectCosts
      .filter((c: any) => c.type === 'direct')
      .reduce((sum: number, c: any) => sum + c.amount, 0)

    const indirectCosts = projectCosts
      .filter((c: any) => c.type === 'indirect')
      .reduce((sum: number, c: any) => sum + c.amount, 0)

    const laborCosts = projectCosts
      .filter((c: any) => c.category === 'labor')
      .reduce((sum: number, c: any) => sum + c.amount, 0)

    const materialCosts = projectCosts
      .filter((c: any) => c.category === 'material')
      .reduce((sum: number, c: any) => sum + c.amount, 0)

    const equipmentCosts = projectCosts
      .filter((c: any) => c.category === 'equipment')
      .reduce((sum: number, c: any) => sum + c.amount, 0)

    const overheadCosts = projectCosts
      .filter((c: any) => c.category === 'overhead')
      .reduce((sum: number, c: any) => sum + c.amount, 0)

    const totalCosts = directCosts + indirectCosts

    return {
      totalCosts,
      directCosts,
      indirectCosts,
      laborCosts,
      materialCosts,
      equipmentCosts,
      overheadCosts
    }
  }

  /**
   * جلب إيرادات المشروع
   * Get project revenue
   */
  private async getProjectRevenue(projectId: string): Promise<any> {
    // محاكاة جلب إيرادات المشروع
    const revenues = await asyncStorage.getItem('project_revenues') || []
    const projectRevenues = revenues.filter((r: any) => r.projectId === projectId)

    const contractValue = projectRevenues
      .filter((r: any) => r.type === 'contract')
      .reduce((sum: number, r: any) => sum + r.amount, 0)

    const additionalRevenue = projectRevenues
      .filter((r: any) => r.type === 'additional')
      .reduce((sum: number, r: any) => sum + r.amount, 0)

    const totalRevenue = contractValue + additionalRevenue

    return {
      totalRevenue,
      contractValue,
      additionalRevenue
    }
  }

  /**
   * حساب المدة بالأيام
   * Calculate duration in days
   */
  private calculateDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * جلب مشاريع العميل
   * Get client projects
   */
  private async getClientProjects(clientId: string): Promise<any[]> {
    const projects = await asyncStorage.getItem('projects') || []
    return projects.filter((p: any) => p.clientId === clientId)
  }

  /**
   * جلب بيانات العميل
   * Get client data
   */
  private async getClientData(clientId: string): Promise<any> {
    const clients = await asyncStorage.getItem('clients') || []
    const client = clients.find((c: any) => c.id === clientId)

    if (!client) {
      throw new Error(`العميل غير موجود: ${clientId}`)
    }

    return {
      id: client.id,
      name: client.name,
      nameEn: client.nameEn
    }
  }

  /**
   * حساب قيمة العميل مدى الحياة
   * Calculate client lifetime value
   */
  private calculateClientLifetimeValue(projects: ProjectProfitability[]): number {
    const totalProfit = projects.reduce((sum, p) => sum + p.netProfit, 0)
    const averageProjectsPerYear = this.calculateAverageProjectsPerYear(projects)
    const estimatedLifetime = 5 // سنوات

    return totalProfit * averageProjectsPerYear * estimatedLifetime
  }

  /**
   * حساب متوسط المشاريع سنوياً
   * Calculate average projects per year
   */
  private calculateAverageProjectsPerYear(projects: ProjectProfitability[]): number {
    if (projects.length === 0) return 0

    const dates = projects.map(p => new Date(p.startDate))
    const firstDate = new Date(Math.min(...dates.map(d => d.getTime())))
    const lastDate = new Date(Math.max(...dates.map(d => d.getTime())))

    const yearsDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 365)

    return yearsDiff > 0 ? projects.length / yearsDiff : projects.length
  }

  /**
   * حساب تكلفة اكتساب العميل
   * Calculate client acquisition cost
   */
  private calculateClientAcquisitionCost(clientId: string): number {
    // محاكاة حساب تكلفة اكتساب العميل
    return 5000 // ريال سعودي
  }

  /**
   * حساب معدل الاحتفاظ بالعميل
   * Calculate client retention rate
   */
  private calculateClientRetentionRate(clientId: string): number {
    // محاكاة حساب معدل الاحتفاظ
    return 85 // نسبة مئوية
  }

  /**
   * جلب نقاط رضا العميل
   * Get client satisfaction score
   */
  private async getClientSatisfactionScore(clientId: string): Promise<number> {
    // محاكاة جلب نقاط رضا العميل
    return 4.2 // من 5
  }

  /**
   * حساب ترتيب العميل
   * Calculate client rank
   */
  private async calculateClientRank(clientId: string, totalProfit: number): Promise<number> {
    const allClients = await asyncStorage.getItem(this.clientProfitabilityKey) || []
    const sortedClients = allClients.sort((a: any, b: any) => b.totalProfit - a.totalProfit)
    const rank = sortedClients.findIndex((c: any) => c.clientId === clientId) + 1
    return rank || allClients.length + 1
  }

  /**
   * تحديد فئة العميل
   * Determine client tier
   */
  private determineClientTier(totalRevenue: number, averageProfitMargin: number): 'platinum' | 'gold' | 'silver' | 'bronze' {
    if (totalRevenue >= 1000000 && averageProfitMargin >= 20) return 'platinum'
    if (totalRevenue >= 500000 && averageProfitMargin >= 15) return 'gold'
    if (totalRevenue >= 100000 && averageProfitMargin >= 10) return 'silver'
    return 'bronze'
  }

  /**
   * تقييم مخاطر العميل
   * Assess client risk
   */
  private assessClientRisk(projects: ProjectProfitability[]): 'low' | 'medium' | 'high' {
    const profitMargins = projects.map(p => p.netProfitMargin)
    const averageMargin = profitMargins.reduce((sum, m) => sum + m, 0) / profitMargins.length
    const marginVariance = this.calculateVariance(profitMargins)

    if (averageMargin >= 15 && marginVariance <= 25) return 'low'
    if (averageMargin >= 10 && marginVariance <= 50) return 'medium'
    return 'high'
  }

  /**
   * حساب التباين
   * Calculate variance
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2))
    return squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length
  }

  /**
   * جلب البيانات الشهرية للربحية
   * Get monthly profitability data
   */
  private async getMonthlyProfitabilityData(
    entityId: string,
    entityType: 'project' | 'client',
    months: number
  ): Promise<any[]> {
    // محاكاة جلب البيانات الشهرية
    const monthlyData = []
    const currentDate = new Date()

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const month = date.toISOString().substring(0, 7)

      // محاكاة بيانات شهرية
      const baseRevenue = Math.random() * 100000 + 50000
      const baseCosts = baseRevenue * (0.6 + Math.random() * 0.3)
      const profit = baseRevenue - baseCosts
      const profitMargin = (profit / baseRevenue) * 100

      monthlyData.push({
        month,
        year: date.getFullYear(),
        revenue: baseRevenue,
        costs: baseCosts,
        profit,
        profitMargin,
        cumulativeProfit: monthlyData.reduce((sum, m) => sum + m.profit, 0) + profit
      })
    }

    return monthlyData
  }

  /**
   * حساب معدل النمو
   * Calculate growth rate
   */
  private calculateGrowthRate(values: number[]): number {
    if (values.length < 2) return 0

    const firstValue = values[0]
    const lastValue = values[values.length - 1]

    if (firstValue === 0) return 0

    return ((lastValue - firstValue) / firstValue) * 100
  }

  /**
   * تحديد الاتجاه
   * Determine trend
   */
  private determineTrend(values: number[]): 'improving' | 'stable' | 'declining' {
    if (values.length < 3) return 'stable'

    const recentValues = values.slice(-3)
    const trend = this.calculateGrowthRate(recentValues)

    if (trend > 5) return 'improving'
    if (trend < -5) return 'declining'
    return 'stable'
  }

  /**
   * حساب عامل الموسمية
   * Calculate seasonality factor
   */
  private calculateSeasonality(monthlyData: any[]): number {
    if (monthlyData.length < 12) return 0

    const revenues = monthlyData.map(m => m.revenue)
    const averageRevenue = revenues.reduce((sum, r) => sum + r, 0) / revenues.length
    const variance = this.calculateVariance(revenues)

    return (variance / averageRevenue) * 100
  }

  /**
   * إنشاء التنبؤات
   * Generate forecasts
   */
  private generateForecasts(monthlyData: any[]): {
    projectedRevenue: number
    projectedProfit: number
    confidenceLevel: number
  } {
    if (monthlyData.length < 3) {
      return {
        projectedRevenue: 0,
        projectedProfit: 0,
        confidenceLevel: 0
      }
    }

    const recentData = monthlyData.slice(-3)
    const averageRevenue = recentData.reduce((sum, m) => sum + m.revenue, 0) / recentData.length
    const averageProfit = recentData.reduce((sum, m) => sum + m.profit, 0) / recentData.length

    const revenueGrowth = this.calculateGrowthRate(recentData.map(m => m.revenue))
    const projectedRevenue = averageRevenue * (1 + revenueGrowth / 100)
    const projectedProfit = averageProfit * (1 + revenueGrowth / 100)

    // حساب مستوى الثقة بناءً على استقرار البيانات
    const revenueVariance = this.calculateVariance(recentData.map(m => m.revenue))
    const confidenceLevel = Math.max(0, Math.min(100, 100 - (revenueVariance / averageRevenue) * 100))

    return {
      projectedRevenue,
      projectedProfit,
      confidenceLevel
    }
  }

  // وظائف الحفظ والجلب - Save and Retrieve Functions

  /**
   * حفظ ربحية المشروع
   * Save project profitability
   */
  private async saveProjectProfitability(profitability: ProjectProfitability): Promise<void> {
    try {
      const existing = await asyncStorage.getItem(this.projectProfitabilityKey) || []
      const index = existing.findIndex((p: ProjectProfitability) => p.projectId === profitability.projectId)

      if (index >= 0) {
        existing[index] = { ...profitability, updatedAt: new Date().toISOString(), version: existing[index].version + 1 }
      } else {
        existing.push(profitability)
      }

      await asyncStorage.setItem(this.projectProfitabilityKey, existing)
    } catch (error) {
      console.error('Error saving project profitability:', error)
      throw new Error('فشل في حفظ ربحية المشروع')
    }
  }

  /**
   * حفظ ربحية العميل
   * Save client profitability
   */
  private async saveClientProfitability(profitability: ClientProfitability): Promise<void> {
    try {
      const existing = await asyncStorage.getItem(this.clientProfitabilityKey) || []
      const index = existing.findIndex((p: ClientProfitability) => p.clientId === profitability.clientId)

      if (index >= 0) {
        existing[index] = { ...profitability, updatedAt: new Date().toISOString(), version: existing[index].version + 1 }
      } else {
        existing.push(profitability)
      }

      await asyncStorage.setItem(this.clientProfitabilityKey, existing)
    } catch (error) {
      console.error('Error saving client profitability:', error)
      throw new Error('فشل في حفظ ربحية العميل')
    }
  }

  /**
   * حفظ المقارنة
   * Save comparison
   */
  private async saveComparison(comparison: ProfitabilityComparison): Promise<void> {
    try {
      const existing = await asyncStorage.getItem(this.comparisonsKey) || []
      existing.push(comparison)
      await asyncStorage.setItem(this.comparisonsKey, existing)
    } catch (error) {
      console.error('Error saving comparison:', error)
      throw new Error('فشل في حفظ المقارنة')
    }
  }

  /**
   * حفظ الاتجاه
   * Save trend
   */
  private async saveTrend(trend: ProfitabilityTrend): Promise<void> {
    try {
      const existing = await asyncStorage.getItem(this.trendsKey) || []
      const index = existing.findIndex((t: ProfitabilityTrend) =>
        t.entityId === trend.entityId && t.entityType === trend.entityType
      )

      if (index >= 0) {
        existing[index] = trend
      } else {
        existing.push(trend)
      }

      await asyncStorage.setItem(this.trendsKey, existing)
    } catch (error) {
      console.error('Error saving trend:', error)
      throw new Error('فشل في حفظ الاتجاه')
    }
  }

  /**
   * جلب ربحية المشروع
   * Get project profitability
   */
  async getProjectProfitability(projectId: string): Promise<ProjectProfitability | null> {
    try {
      const profitabilities = await asyncStorage.getItem(this.projectProfitabilityKey) || []
      return profitabilities.find((p: ProjectProfitability) => p.projectId === projectId) || null
    } catch (error) {
      console.error('Error getting project profitability:', error)
      return null
    }
  }

  /**
   * جلب ربحية العميل
   * Get client profitability
   */
  async getClientProfitability(clientId: string): Promise<ClientProfitability | null> {
    try {
      const profitabilities = await asyncStorage.getItem(this.clientProfitabilityKey) || []
      return profitabilities.find((p: ClientProfitability) => p.clientId === clientId) || null
    } catch (error) {
      console.error('Error getting client profitability:', error)
      return null
    }
  }

  /**
   * جلب جميع المقارنات
   * Get all comparisons
   */
  async getAllComparisons(): Promise<ProfitabilityComparison[]> {
    try {
      return await asyncStorage.getItem(this.comparisonsKey) || []
    } catch (error) {
      console.error('Error getting comparisons:', error)
      return []
    }
  }

  /**
   * جلب الاتجاه
   * Get trend
   */
  async getTrend(entityId: string, entityType: 'project' | 'client'): Promise<ProfitabilityTrend | null> {
    try {
      const trends = await asyncStorage.getItem(this.trendsKey) || []
      return trends.find((t: ProfitabilityTrend) =>
        t.entityId === entityId && t.entityType === entityType
      ) || null
    } catch (error) {
      console.error('Error getting trend:', error)
      return null
    }
  }

  /**
   * حذف ربحية المشروع
   * Delete project profitability
   */
  async deleteProjectProfitability(projectId: string): Promise<void> {
    try {
      const existing = await asyncStorage.getItem(this.projectProfitabilityKey) || []
      const filtered = existing.filter((p: ProjectProfitability) => p.projectId !== projectId)
      await asyncStorage.setItem(this.projectProfitabilityKey, filtered)
    } catch (error) {
      console.error('Error deleting project profitability:', error)
      throw new Error('فشل في حذف ربحية المشروع')
    }
  }

  /**
   * حذف ربحية العميل
   * Delete client profitability
   */
  async deleteClientProfitability(clientId: string): Promise<void> {
    try {
      const existing = await asyncStorage.getItem(this.clientProfitabilityKey) || []
      const filtered = existing.filter((p: ClientProfitability) => p.clientId !== clientId)
      await asyncStorage.setItem(this.clientProfitabilityKey, filtered)
    } catch (error) {
      console.error('Error deleting client profitability:', error)
      throw new Error('فشل في حذف ربحية العميل')
    }
  }

  /**
   * تحديث جميع البيانات
   * Refresh all data
   */
  async refreshAllData(): Promise<void> {
    try {
      // إعادة حساب ربحية جميع المشاريع
      const projects = await asyncStorage.getItem('projects') || []
      for (const project of projects) {
        await this.calculateProjectProfitability(project.id)
      }

      // إعادة حساب ربحية جميع العملاء
      const clients = await asyncStorage.getItem('clients') || []
      for (const client of clients) {
        await this.calculateClientProfitability(client.id)
      }
    } catch (error) {
      console.error('Error refreshing all data:', error)
      throw new Error('فشل في تحديث جميع البيانات')
    }
  }
}
