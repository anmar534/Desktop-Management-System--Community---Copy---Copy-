/**
 * مكون تحسين تجربة المستخدم
 * User Experience Optimization Component
 * 
 * يوفر أدوات لمراقبة وتحسين تجربة المستخدم
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
import { Slider } from '../ui/slider';
import { 
  Users, 
  Heart, 
  Eye, 
  MousePointer, 
  Smartphone, 
  Monitor, 
  Tablet,
  Accessibility,
  Palette,
  Type,
  Volume2,
  Contrast,
  ZoomIn,
  Navigation,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Settings,
  BarChart3,
  RefreshCw,
  Star,
  ThumbsUp,
  MessageSquare
} from 'lucide-react';

interface UserExperienceMetrics {
  userSatisfaction: number;
  taskCompletionRate: number;
  averageTaskTime: number;
  errorRecoveryRate: number;
  accessibilityScore: number;
  mobileUsability: number;
  visualDesignScore: number;
  navigationEfficiency: number;
  loadingExperience: number;
  interactionFeedback: number;
}

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  colorBlindSupport: boolean;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
}

interface UserFeedback {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  category: 'usability' | 'design' | 'performance' | 'accessibility' | 'general';
  timestamp: string;
  resolved: boolean;
}

interface UXOptimizationState {
  metrics: UserExperienceMetrics;
  accessibilitySettings: AccessibilitySettings;
  feedback: UserFeedback[];
  loading: boolean;
  error: string | null;
  selectedDevice: 'desktop' | 'tablet' | 'mobile';
  uxScore: number;
  improvements: Array<{
    id: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
    category: string;
  }>;
}

export const UserExperienceOptimization: React.FC = () => {
  const [state, setState] = useState<UXOptimizationState>({
    metrics: {
      userSatisfaction: 0,
      taskCompletionRate: 0,
      averageTaskTime: 0,
      errorRecoveryRate: 0,
      accessibilityScore: 0,
      mobileUsability: 0,
      visualDesignScore: 0,
      navigationEfficiency: 0,
      loadingExperience: 0,
      interactionFeedback: 0
    },
    accessibilitySettings: {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      screenReader: false,
      keyboardNavigation: true,
      colorBlindSupport: false,
      fontSize: 16,
      lineHeight: 1.5,
      letterSpacing: 0
    },
    feedback: [],
    loading: true,
    error: null,
    selectedDevice: 'desktop',
    uxScore: 0,
    improvements: []
  });

  // تحميل البيانات
  const loadData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // محاكاة تحميل مقاييس تجربة المستخدم
      const mockMetrics = generateMockUXMetrics();
      const mockFeedback = generateMockFeedback();
      const uxScore = calculateUXScore(mockMetrics);
      const improvements = generateImprovements(mockMetrics);

      setState(prev => ({
        ...prev,
        metrics: mockMetrics,
        feedback: mockFeedback,
        uxScore,
        improvements,
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
  }, [loadData]);

  // محاكاة مقاييس تجربة المستخدم
  const generateMockUXMetrics = (): UserExperienceMetrics => ({
    userSatisfaction: 75 + Math.random() * 20,
    taskCompletionRate: 80 + Math.random() * 15,
    averageTaskTime: 120 + Math.random() * 60,
    errorRecoveryRate: 70 + Math.random() * 25,
    accessibilityScore: 65 + Math.random() * 30,
    mobileUsability: 70 + Math.random() * 25,
    visualDesignScore: 80 + Math.random() * 15,
    navigationEfficiency: 75 + Math.random() * 20,
    loadingExperience: 85 + Math.random() * 10,
    interactionFeedback: 78 + Math.random() * 17
  });

  // محاكاة تعليقات المستخدمين
  const generateMockFeedback = (): UserFeedback[] => [
    {
      id: '1',
      userId: 'user1',
      rating: 4,
      comment: 'التطبيق سهل الاستخدام ولكن يحتاج تحسين في السرعة',
      category: 'performance',
      timestamp: new Date().toISOString(),
      resolved: false
    },
    {
      id: '2',
      userId: 'user2',
      rating: 5,
      comment: 'تصميم ممتاز وواجهة بديهية',
      category: 'design',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      resolved: true
    },
    {
      id: '3',
      userId: 'user3',
      rating: 3,
      comment: 'صعوبة في التنقل على الهاتف المحمول',
      category: 'usability',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      resolved: false
    }
  ];

  // حساب نقاط تجربة المستخدم
  const calculateUXScore = (metrics: UserExperienceMetrics): number => {
    const weights = {
      userSatisfaction: 0.2,
      taskCompletionRate: 0.15,
      averageTaskTime: 0.1,
      errorRecoveryRate: 0.1,
      accessibilityScore: 0.15,
      mobileUsability: 0.1,
      visualDesignScore: 0.1,
      navigationEfficiency: 0.05,
      loadingExperience: 0.03,
      interactionFeedback: 0.02
    };

    let score = 0;
    score += metrics.userSatisfaction * weights.userSatisfaction;
    score += metrics.taskCompletionRate * weights.taskCompletionRate;
    score += (200 - metrics.averageTaskTime) / 2 * weights.averageTaskTime; // تحويل الوقت إلى نقاط
    score += metrics.errorRecoveryRate * weights.errorRecoveryRate;
    score += metrics.accessibilityScore * weights.accessibilityScore;
    score += metrics.mobileUsability * weights.mobileUsability;
    score += metrics.visualDesignScore * weights.visualDesignScore;
    score += metrics.navigationEfficiency * weights.navigationEfficiency;
    score += metrics.loadingExperience * weights.loadingExperience;
    score += metrics.interactionFeedback * weights.interactionFeedback;

    return Math.round(Math.max(0, Math.min(100, score)));
  };

  // توليد التحسينات المقترحة
  const generateImprovements = (metrics: UserExperienceMetrics) => {
    const improvements = [];

    if (metrics.accessibilityScore < 80) {
      improvements.push({
        id: 'accessibility',
        title: 'تحسين إمكانية الوصول',
        description: 'إضافة دعم أفضل لقارئات الشاشة والتنقل بلوحة المفاتيح',
        impact: 'high' as const,
        effort: 'medium' as const,
        category: 'إمكانية الوصول'
      });
    }

    if (metrics.mobileUsability < 75) {
      improvements.push({
        id: 'mobile',
        title: 'تحسين تجربة الهاتف المحمول',
        description: 'تحسين التصميم المتجاوب وسهولة الاستخدام على الأجهزة المحمولة',
        impact: 'high' as const,
        effort: 'high' as const,
        category: 'التصميم المتجاوب'
      });
    }

    if (metrics.averageTaskTime > 150) {
      improvements.push({
        id: 'efficiency',
        title: 'تحسين كفاءة المهام',
        description: 'تبسيط العمليات وتقليل عدد الخطوات المطلوبة',
        impact: 'medium' as const,
        effort: 'medium' as const,
        category: 'سهولة الاستخدام'
      });
    }

    if (metrics.userSatisfaction < 80) {
      improvements.push({
        id: 'satisfaction',
        title: 'تحسين رضا المستخدمين',
        description: 'معالجة نقاط الألم الرئيسية وتحسين التجربة العامة',
        impact: 'high' as const,
        effort: 'low' as const,
        category: 'تجربة المستخدم'
      });
    }

    return improvements;
  };

  // تطبيق إعدادات إمكانية الوصول
  const updateAccessibilitySetting = useCallback((setting: keyof AccessibilitySettings, value: any) => {
    setState(prev => ({
      ...prev,
      accessibilitySettings: {
        ...prev.accessibilitySettings,
        [setting]: value
      }
    }));

    // تطبيق الإعدادات على DOM
    const root = document.documentElement;
    
    switch (setting) {
      case 'highContrast':
        root.classList.toggle('high-contrast', value);
        break;
      case 'largeText':
        root.classList.toggle('large-text', value);
        break;
      case 'reducedMotion':
        root.classList.toggle('reduced-motion', value);
        break;
      case 'fontSize':
        root.style.setProperty('--base-font-size', `${value}px`);
        break;
      case 'lineHeight':
        root.style.setProperty('--base-line-height', value.toString());
        break;
      case 'letterSpacing':
        root.style.setProperty('--base-letter-spacing', `${value}px`);
        break;
    }
  }, []);

  // الحصول على لون نقاط UX
  const getUXScoreColor = (score: number): string => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // مكون مقاييس تجربة المستخدم
  const UXMetricsComponent: React.FC = () => (
    <div className="space-y-6">
      {/* نقاط تجربة المستخدم الإجمالية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            نقاط تجربة المستخدم
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
                  strokeDasharray={`${(state.uxScore / 100) * 314} 314`}
                  className={getUXScoreColor(state.uxScore)}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-3xl font-bold ${getUXScoreColor(state.uxScore)}`}>
                  {state.uxScore}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* مقاييس تفصيلية */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">رضا المستخدمين</p>
                <p className="text-2xl font-bold">
                  {Math.round(state.metrics.userSatisfaction)}%
                </p>
              </div>
              <ThumbsUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">معدل إكمال المهام</p>
                <p className="text-2xl font-bold">
                  {Math.round(state.metrics.taskCompletionRate)}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">متوسط وقت المهمة</p>
                <p className="text-2xl font-bold">
                  {Math.round(state.metrics.averageTaskTime)}s
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إمكانية الوصول</p>
                <p className="text-2xl font-bold">
                  {Math.round(state.metrics.accessibilityScore)}%
                </p>
              </div>
              <Accessibility className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">سهولة الاستخدام المحمول</p>
                <p className="text-2xl font-bold">
                  {Math.round(state.metrics.mobileUsability)}%
                </p>
              </div>
              <Smartphone className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">جودة التصميم</p>
                <p className="text-2xl font-bold">
                  {Math.round(state.metrics.visualDesignScore)}%
                </p>
              </div>
              <Palette className="h-8 w-8 text-pink-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // مكون إعدادات إمكانية الوصول
  const AccessibilityComponent: React.FC = () => (
    <div className="space-y-6">
      <div className="grid gap-6">
        {/* إعدادات بصرية */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              الإعدادات البصرية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="high-contrast">تباين عالي</Label>
              <Switch
                id="high-contrast"
                checked={state.accessibilitySettings.highContrast}
                onCheckedChange={(value) => updateAccessibilitySetting('highContrast', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="large-text">نص كبير</Label>
              <Switch
                id="large-text"
                checked={state.accessibilitySettings.largeText}
                onCheckedChange={(value) => updateAccessibilitySetting('largeText', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="reduced-motion">تقليل الحركة</Label>
              <Switch
                id="reduced-motion"
                checked={state.accessibilitySettings.reducedMotion}
                onCheckedChange={(value) => updateAccessibilitySetting('reducedMotion', value)}
              />
            </div>

            <div className="space-y-2">
              <Label>حجم الخط: {state.accessibilitySettings.fontSize}px</Label>
              <Slider
                value={[state.accessibilitySettings.fontSize]}
                onValueChange={([value]) => updateAccessibilitySetting('fontSize', value)}
                min={12}
                max={24}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>ارتفاع السطر: {state.accessibilitySettings.lineHeight}</Label>
              <Slider
                value={[state.accessibilitySettings.lineHeight]}
                onValueChange={([value]) => updateAccessibilitySetting('lineHeight', value)}
                min={1.2}
                max={2.0}
                step={0.1}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* إعدادات التنقل */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              إعدادات التنقل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="keyboard-nav">التنقل بلوحة المفاتيح</Label>
              <Switch
                id="keyboard-nav"
                checked={state.accessibilitySettings.keyboardNavigation}
                onCheckedChange={(value) => updateAccessibilitySetting('keyboardNavigation', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="screen-reader">دعم قارئ الشاشة</Label>
              <Switch
                id="screen-reader"
                checked={state.accessibilitySettings.screenReader}
                onCheckedChange={(value) => updateAccessibilitySetting('screenReader', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="color-blind">دعم عمى الألوان</Label>
              <Switch
                id="color-blind"
                checked={state.accessibilitySettings.colorBlindSupport}
                onCheckedChange={(value) => updateAccessibilitySetting('colorBlindSupport', value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // مكون تعليقات المستخدمين
  const FeedbackComponent: React.FC = () => (
    <div className="space-y-4">
      {state.feedback.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>لا توجد تعليقات حالياً</p>
        </div>
      ) : (
        state.feedback.map((feedback) => (
          <Card key={feedback.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <Badge variant={feedback.resolved ? "default" : "secondary"}>
                    {feedback.resolved ? "تم الحل" : "قيد المراجعة"}
                  </Badge>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(feedback.timestamp).toLocaleDateString('ar-SA')}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-2">{feedback.comment}</p>
              <div className="flex items-center justify-between">
                <Badge variant="outline">
                  {feedback.category === 'usability' ? 'سهولة الاستخدام' :
                   feedback.category === 'design' ? 'التصميم' :
                   feedback.category === 'performance' ? 'الأداء' :
                   feedback.category === 'accessibility' ? 'إمكانية الوصول' : 'عام'}
                </Badge>
                {!feedback.resolved && (
                  <Button size="sm" variant="outline">
                    وضع علامة كمحلول
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل بيانات تجربة المستخدم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">تحسين تجربة المستخدم</h1>
          <p className="text-gray-600">مراقبة وتحسين تجربة المستخدم وإمكانية الوصول</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={state.loading}>
            <RefreshCw className={`h-4 w-4 ml-2 ${state.loading ? 'animate-spin' : ''}`} />
            تحديث
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
          <TabsTrigger value="metrics">مقاييس التجربة</TabsTrigger>
          <TabsTrigger value="accessibility">إمكانية الوصول</TabsTrigger>
          <TabsTrigger value="feedback">تعليقات المستخدمين</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics">
          <UXMetricsComponent />
        </TabsContent>

        <TabsContent value="accessibility">
          <AccessibilityComponent />
        </TabsContent>

        <TabsContent value="feedback">
          <FeedbackComponent />
        </TabsContent>
      </Tabs>
    </div>
  );
};
