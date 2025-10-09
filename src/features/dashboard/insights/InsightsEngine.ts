/**
 * Smart Insights Engine
 *
 * محرك ذكي لتوليد الإحصاءات والتنبيهات
 * يحلل البيانات المالية ويكتشف الأنماط والمشاكل
 *
 * @version 1.0.0
 * @date 2025-10-07
 */

import type { SmartInsight, InsightRule } from '../types';

// ============================================
// Types for Financial Data
// ============================================

interface FinancialMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  cashflow: number;
  projectsCount: number;
  tendersCount: number;
  overdueInvoices: number;
  budgetUtilization: number;
}

// ============================================
// Insight Rules
// ============================================

/**
 * قاعدة: تجاوز الميزانية
 */
const budgetOverrunRule: InsightRule = {
  id: 'budget-overrun',
  name: 'تجاوز الميزانية',
  description: 'يكتشف المشاريع التي تجاوزت ميزانيتها',
  enabled: true,
  condition: (data: unknown) => {
    const metrics = data as FinancialMetrics;
    return metrics.budgetUtilization > 100;
  },
  generateInsight: (data: unknown): SmartInsight => {
    const metrics = data as FinancialMetrics;
    return {
      id: `budget-overrun-${Date.now()}`,
      type: 'alert',
      priority: 'high',
      title: '⚠️ تجاوز الميزانية',
      description: `استخدام الميزانية وصل إلى ${metrics.budgetUtilization.toFixed(1)}% من الإجمالي`,
      data: {
        metric: 'استخدام الميزانية',
        value: metrics.budgetUtilization,
        threshold: 100,
        trend: 'increasing',
      },
      action: {
        label: 'مراجعة الميزانيات',
        onClick: () => {
          // Navigate to budgets page
          console.log('Navigate to budgets');
        },
      },
      createdAt: new Date(),
    };
  },
};

/**
 * قاعدة: فواتير متأخرة
 */
const overdueInvoicesRule: InsightRule = {
  id: 'overdue-invoices',
  name: 'فواتير متأخرة',
  description: 'يكتشف الفواتير المتأخرة في السداد',
  enabled: true,
  condition: (data: unknown) => {
    const metrics = data as FinancialMetrics;
    return metrics.overdueInvoices > 0;
  },
  generateInsight: (data: unknown): SmartInsight => {
    const metrics = data as FinancialMetrics;
    return {
      id: `overdue-invoices-${Date.now()}`,
      type: 'warning',
      priority: 'high',
      title: '📋 فواتير متأخرة',
      description: `يوجد ${metrics.overdueInvoices} فاتورة متأخرة في السداد`,
      data: {
        metric: 'الفواتير المتأخرة',
        value: metrics.overdueInvoices,
        trend: 'stable',
      },
      action: {
        label: 'عرض الفواتير',
        onClick: () => {
          console.log('Navigate to invoices');
        },
      },
      createdAt: new Date(),
    };
  },
};

/**
 * قاعدة: تدفق نقدي منخفض
 */
const lowCashflowRule: InsightRule = {
  id: 'low-cashflow',
  name: 'تدفق نقدي منخفض',
  description: 'يكتشف انخفاض التدفق النقدي',
  enabled: true,
  condition: (data: unknown) => {
    const metrics = data as FinancialMetrics;
    return metrics.cashflow < metrics.totalExpenses * 0.2;
  },
  generateInsight: (data: unknown): SmartInsight => {
    const metrics = data as FinancialMetrics;
    const daysLeft = Math.floor((metrics.cashflow / metrics.totalExpenses) * 30);

    return {
      id: `low-cashflow-${Date.now()}`,
      type: 'warning',
      priority: 'high',
      title: '💰 تدفق نقدي منخفض',
      description: `التدفق النقدي الحالي يكفي لـ ${daysLeft} يوم فقط`,
      data: {
        metric: 'التدفق النقدي',
        value: metrics.cashflow,
        threshold: metrics.totalExpenses * 0.2,
        trend: 'decreasing',
      },
      action: {
        label: 'عرض التدفق النقدي',
        onClick: () => {
          console.log('Navigate to cashflow');
        },
      },
      createdAt: new Date(),
    };
  },
};

/**
 * قاعدة: ربحية ممتازة
 */
const excellentProfitRule: InsightRule = {
  id: 'excellent-profit',
  name: 'ربحية ممتازة',
  description: 'يكتشف الأداء المالي الممتاز',
  enabled: true,
  condition: (data: unknown) => {
    const metrics = data as FinancialMetrics;
    const profitMargin = (metrics.netProfit / metrics.totalRevenue) * 100;
    return profitMargin > 20 && metrics.totalRevenue > 0;
  },
  generateInsight: (data: unknown): SmartInsight => {
    const metrics = data as FinancialMetrics;
    const profitMargin = ((metrics.netProfit / metrics.totalRevenue) * 100).toFixed(1);

    return {
      id: `excellent-profit-${Date.now()}`,
      type: 'success',
      priority: 'medium',
      title: '🎉 أداء مالي ممتاز',
      description: `هامش الربح الحالي ${profitMargin}% - أداء متميز!`,
      data: {
        metric: 'هامش الربح',
        value: parseFloat(profitMargin),
        trend: 'stable',
      },
      createdAt: new Date(),
    };
  },
};

/**
 * قاعدة: نشاط كبير في المشاريع
 */
const highProjectActivityRule: InsightRule = {
  id: 'high-project-activity',
  name: 'نشاط كبير في المشاريع',
  description: 'يكتشف النشاط المرتفع في المشاريع',
  enabled: true,
  condition: (data: unknown) => {
    const metrics = data as FinancialMetrics;
    return metrics.projectsCount > 10;
  },
  generateInsight: (data: unknown): SmartInsight => {
    const metrics = data as FinancialMetrics;

    return {
      id: `high-project-activity-${Date.now()}`,
      type: 'info',
      priority: 'low',
      title: '📊 نشاط كبير',
      description: `لديك ${metrics.projectsCount} مشروع قيد التنفيذ - تأكد من المتابعة الدورية`,
      data: {
        metric: 'المشاريع النشطة',
        value: metrics.projectsCount,
        trend: 'stable',
      },
      action: {
        label: 'عرض المشاريع',
        onClick: () => {
          console.log('Navigate to projects');
        },
      },
      createdAt: new Date(),
    };
  },
};

// ============================================
// Insights Engine
// ============================================

export class InsightsEngine {
  private rules: InsightRule[] = [
    budgetOverrunRule,
    overdueInvoicesRule,
    lowCashflowRule,
    excellentProfitRule,
    highProjectActivityRule,
  ];

  /**
   * تحليل البيانات وتوليد الإحصاءات
   */
  public analyze(metrics: FinancialMetrics): SmartInsight[] {
    const insights: SmartInsight[] = [];

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      try {
        if (rule.condition(metrics)) {
          const insight = rule.generateInsight(metrics);
          if (insight) {
            insights.push(insight);
          }
        }
      } catch (error) {
        console.error(`Error in rule ${rule.id}:`, error);
      }
    }

    // ترتيب حسب الأولوية
    return insights.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * إضافة قاعدة مخصصة
   */
  public addRule(rule: InsightRule): void {
    this.rules.push(rule);
  }

  /**
   * تعطيل/تفعيل قاعدة
   */
  public toggleRule(ruleId: string, enabled: boolean): void {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * الحصول على جميع القواعد
   */
  public getRules(): InsightRule[] {
    return this.rules;
  }
}

export default InsightsEngine;
