import type { Tender } from '../data/centralData'

/**
 * Pagination options for listing tenders
 */
export interface PaginationOptions {
  page: number
  pageSize: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

export interface ITenderRepository {
  getAll(): Promise<Tender[]>
  getById(id: string): Promise<Tender | null>
  getByProjectId?(projectId: string): Promise<Tender | null>
  getPage(options: PaginationOptions): Promise<PaginatedResult<Tender>>
  create(data: Omit<Tender, 'id'>): Promise<Tender>
  update(id: string, updates: Partial<Tender>): Promise<Tender | null>
  delete(id: string): Promise<boolean>
  search(query: string): Promise<Tender[]>
}
