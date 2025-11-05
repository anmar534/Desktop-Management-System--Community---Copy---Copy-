/**
 * 👥 ClientDataService - خدمة إدارة بيانات العملاء
 *
 * المسؤوليات:
 * ✅ CRUD operations للعملاء
 * ✅ Load/Save من/إلى localStorage
 * ✅ Cache management
 *
 * Single Responsibility: إدارة بيانات العملاء فقط
 */

import { safeLocalStorage } from '@/shared/utils/storage/storage'
import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import type { Client } from '@/data/centralData'
import { APP_EVENTS, emit } from '@/events/bus'

/**
 * خدمة بيانات العملاء
 */
export class ClientDataService {
  private static instance: ClientDataService
  private clientCache = new Map<string, Client>()

  private constructor() {
    this.loadClients()
  }

  public static getInstance(): ClientDataService {
    if (!ClientDataService.instance) {
      ClientDataService.instance = new ClientDataService()
    }
    return ClientDataService.instance
  }

  // ===========================
  // 📊 Data Loading & Caching
  // ===========================

  /**
   * تحميل العملاء من localStorage
   */
  private loadClients(): void {
    try {
      const data = safeLocalStorage.getItem(STORAGE_KEYS.CLIENTS, '')
      if (data) {
        const clients = JSON.parse(data) as Client[]
        this.clientCache.clear()
        clients.forEach((client) => {
          this.clientCache.set(client.id, client)
        })
        console.log(`✅ تم تحميل ${clients.length} عميل من localStorage`)
      } else {
        console.log('ℹ️ لا يوجد عملاء محفوظين')
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل العملاء:', error)
    }
  }

  /**
   * حفظ العملاء إلى localStorage
   */
  private saveClients(): void {
    try {
      const clients = Array.from(this.clientCache.values())
      safeLocalStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients))
      emit(APP_EVENTS.CLIENTS_UPDATED)
    } catch (error) {
      console.error('❌ خطأ في حفظ العملاء:', error)
    }
  }

  // ===========================
  // 🔍 Read Operations
  // ===========================

  /**
   * الحصول على جميع العملاء
   */
  public getClients(): Client[] {
    return Array.from(this.clientCache.values())
  }

  /**
   * الحصول على عميل بواسطة ID
   */
  public getClientById(id: string): Client | null {
    return this.clientCache.get(id) ?? null
  }

  /**
   * البحث في العملاء
   */
  public searchClients(query: string): Client[] {
    const lowerQuery = query.toLowerCase()
    return this.getClients().filter(
      (c) =>
        c.name?.toLowerCase().includes(lowerQuery) ||
        c.email?.toLowerCase().includes(lowerQuery) ||
        c.phone?.toLowerCase().includes(lowerQuery),
    )
  }

  // ===========================
  // ✏️ Write Operations
  // ===========================

  /**
   * إنشاء عميل جديد
   */
  public createClient(clientData: Omit<Client, 'id'>): Client {
    const newClient: Client = {
      ...clientData,
      id: `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }

    this.clientCache.set(newClient.id, newClient)
    this.saveClients()

    console.log(`✅ تم إنشاء عميل جديد: ${newClient.name}`)
    return newClient
  }

  /**
   * تحديث عميل موجود
   */
  public updateClient(id: string, updates: Partial<Client>): Client | null {
    const existing = this.clientCache.get(id)
    if (!existing) return null

    const updated = { ...existing, ...updates }
    this.clientCache.set(id, updated)
    this.saveClients()

    console.log(`🔄 تم تحديث العميل: ${existing.name}`)
    return updated
  }

  /**
   * حذف عميل
   */
  public deleteClient(id: string): boolean {
    const deleted = this.clientCache.delete(id)
    if (deleted) {
      this.saveClients()
      console.log(`🗑️ تم حذف العميل: ${id}`)
    }
    return deleted
  }

  // ===========================
  // 🔄 Utility Operations
  // ===========================

  /**
   * إعادة تحميل العملاء من localStorage
   */
  public reloadClients(): void {
    this.loadClients()
    emit(APP_EVENTS.CLIENTS_UPDATED)
  }

  /**
   * مسح جميع العملاء (للتطوير/الاختبار فقط)
   */
  public clearAllClients(): void {
    this.clientCache.clear()
    this.saveClients()
    console.log('🗑️ تم مسح جميع العملاء')
  }

  /**
   * استيراد عملاء (bulk import)
   */
  public importClients(clients: Client[], options: { replace?: boolean } = {}): void {
    if (options.replace) {
      this.clientCache.clear()
    }

    clients.forEach((client) => {
      this.clientCache.set(client.id, client)
    })

    this.saveClients()
    console.log(`✅ تم استيراد ${clients.length} عميل`)
  }

  /**
   * الحصول على إحصائيات العملاء
   */
  public getClientStats() {
    const clients = this.getClients()
    const total = clients.length
    const active = clients.filter((c) => c.status === 'active').length
    const inactive = clients.filter((c) => c.status === 'inactive').length

    return {
      total,
      active,
      inactive,
    }
  }
}

// Export singleton instance
export const clientDataService = ClientDataService.getInstance()
