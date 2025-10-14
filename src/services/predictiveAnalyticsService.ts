import { asyncStorage } from '@/utils/storage';
import type { Project, Tender } from '@/data/centralData';

// أنواع البيانات للتحليلات التنبؤية
export interface PredictionModel {
  id: string;
  name: string;
  nameEn: string;
  type: 'revenue' | 'cashflow' | 'tender_success' | 'project_delay' | 'budget_overrun' | 'resource_demand' | 'performance';
  algorithm: 'linear_regression' | 'polynomial' | 'exponential_smoothing' | 'arima' | 'neural_network' | 'ensemble';
  accuracy: number; // نسبة الدقة (0-100)
  confidence: number; // مستوى الثقة (0-100)
  trainingData: HistoricalDataPoint[];
  parameters: Record<string, any>;
  lastTrained: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HistoricalDataPoint {
  date: string;
  value: number;
  category?: string;
  projectId?: string;
  tenderId?: string;
  metadata?: Record<string, any>;
}

export interface PredictionResult {
  id: string;
  modelId: string;
  targetDate: string;
  predictedValue: number;
  confidence: number;
  upperBound: number;
  lowerBound: number;
  factors: PredictionFactor[];
  generatedAt: string;
  validUntil: string;
}

export interface PredictionFactor {
  name: string;
  nameEn: string;
  impact: number; // تأثير العامل (-100 إلى +100)
  weight: number; // وزن العامل (0-1)
  description: string;
  descriptionEn: string;
}

export interface RiskAssessment {
  id: string;
  type: 'project_delay' | 'budget_overrun' | 'quality_issue' | 'resource_shortage' | 'market_change';
  probability: number; // احتمالية الحدوث (0-100)
  impact: number; // شدة التأثير (0-100)
  riskScore: number; // نقاط المخاطر (probability * impact / 100)
  description: string;
  descriptionEn: string;
  mitigation: string;
  mitigationEn: string;
  projectId?: string;
  tenderId?: string;
  detectedAt: string;
  validUntil: string;
}

export interface ForecastScenario {
  id: string;
  name: string;
  nameEn: string;
  type: 'optimistic' | 'realistic' | 'pessimistic';
  probability: number;
  predictions: PredictionResult[];
  assumptions: string[];
  assumptionsEn: string[];
  createdAt: string;
}

/**
 * خدمة التحليلات التنبؤية الذكية
 * توفر خوارزميات متقدمة للتنبؤ بالأداء المالي والتشغيلي
 */
export class PredictiveAnalyticsService {
  private readonly STORAGE_KEY = 'predictive_analytics';
  private readonly MODELS_KEY = 'prediction_models';
  private readonly PREDICTIONS_KEY = 'predictions';
  private readonly RISKS_KEY = 'risk_assessments';
  private readonly SCENARIOS_KEY = 'forecast_scenarios';

  // إدارة النماذج التنبؤية
  async createPredictionModel(model: Omit<PredictionModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<PredictionModel> {
    const newModel: PredictionModel = {
      ...model,
      id: `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const models = await this.getAllModels();
    models.push(newModel);
    await asyncStorage.setItem(this.MODELS_KEY, models);

    return newModel;
  }

  async getAllModels(): Promise<PredictionModel[]> {
    return await asyncStorage.getItem(this.MODELS_KEY) || [];
  }

  async getModelById(id: string): Promise<PredictionModel | null> {
    const models = await this.getAllModels();
    return models.find(model => model.id === id) || null;
  }

  async updateModel(id: string, updates: Partial<PredictionModel>): Promise<PredictionModel | null> {
    const models = await this.getAllModels();
    const index = models.findIndex(model => model.id === id);
    
    if (index === -1) return null;

    models[index] = {
      ...models[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await asyncStorage.setItem(this.MODELS_KEY, models);
    return models[index];
  }

  async deleteModel(id: string): Promise<boolean> {
    const models = await this.getAllModels();
    const filteredModels = models.filter(model => model.id !== id);
    
    if (filteredModels.length === models.length) return false;

    await asyncStorage.setItem(this.MODELS_KEY, filteredModels);
    return true;
  }

  // خوارزميات التنبؤ
  async predictRevenue(timeframe: number = 12): Promise<PredictionResult[]> {
    const projects = await asyncStorage.getItem('projects') || [];
    const tenders = await asyncStorage.getItem('tenders') || [];
    
    const historicalRevenue = this.extractRevenueData(projects, tenders);
    const model = await this.getOrCreateModel('revenue', 'linear_regression');
    
    return this.generatePredictions(model, historicalRevenue, timeframe);
  }

  async predictCashFlow(timeframe: number = 12): Promise<PredictionResult[]> {
    const projects = await asyncStorage.getItem('projects') || [];
    const expenses = await asyncStorage.getItem('expenses') || [];
    
    const historicalCashFlow = this.extractCashFlowData(projects, expenses);
    const model = await this.getOrCreateModel('cashflow', 'exponential_smoothing');
    
    return this.generatePredictions(model, historicalCashFlow, timeframe);
  }

  async predictTenderSuccess(tenderId: string): Promise<PredictionResult> {
    const tender = await this.getTenderById(tenderId);
    if (!tender) throw new Error('Tender not found');

    const historicalTenders = await asyncStorage.getItem('tenders') || [];
    const successData = this.extractTenderSuccessData(historicalTenders);
    const model = await this.getOrCreateModel('tender_success', 'neural_network');
    
    const tenderFeatures = this.extractTenderFeatures(tender);
    return this.predictSingleValue(model, tenderFeatures);
  }

  async predictProjectDelay(projectId: string): Promise<PredictionResult> {
    const project = await this.getProjectById(projectId);
    if (!project) throw new Error('Project not found');

    const historicalProjects = await asyncStorage.getItem('projects') || [];
    const delayData = this.extractProjectDelayData(historicalProjects);
    const model = await this.getOrCreateModel('project_delay', 'ensemble');
    
    const projectFeatures = this.extractProjectFeatures(project);
    return this.predictSingleValue(model, projectFeatures);
  }

  async predictBudgetOverrun(projectId: string): Promise<PredictionResult> {
    const project = await this.getProjectById(projectId);
    if (!project) throw new Error('Project not found');

    const historicalProjects = await asyncStorage.getItem('projects') || [];
    const overrunData = this.extractBudgetOverrunData(historicalProjects);
    const model = await this.getOrCreateModel('budget_overrun', 'polynomial');
    
    const projectFeatures = this.extractProjectFeatures(project);
    return this.predictSingleValue(model, projectFeatures);
  }

  async predictResourceDemand(timeframe: number = 6): Promise<PredictionResult[]> {
    const projects = await asyncStorage.getItem('projects') || [];
    const resourceData = this.extractResourceData(projects);
    const model = await this.getOrCreateModel('resource_demand', 'arima');
    
    return this.generatePredictions(model, resourceData, timeframe);
  }

  // تحليل المخاطر
  async assessRisks(projectId?: string, tenderId?: string): Promise<RiskAssessment[]> {
    const risks: RiskAssessment[] = [];
    
    if (projectId) {
      const projectRisks = await this.assessProjectRisks(projectId);
      risks.push(...projectRisks);
    }
    
    if (tenderId) {
      const tenderRisks = await this.assessTenderRisks(tenderId);
      risks.push(...tenderRisks);
    }
    
    if (!projectId && !tenderId) {
      const allRisks = await this.assessOverallRisks();
      risks.push(...allRisks);
    }
    
    return risks.sort((a, b) => b.riskScore - a.riskScore);
  }

  // سيناريوهات التنبؤ
  async generateForecastScenarios(type: 'revenue' | 'cashflow' | 'performance'): Promise<ForecastScenario[]> {
    const scenarios: ForecastScenario[] = [];
    
    // سيناريو متفائل
    const optimistic = await this.createScenario('optimistic', type, 0.2);
    scenarios.push(optimistic);
    
    // سيناريو واقعي
    const realistic = await this.createScenario('realistic', type, 0.6);
    scenarios.push(realistic);
    
    // سيناريو متشائم
    const pessimistic = await this.createScenario('pessimistic', type, 0.2);
    scenarios.push(pessimistic);
    
    return scenarios;
  }

  // دوال مساعدة خاصة
  private async getOrCreateModel(type: PredictionModel['type'], algorithm: PredictionModel['algorithm']): Promise<PredictionModel> {
    const models = await this.getAllModels();
    let model = models.find(m => m.type === type && m.algorithm === algorithm);
    
    if (!model) {
      model = await this.createPredictionModel({
        name: this.getModelName(type),
        nameEn: this.getModelNameEn(type),
        type,
        algorithm,
        accuracy: 75,
        confidence: 80,
        trainingData: [],
        parameters: this.getDefaultParameters(algorithm),
        lastTrained: new Date().toISOString(),
        isActive: true
      });
    }
    
    return model;
  }

  private extractRevenueData(projects: Project[], tenders: Tender[]): HistoricalDataPoint[] {
    const data: HistoricalDataPoint[] = [];
    
    // استخراج بيانات الإيرادات من المشاريع المكتملة
    projects.filter(p => p.status === 'completed').forEach(project => {
      data.push({
        date: project.endDate,
        value: project.contractValue,
        category: 'project_revenue',
        projectId: project.id,
        metadata: { type: 'project', status: project.status }
      });
    });
    
    // استخراج بيانات الإيرادات من المنافسات المربوحة
    tenders.filter(t => t.status === 'won').forEach(tender => {
      data.push({
        date: tender.winDate || tender.submissionDate,
        value: tender.value,
        category: 'tender_revenue',
        tenderId: tender.id,
        metadata: { type: 'tender', status: tender.status }
      });
    });
    
    return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private extractCashFlowData(projects: Project[], expenses: any[]): HistoricalDataPoint[] {
    const data: HistoricalDataPoint[] = [];
    
    // استخراج بيانات التدفق النقدي من المشاريع
    projects.forEach(project => {
      const monthlyInflow = project.contractValue / 12; // تبسيط للمثال
      const monthlyOutflow = project.actualCost / 12;
      
      data.push({
        date: project.startDate,
        value: monthlyInflow - monthlyOutflow,
        category: 'project_cashflow',
        projectId: project.id,
        metadata: { type: 'cashflow', direction: 'net' }
      });
    });
    
    return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private extractTenderSuccessData(tenders: Tender[]): HistoricalDataPoint[] {
    return tenders.map(tender => ({
      date: tender.submissionDate,
      value: tender.status === 'won' ? 1 : 0,
      category: 'tender_success',
      tenderId: tender.id,
      metadata: {
        winChance: tender.winChance,
        value: tender.value,
        competition: tender.competition
      }
    }));
  }

  private extractProjectDelayData(projects: Project[]): HistoricalDataPoint[] {
    return projects.map(project => {
      const plannedDuration = new Date(project.endDate).getTime() - new Date(project.startDate).getTime();
      const actualDuration = project.status === 'completed' ? plannedDuration : Date.now() - new Date(project.startDate).getTime();
      const delayRatio = (actualDuration - plannedDuration) / plannedDuration;
      
      return {
        date: project.startDate,
        value: Math.max(0, delayRatio),
        category: 'project_delay',
        projectId: project.id,
        metadata: {
          status: project.status,
          progress: project.progress,
          health: project.health
        }
      };
    });
  }

  private extractBudgetOverrunData(projects: Project[]): HistoricalDataPoint[] {
    return projects.map(project => {
      const overrunRatio = (project.actualCost - project.estimatedCost) / project.estimatedCost;
      
      return {
        date: project.startDate,
        value: Math.max(0, overrunRatio),
        category: 'budget_overrun',
        projectId: project.id,
        metadata: {
          estimatedCost: project.estimatedCost,
          actualCost: project.actualCost,
          status: project.status
        }
      };
    });
  }

  private extractResourceData(projects: Project[]): HistoricalDataPoint[] {
    // تبسيط لاستخراج بيانات الموارد
    return projects.map(project => ({
      date: project.startDate,
      value: project.contractValue / 100000, // تقدير عدد الموارد المطلوبة
      category: 'resource_demand',
      projectId: project.id,
      metadata: {
        type: project.type,
        phase: project.phase,
        team: project.team
      }
    }));
  }

  private extractTenderFeatures(tender: Tender): Record<string, number> {
    return {
      value: tender.value,
      winChance: tender.winChance,
      daysLeft: tender.daysLeft,
      progress: tender.progress,
      competition: this.encodeCompetition(tender.competition),
      priority: this.encodePriority(tender.priority)
    };
  }

  private extractProjectFeatures(project: Project): Record<string, number> {
    return {
      contractValue: project.contractValue,
      estimatedCost: project.estimatedCost,
      progress: project.progress,
      health: this.encodeHealth(project.health),
      priority: this.encodePriority(project.priority),
      riskLevel: this.encodeRiskLevel(project.riskLevel)
    };
  }

  private async generatePredictions(model: PredictionModel, data: HistoricalDataPoint[], timeframe: number): Promise<PredictionResult[]> {
    const predictions: PredictionResult[] = [];
    const baseDate = new Date();
    
    for (let i = 1; i <= timeframe; i++) {
      const targetDate = new Date(baseDate);
      targetDate.setMonth(targetDate.getMonth() + i);
      
      const prediction = await this.calculatePrediction(model, data, targetDate);
      predictions.push(prediction);
    }
    
    return predictions;
  }

  private async predictSingleValue(model: PredictionModel, features: Record<string, number>): Promise<PredictionResult> {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + 1);
    
    // تطبيق الخوارزمية المناسبة
    let predictedValue = 0;
    let confidence = model.confidence;
    
    switch (model.algorithm) {
      case 'linear_regression':
        predictedValue = this.applyLinearRegression(features, model.parameters);
        break;
      case 'neural_network':
        predictedValue = this.applyNeuralNetwork(features, model.parameters);
        break;
      case 'ensemble':
        predictedValue = this.applyEnsemble(features, model.parameters);
        break;
      default:
        predictedValue = Object.values(features).reduce((sum, val) => sum + val, 0) / Object.keys(features).length;
    }
    
    const variance = predictedValue * 0.1; // تقدير التباين
    
    return {
      id: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      modelId: model.id,
      targetDate: targetDate.toISOString(),
      predictedValue,
      confidence,
      upperBound: predictedValue + variance,
      lowerBound: Math.max(0, predictedValue - variance),
      factors: this.generatePredictionFactors(features),
      generatedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // صالح لأسبوع
    };
  }

  private async calculatePrediction(model: PredictionModel, data: HistoricalDataPoint[], targetDate: Date): Promise<PredictionResult> {
    // تطبيق خوارزمية التنبؤ حسب نوع النموذج
    const recentData = data.slice(-12); // آخر 12 نقطة بيانات
    const trend = this.calculateTrend(recentData);
    const seasonality = this.calculateSeasonality(recentData);
    
    let predictedValue = 0;
    
    if (recentData.length > 0) {
      const lastValue = recentData[recentData.length - 1].value;
      predictedValue = lastValue + trend + seasonality;
    }
    
    const variance = predictedValue * 0.15; // تقدير التباين
    
    return {
      id: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      modelId: model.id,
      targetDate: targetDate.toISOString(),
      predictedValue: Math.max(0, predictedValue),
      confidence: model.confidence,
      upperBound: predictedValue + variance,
      lowerBound: Math.max(0, predictedValue - variance),
      factors: this.generateTimeSeriesFactors(trend, seasonality),
      generatedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // صالح لشهر
    };
  }

  // دوال مساعدة للخوارزميات
  private applyLinearRegression(features: Record<string, number>, parameters: Record<string, any>): number {
    const weights = parameters.weights || {};
    const bias = parameters.bias || 0;
    
    let result = bias;
    for (const [feature, value] of Object.entries(features)) {
      result += (weights[feature] || 0.1) * value;
    }
    
    return result;
  }

  private applyNeuralNetwork(features: Record<string, number>, parameters: Record<string, any>): number {
    // تطبيق مبسط لشبكة عصبية
    const weights = parameters.weights || {};
    const featureValues = Object.values(features);
    
    // طبقة مخفية واحدة
    let hiddenSum = 0;
    featureValues.forEach((value, index) => {
      hiddenSum += value * (weights[`h1_${index}`] || 0.5);
    });
    
    // تطبيق دالة التفعيل (sigmoid)
    const activated = 1 / (1 + Math.exp(-hiddenSum));
    
    // طبقة الإخراج
    return activated * (weights.output || 100);
  }

  private applyEnsemble(features: Record<string, number>, parameters: Record<string, any>): number {
    // دمج عدة خوارزميات
    const linear = this.applyLinearRegression(features, parameters.linear || {});
    const neural = this.applyNeuralNetwork(features, parameters.neural || {});
    
    // متوسط مرجح
    const linearWeight = parameters.linearWeight || 0.6;
    const neuralWeight = parameters.neuralWeight || 0.4;
    
    return linear * linearWeight + neural * neuralWeight;
  }

  private calculateTrend(data: HistoricalDataPoint[]): number {
    if (data.length < 2) return 0;
    
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, point) => sum + point.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, point) => sum + point.value, 0) / secondHalf.length;
    
    return secondAvg - firstAvg;
  }

  private calculateSeasonality(data: HistoricalDataPoint[]): number {
    // تبسيط لحساب الموسمية
    const currentMonth = new Date().getMonth();
    const seasonalFactor = Math.sin((currentMonth / 12) * 2 * Math.PI) * 0.1;
    
    if (data.length > 0) {
      const avgValue = data.reduce((sum, point) => sum + point.value, 0) / data.length;
      return avgValue * seasonalFactor;
    }
    
    return 0;
  }

  private generatePredictionFactors(features: Record<string, number>): PredictionFactor[] {
    return Object.entries(features).map(([key, value]) => ({
      name: this.getFactorName(key),
      nameEn: key,
      impact: this.calculateImpact(value),
      weight: 1 / Object.keys(features).length,
      description: this.getFactorDescription(key),
      descriptionEn: `Impact of ${key} on prediction`
    }));
  }

  private generateTimeSeriesFactors(trend: number, seasonality: number): PredictionFactor[] {
    return [
      {
        name: 'الاتجاه العام',
        nameEn: 'Trend',
        impact: trend > 0 ? 50 : -50,
        weight: 0.6,
        description: 'تأثير الاتجاه العام للبيانات التاريخية',
        descriptionEn: 'Impact of historical data trend'
      },
      {
        name: 'الموسمية',
        nameEn: 'Seasonality',
        impact: seasonality * 100,
        weight: 0.4,
        description: 'تأثير العوامل الموسمية',
        descriptionEn: 'Impact of seasonal factors'
      }
    ];
  }

  // دوال تقييم المخاطر
  private async assessProjectRisks(projectId: string): Promise<RiskAssessment[]> {
    const project = await this.getProjectById(projectId);
    if (!project) return [];

    const risks: RiskAssessment[] = [];
    
    // تقييم مخاطر التأخير
    if (project.progress < 50 && project.health === 'red') {
      risks.push(this.createRiskAssessment('project_delay', 80, 70, projectId));
    }
    
    // تقييم مخاطر تجاوز الميزانية
    if (project.actualCost > project.estimatedCost * 0.9) {
      risks.push(this.createRiskAssessment('budget_overrun', 60, 80, projectId));
    }
    
    return risks;
  }

  private async assessTenderRisks(tenderId: string): Promise<RiskAssessment[]> {
    const tender = await this.getTenderById(tenderId);
    if (!tender) return [];

    const risks: RiskAssessment[] = [];
    
    // تقييم مخاطر السوق
    if (tender.winChance < 30) {
      risks.push(this.createRiskAssessment('market_change', 40, 60, undefined, tenderId));
    }
    
    return risks;
  }

  private async assessOverallRisks(): Promise<RiskAssessment[]> {
    const risks: RiskAssessment[] = [];
    
    // تقييم مخاطر عامة
    risks.push(this.createRiskAssessment('resource_shortage', 30, 50));
    
    return risks;
  }

  private createRiskAssessment(
    type: RiskAssessment['type'],
    probability: number,
    impact: number,
    projectId?: string,
    tenderId?: string
  ): RiskAssessment {
    return {
      id: `risk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      probability,
      impact,
      riskScore: (probability * impact) / 100,
      description: this.getRiskDescription(type),
      descriptionEn: this.getRiskDescriptionEn(type),
      mitigation: this.getRiskMitigation(type),
      mitigationEn: this.getRiskMitigationEn(type),
      projectId,
      tenderId,
      detectedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  // دوال إنشاء السيناريوهات
  private async createScenario(type: ForecastScenario['type'], predictionType: string, probability: number): Promise<ForecastScenario> {
    const predictions = await this.generateScenarioPredictions(type, predictionType);
    
    return {
      id: `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: this.getScenarioName(type),
      nameEn: type,
      type,
      probability,
      predictions,
      assumptions: this.getScenarioAssumptions(type),
      assumptionsEn: this.getScenarioAssumptionsEn(type),
      createdAt: new Date().toISOString()
    };
  }

  private async generateScenarioPredictions(scenarioType: ForecastScenario['type'], predictionType: string): Promise<PredictionResult[]> {
    // تعديل التنبؤات حسب نوع السيناريو
    const basePredictions = await this.predictRevenue(6);
    const multiplier = scenarioType === 'optimistic' ? 1.2 : scenarioType === 'pessimistic' ? 0.8 : 1.0;
    
    return basePredictions.map(pred => ({
      ...pred,
      predictedValue: pred.predictedValue * multiplier,
      upperBound: pred.upperBound * multiplier,
      lowerBound: pred.lowerBound * multiplier,
      confidence: pred.confidence * (scenarioType === 'realistic' ? 1.0 : 0.8)
    }));
  }

  // دوال مساعدة للترميز والتسمية
  private encodeCompetition(competition: string): number {
    const competitionMap: Record<string, number> = {
      'منافسة محدودة': 1,
      'منافسة متوسطة': 2,
      'منافسة عالية': 3,
      'منافسة شديدة': 4
    };
    return competitionMap[competition] || 2;
  }

  private encodePriority(priority: string): number {
    const priorityMap: Record<string, number> = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'critical': 4
    };
    return priorityMap[priority] || 2;
  }

  private encodeHealth(health: string): number {
    const healthMap: Record<string, number> = {
      'green': 3,
      'yellow': 2,
      'red': 1
    };
    return healthMap[health] || 2;
  }

  private encodeRiskLevel(riskLevel: string): number {
    const riskMap: Record<string, number> = {
      'low': 1,
      'medium': 2,
      'high': 3
    };
    return riskMap[riskLevel] || 2;
  }

  private calculateImpact(value: number): number {
    // تبسيط لحساب التأثير
    return Math.min(100, Math.max(-100, value / 1000));
  }

  private getModelName(type: PredictionModel['type']): string {
    const names: Record<PredictionModel['type'], string> = {
      'revenue': 'نموذج التنبؤ بالإيرادات',
      'cashflow': 'نموذج التنبؤ بالتدفق النقدي',
      'tender_success': 'نموذج التنبؤ بنجاح المنافسات',
      'project_delay': 'نموذج التنبؤ بتأخير المشاريع',
      'budget_overrun': 'نموذج التنبؤ بتجاوز الميزانية',
      'resource_demand': 'نموذج التنبؤ بالطلب على الموارد',
      'performance': 'نموذج التنبؤ بالأداء'
    };
    return names[type];
  }

  private getModelNameEn(type: PredictionModel['type']): string {
    const names: Record<PredictionModel['type'], string> = {
      'revenue': 'Revenue Prediction Model',
      'cashflow': 'Cash Flow Prediction Model',
      'tender_success': 'Tender Success Prediction Model',
      'project_delay': 'Project Delay Prediction Model',
      'budget_overrun': 'Budget Overrun Prediction Model',
      'resource_demand': 'Resource Demand Prediction Model',
      'performance': 'Performance Prediction Model'
    };
    return names[type];
  }

  private getDefaultParameters(algorithm: PredictionModel['algorithm']): Record<string, any> {
    const defaults: Record<PredictionModel['algorithm'], Record<string, any>> = {
      'linear_regression': { weights: {}, bias: 0 },
      'polynomial': { degree: 2, coefficients: [] },
      'exponential_smoothing': { alpha: 0.3, beta: 0.1, gamma: 0.1 },
      'arima': { p: 1, d: 1, q: 1 },
      'neural_network': { layers: [10, 5, 1], weights: {} },
      'ensemble': { linearWeight: 0.6, neuralWeight: 0.4 }
    };
    return defaults[algorithm];
  }

  private getFactorName(key: string): string {
    const names: Record<string, string> = {
      'value': 'القيمة',
      'winChance': 'فرصة الفوز',
      'daysLeft': 'الأيام المتبقية',
      'progress': 'نسبة الإنجاز',
      'competition': 'مستوى المنافسة',
      'priority': 'الأولوية',
      'contractValue': 'قيمة العقد',
      'estimatedCost': 'التكلفة المقدرة',
      'health': 'صحة المشروع',
      'riskLevel': 'مستوى المخاطر'
    };
    return names[key] || key;
  }

  private getFactorDescription(key: string): string {
    const descriptions: Record<string, string> = {
      'value': 'تأثير قيمة المشروع أو المنافسة على التنبؤ',
      'winChance': 'تأثير فرصة الفوز في المنافسة',
      'daysLeft': 'تأثير الوقت المتبقي للموعد النهائي',
      'progress': 'تأثير نسبة الإنجاز الحالية',
      'competition': 'تأثير مستوى المنافسة في السوق',
      'priority': 'تأثير أولوية المشروع أو المنافسة'
    };
    return descriptions[key] || `تأثير ${key} على التنبؤ`;
  }

  private getRiskDescription(type: RiskAssessment['type']): string {
    const descriptions: Record<RiskAssessment['type'], string> = {
      'project_delay': 'احتمالية تأخير المشروع عن الموعد المحدد',
      'budget_overrun': 'احتمالية تجاوز الميزانية المخصصة للمشروع',
      'quality_issue': 'احتمالية حدوث مشاكل في جودة التنفيذ',
      'resource_shortage': 'احتمالية نقص في الموارد المطلوبة',
      'market_change': 'احتمالية تغيرات في ظروف السوق'
    };
    return descriptions[type];
  }

  private getRiskDescriptionEn(type: RiskAssessment['type']): string {
    const descriptions: Record<RiskAssessment['type'], string> = {
      'project_delay': 'Probability of project delay beyond scheduled deadline',
      'budget_overrun': 'Probability of exceeding allocated project budget',
      'quality_issue': 'Probability of quality issues in project execution',
      'resource_shortage': 'Probability of shortage in required resources',
      'market_change': 'Probability of changes in market conditions'
    };
    return descriptions[type];
  }

  private getRiskMitigation(type: RiskAssessment['type']): string {
    const mitigations: Record<RiskAssessment['type'], string> = {
      'project_delay': 'مراجعة الجدولة الزمنية وتخصيص موارد إضافية',
      'budget_overrun': 'مراقبة التكاليف بشكل دوري وتحسين الكفاءة',
      'quality_issue': 'تعزيز إجراءات مراقبة الجودة والتدريب',
      'resource_shortage': 'التخطيط المسبق للموارد وإيجاد بدائل',
      'market_change': 'مراقبة السوق وتطوير استراتيجيات مرنة'
    };
    return mitigations[type];
  }

  private getRiskMitigationEn(type: RiskAssessment['type']): string {
    const mitigations: Record<RiskAssessment['type'], string> = {
      'project_delay': 'Review timeline and allocate additional resources',
      'budget_overrun': 'Monitor costs regularly and improve efficiency',
      'quality_issue': 'Enhance quality control procedures and training',
      'resource_shortage': 'Plan resources in advance and find alternatives',
      'market_change': 'Monitor market and develop flexible strategies'
    };
    return mitigations[type];
  }

  private getScenarioName(type: ForecastScenario['type']): string {
    const names: Record<ForecastScenario['type'], string> = {
      'optimistic': 'السيناريو المتفائل',
      'realistic': 'السيناريو الواقعي',
      'pessimistic': 'السيناريو المتشائم'
    };
    return names[type];
  }

  private getScenarioAssumptions(type: ForecastScenario['type']): string[] {
    const assumptions: Record<ForecastScenario['type'], string[]> = {
      'optimistic': [
        'نمو اقتصادي قوي',
        'زيادة في الطلب على الخدمات',
        'استقرار في أسعار المواد الخام',
        'عدم حدوث أزمات اقتصادية'
      ],
      'realistic': [
        'نمو اقتصادي معتدل',
        'استقرار في مستوى الطلب',
        'تقلبات طبيعية في الأسعار',
        'ظروف سوق عادية'
      ],
      'pessimistic': [
        'تباطؤ اقتصادي',
        'انخفاض في الطلب',
        'ارتفاع في تكاليف المواد',
        'عدم استقرار في السوق'
      ]
    };
    return assumptions[type];
  }

  private getScenarioAssumptionsEn(type: ForecastScenario['type']): string[] {
    const assumptions: Record<ForecastScenario['type'], string[]> = {
      'optimistic': [
        'Strong economic growth',
        'Increased demand for services',
        'Stable raw material prices',
        'No economic crises'
      ],
      'realistic': [
        'Moderate economic growth',
        'Stable demand levels',
        'Normal price fluctuations',
        'Regular market conditions'
      ],
      'pessimistic': [
        'Economic slowdown',
        'Decreased demand',
        'Rising material costs',
        'Market instability'
      ]
    };
    return assumptions[type];
  }

  // دوال مساعدة للوصول للبيانات
  private async getProjectById(id: string): Promise<Project | null> {
    const projects = await asyncStorage.getItem('projects') || [];
    return projects.find((p: Project) => p.id === id) || null;
  }

  private async getTenderById(id: string): Promise<Tender | null> {
    const tenders = await asyncStorage.getItem('tenders') || [];
    return tenders.find((t: Tender) => t.id === id) || null;
  }
}

export const predictiveAnalyticsService = new PredictiveAnalyticsService();
