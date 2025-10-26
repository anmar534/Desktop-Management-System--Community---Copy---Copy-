/**
 * خدمة القوائم المالية الشاملة
 * تطبق معايير المحاسبة السعودية والدولية
 */

import { asyncStorage } from '@/shared/utils/storage/storage'

// ===========================
// 📊 Types & Interfaces
// ===========================

export interface IncomeStatement {
  id: string
  period: string
  startDate: string
  endDate: string
  revenue: {
    projectRevenue: number
    tenderRevenue: number
    otherRevenue: number
    totalRevenue: number
  }
  costOfGoodsSold: {
    directMaterials: number
    directLabor: number
    directExpenses: number
    totalCOGS: number
  }
  grossProfit: number
  grossProfitMargin: number
  operatingExpenses: {
    administrativeExpenses: number
    sellingExpenses: number
    generalExpenses: number
    totalOperatingExpenses: number
  }
  operatingIncome: number
  operatingMargin: number
  otherIncome: number
  otherExpenses: number
  netIncome: number
  netProfitMargin: number
  createdAt: string
  updatedAt: string
}

export interface BalanceSheet {
  id: string
  asOfDate: string
  assets: {
    currentAssets: {
      cash: number
      accountsReceivable: number
      inventory: number
      prepaidExpenses: number
      otherCurrentAssets: number
      totalCurrentAssets: number
    }
    nonCurrentAssets: {
      propertyPlantEquipment: number
      intangibleAssets: number
      investments: number
      otherNonCurrentAssets: number
      totalNonCurrentAssets: number
    }
    totalAssets: number
  }
  liabilities: {
    currentLiabilities: {
      accountsPayable: number
      shortTermDebt: number
      accruedExpenses: number
      otherCurrentLiabilities: number
      totalCurrentLiabilities: number
    }
    nonCurrentLiabilities: {
      longTermDebt: number
      deferredTaxLiabilities: number
      otherNonCurrentLiabilities: number
      totalNonCurrentLiabilities: number
    }
    totalLiabilities: number
  }
  equity: {
    paidInCapital: number
    retainedEarnings: number
    otherEquity: number
    totalEquity: number
  }
  createdAt: string
  updatedAt: string
}

export interface CashFlowStatement {
  id: string
  period: string
  startDate: string
  endDate: string
  operatingActivities: {
    netIncome: number
    depreciation: number
    accountsReceivableChange: number
    inventoryChange: number
    accountsPayableChange: number
    otherOperatingChanges: number
    netCashFromOperating: number
  }
  investingActivities: {
    capitalExpenditures: number
    assetSales: number
    investments: number
    otherInvestingChanges: number
    netCashFromInvesting: number
  }
  financingActivities: {
    debtIssuance: number
    debtRepayment: number
    equityIssuance: number
    dividendsPaid: number
    otherFinancingChanges: number
    netCashFromFinancing: number
  }
  netCashFlow: number
  beginningCash: number
  endingCash: number
  createdAt: string
  updatedAt: string
}

export interface FinancialStatements {
  incomeStatement: IncomeStatement
  balanceSheet: BalanceSheet
  cashFlowStatement: CashFlowStatement
  period: string
  currency: 'SAR'
  createdAt: string
  updatedAt: string
}

// ===========================
// 🔧 Storage Keys
// ===========================

const STORAGE_KEYS = {
  INCOME_STATEMENTS: 'financial_income_statements',
  BALANCE_SHEETS: 'financial_balance_sheets',
  CASH_FLOW_STATEMENTS: 'financial_cash_flow_statements',
  FINANCIAL_STATEMENTS: 'financial_statements_combined',
} as const

// ===========================
// 💼 Financial Statements Service
// ===========================

export class FinancialStatementsService {
  /**
   * إنشاء قائمة دخل جديدة
   */
  async createIncomeStatement(
    data: Omit<IncomeStatement, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<IncomeStatement> {
    try {
      const incomeStatement: IncomeStatement = {
        ...data,
        id: `income_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // حساب المؤشرات المالية
      incomeStatement.grossProfit =
        incomeStatement.revenue.totalRevenue - incomeStatement.costOfGoodsSold.totalCOGS
      incomeStatement.grossProfitMargin =
        incomeStatement.revenue.totalRevenue > 0
          ? (incomeStatement.grossProfit / incomeStatement.revenue.totalRevenue) * 100
          : 0

      incomeStatement.operatingIncome =
        incomeStatement.grossProfit - incomeStatement.operatingExpenses.totalOperatingExpenses
      incomeStatement.operatingMargin =
        incomeStatement.revenue.totalRevenue > 0
          ? (incomeStatement.operatingIncome / incomeStatement.revenue.totalRevenue) * 100
          : 0

      incomeStatement.netIncome =
        incomeStatement.operatingIncome +
        incomeStatement.otherIncome -
        incomeStatement.otherExpenses
      incomeStatement.netProfitMargin =
        incomeStatement.revenue.totalRevenue > 0
          ? (incomeStatement.netIncome / incomeStatement.revenue.totalRevenue) * 100
          : 0

      const statements = await this.getIncomeStatements()
      statements.push(incomeStatement)
      await asyncStorage.setItem(STORAGE_KEYS.INCOME_STATEMENTS, statements)

      return incomeStatement
    } catch (error) {
      throw new Error(`فشل في إنشاء قائمة الدخل: ${error}`)
    }
  }

  /**
   * إنشاء ميزانية عمومية جديدة
   */
  async createBalanceSheet(
    data: Omit<BalanceSheet, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<BalanceSheet> {
    try {
      const balanceSheet: BalanceSheet = {
        ...data,
        id: `balance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // حساب الإجماليات
      balanceSheet.assets.currentAssets.totalCurrentAssets =
        balanceSheet.assets.currentAssets.cash +
        balanceSheet.assets.currentAssets.accountsReceivable +
        balanceSheet.assets.currentAssets.inventory +
        balanceSheet.assets.currentAssets.prepaidExpenses +
        balanceSheet.assets.currentAssets.otherCurrentAssets

      balanceSheet.assets.nonCurrentAssets.totalNonCurrentAssets =
        balanceSheet.assets.nonCurrentAssets.propertyPlantEquipment +
        balanceSheet.assets.nonCurrentAssets.intangibleAssets +
        balanceSheet.assets.nonCurrentAssets.investments +
        balanceSheet.assets.nonCurrentAssets.otherNonCurrentAssets

      balanceSheet.assets.totalAssets =
        balanceSheet.assets.currentAssets.totalCurrentAssets +
        balanceSheet.assets.nonCurrentAssets.totalNonCurrentAssets

      balanceSheet.liabilities.currentLiabilities.totalCurrentLiabilities =
        balanceSheet.liabilities.currentLiabilities.accountsPayable +
        balanceSheet.liabilities.currentLiabilities.shortTermDebt +
        balanceSheet.liabilities.currentLiabilities.accruedExpenses +
        balanceSheet.liabilities.currentLiabilities.otherCurrentLiabilities

      balanceSheet.liabilities.nonCurrentLiabilities.totalNonCurrentLiabilities =
        balanceSheet.liabilities.nonCurrentLiabilities.longTermDebt +
        balanceSheet.liabilities.nonCurrentLiabilities.deferredTaxLiabilities +
        balanceSheet.liabilities.nonCurrentLiabilities.otherNonCurrentLiabilities

      balanceSheet.liabilities.totalLiabilities =
        balanceSheet.liabilities.currentLiabilities.totalCurrentLiabilities +
        balanceSheet.liabilities.nonCurrentLiabilities.totalNonCurrentLiabilities

      balanceSheet.equity.totalEquity =
        balanceSheet.equity.paidInCapital +
        balanceSheet.equity.retainedEarnings +
        balanceSheet.equity.otherEquity

      // التحقق من التوازن المحاسبي
      const totalLiabilitiesAndEquity =
        balanceSheet.liabilities.totalLiabilities + balanceSheet.equity.totalEquity
      if (Math.abs(balanceSheet.assets.totalAssets - totalLiabilitiesAndEquity) > 0.01) {
        console.warn('تحذير: الميزانية العمومية غير متوازنة', {
          assets: balanceSheet.assets.totalAssets,
          liabilitiesAndEquity: totalLiabilitiesAndEquity,
          difference: balanceSheet.assets.totalAssets - totalLiabilitiesAndEquity,
        })
      }

      const statements = await this.getBalanceSheets()
      statements.push(balanceSheet)
      await asyncStorage.setItem(STORAGE_KEYS.BALANCE_SHEETS, statements)

      return balanceSheet
    } catch (error) {
      throw new Error(`فشل في إنشاء الميزانية العمومية: ${error}`)
    }
  }

  /**
   * إنشاء قائمة تدفقات نقدية جديدة
   */
  async createCashFlowStatement(
    data: Omit<CashFlowStatement, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<CashFlowStatement> {
    try {
      const cashFlowStatement: CashFlowStatement = {
        ...data,
        id: `cashflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // حساب صافي التدفقات النقدية
      cashFlowStatement.operatingActivities.netCashFromOperating =
        cashFlowStatement.operatingActivities.netIncome +
        cashFlowStatement.operatingActivities.depreciation +
        cashFlowStatement.operatingActivities.accountsReceivableChange +
        cashFlowStatement.operatingActivities.inventoryChange +
        cashFlowStatement.operatingActivities.accountsPayableChange +
        cashFlowStatement.operatingActivities.otherOperatingChanges

      cashFlowStatement.investingActivities.netCashFromInvesting =
        cashFlowStatement.investingActivities.capitalExpenditures +
        cashFlowStatement.investingActivities.assetSales +
        cashFlowStatement.investingActivities.investments +
        cashFlowStatement.investingActivities.otherInvestingChanges

      cashFlowStatement.financingActivities.netCashFromFinancing =
        cashFlowStatement.financingActivities.debtIssuance +
        cashFlowStatement.financingActivities.debtRepayment +
        cashFlowStatement.financingActivities.equityIssuance +
        cashFlowStatement.financingActivities.dividendsPaid +
        cashFlowStatement.financingActivities.otherFinancingChanges

      cashFlowStatement.netCashFlow =
        cashFlowStatement.operatingActivities.netCashFromOperating +
        cashFlowStatement.investingActivities.netCashFromInvesting +
        cashFlowStatement.financingActivities.netCashFromFinancing

      cashFlowStatement.endingCash = cashFlowStatement.beginningCash + cashFlowStatement.netCashFlow

      const statements = await this.getCashFlowStatements()
      statements.push(cashFlowStatement)
      await asyncStorage.setItem(STORAGE_KEYS.CASH_FLOW_STATEMENTS, statements)

      return cashFlowStatement
    } catch (error) {
      throw new Error(`فشل في إنشاء قائمة التدفقات النقدية: ${error}`)
    }
  }

  /**
   * الحصول على جميع قوائم الدخل
   */
  async getIncomeStatements(): Promise<IncomeStatement[]> {
    try {
      return (await asyncStorage.getItem(STORAGE_KEYS.INCOME_STATEMENTS)) || []
    } catch (error) {
      console.error('خطأ في جلب قوائم الدخل:', error)
      return []
    }
  }

  /**
   * الحصول على جميع الميزانيات العمومية
   */
  async getBalanceSheets(): Promise<BalanceSheet[]> {
    try {
      return (await asyncStorage.getItem(STORAGE_KEYS.BALANCE_SHEETS)) || []
    } catch (error) {
      console.error('خطأ في جلب الميزانيات العمومية:', error)
      return []
    }
  }

  /**
   * الحصول على جميع قوائم التدفقات النقدية
   */
  async getCashFlowStatements(): Promise<CashFlowStatement[]> {
    try {
      return (await asyncStorage.getItem(STORAGE_KEYS.CASH_FLOW_STATEMENTS)) || []
    } catch (error) {
      console.error('خطأ في جلب قوائم التدفقات النقدية:', error)
      return []
    }
  }

  /**
   * الحصول على القوائم المالية المجمعة لفترة محددة
   */
  async getFinancialStatements(period: string): Promise<FinancialStatements | null> {
    try {
      const incomeStatements = await this.getIncomeStatements()
      const balanceSheets = await this.getBalanceSheets()
      const cashFlowStatements = await this.getCashFlowStatements()

      const incomeStatement = incomeStatements.find((stmt) => stmt.period === period)
      const balanceSheet = balanceSheets.find((stmt) => stmt.asOfDate.includes(period))
      const cashFlowStatement = cashFlowStatements.find((stmt) => stmt.period === period)

      if (!incomeStatement || !balanceSheet || !cashFlowStatement) {
        return null
      }

      return {
        incomeStatement,
        balanceSheet,
        cashFlowStatement,
        period,
        currency: 'SAR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    } catch (error) {
      console.error('خطأ في جلب القوائم المالية المجمعة:', error)
      return null
    }
  }

  /**
   * حساب النسب المالية الأساسية
   */
  async calculateFinancialRatios(period: string): Promise<{
    liquidityRatios: {
      currentRatio: number
      quickRatio: number
      cashRatio: number
    }
    profitabilityRatios: {
      grossProfitMargin: number
      operatingMargin: number
      netProfitMargin: number
      returnOnAssets: number
      returnOnEquity: number
    }
    leverageRatios: {
      debtToAssets: number
      debtToEquity: number
      equityRatio: number
    }
  } | null> {
    try {
      const statements = await this.getFinancialStatements(period)
      if (!statements) return null

      const { incomeStatement, balanceSheet } = statements

      // نسب السيولة
      const currentRatio =
        balanceSheet.liabilities.currentLiabilities.totalCurrentLiabilities > 0
          ? balanceSheet.assets.currentAssets.totalCurrentAssets /
            balanceSheet.liabilities.currentLiabilities.totalCurrentLiabilities
          : 0

      const quickAssets =
        balanceSheet.assets.currentAssets.totalCurrentAssets -
        balanceSheet.assets.currentAssets.inventory
      const quickRatio =
        balanceSheet.liabilities.currentLiabilities.totalCurrentLiabilities > 0
          ? quickAssets / balanceSheet.liabilities.currentLiabilities.totalCurrentLiabilities
          : 0

      const cashRatio =
        balanceSheet.liabilities.currentLiabilities.totalCurrentLiabilities > 0
          ? balanceSheet.assets.currentAssets.cash /
            balanceSheet.liabilities.currentLiabilities.totalCurrentLiabilities
          : 0

      // نسب الربحية
      const returnOnAssets =
        balanceSheet.assets.totalAssets > 0
          ? (incomeStatement.netIncome / balanceSheet.assets.totalAssets) * 100
          : 0

      const returnOnEquity =
        balanceSheet.equity.totalEquity > 0
          ? (incomeStatement.netIncome / balanceSheet.equity.totalEquity) * 100
          : 0

      // نسب المديونية
      const debtToAssets =
        balanceSheet.assets.totalAssets > 0
          ? (balanceSheet.liabilities.totalLiabilities / balanceSheet.assets.totalAssets) * 100
          : 0

      const debtToEquity =
        balanceSheet.equity.totalEquity > 0
          ? (balanceSheet.liabilities.totalLiabilities / balanceSheet.equity.totalEquity) * 100
          : 0

      const equityRatio =
        balanceSheet.assets.totalAssets > 0
          ? (balanceSheet.equity.totalEquity / balanceSheet.assets.totalAssets) * 100
          : 0

      return {
        liquidityRatios: {
          currentRatio: Math.round(currentRatio * 100) / 100,
          quickRatio: Math.round(quickRatio * 100) / 100,
          cashRatio: Math.round(cashRatio * 100) / 100,
        },
        profitabilityRatios: {
          grossProfitMargin: Math.round(incomeStatement.grossProfitMargin * 100) / 100,
          operatingMargin: Math.round(incomeStatement.operatingMargin * 100) / 100,
          netProfitMargin: Math.round(incomeStatement.netProfitMargin * 100) / 100,
          returnOnAssets: Math.round(returnOnAssets * 100) / 100,
          returnOnEquity: Math.round(returnOnEquity * 100) / 100,
        },
        leverageRatios: {
          debtToAssets: Math.round(debtToAssets * 100) / 100,
          debtToEquity: Math.round(debtToEquity * 100) / 100,
          equityRatio: Math.round(equityRatio * 100) / 100,
        },
      }
    } catch (error) {
      console.error('خطأ في حساب النسب المالية:', error)
      return null
    }
  }

  /**
   * حذف قائمة دخل
   */
  async deleteIncomeStatement(id: string): Promise<boolean> {
    try {
      const statements = await this.getIncomeStatements()
      const filteredStatements = statements.filter((stmt) => stmt.id !== id)
      await asyncStorage.setItem(STORAGE_KEYS.INCOME_STATEMENTS, filteredStatements)
      return true
    } catch (error) {
      console.error('خطأ في حذف قائمة الدخل:', error)
      return false
    }
  }

  /**
   * حذف ميزانية عمومية
   */
  async deleteBalanceSheet(id: string): Promise<boolean> {
    try {
      const statements = await this.getBalanceSheets()
      const filteredStatements = statements.filter((stmt) => stmt.id !== id)
      await asyncStorage.setItem(STORAGE_KEYS.BALANCE_SHEETS, filteredStatements)
      return true
    } catch (error) {
      console.error('خطأ في حذف الميزانية العمومية:', error)
      return false
    }
  }

  /**
   * حذف قائمة تدفقات نقدية
   */
  async deleteCashFlowStatement(id: string): Promise<boolean> {
    try {
      const statements = await this.getCashFlowStatements()
      const filteredStatements = statements.filter((stmt) => stmt.id !== id)
      await asyncStorage.setItem(STORAGE_KEYS.CASH_FLOW_STATEMENTS, filteredStatements)
      return true
    } catch (error) {
      console.error('خطأ في حذف قائمة التدفقات النقدية:', error)
      return false
    }
  }
}

export const financialStatementsService = new FinancialStatementsService()
