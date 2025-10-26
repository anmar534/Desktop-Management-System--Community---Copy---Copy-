/**
 * Tender Form Validation Utilities
 *
 * @fileoverview Comprehensive validation functions for tender form fields.
 * Extracted from NewTenderForm.tsx to promote reusability and testability.
 *
 * @module shared/utils/tender/tenderFormValidators
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Parse numeric value from string or number input
 * Handles commas, null, undefined, and invalid numbers
 *
 * @param value - Input value to parse
 * @returns Parsed number or null if invalid
 *
 * @example
 * ```ts
 * parseNumericValue('1,000.50') // 1000.5
 * parseNumericValue(null) // null
 * parseNumericValue('invalid') // null
 * ```
 */
export const parseNumericValue = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  const normalized = trimmed.replace(/,/g, '')
  const parsed = Number.parseFloat(normalized)
  return Number.isNaN(parsed) ? null : parsed
}

/**
 * Convert input value to string for form fields
 *
 * @param value - Value to convert
 * @returns String representation or empty string
 */
export const toInputString = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value)
}

/**
 * Format ISO date string to yyyy-MM-dd format for HTML date input
 *
 * @param dateString - ISO date string or null
 * @returns Formatted date string or empty string
 *
 * @example
 * ```ts
 * formatDateForInput('2025-10-31T00:00:00.000Z') // '2025-10-31'
 * formatDateForInput(null) // ''
 * ```
 */
export const formatDateForInput = (dateString?: string | null): string => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch {
    return ''
  }
}

/**
 * Calculate days remaining until deadline
 *
 * @param deadline - Deadline date string
 * @returns Number of days remaining (0 if past or invalid)
 */
export const calculateDaysRemaining = (deadline: string): number => {
  if (!deadline) {
    return 0
  }
  const deadlineDate = new Date(deadline)
  if (Number.isNaN(deadlineDate.getTime())) {
    return 0
  }
  const today = new Date()
  const diffTime = deadlineDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
}

/**
 * Format currency value to SAR
 *
 * @param amount - Amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
  }).format(amount)

/**
 * Validate required text field
 *
 * @param value - Field value
 * @param fieldName - Name of field for error message
 * @returns Validation result
 */
export const validateRequiredField = (value: string, fieldName: string): ValidationResult => {
  const trimmed = value.trim()
  if (!trimmed) {
    return {
      isValid: false,
      error: `${fieldName} مطلوب`,
    }
  }
  return { isValid: true }
}

/**
 * Validate numeric field (optional)
 *
 * @param value - Field value
 * @param fieldName - Name of field for error message
 * @param min - Minimum value (optional)
 * @param max - Maximum value (optional)
 * @returns Validation result
 */
export const validateNumericField = (
  value: string,
  fieldName: string,
  options?: { min?: number; max?: number },
): ValidationResult => {
  if (!value.trim()) {
    return { isValid: true } // Optional field
  }

  const parsed = parseNumericValue(value)
  if (parsed === null) {
    return {
      isValid: false,
      error: `${fieldName} يجب أن يكون رقماً صحيحاً`,
    }
  }

  if (options?.min !== undefined && parsed < options.min) {
    return {
      isValid: false,
      error: `${fieldName} يجب أن يكون أكبر من ${options.min}`,
    }
  }

  if (options?.max !== undefined && parsed > options.max) {
    return {
      isValid: false,
      error: `${fieldName} يجب أن يكون أقل من ${options.max}`,
    }
  }

  return { isValid: true }
}

/**
 * Validate date field
 *
 * @param value - Date string (yyyy-MM-dd format)
 * @param fieldName - Name of field for error message
 * @param options - Validation options
 * @returns Validation result
 */
export const validateDateField = (
  value: string,
  fieldName: string,
  options?: { minDate?: Date; maxDate?: Date; required?: boolean },
): ValidationResult => {
  if (!value.trim()) {
    if (options?.required) {
      return {
        isValid: false,
        error: `${fieldName} مطلوب`,
      }
    }
    return { isValid: true }
  }

  const date = new Date(value)
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      error: `${fieldName} غير صحيح`,
    }
  }

  if (options?.minDate && date < options.minDate) {
    return {
      isValid: false,
      error: `${fieldName} يجب أن يكون بعد ${options.minDate.toLocaleDateString('ar-SA')}`,
    }
  }

  if (options?.maxDate && date > options.maxDate) {
    return {
      isValid: false,
      error: `${fieldName} يجب أن يكون قبل ${options.maxDate.toLocaleDateString('ar-SA')}`,
    }
  }

  return { isValid: true }
}

/**
 * Validate file upload
 *
 * @param file - File to validate
 * @param options - Validation options
 * @returns Validation result
 */
export const validateFile = (
  file: File,
  options?: {
    maxSize?: number // in bytes
    allowedTypes?: string[]
  },
): ValidationResult => {
  const maxSize = options?.maxSize ?? 10 * 1024 * 1024 // Default 10MB

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `الملف ${file.name} كبير جداً. الحد الأقصى ${Math.round(maxSize / (1024 * 1024))} ميجابايت`,
    }
  }

  if (options?.allowedTypes && options.allowedTypes.length > 0) {
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`
    if (!options.allowedTypes.includes(fileExtension)) {
      return {
        isValid: false,
        error: `نوع الملف ${fileExtension} غير مدعوم. الأنواع المسموحة: ${options.allowedTypes.join(', ')}`,
      }
    }
  }

  return { isValid: true }
}

/**
 * Check if tender form is valid (all required fields filled)
 *
 * @param formData - Form data object
 * @returns True if all required fields are filled
 */
export const isTenderFormValid = (formData: {
  name: string
  ownerEntity: string
  location: string
  projectDuration: string
  bookletPrice: string
  deadline: string
}): boolean => {
  const requiredFields = [
    formData.name,
    formData.ownerEntity,
    formData.location,
    formData.projectDuration, // Now just the number is sufficient
    formData.bookletPrice,
    formData.deadline,
  ]
  return requiredFields.every((field) => field.trim().length > 0)
}
