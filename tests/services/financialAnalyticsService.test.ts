import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FinancialAnalyticsService } from '../../src/services/financialAnalyticsService';

// Mock the storage utility
vi.mock('../../src/utils/storage', () => ({
  asyncStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
}));

describe('FinancialAnalyticsService', () => {
  let service: FinancialAnalyticsService;

  beforeEach(() => {
    service = new FinancialAnalyticsService();
    vi.clearAllMocks();
  });

  describe('Liquidity Ratios Calculations', () => {
    it('should calculate liquidity ratios correctly', async () => {
      const result = await service.calculateLiquidityRatios(
        1000000, // Current Assets
        600000,  // Current Liabilities
        200000,  // Cash
        100000,  // Marketable Securities
        300000   // Inventory
      );

      expect(result.currentRatio).toBeCloseTo(1.67, 2);
      expect(result.quickRatio).toBeCloseTo(1.17, 2);
      expect(result.cashRatio).toBeCloseTo(0.5, 2);
      expect(result.workingCapital).toBe(400000);
    });

    it('should handle zero current liabilities', async () => {
      const result = await service.calculateLiquidityRatios(
        1000000, // Current Assets
        0,       // Current Liabilities
        200000,  // Cash
        100000,  // Marketable Securities
        300000   // Inventory
      );

      expect(result.currentRatio).toBe(0);
      expect(result.quickRatio).toBe(0);
      expect(result.cashRatio).toBe(0);
      expect(result.workingCapital).toBe(1000000);
    });
  });

  describe('Profitability Ratios Calculations', () => {
    it('should calculate profitability ratios correctly', async () => {
      const result = await service.calculateProfitabilityRatios(
        2000000, // Revenue
        1200000, // Cost of Goods Sold
        500000,  // Operating Expenses
        300000,  // Net Income
        1500000, // Total Assets
        800000,  // Shareholders Equity
        1000000  // Total Investment
      );

      expect(result.grossProfitMargin).toBeCloseTo(40, 1);
      expect(result.netProfitMargin).toBeCloseTo(15, 1);
      expect(result.operatingMargin).toBeCloseTo(15, 1);
      expect(result.returnOnAssets).toBeCloseTo(20, 1);
      expect(result.returnOnEquity).toBeCloseTo(37.5, 1);
      expect(result.returnOnInvestment).toBeCloseTo(30, 1);
    });

    it('should handle zero revenue', async () => {
      const result = await service.calculateProfitabilityRatios(
        0,       // Revenue
        1200000, // Cost of Goods Sold
        500000,  // Operating Expenses
        300000,  // Net Income
        1500000, // Total Assets
        800000,  // Shareholders Equity
        1000000  // Total Investment
      );

      expect(result.grossProfitMargin).toBe(0);
      expect(result.netProfitMargin).toBe(0);
      expect(result.operatingMargin).toBe(0);
      expect(result.returnOnAssets).toBeCloseTo(20, 1);
      expect(result.returnOnEquity).toBeCloseTo(37.5, 1);
    });
  });

  describe('Activity Ratios Calculations', () => {
    it('should calculate activity ratios correctly', async () => {
      const result = await service.calculateActivityRatios(
        2000000, // Revenue
        1500000, // Total Assets
        300000,  // Inventory
        250000,  // Accounts Receivable
        200000,  // Accounts Payable
        1200000  // Cost of Goods Sold
      );

      expect(result.assetTurnover).toBeCloseTo(1.33, 2);
      expect(result.inventoryTurnover).toBeCloseTo(4, 1);
      expect(result.receivablesTurnover).toBeCloseTo(8, 1);
      expect(result.payablesTurnover).toBeCloseTo(6, 1);
      expect(result.daysSalesOutstanding).toBeCloseTo(45.6, 1);
      expect(result.daysInventoryOutstanding).toBeCloseTo(91.3, 1);
    });

    it('should handle zero values', async () => {
      const result = await service.calculateActivityRatios(
        2000000, // Revenue
        0,       // Total Assets
        0,       // Inventory
        0,       // Accounts Receivable
        0,       // Accounts Payable
        1200000  // Cost of Goods Sold
      );

      expect(result.assetTurnover).toBe(0);
      expect(result.inventoryTurnover).toBe(0);
      expect(result.receivablesTurnover).toBe(0);
      expect(result.payablesTurnover).toBe(0);
      expect(result.daysSalesOutstanding).toBe(0);
      expect(result.daysInventoryOutstanding).toBe(0);
    });
  });

  describe('Leverage Ratios Calculations', () => {
    it('should calculate leverage ratios correctly', async () => {
      const result = await service.calculateLeverageRatios(
        700000,  // Total Debt
        1500000, // Total Assets
        800000,  // Shareholders Equity
        50000,   // Interest Expense
        350000,  // EBIT
        100000   // Principal Payments
      );

      expect(result.debtToAssets).toBeCloseTo(46.67, 2);
      expect(result.debtToEquity).toBeCloseTo(87.5, 1);
      expect(result.equityRatio).toBeCloseTo(53.33, 2);
      expect(result.interestCoverage).toBeCloseTo(7, 1);
      expect(result.debtServiceCoverage).toBeCloseTo(2.33, 2);
    });

    it('should handle zero values', async () => {
      const result = await service.calculateLeverageRatios(
        700000,  // Total Debt
        0,       // Total Assets
        0,       // Shareholders Equity
        0,       // Interest Expense
        350000,  // EBIT
        0        // Principal Payments
      );

      expect(result.debtToAssets).toBe(0);
      expect(result.debtToEquity).toBe(0);
      expect(result.equityRatio).toBe(0);
      expect(result.interestCoverage).toBe(0);
      expect(result.debtServiceCoverage).toBe(0);
    });
  });

  describe('Trend Analysis', () => {
    it('should analyze trends correctly', async () => {
      const historicalData = [
        { period: '2024-01', revenue: 1000000, expenses: 800000, profit: 200000 },
        { period: '2024-02', revenue: 1100000, expenses: 850000, profit: 250000 },
        { period: '2024-03', revenue: 1200000, expenses: 900000, profit: 300000 },
        { period: '2024-04', revenue: 1050000, expenses: 870000, profit: 180000 }
      ];

      const result = await service.analyzeTrends(historicalData);

      expect(result).toHaveLength(4);
      expect(result[0].growthRate).toBe(0); // First period has no growth rate
      expect(result[1].growthRate).toBeCloseTo(10, 1); // 10% growth
      expect(result[1].trend).toBe('increasing');
      expect(result[2].growthRate).toBeCloseTo(9.09, 2); // ~9.09% growth
      expect(result[2].trend).toBe('increasing');
      expect(result[3].growthRate).toBeCloseTo(-12.5, 1); // -12.5% decline
      expect(result[3].trend).toBe('decreasing');
    });

    it('should handle empty historical data', async () => {
      const result = await service.analyzeTrends([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('Cash Flow Forecast', () => {
    it('should forecast cash flow correctly', async () => {
      const historicalCashFlows = [
        { period: '2024-01', inflow: 1000000, outflow: 800000 },
        { period: '2024-02', inflow: 1100000, outflow: 850000 },
        { period: '2024-03', inflow: 1200000, outflow: 900000 }
      ];

      const result = await service.forecastCashFlow(historicalCashFlows, 3);

      expect(result).toHaveLength(3);
      expect(result[0].projectedInflow).toBeGreaterThan(1100000); // Should be higher due to growth
      expect(result[0].projectedOutflow).toBeGreaterThan(850000);
      expect(result[0].netCashFlow).toBeGreaterThan(0);
      expect(result[0].confidence).toBeGreaterThan(0);
      expect(result[0].confidence).toBeLessThanOrEqual(100);
    });

    it('should handle empty historical data', async () => {
      const result = await service.forecastCashFlow([], 3);
      expect(result).toHaveLength(3);
      // Should still generate forecasts with zero values
      expect(result[0].projectedInflow).toBe(0);
      expect(result[0].projectedOutflow).toBe(0);
    });
  });

  describe('Seasonality Analysis', () => {
    it('should analyze seasonality correctly', async () => {
      const monthlyData = [
        { month: 1, revenue: 1000000 },
        { month: 2, revenue: 1100000 },
        { month: 3, revenue: 1200000 },
        { month: 1, revenue: 1050000 }, // Second year January
        { month: 2, revenue: 1150000 }, // Second year February
        { month: 3, revenue: 1250000 }  // Second year March
      ];

      const result = await service.analyzeSeasonality(monthlyData);

      expect(result).toHaveLength(12);
      expect(result[0].month).toBe(1);
      expect(result[0].monthName).toBe('يناير');
      expect(result[0].averageRevenue).toBeCloseTo(1025000, 0); // Average of 1000000 and 1050000
      expect(result[0].seasonalIndex).toBeGreaterThan(0);
    });

    it('should handle empty monthly data', async () => {
      const result = await service.analyzeSeasonality([]);
      expect(result).toHaveLength(12);
      expect(result[0].averageRevenue).toBe(0);
      expect(result[0].seasonalIndex).toBe(100); // Default when no data
    });
  });

  describe('Early Warning Indicators', () => {
    it('should generate early warning indicators correctly', async () => {
      const currentRatios = {
        currentRatio: 0.8, // Below threshold
        quickRatio: 0.6,
        cashRatio: 0.3,
        workingCapital: -100000,
        grossProfitMargin: 25,
        netProfitMargin: 3, // Below threshold
        operatingMargin: 8,
        returnOnAssets: 15,
        returnOnEquity: 20,
        returnOnInvestment: 18,
        assetTurnover: 1.2,
        inventoryTurnover: 4,
        receivablesTurnover: 8,
        payablesTurnover: 6,
        daysSalesOutstanding: 45,
        daysInventoryOutstanding: 90,
        debtToAssets: 40,
        debtToEquity: 60, // Above threshold
        equityRatio: 60,
        interestCoverage: 5,
        debtServiceCoverage: 2
      };

      const result = await service.generateEarlyWarningIndicators(currentRatios);

      expect(result).toHaveLength(3);
      
      const liquidityWarning = result.find(indicator => indicator.id === 'liquidity_warning');
      expect(liquidityWarning?.status).toBe('critical'); // Current ratio < 1.0
      
      const profitabilityWarning = result.find(indicator => indicator.id === 'profitability_warning');
      expect(profitabilityWarning?.status).toBe('warning'); // Net profit margin < 5%
      
      const debtWarning = result.find(indicator => indicator.id === 'debt_warning');
      expect(debtWarning?.status).toBe('warning'); // Debt to equity > 50%
    });

    it('should generate normal status for good ratios', async () => {
      const currentRatios = {
        currentRatio: 2.5, // Above threshold
        quickRatio: 2.0,
        cashRatio: 1.0,
        workingCapital: 500000,
        grossProfitMargin: 40,
        netProfitMargin: 15, // Above threshold
        operatingMargin: 20,
        returnOnAssets: 25,
        returnOnEquity: 30,
        returnOnInvestment: 28,
        assetTurnover: 1.5,
        inventoryTurnover: 6,
        receivablesTurnover: 12,
        payablesTurnover: 8,
        daysSalesOutstanding: 30,
        daysInventoryOutstanding: 60,
        debtToAssets: 30,
        debtToEquity: 40, // Below threshold
        equityRatio: 70,
        interestCoverage: 10,
        debtServiceCoverage: 5
      };

      const result = await service.generateEarlyWarningIndicators(currentRatios);

      expect(result).toHaveLength(3);
      
      const liquidityWarning = result.find(indicator => indicator.id === 'liquidity_warning');
      expect(liquidityWarning?.status).toBe('normal');
      
      const profitabilityWarning = result.find(indicator => indicator.id === 'profitability_warning');
      expect(profitabilityWarning?.status).toBe('normal');
      
      const debtWarning = result.find(indicator => indicator.id === 'debt_warning');
      expect(debtWarning?.status).toBe('normal');
    });
  });

  describe('Data Storage Operations', () => {
    it('should save analytics data correctly', async () => {
      const { asyncStorage } = await import('../../src/utils/storage');
      (asyncStorage.getItem as any).mockResolvedValue([]);
      (asyncStorage.setItem as any).mockResolvedValue(undefined);

      const analyticsData = {
        companyId: 'company_1',
        period: '2024-01',
        liquidityRatios: {
          currentRatio: 1.5,
          quickRatio: 1.2,
          cashRatio: 0.8,
          workingCapital: 300000
        },
        profitabilityRatios: {
          grossProfitMargin: 35,
          netProfitMargin: 12,
          operatingMargin: 18,
          returnOnAssets: 20,
          returnOnEquity: 25,
          returnOnInvestment: 22
        },
        activityRatios: {
          assetTurnover: 1.3,
          inventoryTurnover: 5,
          receivablesTurnover: 10,
          payablesTurnover: 7,
          daysSalesOutstanding: 36,
          daysInventoryOutstanding: 73
        },
        leverageRatios: {
          debtToAssets: 35,
          debtToEquity: 45,
          equityRatio: 65,
          interestCoverage: 8,
          debtServiceCoverage: 3
        },
        trendAnalysis: [],
        cashFlowForecast: [],
        seasonalityAnalysis: [],
        earlyWarningIndicators: [],
        kpis: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await service.saveAnalyticsData(analyticsData);

      expect(asyncStorage.setItem).toHaveBeenCalledWith(
        'financial_analytics',
        expect.arrayContaining([
          expect.objectContaining({
            companyId: 'company_1',
            period: '2024-01'
          })
        ])
      );
    });

    it('should get analytics data by company', async () => {
      const { asyncStorage } = await import('../../src/utils/storage');
      const mockData = [
        { companyId: 'company_1', period: '2024-01' },
        { companyId: 'company_2', period: '2024-01' },
        { companyId: 'company_1', period: '2024-02' }
      ];
      (asyncStorage.getItem as any).mockResolvedValue(mockData);

      const result = await service.getAnalyticsDataByCompany('company_1');

      expect(result).toHaveLength(2);
      expect(result.every(item => item.companyId === 'company_1')).toBe(true);
    });

    it('should delete analytics data correctly', async () => {
      const { asyncStorage } = await import('../../src/utils/storage');
      const mockData = [
        { companyId: 'company_1', period: '2024-01' },
        { companyId: 'company_2', period: '2024-01' },
        { companyId: 'company_1', period: '2024-02' }
      ];
      (asyncStorage.getItem as any).mockResolvedValue(mockData);
      (asyncStorage.setItem as any).mockResolvedValue(undefined);

      await service.deleteAnalyticsData('company_1', '2024-01');

      expect(asyncStorage.setItem).toHaveBeenCalledWith(
        'financial_analytics',
        expect.arrayContaining([
          expect.objectContaining({ companyId: 'company_2', period: '2024-01' }),
          expect.objectContaining({ companyId: 'company_1', period: '2024-02' })
        ])
      );
    });
  });
});
