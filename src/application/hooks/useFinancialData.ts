/**
 * 💰 Hook لإدارة البيانات المالية
 * Financial Data Management Hook
 */

import { useState, useEffect, useCallback } from 'react';
import type { Project } from '@/data/centralData';
import { useExpenses } from './useExpenses';
import { useProjects } from './useProjects';
import { useTenders } from './useTenders';

interface FinancialData {
  revenue: {
    total: number;
    monthly: number;
    growth: number;
    projects: number;
    tenders: number;
  };
  expenses: {
    total: number;
    monthly: number;
    operational: number;
    projects: number;
    overhead: number;
    equipment: number;
  };
  cashFlow: {
    current: number;
    incoming: number;
    outgoing: number;
    projected: number;
  };
  receivables: {
    total: number;
    overdue: number;
    current: number;
    upcoming: number;
  };
  profitability: {
    gross: number;
    net: number;
    margin: number;
    roi: number;
  };
  kpis: {
    revenuePerProject: number;
    costEfficiency: number;
    paymentCycle: number;
    budgetVariance: number;
  };
}

interface SupplierData {
  id: string;
  name: string;
  category: string;
  totalPurchases: number;
  outstandingBalance: number;
  paymentTerms: string;
  rating: number;
  lastTransaction: string;
  status: 'active' | 'inactive';
  contact: string;
  email: string;
}

export interface UseFinancialDataReturn {
  financialData: FinancialData;
  suppliersData: SupplierData[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  // 🔗 دوال إضافية للربط مع المشاريع والمشتريات
  getProjectActualCost: (projectId: string) => number;
  getProjectsWithActualCosts: () => ProjectFinancialSnapshot[];
}

interface ProjectFinancialSnapshot extends Project {
  budgetVariance: number;
  profitMargin: number;
  costEfficiency: number;
}

export const useFinancialData = (): UseFinancialDataReturn => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // استخدام الهوكز للبيانات الحقيقية
  const { expenses, refreshExpenses, loading: expensesLoading } = useExpenses();
  const { projects, refreshProjects, isLoading: projectsLoading } = useProjects();
  const { tenders, refreshTenders, isLoading: tendersLoading } = useTenders();
  const [isRefreshingSources, setIsRefreshingSources] = useState(false);

  // بيانات الموردين (يمكن نقلها لاحقاً إلى hook منفصل)
  const suppliersData: SupplierData[] = [
    {
      id: '1',
      name: 'شركة الخرسانة المتطورة',
      category: 'مواد بناء',
      totalPurchases: 2850000,
      outstandingBalance: 450000,
      paymentTerms: '30 يوم',
      rating: 4.8,
      lastTransaction: '2024-02-10',
      status: 'active',
      contact: '+966501234567',
      email: 'orders@concrete-co.sa'
    },
    {
      id: '2', 
      name: 'مصنع الحديد المتحد',
      category: 'حديد وتسليح',
      totalPurchases: 1950000,
      outstandingBalance: 280000,
      paymentTerms: '45 يوم',
      rating: 4.9,
      lastTransaction: '2024-02-08',
      status: 'active',
      contact: '+966501234568',
      email: 'sales@steel-united.sa'
    },
    {
      id: '3',
      name: 'شركة السباكة الحديثة', 
      category: 'سباكة وكهرباء',
      totalPurchases: 850000,
      outstandingBalance: 125000,
      paymentTerms: '30 يوم',
      rating: 4.6,
      lastTransaction: '2024-02-05',
      status: 'active',
      contact: '+966501234569',
      email: 'info@modern-plumbing.sa'
    },
    {
      id: '4',
      name: 'مؤسسة مواد البناء الحديثة',
      category: 'متنوعة',
      totalPurchases: 1200000,
      outstandingBalance: 0,
      paymentTerms: '15 يوم',
      rating: 4.7,
      lastTransaction: '2024-01-28',
      status: 'active',
      contact: '+966501234570',
      email: 'orders@modern-materials.sa'
    }
  ];

  // 🔗 دالة للحصول على التكاليف الفعلية لمشروع محدد
  const getProjectActualCost = useCallback((projectId: string): number => {
    const projectExpensesData = expenses.filter(expense => 
      expense.projectId === projectId
    );
    return projectExpensesData.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  // 🔗 دالة للحصول على تفاصيل التكاليف لجميع المشاريع
  const getProjectsWithActualCosts = useCallback((): ProjectFinancialSnapshot[] => {
    return projects.map((project) => {
      const actualCost = getProjectActualCost(project.id);
      const plannedBudget = project.budget ?? project.estimatedCost ?? 0;
      const contractValue = project.value ?? project.contractValue ?? 0;

      return {
        ...project,
        actualCost,
        budgetVariance: plannedBudget > 0 ? ((actualCost / plannedBudget) - 1) * 100 : 0,
        profitMargin: contractValue > 0 ? ((contractValue - actualCost) / contractValue) * 100 : 0,
        costEfficiency: plannedBudget > 0 ? (1 - (actualCost / plannedBudget)) * 100 : 0
      };
    });
  }, [projects, getProjectActualCost]);

  // حساب البيانات المالية من المصادر الحقيقية
  const calculateFinancialData = useCallback((): FinancialData => {
    // حساب إجمالي الإيرادات من المشاريع
    const totalRevenue = projects.reduce((sum, project) => {
      return sum + (project.value || 0);
    }, 0);

    // 🔗 حساب إجمالي التكاليف الفعلية من جميع المصروفات المرتبطة بالمشاريع
    console.log('📊 حساب التكاليف الفعلية من المشتريات والمصروفات...');
    const projectsCostAnalysis = getProjectsWithActualCosts();
    console.log('📈 تحليل تكاليف المشاريع:', projectsCostAnalysis);

    // حساب إجمالي المصروفات (تضمين المصروفات المرتبطة بالمشاريع والإدارية)
    const totalExpenses = expenses.reduce((sum, expense) => {
      return sum + expense.amount;
    }, 0);

    // فصل المصروفات حسب النوع
    const administrativeExpenses = expenses
      .filter(expense => expense.isAdministrative)
      .reduce((sum, expense) => sum + expense.amount, 0);

    const projectExpenses = expenses
      .filter(expense => !expense.isAdministrative)
      .reduce((sum, expense) => sum + expense.amount, 0);

    // حساب المصروفات الشهرية (متوسط آخر 3 أشهر)
    const currentDate = new Date();
    const threeMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1);
    
    const recentExpenses = expenses.filter(expense => 
      new Date(expense.createdAt) >= threeMonthsAgo
    );
    const monthlyExpenses = recentExpenses.reduce((sum, expense) => sum + expense.amount, 0) / 3;

    // حساب الإيرادات الشهرية
    const activeProjects = projects.filter(project => 
      project.status === 'active' || project.status === 'planning'
    ).length;

    const monthlyRevenue = totalRevenue / Math.max(activeProjects, 1) * 0.1; // تقدير 10% شهرياً

    // 📊 حساب النسب المالية والمؤشرات مع التكاليف الفعلية
    
    // 💰 حساب صافي الربح من التكاليف الفعلية:
    const grossProfit = totalRevenue - totalExpenses;
    const grossProfitMargin = totalRevenue > 0 ? 
      (grossProfit / totalRevenue) * 100 : 0;

    // تقدير الربح الصافي بعد الضرائب (15%) والمخصصات (5%)
    const netProfit = grossProfit * 0.80; // خصم 20% للضرائب والمخصصات
    const netProfitMargin = totalRevenue > 0 ? 
      (netProfit / totalRevenue) * 100 : 0;

    // 📈 حساب كفاءة الإنفاق (Cost Efficiency):
    // كفاءة الإنفاق = (1 - (إجمالي التكاليف / إجمالي الإيرادات)) × 100
    // كلما زادت النسبة، زادت الكفاءة في الإنفاق
    // مثال: إذا كانت الإيرادات 1,000,000 والتكاليف 750,000
    // كفاءة الإنفاق = (1 - 750,000/1,000,000) × 100 = 25%
    const costEfficiency = totalRevenue > 0 ? 
      Math.max(0, (1 - (totalExpenses / totalRevenue)) * 100) : 0;

    // حساب التدفق النقدي
    const cashFlow = totalRevenue - totalExpenses;
    const projectedIncoming = monthlyRevenue * 3; // توقعات 3 أشهر
    const projectedOutgoing = monthlyExpenses * 3;

    // حساب المستحقات
    const totalReceivables = projects
      .filter(project => project.status === 'completed')
      .reduce((sum, project) => sum + ((project.value || 0) * 0.2), 0); // 20% مستحقات

    const overdueReceivables = totalReceivables * 0.15; // تقدير 15% متأخرة

    return {
      revenue: {
        total: totalRevenue,
        monthly: monthlyRevenue,
        growth: 12.5, // يمكن حسابها بمقارنة الفترات
        projects: projects.filter(p => p.status === 'active').length,
        tenders: tenders.filter(t => t.status === 'won').length
      },
      expenses: {
        total: totalExpenses,
        monthly: monthlyExpenses,
        operational: administrativeExpenses,
        projects: projectExpenses,
        overhead: administrativeExpenses * 0.3,
        equipment: projectExpenses * 0.2
      },
      cashFlow: {
        current: cashFlow,
        incoming: projectedIncoming,
        outgoing: projectedOutgoing,
        projected: projectedIncoming - projectedOutgoing
      },
      receivables: {
        total: totalReceivables,
        overdue: overdueReceivables,
        current: totalReceivables - overdueReceivables,
        upcoming: monthlyRevenue * 2
      },
      profitability: {
        gross: grossProfitMargin,
        net: netProfitMargin,
        margin: grossProfitMargin,
        roi: (grossProfit / Math.max(totalExpenses, 1)) * 100
      },
      kpis: {
        revenuePerProject: totalRevenue / Math.max(projects.length, 1),
        costEfficiency: costEfficiency,
        paymentCycle: 45, // متوسط دورة التحصيل بالأيام
        budgetVariance: ((totalExpenses / totalRevenue) - 0.7) * 100 // انحراف عن ميزانية مستهدفة 70%
      }
    };
  }, [expenses, projects, getProjectsWithActualCosts, tenders]);

  const [financialData, setFinancialData] = useState<FinancialData>(() => calculateFinancialData());

  // تحديث البيانات عند تغيير المصادر
  useEffect(() => {
    setLoading(true);
    try {
      const newFinancialData = calculateFinancialData();
      setFinancialData(newFinancialData);
      setError(null);
    } catch (err) {
      console.error('❌ خطأ في حساب البيانات المالية:', err);
      setError('فشل في حساب البيانات المالية');
    } finally {
      setLoading(false);
    }
  }, [calculateFinancialData]);

  // دالة إعادة تحميل البيانات
  const refreshData = useCallback(async () => {
    setLoading(true);
    setIsRefreshingSources(true);
    try {
      await Promise.all([
        refreshExpenses(),
        refreshProjects(),
        refreshTenders(),
      ]);

      const newFinancialData = calculateFinancialData();
      setFinancialData(newFinancialData);
      setError(null);
      console.log('📊 تم تحديث البيانات المالية من المستودعات');
    } catch (err) {
      console.error('❌ خطأ في تحديث البيانات المالية:', err);
      setError('فشل في تحديث البيانات المالية');
    } finally {
      setLoading(false);
      setIsRefreshingSources(false);
    }
  }, [calculateFinancialData, refreshExpenses, refreshProjects, refreshTenders]);

  useEffect(() => {
    if (!isRefreshingSources) {
      setLoading(expensesLoading || projectsLoading || tendersLoading);
    }
  }, [expensesLoading, projectsLoading, tendersLoading, isRefreshingSources]);

  return {
    financialData,
    suppliersData,
  loading,
    error,
    refreshData,
    // 🔗 دوال إضافية للربط مع المشاريع والمشتريات
    getProjectActualCost,
    getProjectsWithActualCosts
  };
};
