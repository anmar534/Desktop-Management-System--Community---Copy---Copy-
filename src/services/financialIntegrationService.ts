/**
 * خدمة التكامل المالي
 * Financial Integration Service
 * 
 * تدير التكامل بين النظام المالي وأنظمة إدارة المشاريع والمنافسات
 * Manages integration between financial system and project/tender management systems
 */

import { asyncStorage } from '../utils/storage';

// أنواع البيانات المالية
export interface FinancialData {
  id: string;
  type: 'project' | 'tender' | 'invoice' | 'payment' | 'expense';
  entityId: string; // معرف المشروع أو المنافسة
  amount: number;
  currency: string;
  date: string;
  description: string;
  category: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// إعدادات التكامل
export interface IntegrationSettings {
  autoSync: boolean;
  syncInterval: number; // بالدقائق
  enableProjectIntegration: boolean;
  enableTenderIntegration: boolean;
  enableRealTimeUpdates: boolean;
  notificationSettings: {
    emailNotifications: boolean;
    systemNotifications: boolean;
    criticalAlertsOnly: boolean;
  };
}

// نتائج التزامن
export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsUpdated: number;
  recordsCreated: number;
  errors: string[];
  timestamp: string;
}

// إحصائيات الأداء
export interface PerformanceMetrics {
  queryExecutionTime: number;
  dataProcessingTime: number;
  syncLatency: number;
  errorRate: number;
  throughput: number;
}

export class FinancialIntegrationService {
  private readonly STORAGE_KEY = 'financial_integration';
  private readonly SETTINGS_KEY = 'integration_settings';
  private readonly SYNC_LOG_KEY = 'sync_log';
  
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeService();
  }

  /**
   * تهيئة الخدمة
   * Initialize service
   */
  private async initializeService(): Promise<void> {
    const settings = await this.getIntegrationSettings();
    if (settings.autoSync) {
      this.startAutoSync();
    }
  }

  /**
   * الحصول على إعدادات التكامل
   * Get integration settings
   */
  async getIntegrationSettings(): Promise<IntegrationSettings> {
    const settings = await asyncStorage.getItem(this.SETTINGS_KEY);
    return settings || {
      autoSync: true,
      syncInterval: 15, // كل 15 دقيقة
      enableProjectIntegration: true,
      enableTenderIntegration: true,
      enableRealTimeUpdates: true,
      notificationSettings: {
        emailNotifications: true,
        systemNotifications: true,
        criticalAlertsOnly: false,
      },
    };
  }

  /**
   * تحديث إعدادات التكامل
   * Update integration settings
   */
  async updateIntegrationSettings(settings: Partial<IntegrationSettings>): Promise<void> {
    const currentSettings = await this.getIntegrationSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    
    await asyncStorage.setItem(this.SETTINGS_KEY, updatedSettings);
    
    // إعادة تشغيل التزامن التلقائي إذا تغيرت الإعدادات
    if (settings.autoSync !== undefined || settings.syncInterval !== undefined) {
      this.stopAutoSync();
      if (updatedSettings.autoSync) {
        this.startAutoSync();
      }
    }
  }

  /**
   * تكامل البيانات المالية مع المشاريع
   * Integrate financial data with projects
   */
  async integrateWithProjects(): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: true,
      recordsProcessed: 0,
      recordsUpdated: 0,
      recordsCreated: 0,
      errors: [],
      timestamp: new Date().toISOString(),
    };

    try {
      // الحصول على بيانات المشاريع
      const projects = await asyncStorage.getItem('projects') || [];
      
      for (const project of projects) {
        try {
          // تحديث البيانات المالية للمشروع
          await this.updateProjectFinancialData(project);
          result.recordsProcessed++;
          
          // إنشاء سجلات مالية جديدة إذا لزم الأمر
          const newRecords = await this.createFinancialRecordsForProject(project);
          result.recordsCreated += newRecords.length;
          
        } catch (error) {
          result.errors.push(`خطأ في معالجة المشروع ${project.id}: ${error.message}`);
          result.success = false;
        }
      }

      // حفظ نتائج التزامن
      await this.saveSyncResult('projects', result);
      
    } catch (error) {
      result.success = false;
      result.errors.push(`خطأ عام في تكامل المشاريع: ${error.message}`);
    }

    return result;
  }

  /**
   * تكامل البيانات المالية مع المنافسات
   * Integrate financial data with tenders
   */
  async integrateWithTenders(): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: true,
      recordsProcessed: 0,
      recordsUpdated: 0,
      recordsCreated: 0,
      errors: [],
      timestamp: new Date().toISOString(),
    };

    try {
      // الحصول على بيانات المنافسات
      const tenders = await asyncStorage.getItem('tenders') || [];
      
      for (const tender of tenders) {
        try {
          // تحديث البيانات المالية للمنافسة
          await this.updateTenderFinancialData(tender);
          result.recordsProcessed++;
          
          // إنشاء سجلات مالية جديدة إذا لزم الأمر
          const newRecords = await this.createFinancialRecordsForTender(tender);
          result.recordsCreated += newRecords.length;
          
        } catch (error) {
          result.errors.push(`خطأ في معالجة المنافسة ${tender.id}: ${error.message}`);
          result.success = false;
        }
      }

      // حفظ نتائج التزامن
      await this.saveSyncResult('tenders', result);
      
    } catch (error) {
      result.success = false;
      result.errors.push(`خطأ عام في تكامل المنافسات: ${error.message}`);
    }

    return result;
  }

  /**
   * تحديث البيانات المالية للمشروع
   * Update project financial data
   */
  private async updateProjectFinancialData(project: any): Promise<void> {
    // حساب التكاليف الفعلية
    const actualCosts = await this.calculateProjectActualCosts(project.id);
    
    // حساب الإيرادات المحققة
    const actualRevenue = await this.calculateProjectActualRevenue(project.id);
    
    // حساب الربحية
    const profitability = actualRevenue - actualCosts;
    const profitMargin = actualRevenue > 0 ? (profitability / actualRevenue) * 100 : 0;
    
    // تحديث بيانات المشروع
    const updatedProject = {
      ...project,
      financialData: {
        actualCosts,
        actualRevenue,
        profitability,
        profitMargin,
        lastUpdated: new Date().toISOString(),
      },
    };
    
    // حفظ البيانات المحدثة
    const projects = await asyncStorage.getItem('projects') || [];
    const projectIndex = projects.findIndex(p => p.id === project.id);
    if (projectIndex !== -1) {
      projects[projectIndex] = updatedProject;
      await asyncStorage.setItem('projects', projects);
    }
  }

  /**
   * تحديث البيانات المالية للمنافسة
   * Update tender financial data
   */
  private async updateTenderFinancialData(tender: any): Promise<void> {
    // حساب تكاليف المشاركة
    const participationCosts = await this.calculateTenderParticipationCosts(tender.id);
    
    // حساب القيمة المتوقعة
    const expectedValue = tender.estimatedValue || 0;
    
    // حساب نسبة الفوز المتوقعة
    const winProbability = await this.calculateWinProbability(tender);
    
    // تحديث بيانات المنافسة
    const updatedTender = {
      ...tender,
      financialData: {
        participationCosts,
        expectedValue,
        winProbability,
        expectedROI: expectedValue > 0 ? ((expectedValue - participationCosts) / participationCosts) * 100 : 0,
        lastUpdated: new Date().toISOString(),
      },
    };
    
    // حفظ البيانات المحدثة
    const tenders = await asyncStorage.getItem('tenders') || [];
    const tenderIndex = tenders.findIndex(t => t.id === tender.id);
    if (tenderIndex !== -1) {
      tenders[tenderIndex] = updatedTender;
      await asyncStorage.setItem('tenders', tenders);
    }
  }

  /**
   * إنشاء سجلات مالية للمشروع
   * Create financial records for project
   */
  private async createFinancialRecordsForProject(project: any): Promise<FinancialData[]> {
    const records: FinancialData[] = [];
    
    // إنشاء سجل للإيرادات المتوقعة
    if (project.contractValue && project.contractValue > 0) {
      const revenueRecord: FinancialData = {
        id: `revenue_${project.id}_${Date.now()}`,
        type: 'project',
        entityId: project.id,
        amount: project.contractValue,
        currency: 'SAR',
        date: project.startDate || new Date().toISOString(),
        description: `إيرادات متوقعة من المشروع: ${project.name}`,
        category: 'revenue',
        status: 'pending',
        metadata: { projectId: project.id, type: 'expected_revenue' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      records.push(revenueRecord);
    }
    
    // حفظ السجلات
    if (records.length > 0) {
      const existingRecords = await asyncStorage.getItem(this.STORAGE_KEY) || [];
      await asyncStorage.setItem(this.STORAGE_KEY, [...existingRecords, ...records]);
    }
    
    return records;
  }

  /**
   * إنشاء سجلات مالية للمنافسة
   * Create financial records for tender
   */
  private async createFinancialRecordsForTender(tender: any): Promise<FinancialData[]> {
    const records: FinancialData[] = [];
    
    // إنشاء سجل لتكاليف المشاركة
    const participationCost = await this.calculateTenderParticipationCosts(tender.id);
    if (participationCost > 0) {
      const costRecord: FinancialData = {
        id: `cost_${tender.id}_${Date.now()}`,
        type: 'tender',
        entityId: tender.id,
        amount: -participationCost, // سالب لأنه تكلفة
        currency: 'SAR',
        date: tender.submissionDate || new Date().toISOString(),
        description: `تكاليف المشاركة في المنافسة: ${tender.title}`,
        category: 'expense',
        status: 'completed',
        metadata: { tenderId: tender.id, type: 'participation_cost' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      records.push(costRecord);
    }
    
    // حفظ السجلات
    if (records.length > 0) {
      const existingRecords = await asyncStorage.getItem(this.STORAGE_KEY) || [];
      await asyncStorage.setItem(this.STORAGE_KEY, [...existingRecords, ...records]);
    }
    
    return records;
  }

  /**
   * حساب التكاليف الفعلية للمشروع
   * Calculate project actual costs
   */
  private async calculateProjectActualCosts(projectId: string): Promise<number> {
    const expenses = await asyncStorage.getItem('expenses') || [];
    return expenses
      .filter(expense => expense.projectId === projectId)
      .reduce((total, expense) => total + (expense.amount || 0), 0);
  }

  /**
   * حساب الإيرادات الفعلية للمشروع
   * Calculate project actual revenue
   */
  private async calculateProjectActualRevenue(projectId: string): Promise<number> {
    const invoices = await asyncStorage.getItem('invoices') || [];
    return invoices
      .filter(invoice => invoice.projectId === projectId && invoice.status === 'paid')
      .reduce((total, invoice) => total + (invoice.amount || 0), 0);
  }

  /**
   * حساب تكاليف المشاركة في المنافسة
   * Calculate tender participation costs
   */
  private async calculateTenderParticipationCosts(tenderId: string): Promise<number> {
    // تكاليف ثابتة للمشاركة (يمكن تخصيصها)
    const baseCost = 5000; // ريال سعودي
    
    // تكاليف إضافية حسب نوع المنافسة
    const tender = await this.getTenderById(tenderId);
    let additionalCosts = 0;
    
    if (tender?.category === 'construction') {
      additionalCosts += 10000;
    } else if (tender?.category === 'consulting') {
      additionalCosts += 3000;
    }
    
    return baseCost + additionalCosts;
  }

  /**
   * حساب احتمالية الفوز
   * Calculate win probability
   */
  private async calculateWinProbability(tender: any): Promise<number> {
    // خوارزمية بسيطة لحساب احتمالية الفوز
    let probability = 50; // نسبة أساسية 50%
    
    // تعديل حسب الخبرة السابقة
    const pastTenders = await this.getPastTendersByCategory(tender.category);
    const winRate = this.calculateHistoricalWinRate(pastTenders);
    probability = (probability + winRate) / 2;
    
    // تعديل حسب حجم المنافسة
    if (tender.estimatedValue < 100000) {
      probability += 10; // منافسات صغيرة - فرصة أكبر
    } else if (tender.estimatedValue > 1000000) {
      probability -= 10; // منافسات كبيرة - فرصة أقل
    }
    
    return Math.max(0, Math.min(100, probability));
  }

  /**
   * بدء التزامن التلقائي
   * Start auto sync
   */
  private async startAutoSync(): Promise<void> {
    const settings = await this.getIntegrationSettings();
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(async () => {
      try {
        if (settings.enableProjectIntegration) {
          await this.integrateWithProjects();
        }
        
        if (settings.enableTenderIntegration) {
          await this.integrateWithTenders();
        }
      } catch (error) {
        console.error('خطأ في التزامن التلقائي:', error);
      }
    }, settings.syncInterval * 60 * 1000); // تحويل الدقائق إلى ميلي ثانية
  }

  /**
   * إيقاف التزامن التلقائي
   * Stop auto sync
   */
  private stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * حفظ نتائج التزامن
   * Save sync result
   */
  private async saveSyncResult(type: string, result: SyncResult): Promise<void> {
    const syncLog = await asyncStorage.getItem(this.SYNC_LOG_KEY) || [];
    syncLog.push({ type, ...result });
    
    // الاحتفاظ بآخر 100 سجل فقط
    if (syncLog.length > 100) {
      syncLog.splice(0, syncLog.length - 100);
    }
    
    await asyncStorage.setItem(this.SYNC_LOG_KEY, syncLog);
  }

  /**
   * الحصول على سجل التزامن
   * Get sync log
   */
  async getSyncLog(): Promise<Array<SyncResult & { type: string }>> {
    return await asyncStorage.getItem(this.SYNC_LOG_KEY) || [];
  }

  /**
   * مساعدات خاصة
   * Private helpers
   */
  private async getTenderById(tenderId: string): Promise<any> {
    const tenders = await asyncStorage.getItem('tenders') || [];
    return tenders.find(t => t.id === tenderId);
  }

  private async getPastTendersByCategory(category: string): Promise<any[]> {
    const tenders = await asyncStorage.getItem('tenders') || [];
    return tenders.filter(t => t.category === category && t.status === 'completed');
  }

  private calculateHistoricalWinRate(pastTenders: any[]): number {
    if (pastTenders.length === 0) return 50;
    
    const wonTenders = pastTenders.filter(t => t.result === 'won');
    return (wonTenders.length / pastTenders.length) * 100;
  }

  /**
   * تنظيف الموارد
   * Cleanup resources
   */
  destroy(): void {
    this.stopAutoSync();
  }
}
