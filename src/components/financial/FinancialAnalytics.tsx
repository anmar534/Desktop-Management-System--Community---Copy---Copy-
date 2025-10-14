import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { 
  FinancialAnalyticsService, 
  LiquidityRatios, 
  ProfitabilityRatios, 
  ActivityRatios, 
  LeverageRatios,
  TrendAnalysis,
  CashFlowForecast,
  SeasonalityAnalysis,
  EarlyWarningIndicator,
  FinancialKPI
} from '../../services/financialAnalyticsService';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign, 
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Calculator,
  Download,
  RefreshCw
} from 'lucide-react';

export const FinancialAnalytics: React.FC = () => {
  const [service] = useState(() => new FinancialAnalyticsService());
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  
  // State for different analytics data
  const [liquidityRatios, setLiquidityRatios] = useState<LiquidityRatios | null>(null);
  const [profitabilityRatios, setProfitabilityRatios] = useState<ProfitabilityRatios | null>(null);
  const [activityRatios, setActivityRatios] = useState<ActivityRatios | null>(null);
  const [leverageRatios, setLeverageRatios] = useState<LeverageRatios | null>(null);
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis[]>([]);
  const [cashFlowForecast, setCashFlowForecast] = useState<CashFlowForecast[]>([]);
  const [seasonalityAnalysis, setSeasonalityAnalysis] = useState<SeasonalityAnalysis[]>([]);
  const [earlyWarningIndicators, setEarlyWarningIndicators] = useState<EarlyWarningIndicator[]>([]);
  const [kpis, setKpis] = useState<FinancialKPI[]>([]);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Sample data for demonstration - في التطبيق الحقيقي، ستأتي من قاعدة البيانات
      const sampleLiquidityData = await service.calculateLiquidityRatios(
        1000000, // Current Assets
        600000,  // Current Liabilities
        200000,  // Cash
        100000,  // Marketable Securities
        300000   // Inventory
      );
      setLiquidityRatios(sampleLiquidityData);

      const sampleProfitabilityData = await service.calculateProfitabilityRatios(
        2000000, // Revenue
        1200000, // Cost of Goods Sold
        500000,  // Operating Expenses
        300000,  // Net Income
        1500000, // Total Assets
        800000,  // Shareholders Equity
        1000000  // Total Investment
      );
      setProfitabilityRatios(sampleProfitabilityData);

      const sampleActivityData = await service.calculateActivityRatios(
        2000000, // Revenue
        1500000, // Total Assets
        300000,  // Inventory
        250000,  // Accounts Receivable
        200000,  // Accounts Payable
        1200000  // Cost of Goods Sold
      );
      setActivityRatios(sampleActivityData);

      const sampleLeverageData = await service.calculateLeverageRatios(
        700000,  // Total Debt
        1500000, // Total Assets
        800000,  // Shareholders Equity
        50000,   // Interest Expense
        350000,  // EBIT
        100000   // Principal Payments
      );
      setLeverageRatios(sampleLeverageData);

      // Sample historical data for trends
      const historicalData = [
        { period: '2024-01', revenue: 1800000, expenses: 1500000, profit: 300000 },
        { period: '2024-02', revenue: 1900000, expenses: 1550000, profit: 350000 },
        { period: '2024-03', revenue: 2000000, expenses: 1600000, profit: 400000 },
        { period: '2024-04', revenue: 2100000, expenses: 1650000, profit: 450000 },
        { period: '2024-05', revenue: 2000000, expenses: 1700000, profit: 300000 },
        { period: '2024-06', revenue: 2200000, expenses: 1750000, profit: 450000 }
      ];
      const trends = await service.analyzeTrends(historicalData);
      setTrendAnalysis(trends);

      // Sample cash flow data
      const historicalCashFlows = [
        { period: '2024-01', inflow: 1800000, outflow: 1500000 },
        { period: '2024-02', inflow: 1900000, outflow: 1550000 },
        { period: '2024-03', inflow: 2000000, outflow: 1600000 },
        { period: '2024-04', inflow: 2100000, outflow: 1650000 },
        { period: '2024-05', inflow: 2000000, outflow: 1700000 },
        { period: '2024-06', inflow: 2200000, outflow: 1750000 }
      ];
      const forecast = await service.forecastCashFlow(historicalCashFlows, 6);
      setCashFlowForecast(forecast);

      // Sample monthly data for seasonality
      const monthlyData = [
        { month: 1, revenue: 1800000 }, { month: 2, revenue: 1900000 },
        { month: 3, revenue: 2000000 }, { month: 4, revenue: 2100000 },
        { month: 5, revenue: 2000000 }, { month: 6, revenue: 2200000 },
        { month: 7, revenue: 2300000 }, { month: 8, revenue: 2100000 },
        { month: 9, revenue: 2000000 }, { month: 10, revenue: 2200000 },
        { month: 11, revenue: 2400000 }, { month: 12, revenue: 2500000 }
      ];
      const seasonality = await service.analyzeSeasonality(monthlyData);
      setSeasonalityAnalysis(seasonality);

      // Generate early warning indicators
      const allRatios = { ...sampleLiquidityData, ...sampleProfitabilityData, ...sampleActivityData, ...sampleLeverageData };
      const warnings = await service.generateEarlyWarningIndicators(allRatios);
      setEarlyWarningIndicators(warnings);

      // Generate KPIs
      const sampleKPIs: FinancialKPI[] = [
        {
          id: 'current_ratio',
          name: 'النسبة الجارية',
          nameEn: 'Current Ratio',
          value: sampleLiquidityData.currentRatio,
          target: 2.0,
          unit: 'نسبة',
          category: 'liquidity',
          trend: 'up',
          performance: sampleLiquidityData.currentRatio >= 2 ? 'excellent' : 
                      sampleLiquidityData.currentRatio >= 1.5 ? 'good' : 
                      sampleLiquidityData.currentRatio >= 1 ? 'average' : 'poor',
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'net_profit_margin',
          name: 'هامش الربح الصافي',
          nameEn: 'Net Profit Margin',
          value: sampleProfitabilityData.netProfitMargin,
          target: 15.0,
          unit: '%',
          category: 'profitability',
          trend: 'up',
          performance: sampleProfitabilityData.netProfitMargin >= 15 ? 'excellent' : 
                      sampleProfitabilityData.netProfitMargin >= 10 ? 'good' : 
                      sampleProfitabilityData.netProfitMargin >= 5 ? 'average' : 'poor',
          lastUpdated: new Date().toISOString()
        }
      ];
      setKpis(sampleKPIs);

    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'average': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatRatio = (value: number) => {
    return value.toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="mr-2">جاري تحميل التحليلات المالية...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">التحليلات المالية المتقدمة</h1>
          <p className="text-gray-600">تحليل شامل للأداء المالي والمؤشرات الرئيسية</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadAnalyticsData} variant="outline">
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث البيانات
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 ml-2" />
            تصدير التقرير
          </Button>
        </div>
      </div>

      {/* Early Warning Indicators */}
      {earlyWarningIndicators.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {earlyWarningIndicators.map((indicator) => (
            <Alert key={indicator.id} className={`border-r-4 ${
              indicator.status === 'critical' ? 'border-r-red-500' :
              indicator.status === 'warning' ? 'border-r-yellow-500' : 'border-r-green-500'
            }`}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex justify-between items-center">
                  <span className="font-medium">{indicator.name}</span>
                  <Badge variant={indicator.status === 'critical' ? 'destructive' : 
                                indicator.status === 'warning' ? 'secondary' : 'default'}>
                    {indicator.status === 'critical' ? 'حرج' :
                     indicator.status === 'warning' ? 'تحذير' : 'طبيعي'}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  القيمة الحالية: {formatRatio(indicator.currentValue)} | 
                  الحد المطلوب: {formatRatio(indicator.threshold)}
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="ratios">النسب المالية</TabsTrigger>
          <TabsTrigger value="trends">تحليل الاتجاهات</TabsTrigger>
          <TabsTrigger value="forecast">التنبؤات</TabsTrigger>
          <TabsTrigger value="seasonality">الموسمية</TabsTrigger>
          <TabsTrigger value="kpis">المؤشرات الرئيسية</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Quick KPI Cards */}
            {kpis.slice(0, 4).map((kpi) => (
              <Card key={kpi.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{kpi.name}</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {kpi.unit === '%' ? formatPercentage(kpi.value) : formatRatio(kpi.value)}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-sm ${getPerformanceColor(kpi.performance)}`}>
                      {kpi.performance === 'excellent' ? 'ممتاز' :
                       kpi.performance === 'good' ? 'جيد' :
                       kpi.performance === 'average' ? 'متوسط' : 'ضعيف'}
                    </span>
                    <div className="flex items-center">
                      {kpi.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : kpi.trend === 'down' ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : (
                        <Activity className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                  </div>
                  <Progress 
                    value={(kpi.value / kpi.target) * 100} 
                    className="mt-2" 
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    الهدف: {kpi.unit === '%' ? formatPercentage(kpi.target) : formatRatio(kpi.target)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Overview Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>اتجاه الإيرادات</CardTitle>
                <CardDescription>تطور الإيرادات خلال الأشهر الماضية</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="الإيرادات" />
                    <Line type="monotone" dataKey="profit" stroke="#82ca9d" name="الأرباح" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Financial Ratios Radar */}
            <Card>
              <CardHeader>
                <CardTitle>النسب المالية الرئيسية</CardTitle>
                <CardDescription>مقارنة النسب المالية المختلفة</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={[
                    {
                      subject: 'السيولة',
                      value: liquidityRatios?.currentRatio || 0,
                      fullMark: 3
                    },
                    {
                      subject: 'الربحية',
                      value: (profitabilityRatios?.netProfitMargin || 0) / 10,
                      fullMark: 3
                    },
                    {
                      subject: 'النشاط',
                      value: activityRatios?.assetTurnover || 0,
                      fullMark: 3
                    },
                    {
                      subject: 'المديونية',
                      value: 3 - ((leverageRatios?.debtToEquity || 0) / 50),
                      fullMark: 3
                    }
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={90} domain={[0, 3]} />
                    <Radar name="النسب المالية" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Financial Ratios Tab */}
        <TabsContent value="ratios" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Liquidity Ratios */}
            <Card>
              <CardHeader>
                <CardTitle>نسب السيولة</CardTitle>
                <CardDescription>مؤشرات قدرة الشركة على الوفاء بالتزاماتها قصيرة المدى</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {liquidityRatios && (
                  <>
                    <div className="flex justify-between items-center">
                      <span>النسبة الجارية</span>
                      <span className="font-bold">{formatRatio(liquidityRatios.currentRatio)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>نسبة السيولة السريعة</span>
                      <span className="font-bold">{formatRatio(liquidityRatios.quickRatio)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>نسبة النقدية</span>
                      <span className="font-bold">{formatRatio(liquidityRatios.cashRatio)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>رأس المال العامل</span>
                      <span className="font-bold">{formatCurrency(liquidityRatios.workingCapital)}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Profitability Ratios */}
            <Card>
              <CardHeader>
                <CardTitle>نسب الربحية</CardTitle>
                <CardDescription>مؤشرات قدرة الشركة على تحقيق الأرباح</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profitabilityRatios && (
                  <>
                    <div className="flex justify-between items-center">
                      <span>هامش الربح الإجمالي</span>
                      <span className="font-bold">{formatPercentage(profitabilityRatios.grossProfitMargin)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>هامش الربح الصافي</span>
                      <span className="font-bold">{formatPercentage(profitabilityRatios.netProfitMargin)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>هامش التشغيل</span>
                      <span className="font-bold">{formatPercentage(profitabilityRatios.operatingMargin)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>العائد على الأصول</span>
                      <span className="font-bold">{formatPercentage(profitabilityRatios.returnOnAssets)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>العائد على حقوق الملكية</span>
                      <span className="font-bold">{formatPercentage(profitabilityRatios.returnOnEquity)}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Activity Ratios */}
            <Card>
              <CardHeader>
                <CardTitle>نسب النشاط</CardTitle>
                <CardDescription>مؤشرات كفاءة استخدام الأصول</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activityRatios && (
                  <>
                    <div className="flex justify-between items-center">
                      <span>معدل دوران الأصول</span>
                      <span className="font-bold">{formatRatio(activityRatios.assetTurnover)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>معدل دوران المخزون</span>
                      <span className="font-bold">{formatRatio(activityRatios.inventoryTurnover)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>معدل دوران المدينين</span>
                      <span className="font-bold">{formatRatio(activityRatios.receivablesTurnover)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>متوسط فترة التحصيل</span>
                      <span className="font-bold">{formatRatio(activityRatios.daysSalesOutstanding)} يوم</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Leverage Ratios */}
            <Card>
              <CardHeader>
                <CardTitle>نسب المديونية</CardTitle>
                <CardDescription>مؤشرات الهيكل المالي ومستوى المديونية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {leverageRatios && (
                  <>
                    <div className="flex justify-between items-center">
                      <span>نسبة الدين إلى الأصول</span>
                      <span className="font-bold">{formatPercentage(leverageRatios.debtToAssets)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>نسبة الدين إلى حقوق الملكية</span>
                      <span className="font-bold">{formatPercentage(leverageRatios.debtToEquity)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>نسبة حقوق الملكية</span>
                      <span className="font-bold">{formatPercentage(leverageRatios.equityRatio)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>تغطية الفوائد</span>
                      <span className="font-bold">{formatRatio(leverageRatios.interestCoverage)}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 gap-6">
            {/* Revenue and Profit Trends */}
            <Card>
              <CardHeader>
                <CardTitle>تحليل اتجاهات الإيرادات والأرباح</CardTitle>
                <CardDescription>تطور الأداء المالي عبر الزمن</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={trendAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} name="الإيرادات" />
                    <Line type="monotone" dataKey="expenses" stroke="#ff7300" strokeWidth={2} name="المصروفات" />
                    <Line type="monotone" dataKey="profit" stroke="#82ca9d" strokeWidth={2} name="الأرباح" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Growth Rate Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>تحليل معدلات النمو</CardTitle>
                <CardDescription>معدلات النمو الشهرية للإيرادات</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
                    <Legend />
                    <Bar dataKey="growthRate" fill="#8884d8" name="معدل النمو %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Forecast Tab */}
        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>توقعات التدفق النقدي</CardTitle>
              <CardDescription>التنبؤ بالتدفقات النقدية للأشهر القادمة</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={cashFlowForecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line type="monotone" dataKey="projectedInflow" stroke="#82ca9d" name="التدفق الداخل المتوقع" />
                  <Line type="monotone" dataKey="projectedOutflow" stroke="#ff7300" name="التدفق الخارج المتوقع" />
                  <Line type="monotone" dataKey="netCashFlow" stroke="#8884d8" name="صافي التدفق النقدي" />
                </LineChart>
              </ResponsiveContainer>

              {/* Confidence Levels */}
              <div className="mt-4">
                <h4 className="font-medium mb-2">مستويات الثقة في التوقعات</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {cashFlowForecast.slice(0, 3).map((forecast, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="text-sm font-medium">{forecast.period}</div>
                      <div className="text-lg font-bold">{formatCurrency(forecast.netCashFlow)}</div>
                      <div className="flex items-center mt-1">
                        <span className="text-sm text-gray-600 ml-2">مستوى الثقة:</span>
                        <Progress value={forecast.confidence} className="flex-1" />
                        <span className="text-sm font-medium mr-2">{forecast.confidence.toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seasonality Tab */}
        <TabsContent value="seasonality" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Seasonal Index Chart */}
            <Card>
              <CardHeader>
                <CardTitle>المؤشر الموسمي</CardTitle>
                <CardDescription>تحليل الأنماط الموسمية للإيرادات</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={seasonalityAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthName" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${Number(value).toFixed(1)}`} />
                    <Bar dataKey="seasonalIndex" fill="#8884d8" name="المؤشر الموسمي" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly Revenue Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>توزيع الإيرادات الشهرية</CardTitle>
                <CardDescription>متوسط الإيرادات لكل شهر</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={seasonalityAnalysis}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ monthName, percent }) => `${monthName} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="averageRevenue"
                    >
                      {seasonalityAnalysis.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 30}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Seasonality Table */}
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل التحليل الموسمي</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-2">الشهر</th>
                      <th className="text-right p-2">متوسط الإيرادات</th>
                      <th className="text-right p-2">المؤشر الموسمي</th>
                      <th className="text-right p-2">التباين</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seasonalityAnalysis.map((month) => (
                      <tr key={month.month} className="border-b">
                        <td className="p-2 font-medium">{month.monthName}</td>
                        <td className="p-2">{formatCurrency(month.averageRevenue)}</td>
                        <td className="p-2">{month.seasonalIndex.toFixed(1)}</td>
                        <td className="p-2">{month.variance.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* KPIs Tab */}
        <TabsContent value="kpis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.map((kpi) => (
              <Card key={kpi.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{kpi.name}</CardTitle>
                  <CardDescription>{kpi.nameEn}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-3xl font-bold">
                      {kpi.unit === '%' ? formatPercentage(kpi.value) : formatRatio(kpi.value)}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${getPerformanceColor(kpi.performance)}`}>
                        {kpi.performance === 'excellent' ? 'ممتاز' :
                         kpi.performance === 'good' ? 'جيد' :
                         kpi.performance === 'average' ? 'متوسط' : 'ضعيف'}
                      </span>
                      <div className="flex items-center">
                        {kpi.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : kpi.trend === 'down' ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : (
                          <Activity className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-sm text-gray-600 mr-1">
                          {kpi.trend === 'up' ? 'صاعد' : kpi.trend === 'down' ? 'هابط' : 'مستقر'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>التقدم نحو الهدف</span>
                        <span>{((kpi.value / kpi.target) * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={(kpi.value / kpi.target) * 100} />
                    </div>

                    <div className="text-xs text-gray-500">
                      الهدف: {kpi.unit === '%' ? formatPercentage(kpi.target) : formatRatio(kpi.target)}
                    </div>

                    <Badge variant="outline" className="text-xs">
                      {kpi.category === 'liquidity' ? 'السيولة' :
                       kpi.category === 'profitability' ? 'الربحية' :
                       kpi.category === 'activity' ? 'النشاط' : 'المديونية'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
