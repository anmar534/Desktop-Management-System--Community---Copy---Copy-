import type { ITenderRepository } from '../tender.repository';
import type { Tender } from '@/data/centralData';
import { safeLocalStorage } from '@/shared/utils/storage/storage';
import { STORAGE_KEYS } from '@/shared/config/storageKeys';
import { migrateTenderStatus, needsMigration } from '@/shared/utils/tender/tenderStatusMigration';
import { getRelationRepository } from '@/application/services/serviceRegistry';
import { bus, APP_EVENTS, emit } from '@/events/bus';
import {
  sanitizeTenderCollection,
  validateTender,
  validateTenderPayload,
  validateTenderUpdate
} from '@/domain/validation';

const allowedStatuses: Tender['status'][] = [
  'new',
  'under_action',
  'ready_to_submit',
  'submitted',
  'won',
  'lost',
  'expired',
  'cancelled',
];

const generateId = () => `tender_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

const isDifferent = (a: Tender, b: Tender): boolean => JSON.stringify(a) !== JSON.stringify(b);

const normalizeTender = (tender: Tender): Tender => {
  let status = tender.status;
  if (needsMigration(tender)) {
    status = migrateTenderStatus(status as string);
  }
  if (!allowedStatuses.includes(status)) {
    status = 'new';
  }
  return { ...tender, status };
};

const persist = (tenders: Tender[]): void => {
  safeLocalStorage.setItem(STORAGE_KEYS.TENDERS, tenders);
};

const loadAll = (): Tender[] => {
  const stored = safeLocalStorage.getItem<Tender[]>(STORAGE_KEYS.TENDERS, []);
  if (!Array.isArray(stored)) {
    return [];
  }

  let shouldPersist = false;
  const normalized = stored.map(entry => {
    const normalizedTender = normalizeTender({ ...entry });
    if (!shouldPersist && isDifferent(entry, normalizedTender)) {
      shouldPersist = true;
    }
    return normalizedTender;
  });

  const sanitized = sanitizeTenderCollection(normalized);

  if (sanitized.length !== normalized.length || hasDifferences(normalized, sanitized)) {
    shouldPersist = true;
  }

  if (shouldPersist) {
    persist(sanitized);
  }

  return sanitized;
};

const emitTendersUpdated = <T>(detail: T) => {
  bus.emit(APP_EVENTS.TENDERS_UPDATED, detail);
  emit(APP_EVENTS.TENDERS_UPDATED, detail);
};

const emitTenderUpdated = <T>(detail: T) => {
  bus.emit(APP_EVENTS.TENDER_UPDATED, detail);
  emit(APP_EVENTS.TENDER_UPDATED, detail);
};

const hasDifferences = (original: Tender[], sanitized: Tender[]): boolean => {
  if (original.length !== sanitized.length) {
    return true;
  }

  for (let index = 0; index < original.length; index += 1) {
    if (JSON.stringify(original[index]) !== JSON.stringify(sanitized[index])) {
      return true;
    }
  }

  return false;
};

export class LocalTenderRepository implements ITenderRepository {
  async getAll(): Promise<Tender[]> {
    return loadAll();
  }

  async getById(id: string): Promise<Tender | null> {
    const tenders = loadAll();
    const tender = tenders.find(entry => entry.id === id);
    return tender ? { ...tender } : null;
  }

  async getByProjectId(projectId: string): Promise<Tender | null> {
    const relationRepository = getRelationRepository();
    const tenderId = relationRepository.getTenderIdByProjectId(projectId);
    if (!tenderId) {
      return null;
    }
    return this.getById(tenderId);
  }

  async create(data: Omit<Tender, 'id'>): Promise<Tender> {
    const tenders = loadAll();
    const payload = validateTenderPayload(data);
    const tender = validateTender(
      normalizeTender({
        ...payload,
        id: generateId(),
      }),
    );
    tenders.push(tender);
    persist(tenders);
    const detail = { action: 'create' as const, tender };
    emitTendersUpdated(detail);
    return tender;
  }

  async update(id: string, updates: Partial<Tender>): Promise<Tender | null> {
    const tenders = loadAll();
    const index = tenders.findIndex(entry => entry.id === id);

    if (index === -1) {
      return null;
    }

    const sanitizedUpdates = validateTenderUpdate({ ...updates, id });
    const updated = validateTender(
      normalizeTender({ ...tenders[index], ...sanitizedUpdates, id }),
    );
    tenders[index] = updated;
    persist(tenders);
    const detail = { action: 'update' as const, tenderId: id, tender: updated };
    emitTendersUpdated(detail);
    emitTenderUpdated(detail);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const tenders = loadAll();
    const nextTenders = tenders.filter(entry => entry.id !== id);

    if (nextTenders.length === tenders.length) {
      return false;
    }

    persist(nextTenders);
    const relationRepository = getRelationRepository();
    relationRepository.unlinkTender(id);
    const detail = { action: 'delete' as const, tenderId: id };
    emitTendersUpdated(detail);
    return true;
  }

  async search(query: string): Promise<Tender[]> {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      return this.getAll();
    }

    const lowercaseQuery = trimmed.toLowerCase();
    const tenders = await this.getAll();

    const matches = (value?: string) => (value ?? '').toLowerCase().includes(lowercaseQuery);

    return tenders.filter(tender =>
      matches(tender.name) || matches(tender.client) || matches(tender.title)
    );
  }
}

export const tenderRepository = new LocalTenderRepository();
