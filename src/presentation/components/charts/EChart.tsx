/**
 * EChart Wrapper Component
 *
 * مكون غلاف لـ Apache ECharts مع دعم RTL والسمات
 *
 * @version 1.0.0
 * @date 2025-10-07
 */

import type React from 'react';
import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import type { EChartsOption } from 'echarts';
import type { EChartsType } from 'echarts/core';
import { useTheme } from '@/application/providers/ThemeProvider';
import { getDesignTokenColor } from '@/shared/utils/ui/designTokens';

// استيراد المكونات المطلوبة فقط (tree-shaking)
import {
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  RadarChart,
  GaugeChart,
} from 'echarts/charts';

import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent,
} from 'echarts/components';

import { CanvasRenderer } from 'echarts/renderers';

// تسجيل المكونات
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  RadarChart,
  GaugeChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent,
  CanvasRenderer,
]);

export interface EChartProps {
  /** خيارات الرسم البياني */
  option: EChartsOption;
  /** الارتفاع (افتراضي: 400px) */
  height?: string | number;
  /** العرض (افتراضي: 100%) */
  width?: string | number;
  /** تحميل */
  loading?: boolean;
  /** رسالة التحميل */
  loadingText?: string;
  /** فئة CSS إضافية */
  className?: string;
  /** حدث عند النقر */
  onChartClick?: (params: unknown) => void;
  /** تعطيل التفاعل */
  notMerge?: boolean;
}

export const EChart: React.FC<EChartProps> = ({
  option,
  height = 400,
  width = '100%',
  loading = false,
  loadingText = 'جاري التحميل...',
  className = '',
  onChartClick,
  notMerge = false,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<EChartsType | null>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    if (!chartRef.current) {
      return;
    }
    const widthValue = typeof width === 'number' ? `${width}px` : width;
    const heightValue = typeof height === 'number' ? `${height}px` : height;
    chartRef.current.style.width = widthValue;
    chartRef.current.style.height = heightValue;
  }, [height, width]);

  // إنشاء الرسم البياني
  useEffect(() => {
    if (!chartRef.current) return;

    // إنشاء instance
    chartInstance.current = echarts.init(chartRef.current, isDark ? 'dark' : undefined, {
      renderer: 'canvas',
      locale: 'AR', // دعم اللغة العربية
    });

    // تنظيف عند unmount
    return () => {
      chartInstance.current?.dispose();
    };
  }, [isDark]);

  // تحديث الخيارات
  useEffect(() => {
    if (!chartInstance.current) return;

    // تطبيق الخيارات
    chartInstance.current.setOption(option, notMerge);

    // إضافة حدث النقر
    if (onChartClick) {
      chartInstance.current.on('click', onChartClick);
    }

    return () => {
      if (onChartClick && chartInstance.current) {
        chartInstance.current.off('click', onChartClick);
      }
    };
  }, [option, onChartClick, notMerge]);

  // معالجة التحميل
  useEffect(() => {
    if (!chartInstance.current) return;

    if (loading) {
      const primaryColor = getDesignTokenColor('primary') ?? '#3b82f6';
      const foregroundColor = getDesignTokenColor('foreground') ?? '#000000';
      const maskColor = getDesignTokenColor('background', { alpha: 0.8 }) ?? 'rgba(255, 255, 255, 0.8)';

      chartInstance.current.showLoading('default', {
        text: loadingText,
        color: primaryColor,
        textColor: foregroundColor,
        maskColor,
      });
    } else {
      chartInstance.current.hideLoading();
    }
  }, [loading, loadingText]);

  // معالجة تغيير الحجم
  useEffect(() => {
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <div ref={chartRef} className={className} />;
};

export default EChart;



