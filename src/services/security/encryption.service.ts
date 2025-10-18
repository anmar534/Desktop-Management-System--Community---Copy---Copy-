/**
 * Encryption Service - خدمة التشفير
 * Sprint 5.5: الأمان والحماية المتقدمة
 *
 * Provides encryption and decryption functionality for sensitive data
 * يوفر وظائف التشفير وفك التشفير للبيانات الحساسة
 */

import { safeLocalStorage } from '../../utils/storage'

// ============================================================================
// Types
// ============================================================================

export interface EncryptionOptions {
  /** Algorithm to use / الخوارزمية المستخدمة */
  algorithm?: 'AES-GCM' | 'AES-CBC'

  /** Key length in bits / طول المفتاح بالبت */
  keyLength?: 128 | 256

  /** Initialization vector / متجه التهيئة */
  iv?: Uint8Array
}

export interface EncryptedData {
  /** Encrypted data / البيانات المشفرة */
  ciphertext: string

  /** Initialization vector / متجه التهيئة */
  iv: string

  /** Algorithm used / الخوارزمية المستخدمة */
  algorithm: string

  /** Timestamp / الوقت */
  timestamp: number
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_ALGORITHM = 'AES-GCM'
const DEFAULT_KEY_LENGTH = 256
const IV_LENGTH = 12 // 96 bits for GCM

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert string to ArrayBuffer
 * تحويل نص إلى ArrayBuffer
 */
function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder()
  return encoder.encode(str)
}

/**
 * Convert ArrayBuffer to string
 * تحويل ArrayBuffer إلى نص
 */
function arrayBufferToString(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder()
  return decoder.decode(buffer)
}

/**
 * Convert ArrayBuffer to base64
 * تحويل ArrayBuffer إلى base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Convert base64 to ArrayBuffer
 * تحويل base64 إلى ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Generate random IV
 * توليد متجه تهيئة عشوائي
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH))
}

// ============================================================================
// Key Management
// ============================================================================

/**
 * Generate encryption key
 * توليد مفتاح تشفير
 */
export async function generateKey(
  algorithm: string = DEFAULT_ALGORITHM,
  keyLength: number = DEFAULT_KEY_LENGTH,
): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: algorithm,
      length: keyLength,
    },
    true, // extractable
    ['encrypt', 'decrypt'],
  )
}

/**
 * Derive key from password
 * اشتقاق مفتاح من كلمة المرور
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: string,
  algorithm: string = DEFAULT_ALGORITHM,
  keyLength: number = DEFAULT_KEY_LENGTH,
): Promise<CryptoKey> {
  // Import password as key material
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    stringToArrayBuffer(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey'],
  )

  // Derive key using PBKDF2
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: stringToArrayBuffer(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    {
      name: algorithm,
      length: keyLength,
    },
    true,
    ['encrypt', 'decrypt'],
  )
}

/**
 * Export key to base64
 * تصدير المفتاح إلى base64
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key)
  return arrayBufferToBase64(exported)
}

/**
 * Import key from base64
 * استيراد المفتاح من base64
 */
export async function importKey(
  keyData: string,
  algorithm: string = DEFAULT_ALGORITHM,
): Promise<CryptoKey> {
  const keyBuffer = base64ToArrayBuffer(keyData)
  return await crypto.subtle.importKey('raw', keyBuffer, algorithm, true, ['encrypt', 'decrypt'])
}

// ============================================================================
// Encryption / Decryption
// ============================================================================

/**
 * Encrypt data
 * تشفير البيانات
 */
export async function encrypt(
  data: string,
  key: CryptoKey,
  options: EncryptionOptions = {},
): Promise<EncryptedData> {
  const { algorithm = DEFAULT_ALGORITHM, iv = generateIV() } = options

  // Encrypt data
  const encrypted = await crypto.subtle.encrypt(
    {
      name: algorithm,
      iv: iv,
    },
    key,
    stringToArrayBuffer(data),
  )

  return {
    ciphertext: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv),
    algorithm,
    timestamp: Date.now(),
  }
}

/**
 * Decrypt data
 * فك تشفير البيانات
 */
export async function decrypt(encryptedData: EncryptedData, key: CryptoKey): Promise<string> {
  const ciphertext = base64ToArrayBuffer(encryptedData.ciphertext)
  const iv = base64ToArrayBuffer(encryptedData.iv)

  const decrypted = await crypto.subtle.decrypt(
    {
      name: encryptedData.algorithm,
      iv: iv,
    },
    key,
    ciphertext,
  )

  return arrayBufferToString(decrypted)
}

// ============================================================================
// Hashing
// ============================================================================

/**
 * Hash data using SHA-256
 * تجزئة البيانات باستخدام SHA-256
 */
export async function hash(data: string): Promise<string> {
  const buffer = stringToArrayBuffer(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  return arrayBufferToBase64(hashBuffer)
}

/**
 * Verify hash
 * التحقق من التجزئة
 */
export async function verifyHash(data: string, hashValue: string): Promise<boolean> {
  const computedHash = await hash(data)
  return computedHash === hashValue
}

// ============================================================================
// Secure Storage
// ============================================================================

/**
 * Store encrypted data in localStorage
 * تخزين البيانات المشفرة في localStorage
 */
export async function secureStore(
  key: string,
  data: string,
  encryptionKey: CryptoKey,
): Promise<void> {
  const encrypted = await encrypt(data, encryptionKey)
  safeLocalStorage.setItem(key, encrypted)
}

/**
 * Retrieve and decrypt data from localStorage
 * استرجاع وفك تشفير البيانات من localStorage
 */
export async function secureRetrieve(
  key: string,
  encryptionKey: CryptoKey,
): Promise<string | null> {
  const encrypted = safeLocalStorage.getItem<EncryptedData | null>(key, null)
  if (!encrypted) return null

  try {
    return await decrypt(encrypted, encryptionKey)
  } catch (error) {
    console.error('Failed to decrypt data:', error)
    return null
  }
}

/**
 * Remove encrypted data from storage
 * إزالة البيانات المشفرة من التخزين
 */
export function secureRemove(key: string): void {
  safeLocalStorage.removeItem(key)
}

// ============================================================================
// Export Service
// ============================================================================

export const EncryptionService = {
  generateKey,
  deriveKeyFromPassword,
  exportKey,
  importKey,
  encrypt,
  decrypt,
  hash,
  verifyHash,
  secureStore,
  secureRetrieve,
  secureRemove,
}

export default EncryptionService
