import type { IFinancialReportRepository } from '@/repository/financialReport.repository'
import type { FinancialReport } from '@/data/centralData'
import { safeLocalStorage } from '@/shared/utils/storage/storage'
import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import { APP_EVENTS, emit } from '@/events/bus'

const generateId = () => `financial_report_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

const normalizeReport = (
  report: Partial<FinancialReport> & Pick<FinancialReport, 'id'>,
): FinancialReport => ({
  id: report.id,
  name: report.name ?? '',
  type: report.type ?? 'custom',
  description: report.description ?? '',
  status: report.status ?? 'pending',
  createdAt: report.createdAt ?? new Date().toISOString(),
  completedAt:
    report.status === 'completed'
      ? (report.completedAt ?? new Date().toISOString())
      : report.completedAt,
  format: report.format ?? 'pdf',
  size: report.size !== undefined ? Number(report.size) : undefined,
  url: report.url,
  frequency: report.frequency,
  dataSources: Array.isArray(report.dataSources) ? [...report.dataSources] : [],
  recipients: report.recipients,
  autoGenerate: report.autoGenerate ?? false,
})

const loadAll = (): FinancialReport[] => {
  const stored = safeLocalStorage.getItem<FinancialReport[]>(STORAGE_KEYS.FINANCIAL_REPORTS, [])
  return Array.isArray(stored)
    ? stored.map((report) => normalizeReport({ ...report, id: report.id ?? generateId() }))
    : []
}

const persist = (reports: FinancialReport[]): void => {
  safeLocalStorage.setItem(STORAGE_KEYS.FINANCIAL_REPORTS, reports)
}

const emitUpdate = () => emit(APP_EVENTS.FINANCIAL_REPORTS_UPDATED)

export class LocalFinancialReportRepository implements IFinancialReportRepository {
  async getAll(): Promise<FinancialReport[]> {
    return loadAll()
  }

  async getById(id: string): Promise<FinancialReport | null> {
    const reports = loadAll()
    const report = reports.find((item) => item.id === id)
    return report ? normalizeReport(report) : null
  }

  async create(
    report: Omit<FinancialReport, 'id'> & Partial<Pick<FinancialReport, 'id'>>,
  ): Promise<FinancialReport> {
    const reports = loadAll()
    const record = normalizeReport({ ...report, id: report.id ?? generateId() })
    reports.push(record)
    persist(reports)
    emitUpdate()
    return record
  }

  async upsert(report: FinancialReport): Promise<FinancialReport> {
    const reports = loadAll()
    const index = reports.findIndex((item) => item.id === report.id)
    const normalized = normalizeReport({ ...report, id: report.id ?? generateId() })

    if (index >= 0) {
      reports[index] = normalized
    } else {
      reports.push(normalized)
    }

    persist(reports)
    emitUpdate()
    return normalized
  }

  async update(id: string, updates: Partial<FinancialReport>): Promise<FinancialReport | null> {
    const reports = loadAll()
    const index = reports.findIndex((item) => item.id === id)

    if (index === -1) {
      return null
    }

    const merged = normalizeReport({ ...reports[index], ...updates, id })
    reports[index] = merged
    persist(reports)
    emitUpdate()
    return merged
  }

  async delete(id: string): Promise<boolean> {
    const reports = loadAll()
    const filtered = reports.filter((item) => item.id !== id)
    if (filtered.length === reports.length) {
      return false
    }
    persist(filtered)
    emitUpdate()
    return true
  }

  async importMany(
    reports: FinancialReport[],
    options: { replace?: boolean } = {},
  ): Promise<FinancialReport[]> {
    const shouldReplace = options.replace ?? true
    const current = shouldReplace ? [] : loadAll()

    for (const report of reports) {
      const normalized = normalizeReport({ ...report, id: report.id ?? generateId() })
      const index = current.findIndex((item) => item.id === normalized.id)
      if (index >= 0) {
        current[index] = normalized
      } else {
        current.push(normalized)
      }
    }

    persist(current)
    emitUpdate()
    return current
  }

  async reload(): Promise<FinancialReport[]> {
    const reports = loadAll()
    emitUpdate()
    return reports
  }
}

export const financialReportRepository = new LocalFinancialReportRepository()
