/**
 * اختبارات خدمة القوائم المالية
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { financialStatementsService, type IncomeStatement, type BalanceSheet, type CashFlowStatement } from '../../src/services/financialStatementsService'
import { asyncStorage } from '../../src/utils/storage'

// Mock asyncStorage
vi.mock('../../src/utils/storage', () => ({
  asyncStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
}))

describe('FinancialStatementsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock empty storage by default
    vi.mocked(asyncStorage.getItem).mockResolvedValue([])
  })

  describe('Income Statement Operations', () => {
    const mockIncomeStatementData = {
      period: '2024',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      revenue: {
        projectRevenue: 1000000,
        tenderRevenue: 500000,
        otherRevenue: 50000,
        totalRevenue: 1550000
      },
      costOfGoodsSold: {
        directMaterials: 400000,
        directLabor: 300000,
        directExpenses: 100000,
        totalCOGS: 800000
      },
      grossProfit: 0, // Will be calculated
      grossProfitMargin: 0, // Will be calculated
      operatingExpenses: {
        administrativeExpenses: 200000,
        sellingExpenses: 100000,
        generalExpenses: 50000,
        totalOperatingExpenses: 350000
      },
      operatingIncome: 0, // Will be calculated
      operatingMargin: 0, // Will be calculated
      otherIncome: 25000,
      otherExpenses: 15000,
      netIncome: 0, // Will be calculated
      netProfitMargin: 0 // Will be calculated
    }

    it('should create income statement with calculated metrics', async () => {
      const result = await financialStatementsService.createIncomeStatement(mockIncomeStatementData)

      expect(result).toBeDefined()
      expect(result.id).toMatch(/^income_\d+_[a-z0-9]+$/)
      expect(result.grossProfit).toBe(750000) // 1550000 - 800000
      expect(result.grossProfitMargin).toBeCloseTo(48.39, 2) // (750000 / 1550000) * 100
      expect(result.operatingIncome).toBe(400000) // 750000 - 350000
      expect(result.operatingMargin).toBeCloseTo(25.81, 2) // (400000 / 1550000) * 100
      expect(result.netIncome).toBe(410000) // 400000 + 25000 - 15000
      expect(result.netProfitMargin).toBeCloseTo(26.45, 2) // (410000 / 1550000) * 100
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()

      expect(asyncStorage.setItem).toHaveBeenCalledWith(
        'financial_income_statements',
        expect.arrayContaining([result])
      )
    })

    it('should handle zero revenue correctly', async () => {
      const zeroRevenueData = {
        ...mockIncomeStatementData,
        revenue: {
          projectRevenue: 0,
          tenderRevenue: 0,
          otherRevenue: 0,
          totalRevenue: 0
        }
      }

      const result = await financialStatementsService.createIncomeStatement(zeroRevenueData)

      expect(result.grossProfitMargin).toBe(0)
      expect(result.operatingMargin).toBe(0)
      expect(result.netProfitMargin).toBe(0)
    })

    it('should retrieve all income statements', async () => {
      const mockStatements = [
        { id: '1', period: '2023' },
        { id: '2', period: '2024' }
      ]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockStatements)

      const result = await financialStatementsService.getIncomeStatements()

      expect(result).toEqual(mockStatements)
      expect(asyncStorage.getItem).toHaveBeenCalledWith('financial_income_statements')
    })

    it('should delete income statement', async () => {
      const mockStatements = [
        { id: 'stmt1', period: '2023' },
        { id: 'stmt2', period: '2024' }
      ]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockStatements)

      const result = await financialStatementsService.deleteIncomeStatement('stmt1')

      expect(result).toBe(true)
      expect(asyncStorage.setItem).toHaveBeenCalledWith(
        'financial_income_statements',
        [{ id: 'stmt2', period: '2024' }]
      )
    })
  })

  describe('Balance Sheet Operations', () => {
    const mockBalanceSheetData = {
      asOfDate: '2024-12-31',
      assets: {
        currentAssets: {
          cash: 500000,
          accountsReceivable: 300000,
          inventory: 200000,
          prepaidExpenses: 50000,
          otherCurrentAssets: 25000,
          totalCurrentAssets: 0 // Will be calculated
        },
        nonCurrentAssets: {
          propertyPlantEquipment: 1000000,
          intangibleAssets: 100000,
          investments: 200000,
          otherNonCurrentAssets: 50000,
          totalNonCurrentAssets: 0 // Will be calculated
        },
        totalAssets: 0 // Will be calculated
      },
      liabilities: {
        currentLiabilities: {
          accountsPayable: 150000,
          shortTermDebt: 100000,
          accruedExpenses: 75000,
          otherCurrentLiabilities: 25000,
          totalCurrentLiabilities: 0 // Will be calculated
        },
        nonCurrentLiabilities: {
          longTermDebt: 500000,
          deferredTaxLiabilities: 50000,
          otherNonCurrentLiabilities: 25000,
          totalNonCurrentLiabilities: 0 // Will be calculated
        },
        totalLiabilities: 0 // Will be calculated
      },
      equity: {
        paidInCapital: 1000000,
        retainedEarnings: 500000,
        otherEquity: 50000,
        totalEquity: 0 // Will be calculated
      }
    }

    it('should create balance sheet with calculated totals', async () => {
      const result = await financialStatementsService.createBalanceSheet(mockBalanceSheetData)

      expect(result).toBeDefined()
      expect(result.id).toMatch(/^balance_\d+_[a-z0-9]+$/)
      
      // Check current assets calculation
      expect(result.assets.currentAssets.totalCurrentAssets).toBe(1075000)
      
      // Check non-current assets calculation
      expect(result.assets.nonCurrentAssets.totalNonCurrentAssets).toBe(1350000)
      
      // Check total assets calculation
      expect(result.assets.totalAssets).toBe(2425000)
      
      // Check current liabilities calculation
      expect(result.liabilities.currentLiabilities.totalCurrentLiabilities).toBe(350000)
      
      // Check non-current liabilities calculation
      expect(result.liabilities.nonCurrentLiabilities.totalNonCurrentLiabilities).toBe(575000)
      
      // Check total liabilities calculation
      expect(result.liabilities.totalLiabilities).toBe(925000)
      
      // Check equity calculation
      expect(result.equity.totalEquity).toBe(1550000)
      
      // Check balance (Assets = Liabilities + Equity)
      const totalLiabilitiesAndEquity = result.liabilities.totalLiabilities + result.equity.totalEquity
      expect(Math.abs(result.assets.totalAssets - totalLiabilitiesAndEquity)).toBeLessThan(0.01)

      expect(asyncStorage.setItem).toHaveBeenCalledWith(
        'financial_balance_sheets',
        expect.arrayContaining([result])
      )
    })

    it('should retrieve all balance sheets', async () => {
      const mockSheets = [
        { id: '1', asOfDate: '2023-12-31' },
        { id: '2', asOfDate: '2024-12-31' }
      ]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockSheets)

      const result = await financialStatementsService.getBalanceSheets()

      expect(result).toEqual(mockSheets)
      expect(asyncStorage.getItem).toHaveBeenCalledWith('financial_balance_sheets')
    })

    it('should delete balance sheet', async () => {
      const mockSheets = [
        { id: 'sheet1', asOfDate: '2023-12-31' },
        { id: 'sheet2', asOfDate: '2024-12-31' }
      ]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockSheets)

      const result = await financialStatementsService.deleteBalanceSheet('sheet1')

      expect(result).toBe(true)
      expect(asyncStorage.setItem).toHaveBeenCalledWith(
        'financial_balance_sheets',
        [{ id: 'sheet2', asOfDate: '2024-12-31' }]
      )
    })
  })

  describe('Cash Flow Statement Operations', () => {
    const mockCashFlowData = {
      period: '2024',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      operatingActivities: {
        netIncome: 410000,
        depreciation: 100000,
        accountsReceivableChange: -50000,
        inventoryChange: -25000,
        accountsPayableChange: 30000,
        otherOperatingChanges: 10000,
        netCashFromOperating: 0 // Will be calculated
      },
      investingActivities: {
        capitalExpenditures: -200000,
        assetSales: 50000,
        investments: -100000,
        otherInvestingChanges: 0,
        netCashFromInvesting: 0 // Will be calculated
      },
      financingActivities: {
        debtIssuance: 100000,
        debtRepayment: -50000,
        equityIssuance: 0,
        dividendsPaid: -100000,
        otherFinancingChanges: 0,
        netCashFromFinancing: 0 // Will be calculated
      },
      netCashFlow: 0, // Will be calculated
      beginningCash: 300000,
      endingCash: 0 // Will be calculated
    }

    it('should create cash flow statement with calculated flows', async () => {
      const result = await financialStatementsService.createCashFlowStatement(mockCashFlowData)

      expect(result).toBeDefined()
      expect(result.id).toMatch(/^cashflow_\d+_[a-z0-9]+$/)
      
      // Check operating activities calculation
      expect(result.operatingActivities.netCashFromOperating).toBe(475000)
      
      // Check investing activities calculation
      expect(result.investingActivities.netCashFromInvesting).toBe(-250000)
      
      // Check financing activities calculation
      expect(result.financingActivities.netCashFromFinancing).toBe(-50000)
      
      // Check net cash flow calculation
      expect(result.netCashFlow).toBe(175000) // 475000 - 250000 - 50000
      
      // Check ending cash calculation
      expect(result.endingCash).toBe(475000) // 300000 + 175000

      expect(asyncStorage.setItem).toHaveBeenCalledWith(
        'financial_cash_flow_statements',
        expect.arrayContaining([result])
      )
    })

    it('should retrieve all cash flow statements', async () => {
      const mockStatements = [
        { id: '1', period: '2023' },
        { id: '2', period: '2024' }
      ]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockStatements)

      const result = await financialStatementsService.getCashFlowStatements()

      expect(result).toEqual(mockStatements)
      expect(asyncStorage.getItem).toHaveBeenCalledWith('financial_cash_flow_statements')
    })

    it('should delete cash flow statement', async () => {
      const mockStatements = [
        { id: 'cf1', period: '2023' },
        { id: 'cf2', period: '2024' }
      ]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockStatements)

      const result = await financialStatementsService.deleteCashFlowStatement('cf1')

      expect(result).toBe(true)
      expect(asyncStorage.setItem).toHaveBeenCalledWith(
        'financial_cash_flow_statements',
        [{ id: 'cf2', period: '2024' }]
      )
    })
  })

  describe('Financial Ratios Calculations', () => {
    it('should calculate financial ratios correctly', async () => {
      const mockIncomeStatement = {
        id: 'income1',
        period: '2024',
        netIncome: 410000,
        grossProfitMargin: 48.39,
        operatingMargin: 25.81,
        netProfitMargin: 26.45
      }

      const mockBalanceSheet = {
        id: 'balance1',
        asOfDate: '2024-12-31',
        assets: {
          totalAssets: 2425000,
          currentAssets: { totalCurrentAssets: 1075000 }
        },
        liabilities: {
          totalLiabilities: 925000,
          currentLiabilities: { totalCurrentLiabilities: 350000 }
        },
        equity: { totalEquity: 1550000 }
      }

      // Mock the getFinancialStatements method
      vi.spyOn(financialStatementsService, 'getFinancialStatements').mockResolvedValue({
        incomeStatement: mockIncomeStatement as any,
        balanceSheet: mockBalanceSheet as any,
        cashFlowStatement: {} as any,
        period: '2024',
        currency: 'SAR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      const ratios = await financialStatementsService.calculateFinancialRatios('2024')

      expect(ratios).toBeDefined()
      expect(ratios!.liquidityRatios.currentRatio).toBeCloseTo(3.07, 2) // 1075000 / 350000
      expect(ratios!.profitabilityRatios.returnOnAssets).toBeCloseTo(16.91, 2) // (410000 / 2425000) * 100
      expect(ratios!.profitabilityRatios.returnOnEquity).toBeCloseTo(26.45, 2) // (410000 / 1550000) * 100
      expect(ratios!.leverageRatios.debtToAssets).toBeCloseTo(38.14, 2) // (925000 / 2425000) * 100
      expect(ratios!.leverageRatios.equityRatio).toBeCloseTo(63.92, 2) // (1550000 / 2425000) * 100
    })

    it('should handle missing financial statements', async () => {
      vi.spyOn(financialStatementsService, 'getFinancialStatements').mockResolvedValue(null)

      const ratios = await financialStatementsService.calculateFinancialRatios('2024')

      expect(ratios).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      vi.mocked(asyncStorage.getItem).mockRejectedValue(new Error('Storage error'))

      const result = await financialStatementsService.getIncomeStatements()

      expect(result).toEqual([])
    })

    it('should handle creation errors', async () => {
      vi.mocked(asyncStorage.setItem).mockRejectedValue(new Error('Storage error'))

      await expect(
        financialStatementsService.createIncomeStatement({} as any)
      ).rejects.toThrow('فشل في إنشاء قائمة الدخل')
    })
  })
})
