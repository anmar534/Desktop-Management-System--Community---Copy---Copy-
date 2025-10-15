/**
 * Encryption Service Unit Tests
 * اختبارات وحدة خدمة التشفير
 * Sprint 5.6: التحسين النهائي والتجهيز للإنتاج
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  generateKey,
  deriveKeyFromPassword,
  encrypt,
  decrypt,
  hash,
  verifyHash,
  secureStore,
  secureRetrieve,
  exportKey,
  importKey,
} from '@/services/security/encryption.service'

describe('Encryption Service', () => {
  describe('Key Generation', () => {
    it('should generate AES-GCM key with 256-bit length', async () => {
      const key = await generateKey('AES-GCM', 256)
      
      expect(key).toBeDefined()
      expect(key.type).toBe('secret')
      expect(key.algorithm.name).toBe('AES-GCM')
    })

    it('should generate AES-CBC key with 128-bit length', async () => {
      const key = await generateKey('AES-CBC', 128)
      
      expect(key).toBeDefined()
      expect(key.type).toBe('secret')
      expect(key.algorithm.name).toBe('AES-CBC')
    })

    it('should generate different keys on each call', async () => {
      const key1 = await generateKey('AES-GCM', 256)
      const key2 = await generateKey('AES-GCM', 256)
      
      const exported1 = await exportKey(key1)
      const exported2 = await exportKey(key2)
      
      expect(exported1).not.toBe(exported2)
    })
  })

  describe('Password-Based Key Derivation', () => {
    it('should derive key from password', async () => {
      const password = 'SecurePassword123!'
      const salt = crypto.getRandomValues(new Uint8Array(16))
      
      const key = await deriveKeyFromPassword(password, salt, 'AES-GCM', 256)
      
      expect(key).toBeDefined()
      expect(key.type).toBe('secret')
    })

    it('should derive same key from same password and salt', async () => {
      const password = 'SecurePassword123!'
      const salt = crypto.getRandomValues(new Uint8Array(16))
      
      const key1 = await deriveKeyFromPassword(password, salt, 'AES-GCM', 256)
      const key2 = await deriveKeyFromPassword(password, salt, 'AES-GCM', 256)
      
      const exported1 = await exportKey(key1)
      const exported2 = await exportKey(key2)
      
      expect(exported1).toBe(exported2)
    })

    it('should derive different keys from different salts', async () => {
      const password = 'SecurePassword123!'
      const salt1 = crypto.getRandomValues(new Uint8Array(16))
      const salt2 = crypto.getRandomValues(new Uint8Array(16))
      
      const key1 = await deriveKeyFromPassword(password, salt1, 'AES-GCM', 256)
      const key2 = await deriveKeyFromPassword(password, salt2, 'AES-GCM', 256)
      
      const exported1 = await exportKey(key1)
      const exported2 = await exportKey(key2)
      
      expect(exported1).not.toBe(exported2)
    })
  })

  describe('Encryption and Decryption', () => {
    it('should encrypt and decrypt data successfully', async () => {
      const key = await generateKey('AES-GCM', 256)
      const plaintext = 'Hello, World!'
      
      const encrypted = await encrypt(plaintext, key)
      const decrypted = await decrypt(encrypted, key)
      
      expect(decrypted).toBe(plaintext)
    })

    it('should encrypt same data differently each time', async () => {
      const key = await generateKey('AES-GCM', 256)
      const plaintext = 'Hello, World!'
      
      const encrypted1 = await encrypt(plaintext, key)
      const encrypted2 = await encrypt(plaintext, key)
      
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext)
      expect(encrypted1.iv).not.toBe(encrypted2.iv)
    })

    it('should handle empty string encryption', async () => {
      const key = await generateKey('AES-GCM', 256)
      const plaintext = ''
      
      const encrypted = await encrypt(plaintext, key)
      const decrypted = await decrypt(encrypted, key)
      
      expect(decrypted).toBe(plaintext)
    })

    it('should handle unicode characters', async () => {
      const key = await generateKey('AES-GCM', 256)
      const plaintext = 'مرحباً بك في النظام! 🎉'
      
      const encrypted = await encrypt(plaintext, key)
      const decrypted = await decrypt(encrypted, key)
      
      expect(decrypted).toBe(plaintext)
    })

    it('should fail to decrypt with wrong key', async () => {
      const key1 = await generateKey('AES-GCM', 256)
      const key2 = await generateKey('AES-GCM', 256)
      const plaintext = 'Secret Message'
      
      const encrypted = await encrypt(plaintext, key1)
      
      await expect(decrypt(encrypted, key2)).rejects.toThrow()
    })
  })

  describe('Hashing', () => {
    it('should hash data with SHA-256', async () => {
      const data = 'Hello, World!'
      const hashed = await hash(data)
      
      expect(hashed).toBeDefined()
      expect(typeof hashed).toBe('string')
      expect(hashed.length).toBeGreaterThan(0)
    })

    it('should produce same hash for same data', async () => {
      const data = 'Hello, World!'
      const hash1 = await hash(data)
      const hash2 = await hash(data)
      
      expect(hash1).toBe(hash2)
    })

    it('should produce different hashes for different data', async () => {
      const hash1 = await hash('Hello, World!')
      const hash2 = await hash('Hello, World')
      
      expect(hash1).not.toBe(hash2)
    })

    it('should verify correct hash', async () => {
      const data = 'Hello, World!'
      const hashed = await hash(data)
      
      const isValid = await verifyHash(data, hashed)
      
      expect(isValid).toBe(true)
    })

    it('should reject incorrect hash', async () => {
      const data = 'Hello, World!'
      const hashed = await hash(data)
      
      const isValid = await verifyHash('Hello, World', hashed)
      
      expect(isValid).toBe(false)
    })
  })

  describe('Key Import/Export', () => {
    it('should export and import key successfully', async () => {
      const originalKey = await generateKey('AES-GCM', 256)
      const exported = await exportKey(originalKey)
      const imported = await importKey(exported, 'AES-GCM')
      
      // Test that imported key works
      const plaintext = 'Test Message'
      const encrypted = await encrypt(plaintext, imported)
      const decrypted = await decrypt(encrypted, imported)
      
      expect(decrypted).toBe(plaintext)
    })

    it('should export key as base64 string', async () => {
      const key = await generateKey('AES-GCM', 256)
      const exported = await exportKey(key)
      
      expect(typeof exported).toBe('string')
      expect(exported.length).toBeGreaterThan(0)
      // Base64 pattern
      expect(exported).toMatch(/^[A-Za-z0-9+/]+=*$/)
    })
  })

  describe('Secure Storage', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    it('should store and retrieve encrypted data', async () => {
      const key = await generateKey('AES-GCM', 256)
      const data = 'Sensitive Information'
      
      await secureStore('test-key', data, key)
      const retrieved = await secureRetrieve('test-key', key)
      
      expect(retrieved).toBe(data)
    })

    it('should return null for non-existent key', async () => {
      const key = await generateKey('AES-GCM', 256)
      const retrieved = await secureRetrieve('non-existent', key)
      
      expect(retrieved).toBeNull()
    })

    it('should fail to retrieve with wrong key', async () => {
      const key1 = await generateKey('AES-GCM', 256)
      const key2 = await generateKey('AES-GCM', 256)
      const data = 'Sensitive Information'
      
      await secureStore('test-key', data, key1)
      
      await expect(secureRetrieve('test-key', key2)).rejects.toThrow()
    })

    it('should handle unicode data in storage', async () => {
      const key = await generateKey('AES-GCM', 256)
      const data = 'بيانات حساسة 🔒'
      
      await secureStore('test-key', data, key)
      const retrieved = await secureRetrieve('test-key', key)
      
      expect(retrieved).toBe(data)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long strings', async () => {
      const key = await generateKey('AES-GCM', 256)
      const plaintext = 'A'.repeat(10000)
      
      const encrypted = await encrypt(plaintext, key)
      const decrypted = await decrypt(encrypted, key)
      
      expect(decrypted).toBe(plaintext)
    })

    it('should handle special characters', async () => {
      const key = await generateKey('AES-GCM', 256)
      const plaintext = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`'
      
      const encrypted = await encrypt(plaintext, key)
      const decrypted = await decrypt(encrypted, key)
      
      expect(decrypted).toBe(plaintext)
    })

    it('should handle JSON data', async () => {
      const key = await generateKey('AES-GCM', 256)
      const data = { name: 'John', age: 30, active: true }
      const plaintext = JSON.stringify(data)
      
      const encrypted = await encrypt(plaintext, key)
      const decrypted = await decrypt(encrypted, key)
      const parsed = JSON.parse(decrypted)
      
      expect(parsed).toEqual(data)
    })
  })
})

