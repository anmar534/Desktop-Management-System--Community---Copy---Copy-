/**
 * Procurement API Endpoints
 * Sprint 5.3: تطوير APIs للتكامل الخارجي
 */

import { apiClient } from '../client'
import type { ApiResponse, PaginatedRequest, FilteredRequest } from '../types'

// ============================================================================
// Types
// ============================================================================

export interface PurchaseOrder {
  id: string
  orderNumber: string
  supplierId: string
  projectId?: string
  status: PurchaseOrderStatus
  orderDate: string
  deliveryDate?: string
  totalAmount: number
  vat: number
  finalAmount: number
  currency: string
  items: PurchaseOrderItem[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export type PurchaseOrderStatus = 
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sent'
  | 'partially_received'
  | 'received'
  | 'cancelled'

export interface PurchaseOrderItem {
  id: string
  itemName: string
  itemNameAr?: string
  description?: string
  quantity: number
  unitPrice: number
  amount: number
  receivedQuantity: number
  unit: string
}

export interface Supplier {
  id: string
  code: string
  name: string
  nameEn?: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  taxNumber?: string
  paymentTerms?: string
  rating?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface InventoryItem {
  id: string
  code: string
  name: string
  nameEn?: string
  description?: string
  category: string
  unit: string
  quantity: number
  minQuantity: number
  maxQuantity: number
  unitCost: number
  totalValue: number
  location?: string
  lastRestockDate?: string
  createdAt: string
  updatedAt: string
}

export interface InventoryMovement {
  id: string
  itemId: string
  type: MovementType
  quantity: number
  unitCost: number
  totalCost: number
  reference?: string
  referenceType?: 'purchase_order' | 'project' | 'adjustment'
  notes?: string
  createdAt: string
  createdBy: string
}

export type MovementType = 'in' | 'out' | 'adjustment' | 'transfer'

// ============================================================================
// Purchase Order API Functions
// ============================================================================

export async function getPurchaseOrders(
  params?: PaginatedRequest & FilteredRequest
): Promise<ApiResponse<{ orders: PurchaseOrder[]; total: number }>> {
  return apiClient.get('/procurement/orders', { query: params as Record<string, string | number | boolean> })
}

export async function getPurchaseOrderById(id: string): Promise<ApiResponse<PurchaseOrder>> {
  return apiClient.get(`/procurement/orders/${id}`)
}

export async function createPurchaseOrder(
  data: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ApiResponse<PurchaseOrder>> {
  return apiClient.post('/procurement/orders', data)
}

export async function updatePurchaseOrder(
  id: string,
  data: Partial<PurchaseOrder>
): Promise<ApiResponse<PurchaseOrder>> {
  return apiClient.put(`/procurement/orders/${id}`, data)
}

export async function deletePurchaseOrder(id: string): Promise<ApiResponse<void>> {
  return apiClient.delete(`/procurement/orders/${id}`)
}

export async function approvePurchaseOrder(id: string): Promise<ApiResponse<PurchaseOrder>> {
  return apiClient.post(`/procurement/orders/${id}/approve`)
}

export async function receivePurchaseOrder(
  id: string,
  items: Array<{ itemId: string; receivedQuantity: number }>
): Promise<ApiResponse<PurchaseOrder>> {
  return apiClient.post(`/procurement/orders/${id}/receive`, { items })
}

// ============================================================================
// Supplier API Functions
// ============================================================================

export async function getSuppliers(
  params?: PaginatedRequest & FilteredRequest
): Promise<ApiResponse<{ suppliers: Supplier[]; total: number }>> {
  return apiClient.get('/procurement/suppliers', { query: params as Record<string, string | number | boolean> })
}

export async function getSupplierById(id: string): Promise<ApiResponse<Supplier>> {
  return apiClient.get(`/procurement/suppliers/${id}`)
}

export async function createSupplier(
  data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ApiResponse<Supplier>> {
  return apiClient.post('/procurement/suppliers', data)
}

export async function updateSupplier(
  id: string,
  data: Partial<Supplier>
): Promise<ApiResponse<Supplier>> {
  return apiClient.put(`/procurement/suppliers/${id}`, data)
}

export async function deleteSupplier(id: string): Promise<ApiResponse<void>> {
  return apiClient.delete(`/procurement/suppliers/${id}`)
}

export async function getSupplierPerformance(
  id: string
): Promise<ApiResponse<SupplierPerformance>> {
  return apiClient.get(`/procurement/suppliers/${id}/performance`)
}

export interface SupplierPerformance {
  supplierId: string
  totalOrders: number
  totalValue: number
  onTimeDeliveryRate: number
  qualityRating: number
  averageLeadTime: number
  lastOrderDate?: string
}

// ============================================================================
// Inventory API Functions
// ============================================================================

export async function getInventoryItems(
  params?: PaginatedRequest & FilteredRequest
): Promise<ApiResponse<{ items: InventoryItem[]; total: number }>> {
  return apiClient.get('/procurement/inventory', { query: params as Record<string, string | number | boolean> })
}

export async function getInventoryItemById(id: string): Promise<ApiResponse<InventoryItem>> {
  return apiClient.get(`/procurement/inventory/${id}`)
}

export async function createInventoryItem(
  data: Omit<InventoryItem, 'id' | 'totalValue' | 'createdAt' | 'updatedAt'>
): Promise<ApiResponse<InventoryItem>> {
  return apiClient.post('/procurement/inventory', data)
}

export async function updateInventoryItem(
  id: string,
  data: Partial<InventoryItem>
): Promise<ApiResponse<InventoryItem>> {
  return apiClient.put(`/procurement/inventory/${id}`, data)
}

export async function deleteInventoryItem(id: string): Promise<ApiResponse<void>> {
  return apiClient.delete(`/procurement/inventory/${id}`)
}

export async function getInventoryMovements(
  itemId: string,
  params?: PaginatedRequest
): Promise<ApiResponse<{ movements: InventoryMovement[]; total: number }>> {
  return apiClient.get(`/procurement/inventory/${itemId}/movements`, {
    query: params as Record<string, string | number | boolean>,
  })
}

export async function createInventoryMovement(
  data: Omit<InventoryMovement, 'id' | 'createdAt'>
): Promise<ApiResponse<InventoryMovement>> {
  return apiClient.post('/procurement/inventory/movements', data)
}

export async function getLowStockItems(): Promise<ApiResponse<InventoryItem[]>> {
  return apiClient.get('/procurement/inventory/low-stock')
}

export async function getInventoryValuation(): Promise<ApiResponse<InventoryValuation>> {
  return apiClient.get('/procurement/inventory/valuation')
}

export interface InventoryValuation {
  totalItems: number
  totalQuantity: number
  totalValue: number
  byCategory: Array<{
    category: string
    items: number
    quantity: number
    value: number
  }>
}

// ============================================================================
// Procurement Analytics
// ============================================================================

export async function getProcurementSummary(): Promise<ApiResponse<ProcurementSummary>> {
  return apiClient.get('/procurement/summary')
}

export interface ProcurementSummary {
  totalOrders: number
  totalValue: number
  pendingOrders: number
  activeSuppliers: number
  inventoryValue: number
  lowStockItems: number
  currency: string
}

export async function getSpendAnalysis(
  startDate: string,
  endDate: string
): Promise<ApiResponse<SpendAnalysis>> {
  return apiClient.get('/procurement/spend-analysis', {
    query: { startDate, endDate },
  })
}

export interface SpendAnalysis {
  period: { startDate: string; endDate: string }
  totalSpend: number
  bySupplier: Array<{
    supplierId: string
    supplierName: string
    amount: number
    percentage: number
  }>
  byCategory: Array<{
    category: string
    amount: number
    percentage: number
  }>
  byProject: Array<{
    projectId: string
    projectName: string
    amount: number
    percentage: number
  }>
}

export async function getSupplierComparison(
  itemCategory: string
): Promise<ApiResponse<SupplierComparison[]>> {
  return apiClient.get('/procurement/supplier-comparison', {
    query: { category: itemCategory },
  })
}

export interface SupplierComparison {
  supplierId: string
  supplierName: string
  averagePrice: number
  deliveryTime: number
  qualityRating: number
  totalOrders: number
}

