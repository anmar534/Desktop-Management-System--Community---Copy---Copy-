/**
 * Backup Service - خدمة النسخ الاحتياطي
 * Sprint 5.5: الأمان والحماية المتقدمة
 *
 * Automatic backup and restore functionality
 * وظائف النسخ الاحتياطي والاسترداد التلقائي
 */

import { EncryptionService } from './encryption.service'
import { safeLocalStorage } from '@/shared/utils/storage/storage'

// ============================================================================
// Types
// ============================================================================

export interface BackupMetadata {
  /** Backup ID / معرف النسخة الاحتياطية */
  id: string

  /** Timestamp / الوقت */
  timestamp: Date

  /** Version / الإصدار */
  version: string

  /** User ID / معرف المستخدم */
  userId: string

  /** User name / اسم المستخدم */
  userName: string

  /** Backup type / نوع النسخة الاحتياطية */
  type: 'manual' | 'automatic'

  /** Size in bytes / الحجم بالبايت */
  size: number

  /** Encrypted / مشفرة */
  encrypted: boolean

  /** Description / الوصف */
  description?: string

  /** Tables included / الجداول المضمنة */
  tables: string[]
}

export interface BackupData {
  /** Metadata / البيانات الوصفية */
  metadata: BackupMetadata

  /** Data / البيانات */
  data: Record<string, any[]>
}

export interface BackupOptions {
  /** Encrypt backup / تشفير النسخة الاحتياطية */
  encrypt?: boolean

  /** Encryption key / مفتاح التشفير */
  encryptionKey?: CryptoKey

  /** Tables to include / الجداول المراد تضمينها */
  tables?: string[]

  /** Description / الوصف */
  description?: string
}

export interface RestoreOptions {
  /** Decryption key / مفتاح فك التشفير */
  decryptionKey?: CryptoKey

  /** Overwrite existing data / الكتابة فوق البيانات الموجودة */
  overwrite?: boolean

  /** Tables to restore / الجداول المراد استردادها */
  tables?: string[]
}

// ============================================================================
// Constants
// ============================================================================

const BACKUP_PREFIX = 'backup_'
const BACKUP_LIST_KEY = 'backup_list'
const CURRENT_VERSION = '1.0.0'
const DEFAULT_TABLES = [
  'tenders',
  'projects',
  'financial',
  'procurement',
  'hr',
  'users',
  'settings',
]

// ============================================================================
// Backup Management
// ============================================================================

/**
 * Create a backup
 * إنشاء نسخة احتياطية
 */
export async function createBackup(
  userId: string,
  userName: string,
  type: 'manual' | 'automatic' = 'manual',
  options: BackupOptions = {},
): Promise<BackupMetadata> {
  const { encrypt = false, encryptionKey, tables = DEFAULT_TABLES, description } = options

  // Generate backup ID
  const id = generateBackupId()

  // Collect data from storage
  const data: Record<string, any[]> = {}
  for (const table of tables) {
    const tableData = safeLocalStorage.getItem<any[]>(table, [])
    if (tableData && tableData.length > 0) {
      try {
        data[table] = tableData
      } catch (error) {
        console.error(`Failed to parse data for table ${table}:`, error)
        data[table] = []
      }
    } else {
      data[table] = []
    }
  }

  // Create metadata
  const metadata: BackupMetadata = {
    id,
    timestamp: new Date(),
    version: CURRENT_VERSION,
    userId,
    userName,
    type,
    size: 0, // Will be calculated after serialization
    encrypted: encrypt,
    description,
    tables,
  }

  // Create backup object
  const backup: BackupData = {
    metadata,
    data,
  }

  // Serialize backup
  let backupString = JSON.stringify(backup)

  // Encrypt if requested
  if (encrypt && encryptionKey) {
    const encrypted = await EncryptionService.encrypt(backupString, encryptionKey)
    backupString = JSON.stringify(encrypted)
  }

  // Calculate size
  metadata.size = new Blob([backupString]).size

  // Save backup
  safeLocalStorage.setItem(`${BACKUP_PREFIX}${id}`, backupString)

  // Update backup list
  const backupList = getBackupList()
  backupList.push(metadata)
  saveBackupList(backupList)

  return metadata
}

/**
 * Restore from backup
 * الاسترداد من نسخة احتياطية
 */
export async function restoreBackup(backupId: string, options: RestoreOptions = {}): Promise<void> {
  const { decryptionKey, overwrite = true, tables } = options

  // Load backup
  const backupString = safeLocalStorage.getItem<string>(`${BACKUP_PREFIX}${backupId}`, '')
  if (!backupString) {
    throw new Error('Backup not found')
  }

  let backup: BackupData

  try {
    // Try to parse as regular backup
    backup = JSON.parse(backupString)

    // Check if it's encrypted
    if (backup.metadata.encrypted) {
      if (!decryptionKey) {
        throw new Error('Decryption key required for encrypted backup')
      }

      // Decrypt
      const encryptedData = JSON.parse(backupString)
      const decrypted = await EncryptionService.decrypt(encryptedData, decryptionKey)
      backup = JSON.parse(decrypted)
    }
  } catch (error) {
    throw new Error('Failed to load backup: ' + (error as Error).message)
  }

  // Determine which tables to restore
  const tablesToRestore = tables || backup.metadata.tables

  // Restore data
  for (const table of tablesToRestore) {
    if (backup.data[table]) {
      const existingData = safeLocalStorage.getItem<any[]>(table, [])
      if (overwrite || existingData.length === 0) {
        safeLocalStorage.setItem(table, backup.data[table])
      }
    }
  }
}

/**
 * Delete a backup
 * حذف نسخة احتياطية
 */
export function deleteBackup(backupId: string): void {
  // Remove backup data
  safeLocalStorage.removeItem(`${BACKUP_PREFIX}${backupId}`)

  // Update backup list
  const backupList = getBackupList()
  const updatedList = backupList.filter((b) => b.id !== backupId)
  saveBackupList(updatedList)
}

/**
 * Get all backups
 * الحصول على جميع النسخ الاحتياطية
 */
export function getBackups(): BackupMetadata[] {
  return getBackupList()
}

/**
 * Get backup by ID
 * الحصول على نسخة احتياطية بالمعرف
 */
export function getBackup(backupId: string): BackupMetadata | null {
  const backupList = getBackupList()
  return backupList.find((b) => b.id === backupId) || null
}

/**
 * Export backup to file
 * تصدير نسخة احتياطية إلى ملف
 */
export function exportBackup(backupId: string): void {
  const backupString = safeLocalStorage.getItem<string>(`${BACKUP_PREFIX}${backupId}`, '')
  if (!backupString) {
    throw new Error('Backup not found')
  }

  const backup = getBackup(backupId)
  if (!backup) {
    throw new Error('Backup metadata not found')
  }

  // Create blob
  const blob = new Blob([backupString], { type: 'application/json' })

  // Create download link
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `backup_${backup.id}_${formatDate(backup.timestamp)}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Import backup from file
 * استيراد نسخة احتياطية من ملف
 */
export async function importBackup(file: File): Promise<BackupMetadata> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const backupString = e.target?.result as string
        const backup: BackupData = JSON.parse(backupString)

        // Validate backup
        if (!backup.metadata || !backup.data) {
          throw new Error('Invalid backup file')
        }

        // Save backup
        safeLocalStorage.setItem(`${BACKUP_PREFIX}${backup.metadata.id}`, backupString)

        // Update backup list
        const backupList = getBackupList()
        backupList.push(backup.metadata)
        saveBackupList(backupList)

        resolve(backup.metadata)
      } catch (error) {
        reject(new Error('Failed to import backup: ' + (error as Error).message))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsText(file)
  })
}

// ============================================================================
// Automatic Backup
// ============================================================================

let autoBackupInterval: NodeJS.Timeout | null = null

/**
 * Start automatic backups
 * بدء النسخ الاحتياطي التلقائي
 */
export async function startAutoBackup(
  userId: string,
  userName: string,
  intervalHours = 24,
  options: BackupOptions = {},
): Promise<void> {
  // Stop existing interval
  stopAutoBackup()

  // Create initial backup
  await createBackup(userId, userName, 'automatic', options)

  // Set up interval
  const intervalMs = intervalHours * 60 * 60 * 1000
  autoBackupInterval = setInterval(async () => {
    try {
      await createBackup(userId, userName, 'automatic', options)
      console.log('Automatic backup created successfully')
    } catch (error) {
      console.error('Automatic backup failed:', error)
    }
  }, intervalMs)
}

/**
 * Stop automatic backups
 * إيقاف النسخ الاحتياطي التلقائي
 */
export function stopAutoBackup(): void {
  if (autoBackupInterval) {
    clearInterval(autoBackupInterval)
    autoBackupInterval = null
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate backup ID
 * توليد معرف نسخة احتياطية
 */
function generateBackupId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get backup list from storage
 * الحصول على قائمة النسخ الاحتياطية من التخزين
 */
function getBackupList(): BackupMetadata[] {
  try {
    const list = safeLocalStorage.getItem<BackupMetadata[]>(BACKUP_LIST_KEY, [])
    // Convert timestamp strings back to Date objects
    return list.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp),
    }))
  } catch (error) {
    console.error('Failed to load backup list:', error)
    return []
  }
}

/**
 * Save backup list to storage
 * حفظ قائمة النسخ الاحتياطية في التخزين
 */
function saveBackupList(list: BackupMetadata[]): void {
  try {
    safeLocalStorage.setItem(BACKUP_LIST_KEY, list)
  } catch (error) {
    console.error('Failed to save backup list:', error)
  }
}

/**
 * Format date for filename
 * تنسيق التاريخ لاسم الملف
 */
function formatDate(date: Date): string {
  return date.toISOString().replace(/[:.]/g, '-').slice(0, -5)
}

// ============================================================================
// Export Service
// ============================================================================

export const BackupService = {
  createBackup,
  restoreBackup,
  deleteBackup,
  getBackups,
  getBackup,
  exportBackup,
  importBackup,
  startAutoBackup,
  stopAutoBackup,
}

export default BackupService
