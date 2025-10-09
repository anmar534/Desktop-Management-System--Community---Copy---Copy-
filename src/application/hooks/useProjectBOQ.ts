import { useCallback, useEffect, useState } from 'react';
import { projectCostService } from '@/application/services/projectCostService';
import type {
  ProjectBOQData,
  ProjectBOQEnvelopeMeta,
  ProjectCostEnvelope,
  ProjectCostItem,
} from '@/application/services/projectCostService';
import { getTenderRepository } from '@/application/services/serviceRegistry';
import { APP_EVENTS } from '@/events/bus';
import { useRepository } from '@/application/services/RepositoryProvider';

type MergeFromTenderResult = Awaited<ReturnType<typeof projectCostService.mergeFromTender>>;

interface UseProjectBOQResult {
  loading: boolean;
  draft: ProjectBOQData | null;
  official: ProjectBOQData | null;
  meta: ProjectBOQEnvelopeMeta | null;
  ensure: () => void;
  mergeFromTender: (tenderId: string) => Promise<MergeFromTenderResult>;
  promote: () => Promise<void>;
  upsertItem: (item: Partial<ProjectCostItem> & { id?: string }) => void;
  refresh: () => void;
}

/**
 * Hook لإدارة BOQ الخاص بالمشروع (Draft / Official)
 * ملاحظة: واجهة أولية للمرحلة المبكرة - سيتم تحسين الأنواع لاحقاً.
 */
export function useProjectBOQ(projectId: string): UseProjectBOQResult {
  const [loading, setLoading] = useState(true);
  const [envelope, setEnvelope] = useState<ProjectCostEnvelope | null>(null);
  const tenderRepository = useRepository(getTenderRepository);

  const cloneEnvelope = useCallback((env: ProjectCostEnvelope | null) => {
    if (!env) return null;
    try {
      return JSON.parse(JSON.stringify(env)) as ProjectCostEnvelope;
    } catch {
      // fallback للحالات التي تحتوي على مراجع دائرية (غير متوقع حالياً)
      return { ...env } as ProjectCostEnvelope;
    }
  }, []);

  const load = useCallback(() => {
    const env = projectCostService.getEnvelope(projectId);
    setEnvelope(cloneEnvelope(env));
  }, [projectId, cloneEnvelope]);

  const ensure = useCallback(() => {
    const existing = projectCostService.getEnvelope(projectId);
    const env = existing ?? projectCostService.initEnvelope(projectId, {});
    setEnvelope(cloneEnvelope(env));
  }, [projectId, cloneEnvelope]);

  const refresh = useCallback(() => {
    load();
  }, [load]);

  useEffect(() => {
    ensure();
    setLoading(false);
  }, [ensure]);

  // استمع لتحديثات عامة (مشاريع أو BOQ أو تكلفة)
  useEffect(() => {
    const handler = () => load();
    if (typeof window !== 'undefined') {
      window.addEventListener(APP_EVENTS.BOQ_UPDATED, handler);
      window.addEventListener(APP_EVENTS.PROJECTS_UPDATED, handler);
      window.addEventListener(APP_EVENTS.COST_ENVELOPE_UPDATED, handler);
      return () => {
        window.removeEventListener(APP_EVENTS.BOQ_UPDATED, handler);
        window.removeEventListener(APP_EVENTS.PROJECTS_UPDATED, handler);
        window.removeEventListener(APP_EVENTS.COST_ENVELOPE_UPDATED, handler);
      };
    }
  }, [load]);

  const mergeFromTender = useCallback(async (tenderId: string) => {
    const tender = await tenderRepository.getById(tenderId);
    if (!tender) {
      throw new Error('Tender not found');
    }
    const result = await projectCostService.mergeFromTender(projectId, tenderId);
    load();
    return result;
  }, [load, projectId, tenderRepository]);

  const promote = useCallback(async () => {
    await projectCostService.promote(projectId);
    load();
  }, [projectId, load]);

  const upsertItem = useCallback((item: Partial<ProjectCostItem> & { id?: string }) => {
    projectCostService.upsertItem(projectId, item);
    load();
  }, [projectId, load]);

  return {
    loading,
    draft: envelope?.draft ?? null,
    official: envelope?.official ?? null,
    meta: envelope?.meta ?? null,
    ensure,
    mergeFromTender,
    promote,
    upsertItem,
    refresh
  };
}
