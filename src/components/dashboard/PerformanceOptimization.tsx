/**
 * مكون تحسين الأداء والتجربة
 * Performance Optimization Component
 * 
 * يوفر واجهة شاملة لمراقبة وتحسين أداء التطبيق وتجربة المستخدم
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import { Switch } from '../ui/switch';
import { 
  Activity, 
  Zap, 
  Database, 
  Gauge, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  MemoryStick,
  Wifi,
  HardDrive,
  Cpu,
  Monitor,
  Settings,
  BarChart3,
  RefreshCw,
  Download,
  Upload,
  Layers,
  Image,
  FileText
} from 'lucide-react';
import { performanceOptimizationService, PerformanceMetrics } from '../../services/performanceOptimizationService';

interface PerformanceOptimizationState {
  metrics: PerformanceMetrics[];
  currentMetrics: {
    pageLoadTime: number;
    renderTime: number;
    memoryUsage: number;
    networkLatency: number;
    cacheHitRate: number;
    errorRate: number;
  };
  optimizations: {
    caching: boolean;
    compression: boolean;
    lazyLoading: boolean;
    preloading: boolean;
    memoryCleanup: boolean;
  };
  loading: boolean;
  error: string | null;
  selectedTimeRange: string;
  performanceScore: number;
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    complexity: 'simple' | 'moderate' | 'complex';
    estimatedImprovement: number;
  }>;
}

export const PerformanceOptimization: React.FC = () => {
  const [state, setState] = useState<PerformanceOptimizationState>({
    metrics: [],
    currentMetrics: {
      pageLoadTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      networkLatency: 0,
      cacheHitRate: 0,
      errorRate: 0
    },
    optimizations: {
      caching: true,
      compression: true,
      lazyLoading: true,
      preloading: false,
      memoryCleanup: true
    },
    loading: true,
    error: null,
    selectedTimeRange: '24h',
    performanceScore: 0,
    recommendations: []
  });

  // تحميل البيانات
  const loadData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // محاكاة تحميل مقاييس الأداء
      const mockMetrics = await generateMockMetrics();
      const currentMetrics = calculateCurrentMetrics(mockMetrics);
      const performanceScore = calculatePerformanceScore(currentMetrics);
      const recommendations = generateRecommendations(currentMetrics);

      setState(prev => ({
        ...prev,
        metrics: mockMetrics,
        currentMetrics,
        performanceScore,
        recommendations,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'حدث خطأ في تحميل البيانات'
      }));
    }
  }, []);

  useEffect(() => {
    loadData();
    
    // تحديث المقاييس كل 30 ثانية
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // محاكاة مقاييس الأداء
  const generateMockMetrics = async (): Promise<PerformanceMetrics[]> => {
    const metrics: PerformanceMetrics[] = [];
    const now = Date.now();
    
    for (let i = 0; i < 24; i++) {
      metrics.push({
        id: `metrics_${i}`,
        timestamp: new Date(now - (i * 3600000)).toISOString(),
        pageLoadTime: 1000 + Math.random() * 2000,
        renderTime: 100 + Math.random() * 300,
        memoryUsage: 50 + Math.random() * 100,
        networkLatency: 50 + Math.random() * 200,
        cacheHitRate: 0.7 + Math.random() * 0.3,
        errorRate: Math.random() * 0.05,
        userInteractionDelay: 10 + Math.random() * 50,
        bundleSize: 2 + Math.random() * 3,
        route: '/dashboard',
        userAgent: 'Chrome/91.0',
        deviceType: 'desktop',
        connectionType: 'fast'
      });
    }
    
    return metrics.reverse();
  };

  // حساب المقاييس الحالية
  const calculateCurrentMetrics = (metrics: PerformanceMetrics[]) => {
    if (metrics.length === 0) {
      return {
        pageLoadTime: 0,
        renderTime: 0,
        memoryUsage: 0,
        networkLatency: 0,
        cacheHitRate: 0,
        errorRate: 0
      };
    }

    const recent = metrics.slice(-5); // آخر 5 قياسات
    
    return {
      pageLoadTime: recent.reduce((sum, m) => sum + m.pageLoadTime, 0) / recent.length,
      renderTime: recent.reduce((sum, m) => sum + m.renderTime, 0) / recent.length,
      memoryUsage: recent.reduce((sum, m) => sum + m.memoryUsage, 0) / recent.length,
      networkLatency: recent.reduce((sum, m) => sum + m.networkLatency, 0) / recent.length,
      cacheHitRate: recent.reduce((sum, m) => sum + m.cacheHitRate, 0) / recent.length,
      errorRate: recent.reduce((sum, m) => sum + m.errorRate, 0) / recent.length
    };
  };

  // حساب نقاط الأداء
  const calculatePerformanceScore = (metrics: any): number => {
    let score = 100;
    
    // تقليل النقاط بناءً على وقت التحميل
    if (metrics.pageLoadTime > 3000) score -= 30;
    else if (metrics.pageLoadTime > 2000) score -= 20;
    else if (metrics.pageLoadTime > 1000) score -= 10;
    
    // تقليل النقاط بناءً على استهلاك الذاكرة
    if (metrics.memoryUsage > 150) score -= 20;
    else if (metrics.memoryUsage > 100) score -= 10;
    
    // تقليل النقاط بناءً على معدل الأخطاء
    score -= metrics.errorRate * 1000;
    
    // زيادة النقاط بناءً على معدل إصابة التخزين المؤقت
    score += (metrics.cacheHitRate - 0.5) * 20;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  // توليد التوصيات
  const generateRecommendations = (metrics: any) => {
    const recommendations = [];
    
    if (metrics.pageLoadTime > 2000) {
      recommendations.push({
        id: 'slow_loading',
        title: 'تحسين سرعة التحميل',
        description: 'وقت تحميل الصفحة أبطأ من المطلوب. يُنصح بتفعيل الضغط والتخزين المؤقت.',
        impact: 'high' as const,
        complexity: 'moderate' as const,
        estimatedImprovement: 40
      });
    }
    
    if (metrics.memoryUsage > 100) {
      recommendations.push({
        id: 'memory_optimization',
        title: 'تحسين استهلاك الذاكرة',
        description: 'استهلاك الذاكرة مرتفع. يُنصح بتنظيف الذاكرة وتحسين إدارة البيانات.',
        impact: 'medium' as const,
        complexity: 'moderate' as const,
        estimatedImprovement: 25
      });
    }
    
    if (metrics.cacheHitRate < 0.8) {
      recommendations.push({
        id: 'cache_optimization',
        title: 'تحسين التخزين المؤقت',
        description: 'معدل إصابة التخزين المؤقت منخفض. يُنصح بمراجعة استراتيجية التخزين المؤقت.',
        impact: 'medium' as const,
        complexity: 'simple' as const,
        estimatedImprovement: 20
      });
    }
    
    if (metrics.networkLatency > 150) {
      recommendations.push({
        id: 'network_optimization',
        title: 'تحسين الشبكة',
        description: 'زمن استجابة الشبكة مرتفع. يُنصح بتحسين طلبات الشبكة واستخدام CDN.',
        impact: 'high' as const,
        complexity: 'complex' as const,
        estimatedImprovement: 35
      });
    }
    
    return recommendations;
  };

  // تطبيق التحسين
  const applyOptimization = useCallback(async (type: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // محاكاة تطبيق التحسين
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setState(prev => ({
        ...prev,
        optimizations: {
          ...prev.optimizations,
          [type]: true
        },
        loading: false
      }));
      
      // إعادة تحميل البيانات لإظهار التحسن
      setTimeout(loadData, 500);
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'حدث خطأ في تطبيق التحسين'
      }));
    }
  }, [loadData]);

  // الحصول على لون نقاط الأداء
  const getPerformanceScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // الحصول على أيقونة التأثير
  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  // مكون مقاييس الأداء
  const PerformanceMetricsComponent: React.FC = () => (
    <div className="space-y-6">
      {/* نقاط الأداء الإجمالية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            نقاط الأداء الإجمالية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(state.performanceScore / 100) * 314} 314`}
                  className={getPerformanceScoreColor(state.performanceScore)}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-3xl font-bold ${getPerformanceScoreColor(state.performanceScore)}`}>
                  {state.performanceScore}
                </span>
              </div>
            </div>
          </div>
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              {state.performanceScore >= 90 ? 'ممتاز' : 
               state.performanceScore >= 70 ? 'جيد' : 'يحتاج تحسين'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* مقاييس الأداء التفصيلية */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">وقت التحميل</p>
                <p className="text-2xl font-bold">
                  {Math.round(state.currentMetrics.pageLoadTime)}ms
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">استهلاك الذاكرة</p>
                <p className="text-2xl font-bold">
                  {Math.round(state.currentMetrics.memoryUsage)}MB
                </p>
              </div>
              <MemoryStick className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">زمن الشبكة</p>
                <p className="text-2xl font-bold">
                  {Math.round(state.currentMetrics.networkLatency)}ms
                </p>
              </div>
              <Wifi className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">معدل التخزين المؤقت</p>
                <p className="text-2xl font-bold">
                  {Math.round(state.currentMetrics.cacheHitRate * 100)}%
                </p>
              </div>
              <Database className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">معدل الأخطاء</p>
                <p className="text-2xl font-bold">
                  {(state.currentMetrics.errorRate * 100).toFixed(2)}%
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">وقت العرض</p>
                <p className="text-2xl font-bold">
                  {Math.round(state.currentMetrics.renderTime)}ms
                </p>
              </div>
              <Monitor className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // مكون التحسينات
  const OptimizationsComponent: React.FC = () => (
    <div className="space-y-6">
      <div className="grid gap-4">
        {/* التخزين المؤقت */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <CardTitle className="text-lg">التخزين المؤقت الذكي</CardTitle>
              </div>
              <Switch
                checked={state.optimizations.caching}
                onCheckedChange={() => applyOptimization('caching')}
              />
            </div>
            <CardDescription>
              تحسين أداء التطبيق من خلال تخزين البيانات المؤقت
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm">التحسن المتوقع: +30%</span>
              <Badge variant={state.optimizations.caching ? "default" : "secondary"}>
                {state.optimizations.caching ? "مفعل" : "معطل"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* الضغط */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                <CardTitle className="text-lg">ضغط الأصول</CardTitle>
              </div>
              <Switch
                checked={state.optimizations.compression}
                onCheckedChange={() => applyOptimization('compression')}
              />
            </div>
            <CardDescription>
              تقليل حجم الملفات لتحسين سرعة التحميل
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm">التحسن المتوقع: +25%</span>
              <Badge variant={state.optimizations.compression ? "default" : "secondary"}>
                {state.optimizations.compression ? "مفعل" : "معطل"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* التحميل الكسول */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                <CardTitle className="text-lg">التحميل الكسول</CardTitle>
              </div>
              <Switch
                checked={state.optimizations.lazyLoading}
                onCheckedChange={() => applyOptimization('lazyLoading')}
              />
            </div>
            <CardDescription>
              تحميل المكونات عند الحاجة فقط
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm">التحسن المتوقع: +20%</span>
              <Badge variant={state.optimizations.lazyLoading ? "default" : "secondary"}>
                {state.optimizations.lazyLoading ? "مفعل" : "معطل"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* التحميل المسبق */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                <CardTitle className="text-lg">التحميل المسبق</CardTitle>
              </div>
              <Switch
                checked={state.optimizations.preloading}
                onCheckedChange={() => applyOptimization('preloading')}
              />
            </div>
            <CardDescription>
              تحميل الموارد المهمة مسبقاً
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm">التحسن المتوقع: +15%</span>
              <Badge variant={state.optimizations.preloading ? "default" : "secondary"}>
                {state.optimizations.preloading ? "مفعل" : "معطل"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* تنظيف الذاكرة */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                <CardTitle className="text-lg">تنظيف الذاكرة</CardTitle>
              </div>
              <Switch
                checked={state.optimizations.memoryCleanup}
                onCheckedChange={() => applyOptimization('memoryCleanup')}
              />
            </div>
            <CardDescription>
              تنظيف الذاكرة تلقائياً لتحسين الأداء
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm">التحسن المتوقع: +18%</span>
              <Badge variant={state.optimizations.memoryCleanup ? "default" : "secondary"}>
                {state.optimizations.memoryCleanup ? "مفعل" : "معطل"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // مكون التوصيات
  const RecommendationsComponent: React.FC = () => (
    <div className="space-y-4">
      {state.recommendations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>لا توجد توصيات حالياً</p>
          <p className="text-sm">الأداء ممتاز!</p>
        </div>
      ) : (
        state.recommendations.map((recommendation) => (
          <Card key={recommendation.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getImpactIcon(recommendation.impact)}
                  <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={recommendation.impact === 'high' ? 'destructive' : 
                                 recommendation.impact === 'medium' ? 'default' : 'secondary'}>
                    {recommendation.impact === 'high' ? 'تأثير عالي' :
                     recommendation.impact === 'medium' ? 'تأثير متوسط' : 'تأثير منخفض'}
                  </Badge>
                  <Badge variant="outline">
                    +{recommendation.estimatedImprovement}%
                  </Badge>
                </div>
              </div>
              <CardDescription>{recommendation.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  التعقيد: {recommendation.complexity === 'simple' ? 'بسيط' :
                           recommendation.complexity === 'moderate' ? 'متوسط' : 'معقد'}
                </span>
                <Button size="sm" onClick={() => applyOptimization(recommendation.id)}>
                  تطبيق التحسين
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  if (state.loading && state.metrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل بيانات الأداء...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">تحسين الأداء والتجربة</h1>
          <p className="text-gray-600">مراقبة وتحسين أداء التطبيق وتجربة المستخدم</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={state.loading}>
            <RefreshCw className={`h-4 w-4 ml-2 ${state.loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 ml-2" />
            تقرير مفصل
          </Button>
        </div>
      </div>

      {/* رسالة الخطأ */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{state.error}</p>
        </div>
      )}

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">مقاييس الأداء</TabsTrigger>
          <TabsTrigger value="optimizations">التحسينات</TabsTrigger>
          <TabsTrigger value="recommendations">التوصيات</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics">
          <PerformanceMetricsComponent />
        </TabsContent>

        <TabsContent value="optimizations">
          <OptimizationsComponent />
        </TabsContent>

        <TabsContent value="recommendations">
          <RecommendationsComponent />
        </TabsContent>
      </Tabs>
    </div>
  );
};
