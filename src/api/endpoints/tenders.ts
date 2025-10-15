/**
 * Tenders API Endpoints
 * Sprint 5.3: تطوير APIs للتكامل الخارجي
 */

import { apiClient } from '../client'
import type { ApiResponse, PaginatedRequest, FilteredRequest } from '../types'

// ============================================================================
// Types
// ============================================================================

export interface Tender {
  id: string
  referenceNumber: string
  title: string
  titleEn?: string
  description?: string
  client: string
  status: TenderStatus
  submissionDate: string
  openingDate?: string
  budget?: number
  estimatedValue?: number
  currency: string
  createdAt: string
  updatedAt: string
}

export type TenderStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'awarded'
  | 'lost'
  | 'cancelled'

export interface TenderPricing {
  tenderId: string
  totalCost: number
  totalPrice: number
  profit: number
  profitMargin: number
  vat: number
  finalPrice: number
  currency: string
  breakdown: PricingBreakdown[]
}

export interface PricingBreakdown {
  category: string
  categoryAr: string
  cost: number
  price: number
  quantity: number
  unit: string
}

export interface TenderBOQ {
  tenderId: string
  items: BOQItem[]
  totalQuantity: number
  totalCost: number
  totalPrice: number
  currency: string
}

export interface BOQItem {
  id: string
  itemNumber: string
  description: string
  descriptionAr?: string
  unit: string
  quantity: number
  unitPrice: number
  totalPrice: number
  category?: string
}

export interface CreateTenderRequest {
  referenceNumber: string
  title: string
  titleEn?: string
  description?: string
  client: string
  submissionDate: string
  openingDate?: string
  budget?: number
  currency?: string
}

export interface UpdateTenderRequest extends Partial<CreateTenderRequest> {
  status?: TenderStatus
}

export interface TenderListResponse {
  tenders: Tender[]
  total: number
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get all tenders
 * الحصول على جميع المنافسات
 */
export async function getTenders(
  params?: PaginatedRequest & FilteredRequest
): Promise<ApiResponse<TenderListResponse>> {
  return apiClient.get<TenderListResponse>('/tenders', { query: params as Record<string, string | number | boolean> })
}

/**
 * Get tender by ID
 * الحصول على منافسة محددة
 */
export async function getTenderById(id: string): Promise<ApiResponse<Tender>> {
  return apiClient.get<Tender>(`/tenders/${id}`)
}

/**
 * Create new tender
 * إنشاء منافسة جديدة
 */
export async function createTender(
  data: CreateTenderRequest
): Promise<ApiResponse<Tender>> {
  return apiClient.post<Tender>('/tenders', data)
}

/**
 * Update tender
 * تحديث منافسة
 */
export async function updateTender(
  id: string,
  data: UpdateTenderRequest
): Promise<ApiResponse<Tender>> {
  return apiClient.put<Tender>(`/tenders/${id}`, data)
}

/**
 * Delete tender
 * حذف منافسة
 */
export async function deleteTender(id: string): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`/tenders/${id}`)
}

/**
 * Get tender pricing
 * الحصول على تسعير المنافسة
 */
export async function getTenderPricing(
  id: string
): Promise<ApiResponse<TenderPricing>> {
  return apiClient.get<TenderPricing>(`/tenders/${id}/pricing`)
}

/**
 * Get tender BOQ
 * الحصول على جدول الكميات
 */
export async function getTenderBOQ(id: string): Promise<ApiResponse<TenderBOQ>> {
  return apiClient.get<TenderBOQ>(`/tenders/${id}/boq`)
}

/**
 * Update tender status
 * تحديث حالة المنافسة
 */
export async function updateTenderStatus(
  id: string,
  status: TenderStatus
): Promise<ApiResponse<Tender>> {
  return apiClient.patch<Tender>(`/tenders/${id}`, { status })
}

/**
 * Get tenders by status
 * الحصول على المنافسات حسب الحالة
 */
export async function getTendersByStatus(
  status: TenderStatus,
  params?: PaginatedRequest
): Promise<ApiResponse<TenderListResponse>> {
  return apiClient.get<TenderListResponse>('/tenders', {
    query: { ...params, filters: { status } } as Record<string, string | number | boolean>,
  })
}

/**
 * Get tenders by client
 * الحصول على المنافسات حسب العميل
 */
export async function getTendersByClient(
  client: string,
  params?: PaginatedRequest
): Promise<ApiResponse<TenderListResponse>> {
  return apiClient.get<TenderListResponse>('/tenders', {
    query: { ...params, filters: { client } } as Record<string, string | number | boolean>,
  })
}

/**
 * Search tenders
 * البحث في المنافسات
 */
export async function searchTenders(
  searchTerm: string,
  params?: PaginatedRequest
): Promise<ApiResponse<TenderListResponse>> {
  return apiClient.get<TenderListResponse>('/tenders', {
    query: { ...params, search: searchTerm } as Record<string, string | number | boolean>,
  })
}

/**
 * Get tender statistics
 * الحصول على إحصائيات المنافسات
 */
export async function getTenderStatistics(): Promise<ApiResponse<TenderStatistics>> {
  return apiClient.get<TenderStatistics>('/tenders/statistics')
}

export interface TenderStatistics {
  total: number
  byStatus: Record<TenderStatus, number>
  totalValue: number
  averageValue: number
  winRate: number
  currency: string
}

/**
 * Export tenders
 * تصدير المنافسات
 */
export async function exportTenders(
  format: 'csv' | 'xlsx' | 'pdf',
  params?: FilteredRequest
): Promise<ApiResponse<{ url: string; filename: string }>> {
  return apiClient.post<{ url: string; filename: string }>('/tenders/export', {
    format,
    ...params,
  })
}

/**
 * Duplicate tender
 * نسخ منافسة
 */
export async function duplicateTender(
  id: string,
  newReferenceNumber: string
): Promise<ApiResponse<Tender>> {
  return apiClient.post<Tender>(`/tenders/${id}/duplicate`, {
    referenceNumber: newReferenceNumber,
  })
}

/**
 * Archive tender
 * أرشفة منافسة
 */
export async function archiveTender(id: string): Promise<ApiResponse<Tender>> {
  return apiClient.post<Tender>(`/tenders/${id}/archive`)
}

/**
 * Restore tender
 * استعادة منافسة
 */
export async function restoreTender(id: string): Promise<ApiResponse<Tender>> {
  return apiClient.post<Tender>(`/tenders/${id}/restore`)
}

