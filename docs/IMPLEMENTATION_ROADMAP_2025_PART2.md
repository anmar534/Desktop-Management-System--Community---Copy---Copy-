# خطة التنفيذ - الجزء الثاني
# Implementation Roadmap - Part 2

**تكملة لـ:** IMPLEMENTATION_ROADMAP_2025.md

---

## 🟡 المرحلة 2: التحسينات المتوسطة المدى

**المدة:** 1-3 أشهر  
**الأولوية:** 🟡 متوسطة  
**الهدف:** تحسين المعمارية وقابلية الصيانة

---

### الخطوة 2.1: تفكيك Storage Layer (أسبوعان)

#### 📋 التحليل الحالي

**المشكلة:**
```
src/utils/storage.ts: 1,283 سطر! 🚨
- Migration logic
- Analytics tracking
- Audit logging
- Encryption/decryption
- Cache management
- Schema versioning
- Dev tools integration
- Browser fallback
```

**التأثير:**
- صعوبة في الصيانة
- صعوبة في الاختبار
- تعقيد غير ضروري
- انتهاك Single Responsibility Principle

#### 🎯 الهيكل الجديد المقترح

```
src/storage/
├── core/
│   ├── interface.ts              # واجهة Storage الموحدة
│   ├── factory.ts                # Storage Factory
│   ├── electron.ts               # Electron Store Adapter
│   ├── browser.ts                # Browser Fallback Adapter
│   └── cache.ts                  # In-Memory Cache Layer
├── security/
│   ├── encryption.ts             # AES-GCM Encryption
│   ├── keyManagement.ts          # Key Rotation & Management
│   ├── audit.ts                  # Audit Logging
│   └── secureStore.ts            # Keytar Integration
├── migration/
│   ├── migrator.ts               # Migration Engine
│   ├── schema.ts                 # Schema Definitions
│   ├── validators.ts             # Data Validators
│   └── migrations/
│       ├── v1_to_v2.ts
│       ├── v2_to_v3.ts
│       └── index.ts
├── analytics/
│   ├── tracker.ts                # Analytics Tracking
│   └── reporter.ts               # Usage Reporting
├── utils/
│   ├── serialization.ts          # JSON serialization
│   └── compression.ts            # Data compression
├── types.ts                      # TypeScript types
└── index.ts                      # Public API
```

#### 🔧 التنفيذ التفصيلي

**الأسبوع 1: إنشاء الهيكل الأساسي**

**يوم 1-2: Core Layer**

```typescript
// src/storage/core/interface.ts
/**
 * Storage Interface - واجهة التخزين الموحدة
 */
export interface IStorage {
  get<T>(key: string, defaultValue: T): Promise<T>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  keys(): Promise<string[]>;
}

export interface StorageOptions {
  encryption?: boolean;
  compression?: boolean;
  caching?: boolean;
  audit?: boolean;
}

export interface StorageMetadata {
  version: string;
  created: string;
  updated: string;
  size?: number;
}
```

```typescript
// src/storage/core/factory.ts
/**
 * Storage Factory - مصنع التخزين
 */
import { IStorage, StorageOptions } from './interface';
import { ElectronStorageAdapter } from './electron';
import { BrowserStorageAdapter } from './browser';
import { CachedStorage } from './cache';
import { EncryptedStorage } from '../security/encryption';
import { AuditedStorage } from '../security/audit';

export function createStorage(options: StorageOptions = {}): IStorage {
  // 1. اختر Adapter المناسب
  let storage: IStorage;
  
  if (typeof window !== 'undefined' && window.electronAPI?.store) {
    storage = new ElectronStorageAdapter(window.electronAPI.store);
  } else {
    console.warn('Electron store not available, using browser fallback');
    storage = new BrowserStorageAdapter();
  }
  
  // 2. أضف طبقات اختيارية (Decorator Pattern)
  if (options.caching) {
    storage = new CachedStorage(storage);
  }
  
  if (options.encryption) {
    storage = new EncryptedStorage(storage);
  }
  
  if (options.audit) {
    storage = new AuditedStorage(storage);
  }
  
  return storage;
}

// Singleton للاستخدام العام
let defaultStorage: IStorage | null = null;

export function getDefaultStorage(): IStorage {
  if (!defaultStorage) {
    defaultStorage = createStorage({
      caching: true,
      encryption: true,
      audit: true
    });
  }
  return defaultStorage;
}
```

```typescript
// src/storage/core/electron.ts
/**
 * Electron Storage Adapter
 */
import { IStorage } from './interface';

export class ElectronStorageAdapter implements IStorage {
  constructor(private store: any) {}
  
  async get<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const value = await this.store.get(key);
      return value !== undefined && value !== null ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error(`Failed to get ${key}:`, error);
      return defaultValue;
    }
  }
  
  async set(key: string, value: unknown): Promise<void> {
    try {
      await this.store.set(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to set ${key}:`, error);
      throw error;
    }
  }
  
  async delete(key: string): Promise<void> {
    await this.store.delete(key);
  }
  
  async clear(): Promise<void> {
    await this.store.clear();
  }
  
  async has(key: string): Promise<boolean> {
    const value = await this.store.get(key);
    return value !== undefined && value !== null;
  }
  
  async keys(): Promise<string[]> {
    // Electron store doesn't have keys() method, need to implement
    // For now, return empty array
    return [];
  }
}
```

```typescript
// src/storage/core/browser.ts
/**
 * Browser Storage Adapter (Fallback)
 */
import { IStorage } from './interface';

export class BrowserStorageAdapter implements IStorage {
  private storage = new Map<string, unknown>();
  
  async get<T>(key: string, defaultValue: T): Promise<T> {
    const value = this.storage.get(key);
    return value !== undefined ? (value as T) : defaultValue;
  }
  
  async set(key: string, value: unknown): Promise<void> {
    this.storage.set(key, value);
  }
  
  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }
  
  async clear(): Promise<void> {
    this.storage.clear();
  }
  
  async has(key: string): Promise<boolean> {
    return this.storage.has(key);
  }
  
  async keys(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }
}
```

```typescript
// src/storage/core/cache.ts
/**
 * Cached Storage Decorator
 */
import { IStorage } from './interface';

export class CachedStorage implements IStorage {
  private cache = new Map<string, unknown>();
  
  constructor(private inner: IStorage) {}
  
  async get<T>(key: string, defaultValue: T): Promise<T> {
    // تحقق من الـ cache أولاً
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }
    
    // اقرأ من التخزين
    const value = await this.inner.get(key, defaultValue);
    
    // احفظ في الـ cache
    this.cache.set(key, value);
    
    return value;
  }
  
  async set(key: string, value: unknown): Promise<void> {
    // حدّث الـ cache
    this.cache.set(key, value);
    
    // احفظ في التخزين
    await this.inner.set(key, value);
  }
  
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    await this.inner.delete(key);
  }
  
  async clear(): Promise<void> {
    this.cache.clear();
    await this.inner.clear();
  }
  
  async has(key: string): Promise<boolean> {
    if (this.cache.has(key)) return true;
    return await this.inner.has(key);
  }
  
  async keys(): Promise<string[]> {
    return await this.inner.keys();
  }
  
  // طرق إضافية للـ cache
  clearCache(): void {
    this.cache.clear();
  }
  
  invalidate(key: string): void {
    this.cache.delete(key);
  }
}
```

**يوم 3-4: Security Layer**

```typescript
// src/storage/security/encryption.ts
/**
 * Encrypted Storage Decorator
 */
import { IStorage } from '../core/interface';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export class EncryptedStorage implements IStorage {
  private encryptionKey: Buffer;
  
  constructor(
    private inner: IStorage,
    key?: string | Buffer
  ) {
    if (key) {
      this.encryptionKey = typeof key === 'string' 
        ? Buffer.from(key, 'hex')
        : key;
    } else {
      // استخدم مفتاح من keytar أو أنشئ واحد
      this.encryptionKey = this.getOrCreateKey();
    }
  }
  
  private getOrCreateKey(): Buffer {
    // في الإنتاج، استخدم keytar
    // هنا نستخدم مفتاح ثابت للتطوير فقط
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Encryption key must be provided in production');
    }
    return crypto.randomBytes(KEY_LENGTH);
  }
  
  private encrypt(data: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }
  
  private decrypt(encryptedData: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  async get<T>(key: string, defaultValue: T): Promise<T> {
    const encryptedValue = await this.inner.get<string>(key, '');
    
    if (!encryptedValue) {
      return defaultValue;
    }
    
    try {
      const decrypted = this.decrypt(encryptedValue);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error(`Failed to decrypt ${key}:`, error);
      return defaultValue;
    }
  }
  
  async set(key: string, value: unknown): Promise<void> {
    const json = JSON.stringify(value);
    const encrypted = this.encrypt(json);
    await this.inner.set(key, encrypted);
  }
  
  async delete(key: string): Promise<void> {
    await this.inner.delete(key);
  }
  
  async clear(): Promise<void> {
    await this.inner.clear();
  }
  
  async has(key: string): Promise<boolean> {
    return await this.inner.has(key);
  }
  
  async keys(): Promise<string[]> {
    return await this.inner.keys();
  }
}
```

```typescript
// src/storage/security/audit.ts
/**
 * Audited Storage Decorator
 */
import { IStorage } from '../core/interface';

export interface AuditEvent {
  timestamp: string;
  operation: 'get' | 'set' | 'delete' | 'clear';
  key?: string;
  success: boolean;
  error?: string;
  userId?: string;
}

export class AuditedStorage implements IStorage {
  private auditLog: AuditEvent[] = [];
  
  constructor(
    private inner: IStorage,
    private maxLogSize: number = 1000
  ) {}
  
  private log(event: Omit<AuditEvent, 'timestamp'>): void {
    this.auditLog.push({
      ...event,
      timestamp: new Date().toISOString()
    });
    
    // حافظ على حجم السجل
    if (this.auditLog.length > this.maxLogSize) {
      this.auditLog.shift();
    }
    
    // في الإنتاج، أرسل إلى خدمة logging
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(event);
    }
  }
  
  private sendToLoggingService(event: Partial<AuditEvent>): void {
    // TODO: إرسال إلى Sentry أو logging service
    console.log('[AUDIT]', event);
  }
  
  async get<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const value = await this.inner.get(key, defaultValue);
      this.log({ operation: 'get', key, success: true });
      return value;
    } catch (error) {
      this.log({ 
        operation: 'get', 
        key, 
        success: false, 
        error: (error as Error).message 
      });
      throw error;
    }
  }
  
  async set(key: string, value: unknown): Promise<void> {
    try {
      await this.inner.set(key, value);
      this.log({ operation: 'set', key, success: true });
    } catch (error) {
      this.log({ 
        operation: 'set', 
        key, 
        success: false, 
        error: (error as Error).message 
      });
      throw error;
    }
  }
  
  async delete(key: string): Promise<void> {
    try {
      await this.inner.delete(key);
      this.log({ operation: 'delete', key, success: true });
    } catch (error) {
      this.log({ 
        operation: 'delete', 
        key, 
        success: false, 
        error: (error as Error).message 
      });
      throw error;
    }
  }
  
  async clear(): Promise<void> {
    try {
      await this.inner.clear();
      this.log({ operation: 'clear', success: true });
    } catch (error) {
      this.log({ 
        operation: 'clear', 
        success: false, 
        error: (error as Error).message 
      });
      throw error;
    }
  }
  
  async has(key: string): Promise<boolean> {
    return await this.inner.has(key);
  }
  
  async keys(): Promise<string[]> {
    return await this.inner.keys();
  }
  
  // طرق إضافية للـ audit
  getAuditLog(): AuditEvent[] {
    return [...this.auditLog];
  }
  
  clearAuditLog(): void {
    this.auditLog = [];
  }
}
```

**يوم 5: Migration Layer**

```typescript
// src/storage/migration/schema.ts
/**
 * Storage Schema Definitions
 */
export interface SchemaVersion {
  version: number;
  description: string;
  changes: SchemaChange[];
}

export interface SchemaChange {
  type: 'add-field' | 'remove-field' | 'rename-field' | 'transform';
  entity: string;
  field?: string;
  newField?: string;
  transform?: (data: any) => any;
}

export const SCHEMA_VERSIONS: SchemaVersion[] = [
  {
    version: 1,
    description: 'Initial schema',
    changes: []
  },
  {
    version: 2,
    description: 'Add notes field to Tender',
    changes: [
      {
        type: 'add-field',
        entity: 'Tender',
        field: 'notes',
      }
    ]
  },
  {
    version: 3,
    description: 'Add documents array to Tender',
    changes: [
      {
        type: 'add-field',
        entity: 'Tender',
        field: 'documents',
      }
    ]
  }
];

export const CURRENT_SCHEMA_VERSION = SCHEMA_VERSIONS[SCHEMA_VERSIONS.length - 1].version;
```

```typescript
// src/storage/migration/migrator.ts
/**
 * Data Migration Engine
 */
import { IStorage } from '../core/interface';
import { SCHEMA_VERSIONS, CURRENT_SCHEMA_VERSION } from './schema';

export interface MigrationResult {
  success: boolean;
  fromVersion: number;
  toVersion: number;
  migratedKeys: string[];
  errors: Array<{ key: string; error: string }>;
}

export class StorageMigrator {
  constructor(private storage: IStorage) {}
  
  async getCurrentVersion(): Promise<number> {
    return await this.storage.get('__schema_version', 0);
  }
  
  async setVersion(version: number): Promise<void> {
    await this.storage.set('__schema_version', version);
  }
  
  async migrate(): Promise<MigrationResult> {
    const currentVersion = await this.getCurrentVersion();
    
    if (currentVersion === CURRENT_SCHEMA_VERSION) {
      return {
        success: true,
        fromVersion: currentVersion,
        toVersion: CURRENT_SCHEMA_VERSION,
        migratedKeys: [],
        errors: []
      };
    }
    
    const result: MigrationResult = {
      success: true,
      fromVersion: currentVersion,
      toVersion: CURRENT_SCHEMA_VERSION,
      migratedKeys: [],
      errors: []
    };
    
    // تطبيق الترحيلات بالتسلسل
    for (let v = currentVersion + 1; v <= CURRENT_SCHEMA_VERSION; v++) {
      const schema = SCHEMA_VERSIONS.find(s => s.version === v);
      if (!schema) continue;
      
      try {
        await this.applyMigration(schema, result);
      } catch (error) {
        result.success = false;
        result.errors.push({
          key: `version_${v}`,
          error: (error as Error).message
        });
        break;
      }
    }
    
    if (result.success) {
      await this.setVersion(CURRENT_SCHEMA_VERSION);
    }
    
    return result;
  }
  
  private async applyMigration(
    schema: SchemaVersion,
    result: MigrationResult
  ): Promise<void> {
    console.log(`Applying migration to v${schema.version}: ${schema.description}`);
    
    for (const change of schema.changes) {
      // تطبيق التغييرات بناءً على النوع
      // هذا مثال بسيط، يمكن توسيعه
      if (change.type === 'add-field') {
        // لا حاجة لعمل شيء، الحقول الجديدة ستُضاف تلقائياً
        console.log(`Added field ${change.field} to ${change.entity}`);
      }
    }
  }
}
```

**يوم 6-7: Public API وإعادة الهيكلة**

```typescript
// src/storage/index.ts
/**
 * Storage Module - Public API
 */
export { IStorage, StorageOptions, StorageMetadata } from './core/interface';
export { createStorage, getDefaultStorage } from './core/factory';
export { ElectronStorageAdapter } from './core/electron';
export { BrowserStorageAdapter } from './core/browser';
export { CachedStorage } from './core/cache';
export { EncryptedStorage } from './security/encryption';
export { AuditedStorage, AuditEvent } from './security/audit';
export { StorageMigrator, MigrationResult } from './migration/migrator';
export { SCHEMA_VERSIONS, CURRENT_SCHEMA_VERSION } from './migration/schema';

// واجهة مبسطة للاستخدام السريع
export const storage = getDefaultStorage();

// Compatibility layer - للتوافق مع الكود القديم
export const safeLocalStorage = {
  getItem: async <T>(key: string, defaultValue: T): Promise<T> => {
    return await storage.get(key, defaultValue);
  },
  
  setItem: async (key: string, value: unknown): Promise<void> => {
    await storage.set(key, value);
  },
  
  removeItem: async (key: string): Promise<void> => {
    await storage.delete(key);
  },
  
  clear: async (): Promise<void> => {
    await storage.clear();
  }
};

// Async storage للتوافق
export const asyncStorage = safeLocalStorage;
```

**الأسبوع 2: الترحيل والاختبار**

**يوم 8-10: ترحيل الكود القديم**

```bash
# خطة الترحيل:
1. ابحث عن جميع استدعاءات safeLocalStorage القديمة
2. استبدلها بـ repository pattern
3. حدّث الاختبارات
4. تحقق من عدم وجود breaking changes
```

**يوم 11-12: الاختبارات**

```typescript
// tests/unit/storage/core/factory.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createStorage } from '@/storage/core/factory';

describe('Storage Factory', () => {
  it('should create storage with default options', () => {
    const storage = createStorage();
    expect(storage).toBeDefined();
  });
  
  it('should create cached storage when caching enabled', () => {
    const storage = createStorage({ caching: true });
    expect(storage.constructor.name).toContain('Cached');
  });
  
  it('should create encrypted storage when encryption enabled', () => {
    const storage = createStorage({ encryption: true });
    expect(storage.constructor.name).toContain('Encrypted');
  });
});
```

```typescript
// tests/integration/storage/migration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createStorage } from '@/storage';
import { StorageMigrator } from '@/storage/migration/migrator';

describe('Storage Migration', () => {
  let storage: IStorage;
  let migrator: StorageMigrator;
  
  beforeEach(async () => {
    storage = createStorage();
    await storage.clear();
    migrator = new StorageMigrator(storage);
  });
  
  it('should migrate from v0 to latest', async () => {
    await storage.set('__schema_version', 0);
    
    const result = await migrator.migrate();
    
    expect(result.success).toBe(true);
    expect(result.toVersion).toBeGreaterThan(0);
  });
  
  it('should not migrate if already at latest version', async () => {
    await migrator.setVersion(CURRENT_SCHEMA_VERSION);
    
    const result = await migrator.migrate();
    
    expect(result.migratedKeys).toHaveLength(0);
  });
});
```

**يوم 13-14: التوثيق**

```markdown
<!-- docs/architecture/STORAGE_LAYER.md -->
# طبقة التخزين - Storage Layer

## نظرة عامة

تم إعادة هيكلة طبقة التخزين من ملف واحد (1,283 سطر) إلى بنية موديولية:

## الطبقات

### 1. Core Layer
- **المسؤولية:** واجهات التخزين الأساسية
- **المكونات:**
  - `IStorage` interface
  - `ElectronStorageAdapter`
  - `BrowserStorageAdapter`
  - `CachedStorage`

### 2. Security Layer
- **المسؤولية:** التشفير والتدقيق
- **المكونات:**
  - `EncryptedStorage` - AES-256-GCM
  - `AuditedStorage` - تسجيل العمليات
  - `KeyManagement` - إدارة المفاتيح

### 3. Migration Layer
- **المسؤولية:** ترحيل البيانات
- **المكونات:**
  - `StorageMigrator`
  - Schema definitions
  - Migration scripts

## الاستخدام

### بسيط
```typescript
import { storage } from '@/storage';

// قراءة
const data = await storage.get('key', defaultValue);

// كتابة
await storage.set('key', value);

// حذف
await storage.delete('key');
```

### متقدم
```typescript
import { createStorage } from '@/storage';

const storage = createStorage({
  encryption: true,
  caching: true,
  audit: true
});
```

## الأنماط المستخدمة

### Decorator Pattern
كل ميزة إضافية (تشفير، cache، audit) هي decorator يلف التخزين الأساسي.

### Factory Pattern
`createStorage()` تُنشئ التكوين المناسب بناءً على الخيارات.

### Adapter Pattern
`ElectronStorageAdapter` و `BrowserStorageAdapter` يوفران واجهة موحدة.

## الفوائد

✅ قابلية الصيانة - كل وحدة صغيرة ومسؤولة عن شيء واحد
✅ قابلية الاختبار - اختبار كل طبقة بشكل منفصل
✅ المرونة - سهولة إضافة ميزات جديدة
✅ الوضوح - الكود أسهل في الفهم
```

#### ✅ معايير الإنجاز - الخطوة 2.1

- ✅ هيكل المجلدات الجديد منشأ
- ✅ جميع الطبقات منفذة
- ✅ الاختبارات تنجح (>90% coverage)
- ✅ الكود القديم محدث
- ✅ التوثيق كامل
- ✅ لا توجد breaking changes

#### 📊 المقاييس

```
Before: 1 file, 1,283 lines
After:  15+ files, ~800 lines total
Maintainability: +300%
Testability: +500%
```

---

### الخطوة 2.2: توحيد Data Access (أسبوع واحد)

#### 📋 الهدف

إزالة جميع الاستدعاءات المباشرة لـ `safeLocalStorage` واستبدالها بـ Repository Pattern.

#### 🔍 البحث والتحليل

```bash
# البحث عن جميع الاستخدامات
grep -r "safeLocalStorage.getItem" src/
grep -r "safeLocalStorage.setItem" src/
grep -r "asyncStorage" src/
```

**الملفات المطلوب تحديثها:**

```
src/hooks/
├── useBOQ.ts               # ✅ نحتاج لتحديثها
├── useTenders.ts           # ✅
├── useProjects.ts          # ✅
├── useInvoices.ts          # ✅
└── useBudgets.ts           # ✅

src/components/
├── Financial.tsx           # ✅
├── Projects.tsx            # ✅
└── Tenders.tsx             # ✅
```

#### 🔧 التنفيذ

**يوم 1-2: تحديث Hooks**

```typescript
// ❌ قبل: src/hooks/useBOQ.ts
import { safeLocalStorage, STORAGE_KEYS } from '@/utils/storage';

export function useBOQ() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    const stored = safeLocalStorage.getItem(STORAGE_KEYS.BOQ_DATA, []);
    setData(stored);
  }, []);
  
  const save = (newData) => {
    safeLocalStorage.setItem(STORAGE_KEYS.BOQ_DATA, newData);
    setData(newData);
  };
  
  return { data, save };
}
```

```typescript
// ✅ بعد: src/hooks/useBOQ.ts
import { useRepository } from '@/application/services/RepositoryProvider';
import { getBOQRepository } from '@/application/services/serviceRegistry';

export function useBOQ() {
  const repository = useRepository(getBOQRepository);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const stored = await repository.getAll();
      setData(stored);
    } catch (error) {
      console.error('Failed to load BOQ data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const save = async (newData) => {
    try {
      await repository.create(newData);
      await loadData(); // إعادة التحميل
    } catch (error) {
      console.error('Failed to save BOQ data:', error);
      throw error;
    }
  };
  
  return { data, loading, save, reload: loadData };
}
```

**يوم 3-4: تحديث Components**

```typescript
// ❌ قبل: src/components/Projects.tsx
const loadProjects = () => {
  const stored = safeLocalStorage.getItem(STORAGE_KEYS.PROJECTS, []);
  setProjects(stored);
};
```

```typescript
// ✅ بعد: src/components/Projects.tsx
const projectRepository = useRepository(getProjectRepository);

const loadProjects = async () => {
  try {
    setLoading(true);
    const projects = await projectRepository.getAll();
    setProjects(projects);
  } catch (error) {
    console.error('Failed to load projects:', error);
    toast.error('فشل تحميل المشاريع');
  } finally {
    setLoading(false);
  }
};
```

**يوم 5: إضافة Type Safety**

```typescript
// src/repository/types.ts
/**
 * Repository interface types
 */
export interface Repository<T, TCreate = Omit<T, 'id'>> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(data: TCreate): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
  search?(query: string): Promise<T[]>;
  filter?(predicate: (item: T) => boolean): Promise<T[]>;
}

export interface PaginatedRepository<T> extends Repository<T> {
  getPage(page: number, size: number): Promise<{
    items: T[];
    total: number;
    page: number;
    size: number;
  }>;
}
```

**يوم 6-7: الاختبارات والتوثيق**

```typescript
// tests/unit/hooks/useBOQ.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useBOQ } from '@/hooks/useBOQ';

describe('useBOQ', () => {
  it('should load data on mount', async () => {
    const { result } = renderHook(() => useBOQ());
    
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.data).toBeDefined();
  });
  
  it('should save data correctly', async () => {
    const { result } = renderHook(() => useBOQ());
    
    const newData = { /* test data */ };
    await result.current.save(newData);
    
    expect(result.current.data).toContain(newData);
  });
});
```

#### ✅ معايير الإنجاز - الخطوة 2.2

- ✅ جميع الـ hooks محدثة
- ✅ جميع المكونات تستخدم repositories
- ✅ لا توجد استدعاءات مباشرة للـ storage
- ✅ Type safety محسّن
- ✅ الاختبارات تنجح

---

### الخطوة 2.3: تحسين Accessibility (أسبوعان)

#### 📋 الهدف

الوصول إلى WCAG 2.1 Level AA compliance.

#### 🔍 التدقيق الحالي

**المشاكل المكتشفة من CODE_QUALITY_REVIEW:**

```
❌ Components lack proper role attributes
❌ Missing aria-label for interactive elements
❌ No aria-describedby for form controls
❌ Missing keyboard event handlers
❌ No focus management for modal dialogs
❌ Tab order not properly defined
❌ Missing semantic HTML structure
❌ No live regions for dynamic content updates
```

#### 🔧 التنفيذ

**الأسبوع 1: المكونات الأساسية**

**يوم 1-2: Button Component**

```typescript
// src/components/ui/accessible-button.tsx
import { forwardRef, KeyboardEvent, MouseEvent } from 'react';
import { Button, ButtonProps } from './button';

export interface AccessibleButtonProps extends ButtonProps {
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-pressed'?: boolean;
  'aria-expanded'?: boolean;
  onKeyDown?: (e: KeyboardEvent<HTMLButtonElement>) => void;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ children, onClick, onKeyDown, ...props }, ref) => {
    const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.(e as any);
      }
      onKeyDown?.(e);
    };
    
    return (
      <Button
        ref={ref}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={props.disabled ? -1 : 0}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';
```

**يوم 3-4: Form Components**

```typescript
// src/components/ui/accessible-input.tsx
import { forwardRef, useId } from 'react';
import { Input, InputProps } from './input';
import { Label } from './label';

export interface AccessibleInputProps extends InputProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ label, description, error, required, ...props }, ref) => {
    const id = useId();
    const descriptionId = `${id}-description`;
    const errorId = `${id}-error`;
    
    return (
      <div className="space-y-2">
        <Label htmlFor={id} className="flex items-center gap-1">
          {label}
          {required && <span className="text-destructive" aria-label="مطلوب">*</span>}
        </Label>
        
        {description && (
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
        
        <Input
          ref={ref}
          id={id}
          aria-label={label}
          aria-describedby={description ? descriptionId : undefined}
          aria-invalid={error ? 'true' : 'false'}
          aria-errormessage={error ? errorId : undefined}
          aria-required={required}
          {...props}
        />
        
        {error && (
          <p id={errorId} className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';
```

**يوم 5-7: Modal وDialog**

```typescript
// src/components/ui/accessible-dialog.tsx
import { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { X } from 'lucide-react';
import { AccessibleButton } from './accessible-button';

export interface AccessibleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function AccessibleDialog({
  open,
  onOpenChange,
  title,
  description,
  children
}: AccessibleDialogProps) {
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  
  useEffect(() => {
    if (open) {
      // احفظ العنصر المركز عليه قبل فتح الـ dialog
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // ركّز على أول عنصر قابل للتركيز
      setTimeout(() => {
        firstFocusableRef.current?.focus();
      }, 100);
    } else if (previousFocusRef.current) {
      // أعد التركيز للعنصر السابق عند الإغلاق
      previousFocusRef.current.focus();
    }
  }, [open]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? 'dialog-description' : undefined}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle id="dialog-title">{title}</DialogTitle>
            <AccessibleButton
              ref={firstFocusableRef}
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              aria-label="إغلاق النافذة"
            >
              <X className="h-4 w-4" />
            </AccessibleButton>
          </div>
          {description && (
            <DialogDescription id="dialog-description">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="mt-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
```

**الأسبوع 2: تطبيق عبر التطبيق**

**يوم 8-10: تحديث جميع النماذج**

```typescript
// مثال: src/components/NewProjectForm.tsx
// ❌ قبل
<input
  type="text"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
/>

// ✅ بعد
<AccessibleInput
  label="عنوان المشروع"
  description="أدخل عنواً واضحاً ومختصراً للمشروع"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  required
  error={errors.title}
/>
```

**يوم 11-12: إضافة Live Regions**

```typescript
// src/components/ui/live-region.tsx
export interface LiveRegionProps {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
}

export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = true,
  relevant = 'additions text'
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className="sr-only" // screen-reader only
    >
      {children}
    </div>
  );
}

// الاستخدام:
// src/components/Projects.tsx
{isLoading && (
  <LiveRegion politeness="polite">
    جارٍ تحميل المشاريع...
  </LiveRegion>
)}

{error && (
  <LiveRegion politeness="assertive">
    خطأ: {error}
  </LiveRegion>
)}
```

**يوم 13-14: اختبارات Accessibility**

```typescript
// tests/accessibility/button.a11y.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AccessibleButton } from '@/components/ui/accessible-button';

expect.extend(toHaveNoViolations);

describe('AccessibleButton Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(
      <AccessibleButton aria-label="إضافة مشروع جديد">
        إضافة
      </AccessibleButton>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should have proper ARIA attributes', () => {
    const { getByRole } = render(
      <AccessibleButton aria-label="حذف" aria-pressed={false}>
        حذف
      </AccessibleButton>
    );
    
    const button = getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'حذف');
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });
});
```

```bash
# إضافة jest-axe للاختبارات
npm install --save-dev jest-axe @axe-core/react
```

#### ✅ معايير الإنجاز - الخطوة 2.3

- ✅ جميع المكونات الأساسية accessible
- ✅ WCAG 2.1 AA compliance (>90%)
- ✅ Keyboard navigation يعمل
- ✅ Screen reader friendly
- ✅ Focus management صحيح
- ✅ اختبارات a11y تنجح

#### 📊 المقاييس

```
Accessibility Score (Lighthouse):
Before: غير مقاس
After:  >90/100

WCAG Compliance:
Before: ~40%
After:  >90%

Keyboard Navigation:
Before: جزئي
After:  كامل
```

---

## 🟢 المرحلة 3: التحسينات الاستراتيجية

**المدة:** 3-6 أشهر  
**الأولوية:** 🟢 طويلة المدى

*(المرحلة 3 ستكون في ملف منفصل للحجم)*

---

## 📊 ملخص المرحلة 2

### المخرجات المتوقعة

- ✅ Storage layer modular ومنظم
- ✅ Repository pattern مطبق بالكامل
- ✅ WCAG 2.1 AA compliance
- ✅ Test coverage >85%
- ✅ Code maintainability +200%

### الوقت المقدر

1-3 أشهر، حسب حجم الفريق

### الموارد المطلوبة

- 2-3 مطورين
- 1 QA specialist
- 1 Accessibility expert (consultant)

---

**التالي: المرحلة 3 - SQLite Migration + Plugin System + Monitoring**
