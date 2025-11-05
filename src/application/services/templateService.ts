/**
 * @fileoverview Template Service Implementation
 * @description Comprehensive service for managing pricing templates in the bidding system.
 * Provides CRUD operations, template categorization, search functionality, and default templates.
 *
 * @author Desktop Management System Team
 * @version 1.0.0
 * @since Phase 1 Implementation
 *
 * @example
 * ```typescript
 * import { templateService } from '@/application/services/templateService'
 *
 * // Get all templates
 * const templates = await templateService.getTemplates()
 *
 * // Create a new template
 * const newTemplate = await templateService.createTemplate({
 *   name: 'مشروع سكني',
 *   category: 'residential',
 *   items: [...]
 * })
 * ```
 */

import {
  PricingTemplate,
  TemplateService,
  TemplateCategory,
  TemplateApplicationResult
} from '@/types/templates'
import { STORAGE_KEYS, safeLocalStorage } from '@/utils/storage'

/**
 * Template Service Implementation Class
 *
 * @class TemplateServiceImpl
 * @implements {TemplateService}
 * @description Manages pricing templates with local storage persistence.
 * Provides comprehensive CRUD operations, search, categorization, and template application.
 */
class TemplateServiceImpl implements TemplateService {
  /** Storage key for pricing templates in local storage */
  private readonly storageKey = STORAGE_KEYS.PRICING_TEMPLATES

  /**
   * Retrieves all pricing templates from storage
   *
   * @returns {Promise<PricingTemplate[]>} Array of all pricing templates
   * @throws {Error} When storage access fails
   *
   * @example
   * ```typescript
   * const templates = await templateService.getTemplates()
   * console.log(`Found ${templates.length} templates`)
   * ```
   */
  async getTemplates(): Promise<PricingTemplate[]> {
    try {
      const stored = safeLocalStorage.getItem(this.storageKey, null)
      if (!stored) {
        return this.getDefaultTemplates()
      }
      return Array.isArray(stored) ? stored : JSON.parse(stored as string)
    } catch (error) {
      console.error('Error loading templates:', error)
      return this.getDefaultTemplates()
    }
  }

  /**
   * Retrieves a specific template by ID
   *
   * @param {string} id - The unique identifier of the template
   * @returns {Promise<PricingTemplate | null>} The template if found, null otherwise
   *
   * @example
   * ```typescript
   * const template = await templateService.getTemplate('template-123')
   * if (template) {
   *   console.log(`Found template: ${template.name}`)
   * }
   * ```
   */
  async getTemplate(id: string): Promise<PricingTemplate | null> {
    const templates = await this.getTemplates()
    return templates.find(t => t.id === id) || null
  }

  /**
   * Creates a new pricing template
   *
   * @param {Omit<PricingTemplate, 'id' | 'createdAt' | 'updatedAt'>} templateData - Template data without auto-generated fields
   * @returns {Promise<PricingTemplate>} The created template with generated ID and timestamps
   * @throws {Error} When template creation fails
   *
   * @example
   * ```typescript
   * const newTemplate = await templateService.createTemplate({
   *   name: 'مشروع سكني متوسط',
   *   category: 'residential',
   *   description: 'قالب للمشاريع السكنية المتوسطة',
   *   items: [
   *     { description: 'أعمال الحفر', unit: 'م3', unitPrice: 50, quantity: 100 }
   *   ]
   * })
   * ```
   */
  async createTemplate(
    template: Omit<PricingTemplate, 'id' | 'createdAt' | 'usageCount' | 'lastUsed'>
  ): Promise<PricingTemplate> {
    const newTemplate: PricingTemplate = {
      ...template,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      usageCount: 0
    }

    const templates = await this.getTemplates()
    templates.push(newTemplate)
    await this.saveTemplates(templates)
    
    return newTemplate
  }

  async updateTemplate(template: PricingTemplate): Promise<PricingTemplate> {
    const templates = await this.getTemplates()
    const index = templates.findIndex(t => t.id === template.id)
    
    if (index === -1) {
      throw new Error(`Template with id ${template.id} not found`)
    }
    
    templates[index] = template
    await this.saveTemplates(templates)
    
    return template
  }

  async deleteTemplate(id: string): Promise<void> {
    const templates = await this.getTemplates()
    const filtered = templates.filter(t => t.id !== id)
    await this.saveTemplates(filtered)
  }

  async searchTemplates(query: string, category?: TemplateCategory): Promise<PricingTemplate[]> {
    const templates = await this.getTemplates()
    const lowerQuery = query.toLowerCase()
    
    return templates.filter(template => {
      const matchesQuery = 
        template.name.toLowerCase().includes(lowerQuery) ||
        template.description.toLowerCase().includes(lowerQuery) ||
        template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      
      const matchesCategory = !category || template.category === category
      
      return matchesQuery && matchesCategory
    })
  }

  async getTemplatesByCategory(category: TemplateCategory): Promise<PricingTemplate[]> {
    const templates = await this.getTemplates()
    return templates.filter(t => t.category === category)
  }

  async markTemplateUsed(id: string): Promise<void> {
    const template = await this.getTemplate(id)
    if (!template) return

    template.usageCount += 1
    template.lastUsed = new Date().toISOString()
    await this.updateTemplate(template)
  }

  async updateTemplateAccuracy(id: string, accuracy: number): Promise<void> {
    const template = await this.getTemplate(id)
    if (!template) return

    // Calculate running average
    const currentAccuracy = template.averageAccuracy || 0
    const usageCount = template.usageCount || 1
    const newAccuracy = ((currentAccuracy * (usageCount - 1)) + accuracy) / usageCount
    
    template.averageAccuracy = Math.round(newAccuracy * 100) / 100
    await this.updateTemplate(template)
  }

  private async saveTemplates(templates: PricingTemplate[]): Promise<void> {
    try {
      safeLocalStorage.setItem(this.storageKey, templates)
    } catch (error) {
      console.error('Error saving templates:', error)
      throw new Error('Failed to save templates')
    }
  }

  private generateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getDefaultTemplates(): PricingTemplate[] {
    return [
      {
        id: 'default_residential',
        name: 'مشروع سكني متوسط',
        description: 'قالب للمشاريع السكنية متوسطة الحجم (100-500 وحدة)',
        category: 'residential',
        isStarred: true,
        createdAt: '2024-01-15T00:00:00.000Z',
        lastUsed: '2024-03-10T00:00:00.000Z',
        usageCount: 15,
        averageAccuracy: 92,
        estimatedDuration: 8,
        defaultPercentages: { administrative: 8, operational: 12, profit: 18 },
        costBreakdown: { materials: 45, labor: 30, equipment: 15, subcontractors: 10 },
        tags: ['سكني', 'متوسط', 'مجمع']
      },
      {
        id: 'default_commercial',
        name: 'مبنى تجاري',
        description: 'قالب للمباني التجارية والمكاتب',
        category: 'commercial',
        isStarred: false,
        createdAt: '2024-02-01T00:00:00.000Z',
        lastUsed: '2024-03-08T00:00:00.000Z',
        usageCount: 8,
        averageAccuracy: 88,
        estimatedDuration: 12,
        defaultPercentages: { administrative: 10, operational: 15, profit: 22 },
        costBreakdown: { materials: 40, labor: 25, equipment: 20, subcontractors: 15 },
        tags: ['تجاري', 'مكاتب', 'مول']
      },
      {
        id: 'default_infrastructure',
        name: 'مشروع طرق',
        description: 'قالب لمشاريع الطرق والبنية التحتية',
        category: 'infrastructure',
        isStarred: true,
        createdAt: '2024-01-20T00:00:00.000Z',
        usageCount: 12,
        averageAccuracy: 95,
        estimatedDuration: 16,
        defaultPercentages: { administrative: 12, operational: 18, profit: 15 },
        costBreakdown: { materials: 50, labor: 20, equipment: 25, subcontractors: 5 },
        tags: ['طرق', 'بنية تحتية', 'أسفلت']
      }
    ]
  }

  // Template application methods
  async applyTemplate(templateId: string, tenderId: string): Promise<TemplateApplicationResult> {
    const template = await this.getTemplate(templateId)
    if (!template) {
      return {
        success: false,
        appliedTemplate: template!,
        modifiedFields: [],
        warnings: [],
        errors: ['Template not found']
      }
    }

    try {
      // Mark template as used
      await this.markTemplateUsed(templateId)

      // Here you would apply the template to the tender
      // This is a placeholder for the actual implementation
      const result: TemplateApplicationResult = {
        success: true,
        appliedTemplate: template,
        modifiedFields: ['defaultPercentages', 'costBreakdown'],
        warnings: [],
        errors: []
      }

      return result
    } catch (error) {
      return {
        success: false,
        appliedTemplate: template,
        modifiedFields: [],
        warnings: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  async getTemplateUsageStats(): Promise<{
    totalTemplates: number
    totalUsage: number
    averageAccuracy: number
    mostUsedTemplate: PricingTemplate | null
  }> {
    const templates = await this.getTemplates()
    
    const totalUsage = templates.reduce((sum, t) => sum + t.usageCount, 0)
    const totalAccuracy = templates.reduce((sum, t) => sum + (t.averageAccuracy * t.usageCount), 0)
    const averageAccuracy = totalUsage > 0 ? totalAccuracy / totalUsage : 0
    
    const mostUsedTemplate = templates.reduce((max, t) => 
      t.usageCount > (max?.usageCount || 0) ? t : max, null as PricingTemplate | null
    )

    return {
      totalTemplates: templates.length,
      totalUsage,
      averageAccuracy: Math.round(averageAccuracy * 100) / 100,
      mostUsedTemplate
    }
  }
}

export const templateService = new TemplateServiceImpl()
export type { TemplateService }
