type NotificationSeverity = 'info' | 'success' | 'warning' | 'error' | 'urgent' | 'reminder'

type DesktopSecureAction = 'notify' | 'drag-intent' | 'export'

type ExportFormat =
  | 'csv'
  | 'json'
  | 'xlsx'
  | 'xls'
  | 'pdf'
  | 'docx'
  | 'doc'
  | 'pptx'
  | 'ppt'
  | 'binary'

interface DesktopBridgeHandle {
  secureAction?: (payload: unknown) => Promise<unknown>
}

interface NotificationRequest {
  severity: NotificationSeverity
  title: string
  message: string
  description?: string
  actionLabel?: string
  scope?: string
  correlationId?: string
  metadata?: Record<string, unknown>
  durationMs?: number
}

interface NotificationResponse {
  allowed: boolean
  payload?: NotificationRequest
  reason?: string
}

interface DragFileDescriptor {
  name: string
  type: string
  size: number
  allowed?: boolean
  reason?: string
  metadata?: Record<string, unknown>
}

interface DragAuthorizationRequest {
  intent: string
  source?: string
  tenderId?: string
  files: Pick<DragFileDescriptor, 'name' | 'type' | 'size'>[]
  metadata?: Record<string, unknown>
}

interface DragAuthorizationResponse {
  allowed: boolean
  payload?: {
    intent?: string
    source?: string
    tenderId?: string
    files: DragFileDescriptor[]
  }
  reason?: string
}

interface ExportAuthorizationRequest {
  format: ExportFormat
  filename: string
  bytes?: number
  rows?: number
  origin?: string
  metadata?: Record<string, unknown>
}

interface ExportAuthorizationResponse {
  allowed: boolean
  payload?: ExportAuthorizationRequest
  reason?: string
}

const NOTIFICATION_MAX_TITLE = 160
const NOTIFICATION_MAX_MESSAGE = 512
const NOTIFICATION_MAX_DESCRIPTION = 512
const NOTIFICATION_MAX_ACTION = 48
const NOTIFICATION_MAX_DURATION = 30_000
const DRAG_MAX_FILES = 15
const DRAG_MAX_FILE_BYTES = 12 * 1024 * 1024
const DRAG_TOTAL_MAX_BYTES = 50 * 1024 * 1024
const EXPORT_MAX_BYTES = 20 * 1024 * 1024
const EXPORT_ALLOWED_FORMATS: readonly ExportFormat[] = [
  'csv',
  'json',
  'xlsx',
  'xls',
  'pdf',
  'docx',
  'doc',
  'pptx',
  'ppt',
  'binary',
]

const stripControlCharacters = (value: string) => {
  let result = ''
  for (let index = 0; index < value.length; index += 1) {
    const char = value.charAt(index)
    const code = char.charCodeAt(0)
    if (code >= 32 && code !== 127) {
      result += char
    }
  }
  return result
}

const sanitizeString = (
  value: unknown,
  maxLength: number,
  fallback = '',
  { allowEmpty = false } = {},
) => {
  if (value === undefined || value === null) {
    return fallback
  }

  const normalized = stripControlCharacters(String(value)).trim()

  if (!allowEmpty && normalized.length === 0) {
    return fallback
  }

  if (normalized.length > maxLength) {
    return normalized.slice(0, maxLength)
  }

  return normalized
}

const sanitizeFilename = (value: unknown, fallback = 'file') => {
  const normalized = sanitizeString(value, 120, fallback, { allowEmpty: true })
    .replace(/[<>:"/\\|?*]/g, '_')
    .trim()

  let name = normalized || fallback

  while (name.endsWith('.')) {
    name = name.slice(0, -1)
  }

  return name || fallback
}

const sanitizeMetadata = (metadata: Record<string, unknown> | undefined) => {
  if (!metadata || typeof metadata !== 'object') {
    return undefined
  }
  return metadata
}

const getDesktopBridge = () => {
  if (typeof window === 'undefined') {
    return undefined
  }

  return (window as unknown as { electronAPI?: { desktop?: DesktopBridgeHandle } }).electronAPI
    ?.desktop
}

const isElectron = () => typeof window !== 'undefined' && Boolean(getDesktopBridge()?.secureAction)

const callDesktopBridge = async <TPayload, TResult>(
  action: DesktopSecureAction,
  payload: TPayload,
) => {
  if (!isElectron()) {
    return {
      allowed: true,
      payload: payload as unknown as TResult,
    }
  }

  try {
    const rawResult = await getDesktopBridge()?.secureAction?.({ action, payload })

    if (rawResult && typeof rawResult === 'object') {
      const allowed = (rawResult as { allowed?: boolean }).allowed !== false
      const reason = (rawResult as { reason?: string }).reason
      const sanitizedPayload =
        (rawResult as { payload?: TResult }).payload ?? (payload as unknown as TResult)

      return {
        allowed,
        reason,
        payload: sanitizedPayload,
      }
    }
  } catch (error) {
    console.warn('[desktopSecurity] secure action bridge failed:', error)
  }

  return {
    allowed: true,
    payload: payload as unknown as TResult,
  }
}

const sanitizeNotificationRequest = (payload: NotificationRequest): NotificationRequest => {
  const severity: NotificationSeverity = [
    'info',
    'success',
    'warning',
    'error',
    'urgent',
    'reminder',
  ].includes(payload.severity)
    ? payload.severity
    : 'info'

  const title = sanitizeString(payload.title, NOTIFICATION_MAX_TITLE, '')
  const message = sanitizeString(payload.message, NOTIFICATION_MAX_MESSAGE, '')
  const description = sanitizeString(payload.description, NOTIFICATION_MAX_DESCRIPTION, '', {
    allowEmpty: true,
  })
  const actionLabel = sanitizeString(payload.actionLabel, NOTIFICATION_MAX_ACTION, '', {
    allowEmpty: true,
  })
  const scope = sanitizeString(payload.scope, 64, '', { allowEmpty: true })
  const correlationId = sanitizeString(payload.correlationId, 64, '', { allowEmpty: true })

  let durationMs = 0
  if (
    typeof payload.durationMs === 'number' &&
    Number.isFinite(payload.durationMs) &&
    payload.durationMs > 0
  ) {
    durationMs = Math.min(Math.floor(payload.durationMs), NOTIFICATION_MAX_DURATION)
  }

  return {
    severity,
    title,
    message,
    description: description || undefined,
    actionLabel: actionLabel || undefined,
    scope: scope || undefined,
    correlationId: correlationId || undefined,
    durationMs: durationMs || undefined,
    metadata: sanitizeMetadata(payload.metadata),
  }
}

const sanitizeDragRequest = (payload: DragAuthorizationRequest): DragAuthorizationRequest => {
  const intent = sanitizeString(payload.intent, 120, 'unspecified')
  const source = sanitizeString(payload.source, 32, '', { allowEmpty: true })
  const tenderId = sanitizeString(payload.tenderId, 64, '', { allowEmpty: true })

  const files = Array.isArray(payload.files) ? payload.files.slice(0, DRAG_MAX_FILES) : []

  let totalBytes = 0
  const sanitizedFiles = files.map((file, index) => {
    const name = sanitizeFilename(file?.name ?? `file-${index + 1}`)
    const type = sanitizeString(file?.type, 128, '', { allowEmpty: true })
    const size = Math.max(
      0,
      Math.min(Number.isFinite(file?.size) ? Number(file.size) : 0, DRAG_MAX_FILE_BYTES),
    )
    totalBytes += size

    return { name, type, size }
  })

  if (sanitizedFiles.length === 0) {
    throw new Error('drag authorization requires at least one file')
  }

  if (totalBytes > DRAG_TOTAL_MAX_BYTES) {
    throw new Error('drag authorization exceeds aggregate size limit')
  }

  return {
    intent,
    source: source || undefined,
    tenderId: tenderId || undefined,
    files: sanitizedFiles,
    metadata: sanitizeMetadata(payload.metadata),
  }
}

const sanitizeExportRequest = (payload: ExportAuthorizationRequest): ExportAuthorizationRequest => {
  const format = EXPORT_ALLOWED_FORMATS.includes(payload.format) ? payload.format : 'csv'
  const filename = sanitizeFilename(payload.filename, 'export')

  let bytes: number | undefined
  if (typeof payload.bytes === 'number' && Number.isFinite(payload.bytes) && payload.bytes >= 0) {
    bytes = Math.min(Math.floor(payload.bytes), EXPORT_MAX_BYTES)
  }

  let rows: number | undefined
  if (typeof payload.rows === 'number' && Number.isFinite(payload.rows) && payload.rows >= 0) {
    rows = Math.floor(payload.rows)
  }

  const origin = sanitizeString(payload.origin, 120, '', { allowEmpty: true })

  return {
    format: format as ExportAuthorizationRequest['format'],
    filename,
    bytes,
    rows,
    origin: origin || undefined,
    metadata: sanitizeMetadata(payload.metadata),
  }
}

export const authorizeDesktopNotification = async (
  payload: NotificationRequest,
): Promise<NotificationResponse> => {
  const sanitized = sanitizeNotificationRequest(payload)
  return callDesktopBridge<NotificationRequest, NotificationRequest>('notify', sanitized)
}

export const authorizeDragAndDrop = async (
  payload: DragAuthorizationRequest,
): Promise<DragAuthorizationResponse> => {
  const sanitized = sanitizeDragRequest(payload)
  const result = await callDesktopBridge<
    DragAuthorizationRequest,
    DragAuthorizationResponse['payload']
  >('drag-intent', sanitized)

  return {
    allowed: result.allowed,
    reason: result.reason,
    payload: result.payload ?? {
      intent: sanitized.intent,
      source: sanitized.source,
      tenderId: sanitized.tenderId,
      files: sanitized.files as DragFileDescriptor[],
    },
  }
}

export const authorizeExport = async (
  payload: ExportAuthorizationRequest,
): Promise<ExportAuthorizationResponse> => {
  const sanitized = sanitizeExportRequest(payload)
  const result = await callDesktopBridge<ExportAuthorizationRequest, ExportAuthorizationRequest>(
    'export',
    sanitized,
  )

  return {
    allowed: result.allowed,
    reason: result.reason,
    payload: result.payload ?? sanitized,
  }
}

export type {
  DragAuthorizationRequest,
  DragAuthorizationResponse,
  DragFileDescriptor,
  ExportAuthorizationRequest,
  ExportAuthorizationResponse,
  NotificationRequest,
  NotificationResponse,
  NotificationSeverity,
}

// Internal helpers surfaced for targeted unit tests.
export const __desktopSecurityInternals = {
  sanitizeDragRequestForTest: sanitizeDragRequest,
}
