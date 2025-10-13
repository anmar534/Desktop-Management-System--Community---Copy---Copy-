/**
 * Mini Chart Widget
 *
 * رسم بياني صغير داخل Widget
 *
 * @version 1.0.0
 * @date 2025-10-07
 */

import type React from 'react';
import type { EChartsOption } from 'echarts';
import type { MiniChartData, BaseWidgetProps } from '../types';
import EChart from '../../../components/charts/EChart';
import { WidgetContainer, type WidgetStatusVariant } from './WidgetContainer';
import {
  getDesignTokenColor,
  getDesignTokenExpression,
  resolveTokenFromExpression,
} from '@/utils/designTokens';

export interface MiniChartProps extends Omit<BaseWidgetProps, 'data'> {
  data: MiniChartData;
}

export const MiniChart: React.FC<MiniChartProps> = ({ data, loading, error, onRefresh }) => {
  const { title, subtitle, chartType, data: chartData, color, showAxis = false, status = 'normal' } = data;
  const statusVariant: WidgetStatusVariant = status === 'normal' ? 'default' : status;

  const fallbackColor = getDesignTokenColor('chart1') ?? 'hsl(221, 83%, 53%)';

  const normalizeColor = (value?: string): string => {
    if (!value) {
      return fallbackColor;
    }

    const normalizedValue = value.trim();

    if (normalizedValue.startsWith('#') || normalizedValue.startsWith('rgb(') || (normalizedValue.startsWith('hsl(') && !normalizedValue.includes('var('))) {
      return normalizedValue;
    }

    const tokenKey = resolveTokenFromExpression(normalizedValue);
    if (tokenKey) {
      return getDesignTokenColor(tokenKey) ?? fallbackColor;
    }

    return fallbackColor;
  };

  const addOpacity = (value: string, opacity: number): string => {
    const normalized = normalizeColor(value);
    const clamped = Math.min(Math.max(opacity, 0), 1);

    if (normalized.startsWith('hsl(')) {
      return normalized.replace('hsl(', 'hsla(').replace(/\)$/, `, ${clamped})`);
    }

    const tokenKey = resolveTokenFromExpression(value);
    if (tokenKey) {
      return getDesignTokenColor(tokenKey, { alpha: clamped }) ?? fallbackColor;
    }

    return normalized;
  };

  // تكوين الرسم البياني حسب النوع
  const getChartOption = (): EChartsOption => {
    const resolvedColor = color ?? getDesignTokenExpression('chart1');
    const defaultColor = normalizeColor(resolvedColor);

    const baseOption: EChartsOption = {
      grid: {
        left: showAxis ? 40 : 5,
        right: 5,
        top: 10,
        bottom: showAxis ? 30 : 5,
        containLabel: false,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
        },
      },
    };

    switch (chartType) {
      case 'line':
        return {
          ...baseOption,
          xAxis: {
            type: 'category',
            data: chartData.map((item) => item.name),
            show: showAxis,
            axisLine: { show: showAxis },
            axisTick: { show: showAxis },
            axisLabel: { show: showAxis, fontSize: 10 },
          },
          yAxis: {
            type: 'value',
            show: showAxis,
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { show: showAxis, lineStyle: { opacity: 0.2 } },
            axisLabel: { show: showAxis, fontSize: 10 },
          },
          series: [
            {
              type: 'line',
              data: chartData.map((item) => item.value),
              smooth: true,
              symbol: 'circle',
              symbolSize: 6,
              lineStyle: {
                width: 2,
                color: defaultColor,
              },
              itemStyle: {
                color: defaultColor,
              },
              areaStyle: {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: addOpacity(resolvedColor, 0.25) },
                    { offset: 1, color: addOpacity(resolvedColor, 0) },
                  ],
                },
              },
            },
          ],
        };

      case 'bar':
        return {
          ...baseOption,
          xAxis: {
            type: 'category',
            data: chartData.map((item) => item.name),
            show: showAxis,
            axisLine: { show: showAxis },
            axisTick: { show: showAxis },
            axisLabel: { show: showAxis, fontSize: 10 },
          },
          yAxis: {
            type: 'value',
            show: showAxis,
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { show: showAxis, lineStyle: { opacity: 0.2 } },
            axisLabel: { show: showAxis, fontSize: 10 },
          },
          series: [
            {
              type: 'bar',
              data: chartData.map((item) => item.value),
              itemStyle: {
                color: defaultColor,
                borderRadius: [4, 4, 0, 0],
              },
              barMaxWidth: 30,
            },
          ],
        };

      case 'area':
        return {
          ...baseOption,
          xAxis: {
            type: 'category',
            data: chartData.map((item) => item.name),
            show: showAxis,
            boundaryGap: false,
          },
          yAxis: {
            type: 'value',
            show: showAxis,
          },
          series: [
            {
              type: 'line',
              data: chartData.map((item) => item.value),
              smooth: true,
              lineStyle: {
                width: 2,
                color: defaultColor,
              },
              areaStyle: {
                color: addOpacity(resolvedColor, 0.25),
              },
            },
          ],
        };

      case 'pie':
        return {
          tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} ({d}%)',
          },
          series: [
            {
              type: 'pie',
              radius: ['40%', '70%'],
              center: ['50%', '50%'],
              data: chartData.map((item) => ({
                name: item.name,
                value: item.value,
              })),
              label: {
                show: showAxis,
                fontSize: 10,
              },
              labelLine: {
                show: showAxis,
              },
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: addOpacity('hsl(var(--foreground))', 0.24),
                },
              },
            },
          ],
        };

      default:
        return baseOption;
    }
  };

  return (
    <WidgetContainer
      title={title}
      description={subtitle}
      status={statusVariant}
      isLoading={loading}
      error={error}
      onRefresh={onRefresh}
      contentClassName="flex"
    >
      {!loading && (
        <div className="h-full w-full p-2">
          <EChart option={getChartOption()} height="100%" width="100%" />
        </div>
      )}
    </WidgetContainer>
  );
};

export default MiniChart;
