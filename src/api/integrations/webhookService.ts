/**
 * Webhook Service
 * Sprint 5.3.5: تكامل مع أنظمة HR و CRM
 */

import type { WebhookPayload, WebhookConfig, WebhookDelivery } from '../types'
import { apiClient } from '../client'
import { hrConnector } from './hrConnector'
import { crmConnector } from './crmConnector'

// ============================================================================
// Types
// ============================================================================

export interface Webhook {
  id: string
  name: string
  nameAr?: string
  url: string
  events: string[]
  secret?: string
  isActive: boolean
  headers?: Record<string, string>
  retryPolicy: RetryPolicy
  createdAt: string
  updatedAt: string
}

export interface RetryPolicy {
  maxRetries: number
  retryDelay: number // milliseconds
  backoffMultiplier: number
}

export interface WebhookLog {
  id: string
  webhookId: string
  event: string
  payload: WebhookPayload
  status: WebhookDeliveryStatus
  statusCode?: number
  response?: string
  error?: string
  attempts: number
  deliveredAt?: string
  createdAt: string
}

export type WebhookDeliveryStatus = 'pending' | 'delivered' | 'failed' | 'retrying'

// ============================================================================
// Webhook Service Class
// ============================================================================

export class WebhookService {
  private webhooks = new Map<string, Webhook>()
  private deliveryQueue: WebhookDelivery[] = []
  private isProcessing = false

  /**
   * Register a new webhook
   * تسجيل webhook جديد
   */
  async registerWebhook(config: WebhookConfig): Promise<Webhook> {
    const response = await apiClient.post<Webhook>('/webhooks', config)

    if (response.success && response.data) {
      this.webhooks.set(response.data.id, response.data)
      return response.data
    }

    throw new Error('Failed to register webhook')
  }

  /**
   * Unregister a webhook
   * إلغاء تسجيل webhook
   */
  async unregisterWebhook(webhookId: string): Promise<void> {
    await apiClient.delete(`/webhooks/${webhookId}`)
    this.webhooks.delete(webhookId)
  }

  /**
   * Get all webhooks
   * الحصول على جميع webhooks
   */
  async getWebhooks(): Promise<Webhook[]> {
    const response = await apiClient.get<Webhook[]>('/webhooks')

    if (response.success && response.data) {
      response.data.forEach((webhook) => {
        this.webhooks.set(webhook.id, webhook)
      })
      return response.data
    }

    return []
  }

  /**
   * Update webhook
   * تحديث webhook
   */
  async updateWebhook(webhookId: string, updates: Partial<Webhook>): Promise<Webhook | null> {
    const response = await apiClient.put<Webhook>(`/webhooks/${webhookId}`, updates)

    if (response.success && response.data) {
      this.webhooks.set(response.data.id, response.data)
      return response.data
    }

    return null
  }

  /**
   * Trigger webhook for an event
   * تشغيل webhook لحدث معين
   */
  async triggerWebhook(event: string, data: unknown): Promise<void> {
    const payload: WebhookPayload = {
      event,
      data,
      timestamp: new Date().toISOString(),
      source: 'dms',
    }

    // Find all webhooks subscribed to this event
    const subscribedWebhooks = Array.from(this.webhooks.values()).filter(
      (webhook) => webhook.isActive && webhook.events.includes(event),
    )

    // Queue deliveries
    for (const webhook of subscribedWebhooks) {
      const delivery: WebhookDelivery = {
        id: this.generateDeliveryId(),
        webhookId: webhook.id,
        payload,
        status: 'pending',
        attempts: 0,
        createdAt: new Date().toISOString(),
      }

      this.deliveryQueue.push(delivery)
    }

    // Start processing queue if not already processing
    if (!this.isProcessing) {
      this.processDeliveryQueue()
    }
  }

  /**
   * Process webhook delivery queue
   * معالجة قائمة انتظار تسليم webhooks
   */
  private async processDeliveryQueue(): Promise<void> {
    if (this.isProcessing || this.deliveryQueue.length === 0) {
      return
    }

    this.isProcessing = true

    while (this.deliveryQueue.length > 0) {
      const delivery = this.deliveryQueue.shift()
      if (!delivery) continue

      await this.deliverWebhook(delivery)
    }

    this.isProcessing = false
  }

  /**
   * Deliver a webhook
   * تسليم webhook
   */
  private async deliverWebhook(delivery: WebhookDelivery): Promise<void> {
    const webhook = this.webhooks.get(delivery.webhookId)
    if (!webhook) return

    delivery.attempts++
    delivery.status = 'retrying'

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': delivery.payload.event,
          'X-Webhook-Signature': this.generateSignature(delivery.payload, webhook.secret),
          ...webhook.headers,
        },
        body: JSON.stringify(delivery.payload),
      })

      if (response.ok) {
        delivery.status = 'delivered'
        delivery.statusCode = response.status
        delivery.deliveredAt = new Date().toISOString()

        // Log successful delivery
        await this.logDelivery(delivery, 'delivered')
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      delivery.status = 'failed'
      delivery.error = error instanceof Error ? error.message : 'Unknown error'

      // Retry if not exceeded max retries
      if (delivery.attempts < webhook.retryPolicy.maxRetries) {
        const delay = this.calculateRetryDelay(delivery.attempts, webhook.retryPolicy)

        setTimeout(() => {
          this.deliveryQueue.push(delivery)
          this.processDeliveryQueue()
        }, delay)
      } else {
        // Log failed delivery
        await this.logDelivery(delivery, 'failed')
      }
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   * حساب تأخير إعادة المحاولة مع التراجع الأسي
   */
  private calculateRetryDelay(attempt: number, policy: RetryPolicy): number {
    return policy.retryDelay * Math.pow(policy.backoffMultiplier, attempt - 1)
  }

  /**
   * Generate webhook signature for verification
   * إنشاء توقيع webhook للتحقق
   */
  private generateSignature(payload: WebhookPayload, secret?: string): string {
    if (!secret) return ''

    // In a real implementation, use HMAC-SHA256
    // This is a simplified version
    const data = JSON.stringify(payload)
    return `sha256=${Buffer.from(data + secret).toString('base64')}`
  }

  /**
   * Generate unique delivery ID
   * إنشاء معرف فريد للتسليم
   */
  private generateDeliveryId(): string {
    return `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Log webhook delivery
   * تسجيل تسليم webhook
   */
  private async logDelivery(
    delivery: WebhookDelivery,
    status: WebhookDeliveryStatus,
  ): Promise<void> {
    const log: WebhookLog = {
      id: this.generateDeliveryId(),
      webhookId: delivery.webhookId,
      event: delivery.payload.event,
      payload: delivery.payload,
      status,
      statusCode: delivery.statusCode,
      error: delivery.error,
      attempts: delivery.attempts,
      deliveredAt: delivery.deliveredAt,
      createdAt: delivery.createdAt,
    }

    await apiClient.post('/webhooks/logs', log)
  }

  /**
   * Get webhook logs
   * الحصول على سجلات webhooks
   */
  async getWebhookLogs(
    webhookId?: string,
    filters?: {
      status?: WebhookDeliveryStatus
      event?: string
      startDate?: string
      endDate?: string
    },
  ): Promise<WebhookLog[]> {
    const response = await apiClient.get<WebhookLog[]>('/webhooks/logs', {
      query: { webhookId, ...filters } as Record<string, string>,
    })

    return response.success && response.data ? response.data : []
  }

  /**
   * Handle incoming webhook from external system
   * معالجة webhook وارد من نظام خارجي
   */
  async handleIncomingWebhook(
    source: 'hr' | 'crm' | 'accounting',
    payload: WebhookPayload,
  ): Promise<void> {
    console.log(`Incoming webhook from ${source}:`, payload.event)

    switch (source) {
      case 'hr':
        await hrConnector.handleWebhook(payload)
        break
      case 'crm':
        await crmConnector.handleWebhook(payload)
        break
      case 'accounting':
        // Handle accounting webhook
        console.log('Accounting webhook:', payload)
        break
      default:
        console.log('Unknown webhook source:', source)
    }
  }

  /**
   * Verify webhook signature
   * التحقق من توقيع webhook
   */
  verifySignature(payload: WebhookPayload, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret)
    return signature === expectedSignature
  }

  /**
   * Test webhook
   * اختبار webhook
   */
  async testWebhook(webhookId: string): Promise<boolean> {
    const webhook = this.webhooks.get(webhookId)
    if (!webhook) return false

    const testPayload: WebhookPayload = {
      event: 'test',
      data: {
        message: 'This is a test webhook',
        messageAr: 'هذا اختبار webhook',
      },
      timestamp: new Date().toISOString(),
      source: 'dms',
    }

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': 'test',
          'X-Webhook-Signature': this.generateSignature(testPayload, webhook.secret),
          ...webhook.headers,
        },
        body: JSON.stringify(testPayload),
      })

      return response.ok
    } catch (error) {
      console.error('Webhook test failed:', error)
      return false
    }
  }
}

// ============================================================================
// Default Webhook Service Instance
// ============================================================================

export const webhookService = new WebhookService()

// ============================================================================
// Webhook Event Constants
// ============================================================================

export const WEBHOOK_EVENTS = {
  // Tender events
  TENDER_CREATED: 'tender.created',
  TENDER_UPDATED: 'tender.updated',
  TENDER_SUBMITTED: 'tender.submitted',
  TENDER_AWARDED: 'tender.awarded',
  TENDER_LOST: 'tender.lost',

  // Project events
  PROJECT_CREATED: 'project.created',
  PROJECT_UPDATED: 'project.updated',
  PROJECT_STARTED: 'project.started',
  PROJECT_COMPLETED: 'project.completed',

  // Financial events
  INVOICE_CREATED: 'invoice.created',
  INVOICE_PAID: 'invoice.paid',
  PAYMENT_RECEIVED: 'payment.received',
  PAYMENT_SENT: 'payment.sent',

  // HR events
  EMPLOYEE_CREATED: 'employee.created',
  EMPLOYEE_UPDATED: 'employee.updated',
  EMPLOYEE_TERMINATED: 'employee.terminated',

  // CRM events
  CONTACT_CREATED: 'contact.created',
  CONTACT_UPDATED: 'contact.updated',
  DEAL_CREATED: 'deal.created',
  DEAL_WON: 'deal.won',
  DEAL_LOST: 'deal.lost',
} as const
