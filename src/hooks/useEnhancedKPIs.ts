/**
 * Enhanced KPIs Hook
 * 
 * Hook مخصص لإدارة حالة المؤشرات المحسّنة
 * يوفر واجهة سهلة للوصول للمؤشرات وتحديثها
 * 
 * @version 1.0.0
 * @date 2024-01-15
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { EnhancedKPIService } from '@/services/enhancedKPIService';
import type { EnhancedKPICardProps } from '@/components/dashboard/enhanced/EnhancedKPICard';

interface UseEnhancedKPIsReturn {
  // البيانات
  criticalKPIs: EnhancedKPICardProps[];
  financialKPIs: EnhancedKPICardProps[];
  projectKPIs: EnhancedKPICardProps[];
  safetyKPIs: EnhancedKPICardProps[];
  
  // حالة التحميل
  isLoading: boolean;
  isRefreshing: boolean;
  
  // الأخطاء
  error: string | null;
  
  // الإجراءات
  refreshKPIs: () => Promise<void>;
  refreshCriticalKPIs: () => Promise<void>;
  refreshFinancialKPIs: () => Promise<void>;
  refreshProjectKPIs: () => Promise<void>;
  refreshSafetyKPIs: () => Promise<void>;
  
  // معلومات إضافية
  lastUpdated: Date | null;
  autoRefreshEnabled: boolean;
  setAutoRefreshEnabled: (enabled: boolean) => void;
}

interface UseEnhancedKPIsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // بالميلي ثانية
  loadOnMount?: boolean;
}

/**
 * Hook للمؤشرات المحسّنة
 */
export const useEnhancedKPIs = (options: UseEnhancedKPIsOptions = {}): UseEnhancedKPIsReturn => {
  const {
    autoRefresh = false,
    refreshInterval = 5 * 60 * 1000, // 5 دقائق افتراضياً
    loadOnMount = true
  } = options;

  // الحالة
  const [criticalKPIs, setCriticalKPIs] = useState<EnhancedKPICardProps[]>([]);
  const [financialKPIs, setFinancialKPIs] = useState<EnhancedKPICardProps[]>([]);
  const [projectKPIs, setProjectKPIs] = useState<EnhancedKPICardProps[]>([]);
  const [safetyKPIs, setSafetyKPIs] = useState<EnhancedKPICardProps[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefresh);

  // المراجع
  const kpiService = useRef(EnhancedKPIService.getInstance());
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  /**
   * تحميل المؤشرات الحرجة
   */
  const loadCriticalKPIs = useCallback(async (): Promise<void> => {
    try {
      const kpis = await kpiService.current.getCriticalKPIs();
      if (mountedRef.current) {
        setCriticalKPIs(kpis);
      }
    } catch (err) {
      console.error('خطأ في تحميل المؤشرات الحرجة:', err);
      if (mountedRef.current) {
        setError('فشل في تحميل المؤشرات الحرجة');
      }
    }
  }, []);

  /**
   * تحميل المؤشرات المالية
   */
  const loadFinancialKPIs = useCallback(async (): Promise<void> => {
    try {
      const kpis = await kpiService.current.getFinancialKPIs();
      if (mountedRef.current) {
        setFinancialKPIs(kpis);
      }
    } catch (err) {
      console.error('خطأ في تحميل المؤشرات المالية:', err);
      if (mountedRef.current) {
        setError('فشل في تحميل المؤشرات المالية');
      }
    }
  }, []);

  /**
   * تحميل مؤشرات المشاريع
   */
  const loadProjectKPIs = useCallback(async (): Promise<void> => {
    try {
      const kpis = await kpiService.current.getProjectKPIs();
      if (mountedRef.current) {
        setProjectKPIs(kpis);
      }
    } catch (err) {
      console.error('خطأ في تحميل مؤشرات المشاريع:', err);
      if (mountedRef.current) {
        setError('فشل في تحميل مؤشرات المشاريع');
      }
    }
  }, []);

  /**
   * تحميل مؤشرات السلامة
   */
  const loadSafetyKPIs = useCallback(async (): Promise<void> => {
    try {
      const kpis = await kpiService.current.getSafetyKPIs();
      if (mountedRef.current) {
        setSafetyKPIs(kpis);
      }
    } catch (err) {
      console.error('خطأ في تحميل مؤشرات السلامة:', err);
      if (mountedRef.current) {
        setError('فشل في تحميل مؤشرات السلامة');
      }
    }
  }, []);

  /**
   * تحميل جميع المؤشرات
   */
  const loadAllKPIs = useCallback(async (showLoading = true): Promise<void> => {
    if (showLoading && mountedRef.current) {
      setIsLoading(true);
    }
    
    setError(null);

    try {
      await Promise.all([
        loadCriticalKPIs(),
        loadFinancialKPIs(),
        loadProjectKPIs(),
        loadSafetyKPIs()
      ]);

      if (mountedRef.current) {
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('خطأ في تحميل المؤشرات:', err);
      if (mountedRef.current) {
        setError('فشل في تحميل المؤشرات');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [loadCriticalKPIs, loadFinancialKPIs, loadProjectKPIs, loadSafetyKPIs]);

  /**
   * تحديث جميع المؤشرات
   */
  const refreshKPIs = useCallback(async (): Promise<void> => {
    if (mountedRef.current) {
      setIsRefreshing(true);
    }
    await loadAllKPIs(false);
  }, [loadAllKPIs]);

  /**
   * تحديث المؤشرات الحرجة فقط
   */
  const refreshCriticalKPIs = useCallback(async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      await loadCriticalKPIs();
      if (mountedRef.current) {
        setLastUpdated(new Date());
      }
    } finally {
      if (mountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [loadCriticalKPIs]);

  /**
   * تحديث المؤشرات المالية فقط
   */
  const refreshFinancialKPIs = useCallback(async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      await loadFinancialKPIs();
      if (mountedRef.current) {
        setLastUpdated(new Date());
      }
    } finally {
      if (mountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [loadFinancialKPIs]);

  /**
   * تحديث مؤشرات المشاريع فقط
   */
  const refreshProjectKPIs = useCallback(async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      await loadProjectKPIs();
      if (mountedRef.current) {
        setLastUpdated(new Date());
      }
    } finally {
      if (mountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [loadProjectKPIs]);

  /**
   * تحديث مؤشرات السلامة فقط
   */
  const refreshSafetyKPIs = useCallback(async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      await loadSafetyKPIs();
      if (mountedRef.current) {
        setLastUpdated(new Date());
      }
    } finally {
      if (mountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [loadSafetyKPIs]);

  /**
   * إعداد التحديث التلقائي
   */
  const setupAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    if (autoRefreshEnabled && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        refreshKPIs();
      }, refreshInterval);
    }
  }, [autoRefreshEnabled, refreshInterval, refreshKPIs]);

  /**
   * تحميل البيانات عند التحميل الأولي
   */
  useEffect(() => {
    if (loadOnMount) {
      loadAllKPIs();
    }
  }, [loadOnMount, loadAllKPIs]);

  /**
   * إعداد التحديث التلقائي
   */
  useEffect(() => {
    setupAutoRefresh();

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [setupAutoRefresh]);

  /**
   * تنظيف عند إلغاء التحميل
   */
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    // البيانات
    criticalKPIs,
    financialKPIs,
    projectKPIs,
    safetyKPIs,
    
    // حالة التحميل
    isLoading,
    isRefreshing,
    
    // الأخطاء
    error,
    
    // الإجراءات
    refreshKPIs,
    refreshCriticalKPIs,
    refreshFinancialKPIs,
    refreshProjectKPIs,
    refreshSafetyKPIs,
    
    // معلومات إضافية
    lastUpdated,
    autoRefreshEnabled,
    setAutoRefreshEnabled
  };
};
