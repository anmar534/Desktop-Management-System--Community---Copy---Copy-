import { STORAGE_KEYS } from '@/config/storageKeys';
import { safeLocalStorage } from '@/utils/storage';
import { projectCostService } from './projectCostService';
import { APP_EVENTS, bus } from '@/events/bus';

/**
 * costVarianceService
 * - يحلل مسودة تكلفة المشروع (أو الرسمية) ويولد حالات إنذار
 * - يدعم عتبات عامة + تخصيص لكل مشروع + تخصيص فئات
 * - يخزن آخر تحليل لتقليل التكلفة (cache)
 */

export interface VarianceThresholds {
  itemVariancePct?: number; // تجاوز نسبة فارق البند
  itemVarianceValue?: number; // قيمة مطلقة
  projectVariancePct?: number; // اجمالي المشروع
  erosionPct?: number; // تآكل الربح
  erosionValue?: number; // قيمة تآكل الربح
}

export type CategoryOverrides = Record<string, VarianceThresholds>;

export interface ProjectVarianceConfig {
  projectId: string;
  enabled: boolean;
  thresholds: VarianceThresholds;
  categoryOverrides?: CategoryOverrides;
  lastUpdated: string;
}

export interface VarianceAlert {
  id: string;
  projectId: string;
  level: 'info' | 'warning' | 'critical';
  type: 'item-variance' | 'project-variance' | 'profit-erosion';
  message: string;
  costItemId?: string;
  category?: string;
  varianceValue?: number;
  variancePct?: number;
  erosionValue?: number;
  erosionPct?: number;
  createdAt: string;
}

interface VarianceCacheEntry {
  projectId: string;
  runAt: string;
  alerts: VarianceAlert[];
  stats: {
    itemsAnalyzed: number;
    triggered: number;
    projectVariancePct: number;
    projectVarianceValue: number;
    erosionPct?: number;
    erosionValue?: number;
  };
}

type VarianceConfigIndex = Record<string, ProjectVarianceConfig>;
type VarianceCacheIndex = Record<string, VarianceCacheEntry>;

function loadConfig(): VarianceConfigIndex {
  return safeLocalStorage.getItem<VarianceConfigIndex>(STORAGE_KEYS.COST_VARIANCE_CONFIG, {});
}
function saveConfig(cfg: VarianceConfigIndex) {
  safeLocalStorage.setItem(STORAGE_KEYS.COST_VARIANCE_CONFIG, cfg);
}
function loadCache(): VarianceCacheIndex {
  return safeLocalStorage.getItem<VarianceCacheIndex>(STORAGE_KEYS.COST_VARIANCE_CACHE, {});
}
function saveCache(c: VarianceCacheIndex) {
  safeLocalStorage.setItem(STORAGE_KEYS.COST_VARIANCE_CACHE, c);
}

const DEFAULT_THRESHOLDS: VarianceThresholds = {
  itemVariancePct: 10,
  projectVariancePct: 5,
  erosionPct: 15
};

function classify(levelBase: number, value: number): 'info' | 'warning' | 'critical' {
  if (value >= levelBase * 2) return 'critical';
  if (value >= levelBase) return 'warning';
  return 'info';
}

const toFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const formatNumber = (value: number | undefined, fractionDigits = 2): string => {
  const safe = value ?? 0;
  return safe.toFixed(fractionDigits);
};

const createAlertId = (() => {
  let seed = 0;
  return () => {
    seed += 1;
    return `va_${Date.now()}_${seed.toString().padStart(4, '0')}`;
  };
})();

export const costVarianceService = {
  getProjectConfig(projectId: string): ProjectVarianceConfig {
    const cfg = loadConfig();
    if (!cfg[projectId]) {
      cfg[projectId] = {
        projectId,
        enabled: true,
        thresholds: { ...DEFAULT_THRESHOLDS },
        lastUpdated: new Date().toISOString()
      };
      saveConfig(cfg);
    }
    return cfg[projectId];
  },

  updateProjectConfig(projectId: string, patch: Partial<ProjectVarianceConfig>) {
    const cfg = loadConfig();
    const existing = this.getProjectConfig(projectId);
    cfg[projectId] = { ...existing, ...patch, lastUpdated: new Date().toISOString() };
    saveConfig(cfg);
    bus.emit(APP_EVENTS.COST_ENVELOPE_UPDATED, { projectId });
    return cfg[projectId];
  },

  analyzeProject(projectId: string, opts: { force?: boolean } = {}) {
    const env = projectCostService.getEnvelope(projectId);
    if (!env?.draft) return { alerts: [], stats: { itemsAnalyzed: 0, triggered: 0, projectVariancePct: 0, projectVarianceValue: 0 } };
    const draft = env.draft;
    const config = this.getProjectConfig(projectId);
    if (!config.enabled) return { alerts: [], stats: { itemsAnalyzed: draft.items.length, triggered: 0, projectVariancePct: draft.totals.variancePct, projectVarianceValue: draft.totals.varianceTotal } };

    const cache = loadCache();
    if (!opts.force && cache[projectId]) {
      // يمكن لاحقاً إضافة منطق صلاحية زمنية
    }

    const alerts: VarianceAlert[] = [];
    const thresholds = config.thresholds;

    // تحليل البنود
    for (const item of draft.items) {
      const category = item.category ?? 'uncategorized';
      const catTh = config.categoryOverrides?.[category] ?? {};
      const itemPctLimit = catTh.itemVariancePct ?? thresholds.itemVariancePct;
      const itemValueLimit = catTh.itemVarianceValue ?? thresholds.itemVarianceValue;
      const variancePct = toFiniteNumber(item.variance?.pct);
      const varianceValue = toFiniteNumber(item.variance?.value);
      const exceedsPct = itemPctLimit !== undefined && variancePct !== undefined && Math.abs(variancePct) >= itemPctLimit;
      const exceedsValue = itemValueLimit !== undefined && varianceValue !== undefined && Math.abs(varianceValue) >= itemValueLimit;
      if (exceedsPct || exceedsValue) {
        const pctForLevel = variancePct ?? 0;
        alerts.push({
            id: createAlertId(),
            projectId,
            level: classify(itemPctLimit ?? 10, Math.abs(pctForLevel)),
            type: 'item-variance',
            message: `انحراف في البند: ${item.description} بنسبة ${formatNumber(variancePct, 1)}% (قيمة: ${formatNumber(varianceValue)})`,
            costItemId: item.id,
            category,
            variancePct,
            varianceValue,
            createdAt: new Date().toISOString()
        });
      }
    }

    // تحليل إجمالي المشروع
    const projectVariancePct = toFiniteNumber(draft.totals?.variancePct) ?? 0;
    const projectVarianceValue = toFiniteNumber(draft.totals?.varianceTotal) ?? 0;
    if (thresholds.projectVariancePct !== undefined && Math.abs(projectVariancePct) >= thresholds.projectVariancePct) {
      alerts.push({
        id: createAlertId(),
        projectId,
        level: classify(thresholds.projectVariancePct, Math.abs(projectVariancePct)),
        type: 'project-variance',
        message: `انحراف إجمالي للمشروع بنسبة ${projectVariancePct.toFixed(1)}% (قيمة: ${projectVarianceValue.toFixed(2)})`,
        variancePct: projectVariancePct,
        varianceValue: projectVarianceValue,
        createdAt: new Date().toISOString()
      });
    }

    // تحليل تآكل الربح
    const erosionPct = toFiniteNumber(env.meta.metrics?.erosionPct);
    const erosionValue = toFiniteNumber(env.meta.metrics?.erosionValue);
    if (erosionPct !== undefined && thresholds.erosionPct !== undefined && Math.abs(erosionPct) >= thresholds.erosionPct) {
      alerts.push({
        id: createAlertId(),
        projectId,
        level: classify(thresholds.erosionPct, Math.abs(erosionPct)),
        type: 'profit-erosion',
        message: `تآكل الربح بلغ ${erosionPct.toFixed(1)}% (قيمة: ${formatNumber(erosionValue)})`,
        erosionPct,
        erosionValue,
        createdAt: new Date().toISOString()
      });
    }

    cache[projectId] = {
      projectId,
      runAt: new Date().toISOString(),
      alerts,
      stats: {
        itemsAnalyzed: draft.items.length,
        triggered: alerts.length,
        projectVariancePct,
        projectVarianceValue,
        erosionPct,
        erosionValue
      }
    };
    saveCache(cache);
    bus.emit(APP_EVENTS.COST_ENVELOPE_UPDATED, { projectId });
    return cache[projectId];
  },

  getCachedAnalysis(projectId: string) {
    const cache = loadCache();
    return cache[projectId] ?? null;
  }
};
