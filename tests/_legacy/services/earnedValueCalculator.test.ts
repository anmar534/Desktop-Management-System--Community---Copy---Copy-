/**
 * Earned Value Calculator Tests
 * اختبارات حاسبة إدارة القيمة المكتسبة
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { earnedValueCalculator } from '../../src/services/earnedValueCalculator'
import type { EVMCalculationInput, EVMTaskData, EVMMetrics, EVMThresholds } from '../../src/types/evm'

describe('EarnedValueCalculator', () => {
  const mockTaskData: EVMTaskData[] = [
    {
      id: 'task-1',
      title: 'مهمة التصميم',
      plannedValue: 100000,
      earnedValue: 80000,
      actualCost: 85000,
      percentComplete: 80,
      plannedStartDate: '2024-01-01',
      plannedEndDate: '2024-01-31',
      actualStartDate: '2024-01-01',
      actualEndDate: undefined,
      weight: 0.4
    },
    {
      id: 'task-2',
      title: 'مهمة التنفيذ',
      plannedValue: 150000,
      earnedValue: 75000,
      actualCost: 90000,
      percentComplete: 50,
      plannedStartDate: '2024-02-01',
      plannedEndDate: '2024-03-31',
      actualStartDate: '2024-02-05',
      actualEndDate: undefined,
      weight: 0.6
    }
  ]

  const mockCalculationInput: EVMCalculationInput = {
    projectId: 'project-1',
    statusDate: '2024-02-15',
    tasks: mockTaskData,
    totalBudget: 250000,
    plannedStartDate: '2024-01-01',
    plannedEndDate: '2024-03-31'
  }

  describe('calculateEVMMetrics', () => {
    it('should calculate basic EVM metrics correctly', () => {
      const result = earnedValueCalculator.calculateEVMMetrics(mockCalculationInput)

      // التحقق من القيم الأساسية
      expect(result.budgetAtCompletion).toBe(250000)
      expect(result.earnedValue).toBe(155000) // 80000 + 75000
      expect(result.actualCost).toBe(175000) // 85000 + 90000

      // التحقق من الانحرافات
      expect(result.costVariance).toBe(-20000) // EV - AC = 155000 - 175000
      expect(result.scheduleVariance).toBeDefined() // SV = EV - PV

      // التحقق من مؤشرات الأداء
      expect(result.costPerformanceIndex).toBeCloseTo(0.886, 3) // EV / AC = 155000 / 175000
      expect(result.schedulePerformanceIndex).toBeCloseTo(0.886, 2) // EV / PV (تقريبي)

      // التحقق من النسب المئوية
      expect(result.percentComplete).toBe(62) // EV / BAC * 100 = 155000 / 250000 * 100
    })

    it('should calculate EAC using different methods', () => {
      const result = earnedValueCalculator.calculateEVMMetrics(mockCalculationInput)

      // EAC = AC + (BAC - EV) / CPI
      const expectedEAC = 175000 + (250000 - 155000) / result.costPerformanceIndex
      expect(result.estimateAtCompletion).toBeCloseTo(expectedEAC, 0)

      // ETC = EAC - AC
      expect(result.estimateToComplete).toBeCloseTo(expectedEAC - 175000, 0)

      // VAC = BAC - EAC
      expect(result.varianceAtCompletion).toBeCloseTo(250000 - expectedEAC, 0)
    })

    it('should calculate TCPI correctly', () => {
      const result = earnedValueCalculator.calculateEVMMetrics(mockCalculationInput)

      // TCPI = (BAC - EV) / (BAC - AC)
      const expectedTCPI = (250000 - 155000) / (250000 - 175000)
      expect(result.toCompletePerformanceIndex).toBeCloseTo(expectedTCPI, 3)
    })

    it('should handle edge cases', () => {
      // حالة عدم وجود تكلفة فعلية
      const inputWithZeroCost = {
        ...mockCalculationInput,
        tasks: mockTaskData.map(task => ({ ...task, actualCost: 0 }))
      }

      const result = earnedValueCalculator.calculateEVMMetrics(inputWithZeroCost)
      expect(result.costPerformanceIndex).toBe(0)

      // حالة عدم وجود قيمة مخططة
      const inputWithZeroPlanned = {
        ...mockCalculationInput,
        tasks: mockTaskData.map(task => ({ ...task, plannedValue: 0 }))
      }

      const result2 = earnedValueCalculator.calculateEVMMetrics(inputWithZeroPlanned)
      expect(result2.schedulePerformanceIndex).toBe(0)
    })
  })

  describe('analyzeTrends', () => {
    it('should analyze improving trends', () => {
      const historicalData = [
        { date: '2024-01-01', cpi: 0.8, spi: 0.9, cv: -20000, sv: -10000 },
        { date: '2024-01-15', cpi: 0.85, spi: 0.92, cv: -18000, sv: -8000 },
        { date: '2024-02-01', cpi: 0.9, spi: 0.95, cv: -15000, sv: -5000 }
      ]

      const result = earnedValueCalculator.analyzeTrends(historicalData)

      expect(result.costTrend).toBe('improving')
      expect(result.scheduleTrend).toBe('improving')
      expect(result.overallTrend).toBe('improving')
    })

    it('should analyze declining trends', () => {
      const historicalData = [
        { date: '2024-01-01', cpi: 1.0, spi: 1.0, cv: 0, sv: 0 },
        { date: '2024-01-15', cpi: 0.95, spi: 0.92, cv: -5000, sv: -8000 },
        { date: '2024-02-01', cpi: 0.85, spi: 0.88, cv: -15000, sv: -12000 }
      ]

      const result = earnedValueCalculator.analyzeTrends(historicalData)

      expect(result.costTrend).toBe('declining')
      expect(result.scheduleTrend).toBe('declining')
      expect(result.overallTrend).toBe('declining')
    })

    it('should analyze stable trends', () => {
      const historicalData = [
        { date: '2024-01-01', cpi: 0.95, spi: 0.95, cv: -5000, sv: -5000 },
        { date: '2024-01-15', cpi: 0.96, spi: 0.94, cv: -4000, sv: -6000 },
        { date: '2024-02-01', cpi: 0.95, spi: 0.95, cv: -5000, sv: -5000 }
      ]

      const result = earnedValueCalculator.analyzeTrends(historicalData)

      expect(result.costTrend).toBe('stable')
      expect(result.scheduleTrend).toBe('stable')
      expect(result.overallTrend).toBe('stable')
    })

    it('should handle insufficient data', () => {
      const historicalData = [
        { date: '2024-01-01', cpi: 0.95, spi: 0.95, cv: -5000, sv: -5000 }
      ]

      const result = earnedValueCalculator.analyzeTrends(historicalData)

      expect(result.costTrend).toBe('stable')
      expect(result.scheduleTrend).toBe('stable')
      expect(result.overallTrend).toBe('stable')
    })
  })

  describe('generateAlerts', () => {
    const customThresholds: EVMThresholds = {
      cpiWarning: 0.9,
      cpiCritical: 0.8,
      spiWarning: 0.9,
      spiCritical: 0.8,
      cvWarning: -10000,
      cvCritical: -50000,
      svWarning: -5000,
      svCritical: -15000
    }

    it('should generate critical CPI alert', () => {
      const metrics: EVMMetrics = {
        plannedValue: 100000,
        earnedValue: 75000,
        actualCost: 100000,
        budgetAtCompletion: 200000,
        costVariance: -25000,
        scheduleVariance: -25000,
        costPerformanceIndex: 0.75, // أقل من الحد الحرج
        schedulePerformanceIndex: 0.75,
        estimateAtCompletion: 266667,
        estimateToComplete: 166667,
        varianceAtCompletion: -66667,
        toCompletePerformanceIndex: 1.25,
        percentComplete: 37.5,
        percentPlanned: 50,
        statusDate: '2024-02-15',
        plannedCompletionDate: '2024-12-31',
        forecastCompletionDate: '2025-02-15'
      }

      const alerts = earnedValueCalculator.generateAlerts('project-1', metrics, customThresholds)

      const cpiAlert = alerts.find(alert => alert.type === 'cost_overrun' && alert.severity === 'critical')
      expect(cpiAlert).toBeDefined()
      expect(cpiAlert?.title).toContain('تجاوز حرج في التكلفة')
      expect(cpiAlert?.currentValue).toBe(0.75)
    })

    it('should generate warning SPI alert', () => {
      const metrics: EVMMetrics = {
        plannedValue: 100000,
        earnedValue: 85000,
        actualCost: 90000,
        budgetAtCompletion: 200000,
        costVariance: -5000,
        scheduleVariance: -15000,
        costPerformanceIndex: 0.94,
        schedulePerformanceIndex: 0.85, // أقل من حد التحذير
        estimateAtCompletion: 212766,
        estimateToComplete: 122766,
        varianceAtCompletion: -12766,
        toCompletePerformanceIndex: 1.11,
        percentComplete: 42.5,
        percentPlanned: 50,
        statusDate: '2024-02-15',
        plannedCompletionDate: '2024-12-31',
        forecastCompletionDate: '2025-01-15'
      }

      const alerts = earnedValueCalculator.generateAlerts('project-1', metrics, customThresholds)

      const spiAlert = alerts.find(alert => alert.type === 'schedule_delay' && alert.severity === 'high')
      expect(spiAlert).toBeDefined()
      expect(spiAlert?.title).toContain('تحذير تأخير الجدولة')
    })

    it('should generate cost variance alert', () => {
      const metrics: EVMMetrics = {
        plannedValue: 100000,
        earnedValue: 90000,
        actualCost: 150000,
        budgetAtCompletion: 200000,
        costVariance: -60000, // تجاوز الحد الحرج
        scheduleVariance: -10000,
        costPerformanceIndex: 0.6,
        schedulePerformanceIndex: 0.9,
        estimateAtCompletion: 333333,
        estimateToComplete: 183333,
        varianceAtCompletion: -133333,
        toCompletePerformanceIndex: 1.83,
        percentComplete: 45,
        percentPlanned: 50,
        statusDate: '2024-02-15',
        plannedCompletionDate: '2024-12-31',
        forecastCompletionDate: '2025-03-15'
      }

      const alerts = earnedValueCalculator.generateAlerts('project-1', metrics, customThresholds)

      const cvAlert = alerts.find(alert => 
        alert.type === 'cost_overrun' && 
        alert.severity === 'critical' &&
        alert.title.includes('انحراف حرج في التكلفة')
      )
      expect(cvAlert).toBeDefined()
    })

    it('should not generate alerts when metrics are good', () => {
      const goodMetrics: EVMMetrics = {
        plannedValue: 100000,
        earnedValue: 105000,
        actualCost: 100000,
        budgetAtCompletion: 200000,
        costVariance: 5000,
        scheduleVariance: 5000,
        costPerformanceIndex: 1.05,
        schedulePerformanceIndex: 1.05,
        estimateAtCompletion: 190476,
        estimateToComplete: 90476,
        varianceAtCompletion: 9524,
        toCompletePerformanceIndex: 0.95,
        percentComplete: 52.5,
        percentPlanned: 50,
        statusDate: '2024-02-15',
        plannedCompletionDate: '2024-12-31',
        forecastCompletionDate: '2024-11-15'
      }

      const alerts = earnedValueCalculator.generateAlerts('project-1', goodMetrics, customThresholds)

      expect(alerts).toHaveLength(0)
    })
  })

  describe('calculateForecasts', () => {
    it('should calculate multiple forecast scenarios', () => {
      const metrics: EVMMetrics = {
        plannedValue: 100000,
        earnedValue: 80000,
        actualCost: 90000,
        budgetAtCompletion: 200000,
        costVariance: -10000,
        scheduleVariance: -20000,
        costPerformanceIndex: 0.89,
        schedulePerformanceIndex: 0.8,
        estimateAtCompletion: 224719,
        estimateToComplete: 134719,
        varianceAtCompletion: -24719,
        toCompletePerformanceIndex: 1.21,
        percentComplete: 40,
        percentPlanned: 50,
        statusDate: '2024-02-15',
        plannedCompletionDate: '2024-12-31',
        forecastCompletionDate: '2025-01-31'
      }

      const forecasts = earnedValueCalculator.calculateForecasts(metrics, [])

      expect(forecasts).toHaveLength(2)

      // توقع بناءً على الأداء الحالي
      const currentPerformanceForecast = forecasts.find(f => f.method === 'current_performance')
      expect(currentPerformanceForecast).toBeDefined()
      expect(currentPerformanceForecast?.estimateAtCompletion).toBe(metrics.estimateAtCompletion)

      // توقع بناءً على الأداء المخطط
      const plannedPerformanceForecast = forecasts.find(f => f.method === 'planned_performance')
      expect(plannedPerformanceForecast).toBeDefined()
      expect(plannedPerformanceForecast?.estimateAtCompletion).toBe(metrics.budgetAtCompletion)
    })

    it('should calculate confidence levels', () => {
      const goodMetrics: EVMMetrics = {
        plannedValue: 100000,
        earnedValue: 105000,
        actualCost: 100000,
        budgetAtCompletion: 200000,
        costVariance: 5000,
        scheduleVariance: 5000,
        costPerformanceIndex: 1.05,
        schedulePerformanceIndex: 1.05,
        estimateAtCompletion: 190476,
        estimateToComplete: 90476,
        varianceAtCompletion: 9524,
        toCompletePerformanceIndex: 0.95,
        percentComplete: 52.5,
        percentPlanned: 50,
        statusDate: '2024-02-15',
        plannedCompletionDate: '2024-12-31',
        forecastCompletionDate: '2024-11-15'
      }

      const forecasts = earnedValueCalculator.calculateForecasts(goodMetrics, [])
      const currentForecast = forecasts.find(f => f.method === 'current_performance')

      expect(currentForecast?.confidence).toBeGreaterThan(50)
    })
  })

  describe('analyzeVariances', () => {
    it('should perform comprehensive variance analysis', () => {
      const metrics: EVMMetrics = {
        plannedValue: 100000,
        earnedValue: 80000,
        actualCost: 90000,
        budgetAtCompletion: 200000,
        costVariance: -10000,
        scheduleVariance: -20000,
        costPerformanceIndex: 0.89,
        schedulePerformanceIndex: 0.8,
        estimateAtCompletion: 224719,
        estimateToComplete: 134719,
        varianceAtCompletion: -24719,
        toCompletePerformanceIndex: 1.21,
        percentComplete: 40,
        percentPlanned: 50,
        statusDate: '2024-02-15',
        plannedCompletionDate: '2024-12-31',
        forecastCompletionDate: '2025-01-31'
      }

      const analysis = earnedValueCalculator.analyzeVariances(
        'project-1',
        metrics,
        mockTaskData,
        []
      )

      expect(analysis.projectId).toBe('project-1')
      expect(analysis.analysisDate).toBeDefined()
      expect(analysis.costVarianceAnalysis).toBeDefined()
      expect(analysis.scheduleVarianceAnalysis).toBeDefined()
      expect(analysis.performanceAnalysis).toBeDefined()
      expect(analysis.recommendations).toBeDefined()
      expect(analysis.actionPlan).toBeDefined()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty task list', () => {
      const emptyInput = {
        ...mockCalculationInput,
        tasks: []
      }

      const result = earnedValueCalculator.calculateEVMMetrics(emptyInput)

      expect(result.earnedValue).toBe(0)
      expect(result.actualCost).toBe(0)
      expect(result.costPerformanceIndex).toBe(0)
      expect(result.schedulePerformanceIndex).toBe(0)
    })

    it('should handle future project dates', () => {
      const futureInput = {
        ...mockCalculationInput,
        statusDate: '2023-12-01', // قبل بداية المشروع
        plannedStartDate: '2024-01-01',
        plannedEndDate: '2024-12-31'
      }

      const result = earnedValueCalculator.calculateEVMMetrics(futureInput)

      expect(result.percentPlanned).toBe(0)
    })

    it('should handle completed project', () => {
      const completedInput = {
        ...mockCalculationInput,
        statusDate: '2024-04-01', // بعد انتهاء المشروع
        tasks: mockTaskData.map(task => ({
          ...task,
          percentComplete: 100,
          earnedValue: task.plannedValue
        }))
      }

      const result = earnedValueCalculator.calculateEVMMetrics(completedInput)

      expect(result.percentComplete).toBe(100)
    })
  })

  describe('Performance Optimization', () => {
    it('should handle large datasets efficiently', () => {
      const largeTasks = Array.from({ length: 1000 }, (_, i) => ({
        ...mockTaskData[0],
        id: `task-${i}`,
        title: `مهمة ${i}`,
        plannedValue: 1000,
        earnedValue: 500,
        actualCost: 600
      }))

      const largeInput = {
        ...mockCalculationInput,
        tasks: largeTasks,
        totalBudget: 1000000
      }

      const startTime = performance.now()
      const result = earnedValueCalculator.calculateEVMMetrics(largeInput)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(100) // يجب أن يكتمل في أقل من 100ms
      expect(result.earnedValue).toBe(500000) // 1000 tasks * 500 EV each
      expect(result.actualCost).toBe(600000) // 1000 tasks * 600 AC each
    })

    it('should cache calculation results', () => {
      const calculateSpy = vi.spyOn(earnedValueCalculator, 'calculateEVMMetrics')

      // الحساب الأول
      earnedValueCalculator.calculateEVMMetrics(mockCalculationInput)

      // الحساب الثاني بنفس البيانات
      earnedValueCalculator.calculateEVMMetrics(mockCalculationInput)

      expect(calculateSpy).toHaveBeenCalledTimes(2)
    })
  })
})
