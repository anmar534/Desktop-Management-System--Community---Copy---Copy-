/**
 * Core Financial Service Tests
 * اختبارات الخدمات المالية الأساسية
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock types
interface FinancialSummary {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  profitMargin: number
  currency: string
}

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  currency: string
  description: string
  date: string
  category: string
}

// Simple Financial Service for testing
class FinancialService {
  private transactions: Transaction[] = []

  addTransaction(transaction: Omit<Transaction, 'id'>): Transaction {
    const newTransaction: Transaction = {
      ...transaction,
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
    this.transactions.push(newTransaction)
    return newTransaction
  }

  getTransactions(): Transaction[] {
    return [...this.transactions]
  }

  getTransactionById(id: string): Transaction | null {
    return this.transactions.find((t) => t.id === id) || null
  }

  deleteTransaction(id: string): boolean {
    const index = this.transactions.findIndex((t) => t.id === id)
    if (index === -1) return false
    this.transactions.splice(index, 1)
    return true
  }

  calculateSummary(currency = 'SAR'): FinancialSummary {
    const currencyTransactions = this.transactions.filter((t) => t.currency === currency)

    const totalRevenue = currencyTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpenses = currencyTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      currency,
    }
  }

  getTransactionsByCategory(category: string): Transaction[] {
    return this.transactions.filter((t) => t.category === category)
  }

  getTransactionsByDateRange(startDate: string, endDate: string): Transaction[] {
    return this.transactions.filter((t) => {
      const txnDate = new Date(t.date)
      return txnDate >= new Date(startDate) && txnDate <= new Date(endDate)
    })
  }

  clear(): void {
    this.transactions = []
  }
}

describe('FinancialService - الخدمات المالية', () => {
  let service: FinancialService

  beforeEach(() => {
    service = new FinancialService()
  })

  describe('addTransaction - إضافة معاملة', () => {
    it('should add income transaction successfully', () => {
      const transaction = service.addTransaction({
        type: 'income',
        amount: 10000,
        currency: 'SAR',
        description: 'دفعة من العميل',
        date: '2025-01-15',
        category: 'revenue',
      })

      expect(transaction.id).toBeDefined()
      expect(transaction.type).toBe('income')
      expect(transaction.amount).toBe(10000)
    })

    it('should add expense transaction successfully', () => {
      const transaction = service.addTransaction({
        type: 'expense',
        amount: 5000,
        currency: 'SAR',
        description: 'شراء مواد',
        date: '2025-01-16',
        category: 'materials',
      })

      expect(transaction.id).toBeDefined()
      expect(transaction.type).toBe('expense')
      expect(transaction.amount).toBe(5000)
    })

    it('should generate unique IDs', () => {
      const txn1 = service.addTransaction({
        type: 'income',
        amount: 1000,
        currency: 'SAR',
        description: 'Test 1',
        date: '2025-01-01',
        category: 'test',
      })

      const txn2 = service.addTransaction({
        type: 'income',
        amount: 2000,
        currency: 'SAR',
        description: 'Test 2',
        date: '2025-01-02',
        category: 'test',
      })

      expect(txn1.id).not.toBe(txn2.id)
    })
  })

  describe('getTransactions - الحصول على المعاملات', () => {
    it('should return empty array initially', () => {
      const transactions = service.getTransactions()
      expect(transactions).toEqual([])
    })

    it('should return all transactions', () => {
      service.addTransaction({
        type: 'income',
        amount: 1000,
        currency: 'SAR',
        description: 'Test 1',
        date: '2025-01-01',
        category: 'test',
      })

      service.addTransaction({
        type: 'expense',
        amount: 500,
        currency: 'SAR',
        description: 'Test 2',
        date: '2025-01-02',
        category: 'test',
      })

      const transactions = service.getTransactions()
      expect(transactions).toHaveLength(2)
    })

    it('should return a copy of transactions', () => {
      service.addTransaction({
        type: 'income',
        amount: 1000,
        currency: 'SAR',
        description: 'Test',
        date: '2025-01-01',
        category: 'test',
      })

      const transactions1 = service.getTransactions()
      const transactions2 = service.getTransactions()

      expect(transactions1).not.toBe(transactions2)
      expect(transactions1).toEqual(transactions2)
    })
  })

  describe('getTransactionById - الحصول على معاملة بالمعرف', () => {
    it('should return transaction by ID', () => {
      const created = service.addTransaction({
        type: 'income',
        amount: 1000,
        currency: 'SAR',
        description: 'Test',
        date: '2025-01-01',
        category: 'test',
      })

      const found = service.getTransactionById(created.id)

      expect(found).toBeDefined()
      expect(found?.id).toBe(created.id)
    })

    it('should return null for non-existent ID', () => {
      const found = service.getTransactionById('non-existent')
      expect(found).toBeNull()
    })
  })

  describe('deleteTransaction - حذف معاملة', () => {
    it('should delete transaction successfully', () => {
      const created = service.addTransaction({
        type: 'income',
        amount: 1000,
        currency: 'SAR',
        description: 'Test',
        date: '2025-01-01',
        category: 'test',
      })

      const deleted = service.deleteTransaction(created.id)
      expect(deleted).toBe(true)

      const found = service.getTransactionById(created.id)
      expect(found).toBeNull()
    })

    it('should return false for non-existent transaction', () => {
      const deleted = service.deleteTransaction('non-existent')
      expect(deleted).toBe(false)
    })
  })

  describe('calculateSummary - حساب الملخص المالي', () => {
    beforeEach(() => {
      service.addTransaction({
        type: 'income',
        amount: 10000,
        currency: 'SAR',
        description: 'Revenue 1',
        date: '2025-01-01',
        category: 'revenue',
      })

      service.addTransaction({
        type: 'income',
        amount: 5000,
        currency: 'SAR',
        description: 'Revenue 2',
        date: '2025-01-02',
        category: 'revenue',
      })

      service.addTransaction({
        type: 'expense',
        amount: 3000,
        currency: 'SAR',
        description: 'Expense 1',
        date: '2025-01-03',
        category: 'materials',
      })

      service.addTransaction({
        type: 'expense',
        amount: 2000,
        currency: 'SAR',
        description: 'Expense 2',
        date: '2025-01-04',
        category: 'labor',
      })
    })

    it('should calculate total revenue correctly', () => {
      const summary = service.calculateSummary('SAR')
      expect(summary.totalRevenue).toBe(15000)
    })

    it('should calculate total expenses correctly', () => {
      const summary = service.calculateSummary('SAR')
      expect(summary.totalExpenses).toBe(5000)
    })

    it('should calculate net profit correctly', () => {
      const summary = service.calculateSummary('SAR')
      expect(summary.netProfit).toBe(10000)
    })

    it('should calculate profit margin correctly', () => {
      const summary = service.calculateSummary('SAR')
      expect(summary.profitMargin).toBeCloseTo(66.67, 1)
    })

    it('should filter by currency', () => {
      service.addTransaction({
        type: 'income',
        amount: 1000,
        currency: 'USD',
        description: 'USD Revenue',
        date: '2025-01-05',
        category: 'revenue',
      })

      const sarSummary = service.calculateSummary('SAR')
      const usdSummary = service.calculateSummary('USD')

      expect(sarSummary.totalRevenue).toBe(15000)
      expect(usdSummary.totalRevenue).toBe(1000)
    })

    it('should handle zero revenue', () => {
      service.clear()
      service.addTransaction({
        type: 'expense',
        amount: 1000,
        currency: 'SAR',
        description: 'Expense',
        date: '2025-01-01',
        category: 'test',
      })

      const summary = service.calculateSummary('SAR')
      expect(summary.profitMargin).toBe(0)
    })
  })

  describe('getTransactionsByCategory - الحصول على المعاملات حسب الفئة', () => {
    beforeEach(() => {
      service.addTransaction({
        type: 'expense',
        amount: 1000,
        currency: 'SAR',
        description: 'Materials 1',
        date: '2025-01-01',
        category: 'materials',
      })

      service.addTransaction({
        type: 'expense',
        amount: 2000,
        currency: 'SAR',
        description: 'Materials 2',
        date: '2025-01-02',
        category: 'materials',
      })

      service.addTransaction({
        type: 'expense',
        amount: 3000,
        currency: 'SAR',
        description: 'Labor 1',
        date: '2025-01-03',
        category: 'labor',
      })
    })

    it('should return transactions by category', () => {
      const materials = service.getTransactionsByCategory('materials')
      expect(materials).toHaveLength(2)
      expect(materials.every((t) => t.category === 'materials')).toBe(true)
    })

    it('should return empty array for non-existent category', () => {
      const results = service.getTransactionsByCategory('non-existent')
      expect(results).toEqual([])
    })
  })

  describe('getTransactionsByDateRange - الحصول على المعاملات حسب النطاق الزمني', () => {
    beforeEach(() => {
      service.addTransaction({
        type: 'income',
        amount: 1000,
        currency: 'SAR',
        description: 'Jan 1',
        date: '2025-01-01',
        category: 'revenue',
      })

      service.addTransaction({
        type: 'income',
        amount: 2000,
        currency: 'SAR',
        description: 'Jan 15',
        date: '2025-01-15',
        category: 'revenue',
      })

      service.addTransaction({
        type: 'income',
        amount: 3000,
        currency: 'SAR',
        description: 'Jan 31',
        date: '2025-01-31',
        category: 'revenue',
      })

      service.addTransaction({
        type: 'income',
        amount: 4000,
        currency: 'SAR',
        description: 'Feb 15',
        date: '2025-02-15',
        category: 'revenue',
      })
    })

    it('should return transactions within date range', () => {
      const results = service.getTransactionsByDateRange('2025-01-01', '2025-01-31')
      expect(results).toHaveLength(3)
    })

    it('should include start and end dates', () => {
      const results = service.getTransactionsByDateRange('2025-01-15', '2025-01-15')
      expect(results).toHaveLength(1)
      expect(results[0].description).toBe('Jan 15')
    })

    it('should return empty array for no matches', () => {
      const results = service.getTransactionsByDateRange('2025-03-01', '2025-03-31')
      expect(results).toEqual([])
    })
  })
})
