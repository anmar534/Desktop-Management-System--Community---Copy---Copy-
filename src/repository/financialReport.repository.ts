import type { FinancialReport } from '@/data/centralData'

export interface IFinancialReportRepository {
  getAll(): Promise<FinancialReport[]>
  getById(id: string): Promise<FinancialReport | null>
  create(report: Omit<FinancialReport, 'id'> & Partial<Pick<FinancialReport, 'id'>>): Promise<FinancialReport>
  upsert(report: FinancialReport): Promise<FinancialReport>
  update(id: string, updates: Partial<FinancialReport>): Promise<FinancialReport | null>
  delete(id: string): Promise<boolean>
  importMany(reports: FinancialReport[], options?: { replace?: boolean }): Promise<FinancialReport[]>
  reload(): Promise<FinancialReport[]>
}
