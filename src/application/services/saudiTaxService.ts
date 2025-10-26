/**
 * خدمة التقارير الضريبية السعودية
 * Saudi Tax Reports Service
 *
 * تطبق قوانين ضريبة القيمة المضافة السعودية 15%
 * ونظام الزكاة والضريبة والجمارك
 */

import { asyncStorage } from '@/shared/utils/storage/storage'

// أنواع البيانات الضريبية
export interface VATTransaction {
  id: string
  date: string
  type: 'sale' | 'purchase' | 'import' | 'export'
  description: string
  descriptionEn: string
  amount: number
  vatRate: number
  vatAmount: number
  totalAmount: number
  invoiceNumber: string
  customerSupplier: string
  customerSupplierEn: string
  taxNumber?: string
  category: 'standard' | 'zero_rated' | 'exempt' | 'out_of_scope'
  createdAt: string
  updatedAt: string
  version: number
}

export interface VATReturn {
  id: string
  period: string // YYYY-MM format
  periodType: 'monthly' | 'quarterly'
  startDate: string
  endDate: string

  // مبيعات خاضعة للضريبة
  standardRatedSales: number
  zeroRatedSales: number
  exemptSales: number
  totalSales: number
  outputVAT: number

  // مشتريات خاضعة للضريبة
  standardRatedPurchases: number
  zeroRatedPurchases: number
  exemptPurchases: number
  totalPurchases: number
  inputVAT: number

  // صافي الضريبة
  netVAT: number
  vatPayable: number
  vatRefundable: number

  // حالة الإقرار
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  submissionDate?: string
  approvalDate?: string

  createdAt: string
  updatedAt: string
  version: number
}

export interface TaxSettings {
  companyTaxNumber: string
  companyNameAr: string
  companyNameEn: string
  vatRegistrationNumber: string
  vatRegistrationDate: string
  businessActivity: string
  businessActivityEn: string
  returnPeriod: 'monthly' | 'quarterly'
  fiscalYearStart: string
  zakatEnabled: boolean
  incomeTaxEnabled: boolean
}

export interface ZakatCalculation {
  id: string
  year: string

  // الأصول الزكوية
  cash: number
  bankDeposits: number
  accountsReceivable: number
  inventory: number
  investments: number
  totalZakatableAssets: number

  // الخصوم المخصومة
  accountsPayable: number
  shortTermDebt: number
  totalDeductibleLiabilities: number

  // صافي الأصول الزكوية
  netZakatableAssets: number

  // حساب الزكاة (2.5%)
  zakatRate: number
  zakatDue: number

  status: 'draft' | 'calculated' | 'submitted'
  createdAt: string
  updatedAt: string
  version: number
}

export class SaudiTaxService {
  private readonly VAT_RATE = 0.15 // 15% ضريبة القيمة المضافة
  private readonly ZAKAT_RATE = 0.025 // 2.5% زكاة

  // إدارة المعاملات الضريبية
  async createVATTransaction(
    transactionData: Omit<VATTransaction, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
  ): Promise<VATTransaction> {
    const transaction: VATTransaction = {
      id: `vat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...transactionData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    }

    const transactions = await this.getAllVATTransactions()
    transactions.push(transaction)
    await asyncStorage.setItem('vat_transactions', JSON.stringify(transactions))

    return transaction
  }

  async getAllVATTransactions(): Promise<VATTransaction[]> {
    const data = await asyncStorage.getItem('vat_transactions')
    return data ? JSON.parse(data) : []
  }

  async getVATTransactionsByPeriod(startDate: string, endDate: string): Promise<VATTransaction[]> {
    const transactions = await this.getAllVATTransactions()
    return transactions.filter((t) => t.date >= startDate && t.date <= endDate)
  }

  // حساب ضريبة القيمة المضافة
  calculateVAT(
    amount: number,
    rate: number = this.VAT_RATE,
  ): { vatAmount: number; totalAmount: number } {
    const vatAmount = amount * rate
    const totalAmount = amount + vatAmount
    return { vatAmount, totalAmount }
  }

  calculateVATFromTotal(
    totalAmount: number,
    rate: number = this.VAT_RATE,
  ): { amount: number; vatAmount: number } {
    const amount = totalAmount / (1 + rate)
    const vatAmount = totalAmount - amount
    return { amount, vatAmount }
  }

  // إنشاء الإقرار الضريبي
  async generateVATReturn(period: string, periodType: 'monthly' | 'quarterly'): Promise<VATReturn> {
    const { startDate, endDate } = this.getPeriodDates(period, periodType)
    const transactions = await this.getVATTransactionsByPeriod(startDate, endDate)

    // حساب المبيعات
    const salesTransactions = transactions.filter((t) => t.type === 'sale')
    const standardRatedSales = salesTransactions
      .filter((t) => t.category === 'standard')
      .reduce((sum, t) => sum + t.amount, 0)
    const zeroRatedSales = salesTransactions
      .filter((t) => t.category === 'zero_rated')
      .reduce((sum, t) => sum + t.amount, 0)
    const exemptSales = salesTransactions
      .filter((t) => t.category === 'exempt')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalSales = standardRatedSales + zeroRatedSales + exemptSales
    const outputVAT = salesTransactions
      .filter((t) => t.category === 'standard')
      .reduce((sum, t) => sum + t.vatAmount, 0)

    // حساب المشتريات
    const purchaseTransactions = transactions.filter((t) => ['purchase', 'import'].includes(t.type))
    const standardRatedPurchases = purchaseTransactions
      .filter((t) => t.category === 'standard')
      .reduce((sum, t) => sum + t.amount, 0)
    const zeroRatedPurchases = purchaseTransactions
      .filter((t) => t.category === 'zero_rated')
      .reduce((sum, t) => sum + t.amount, 0)
    const exemptPurchases = purchaseTransactions
      .filter((t) => t.category === 'exempt')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalPurchases = standardRatedPurchases + zeroRatedPurchases + exemptPurchases
    const inputVAT = purchaseTransactions
      .filter((t) => t.category === 'standard')
      .reduce((sum, t) => sum + t.vatAmount, 0)

    // حساب صافي الضريبة
    const netVAT = outputVAT - inputVAT
    const vatPayable = netVAT > 0 ? netVAT : 0
    const vatRefundable = netVAT < 0 ? Math.abs(netVAT) : 0

    const vatReturn: VATReturn = {
      id: `vat_return_${period}_${Date.now()}`,
      period,
      periodType,
      startDate,
      endDate,
      standardRatedSales,
      zeroRatedSales,
      exemptSales,
      totalSales,
      outputVAT,
      standardRatedPurchases,
      zeroRatedPurchases,
      exemptPurchases,
      totalPurchases,
      inputVAT,
      netVAT,
      vatPayable,
      vatRefundable,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    }

    // حفظ الإقرار
    const returns = await this.getAllVATReturns()
    returns.push(vatReturn)
    await asyncStorage.setItem('vat_returns', JSON.stringify(returns))

    return vatReturn
  }

  async getAllVATReturns(): Promise<VATReturn[]> {
    const data = await asyncStorage.getItem('vat_returns')
    return data ? JSON.parse(data) : []
  }

  // حساب الزكاة
  async calculateZakat(
    year: string,
    assets: Omit<
      ZakatCalculation,
      | 'id'
      | 'year'
      | 'totalZakatableAssets'
      | 'totalDeductibleLiabilities'
      | 'netZakatableAssets'
      | 'zakatRate'
      | 'zakatDue'
      | 'status'
      | 'createdAt'
      | 'updatedAt'
      | 'version'
    >,
  ): Promise<ZakatCalculation> {
    const totalZakatableAssets =
      assets.cash +
      assets.bankDeposits +
      assets.accountsReceivable +
      assets.inventory +
      assets.investments
    const totalDeductibleLiabilities = assets.accountsPayable + assets.shortTermDebt
    const netZakatableAssets = totalZakatableAssets - totalDeductibleLiabilities
    const zakatDue = netZakatableAssets * this.ZAKAT_RATE

    const zakatCalculation: ZakatCalculation = {
      id: `zakat_${year}_${Date.now()}`,
      year,
      ...assets,
      totalZakatableAssets,
      totalDeductibleLiabilities,
      netZakatableAssets,
      zakatRate: this.ZAKAT_RATE,
      zakatDue,
      status: 'calculated',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    }

    const calculations = await this.getAllZakatCalculations()
    calculations.push(zakatCalculation)
    await asyncStorage.setItem('zakat_calculations', JSON.stringify(calculations))

    return zakatCalculation
  }

  async getAllZakatCalculations(): Promise<ZakatCalculation[]> {
    const data = await asyncStorage.getItem('zakat_calculations')
    return data ? JSON.parse(data) : []
  }

  // إعدادات الضرائب
  async getTaxSettings(): Promise<TaxSettings | null> {
    const data = await asyncStorage.getItem('tax_settings')
    return data ? JSON.parse(data) : null
  }

  async updateTaxSettings(settings: TaxSettings): Promise<void> {
    await asyncStorage.setItem('tax_settings', JSON.stringify(settings))
  }

  // مساعدات
  private getPeriodDates(
    period: string,
    periodType: 'monthly' | 'quarterly',
  ): { startDate: string; endDate: string } {
    const [year, month] = period.split('-').map(Number)

    if (periodType === 'monthly') {
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]
      return { startDate, endDate }
    } else {
      // ربع سنوي
      const quarterStartMonth = Math.floor((month - 1) / 3) * 3 + 1
      const startDate = new Date(year, quarterStartMonth - 1, 1).toISOString().split('T')[0]
      const endDate = new Date(year, quarterStartMonth + 2, 0).toISOString().split('T')[0]
      return { startDate, endDate }
    }
  }

  // تصدير البيانات للنظام الضريبي
  async exportVATReturnXML(returnId: string): Promise<string> {
    const returns = await this.getAllVATReturns()
    const vatReturn = returns.find((r) => r.id === returnId)

    if (!vatReturn) {
      throw new Error('VAT return not found')
    }

    const settings = await this.getTaxSettings()
    if (!settings) {
      throw new Error('Tax settings not configured')
    }

    // إنشاء XML للإقرار الضريبي (مبسط)
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<VATReturn>
  <Header>
    <TaxNumber>${settings.vatRegistrationNumber}</TaxNumber>
    <Period>${vatReturn.period}</Period>
    <PeriodType>${vatReturn.periodType}</PeriodType>
  </Header>
  <Sales>
    <StandardRated>${vatReturn.standardRatedSales}</StandardRated>
    <ZeroRated>${vatReturn.zeroRatedSales}</ZeroRated>
    <Exempt>${vatReturn.exemptSales}</Exempt>
    <OutputVAT>${vatReturn.outputVAT}</OutputVAT>
  </Sales>
  <Purchases>
    <StandardRated>${vatReturn.standardRatedPurchases}</StandardRated>
    <ZeroRated>${vatReturn.zeroRatedPurchases}</ZeroRated>
    <Exempt>${vatReturn.exemptPurchases}</Exempt>
    <InputVAT>${vatReturn.inputVAT}</InputVAT>
  </Purchases>
  <Summary>
    <NetVAT>${vatReturn.netVAT}</NetVAT>
    <VATPayable>${vatReturn.vatPayable}</VATPayable>
    <VATRefundable>${vatReturn.vatRefundable}</VATRefundable>
  </Summary>
</VATReturn>`

    return xml
  }

  // التحقق من صحة البيانات الضريبية
  async validateVATReturn(returnId: string): Promise<{ isValid: boolean; errors: string[] }> {
    const returns = await this.getAllVATReturns()
    const vatReturn = returns.find((r) => r.id === returnId)

    if (!vatReturn) {
      return { isValid: false, errors: ['VAT return not found'] }
    }

    const errors: string[] = []

    // التحقق من صحة الحسابات
    if (
      Math.abs(
        vatReturn.totalSales -
          (vatReturn.standardRatedSales + vatReturn.zeroRatedSales + vatReturn.exemptSales),
      ) > 0.01
    ) {
      errors.push('Total sales calculation error')
    }

    if (
      Math.abs(
        vatReturn.totalPurchases -
          (vatReturn.standardRatedPurchases +
            vatReturn.zeroRatedPurchases +
            vatReturn.exemptPurchases),
      ) > 0.01
    ) {
      errors.push('Total purchases calculation error')
    }

    if (Math.abs(vatReturn.netVAT - (vatReturn.outputVAT - vatReturn.inputVAT)) > 0.01) {
      errors.push('Net VAT calculation error')
    }

    // التحقق من المنطق
    if (vatReturn.vatPayable > 0 && vatReturn.vatRefundable > 0) {
      errors.push('Cannot have both VAT payable and refundable')
    }

    return { isValid: errors.length === 0, errors }
  }
}
