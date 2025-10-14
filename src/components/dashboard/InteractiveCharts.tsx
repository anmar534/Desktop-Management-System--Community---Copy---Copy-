/**
 * مكون الرسوم البيانية التفاعلية المتقدمة
 * Interactive Charts Component
 * 
 * يوفر واجهة شاملة لعرض وإدارة الرسوم البيانية التفاعلية
 * مع دعم التحديث في الوقت الفعلي والتفاعل المتقدم
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Treemap, ComposedChart
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { 
  BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, 
  TrendingUp, Zap, Settings, Download, Maximize2, Minimize2,
  Play, Pause, RotateCcw, Filter, Eye, EyeOff
} from 'lucide-react';
import { 
  interactiveChartsService, 
  ChartConfiguration, 
  ChartDataPoint, 
  ChartFilter,
  ChartInteractionEvent 
} from '../../services/interactiveChartsService';

interface InteractiveChartsProps {
  className?: string;
  defaultChartType?: string;
  showControls?: boolean;
  enableRealTime?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

interface ChartState {
  data: ChartDataPoint[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const CHART_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
];

const CHART_TYPES = [
  { value: 'line', label: 'خط بياني', labelEn: 'Line Chart', icon: LineChartIcon },
  { value: 'bar', label: 'أعمدة بيانية', labelEn: 'Bar Chart', icon: BarChart3 },
  { value: 'pie', label: 'دائري', labelEn: 'Pie Chart', icon: PieChartIcon },
  { value: 'area', label: 'منطقة', labelEn: 'Area Chart', icon: TrendingUp },
  { value: 'scatter', label: 'نقاط متناثرة', labelEn: 'Scatter Plot', icon: BarChart3 },
  { value: 'radar', label: 'رادار', labelEn: 'Radar Chart', icon: BarChart3 }
];

const DATA_SOURCES = [
  { value: 'projects', label: 'المشاريع', labelEn: 'Projects' },
  { value: 'tenders', label: 'المنافسات', labelEn: 'Tenders' },
  { value: 'financial', label: 'البيانات المالية', labelEn: 'Financial Data' }
];

export const InteractiveCharts: React.FC<InteractiveChartsProps> = ({
  className = '',
  defaultChartType = 'line',
  showControls = true,
  enableRealTime = true,
  theme = 'auto'
}) => {
  // الحالة الأساسية
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedChartType, setSelectedChartType] = useState(defaultChartType);
  const [selectedDataSource, setSelectedDataSource] = useState('projects');
  const [chartConfigurations, setChartConfigurations] = useState<ChartConfiguration[]>([]);
  const [chartStates, setChartStates] = useState<Record<string, ChartState>>({});
  
  // إعدادات التحكم
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(enableRealTime);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ChartFilter[]>([]);
  
  // مراجع
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * تحميل تكوينات الرسوم البيانية
   */
  const loadChartConfigurations = useCallback(async () => {
    try {
      const configs = await interactiveChartsService.getChartConfigurations();
      setChartConfigurations(configs);
      
      // تحميل البيانات لكل رسم بياني
      for (const config of configs) {
        await loadChartData(config.id);
      }
    } catch (error) {
      console.error('Error loading chart configurations:', error);
    }
  }, []);

  /**
   * تحميل بيانات رسم بياني محدد
   */
  const loadChartData = useCallback(async (chartId: string) => {
    setChartStates(prev => ({
      ...prev,
      [chartId]: { ...prev[chartId], loading: true, error: null }
    }));

    try {
      const config = await interactiveChartsService.getChartConfiguration(chartId);
      if (!config) throw new Error('Chart configuration not found');

      let data: ChartDataPoint[] = [];
      
      switch (config.dataSource) {
        case 'projects':
          data = await interactiveChartsService.getProjectChartData(config.type, activeFilters);
          break;
        case 'tenders':
          data = await interactiveChartsService.getTenderChartData(config.type, activeFilters);
          break;
        case 'financial':
          data = await interactiveChartsService.getFinancialChartData(config.type, activeFilters);
          break;
      }

      setChartStates(prev => ({
        ...prev,
        [chartId]: {
          data,
          loading: false,
          error: null,
          lastUpdated: new Date().toISOString()
        }
      }));

      // بدء التحديثات في الوقت الفعلي إذا كانت مفعلة
      if (config.realTimeUpdates && isRealTimeEnabled) {
        interactiveChartsService.startRealTimeUpdates(chartId, config.refreshInterval || refreshInterval);
      }
    } catch (error) {
      setChartStates(prev => ({
        ...prev,
        [chartId]: {
          data: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          lastUpdated: null
        }
      }));
    }
  }, [activeFilters, isRealTimeEnabled, refreshInterval]);

  /**
   * إنشاء رسم بياني جديد
   */
  const createNewChart = useCallback(async () => {
    try {
      const newConfig = await interactiveChartsService.createChartConfiguration({
        type: selectedChartType as any,
        title: `رسم بياني جديد - ${CHART_TYPES.find(t => t.value === selectedChartType)?.label}`,
        titleEn: `New Chart - ${CHART_TYPES.find(t => t.value === selectedChartType)?.labelEn}`,
        dataSource: selectedDataSource,
        refreshInterval: refreshInterval,
        interactive: true,
        zoomable: true,
        exportable: true,
        realTimeUpdates: isRealTimeEnabled,
        theme: theme,
        colors: CHART_COLORS,
        dimensions: { width: 800, height: 400 },
        options: {}
      });

      setChartConfigurations(prev => [...prev, newConfig]);
      await loadChartData(newConfig.id);
    } catch (error) {
      console.error('Error creating new chart:', error);
    }
  }, [selectedChartType, selectedDataSource, refreshInterval, isRealTimeEnabled, theme]);

  /**
   * حذف رسم بياني
   */
  const deleteChart = useCallback(async (chartId: string) => {
    try {
      await interactiveChartsService.deleteChartConfiguration(chartId);
      setChartConfigurations(prev => prev.filter(config => config.id !== chartId));
      setChartStates(prev => {
        const newStates = { ...prev };
        delete newStates[chartId];
        return newStates;
      });
    } catch (error) {
      console.error('Error deleting chart:', error);
    }
  }, []);

  /**
   * تحديث رسم بياني
   */
  const refreshChart = useCallback(async (chartId: string) => {
    await interactiveChartsService.refreshChartData(chartId);
    await loadChartData(chartId);
  }, [loadChartData]);

  /**
   * تبديل وضع الشاشة الكاملة
   */
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen && chartContainerRef.current) {
      chartContainerRef.current.requestFullscreen?.();
    } else if (isFullscreen) {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  /**
   * تصدير الرسم البياني
   */
  const exportChart = useCallback(async (chartId: string, format: 'png' | 'pdf' | 'svg' = 'png') => {
    try {
      // تنفيذ تصدير الرسم البياني
      console.log(`Exporting chart ${chartId} as ${format}`);
    } catch (error) {
      console.error('Error exporting chart:', error);
    }
  }, []);

  /**
   * معالج أحداث التفاعل مع الرسم البياني
   */
  const handleChartInteraction = useCallback((chartId: string, event: ChartInteractionEvent) => {
    console.log('Chart interaction:', chartId, event);
    
    switch (event.type) {
      case 'click':
        // معالجة النقر
        break;
      case 'hover':
        // معالجة التمرير
        break;
      case 'zoom':
        // معالجة التكبير
        break;
      case 'filter':
        // معالجة التصفية
        break;
      case 'drilldown':
        // معالجة الحفر في البيانات
        break;
    }
  }, []);

  /**
   * رسم الرسم البياني حسب النوع
   */
  const renderChart = useCallback((config: ChartConfiguration, data: ChartDataPoint[]) => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (config.type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip 
              labelFormatter={(label) => label}
              formatter={(value: number) => [value.toLocaleString('ar-SA'), 'القيمة']}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={config.colors[0]} 
              strokeWidth={2}
              dot={{ fill: config.colors[0], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => [value.toLocaleString('ar-SA'), 'القيمة']}
            />
            <Legend />
            <Bar dataKey="value" fill={config.colors[0]} />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={config.colors[index % config.colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [value.toLocaleString('ar-SA'), 'القيمة']} />
            <Legend />
          </PieChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip formatter={(value: number) => [value.toLocaleString('ar-SA'), 'القيمة']} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={config.colors[0]} 
              fill={config.colors[0]}
              fillOpacity={0.6}
            />
          </AreaChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip formatter={(value: number) => [value.toLocaleString('ar-SA'), 'القيمة']} />
            <Legend />
            <Scatter dataKey="value" fill={config.colors[0]} />
          </ScatterChart>
        );

      case 'radar':
        return (
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="label" />
            <PolarRadiusAxis />
            <Radar 
              dataKey="value" 
              stroke={config.colors[0]} 
              fill={config.colors[0]} 
              fillOpacity={0.6} 
            />
            <Tooltip formatter={(value: number) => [value.toLocaleString('ar-SA'), 'القيمة']} />
            <Legend />
          </RadarChart>
        );

      default:
        return <div className="text-center text-gray-500">نوع رسم بياني غير مدعوم</div>;
    }
  }, []);

  // تأثيرات جانبية
  useEffect(() => {
    loadChartConfigurations();
  }, [loadChartConfigurations]);

  useEffect(() => {
    // إعداد مستمعي الأحداث للرسوم البيانية
    chartConfigurations.forEach(config => {
      interactiveChartsService.addEventListener(config.id, (event: ChartInteractionEvent) => {
        handleChartInteraction(config.id, event);
      });
    });

    return () => {
      // تنظيف المستمعين
      chartConfigurations.forEach(config => {
        interactiveChartsService.removeEventListener(config.id, handleChartInteraction);
      });
    };
  }, [chartConfigurations, handleChartInteraction]);

  useEffect(() => {
    // تحديث إعدادات التحديث في الوقت الفعلي
    chartConfigurations.forEach(config => {
      if (config.realTimeUpdates && isRealTimeEnabled) {
        interactiveChartsService.startRealTimeUpdates(config.id, refreshInterval);
      } else {
        interactiveChartsService.stopRealTimeUpdates(config.id);
      }
    });
  }, [chartConfigurations, isRealTimeEnabled, refreshInterval]);

  return (
    <div className={`interactive-charts ${className}`} dir="rtl">
      <div className="space-y-6">
        {/* رأس الصفحة */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              الرسوم البيانية التفاعلية
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              عرض وتحليل البيانات بطريقة تفاعلية ومرئية
            </p>
          </div>
          
          {showControls && (
            <div className="flex items-center gap-2">
              <Button
                onClick={createNewChart}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <BarChart3 className="w-4 h-4 ml-2" />
                رسم بياني جديد
              </Button>
              
              <Button
                variant="outline"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          )}
        </div>

        {/* أدوات التحكم */}
        {showControls && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                إعدادات الرسوم البيانية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* نوع الرسم البياني */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">نوع الرسم البياني</label>
                  <Select value={selectedChartType} onValueChange={setSelectedChartType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHART_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* مصدر البيانات */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">مصدر البيانات</label>
                  <Select value={selectedDataSource} onValueChange={setSelectedDataSource}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATA_SOURCES.map(source => (
                        <SelectItem key={source.value} value={source.value}>
                          {source.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* التحديث في الوقت الفعلي */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">التحديث التلقائي</label>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={isRealTimeEnabled}
                      onCheckedChange={setIsRealTimeEnabled}
                    />
                    <span className="text-sm text-gray-600">
                      {isRealTimeEnabled ? 'مفعل' : 'معطل'}
                    </span>
                  </div>
                </div>

                {/* فترة التحديث */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    فترة التحديث ({refreshInterval} ثانية)
                  </label>
                  <Slider
                    value={[refreshInterval]}
                    onValueChange={(value) => setRefreshInterval(value[0])}
                    min={5}
                    max={300}
                    step={5}
                    disabled={!isRealTimeEnabled}
                  />
                </div>
              </div>

              {/* أدوات إضافية */}
              <div className="flex items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4 ml-1" />
                  {showFilters ? 'إخفاء المرشحات' : 'إظهار المرشحات'}
                </Button>
                
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {chartConfigurations.length} رسم بياني
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* الرسوم البيانية */}
        <div ref={chartContainerRef} className="space-y-6">
          {chartConfigurations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  لا توجد رسوم بيانية
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  ابدأ بإنشاء رسم بياني جديد لعرض البيانات
                </p>
                <Button onClick={createNewChart}>
                  <BarChart3 className="w-4 h-4 ml-2" />
                  إنشاء رسم بياني
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {chartConfigurations.map(config => {
                const state = chartStates[config.id] || { data: [], loading: true, error: null, lastUpdated: null };
                
                return (
                  <Card key={config.id} className="relative">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {(() => {
                              const chartType = CHART_TYPES.find(t => t.value === config.type);
                              const IconComponent = chartType?.icon;
                              return IconComponent ? <IconComponent className="w-5 h-5" /> : null;
                            })()}
                            {config.title}
                          </CardTitle>
                          {config.description && (
                            <CardDescription>{config.description}</CardDescription>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {config.realTimeUpdates && (
                            <Badge variant="secondary" className="text-xs">
                              <Zap className="w-3 h-3 ml-1" />
                              مباشر
                            </Badge>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => refreshChart(config.id)}
                            disabled={state.loading}
                            aria-label="تحديث الرسم البياني"
                            title="تحديث الرسم البياني"
                          >
                            <RotateCcw className={`w-4 h-4 ${state.loading ? 'animate-spin' : ''}`} />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => exportChart(config.id)}
                            aria-label="تصدير الرسم البياني"
                            title="تصدير الرسم البياني"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteChart(config.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                      
                      {state.lastUpdated && (
                        <div className="text-xs text-gray-500">
                          آخر تحديث: {new Date(state.lastUpdated).toLocaleString('ar-SA')}
                        </div>
                      )}
                    </CardHeader>
                    
                    <CardContent>
                      {state.loading ? (
                        <div className="flex items-center justify-center h-64">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : state.error ? (
                        <div className="flex items-center justify-center h-64 text-red-600">
                          <div className="text-center">
                            <p className="font-medium">خطأ في تحميل البيانات</p>
                            <p className="text-sm mt-1">{state.error}</p>
                          </div>
                        </div>
                      ) : state.data.length === 0 ? (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                          <div className="text-center">
                            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>لا توجد بيانات للعرض</p>
                          </div>
                        </div>
                      ) : (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            {renderChart(config, state.data)}
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractiveCharts;
