const path = require('path');

const STORAGE_KEY_PATTERN = /^[a-z0-9._:-]+$/i;
const MAX_SERIALIZED_PAYLOAD_SIZE = 512 * 1024; // 512 KB
const MAX_STRING_LENGTH = 200_000;
const MAX_CONTAINER_DEPTH = 20;
const ALLOWED_DIALOG_PROPERTIES = new Set([
  'openFile',
  'openDirectory',
  'multiSelections',
  'showHiddenFiles',
  'createDirectory',
  'promptToCreate',
  'treatPackageAsDirectory',
  'dontAddToRecent'
]);
const ALLOWED_SAVE_DIALOG_PROPERTIES = new Set([
  'showHiddenFiles',
  'createDirectory',
  'treatPackageAsDirectory',
  'dontAddToRecent'
]);
const MAX_REDACT_PREVIEW_LENGTH = 512;
const DESKTOP_ACTIONS = new Set(['notify', 'drag-intent', 'export']);
const ALLOWED_NOTIFICATION_SEVERITIES = new Set(['info', 'success', 'warning', 'error', 'urgent', 'reminder']);
const MAX_NOTIFICATION_TITLE_LENGTH = 160;
const MAX_NOTIFICATION_MESSAGE_LENGTH = 512;
const MAX_NOTIFICATION_DESCRIPTION_LENGTH = 512;
const MAX_NOTIFICATION_ACTION_LENGTH = 48;
const MAX_DRAG_FILES = 15;
const MAX_DRAG_TOTAL_BYTES = 50 * 1024 * 1024;
const MAX_DRAG_FILE_BYTES = 12 * 1024 * 1024;
const MAX_EXPORT_FILENAME_LENGTH = 120;
const MAX_EXPORT_BYTES = 20 * 1024 * 1024;
const ALLOWED_EXPORT_FORMATS = new Set(['csv', 'json', 'xlsx', 'pdf']);

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const ensureString = (value, field, { allowEmpty = false } = {}) => {
  if (typeof value !== 'string') {
    throw new Error(`${field} must be a string`);
  }

  if (value.includes('\0')) {
    throw new Error(`${field} contains null bytes`);
  }

  const trimmed = value.trim();

  if (!allowEmpty && trimmed.length === 0) {
    throw new Error(`${field} cannot be empty`);
  }

  if (trimmed.length > MAX_STRING_LENGTH) {
    throw new Error(`${field} is too long`);
  }

  return trimmed;
};

const ensureStorageKey = (value) => {
  const key = ensureString(value, 'storage key');
  if (!STORAGE_KEY_PATTERN.test(key)) {
    throw new Error('storage key contains invalid characters');
  }
  return key;
};

const ensureFiniteNumber = (value, field) => {
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number`);
  }
};

const checkSerializable = (value, depth = 0) => {
  if (depth > MAX_CONTAINER_DEPTH) {
    throw new Error('payload nesting depth exceeded');
  }

  if (value === null || value === undefined) {
    return;
  }

  const valueType = typeof value;

  if (valueType === 'function' || valueType === 'symbol') {
    throw new Error('payload contains unsupported type');
  }

  if (valueType === 'bigint') {
    throw new Error('bigint values are not supported in IPC payloads');
  }

  if (valueType === 'number') {
    ensureFiniteNumber(value, 'number');
    return;
  }

  if (valueType === 'string') {
    if (value.length > MAX_STRING_LENGTH) {
      throw new Error('string payload segment is too large');
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      checkSerializable(item, depth + 1);
    }
    return;
  }

  if (isPlainObject(value)) {
    for (const entry of Object.values(value)) {
      checkSerializable(entry, depth + 1);
    }
    return;
  }

  if (valueType === 'object') {
    throw new Error('payload contains unsupported object type');
  }
};

const ensureSerializable = (value, field = 'payload') => {
  checkSerializable(value);
  let serialized = '';
  try {
    serialized = JSON.stringify(value);
  } catch (error) {
    throw new Error(`${field} must be JSON-serializable`);
  }

  if (Buffer.byteLength(serialized, 'utf8') > MAX_SERIALIZED_PAYLOAD_SIZE) {
    throw new Error(`${field} exceeds maximum allowed size`);
  }

  return value;
};

const sanitizePath = (value, field = 'filePath') => {
  const candidate = ensureString(value, field);
  if (candidate.length > 4096) {
    throw new Error(`${field} is too long`);
  }
  const normalized = path.resolve(candidate);
  return normalized;
};

const sanitizeFilters = (filters) => {
  if (!Array.isArray(filters)) {
    return undefined;
  }

  const sanitized = [];

  for (const filter of filters) {
    if (!isPlainObject(filter)) {
      continue;
    }

    const { name, extensions } = filter;
    const sanitizedName = ensureString(name ?? 'untitled', 'filter name', { allowEmpty: true });

    if (!Array.isArray(extensions) || extensions.length === 0) {
      continue;
    }

    const sanitizedExtensions = [];

    for (const ext of extensions) {
      if (typeof ext !== 'string') {
        continue;
      }
      let normalized = ext.trim();
      if (!normalized) {
        continue;
      }
      if (normalized.includes('\0')) {
        continue;
      }
      normalized = normalized.replace(/^\./, '');
      if (!normalized) {
        continue;
      }
      if (normalized.length > 32) {
        normalized = normalized.slice(0, 32);
      }
      sanitizedExtensions.push(normalized);
    }

    if (sanitizedExtensions.length === 0) {
      continue;
    }

    sanitized.push({
      name: sanitizedName,
      extensions: sanitizedExtensions
    });
  }

  return sanitized.length > 0 ? sanitized : undefined;
};

const sanitizeDialogProperties = (properties, mode) => {
  if (!Array.isArray(properties)) {
    return undefined;
  }

  const allowed = mode === 'save' ? ALLOWED_SAVE_DIALOG_PROPERTIES : ALLOWED_DIALOG_PROPERTIES;
  const unique = new Set();

  for (const property of properties) {
    if (typeof property !== 'string') {
      continue;
    }
    const normalized = property.trim();
    if (allowed.has(normalized)) {
      unique.add(normalized);
    }
  }

  return unique.size > 0 ? Array.from(unique) : undefined;
};

const sanitizeDialogOptions = (options = {}, mode = 'open') => {
  if (!isPlainObject(options)) {
    return {};
  }

  const sanitized = {};

  if (options.title !== undefined) {
    sanitized.title = ensureString(options.title, 'dialog title', { allowEmpty: true });
  }

  if (options.defaultPath !== undefined) {
    sanitized.defaultPath = sanitizePath(options.defaultPath, 'dialog defaultPath');
  }

  const filters = sanitizeFilters(options.filters);
  if (filters) {
    sanitized.filters = filters;
  }

  const properties = sanitizeDialogProperties(options.properties, mode);
  if (properties) {
    sanitized.properties = properties;
  }

  if (mode === 'save' && options.buttonLabel !== undefined) {
    sanitized.buttonLabel = ensureString(options.buttonLabel, 'dialog button label', { allowEmpty: false });
  }

  if (mode === 'save' && options.nameFieldLabel !== undefined) {
    sanitized.nameFieldLabel = ensureString(options.nameFieldLabel, 'dialog name field label', { allowEmpty: false });
  }

  return sanitized;
};

const sanitizeFileName = (value, field, { fallback = 'file' } = {}) => {
  const raw = ensureString(value ?? fallback, field, { allowEmpty: true });
  let name = raw.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').trim();

  if (!name) {
    name = fallback;
  }

  if (name.length > MAX_EXPORT_FILENAME_LENGTH) {
    name = name.slice(0, MAX_EXPORT_FILENAME_LENGTH);
  }

  while (name.endsWith('.')) {
    name = name.slice(0, -1);
  }

  if (!name) {
    name = fallback;
  }

  return name;
};

const sanitizeNotificationPayload = (value = {}) => {
  if (!isPlainObject(value)) {
    throw new Error('notification payload must be an object');
  }

  const severityRaw = ensureString(value.severity ?? 'info', 'notification severity');
  const severity = ALLOWED_NOTIFICATION_SEVERITIES.has(severityRaw) ? severityRaw : 'info';

  const title = ensureString(value.title ?? '', 'notification title').slice(0, MAX_NOTIFICATION_TITLE_LENGTH);
  const message = ensureString(value.message ?? '', 'notification message').slice(0, MAX_NOTIFICATION_MESSAGE_LENGTH);

  const payload = {
    severity,
    title,
    message
  };

  if (value.description !== undefined) {
    payload.description = ensureString(value.description, 'notification description', { allowEmpty: true }).slice(0, MAX_NOTIFICATION_DESCRIPTION_LENGTH);
  }

  if (value.actionLabel !== undefined) {
    payload.actionLabel = ensureString(value.actionLabel, 'notification action label').slice(0, MAX_NOTIFICATION_ACTION_LENGTH);
  }

  if (value.scope !== undefined) {
    payload.scope = ensureString(value.scope, 'notification scope', { allowEmpty: true }).slice(0, 64);
  }

  if (value.correlationId !== undefined) {
    payload.correlationId = ensureString(value.correlationId, 'notification correlationId', { allowEmpty: true }).slice(0, 64);
  }

  if (value.durationMs !== undefined) {
    if (typeof value.durationMs !== 'number' || !Number.isFinite(value.durationMs) || value.durationMs < 0) {
      throw new Error('notification durationMs must be a non-negative number');
    }
    payload.durationMs = Math.min(Math.floor(value.durationMs), 30_000);
  }

  if (value.metadata !== undefined) {
    payload.metadata = ensureSerializable(value.metadata, 'notification metadata');
  }

  return payload;
};

const sanitizeDragPayload = (value = {}) => {
  if (!isPlainObject(value)) {
    throw new Error('drag payload must be an object');
  }

  const intent = ensureString(value.intent ?? 'unspecified', 'drag intent');

  if (!Array.isArray(value.files) || value.files.length === 0) {
    throw new Error('drag payload requires at least one file');
  }

  if (value.files.length > MAX_DRAG_FILES) {
    throw new Error('drag payload exceeds maximum file count');
  }

  let totalBytes = 0;

  const files = value.files.map((file, index) => {
    if (!isPlainObject(file)) {
      throw new Error(`drag file #${index + 1} must be an object`);
    }

    const name = sanitizeFileName(file.name, `drag file #${index + 1} name`, {
      fallback: `file-${index + 1}`
    });

    const type = file.type !== undefined
      ? ensureString(file.type, `drag file #${index + 1} type`, { allowEmpty: true }).slice(0, 128)
      : '';

    const sizeRaw = file.size;
    if (typeof sizeRaw !== 'number' || !Number.isFinite(sizeRaw) || sizeRaw < 0) {
      throw new Error(`drag file #${index + 1} size must be a non-negative number`);
    }

    const size = Math.min(Math.floor(sizeRaw), MAX_DRAG_FILE_BYTES);
    totalBytes += size;

    const sanitizedFile = { name, type, size };

    if (file.metadata !== undefined) {
      sanitizedFile.metadata = ensureSerializable(file.metadata, `drag file #${index + 1} metadata`);
    }

    return sanitizedFile;
  });

  if (totalBytes > MAX_DRAG_TOTAL_BYTES) {
    throw new Error('drag payload exceeds maximum aggregate size');
  }

  const sanitized = {
    intent,
    files
  };

  if (value.source !== undefined) {
    sanitized.source = ensureString(value.source, 'drag source', { allowEmpty: true }).slice(0, 32);
  }

  if (value.tenderId !== undefined) {
    sanitized.tenderId = ensureString(value.tenderId, 'drag tenderId', { allowEmpty: true }).slice(0, 64);
  }

  if (value.metadata !== undefined) {
    sanitized.metadata = ensureSerializable(value.metadata, 'drag metadata');
  }

  return sanitized;
};

const sanitizeExportPayload = (value = {}) => {
  if (!isPlainObject(value)) {
    throw new Error('export payload must be an object');
  }

  const formatRaw = ensureString(value.format ?? 'csv', 'export format');
  if (!ALLOWED_EXPORT_FORMATS.has(formatRaw)) {
    throw new Error('unsupported export format');
  }

  const filename = sanitizeFileName(value.filename, 'export filename', { fallback: 'export' });

  const payload = {
    format: formatRaw,
    filename
  };

  if (value.bytes !== undefined) {
    if (typeof value.bytes !== 'number' || !Number.isFinite(value.bytes) || value.bytes < 0) {
      throw new Error('export bytes must be a non-negative number');
    }
    if (value.bytes > MAX_EXPORT_BYTES) {
      throw new Error('export payload exceeds maximum size');
    }
    payload.bytes = Math.floor(value.bytes);
  }

  if (value.rows !== undefined) {
    if (typeof value.rows !== 'number' || !Number.isFinite(value.rows) || value.rows < 0) {
      throw new Error('export rows must be a non-negative number');
    }
    payload.rows = Math.floor(value.rows);
  }

  if (value.origin !== undefined) {
    payload.origin = ensureString(value.origin, 'export origin', { allowEmpty: true }).slice(0, 120);
  }

  if (value.metadata !== undefined) {
    payload.metadata = ensureSerializable(value.metadata, 'export metadata');
  }

  return payload;
};

const sanitizeDesktopActionPayload = (value) => {
  if (!isPlainObject(value)) {
    throw new Error('desktop secure action must be an object');
  }

  const action = ensureString(value.action, 'desktop secure action');
  if (!DESKTOP_ACTIONS.has(action)) {
    throw new Error('unsupported desktop action');
  }

  const sanitized = { action };

  if (action === 'notify') {
    sanitized.payload = sanitizeNotificationPayload(value.payload);
  } else if (action === 'drag-intent') {
    sanitized.payload = sanitizeDragPayload(value.payload);
  } else if (action === 'export') {
    sanitized.payload = sanitizeExportPayload(value.payload);
  }

  return sanitized;
};

const sanitizeLifecycleAckPayload = (value) => {
  if (!isPlainObject(value)) {
    throw new Error('lifecycle ack payload must be an object');
  }

  const sanitized = {
    id: ensureString(value.id, 'lifecycle ack id'),
    status: ensureString(value.status ?? 'ok', 'lifecycle ack status')
  };

  if (value.details !== undefined) {
    sanitized.details = ensureSerializable(value.details, 'lifecycle ack details');
  }

  if (value.elapsedMs !== undefined) {
    if (typeof value.elapsedMs !== 'number' || !Number.isFinite(value.elapsedMs) || value.elapsedMs < 0) {
      throw new Error('lifecycle ack elapsedMs must be a non-negative number');
    }
    sanitized.elapsedMs = value.elapsedMs;
  }

  return sanitized;
};

const ensureWritableData = (value) => {
  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value === 'string') {
    if (Buffer.byteLength(value, 'utf8') > MAX_SERIALIZED_PAYLOAD_SIZE) {
      throw new Error('file data exceeds maximum allowed size');
    }
    return value;
  }

  checkSerializable(value);

  let serialized;
  try {
    serialized = JSON.stringify(value, null, 2);
  } catch (error) {
    throw new Error('file data must be a string or JSON-serializable value');
  }

  if (Buffer.byteLength(serialized, 'utf8') > MAX_SERIALIZED_PAYLOAD_SIZE) {
    throw new Error('file data exceeds maximum allowed size');
  }

  return serialized;
};

const CHANNEL_RULES = {
  'store-get': (args) => {
    if (args.length !== 1) {
      throw new Error('store-get expects a single key argument');
    }
    return [ensureStorageKey(args[0])];
  },
  'store-set': (args) => {
    if (args.length !== 2) {
      throw new Error('store-set expects key and value arguments');
    }
    return [ensureStorageKey(args[0]), ensureSerializable(args[1], 'store value')];
  },
  'store-delete': (args) => {
    if (args.length !== 1) {
      throw new Error('store-delete expects a single key argument');
    }
    return [ensureStorageKey(args[0])];
  },
  'store-clear': (args) => {
    if (args.length !== 0) {
      throw new Error('store-clear does not accept arguments');
    }
    return [];
  },
  'secure-store-set': (args) => {
    if (args.length !== 2) {
      throw new Error('secure-store-set expects key and value arguments');
    }
    return [ensureStorageKey(args[0]), ensureSerializable(args[1], 'secure store value')];
  },
  'secure-store-get': (args) => {
    if (args.length !== 1) {
      throw new Error('secure-store-get expects a single key argument');
    }
    return [ensureStorageKey(args[0])];
  },
  'secure-store-delete': (args) => {
    if (args.length !== 1) {
      throw new Error('secure-store-delete expects a single key argument');
    }
    return [ensureStorageKey(args[0])];
  },
  'secure-store-clear': (args) => {
    if (args.length !== 0) {
      throw new Error('secure-store-clear does not accept arguments');
    }
    return [];
  },
  'app-quit': (args) => {
    if (args.length !== 0) {
      throw new Error('app-quit does not accept arguments');
    }
    return [];
  },
  'app-minimize': (args) => {
    if (args.length !== 0) {
      throw new Error('app-minimize does not accept arguments');
    }
    return [];
  },
  'app-maximize': (args) => {
    if (args.length !== 0) {
      throw new Error('app-maximize does not accept arguments');
    }
    return [];
  },
  'app-close': (args) => {
    if (args.length !== 0) {
      throw new Error('app-close does not accept arguments');
    }
    return [];
  },
  'app-get-version': (args) => {
    if (args.length !== 0) {
      throw new Error('app-get-version does not accept arguments');
    }
    return [];
  },
  'fs-read-file': (args) => {
    if (args.length !== 1) {
      throw new Error('fs-read-file expects a single path argument');
    }
    return [sanitizePath(args[0])];
  },
  'fs-write-file': (args) => {
    if (args.length !== 2) {
      throw new Error('fs-write-file expects path and data arguments');
    }
    return [sanitizePath(args[0]), ensureWritableData(args[1])];
  },
  'fs-file-exists': (args) => {
    if (args.length !== 1) {
      throw new Error('fs-file-exists expects a single path argument');
    }
    return [sanitizePath(args[0])];
  },
  'dialog-open-file': (args) => {
    if (args.length > 1) {
      throw new Error('dialog-open-file accepts at most one argument');
    }
    return [sanitizeDialogOptions(args[0], 'open')];
  },
  'dialog-save-file': (args) => {
    if (args.length > 1) {
      throw new Error('dialog-save-file accepts at most one argument');
    }
    return [sanitizeDialogOptions(args[0], 'save')];
  },
  'security-get-csp-nonce': (args) => {
    if (args.length !== 0) {
      throw new Error('security-get-csp-nonce does not accept arguments');
    }
    return [];
  },
  'security-get-csp-nonce-sync': (args) => {
    if (args.length !== 0) {
      throw new Error('security-get-csp-nonce-sync does not accept arguments');
    }
    return [];
  },
  'desktop-secure-action': (args) => {
    if (args.length !== 1) {
      throw new Error('desktop-secure-action expects a single payload argument');
    }
    return [sanitizeDesktopActionPayload(args[0])];
  },
  'lifecycle-ack': (args) => {
    if (args.length !== 1) {
      throw new Error('lifecycle-ack expects a single payload argument');
    }
    return [sanitizeLifecycleAckPayload(args[0])];
  },
  // تحديثات التطبيق (لا تقبل معاملات)
  'check-for-updates': (args) => {
    if (args.length !== 0) {
      throw new Error('check-for-updates does not accept arguments');
    }
    return [];
  }
};

const validateIpcPayload = (channel, args = []) => {
  const validator = CHANNEL_RULES[channel];

  if (!validator) {
    return {
      ok: false,
      error: `unsupported channel: ${channel}`
    };
  }

  try {
    const sanitized = validator(Array.isArray(args) ? args : []);
    return {
      ok: true,
      args: sanitized
    };
  } catch (error) {
    return {
      ok: false,
      error: error && typeof error.message === 'string' ? error.message : String(error)
    };
  }
};

const createRedactReplacer = () => {
  const seen = new WeakSet();
  return (_key, value) => {
    if (typeof value === 'function') {
      return '[Function]';
    }
    if (typeof value === 'symbol') {
      return '[Symbol]';
    }
    if (typeof value === 'bigint') {
      return `[BigInt:${value.toString()}]`;
    }
    if (typeof value === 'string') {
      if (value.length > 120) {
        return `${value.slice(0, 117)}...`;
      }
      if (value.includes('\0')) {
        return value.replace(/\0/g, '');
      }
      return value;
    }
    if (value && typeof value === 'object') {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  };
};

const redactArgs = (args = []) => {
  try {
    const serialized = JSON.stringify(args, createRedactReplacer());
    if (serialized.length > MAX_REDACT_PREVIEW_LENGTH) {
      return `${serialized.slice(0, MAX_REDACT_PREVIEW_LENGTH)}…`;
    }
    return serialized;
  } catch {
    return '[unserializable]';
  }
};

module.exports = {
  validateIpcPayload,
  redactArgs,
  sanitizeDialogOptions, // exported for testing
  ensureWritableData // exported for testing
};
