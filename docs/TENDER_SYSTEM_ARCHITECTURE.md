# 🏗️ معمارية نظام المنافسات - Tender System Architecture

**تاريخ الإنشاء:** 3 نوفمبر 2025  
**آخر تحديث:** 3 نوفمبر 2025  
**الإصدار:** 2.0 (بعد التحسينات)  
**المطور:** Desktop Management System Team

---

## 📋 جدول المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [المعمارية العامة](#المعمارية-العامة)
3. [طبقة التطبيق - Application Layer](#طبقة-التطبيق)
4. [طبقة المجال - Domain Layer](#طبقة-المجال)
5. [طبقة البنية التحتية - Infrastructure Layer](#طبقة-البنية-التحتية)
6. [طبقة العرض - Presentation Layer](#طبقة-العرض)
7. [تدفق البيانات](#تدفق-البيانات)
8. [الأمان والموثوقية](#الأمان-والموثوقية)
9. [الأداء](#الأداء)
10. [التكاملات](#التكاملات)

---

## 🎯 نظرة عامة

### الهدف

نظام إدارة المنافسات (Tender System) هو جزء من نظام إدارة سطح المكتب الشامل، مصمم لإدارة دورة حياة المنافسات الكاملة من الإنشاء إلى الفوز/الخسارة وإنشاء المشاريع المرتبطة.

### المبادئ المعمارية

```
✅ Clean Architecture - فصل واضح بين الطبقات
✅ SOLID Principles - تطبيق مبادئ SOLID
✅ Single Responsibility - كل وحدة لها مسؤولية واحدة
✅ Separation of Concerns - فصل الاهتمامات
✅ DRY (Don't Repeat Yourself) - عدم التكرار
✅ Store-Based State Management - إدارة الحالة باستخدام Zustand
```

### التقنيات المستخدمة

| الطبقة           | التقنية                  | الغرض                |
| ---------------- | ------------------------ | -------------------- |
| State Management | Zustand                  | إدارة الحالة         |
| Middleware       | Immer, DevTools, Persist | تحسينات Zustand      |
| UI Framework     | React 18+                | واجهة المستخدم       |
| Type Safety      | TypeScript 5+            | سلامة الأنواع        |
| Storage          | Electron + JSON/SQLite   | تخزين البيانات       |
| Events           | Custom Event Bus         | الاتصال بين المكونات |

---

## 🏛️ المعمارية العامة

### هيكل الطبقات

```
┌─────────────────────────────────────────────────────────┐
│           Presentation Layer (العرض)                    │
│  Components, Pages, Dialogs, Forms                      │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────┐
│           Application Layer (التطبيق)                   │
│  Stores, Services, Hooks                                │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────┐
│           Domain Layer (المجال)                         │
│  Business Logic, Selectors, Validators, Errors          │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────┐
│           Infrastructure Layer (البنية التحتية)        │
│  Repositories, Data Access, External Services           │
└─────────────────────────────────────────────────────────┘
```

### هيكل المجلدات

```
src/
├── presentation/              # طبقة العرض
│   ├── pages/
│   │   ├── TendersPage.tsx
│   │   └── TenderPricingPage.tsx
│   └── components/
│       ├── dialogs/
│       │   └── ConflictResolutionDialog.tsx
│       └── tender/
│           ├── TenderCard.tsx
│           ├── TenderList.tsx
│           └── TenderFilters.tsx
│
├── application/               # طبقة التطبيق
│   ├── stores/
│   │   └── tender/
│   │       ├── tenderDataStore.ts
│   │       ├── tenderFiltersStore.ts
│   │       ├── tenderSelectionStore.ts
│   │       ├── tenderSortStore.ts
│   │       └── index.ts
│   ├── services/
│   │   ├── tenderDataService.ts
│   │   ├── tenderSubmissionService.ts
│   │   └── pricingService.ts
│   └── hooks/
│       ├── useTenderPricing.ts
│       └── useTenderSubmission.ts
│
├── domain/                    # طبقة المجال
│   ├── selectors/
│   │   └── tenderSelectors.ts
│   ├── validation/
│   │   └── tenderValidation.ts
│   ├── errors/
│   │   └── ConflictError.ts
│   └── repositories/
│       └── interfaces.ts
│
├── infrastructure/            # طبقة البنية التحتية
│   └── repositories/
│       ├── pricing/
│       │   ├── PricingDataRepository.ts
│       │   ├── BOQSyncRepository.ts
│       │   ├── TenderStatusRepository.ts
│       │   └── PricingOrchestrator.ts
│       └── TenderPricingRepository.ts
│
├── repository/                # Data Access Layer
│   ├── providers/
│   │   └── tender.local.ts
│   └── tender.repository.ts
│
├── shared/                    # مكونات مشتركة
│   └── utils/
│       ├── transaction/
│       │   └── TransactionManager.ts
│       ├── resilience/
│       │   └── ResilientService.ts
│       └── tender/
│           └── tenderFilters.ts
│
└── types/                     # تعريفات الأنواع
    └── contracts.ts
```

---

## 🎯 طبقة التطبيق - Application Layer

### 1. Stores (إدارة الحالة)

#### 1.1 TenderDataStore

**الموقع:** `src/application/stores/tender/tenderDataStore.ts`

**المسؤولية:** إدارة بيانات المنافسات فقط (CRUD operations)

**الحالة:**

```typescript
interface TenderDataState {
  tenders: Tender[] // جميع المنافسات
  isLoading: boolean // حالة التحميل
  isRefreshing: boolean // حالة التحديث
  error: string | null // رسالة الخطأ
}
```

**الإجراءات:**

```typescript
interface TenderDataActions {
  // CRUD Operations
  loadTenders: () => Promise<void>
  refreshTenders: () => Promise<void>
  createTender: (tender: Omit<Tender, 'id'>) => Promise<Tender>
  updateTender: (id: string, updates: Partial<Tender>) => Promise<Tender>
  deleteTender: (id: string) => Promise<boolean>

  // Bulk Operations
  bulkDeleteTenders: (ids: string[]) => Promise<void>

  // State Management
  setTenders: (tenders: Tender[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}
```

**الميزات:**

- ✅ Zustand + Immer لـ immutable updates
- ✅ DevTools للـ debugging
- ✅ Event emission عند التغييرات
- ✅ Error handling شامل

---

#### 1.2 TenderFiltersStore

**الموقع:** `src/application/stores/tender/tenderFiltersStore.ts`

**المسؤولية:** إدارة حالة الفلاتر فقط

**الحالة:**

```typescript
interface TenderFiltersState {
  status: Tender['status'] | 'all' // فلتر الحالة
  priority: Tender['priority'] | 'all' // فلتر الأولوية
  search: string // نص البحث
  dateRange: {
    // نطاق التاريخ
    from?: string
    to?: string
  }
  valueRange: {
    // نطاق القيمة
    min?: number
    max?: number
  }
}
```

**الإجراءات:**

```typescript
interface TenderFiltersActions {
  setStatus: (status: Tender['status'] | 'all') => void
  setPriority: (priority: Tender['priority'] | 'all') => void
  setSearch: (query: string) => void
  setDateRange: (range: { from?: string; to?: string }) => void
  setValueRange: (range: { min?: number; max?: number }) => void
  clearFilters: () => void
  reset: () => void
}
```

**الميزات:**

- ✅ Persist middleware - حفظ الفلاتر
- ✅ DevTools للـ debugging
- ✅ Immer لـ immutable state

---

#### 1.3 TenderSelectionStore

**الموقع:** `src/application/stores/tender/tenderSelectionStore.ts`

**المسؤولية:** إدارة اختيار المنافسات فقط

**الحالة:**

```typescript
interface TenderSelectionState {
  selectedIds: Set<string> // المنافسات المختارة (Set للأداء O(1))
}
```

**الإجراءات:**

```typescript
interface TenderSelectionActions {
  select: (id: string) => void
  deselect: (id: string) => void
  toggle: (id: string) => void
  selectMultiple: (ids: string[]) => void
  deselectMultiple: (ids: string[]) => void
  selectAll: (ids: string[]) => void
  clearSelection: () => void
  isSelected: (id: string) => boolean
  getSelectedCount: () => number
}
```

**الميزات:**

- ✅ استخدام `Set` للأداء العالي
- ✅ Bulk operations
- ✅ Immer integration

---

#### 1.4 TenderSortStore

**الموقع:** `src/application/stores/tender/tenderSortStore.ts`

**المسؤولية:** إدارة حالة الترتيب فقط

**الحالة:**

```typescript
type SortField =
  | 'deadline'
  | 'priority'
  | 'status'
  | 'value'
  | 'progress'
  | 'winChance'
  | 'createdAt'
  | 'name'
  | 'client'
type SortDirection = 'asc' | 'desc'

interface TenderSortState {
  field: SortField // حقل الترتيب
  direction: SortDirection // اتجاه الترتيب
}
```

**الإجراءات:**

```typescript
interface TenderSortActions {
  setSort: (field: SortField, direction?: SortDirection) => void
  toggleDirection: () => void
  setDirection: (direction: SortDirection) => void
  reset: () => void
}
```

**الميزات:**

- ✅ Persist middleware - حفظ الترتيب
- ✅ DevTools للـ debugging
- ✅ Default sort: deadline (asc)

---

### 2. Services (الخدمات)

#### 2.1 TenderDataService

**الموقع:** `src/application/services/tenderDataService.ts`

**المسؤولية:** معالجة عمليات بيانات المنافسات المعقدة

**الوظائف الرئيسية:**

```typescript
class TenderDataService {
  // CRUD with validation
  async createTender(data: TenderCreateDTO): Promise<Tender>
  async updateTender(id: string, updates: TenderUpdateDTO): Promise<Tender>
  async deleteTender(id: string): Promise<boolean>

  // Business operations
  async submitTender(id: string): Promise<Tender>
  async markAsWon(
    id: string,
    projectData?: ProjectData,
  ): Promise<{ tender: Tender; project?: Project }>
  async markAsLost(id: string, reason: string): Promise<Tender>

  // Query operations
  async searchTenders(query: string): Promise<Tender[]>
  async getTendersByStatus(status: TenderStatus): Promise<Tender[]>
  async getActiveTenders(): Promise<Tender[]>
}
```

**الميزات:**

- ✅ Validation قبل العمليات
- ✅ Business logic centralization
- ✅ Error handling
- ✅ Audit logging
- ✅ Event emission

---

#### 2.2 TenderSubmissionService

**الموقع:** `src/application/services/tenderSubmissionService.ts`

**المسؤولية:** إدارة عملية تقديم المنافسات

**الوظائف:**

```typescript
class TenderSubmissionService {
  async validateSubmission(tenderId: string): Promise<ValidationResult>
  async prepareSubmission(tenderId: string): Promise<SubmissionPackage>
  async submitTender(tenderId: string): Promise<SubmissionResult>
  async cancelSubmission(tenderId: string): Promise<void>
}
```

---

#### 2.3 PricingService (Orchestrator)

**الموقع:** `src/infrastructure/repositories/pricing/PricingOrchestrator.ts`

**المسؤولية:** تنسيق عمليات التسعير المتعددة

**الوظائف:**

```typescript
class PricingOrchestrator {
  // Main coordination
  async persistPricingAndBOQ(
    tenderId: string,
    pricingData: PricingData,
    boqData: BOQData,
  ): Promise<PersistResult>

  // Data preparation
  preparePricingData(rawData: any): PricingData
  prepareBOQData(rawData: any): BOQData

  // Validation
  validatePricingData(data: PricingData): ValidationResult
  validateBOQData(data: BOQData): ValidationResult

  // Sync operations
  async syncPricingToBOQ(tenderId: string): Promise<SyncResult>
  async syncBOQToPricing(tenderId: string): Promise<SyncResult>
}
```

**المكونات المستخدمة:**

- `PricingDataRepository` - تخزين بيانات التسعير
- `BOQSyncRepository` - مزامنة BOQ
- `TenderStatusRepository` - تحديث حالة المنافسة

---

### 3. Hooks (Custom React Hooks)

#### 3.1 useTenderPricing

**الموقع:** `src/application/hooks/useTenderPricing.ts`

**المسؤولية:** منطق التسعير

```typescript
function useTenderPricing(tenderId: string) {
  return {
    // State
    pricingData: PricingData | null
    boqData: BOQData | null
    isLoading: boolean
    isSaving: boolean
    error: Error | null

    // Operations
    savePricing: (data: PricingData) => Promise<void>
    saveBOQ: (data: BOQData) => Promise<void>
    saveBoth: (pricing: PricingData, boq: BOQData) => Promise<void>
    syncPricingToBOQ: () => Promise<void>
    syncBOQToPricing: () => Promise<void>

    // Computed
    totalCost: number
    profit: number
    profitMargin: number
    isComplete: boolean
  }
}
```

---

#### 3.2 useTenderSubmission

**الموقع:** `src/application/hooks/useTenderSubmission.ts`

**المسؤولية:** منطق التقديم

```typescript
function useTenderSubmission(tenderId: string) {
  return {
    // State
    canSubmit: boolean
    validationErrors: ValidationError[]
    isSubmitting: boolean

    // Operations
    validate: () => Promise<ValidationResult>
    submit: () => Promise<void>
    cancel: () => Promise<void>

    // Computed
    completionPercentage: number
    missingRequirements: string[]
  }
}
```

---

## 🎨 طبقة المجال - Domain Layer

### 1. Selectors (محددات المجال)

**الموقع:** `src/domain/selectors/tenderSelectors.ts`

**المسؤولية:** حسابات نقية بدون side effects (SSOT - Single Source of Truth)

```typescript
// Computed values
export const getTenderValue = (tender: Tender): number
export const getTenderProgress = (tender: Tender): number
export const getTenderDaysLeft = (tender: Tender): number
export const getTenderStatus = (tender: Tender): TenderStatus

// Filtering
export const filterActiveTeders = (tenders: Tender[]): Tender[]
export const filterByStatus = (tenders: Tender[], status: TenderStatus): Tender[]
export const filterByPriority = (tenders: Tender[], priority: Priority): Tender[]

// Sorting
export const sortByDeadline = (tenders: Tender[]): Tender[]
export const sortByValue = (tenders: Tender[]): Tender[]
export const sortByWinChance = (tenders: Tender[]): Tender[]

// Aggregation
export const getTotalValue = (tenders: Tender[]): number
export const getAverageWinChance = (tenders: Tender[]): number
export const getStatusCounts = (tenders: Tender[]): Record<TenderStatus, number>

// Complex queries
export const getHighPriorityTenders = (tenders: Tender[]): Tender[]
export const getExpiringSoonTenders = (tenders: Tender[], days: number): Tender[]
export const getWinningTenders = (tenders: Tender[]): Tender[]
```

**المبادئ:**

- ✅ Pure functions - بدون side effects
- ✅ Memoization - باستخدام `useMemo` عند الاستخدام
- ✅ Reusable - قابلة لإعادة الاستخدام
- ✅ Testable - سهلة الاختبار

---

### 2. Validation (التحقق من الصحة)

**الموقع:** `src/domain/validation/tenderValidation.ts`

**الوظائف:**

```typescript
// Tender validation
export const validateTender = (tender: Tender): ValidationResult
export const validateTenderPayload = (data: TenderCreateDTO): ValidationResult
export const validateTenderUpdate = (updates: TenderUpdateDTO): ValidationResult

// Business rules
export const canSubmitTender = (tender: Tender): boolean
export const canMarkAsWon = (tender: Tender): boolean
export const canMarkAsLost = (tender: Tender): boolean
export const canEditTender = (tender: Tender): boolean

// Data sanitization
export const sanitizeTenderData = (data: any): Tender
export const sanitizeTenderCollection = (data: any[]): Tender[]
```

---

### 3. Errors (الأخطاء المخصصة)

**الموقع:** `src/domain/errors/ConflictError.ts`

**ConflictError Class:**

```typescript
interface ConflictErrorData {
  message: string
  current: Tender // البيانات الحالية في النظام
  attempted: Tender // البيانات التي حاول المستخدم حفظها
}

class ConflictError extends Error {
  constructor(data: ConflictErrorData)

  getCurrentData(): Tender
  getAttemptedData(): Tender
  toJSON(): object
}
```

**الاستخدام:**

- ⚡ عند حدوث تعارض في Optimistic Locking
- ⚡ يُطرح من Repository update method
- ⚡ يُعرض للمستخدم عبر ConflictResolutionDialog

---

## 🗄️ طبقة البنية التحتية - Infrastructure Layer

### 1. Repositories (المستودعات)

#### 1.1 TenderRepository (Main)

**الموقع:** `src/repository/providers/tender.local.ts`

**المسؤولية:** الوصول المباشر لبيانات المنافسات

```typescript
interface ITenderRepository {
  // Read operations
  getAll(): Promise<Tender[]>
  getById(id: string): Promise<Tender | null>
  getByProjectId(projectId: string): Promise<Tender | null>
  getPage(options: PaginationOptions): Promise<PaginatedResult<Tender>>
  search(query: string): Promise<Tender[]>

  // Write operations
  create(data: Omit<Tender, 'id'>): Promise<Tender>
  update(id: string, updates: Partial<Tender>, options?: UpdateOptions): Promise<Tender | null>
  delete(id: string): Promise<boolean>
}
```

**الميزات الخاصة:**

**أ. Optimistic Locking (Phase 5.1):**

```typescript
async create(data: Omit<Tender, 'id'>): Promise<Tender> {
  const newTender: Tender = {
    ...data,
    id: generateId(),
    version: 1,                    // ⭐ بدء النسخة من 1
    lastModified: new Date(),      // ⭐ وقت الإنشاء
    lastModifiedBy: getCurrentUserId() // ⭐ المستخدم
  }
  // ...
}

async update(id: string, updates: Partial<Tender>): Promise<Tender | null> {
  const current = await this.getById(id)

  // ⭐ Version conflict check
  if (updates.version !== undefined) {
    if (current.version !== updates.version) {
      throw new ConflictError({
        message: 'تم تحديث المنافسة من مكان آخر',
        current,
        attempted: { ...current, ...updates }
      })
    }
  }

  // ⭐ Increment version
  const nextVersion = (current.version ?? 0) + 1
  const updated: Tender = {
    ...current,
    ...updates,
    version: nextVersion,
    lastModified: new Date(),
    lastModifiedBy: getCurrentUserId()
  }
  // ...
}
```

---

#### 1.2 PricingDataRepository

**الموقع:** `src/infrastructure/repositories/pricing/PricingDataRepository.ts`

**المسؤولية:** تخزين بيانات التسعير

```typescript
class PricingDataRepository {
  async savePricingData(tenderId: string, data: PricingData): Promise<void>
  async loadPricingData(tenderId: string): Promise<PricingData | null>
  async deletePricingData(tenderId: string): Promise<boolean>
  async hasPricingData(tenderId: string): Promise<boolean>
}
```

---

#### 1.3 BOQSyncRepository

**الموقع:** `src/infrastructure/repositories/pricing/BOQSyncRepository.ts`

**المسؤولية:** مزامنة BOQ مع التسعير

```typescript
class BOQSyncRepository {
  async syncPricingToBOQ(tenderId: string, pricing: PricingData): Promise<void>
  async syncBOQToPricing(tenderId: string, boq: BOQData): Promise<void>
  async getBOQData(tenderId: string): Promise<BOQData | null>
  async saveBOQData(tenderId: string, data: BOQData): Promise<void>
}
```

---

#### 1.4 TenderStatusRepository

**الموقع:** `src/infrastructure/repositories/pricing/TenderStatusRepository.ts`

**المسؤولية:** تحديث حالة المنافسة

```typescript
class TenderStatusRepository {
  async updateStatus(tenderId: string, status: TenderStatus): Promise<void>
  async updateProgress(tenderId: string, progress: number): Promise<void>
  async getStatus(tenderId: string): Promise<TenderStatus | null>
}
```

---

### 2. Migration System (نظام الهجرة)

**الموقع:** `src/electron/migrations/`

#### 2.1 Migration Manager

**الملف:** `migration-manager.cjs`

**المسؤولية:** إدارة migrations التلقائية

```javascript
// Main functions
async function checkAndRunMigrations(): Promise<MigrationManagerResult>
async function runMigration(migrationName: string): Promise<MigrationResult>
function getMigrationStatus(): MigrationState

// Migration state tracking
interface MigrationState {
  version: string                // إصدار البيانات
  lastMigration: string         // آخر migration تم تطبيقه
  timestamp: string             // وقت آخر migration
  appliedMigrations: string[]   // قائمة جميع migrations المطبقة
}
```

**الميزات:**

- ✅ Auto-migration عند بدء Electron
- ✅ Backup تلقائي قبل أي migration
- ✅ Rollback عند الفشل
- ✅ Semantic versioning
- ✅ Migration history tracking

---

#### 2.2 Phase 5 Backfill Migration

**الملف:** `phase5-backfill.cjs`

**المسؤولية:** إضافة version fields للمنافسات الموجودة

```javascript
async function backfillTenderVersions(options: BackfillOptions): Promise<boolean>

// Options
interface BackfillOptions {
  dryRun: boolean      // Test mode
  backup: boolean      // إنشاء backup
  logDetails: boolean  // تسجيل التفاصيل
}

// Result
interface BackfillResult {
  success: boolean
  totalProcessed: number
  updated: number
  skipped: number
  errors: number
}
```

**العملية:**

```
1. قراءة tenders.json
2. لكل tender:
   - إذا لم يكن له version → إضافة version: 1
   - إذا كان له version → skip
3. حفظ البيانات المحدثة
4. إرجاع إحصائيات
```

---

## 🎨 طبقة العرض - Presentation Layer

### 1. Pages (الصفحات)

#### 1.1 TendersPage

**الموقع:** `src/presentation/pages/TendersPage.tsx`

**المسؤولية:** عرض قائمة المنافسات

**المكونات:**

```typescript
<TendersPage>
  <TenderFilters />       // الفلاتر
  <TenderToolbar />       // شريط الأدوات
  <TenderList />          // القائمة
  <TenderPagination />    // الترقيم
</TendersPage>
```

**الحالة المستخدمة:**

- `useTenderDataStore()` - البيانات
- `useTenderFiltersStore()` - الفلاتر
- `useTenderSelectionStore()` - الاختيار
- `useTenderSortStore()` - الترتيب

---

#### 1.2 TenderPricingPage

**الموقع:** `src/presentation/pages/TenderPricingPage.tsx`

**المسؤولية:** صفحة التسعير

**المكونات:**

```typescript
<TenderPricingPage tenderId={id}>
  <PricingForm />         // نموذج التسعير
  <BOQTable />            // جدول BOQ
  <CostSummary />         // ملخص التكاليف
  <PricingActions />      // إجراءات الحفظ
</TenderPricingPage>
```

**Hooks المستخدمة:**

- `useTenderPricing(tenderId)` - منطق التسعير

---

### 2. Components (المكونات)

#### 2.1 TenderCard

**الموقع:** `src/presentation/components/tender/TenderCard.tsx`

**المسؤولية:** عرض بطاقة منافسة واحدة

```typescript
interface TenderCardProps {
  tender: Tender
  onSelect?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  isSelected?: boolean
}
```

---

#### 2.2 TenderList

**الموقع:** `src/presentation/components/tender/TenderList.tsx`

**المسؤولية:** عرض قائمة المنافسات

```typescript
interface TenderListProps {
  tenders: Tender[]
  viewMode: 'grid' | 'list'
  onTenderClick?: (tender: Tender) => void
}
```

**الميزات:**

- ✅ Virtual scrolling للأداء
- ✅ Grid & List view modes
- ✅ Lazy loading
- ✅ Skeleton loading

---

#### 2.3 ConflictResolutionDialog

**الموقع:** `src/presentation/components/dialogs/ConflictResolutionDialog.tsx`

**المسؤولية:** حل تعارضات Optimistic Locking

```typescript
interface ConflictResolutionDialogProps {
  open: boolean
  current: Tender // البيانات الحالية
  attempted: Tender // البيانات المحاولة
  onResolve: (resolution: Resolution) => void
  onCancel: () => void
}

type Resolution =
  | { type: 'keep-local'; data: Tender }
  | { type: 'use-server'; data: Tender }
  | { type: 'merge'; data: Tender }
```

**الواجهة:**

```
┌────────────────────────────────────────┐
│  ⚠️ تعارض في البيانات                 │
├────────────────────────────────────────┤
│  البيانات الحالية:                    │
│  [عرض current tender]                  │
│                                        │
│  محاولة الحفظ:                        │
│  [عرض attempted tender]                │
│                                        │
│  [الاحتفاظ بالمحلي] [استخدام الخادم] │
│  [دمج التغييرات]     [إلغاء]         │
└────────────────────────────────────────┘
```

---

## 🔄 تدفق البيانات

### 1. قراءة البيانات (Read Flow)

```
User Action (عرض قائمة المنافسات)
    ↓
Component (TendersPage)
    ↓
Store (useTenderDataStore)
    ↓
Service (TenderDataService.loadTenders)
    ↓
Repository (TenderRepository.getAll)
    ↓
Data Source (tenders.json / SQLite)
    ↓
← تطبيق Selectors (filterActiveenders, sortByDeadline)
    ↓
← تطبيق Filters (من useTenderFiltersStore)
    ↓
← تطبيق Sort (من useTenderSortStore)
    ↓
Component Re-render مع البيانات
```

---

### 2. كتابة البيانات (Write Flow)

```
User Action (تحديث منافسة)
    ↓
Component (TenderEditForm)
    ↓
Validation (validateTenderUpdate)
    ↓ (valid)
Store (useTenderDataStore.updateTender)
    ↓
Service (TenderDataService.updateTender)
    ↓
Repository (TenderRepository.update)
    ↓
Version Check (⭐ Optimistic Locking)
    ↓ (no conflict)
Data Source (save to tenders.json)
    ↓
Emit Event (APP_EVENTS.TENDER_UPDATED)
    ↓
Store Update (تحديث الحالة)
    ↓
Component Re-render
```

**في حالة Conflict:**

```
Repository.update
    ↓
Version Check → Conflict!
    ↓
throw ConflictError
    ↓
Component catches error
    ↓
ConflictResolutionDialog (عرض Dialog)
    ↓
User resolves
    ↓
Retry update مع البيانات المختارة
```

---

### 3. التسعير (Pricing Flow)

```
User (حفظ التسعير)
    ↓
Component (PricingForm)
    ↓
Hook (useTenderPricing.saveBoth)
    ↓
PricingOrchestrator.persistPricingAndBOQ
    ├→ PricingDataRepository.savePricingData
    ├→ BOQSyncRepository.saveBOQData
    └→ TenderStatusRepository.updateProgress
    ↓
Event (APP_EVENTS.PRICING_UPDATED)
    ↓
Stores تحديث
```

---

## 🔒 الأمان والموثوقية

### 1. Optimistic Locking (Phase 5.1)

**الهدف:** منع data loss عند التحديثات المتزامنة

**الآلية:**

```typescript
// 1. كل tender له version number
interface Tender {
  version?: number        // يبدأ من 1
  lastModified?: Date
  lastModifiedBy?: string
}

// 2. عند الإنشاء
create() → version = 1

// 3. عند التحديث
update() → {
  if (current.version !== attempted.version) {
    throw ConflictError  // ⚠️ تعارض!
  }
  version = current.version + 1  // ⬆️ زيادة النسخة
}
```

**المكونات:**

- ✅ `ConflictError` class
- ✅ Repository version checks
- ✅ `ConflictResolutionDialog` UI
- ✅ Migration system للبيانات القديمة

---

### 2. Transaction Support (Phase 5.2 - Infrastructure)

**الموقع:** `src/shared/utils/transaction/TransactionManager.ts`

**الاستخدام (مستقبلي):**

```typescript
const tx = new TransactionManager('save-pricing')

try {
  await tx.execute(
    async () => {
      await savePricing()
    },
    async () => {
      await restorePricing()
    },
  )
  await tx.execute(
    async () => {
      await saveBOQ()
    },
    async () => {
      await restoreBOQ()
    },
  )

  await tx.commit() // ✅ نجح
} catch (error) {
  await tx.rollback() // ❌ تراجع
  throw error
}
```

**الحالة:**

- ⏭️ Infrastructure جاهز
- ⏭️ Integration مؤجل (PricingOrchestrator كافٍ حالياً)

---

### 3. Error Recovery (Phase 5.3 - Infrastructure)

**الموقع:** `src/shared/utils/resilience/ResilientService.ts`

**الاستخدام (مستقبلي):**

```typescript
const resilient = new ResilientService({
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
})

await resilient.execute(async () => await networkOperation(), 'operation-name')
```

**الحالة:**

- ⏭️ Infrastructure جاهز
- ⏭️ Integration مؤجل (local storage لا يحتاج retry)
- ✅ جاهز لـ network operations مستقبلاً

---

## ⚡ الأداء

### 1. Optimization Techniques

#### 1.1 Virtual Scrolling

```typescript
// في TenderList
import { FixedSizeList } from 'react-window'

<FixedSizeList
  height={600}
  itemCount={tenders.length}
  itemSize={120}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <TenderCard tender={tenders[index]} />
    </div>
  )}
</FixedSizeList>
```

---

#### 1.2 Memoization

```typescript
// في Components
const TenderCard = memo(
  ({ tender }) => {
    // ...
  },
  (prev, next) => prev.tender.id === next.tender.id,
)

// في Selectors
const filteredTenders = useMemo(() => filterActiveenders(tenders), [tenders])
```

---

#### 1.3 Lazy Loading

```typescript
// Route-based code splitting
const TendersPage = lazy(() => import('./pages/TendersPage'))
const TenderPricingPage = lazy(() => import('./pages/TenderPricingPage'))
```

---

### 2. Store Performance

#### 2.1 Separation of Concerns

- ⚡ 4 stores منفصلة → re-renders أقل
- ⚡ كل store يُحدّث فقط عند تغير بياناته

#### 2.2 Set للاختيار

```typescript
// O(1) lookup
selectedIds: Set<string>

isSelected(id) {
  return selectedIds.has(id)  // ⚡ سريع جداً
}
```

#### 2.3 Immer Middleware

```typescript
// Immutable updates بدون spread operators
set((state) => {
  state.tenders.push(newTender) // Immer handles immutability
})
```

---

## 🔗 التكاملات

### 1. مع المشاريع (Projects)

**العلاقة:** Tender → Project (عند الفوز)

```typescript
// عند marking tender as won
async markAsWon(tenderId: string) {
  // 1. تحديث حالة المنافسة
  const tender = await tenderRepository.update(tenderId, {
    status: 'won'
  })

  // 2. إنشاء مشروع تلقائياً
  const project = await projectRepository.create({
    name: tender.name,
    client: tender.client,
    budget: tender.value,
    tenderId: tenderId
  })

  // 3. إنشاء العلاقة
  await relationRepository.create({
    tenderId: tender.id,
    projectId: project.id,
    type: 'won'
  })

  return { tender, project }
}
```

---

### 2. مع المشتريات (Purchase Orders)

**العلاقة:** Tender → Project → PurchaseOrder (غير مباشرة)

```
Tender (won) → Project → PurchaseOrder
```

---

### 3. مع لوحة التحكم (Dashboard)

**المشاركة:** `tenderSelectors.ts`

```typescript
// Dashboard يستخدم selectors
import { getTotalValue, getStatusCounts } from '@/domain/selectors/tenderSelectors'

const Dashboard = () => {
  const tenders = useTenderDataStore((s) => s.tenders)

  const totalValue = getTotalValue(tenders)
  const counts = getStatusCounts(tenders)

  return (
    <DashboardCard>
      <h3>إجمالي قيمة المنافسات: {totalValue}</h3>
      <StatusChart data={counts} />
    </DashboardCard>
  )
}
```

---

### 4. Event Bus System

**الموقع:** `src/events/bus.ts`

```typescript
// Events
export const APP_EVENTS = {
  TENDER_CREATED: 'tender:created',
  TENDER_UPDATED: 'tender:updated',
  TENDER_DELETED: 'tender:deleted',
  PRICING_UPDATED: 'pricing:updated',
  BOQ_SYNCED: 'boq:synced',
}

// Emit
emit(APP_EVENTS.TENDER_UPDATED, { tenderId, changes })

// Listen
bus.on(APP_EVENTS.TENDER_UPDATED, ({ tenderId }) => {
  // React to tender update
})
```

---

## 📚 ملاحظات إضافية

### Store Adapter للتوافق

**الموقع:** `src/application/stores/tenderListStoreAdapter.ts`

**الهدف:** Backward compatibility مع الكود القديم

```typescript
// Old code (before Phase 2)
const { tenders, setFilter, setSort } = useTenderListStore()

// Internally uses new stores:
// - useTenderDataStore()
// - useTenderFiltersStore()
// - useTenderSortStore()
// - useTenderSelectionStore()
```

**الفائدة:**

- ✅ Zero breaking changes
- ✅ تدريجي migration للكود
- ✅ اختبار الـ new stores بدون تغيير UI

---

### Migration Workflow

```bash
# 1. Check migration status
npm run migrate:status

# 2. Dry run (test)
npm run migrate:backfill:dry-run

# 3. Execute migration
npm run migrate:backfill

# 4. Complete workflow
npm run migrate:phase5
```

---

## 🎯 الخلاصة

### الإنجازات الرئيسية

✅ **Clean Architecture** - فصل واضح بين الطبقات  
✅ **SOLID Principles** - تطبيق كامل  
✅ **Store Separation** - 4 stores منفصلة  
✅ **Optimistic Locking** - منع data loss  
✅ **Migration System** - تحديث تلقائي  
✅ **Performance** - virtual scrolling, memoization  
✅ **Type Safety** - TypeScript شامل  
✅ **Maintainability** - كود قابل للصيانة

### Infrastructure جاهز للمستقبل

⏭️ **TransactionManager** - جاهز للعمليات المعقدة  
⏭️ **ResilientService** - جاهز للـ network operations  
⏭️ **Testing Framework** - Vitest ready

---

**تاريخ التحديث:** 3 نوفمبر 2025  
**الإصدار:** 2.0  
**الحالة:** Production Ready ✅
