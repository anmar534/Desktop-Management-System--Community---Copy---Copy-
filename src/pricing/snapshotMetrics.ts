// Snapshot Metrics & Instrumentation (Phase 5)
// هدف: جمع عدادات أساسية لاستخدامها في مراقبة استقرار مسار الـ Snapshot ثم يمكن لاحقاً إرسالها لتحليلات خارجية.

export interface SnapshotMetricsState {
  createdBy: Record<string, number>; // migration/authoring/rebuild
  integrityFailures: number;
  rebuilds: number;
  lastCreationAt?: string;
  lastRebuildAt?: string;
  lastFailureAt?: string;
  totalSnapshots: number;
}

const DEFAULT_STATE: SnapshotMetricsState = {
  createdBy: { migration: 0, authoring: 0, rebuild: 0 },
  integrityFailures: 0,
  rebuilds: 0,
  totalSnapshots: 0
};

const METRICS_STORE_KEY = '__PRICING_SNAPSHOT_METRICS__' as const;

interface SnapshotMetricsWindow extends Window {
  [METRICS_STORE_KEY]?: SnapshotMetricsState;
}

const getMetricsWindow = (): SnapshotMetricsWindow | undefined => {
  if (typeof window === 'undefined') return undefined;
  return window as SnapshotMetricsWindow;
};

// نخزنها في نافذة المتصفح لتكون متاحة أثناء الجلسة (خيار سريع بدون تخزين دائم حاليًا)
function getStore(): SnapshotMetricsState {
  const metricsWindow = getMetricsWindow();
  if (!metricsWindow) return { ...DEFAULT_STATE };

  if (!metricsWindow[METRICS_STORE_KEY]) {
    metricsWindow[METRICS_STORE_KEY] = { ...DEFAULT_STATE };
  }

  return metricsWindow[METRICS_STORE_KEY] as SnapshotMetricsState;
}

function emitUpdate() {
  const metricsWindow = getMetricsWindow();
  if (!metricsWindow) return;

  const state = getStore();
  metricsWindow.dispatchEvent(
    new CustomEvent('pricingSnapshotMetricsUpdated', { detail: { metrics: { ...state } } })
  );
}

export function recordSnapshotCreation(source: 'migration' | 'authoring' | 'rebuild') {
  const s = getStore();
  s.createdBy[source] = (s.createdBy[source] || 0) + 1;
  s.totalSnapshots += 1;
  s.lastCreationAt = new Date().toISOString();
  if (source === 'rebuild') s.lastRebuildAt = s.lastCreationAt;
  emitUpdate();
}

export function recordIntegrityFailure() {
  const s = getStore();
  s.integrityFailures += 1;
  s.lastFailureAt = new Date().toISOString();
  emitUpdate();
}

export function recordRebuild() {
  const s = getStore();
  s.rebuilds += 1;
  s.lastRebuildAt = new Date().toISOString();
  emitUpdate();
}

export function getSnapshotMetrics(): SnapshotMetricsState {
  return { ...getStore() };
}

// أداة مساعدة للعرض البسيط (يمكن استدعاؤها في وحدة تحكم المطور)
export function logSnapshotMetrics(prefix = '[SnapshotMetrics]') {
  const s = getStore();
  // eslint-disable-next-line no-console
  console.info(prefix, s);
}
