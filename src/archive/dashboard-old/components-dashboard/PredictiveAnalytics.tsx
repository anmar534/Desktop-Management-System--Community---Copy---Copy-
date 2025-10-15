import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Brain, 
  BarChart3,
  Calendar,
  DollarSign,
  Users,
  Clock,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { predictiveAnalyticsService, type PredictionResult, type RiskAssessment, type ForecastScenario } from '@/services/predictiveAnalyticsService';

interface PredictiveAnalyticsState {
  predictions: {
    revenue: PredictionResult[];
    cashflow: PredictionResult[];
    resources: PredictionResult[];
  };
  risks: RiskAssessment[];
  scenarios: ForecastScenario[];
  loading: boolean;
  error: string | null;
  selectedTimeframe: number;
  selectedScenario: string;
  lastUpdated: string | null;
}

interface PredictionCardProps {
  title: string;
  titleEn: string;
  predictions: PredictionResult[];
  icon: React.ElementType;
  color: string;
  format?: (value: number) => string;
}

interface RiskCardProps {
  risk: RiskAssessment;
  onMitigate?: (riskId: string) => void;
}

interface ScenarioComparisonProps {
  scenarios: ForecastScenario[];
  selectedMetric: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const PredictionCard: React.FC<PredictionCardProps> = ({ 
  title, 
  titleEn, 
  predictions, 
  icon: Icon, 
  color,
  format = (value) => value.toLocaleString('ar-SA')
}) => {
  const latestPrediction = predictions[0];
  const trend = predictions.length > 1 ? 
    predictions[0].predictedValue - predictions[1].predictedValue : 0;

  if (!latestPrediction) {
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className={`h-4 w-4 text-${color}-600`} />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">لا توجد بيانات متاحة</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}-600`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{format(latestPrediction.predictedValue)}</div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          {trend > 0 ? (
            <TrendingUp className="h-3 w-3 text-green-600" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-600" />
          )}
          <span>{Math.abs(trend).toFixed(1)}% من الشهر السابق</span>
        </div>
        <div className="mt-2">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>مستوى الثقة</span>
            <span>{latestPrediction.confidence}%</span>
          </div>
          <Progress value={latestPrediction.confidence} className="h-1" />
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          <div>النطاق: {format(latestPrediction.lowerBound)} - {format(latestPrediction.upperBound)}</div>
        </div>
      </CardContent>
    </Card>
  );
};

const RiskCard: React.FC<RiskCardProps> = ({ risk, onMitigate }) => {
  const getRiskColor = (score: number) => {
    if (score >= 70) return 'red';
    if (score >= 40) return 'yellow';
    return 'green';
  };

  const getRiskLevel = (score: number) => {
    if (score >= 70) return 'عالية';
    if (score >= 40) return 'متوسطة';
    return 'منخفضة';
  };

  const riskColor = getRiskColor(risk.riskScore);
  const riskLevel = getRiskLevel(risk.riskScore);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{risk.description}</CardTitle>
          <Badge variant={riskColor === 'red' ? 'destructive' : riskColor === 'yellow' ? 'secondary' : 'default'}>
            {riskLevel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">الاحتمالية</div>
            <div className="font-medium">{risk.probability}%</div>
          </div>
          <div>
            <div className="text-muted-foreground">التأثير</div>
            <div className="font-medium">{risk.impact}%</div>
          </div>
        </div>
        
        <div>
          <div className="text-xs text-muted-foreground mb-1">نقاط المخاطر</div>
          <Progress value={risk.riskScore} className="h-2" />
          <div className="text-xs text-muted-foreground mt-1">{risk.riskScore.toFixed(1)}/100</div>
        </div>

        <div className="text-xs text-muted-foreground">
          <div className="font-medium mb-1">استراتيجية التخفيف:</div>
          <div>{risk.mitigation}</div>
        </div>

        {onMitigate && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onMitigate(risk.id)}
            className="w-full"
          >
            تطبيق استراتيجية التخفيف
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({ scenarios, selectedMetric }) => {
  const chartData = scenarios.map(scenario => ({
    name: scenario.name,
    probability: scenario.probability * 100,
    value: scenario.predictions[0]?.predictedValue || 0,
    confidence: scenario.predictions[0]?.confidence || 0
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">مقارنة السيناريوهات</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => [value.toLocaleString('ar-SA'), 'القيمة']} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">توزيع الاحتماليات</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="probability"
                  label={({ name, probability }) => `${name}: ${probability}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((scenario, index) => (
          <Card key={scenario.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                {scenario.name}
                <Badge style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                  {(scenario.probability * 100).toFixed(0)}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-lg font-bold">
                {scenario.predictions[0]?.predictedValue.toLocaleString('ar-SA') || 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">
                <div className="font-medium mb-1">الافتراضات الرئيسية:</div>
                <ul className="list-disc list-inside space-y-1">
                  {scenario.assumptions.slice(0, 2).map((assumption, idx) => (
                    <li key={idx}>{assumption}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const PredictiveAnalytics: React.FC = () => {
  const [state, setState] = useState<PredictiveAnalyticsState>({
    predictions: {
      revenue: [],
      cashflow: [],
      resources: []
    },
    risks: [],
    scenarios: [],
    loading: true,
    error: null,
    selectedTimeframe: 12,
    selectedScenario: 'revenue',
    lastUpdated: null
  });

  const loadPredictions = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const [revenue, cashflow, resources, risks, scenarios] = await Promise.all([
        predictiveAnalyticsService.predictRevenue(state.selectedTimeframe),
        predictiveAnalyticsService.predictCashFlow(state.selectedTimeframe),
        predictiveAnalyticsService.predictResourceDemand(state.selectedTimeframe),
        predictiveAnalyticsService.assessRisks(),
        predictiveAnalyticsService.generateForecastScenarios(state.selectedScenario as any)
      ]);

      setState(prev => ({
        ...prev,
        predictions: { revenue, cashflow, resources },
        risks: risks.slice(0, 6), // أهم 6 مخاطر
        scenarios,
        loading: false,
        lastUpdated: new Date().toISOString()
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'حدث خطأ في تحميل التحليلات التنبؤية'
      }));
    }
  }, [state.selectedTimeframe, state.selectedScenario]);

  useEffect(() => {
    loadPredictions();
  }, [loadPredictions]);

  const handleTimeframeChange = (timeframe: string) => {
    setState(prev => ({ ...prev, selectedTimeframe: parseInt(timeframe) }));
  };

  const handleScenarioChange = (scenario: string) => {
    setState(prev => ({ ...prev, selectedScenario: scenario }));
  };

  const handleMitigateRisk = async (riskId: string) => {
    // تطبيق استراتيجية تخفيف المخاطر
    console.log('Mitigating risk:', riskId);
    // يمكن إضافة منطق إضافي هنا
  };

  const exportPredictions = () => {
    const data = {
      predictions: state.predictions,
      risks: state.risks,
      scenarios: state.scenarios,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predictive-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const prepareTrendData = (predictions: PredictionResult[]) => {
    return predictions.map(pred => ({
      date: new Date(pred.targetDate).toLocaleDateString('ar-SA', { month: 'short', year: 'numeric' }),
      predicted: pred.predictedValue,
      upper: pred.upperBound,
      lower: pred.lowerBound,
      confidence: pred.confidence
    }));
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>جاري تحليل البيانات وإنشاء التنبؤات...</span>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{state.error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">التحليلات التنبؤية الذكية</h2>
          <p className="text-muted-foreground">
            تنبؤات مدعومة بالذكاء الاصطناعي للأداء المالي والتشغيلي
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={state.selectedTimeframe.toString()} onValueChange={handleTimeframeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6 أشهر</SelectItem>
              <SelectItem value="12">12 شهر</SelectItem>
              <SelectItem value="18">18 شهر</SelectItem>
              <SelectItem value="24">24 شهر</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadPredictions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            تحديث
          </Button>
          <Button variant="outline" size="sm" onClick={exportPredictions}>
            <Download className="h-4 w-4 mr-2" />
            تصدير
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PredictionCard
          title="التنبؤ بالإيرادات"
          titleEn="Revenue Prediction"
          predictions={state.predictions.revenue}
          icon={DollarSign}
          color="green"
          format={(value) => `${value.toLocaleString('ar-SA')} ر.س`}
        />
        <PredictionCard
          title="التدفق النقدي المتوقع"
          titleEn="Cash Flow Prediction"
          predictions={state.predictions.cashflow}
          icon={TrendingUp}
          color="blue"
          format={(value) => `${value.toLocaleString('ar-SA')} ر.س`}
        />
        <PredictionCard
          title="الطلب على الموارد"
          titleEn="Resource Demand"
          predictions={state.predictions.resources}
          icon={Users}
          color="purple"
          format={(value) => `${value.toFixed(1)} موظف`}
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">الاتجاهات</TabsTrigger>
          <TabsTrigger value="risks">المخاطر</TabsTrigger>
          <TabsTrigger value="scenarios">السيناريوهات</TabsTrigger>
          <TabsTrigger value="models">النماذج</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  توقعات الإيرادات
                </CardTitle>
                <CardDescription>
                  التنبؤ بالإيرادات للأشهر القادمة مع نطاقات الثقة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={prepareTrendData(state.predictions.revenue)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [value.toLocaleString('ar-SA'), 'ر.س']} />
                    <Area type="monotone" dataKey="upper" stackId="1" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="predicted" stackId="2" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="lower" stackId="3" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  التدفق النقدي المتوقع
                </CardTitle>
                <CardDescription>
                  توقعات التدفق النقدي الشهري
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={prepareTrendData(state.predictions.cashflow)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [value.toLocaleString('ar-SA'), 'ر.س']} />
                    <Line type="monotone" dataKey="predicted" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="upper" stroke="#82ca9d" strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="lower" stroke="#82ca9d" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.risks.map(risk => (
              <RiskCard 
                key={risk.id} 
                risk={risk} 
                onMitigate={handleMitigateRisk}
              />
            ))}
          </div>
          {state.risks.length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2" />
                  <div>لا توجد مخاطر مكتشفة حالياً</div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">مقارنة السيناريوهات</h3>
            <Select value={state.selectedScenario} onValueChange={handleScenarioChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">الإيرادات</SelectItem>
                <SelectItem value="cashflow">التدفق النقدي</SelectItem>
                <SelectItem value="performance">الأداء</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ScenarioComparison scenarios={state.scenarios} selectedMetric={state.selectedScenario} />
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                نماذج التعلم الآلي
              </CardTitle>
              <CardDescription>
                حالة ودقة النماذج التنبؤية المستخدمة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <Settings className="h-8 w-8 mx-auto mb-2" />
                <div>إدارة النماذج قيد التطوير</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      {state.lastUpdated && (
        <div className="text-xs text-muted-foreground text-center">
          آخر تحديث: {new Date(state.lastUpdated).toLocaleString('ar-SA')}
        </div>
      )}
    </div>
  );
};
