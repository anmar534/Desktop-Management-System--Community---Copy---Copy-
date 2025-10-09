import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateTenderProgress, updateTenderStatusBasedOnProgress } from '@/utils/tenderProgressCalculator'
import { FileUploadService } from '@/utils/fileUploadService'
import type { Tender } from '@/data/centralData'

vi.mock('@/utils/fileUploadService', () => ({
  FileUploadService: {
    getFilesByTender: vi.fn(() => [])
  }
}))

const mockedFileUploadService = vi.mocked(FileUploadService, true)

const baseTenderDefaults: Tender = {
  id: 't1',
  name: 'Tender 1',
  title: 'T1',
  client: 'Client',
  value: 0,
  totalValue: 0,
  documentPrice: null,
  bookletPrice: null,
  status: 'new',
  totalItems: 0,
  pricedItems: 0,
  itemsPriced: 0,
  technicalFilesUploaded: false,
  phase: 'preparation',
  deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
  daysLeft: 7,
  progress: 0,
  completionPercentage: 0,
  priority: 'medium',
  team: 'Team',
  manager: 'Manager',
  winChance: 0,
  competition: 'open',
  submissionDate: new Date().toISOString(),
  lastAction: 'none',
  lastUpdate: new Date().toISOString(),
  category: 'general',
  location: 'Riyadh',
  type: 'general',
}

const baseTender = (overrides: Partial<Tender> = {}): Tender => ({
  ...baseTenderDefaults,
  ...overrides,
})

describe('tenderProgressCalculator (central-first)', () => {
  beforeEach(() => {
    mockedFileUploadService.getFilesByTender.mockReturnValue([])
  })

  it('يحسب 90% عند تسعير 100% + ملفات فنية (غير مُرسل)', () => {
    const t = baseTender({ totalItems: 10, pricedItems: 10, technicalFilesUploaded: true, status: 'new' })
    const p = calculateTenderProgress(t)
    expect(p).toBe(90)
  })

  it('يحسب 100% عند تسعير 100% + ملفات فنية + حالة submitted', () => {
    const t = baseTender({ totalItems: 10, pricedItems: 10, technicalFilesUploaded: true, status: 'submitted' })
    const p = calculateTenderProgress(t)
    expect(p).toBe(100)
  })

  it('يحتسب الملفات الفنية عبر خدمة الملفات كبديل', () => {
    mockedFileUploadService.getFilesByTender.mockReturnValue([{ id: 'f1', name: 'file', type: 'pdf', size: 1, content: '', uploadDate: new Date().toISOString(), tenderId: 't1' }])
    const t = baseTender({ totalItems: 10, pricedItems: 10, technicalFilesUploaded: false, status: 'new' })
    const p = calculateTenderProgress(t)
    expect(p).toBe(90) // 70 للتسعير + 20 للملفات
  })

  it('يكون 0% بدون بيانات', () => {
    const t = baseTender({ totalItems: 0, pricedItems: 0, technicalFilesUploaded: false })
    const p = calculateTenderProgress(t)
    expect(p).toBe(0)
  })
})

describe('updateTenderStatusBasedOnProgress (central-first)', () => {
  beforeEach(() => {
    mockedFileUploadService.getFilesByTender.mockReturnValue([])
  })

  it('يعيد ready_to_submit عند 100% تسعير + ملفات فنية', () => {
    const t = baseTender({ totalItems: 5, pricedItems: 5, technicalFilesUploaded: true, status: 'new' })
    const s = updateTenderStatusBasedOnProgress(t)
    expect(s).toBe('ready_to_submit')
  })

  it('يعيد under_action عند وجود أي تقدم جزئي', () => {
    const t = baseTender({ totalItems: 5, pricedItems: 2, technicalFilesUploaded: false, status: 'new' })
    const s = updateTenderStatusBasedOnProgress(t)
    expect(s).toBe('under_action')
  })

  it('يعيد new بدون أي تقدم', () => {
    const t = baseTender({ totalItems: 0, pricedItems: 0, technicalFilesUploaded: false, status: 'new' })
    const s = updateTenderStatusBasedOnProgress(t)
    expect(s).toBe('new')
  })
})
