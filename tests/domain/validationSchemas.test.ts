import { describe, it, expect } from 'vitest'
import {
  sanitizeBankAccountCollection,
  sanitizeProjectCollection,
  sanitizeTenderCollection,
  validateBankAccount,
  validateBankAccountPayload,
  validateBankAccountUpdate,
  validateProject,
  validateProjectPayload,
  validateProjectUpdate,
  validateTender,
  validateTenderPayload,
  validateTenderUpdate,
  ValidationError
} from '@/domain/validation'
import type { Project, Tender, BankAccount } from '@/data/centralData'

const iso = () => new Date().toISOString()

const sampleProject = (): Omit<Project, 'id'> => ({
  name: '  مشروع الاختبار ',
  client: 'عميل',
  status: 'planning',
  priority: 'high',
  progress: '75' as unknown as number,
  contractValue: '100000' as unknown as number,
  estimatedCost: '80000' as unknown as number,
  actualCost: '50000' as unknown as number,
  spent: '40000' as unknown as number,
  remaining: '60000' as unknown as number,
  expectedProfit: '-20000' as unknown as number,
  startDate: iso(),
  endDate: iso(),
  manager: 'مدير',
  team: 'الفريق أ',
  location: 'الرياض',
  phase: 'التخطيط',
  health: 'green',
  lastUpdate: iso(),
  category: 'إنشاءات',
  efficiency: '90' as unknown as number,
  riskLevel: 'low',
  budget: '100000' as unknown as number,
  value: '100000' as unknown as number,
  type: 'إنشاء'
})

const sampleTender = (): Omit<Tender, 'id'> => ({
  name: 'منافسة 1',
  title: 'مشروع حكومي',
  client: 'وزارة',
  value: '500000' as unknown as number,
  totalValue: '500000' as unknown as number,
  documentPrice: '150' as unknown as number,
  bookletPrice: null,
  status: 'submitted',
  totalItems: 10,
  pricedItems: 5,
  itemsPriced: 5,
  technicalFilesUploaded: true,
  phase: 'التقديم',
  deadline: iso(),
  daysLeft: '-5' as unknown as number,
  progress: '60' as unknown as number,
  completionPercentage: '60' as unknown as number,
  priority: 'medium',
  team: 'فريق المناقصات',
  manager: 'مدير المناقصات',
  winChance: '55' as unknown as number,
  competition: 'منافسة عامة',
  submissionDate: iso(),
  lastAction: 'تم الإرسال',
  lastUpdate: iso(),
  category: 'حكومي',
  location: 'جدة',
  type: 'تشغيل',
  resultNotes: undefined,
  winningBidValue: undefined,
  ourBidValue: undefined,
  winDate: undefined,
  lostDate: undefined,
  resultDate: undefined,
  cancelledDate: undefined
})

const sampleBankAccount = (): Omit<BankAccount, 'id'> => ({
  accountName: 'الحساب الرئيسي',
  bankName: 'بنك الرياض',
  accountNumber: '1234567890',
  iban: 'SA12345678901234567890',
  accountType: 'current',
  currentBalance: '10000' as unknown as number,
  currency: 'SAR',
  isActive: true,
  lastTransactionDate: iso(),
  monthlyInflow: '25000' as unknown as number,
  monthlyOutflow: '15000' as unknown as number
})

describe('domain validation schemas', () => {
  it('normalizes project payloads and coerces numeric inputs', () => {
    const payload = validateProjectPayload(sampleProject())
    const project = validateProject({ ...payload, id: 'project-1' })

    expect(project.name).toBe('مشروع الاختبار')
    expect(project.contractValue).toBe(100000)
    expect(project.remaining).toBe(60000)
    expect(project.progress).toBe(75)
    expect(project.expectedProfit).toBe(-20000)
  })

  it('sanitizes project updates and collection entries', () => {
    const base = validateProject({ ...sampleProject(), id: 'p-1' })
    const updates = validateProjectUpdate({
      progress: '100' as unknown as number,
      remaining: '-5000' as unknown as number
    })
    const merged = validateProject({ ...base, ...updates })

    expect(merged.progress).toBe(100)
    expect(merged.remaining).toBe(-5000)

    const invalid = { ...base, status: 'invalid' } as unknown as Project
  const sanitized = sanitizeProjectCollection([base, invalid])
  expect(sanitized).toHaveLength(1)
  expect(sanitized[0].id).toBe('p-1')
  })

  it('normalizes tender payloads and updates', () => {
    const payload = validateTenderPayload(sampleTender())
    const tender = validateTender({ ...payload, id: 'tender-1' })

    expect(tender.value).toBe(500000)
    expect(tender.documentPrice).toBe(150)
    expect(tender.daysLeft).toBe(-5)

    const updates = validateTenderUpdate({ winChance: '80' as unknown as number })
    const updated = validateTender({ ...tender, ...updates })
    expect(updated.winChance).toBe(80)
  })

  it('filters invalid tenders during sanitization', () => {
    const valid = validateTender({ ...sampleTender(), id: 't-ok' })
    const invalid = { ...valid, status: 'unknown' } as unknown as Tender

    const sanitized = sanitizeTenderCollection([valid, invalid])
    expect(sanitized).toHaveLength(1)
    expect(sanitized[0].id).toBe('t-ok')
  })

  it('normalizes bank account payloads and updates', () => {
    const payload = validateBankAccountPayload(sampleBankAccount())
    const account = validateBankAccount({ ...payload, id: 'acc-1' })

    expect(account.currentBalance).toBe(10000)
    expect(account.monthlyOutflow).toBe(15000)

    const updates = validateBankAccountUpdate({ monthlyOutflow: '17500' as unknown as number })
    const updated = validateBankAccount({ ...account, ...updates })
    expect(updated.monthlyOutflow).toBe(17500)
  })

  it('drops invalid bank accounts when sanitizing collections', () => {
    const valid = validateBankAccount({ ...sampleBankAccount(), id: 'acc-ok' })
    const invalid = { ...valid, accountType: 'invalid' } as unknown as BankAccount

    const sanitized = sanitizeBankAccountCollection([valid, invalid])
    expect(sanitized).toHaveLength(1)
    expect(sanitized[0].id).toBe('acc-ok')
  })

  it('provides useful error details for invalid payloads', () => {
    expect(() => validateProjectPayload({ ...sampleProject(), status: 'wrong' as Project['status'] })).toThrowError(ValidationError)
    expect(() => validateTenderPayload({ ...sampleTender(), priority: 'super' as Tender['priority'] })).toThrowError(ValidationError)
    expect(() => validateBankAccountPayload({ ...sampleBankAccount(), currency: '' })).toThrowError(ValidationError)
  })
})
