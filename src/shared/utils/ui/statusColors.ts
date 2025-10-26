/**
 * 🎨 Unified Status & Progress Color Utilities
 * -------------------------------------------------------------
 * Consolidates scattered color classification logic previously found in:
 *  - helpers.ts (getStatusColor, getPriorityColor, getHealthColor, getProgressColor)
 *  - inline component utilities (Dashboard, TenderDetails, FinancialSummaryCard, Budgets, AnnualKPICards, etc.)
 *  - centralData.ts (getHealthColor redefinition)
 *
 * Goal:
 *  - Single authoritative source for semantic color class resolution.
 *  - Prevent silent divergence between components.
 *  - Provide typed, extensible API ready for future theming.
 *
 * Migration Plan (Phase 1 -> Phase 3):
 *  Phase 1 (now): Introduce this module. Keep legacy functions in helpers.ts as wrappers.
 *  Phase 2: Refactor components to import from 'utils/statusColors'.
 *  Phase 3: Remove wrapper functions from helpers.ts & purge duplicates in centralData.ts.
 *
 * Tailwind Strategy:
 *  - Returned strings are full utility class bundles (text + background for badges or solid bg for progress bars).
 *  - Future: could evolve to return token keys (e.g., { fg: '', bg: '' }) once a design system layer is introduced.
 */

// --- Internal Maps ---------------------------------------------------------

const STATUS_COLOR_MAP: Record<string, string> = {
  active: 'text-success bg-success/10',
  completed: 'text-primary bg-primary/10',
  delayed: 'text-error bg-error/10',
  paused: 'text-warning bg-warning/10',
  planning: 'text-info bg-info/10',
  cancelled: 'text-muted-foreground bg-muted/20',
}

const PRIORITY_COLOR_MAP: Record<string, string> = {
  critical: 'text-error bg-error/10',
  high: 'text-warning bg-warning/10',
  medium: 'text-info bg-info/10',
  low: 'text-success bg-success/10',
}

const HEALTH_COLOR_MAP: Record<string, string> = {
  // canonical keys
  green: 'text-success bg-success/10',
  yellow: 'text-warning bg-warning/10',
  red: 'text-error bg-error/10',
  // aliases (Phase 2): semantic health labels
  good: 'text-success bg-success/10', // alias of green
  warning: 'text-warning bg-warning/10', // alias of yellow
  critical: 'text-error bg-error/10', // alias of red
}

// Progress colors are continuous; thresholds kept configurable for future externalization.
interface ProgressColorConfig {
  critical: number // below this => red
  warning: number // below this => orange
  caution: number // below this => yellow
  ok: number // below this => blue
  success: number // anything >= success => green
}

const DEFAULT_PROGRESS_CONFIG: ProgressColorConfig = {
  critical: 20,
  warning: 40,
  caution: 60,
  ok: 80,
  success: 100,
}

// --- Public API ------------------------------------------------------------

/** Generic resolver enabling future generic UI binding */
export type ColorDomain = 'status' | 'priority' | 'health'

export const getSemanticColor = (domain: ColorDomain, key: string): string => {
  switch (domain) {
    case 'status':
      return STATUS_COLOR_MAP[key] || 'text-muted-foreground bg-muted/20'
    case 'priority':
      return PRIORITY_COLOR_MAP[key] || 'text-muted-foreground bg-muted/20'
    case 'health':
      return HEALTH_COLOR_MAP[key] || 'text-muted-foreground bg-muted/20'
    default:
      return 'text-muted-foreground bg-muted/20'
  }
}

export const getStatusColor = (status: string): string => getSemanticColor('status', status)
export const getPriorityColor = (priority: string): string => getSemanticColor('priority', priority)
export const getHealthColor = (health: string): string => getSemanticColor('health', health)

/**
 * Progress bar / indicator background color.
 * Returns a single background utility class.
 */
export const getProgressColor = (
  progress: number,
  cfg: ProgressColorConfig = DEFAULT_PROGRESS_CONFIG,
): string => {
  if (progress >= cfg.success) return 'bg-success'
  if (progress >= cfg.ok) return 'bg-info'
  if (progress >= cfg.caution) return 'bg-warning'
  if (progress >= cfg.warning) return 'bg-error/80'
  if (progress >= cfg.critical) return 'bg-error'
  return 'bg-error'
}

// --- Introspection / Future Enhancements ----------------------------------

export const listSupported = () => ({
  status: Object.keys(STATUS_COLOR_MAP),
  priority: Object.keys(PRIORITY_COLOR_MAP),
  health: Object.keys(HEALTH_COLOR_MAP),
})

export const _internal = {
  STATUS_COLOR_MAP,
  PRIORITY_COLOR_MAP,
  HEALTH_COLOR_MAP,
  DEFAULT_PROGRESS_CONFIG,
}

// Debug helper (اختبارات فقط) - لا يُستخدم في الإنتاج مباشرة
export const __debugSemanticMaps = () => ({
  status: { ...STATUS_COLOR_MAP },
  priority: { ...PRIORITY_COLOR_MAP },
  health: { ...HEALTH_COLOR_MAP },
})

export default {
  getStatusColor,
  getPriorityColor,
  getHealthColor,
  getProgressColor,
  getSemanticColor,
  listSupported,
  __debugSemanticMaps,
}
