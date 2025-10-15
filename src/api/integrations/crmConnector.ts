/**
 * CRM System Integration Connector
 * Sprint 5.3.5: تكامل مع أنظمة HR و CRM
 */

import type { ExternalIntegration, IntegrationConfig, WebhookPayload } from '../types'
import { apiClient } from '../client'

// ============================================================================
// Types
// ============================================================================

export interface CRMSystem {
  id: string
  name: string
  type: CRMSystemType
  version: string
  config: IntegrationConfig
  isActive: boolean
}

export type CRMSystemType = 
  | 'salesforce'
  | 'hubspot'
  | 'zoho_crm'
  | 'pipedrive'
  | 'freshsales'
  | 'custom'

export interface CRMContact {
  id: string
  firstName: string
  lastName: string
  fullName: string
  fullNameAr?: string
  email: string
  phone?: string
  mobile?: string
  company?: string
  position?: string
  positionAr?: string
  source?: string
  status: ContactStatus
  tags?: string[]
  customFields?: Record<string, unknown>
  createdAt: string
  updatedAt: string
  syncedAt?: string
}

export type ContactStatus = 'lead' | 'prospect' | 'customer' | 'inactive'

export interface CRMCompany {
  id: string
  name: string
  nameAr?: string
  industry?: string
  size?: string
  website?: string
  phone?: string
  email?: string
  address?: string
  taxNumber?: string
  status: CompanyStatus
  contacts?: CRMContact[]
  customFields?: Record<string, unknown>
  createdAt: string
  updatedAt: string
  syncedAt?: string
}

export type CompanyStatus = 'active' | 'inactive' | 'prospect'

export interface CRMDeal {
  id: string
  name: string
  nameAr?: string
  contactId?: string
  companyId?: string
  value: number
  currency: string
  stage: DealStage
  probability: number
  expectedCloseDate?: string
  actualCloseDate?: string
  status: DealStatus
  notes?: string
  customFields?: Record<string, unknown>
  createdAt: string
  updatedAt: string
  syncedAt?: string
}

export type DealStage = 
  | 'qualification'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'

export type DealStatus = 'open' | 'won' | 'lost' | 'abandoned'

export interface CRMActivity {
  id: string
  type: ActivityType
  subject: string
  description?: string
  contactId?: string
  companyId?: string
  dealId?: string
  dueDate?: string
  completedAt?: string
  status: ActivityStatus
  assignedTo?: string
  createdAt: string
}

export type ActivityType = 
  | 'call'
  | 'email'
  | 'meeting'
  | 'task'
  | 'note'

export type ActivityStatus = 'pending' | 'completed' | 'cancelled'

// ============================================================================
// CRM Connector Class
// ============================================================================

export class CRMConnector {
  private integration: ExternalIntegration | null = null

  /**
   * Initialize connection to CRM system
   * تهيئة الاتصال بنظام CRM
   */
  async connect(config: IntegrationConfig): Promise<boolean> {
    try {
      const response = await apiClient.post<ExternalIntegration>(
        '/integrations/crm/connect',
        config
      )

      if (response.success && response.data) {
        this.integration = response.data
        return true
      }

      return false
    } catch (error) {
      console.error('Failed to connect to CRM system:', error)
      return false
    }
  }

  /**
   * Disconnect from CRM system
   * قطع الاتصال بنظام CRM
   */
  async disconnect(): Promise<void> {
    if (this.integration) {
      await apiClient.post(`/integrations/crm/${this.integration.id}/disconnect`)
      this.integration = null
    }
  }

  // ==========================================================================
  // Contacts
  // ==========================================================================

  /**
   * Sync contacts from CRM system
   * مزامنة جهات الاتصال من نظام CRM
   */
  async syncContacts(): Promise<{ contacts: CRMContact[]; syncedAt: string }> {
    if (!this.integration) {
      throw new Error('Not connected to CRM system')
    }

    const response = await apiClient.post<{ contacts: CRMContact[]; syncedAt: string }>(
      `/integrations/crm/${this.integration.id}/contacts/sync`
    )

    if (response.success && response.data) {
      return response.data
    }

    return {
      contacts: [],
      syncedAt: new Date().toISOString(),
    }
  }

  /**
   * Get contact by ID
   * الحصول على جهة اتصال محددة
   */
  async getContact(contactId: string): Promise<CRMContact | null> {
    if (!this.integration) {
      throw new Error('Not connected to CRM system')
    }

    const response = await apiClient.get<CRMContact>(
      `/integrations/crm/${this.integration.id}/contacts/${contactId}`
    )

    return response.success && response.data ? response.data : null
  }

  /**
   * Get all contacts
   * الحصول على جميع جهات الاتصال
   */
  async getContacts(filters?: {
    status?: ContactStatus
    company?: string
  }): Promise<CRMContact[]> {
    if (!this.integration) {
      throw new Error('Not connected to CRM system')
    }

    const response = await apiClient.get<CRMContact[]>(
      `/integrations/crm/${this.integration.id}/contacts`,
      { query: filters as Record<string, string> }
    )

    return response.success && response.data ? response.data : []
  }

  /**
   * Create contact in CRM
   * إنشاء جهة اتصال في CRM
   */
  async createContact(contact: Omit<CRMContact, 'id' | 'createdAt' | 'updatedAt' | 'syncedAt'>): Promise<CRMContact | null> {
    if (!this.integration) {
      throw new Error('Not connected to CRM system')
    }

    const response = await apiClient.post<CRMContact>(
      `/integrations/crm/${this.integration.id}/contacts`,
      contact
    )

    return response.success && response.data ? response.data : null
  }

  /**
   * Update contact in CRM
   * تحديث جهة اتصال في CRM
   */
  async updateContact(contactId: string, updates: Partial<CRMContact>): Promise<CRMContact | null> {
    if (!this.integration) {
      throw new Error('Not connected to CRM system')
    }

    const response = await apiClient.put<CRMContact>(
      `/integrations/crm/${this.integration.id}/contacts/${contactId}`,
      updates
    )

    return response.success && response.data ? response.data : null
  }

  // ==========================================================================
  // Companies
  // ==========================================================================

  /**
   * Sync companies from CRM system
   * مزامنة الشركات من نظام CRM
   */
  async syncCompanies(): Promise<{ companies: CRMCompany[]; syncedAt: string }> {
    if (!this.integration) {
      throw new Error('Not connected to CRM system')
    }

    const response = await apiClient.post<{ companies: CRMCompany[]; syncedAt: string }>(
      `/integrations/crm/${this.integration.id}/companies/sync`
    )

    if (response.success && response.data) {
      return response.data
    }

    return {
      companies: [],
      syncedAt: new Date().toISOString(),
    }
  }

  /**
   * Get all companies
   * الحصول على جميع الشركات
   */
  async getCompanies(filters?: {
    status?: CompanyStatus
    industry?: string
  }): Promise<CRMCompany[]> {
    if (!this.integration) {
      throw new Error('Not connected to CRM system')
    }

    const response = await apiClient.get<CRMCompany[]>(
      `/integrations/crm/${this.integration.id}/companies`,
      { query: filters as Record<string, string> }
    )

    return response.success && response.data ? response.data : []
  }

  // ==========================================================================
  // Deals
  // ==========================================================================

  /**
   * Sync deals from CRM system
   * مزامنة الصفقات من نظام CRM
   */
  async syncDeals(): Promise<{ deals: CRMDeal[]; syncedAt: string }> {
    if (!this.integration) {
      throw new Error('Not connected to CRM system')
    }

    const response = await apiClient.post<{ deals: CRMDeal[]; syncedAt: string }>(
      `/integrations/crm/${this.integration.id}/deals/sync`
    )

    if (response.success && response.data) {
      return response.data
    }

    return {
      deals: [],
      syncedAt: new Date().toISOString(),
    }
  }

  /**
   * Get all deals
   * الحصول على جميع الصفقات
   */
  async getDeals(filters?: {
    stage?: DealStage
    status?: DealStatus
  }): Promise<CRMDeal[]> {
    if (!this.integration) {
      throw new Error('Not connected to CRM system')
    }

    const response = await apiClient.get<CRMDeal[]>(
      `/integrations/crm/${this.integration.id}/deals`,
      { query: filters as Record<string, string> }
    )

    return response.success && response.data ? response.data : []
  }

  /**
   * Create deal in CRM
   * إنشاء صفقة في CRM
   */
  async createDeal(deal: Omit<CRMDeal, 'id' | 'createdAt' | 'updatedAt' | 'syncedAt'>): Promise<CRMDeal | null> {
    if (!this.integration) {
      throw new Error('Not connected to CRM system')
    }

    const response = await apiClient.post<CRMDeal>(
      `/integrations/crm/${this.integration.id}/deals`,
      deal
    )

    return response.success && response.data ? response.data : null
  }

  // ==========================================================================
  // Activities
  // ==========================================================================

  /**
   * Get activities
   * الحصول على الأنشطة
   */
  async getActivities(filters?: {
    type?: ActivityType
    status?: ActivityStatus
    contactId?: string
    dealId?: string
  }): Promise<CRMActivity[]> {
    if (!this.integration) {
      throw new Error('Not connected to CRM system')
    }

    const response = await apiClient.get<CRMActivity[]>(
      `/integrations/crm/${this.integration.id}/activities`,
      { query: filters as Record<string, string> }
    )

    return response.success && response.data ? response.data : []
  }

  /**
   * Create activity in CRM
   * إنشاء نشاط في CRM
   */
  async createActivity(activity: Omit<CRMActivity, 'id' | 'createdAt'>): Promise<CRMActivity | null> {
    if (!this.integration) {
      throw new Error('Not connected to CRM system')
    }

    const response = await apiClient.post<CRMActivity>(
      `/integrations/crm/${this.integration.id}/activities`,
      activity
    )

    return response.success && response.data ? response.data : null
  }

  // ==========================================================================
  // Webhooks
  // ==========================================================================

  /**
   * Register webhook for CRM updates
   * تسجيل webhook لتحديثات CRM
   */
  async registerWebhook(url: string, events: string[]): Promise<boolean> {
    if (!this.integration) {
      throw new Error('Not connected to CRM system')
    }

    const response = await apiClient.post(
      `/integrations/crm/${this.integration.id}/webhooks`,
      {
        url,
        events,
      }
    )

    return response.success
  }

  /**
   * Handle webhook payload
   * معالجة بيانات webhook
   */
  async handleWebhook(payload: WebhookPayload): Promise<void> {
    console.log('CRM Webhook received:', payload.event)
    
    switch (payload.event) {
      case 'contact.created':
      case 'contact.updated':
        await this.syncContacts()
        break
      case 'company.created':
      case 'company.updated':
        await this.syncCompanies()
        break
      case 'deal.created':
      case 'deal.updated':
      case 'deal.won':
      case 'deal.lost':
        await this.syncDeals()
        break
      default:
        console.log('Unhandled webhook event:', payload.event)
    }
  }
}

// ============================================================================
// Default CRM Connector Instance
// ============================================================================

export const crmConnector = new CRMConnector()

