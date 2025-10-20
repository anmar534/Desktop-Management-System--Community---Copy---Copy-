import { STORAGE_KEYS } from '@/config/storageKeys';
import { secureStore } from './secureStore';
import { cloneValue, decodeStoredValue, encodeValueForStorage } from './storageSchema';

const AUDIT_LOG_KEY = STORAGE_KEYS.SECURITY_AUDIT_LOG;
const MAX_EVENTS = 500;

export type AuditEventLevel = 'info' | 'warning' | 'error';
export type AuditEventStatus = 'success' | 'error' | 'skipped';

export interface AuditEvent {
  id: string;
  timestamp: string;
  category: string;
  action: string;
  key: string;
  status: AuditEventStatus;
  level: AuditEventLevel;
  actor: string;
  origin: string;
  metadata?: Record<string, string>;
}

export interface AuditEventInput {
  category: string;
  action: string;
  key: string;
  status?: AuditEventStatus;
  level?: AuditEventLevel;
  actor?: string;
  origin?: string;
  metadata?: Record<string, unknown>;
}

type AuditLogListener = (events: AuditEvent[]) => void;

const listeners = new Set<AuditLogListener>();

const notifyListeners = (events: AuditEvent[]): void => {
  if (listeners.size === 0) {
    return;
  }

  const snapshot = cloneValue(events);

  for (const listener of listeners) {
    try {
      listener(snapshot);
    } catch (error) {
      console.warn('⚠️ Failed to notify audit log listener:', error);
    }
  }
};

const generateId = (): string => {
  const cryptoCandidate = globalThis.crypto as { randomUUID?: () => string } | undefined;
  if (typeof cryptoCandidate?.randomUUID === 'function') {
    return cryptoCandidate.randomUUID();
  }
  return `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const normalizeMetadata = (metadata: Record<string, unknown> | undefined): Record<string, string> | undefined => {
  if (!metadata) {
    return undefined;
  }

  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (typeof key !== 'string' || key.trim() === '') {
      continue;
    }

    if (value === null || value === undefined) {
      continue;
    }

    if (typeof value === 'string') {
      normalized[key] = value;
      continue;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      normalized[key] = String(value);
      continue;
    }

    try {
      normalized[key] = JSON.stringify(value);
    } catch {
      normalized[key] = String(value);
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
};

const loadEvents = async (): Promise<AuditEvent[]> => {
  const stored = await secureStore.get<unknown>(AUDIT_LOG_KEY);
  if (stored === undefined) {
    return [];
  }

  const decoded = decodeStoredValue<AuditEvent[]>(AUDIT_LOG_KEY, stored);
  if (!Array.isArray(decoded.value)) {
    return [];
  }

  if (decoded.shouldPersist) {
    const encoded = encodeValueForStorage(AUDIT_LOG_KEY, decoded.value);
    await secureStore.set(AUDIT_LOG_KEY, encoded.envelope);
  }

  return cloneValue(decoded.value).sort((a, b) => {
    const timeA = Date.parse(a.timestamp);
    const timeB = Date.parse(b.timestamp);
    return timeA - timeB;
  });
};

export const getAuditEvents = async (): Promise<AuditEvent[]> => {
  return await loadEvents();
};

export const recordAuditEvent = async (input: AuditEventInput): Promise<void> => {
  const events = await loadEvents();

  const event: AuditEvent = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    category: input.category || 'storage',
    action: input.action,
    key: input.key,
    status: input.status ?? 'success',
    level: input.level ?? (input.status === 'error' ? 'error' : 'info'),
    actor: input.actor ?? 'system',
    origin: input.origin ?? 'renderer'
  };

  const metadata = normalizeMetadata(input.metadata);
  if (metadata) {
    event.metadata = metadata;
  }

  const next = [...events, event];
  const trimmed =
    next.length > MAX_EVENTS ? next.slice(next.length - MAX_EVENTS) : next;

  const encoded = encodeValueForStorage(AUDIT_LOG_KEY, trimmed);
  await secureStore.set(AUDIT_LOG_KEY, encoded.envelope);
  notifyListeners(trimmed);
};

export const clearAuditLog = async (): Promise<void> => {
  const encoded = encodeValueForStorage(AUDIT_LOG_KEY, []);
  await secureStore.set(AUDIT_LOG_KEY, encoded.envelope);
  notifyListeners([]);
};

export const subscribeToAuditLog = (listener: AuditLogListener): (() => void) => {
  listeners.add(listener);

  void (async () => {
    try {
      const current = await loadEvents();
      listener(cloneValue(current));
    } catch (error) {
      console.warn('⚠️ Failed to fetch audit log snapshot for subscriber:', error);
    }
  })();

  return () => {
    listeners.delete(listener);
  };
};