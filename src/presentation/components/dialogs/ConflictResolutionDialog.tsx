/**
 * Conflict Resolution Dialog
 *
 * Phase 5.1.4: UI Component for resolving optimistic locking conflicts
 *
 * This dialog is shown when a user attempts to update a Tender that has been
 * modified by another user since it was last loaded.
 *
 * Features:
 * - Side-by-side comparison of current vs. attempted changes
 * - Highlight conflicting fields
 * - Resolution options: Keep Mine, Keep Theirs, Auto-Merge (if possible), Cancel
 * - Auto-merge for non-critical fields
 */

import { useEffect, useRef } from 'react'
import type { Tender } from '@/data/centralData'
import { ConflictError } from '@/domain/errors/ConflictError'

// ============================================================================
// Types
// ============================================================================

export interface ConflictResolutionDialogProps {
  /** The ConflictError containing current and attempted data */
  error: ConflictError

  /** Callback when user chooses "Keep Mine" (use attempted changes) */
  onKeepMine: () => void

  /** Callback when user chooses "Keep Theirs" (discard my changes) */
  onKeepTheirs: () => void

  /** Callback when user chooses "Auto-Merge" (if possible) */
  onAutoMerge?: () => void

  /** Callback when user cancels */
  onCancel: () => void

  /** Whether the dialog is open */
  isOpen: boolean
}

// ============================================================================
// Field Display Configuration
// ============================================================================

/** Fields to show in conflict comparison (excluding internal fields) */
const DISPLAY_FIELDS: Array<{
  key: keyof Tender
  label: string
  labelAr: string
}> = [
  { key: 'status', label: 'Status', labelAr: 'الحالة' },
  { key: 'value', label: 'Value', labelAr: 'القيمة' },
  { key: 'deadline', label: 'Deadline', labelAr: 'الموعد النهائي' },
  { key: 'progress', label: 'Progress', labelAr: 'التقدم' },
  { key: 'priority', label: 'Priority', labelAr: 'الأولوية' },
  { key: 'phase', label: 'Phase', labelAr: 'المرحلة' },
  { key: 'team', label: 'Team', labelAr: 'الفريق' },
  { key: 'manager', label: 'Manager', labelAr: 'المدير' },
  { key: 'lastAction', label: 'Last Action', labelAr: 'آخر إجراء' },
  { key: 'notes', label: 'Notes', labelAr: 'ملاحظات' },
]

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format field value for display
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? 'نعم' : 'لا'
  if (typeof value === 'number') return value.toLocaleString('ar-SA')
  if (value instanceof Date) return value.toLocaleString('ar-SA')
  return String(value)
}

/**
 * Check if field has changed between current and attempted
 */
function hasFieldChanged(
  current: Tender,
  attempted: Partial<Tender>,
  field: keyof Tender,
): boolean {
  const currentValue = current[field]
  const attemptedValue = attempted[field]

  // If attempted value is undefined, no change was attempted
  if (attemptedValue === undefined) return false

  // Compare values
  return JSON.stringify(currentValue) !== JSON.stringify(attemptedValue)
}

// ============================================================================
// Component
// ============================================================================

export function ConflictResolutionDialog({
  error,
  onKeepMine,
  onKeepTheirs,
  onAutoMerge,
  onCancel,
  isOpen,
}: ConflictResolutionDialogProps): JSX.Element {
  // Refs for accessibility (must be called unconditionally)
  const dialogRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedElement = useRef<HTMLElement | null>(null)

  // Null-safety guard: ensure details exists before destructuring
  const details = error.details
  const current = details?.current
  const attempted = details?.attempted

  // Additional safety check - extract these before hooks
  const hasValidData = !!(details && current && attempted)
  const conflictingFields = hasValidData ? error.getConflictingFields() : []
  const canAutoMerge = hasValidData ? error.canAutoMerge() : false

  // Focus management
  useEffect(() => {
    if (isOpen && hasValidData) {
      // Store currently focused element
      previouslyFocusedElement.current = document.activeElement as HTMLElement

      // Focus dialog container
      dialogRef.current?.focus()

      // Escape key handler
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onCancel()
        }
      }

      document.addEventListener('keydown', handleEscape)

      return () => {
        document.removeEventListener('keydown', handleEscape)

        // Restore focus to previously focused element
        if (previouslyFocusedElement.current) {
          previouslyFocusedElement.current.focus()
        }
      }
    }
  }, [isOpen, onCancel, hasValidData])

  // Early returns after all hooks
  if (!isOpen) {
    return <></>
  }

  if (!hasValidData) {
    console.error(
      'ConflictResolutionDialog: Missing required data (details, current, or attempted)',
    )
    return <></>
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="conflict-dialog-title"
        tabIndex={-1}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h2 id="conflict-dialog-title" className="text-xl font-bold">
                تعارض في التحديث - Update Conflict
              </h2>
              <p className="text-sm text-white/90 mt-1">تم تعديل المنافسة من قبل مستخدم آخر</p>
            </div>
          </div>
        </div>

        {/* Conflict Summary */}
        <div className="px-6 py-4 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700">
          <div className="flex items-start gap-3 text-sm">
            <svg
              className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="space-y-1">
              <p className="text-gray-800 dark:text-gray-200 font-medium">
                {error.details.message}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                عدد الحقول المتعارضة:{' '}
                <span className="font-bold text-amber-600">{conflictingFields.length}</span>
              </p>
              {canAutoMerge && (
                <p className="text-green-600 dark:text-green-400 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  يمكن الدمج التلقائي - Auto-merge available
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                <th className="text-right py-3 px-4 font-bold text-gray-700 dark:text-gray-300 w-1/4">
                  الحقل - Field
                </th>
                <th className="text-right py-3 px-4 font-bold text-blue-700 dark:text-blue-400 w-3/8">
                  النسخة الحالية (الخادم)
                  <div className="text-xs font-normal text-gray-500 dark:text-gray-400 mt-1">
                    Current (Server)
                  </div>
                </th>
                <th className="text-right py-3 px-4 font-bold text-purple-700 dark:text-purple-400 w-3/8">
                  التغييرات المحاولة (تغييراتك)
                  <div className="text-xs font-normal text-gray-500 dark:text-gray-400 mt-1">
                    Your Changes
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {DISPLAY_FIELDS.map(({ key, label, labelAr }) => {
                const hasChanged = hasFieldChanged(current, attempted, key)
                const isConflict = conflictingFields.includes(key)

                return (
                  <tr
                    key={key}
                    className={`
                      border-b border-gray-200 dark:border-gray-700
                      ${isConflict ? 'bg-red-50 dark:bg-red-900/10' : ''}
                      ${hasChanged && !isConflict ? 'bg-green-50 dark:bg-green-900/10' : ''}
                    `}
                  >
                    <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        {isConflict && (
                          <svg
                            className="w-4 h-4 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        )}
                        <div>
                          <div className="text-gray-800 dark:text-gray-200">{labelAr}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 bg-blue-50/50 dark:bg-blue-900/10">
                      <div className="text-gray-800 dark:text-gray-200 font-mono">
                        {formatValue(current[key])}
                      </div>
                    </td>
                    <td className="py-3 px-4 bg-purple-50/50 dark:bg-purple-900/10">
                      <div className="text-gray-800 dark:text-gray-200 font-mono">
                        {formatValue(attempted[key])}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Version Info */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-xs text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-semibold">النسخة الحالية:</span> v{current.version ?? 'unknown'}
            </div>
            <div>
              <span className="font-semibold">آخر تعديل بواسطة:</span>{' '}
              {current.lastModifiedBy ?? 'unknown'}
            </div>
            <div>
              <span className="font-semibold">تاريخ التعديل:</span>{' '}
              {current.lastModified
                ? new Date(current.lastModified).toLocaleString('ar-SA')
                : 'unknown'}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4">
          <div className="text-xs text-gray-500 dark:text-gray-400">اختر كيفية حل التعارض:</div>

          <div className="flex items-center gap-3">
            {/* Cancel */}
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              إلغاء - Cancel
            </button>

            {/* Keep Theirs (Reload) */}
            <button
              type="button"
              onClick={onKeepTheirs}
              className="px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                إعادة التحميل - Reload
              </div>
            </button>

            {/* Auto-Merge (if possible) */}
            {canAutoMerge && onAutoMerge && (
              <button
                type="button"
                onClick={onAutoMerge}
                className="px-4 py-2 text-sm font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                  دمج تلقائي - Auto-Merge
                </div>
              </button>
            )}

            {/* Keep Mine (Force Save) */}
            <button
              type="button"
              onClick={onKeepMine}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors shadow-lg"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                حفظ تغييراتي - Save My Changes
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
