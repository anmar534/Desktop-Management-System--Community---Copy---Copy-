/**
 * Project Validation Repository
 * Handles all validation logic for projects
 */

import type {
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectValidationResult,
} from '@/types/projects'
import { projectCRUDRepository } from './ProjectCRUDRepository'

export class ProjectValidationRepository {
  /**
   * Validate project data before create or update
   */
  async validateProject(
    data: CreateProjectRequest | UpdateProjectRequest,
  ): Promise<ProjectValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // Basic validation
    if (!data.name || data.name.trim().length === 0) {
      errors.push('اسم المشروع مطلوب')
    }

    if (!data.description || data.description.trim().length === 0) {
      errors.push('وصف المشروع مطلوب')
    }

    if (!data.clientId) {
      errors.push('العميل مطلوب')
    }

    if (!data.startDate) {
      errors.push('تاريخ البدء مطلوب')
    }

    if (!data.endDate) {
      errors.push('تاريخ الانتهاء مطلوب')
    }

    if (data.startDate && data.endDate && new Date(data.startDate) >= new Date(data.endDate)) {
      errors.push('تاريخ البدء يجب أن يكون قبل تاريخ الانتهاء')
    }

    if (!data.budget || data.budget <= 0) {
      errors.push('الميزانية يجب أن تكون أكبر من صفر')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Check if project name is unique
   */
  async checkNameUniqueness(name: string, excludeId?: string): Promise<boolean> {
    const projects = await projectCRUDRepository.getAll()
    return !projects.some((p) => p.name === name && p.id !== excludeId)
  }

  /**
   * Check if project code is unique
   */
  async checkCodeUniqueness(code: string, excludeId?: string): Promise<boolean> {
    const projects = await projectCRUDRepository.getAll()
    return !projects.some((p) => p.code === code && p.id !== excludeId)
  }
}

// Export singleton instance
export const projectValidationRepository = new ProjectValidationRepository()
