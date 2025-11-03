# 📋 خطة تحسين نظام المنافسات الشاملة

**Comprehensive Tender System Enhancement Plan**

**تاريخ الإعداد:** 3 نوفمبر 2025
**النسخة:** 1.0
**الحالة:** مخطط - جاهز للتنفيذ
**التركيز:** نظام المنافسات فقط (Tender System Only)

---

## 🎯 الأهداف الاستراتيجية (Strategic Goals)

### الهدف الرئيسي

تطوير نظام المنافسات ليصبح **متوافقاً مع أفضل الممارسات العالمية** مع **الحفاظ على التكاملات** القائمة مع الأنظمة الأخرى.

### الأهداف الفرعية

| #   | الهدف                | القياس                         | المدة المستهدفة |
| --- | -------------------- | ------------------------------ | --------------- |
| 1   | تحسين جودة الكود     | من 5/10 إلى 8.5/10             | 4 أسابيع        |
| 2   | رفع الأداء           | تحميل أسرع بنسبة 60%           | 2 أسابيع        |
| 3   | زيادة قابلية الصيانة | تقليل ملفات 600+ سطر بنسبة 80% | 3 أسابيع        |
| 4   | تطبيق SOLID          | من 4.2/10 إلى 8/10             | 4 أسابيع        |
| 5   | تحسين الأمان         | إضافة Conflict Resolution      | أسبوعين         |

---

## 🔗 العلاقات والتكاملات المحمية (Protected Integrations)

### العلاقات الأساسية (يجب الحفاظ عليها)

```
نظام المنافسات
├── → المشاريع (Projects)
│   ├── TenderProjectRelation
│   ├── projectAutoCreation.ts
│   └── التكامل: عند الفوز بمنافسة → إنشاء مشروع تلقائي
│
├── → المشتريات (Purchase Orders) - علاقة غير مباشرة
│   ├── Tender → Project → PurchaseOrder
│   └── التكامل: عبر المشاريع فقط
│
├── → لوحة التحكم (Dashboard)
│   ├── tenderSelectors.ts
│   ├── KPI calculations
│   └── التكامل: عرض إحصائيات المنافسات
│
└── → إدارة التطوير (Development Management)
    ├── developmentStatsService.ts
    └── التكامل: احتساب معدلات الأداء
```

### المكونات المشتركة (Shared Components)

| المكون               | المستخدمون                       | الأهمية    |
| -------------------- | -------------------------------- | ---------- |
| `tenderSelectors.ts` | Dashboard, Reports, KPIs, Charts | ⭐⭐⭐⭐⭐ |
| `RelationRepository` | Projects, Tenders                | ⭐⭐⭐⭐⭐ |
| `centralDataService` | All Systems                      | ⭐⭐⭐⭐⭐ |
| `APP_EVENTS`         | Event-driven updates             | ⭐⭐⭐⭐⭐ |

**⚠️ تحذير:** أي تغيير في هذه المكونات يجب أن يحافظ على **التوافق العكسي** (Backward Compatibility)

---

## 🏗️ الهيكل المعماري المستهدف (Target Architecture)

### Store-Based Architecture

```typescript
// ✅ الهيكل المستهدف (متوافق مع Zustand)

📁 src/application/stores/tender/
├── tenderDataStore.ts        // ✨ جديد - بيانات المنافسات فقط
├── tenderFiltersStore.ts     // ✨ جديد - الفلاتر فقط
├── tenderSelectionStore.ts   // ✨ جديد - الاختيار فقط
├── tenderSortStore.ts        // ✨ جديد - الترتيب فقط
└── tenderPricingStore.ts     // ✅ موجود - يبقى كما هو

// استبدال
├── tenderListStore.ts        // ❌ حذف - تقسيمه إلى stores أصغر
└── tenderDetailsStore.ts     // ❌ حذف - تقسيمه إلى stores أصغر
```

### Clean Architecture Layers

```
📁 Presentation Layer (عرض)
   └── Components: عرض فقط، بدون منطق

📁 Application Layer (تطبيق)
   ├── Stores (Zustand): إدارة الحالة
   ├── Hooks: منطق التطبيق
   └── Services: عمليات معقدة

📁 Domain Layer (المجال) ⭐ القلب
   ├── Selectors: حسابات نقية (SSOT)
   ├── Entities: نماذج البيانات
   └── Business Rules: قواعد العمل

📁 Infrastructure Layer (البنية التحتية)
   ├── Repositories: الوصول للبيانات
   └── Storage: التخزين المحلي
```

---

## 📊 المراحل التنفيذية (Implementation Phases)

### **Phase 1: الأساسيات والأداء (أسبوع واحد)** ⚡

**الهدف:** تحسينات فورية بدون تغيير معماري كبير

| #   | المهمة                            | التأثير   | المدة |
| --- | --------------------------------- | --------- | ----- |
| 1.1 | إضافة Pagination لقوائم المنافسات | +50% أداء | 2 يوم |
| 1.2 | إضافة useMemo للحسابات            | +40% أداء | 1 يوم |
| 1.3 | Virtual Scrolling                 | +30% UX   | 2 يوم |
| 1.4 | تنظيف: حذف console.logs           | نظافة     | 1 يوم |

**المخرجات:**

- ✅ تحميل أسرع للمنافسات
- ✅ استجابة UI أفضل
- ✅ كود أنظف

---

### **Phase 2: تقسيم Stores (أسبوعين)** 🎯

**الهدف:** تحويل من God Stores إلى Small Focused Stores

#### 2.1 إنشاء Stores الجديدة (أسبوع 1)

```typescript
// ✨ Stores جديدة صغيرة ومتخصصة

// 1. tenderDataStore.ts
interface TenderDataStore {
  tenders: Tender[]
  isLoading: boolean
  error: string | null

  loadTenders: () => Promise<void>
  getTender: (id: string) => Tender | undefined
  addTender: (tender: Tender) => void
  updateTender: (id: string, updates: Partial<Tender>) => void
  deleteTender: (id: string) => void
}

// 2. tenderFiltersStore.ts
interface TenderFiltersStore {
  status: TenderStatus | 'all'
  priority: Priority | 'all'
  search: string
  dateRange: { from?: string; to?: string }

  setStatus: (status: TenderStatus | 'all') => void
  setPriority: (priority: Priority | 'all') => void
  setSearch: (query: string) => void
  setDateRange: (range: { from?: string; to?: string }) => void
  clearFilters: () => void
}

// 3. tenderSelectionStore.ts
interface TenderSelectionStore {
  selectedIds: Set<string>

  select: (id: string) => void
  deselect: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  isSelected: (id: string) => boolean
}

// 4. tenderSortStore.ts
interface TenderSortStore {
  field: SortField
  direction: 'asc' | 'desc'

  setSort: (field: SortField, direction?: 'asc' | 'desc') => void
  toggleDirection: () => void
}
```

#### 2.2 Migration من Old Stores (أسبوع 2)

```typescript
// المرحلة الانتقالية - Adapters للتوافق

// useTenderListStore.ts - Adapter
export function useTenderListStore() {
  // يستخدم الـ stores الجديدة داخلياً
  const data = useTenderDataStore()
  const filters = useTenderFiltersStore()
  const selection = useTenderSelectionStore()
  const sort = useTenderSortStore()

  // يرجع نفس الواجهة القديمة
  return {
    tenders: data.tenders,
    filteredTenders: applyFilters(data.tenders, filters),
    selectedIds: selection.selectedIds,
    // ... باقي الواجهة
  }
}
```

#### 2.3 تنظيف Phase 2

- ❌ حذف `tenderListStore.ts` القديم (بعد التأكد من نقل كل الوظائف)
- ❌ حذف `tenderDetailsStore.ts` القديم
- ✅ الإبقاء على adapters حتى نهاية المشروع
- ✅ تحديث imports في كل المكونات

---

### **Phase 3: تقسيم الخدمات العملاقة (أسبوعين)** 🔨

**الهدف:** من God Service إلى Focused Services

#### 3.1 تقسيم centralDataService.ts (900 سطر → 5 ملفات)

```typescript
// ✨ خدمات جديدة متخصصة

📁 src/application/services/data/
├── TenderDataService.ts          // 150 سطر - منافسات فقط
│   ├── loadTenders()
│   ├── getTender()
│   ├── saveTender()
│   └── deleteTender()
│
├── ProjectDataService.ts         // 150 سطر - مشاريع فقط
│   ├── loadProjects()
│   └── ...
│
├── ClientDataService.ts          // 100 سطر - عملاء فقط
│
├── RelationshipService.ts        // 100 سطر - العلاقات فقط
│   ├── linkTenderToProject()
│   ├── unlinkTender()
│   └── getProjectIdByTenderId()
│
└── TenderAnalyticsService.ts    // 80 سطر - إحصائيات فقط
    ├── getTenderStats()
    ├── getWinRate()
    └── getPerformanceMetrics()
```

#### 3.2 تقسيم TenderPricingRepository.ts (648 سطر → 4 ملفات)

```typescript
📁 src/infrastructure/repositories/tender-pricing/
├── PricingDataRepository.ts      // 100 سطر
│   ├── loadPricing()
│   └── savePricing()
│
├── BOQRepository.ts              // 200 سطر
│   ├── loadBOQ()
│   ├── saveBOQ()
│   └── updateBOQ()
│
├── TenderStatusRepository.ts    // 100 سطر
│   ├── getStatus()
│   └── updateStatus()
│
└── PricingConfigRepository.ts   // 50 سطر
    ├── getDefaultPercentages()
    └── updateDefaultPercentages()
```

#### 3.3 إنشاء Orchestrator (منسق)

```typescript
// ✅ خدمة منسقة للعمليات المعقدة
// TenderPricingOrchestrator.ts

export class TenderPricingOrchestrator {
  constructor(
    private pricingRepo: PricingDataRepository,
    private boqRepo: BOQRepository,
    private statusRepo: TenderStatusRepository,
  ) {}

  // العملية المعقدة مقسمة إلى خطوات واضحة
  async persistPricingAndBOQ(tenderId: string, data: PricingData) {
    const transaction = new Transaction()

    try {
      // Step 1: Save pricing
      await transaction.add(() => this.pricingRepo.savePricing(tenderId, data))

      // Step 2: Update BOQ
      await transaction.add(() => this.boqRepo.updateBOQ(tenderId, data.boq))

      // Step 3: Update status
      await transaction.add(() => this.statusRepo.updateStatus(tenderId, 'priced'))

      await transaction.commit()
      return { success: true }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }
}
```

#### 3.4 تنظيف Phase 3

- ❌ حذف `centralDataService.ts` القديم
- ❌ حذف `TenderPricingRepository.ts` القديم
- ✅ إنشاء facade للتوافق مع الكود القديم
- ✅ تحديث serviceRegistry.ts

---

### **Phase 4: تقسيم المكونات العملاقة (أسبوعين)** 🎨

**الهدف:** من God Components إلى Small Components

#### 4.1 تقسيم TenderPricingPage.tsx (767 سطر)

```typescript
📁 src/presentation/pages/Tenders/TenderPricing/
├── TenderPricingPage.tsx         // 100 سطر - المنسق فقط
│
├── components/
│   ├── PricingHeader.tsx         // 80 سطر
│   ├── PricingForm.tsx           // 150 سطر
│   ├── BOQSection.tsx            // 200 سطر
│   ├── AttachmentsSection.tsx    // 100 سطر
│   ├── CalculationsSummary.tsx   // 120 سطر
│   └── PricingActions.tsx        // 80 سطر
│
└── hooks/
    ├── usePricingState.ts        // state management
    ├── usePricingCalculations.ts // calculations
    └── usePricingActions.ts      // actions
```

#### 4.2 تقسيم TendersPage.tsx (400+ سطر)

```typescript
📁 src/presentation/pages/Tenders/
├── TendersPage.tsx               // 80 سطر - المنسق فقط
│
└── components/
    ├── TenderFilters.tsx         // 100 سطر
    ├── TenderList.tsx            // 120 سطر
    ├── TenderCard.tsx            // 80 سطر
    └── TenderActions.tsx         // 60 سطر
```

#### 4.3 تنظيف Phase 4

- ❌ حذف الملفات الكبيرة القديمة
- ✅ اختبار كل component بشكل مستقل
- ✅ تحديث storybook (إن وُجد)

---

### **Phase 5: الأمان والموثوقية (أسبوعين)** 🔒

**الهدف:** إضافة Conflict Resolution و Error Recovery

#### 5.1 Optimistic Locking + Database Migration Strategy

**⚠️ هذا Phase حرج - يتضمن تغيير schema البيانات!**

##### 5.1.1 تحديث Data Model

```typescript
// ✅ النموذج الجديد مع version control

interface VersionedTender extends Tender {
  // حقول جديدة للـ optimistic locking
  version: number // يزداد مع كل تحديث (يبدأ من 1)
  lastModified: Date // آخر تعديل
  lastModifiedBy: string // من عدّل آخر مرة

  // الحقول القديمة تبقى كما هي
  id: string
  title: string
  status: TenderStatus
  // ...
}
```

---

##### 5.1.2 Database Migration Strategy (استراتيجية ترحيل البيانات)

**المشكلة:**

- لدينا 10,000+ منافسة موجودة **بدون** version field
- لا يمكن إضافة version field مباشرة → سيسبب data inconsistency
- يجب backfill البيانات القديمة بطريقة آمنة

**الحل: 4 مراحل**

---

###### **المرحلة 1: Pre-Migration Validation (التحقق قبل الترحيل)**

```typescript
// scripts/validate-pre-migration.ts

interface PreMigrationReport {
  totalTenders: number
  tendersWithVersion: number // يجب أن يكون 0
  tendersWithoutVersion: number // يجب أن يساوي totalTenders
  dataIntegrityIssues: string[]
  backupCreated: boolean
  readyForMigration: boolean
}

async function validatePreMigration(): Promise<PreMigrationReport> {
  console.log('🔍 Phase 5 Pre-Migration Validation...')

  // 1. تحميل جميع المنافسات
  const tenders = await getAllTenders()

  // 2. التحقق من عدم وجود version field
  const tendersWithVersion = tenders.filter((t) => 'version' in t)

  if (tendersWithVersion.length > 0) {
    throw new Error('Some tenders already have version field!')
  }

  // 3. التحقق من سلامة البيانات
  const issues: string[] = []

  tenders.forEach((tender) => {
    if (!tender.id) issues.push(`Tender missing id: ${JSON.stringify(tender)}`)
    if (!tender.status) issues.push(`Tender ${tender.id} missing status`)
    // المزيد من التحققات...
  })

  if (issues.length > 0) {
    console.error('❌ Data integrity issues found:', issues)
    return {
      totalTenders: tenders.length,
      tendersWithVersion: tendersWithVersion.length,
      tendersWithoutVersion: tenders.length,
      dataIntegrityIssues: issues,
      backupCreated: false,
      readyForMigration: false,
    }
  }

  // 4. إنشاء backup
  const backupPath = await createBackup('pre-phase5-migration')
  console.log(`✅ Backup created: ${backupPath}`)

  return {
    totalTenders: tenders.length,
    tendersWithVersion: 0,
    tendersWithoutVersion: tenders.length,
    dataIntegrityIssues: [],
    backupCreated: true,
    readyForMigration: true,
  }
}

// يجب تشغيل هذا قبل Migration
// npm run validate:pre-migration
```

---

###### **المرحلة 2: Backfill Strategy (استراتيجية ملء البيانات)**

**الخيار A: Batched Backfill (ملء دفعي - الموصى به)**

```typescript
// scripts/backfill-tender-versions.ts

interface BackfillOptions {
  batchSize: number // عدد المنافسات في كل دفعة (مثلاً 100)
  delayMs: number // تأخير بين الدفعات (مثلاً 100ms)
  dryRun: boolean // اختبار بدون كتابة فعلية
}

async function backfillTenderVersions(
  options: BackfillOptions = {
    batchSize: 100,
    delayMs: 100,
    dryRun: false,
  },
): Promise<void> {
  console.log('🔄 Starting batched backfill...')

  const tenders = await getAllTenders()
  const totalBatches = Math.ceil(tenders.length / options.batchSize)

  for (let i = 0; i < totalBatches; i++) {
    const start = i * options.batchSize
    const end = Math.min(start + options.batchSize, tenders.length)
    const batch = tenders.slice(start, end)

    console.log(`📦 Processing batch ${i + 1}/${totalBatches} (${batch.length} tenders)`)

    // معالجة الدفعة
    const updatedBatch = batch.map((tender) => ({
      ...tender,
      version: 1, // البداية من version 1
      lastModified: new Date(),
      lastModifiedBy: 'system-migration',
    }))

    if (!options.dryRun) {
      // حفظ الدفعة
      await saveTendersBatch(updatedBatch)
    }

    // تأخير قبل الدفعة التالية (منع overload)
    await delay(options.delayMs)
  }

  console.log('✅ Backfill completed successfully')
}

// Dry run أولاً
// npm run backfill:tenders -- --dry-run

// ثم التنفيذ الفعلي
// npm run backfill:tenders
```

**الخيار B: Lazy Migration (ترحيل كسول - بديل)**

```typescript
// ✅ إضافة version عند أول قراءة/كتابة

class TenderRepository {
  async get(id: string): Promise<VersionedTender> {
    const tender = await this.storage.get(id)

    // إذا لم يكن لديه version → أضفه الآن
    if (!('version' in tender)) {
      const migrated: VersionedTender = {
        ...tender,
        version: 1,
        lastModified: new Date(),
        lastModifiedBy: 'system-lazy-migration',
      }

      // احفظه مباشرة
      await this.storage.save(migrated)
      return migrated
    }

    return tender as VersionedTender
  }

  async update(tender: Partial<Tender>): Promise<VersionedTender> {
    const current = await this.get(tender.id) // سيضيف version إذا لم يكن موجود

    // الآن يمكن المتابعة بأمان
    // ...
  }
}
```

**المقارنة:**

| الاستراتيجية         | الإيجابيات                                                                               | السلبيات                                                                                        | الاختيار           |
| -------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------ |
| **Batched Backfill** | - كل البيانات متسقة فوراً<br>- يمكن rollback بسهولة<br>- يمكن تفعيل version checks فوراً | - يحتاج downtime قصير (5-10 دقائق)<br>- استهلاك CPU/Memory                                      | ✅ **موصى به**     |
| **Lazy Migration**   | - لا downtime<br>- تدريجي                                                                | - بيانات غير متسقة لفترة<br>- لا يمكن تفعيل version checks حتى 100% migration<br>- أكثر تعقيداً | للأنظمة الضخمة فقط |

**القرار:** نستخدم **Batched Backfill**

---

###### **المرحلة 3: Deployment Coordination (تنسيق النشر)**

**السؤال الحرج:** متى نفعّل version checks في الكود؟

**الجواب:** بعد Backfill مباشرة!

```bash
#!/bin/bash
# deploy-phase5.sh

echo "🚀 Deploying Phase 5: Optimistic Locking"

# 1. إيقاف التطبيق (منع كتابات جديدة)
echo "⏸️  Stopping application..."
kubectl scale deployment/tender-app --replicas=0

# 2. Backup
echo "📦 Creating backup..."
./scripts/backup_before_phase.sh 5

# 3. Pre-migration validation
echo "🔍 Pre-migration validation..."
npm run validate:pre-migration

if [ $? -ne 0 ]; then
  echo "❌ Pre-migration validation failed!"
  exit 1
fi

# 4. Backfill (Dry run أولاً)
echo "🧪 Backfill dry run..."
npm run backfill:tenders -- --dry-run

# 5. Backfill (فعلي)
echo "🔄 Backfill execution..."
npm run backfill:tenders

# 6. Post-backfill validation
echo "✅ Post-backfill validation..."
npm run validate:post-migration

if [ $? -ne 0 ]; then
  echo "❌ Post-backfill validation failed! Rolling back..."
  ./scripts/rollback_data.sh [timestamp]
  exit 1
fi

# 7. Deploy الكود الجديد (مع version checks)
echo "📤 Deploying new code with version checks..."
npm run build
npm run deploy:production

# 8. إعادة تشغيل التطبيق
echo "▶️  Starting application..."
kubectl scale deployment/tender-app --replicas=3

# 9. Smoke tests
echo "🧪 Running smoke tests..."
npm run test:smoke

echo "✅ Phase 5 deployed successfully!"
```

**Downtime المتوقع:** 5-10 دقائق (حسب عدد المنافسات)

---

###### **المرحلة 4: Rollback Procedure (إجراء الاسترجاع)**

**إذا فشل شيء:**

```bash
#!/bin/bash
# rollback-phase5.sh

echo "🚨 Rolling back Phase 5 migration..."

BACKUP_TIMESTAMP=$1

# 1. إيقاف التطبيق
kubectl scale deployment/tender-app --replicas=0

# 2. استعادة البيانات من Backup (قبل الـ version fields)
cp "backups/tenders_${BACKUP_TIMESTAMP}.json" app-data/tenders.json

# 3. Revert الكود (إزالة version checks)
git revert [commit-hash]
npm run build
npm run deploy:production

# 4. إعادة التشغيل
kubectl scale deployment/tender-app --replicas=3

echo "✅ Rollback completed - version fields removed"
```

---

##### 5.1.3 Optimistic Locking Implementation (التنفيذ)

```typescript
// ✅ بعد نجاح Migration، نفعّل version checks

class TenderRepository {
  async update(tender: VersionedTender): Promise<VersionedTender> {
    const current = await this.get(tender.id)

    // ⭐ Conflict detection
    if (current.version !== tender.version) {
      throw new ConflictError({
        message: 'تم تحديث المنافسة من مكان آخر',
        current,
        attempted: tender,
        resolution: 'merge', // أو 'overwrite' أو 'cancel'
      })
    }

    // Update with new version
    const updated: VersionedTender = {
      ...tender,
      version: tender.version + 1,
      lastModified: new Date(),
      lastModifiedBy: getCurrentUser().id,
    }

    await this.save(updated)

    // Emit event
    emit(APP_EVENTS.TENDER_UPDATED, { tenderId: updated.id, version: updated.version })

    return updated
  }
}
```

---

##### 5.1.4 Conflict Resolution UI

```typescript
// ✅ UI للمستخدم عند حدوث conflict

function ConflictResolutionDialog({
  current,
  attempted,
  onResolve
}: ConflictResolutionProps) {
  return (
    <Dialog>
      <DialogTitle>⚠️ تعارض في البيانات</DialogTitle>
      <DialogContent>
        <p>تم تحديث هذه المنافسة من مكان آخر أثناء تعديلك.</p>

        <ComparisonView>
          <Column>
            <h4>التغييرات الحالية (من الخادم)</h4>
            <DiffView data={current} />
          </Column>

          <Column>
            <h4>تغييراتك</h4>
            <DiffView data={attempted} />
          </Column>
        </ComparisonView>

        <Actions>
          <Button onClick={() => onResolve('cancel')}>
            إلغاء تعديلاتي
          </Button>
          <Button onClick={() => onResolve('overwrite')}>
            الكتابة فوق التحديثات (خطر!)
          </Button>
          <Button onClick={() => onResolve('merge')}>
            دمج التغييرات
          </Button>
        </Actions>
      </DialogContent>
    </Dialog>
  )
}
```

#### 5.2 Transaction Support مع Error Handling المحسّن

**⚠️ معالجة ملاحظة CodeRabbit:** Transaction class المحسّن مع error handling شامل

```typescript
// ✅ Transaction class محسّن مع معالجة أخطاء شاملة

interface TransactionOperation {
  name: string // اسم العملية للتتبع
  execute: () => Promise<any> // العملية نفسها
  rollback: () => Promise<any> // عملية التراجع
  retryOnFailure?: boolean // هل نعيد المحاولة عند الفشل؟
  maxRetries?: number // عدد المحاولات (default: 0)
}

interface TransactionResult {
  success: boolean
  completedOperations: number
  failedOperation?: string
  error?: Error
  rollbackSuccess?: boolean
  rollbackErrors?: Error[]
}

enum TransactionState {
  IDLE = 'idle',
  EXECUTING = 'executing',
  COMMITTED = 'committed',
  ROLLING_BACK = 'rolling_back',
  ROLLED_BACK = 'rolled_back',
  FAILED = 'failed',
}

class Transaction {
  private operations: TransactionOperation[] = []
  private executedOperations: TransactionOperation[] = []
  private state: TransactionState = TransactionState.IDLE

  // للتتبع والتصحيح
  private transactionId: string
  private startTime?: Date
  private endTime?: Date

  constructor(transactionId?: string) {
    this.transactionId =
      transactionId || `txn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }

  /**
   * إضافة عملية للـ transaction
   */
  add(operation: TransactionOperation): void {
    if (this.state !== TransactionState.IDLE) {
      throw new Error(`Cannot add operations in state: ${this.state}`)
    }

    this.operations.push({
      ...operation,
      maxRetries: operation.maxRetries ?? 0,
    })
  }

  /**
   * تنفيذ جميع العمليات
   */
  async commit(): Promise<TransactionResult> {
    if (this.state !== TransactionState.IDLE) {
      throw new Error(`Cannot commit in state: ${this.state}`)
    }

    this.state = TransactionState.EXECUTING
    this.startTime = new Date()

    console.log(`🔄 Transaction ${this.transactionId} starting...`)
    console.log(`   Operations: ${this.operations.length}`)

    let completedCount = 0

    try {
      // تنفيذ كل عملية بالترتيب
      for (const operation of this.operations) {
        console.log(`   ➡️  Executing: ${operation.name}`)

        let lastError: Error | undefined
        let attempts = 0
        const maxAttempts = (operation.retryOnFailure ? operation.maxRetries! : 0) + 1

        // محاولة التنفيذ (مع retry إذا مطلوب)
        while (attempts < maxAttempts) {
          try {
            await operation.execute()
            console.log(`   ✅ Success: ${operation.name}`)

            // نجحت العملية - سجّلها
            this.executedOperations.push(operation)
            completedCount++
            break // خرج من الـ retry loop
          } catch (error) {
            lastError = error as Error
            attempts++

            if (attempts < maxAttempts) {
              console.warn(`   ⚠️  Retry ${attempts}/${maxAttempts - 1} for: ${operation.name}`)
              await this.delay(Math.pow(2, attempts) * 100) // Exponential backoff
            }
          }
        }

        // إذا فشلت كل المحاولات
        if (lastError) {
          console.error(`   ❌ Failed: ${operation.name}`, lastError)

          // Rollback جميع العمليات الناجحة
          const rollbackResult = await this.rollback()

          this.state = TransactionState.FAILED
          this.endTime = new Date()

          return {
            success: false,
            completedOperations: completedCount,
            failedOperation: operation.name,
            error: lastError,
            rollbackSuccess: rollbackResult.success,
            rollbackErrors: rollbackResult.errors,
          }
        }
      }

      // نجحت جميع العمليات!
      this.state = TransactionState.COMMITTED
      this.endTime = new Date()

      console.log(`✅ Transaction ${this.transactionId} committed successfully`)
      console.log(`   Duration: ${this.endTime.getTime() - this.startTime!.getTime()}ms`)

      return {
        success: true,
        completedOperations: completedCount,
      }
    } catch (error) {
      // خطأ غير متوقع (خارج نطاق العمليات)
      console.error(`❌ Transaction ${this.transactionId} failed unexpectedly`, error)

      const rollbackResult = await this.rollback()

      this.state = TransactionState.FAILED
      this.endTime = new Date()

      return {
        success: false,
        completedOperations: completedCount,
        error: error as Error,
        rollbackSuccess: rollbackResult.success,
        rollbackErrors: rollbackResult.errors,
      }
    }
  }

  /**
   * التراجع عن جميع العمليات المنفذة
   *
   * ⚠️ مهم: هذه العملية critical - نحاول rollback حتى لو فشلت بعض الـ rollbacks
   */
  async rollback(): Promise<{ success: boolean; errors: Error[] }> {
    if (this.executedOperations.length === 0) {
      console.log(`ℹ️  No operations to rollback for ${this.transactionId}`)
      return { success: true, errors: [] }
    }

    console.log(`🔙 Rolling back ${this.transactionId}...`)
    console.log(`   Operations to rollback: ${this.executedOperations.length}`)

    this.state = TransactionState.ROLLING_BACK

    const rollbackErrors: Error[] = []
    let successfulRollbacks = 0

    // Rollback بالعكس (LIFO - Last In First Out)
    const reversed = [...this.executedOperations].reverse()

    for (const operation of reversed) {
      try {
        console.log(`   🔙 Rolling back: ${operation.name}`)
        await operation.rollback()
        console.log(`   ✅ Rolled back: ${operation.name}`)
        successfulRollbacks++
      } catch (error) {
        // ⚠️ حتى لو فشل rollback، نستمر في محاولة rollback الباقي!
        console.error(`   ❌ Rollback failed for: ${operation.name}`, error)
        rollbackErrors.push(error as Error)

        // إنشاء dead-letter queue entry
        await this.logFailedRollback(operation, error as Error)
      }
    }

    const allRollbacksSucceeded = rollbackErrors.length === 0
    this.state = allRollbacksSucceeded ? TransactionState.ROLLED_BACK : TransactionState.FAILED

    if (allRollbacksSucceeded) {
      console.log(`✅ Transaction ${this.transactionId} rolled back successfully`)
    } else {
      console.error(`⚠️  Transaction ${this.transactionId} rollback partially failed`)
      console.error(
        `   Successful rollbacks: ${successfulRollbacks}/${this.executedOperations.length}`,
      )
      console.error(`   Failed rollbacks: ${rollbackErrors.length}`)

      // تنبيه فوري للفريق
      await this.alertTeam({
        transactionId: this.transactionId,
        message: 'Transaction rollback partially failed - manual intervention required',
        successfulRollbacks,
        totalOperations: this.executedOperations.length,
        errors: rollbackErrors,
      })
    }

    return {
      success: allRollbacksSucceeded,
      errors: rollbackErrors,
    }
  }

  /**
   * تسجيل rollback فاشل في dead-letter queue
   */
  private async logFailedRollback(operation: TransactionOperation, error: Error): Promise<void> {
    const entry = {
      transactionId: this.transactionId,
      operationName: operation.name,
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
      },
      status: 'PENDING_MANUAL_RESOLUTION',
    }

    try {
      // حفظ في dead-letter queue
      await this.saveToDeadLetterQueue(entry)
      console.log(`📝 Logged failed rollback to dead-letter queue: ${operation.name}`)
    } catch (queueError) {
      // حتى dead-letter queue فشل!
      console.error(`❌ Failed to log to dead-letter queue!`, queueError)

      // آخر محاولة: الكتابة إلى ملف محلي
      try {
        const fs = await import('fs/promises')
        await fs.appendFile('failed-rollbacks.log', JSON.stringify(entry) + '\n')
      } catch (fileError) {
        // لا يوجد شيء آخر نفعله - فقط نطبع في console
        console.error('CRITICAL: Cannot log failed rollback anywhere!', entry)
      }
    }
  }

  /**
   * تنبيه الفريق عن مشكلة حرجة
   */
  private async alertTeam(alert: {
    transactionId: string
    message: string
    successfulRollbacks: number
    totalOperations: number
    errors: Error[]
  }): Promise<void> {
    // يمكن دمجها مع Slack, Email, PagerDuty, etc.
    console.error('🚨 ALERT TO TEAM:', alert)

    // مثال: إرسال webhook
    try {
      // await fetch('https://hooks.slack.com/...', {
      //   method: 'POST',
      //   body: JSON.stringify({ text: JSON.stringify(alert) })
      // })
    } catch (error) {
      console.error('Failed to send alert', error)
    }
  }

  /**
   * حفظ في dead-letter queue
   */
  private async saveToDeadLetterQueue(entry: any): Promise<void> {
    // يمكن حفظها في localStorage أو database أو message queue
    const key = `dead-letter-queue-${this.transactionId}`
    localStorage.setItem(key, JSON.stringify(entry))
  }

  /**
   * Utility: delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * الحصول على حالة Transaction
   */
  getState(): TransactionState {
    return this.state
  }

  /**
   * الحصول على معلومات Transaction
   */
  getInfo() {
    return {
      id: this.transactionId,
      state: this.state,
      totalOperations: this.operations.length,
      executedOperations: this.executedOperations.length,
      duration:
        this.startTime && this.endTime ? this.endTime.getTime() - this.startTime.getTime() : null,
    }
  }
}

// ✅ ConflictError class محسّن
class ConflictError extends Error {
  constructor(
    public current: any,
    public attempted: any,
    public resolution: 'merge' | 'overwrite' | 'cancel',
  ) {
    super('Conflict detected - data was modified elsewhere')
    this.name = 'ConflictError'
  }
}

// ✅ TransactionError class
class TransactionError extends Error {
  constructor(
    message: string,
    public transactionId: string,
    public failedOperation: string,
    public originalError: Error,
  ) {
    super(message)
    this.name = 'TransactionError'
  }
}
```

---

##### استخدام Transaction المحسّن في TenderPricingOrchestrator

```typescript
// ✅ مثال واقعي مع error handling شامل

class TenderPricingOrchestrator {
  async persistPricingAndBOQ(
    tenderId: string,
    pricingData: PricingData,
    boqData: BOQData,
  ): Promise<{ success: boolean; error?: Error }> {
    const transaction = new Transaction(`pricing-${tenderId}`)

    // تخزين النسخ الأصلية للـ rollback
    let originalPricing: PricingData | null = null
    let originalBOQ: BOQData | null = null
    let originalStatus: TenderStatus | null = null

    // ============================================
    // Operation 1: Save Pricing
    // ============================================
    transaction.add({
      name: 'save-pricing',

      execute: async () => {
        // حفظ النسخة الأصلية أولاً
        originalPricing = await this.pricingRepo.loadPricing(tenderId)

        // حفظ الجديدة
        await this.pricingRepo.savePricing(tenderId, pricingData)
      },

      rollback: async () => {
        if (originalPricing) {
          await this.pricingRepo.savePricing(tenderId, originalPricing)
        } else {
          // كانت فارغة قبل ذلك - احذفها
          await this.pricingRepo.deletePricing(tenderId)
        }
      },

      retryOnFailure: true,
      maxRetries: 3,
    })

    // ============================================
    // Operation 2: Update BOQ
    // ============================================
    transaction.add({
      name: 'update-boq',

      execute: async () => {
        originalBOQ = await this.boqRepo.loadBOQ(tenderId)
        await this.boqRepo.updateBOQ(tenderId, boqData)
      },

      rollback: async () => {
        if (originalBOQ) {
          await this.boqRepo.updateBOQ(tenderId, originalBOQ)
        } else {
          await this.boqRepo.deleteBOQ(tenderId)
        }
      },

      retryOnFailure: true,
      maxRetries: 3,
    })

    // ============================================
    // Operation 3: Update Status
    // ============================================
    transaction.add({
      name: 'update-status',

      execute: async () => {
        originalStatus = (await this.tenderRepo.get(tenderId)).status
        await this.statusRepo.updateStatus(tenderId, 'priced')
      },

      rollback: async () => {
        if (originalStatus) {
          await this.statusRepo.updateStatus(tenderId, originalStatus)
        }
      },

      retryOnFailure: false, // Status update عادةً يكون سريع - لا داعي للـ retry
    })

    // ============================================
    // Operation 4: Emit Events
    // ============================================
    transaction.add({
      name: 'emit-events',

      execute: async () => {
        emit(APP_EVENTS.TENDER_PRICED, { tenderId })
        emit(APP_EVENTS.BOQ_UPDATED, { tenderId })
      },

      rollback: async () => {
        // Events لا يمكن rollback
        // لكن نُرسل compensating event
        emit(APP_EVENTS.TENDER_PRICING_ROLLED_BACK, { tenderId })
      },

      retryOnFailure: false,
    })

    // ============================================
    // Execute Transaction
    // ============================================
    const result = await transaction.commit()

    if (!result.success) {
      console.error('❌ Transaction failed:', {
        failedOperation: result.failedOperation,
        completedOperations: result.completedOperations,
        rollbackSuccess: result.rollbackSuccess,
      })

      return {
        success: false,
        error: new TransactionError(
          `Failed to persist pricing for tender ${tenderId}`,
          transaction.getInfo().id,
          result.failedOperation!,
          result.error!,
        ),
      }
    }

    console.log('✅ Transaction succeeded:', transaction.getInfo())
    return { success: true }
  }
}
```

---

##### معالجة Concurrent Transactions

```typescript
// ✅ منع concurrent transactions على نفس الـ tender

class TransactionManager {
  private activeTran sactions = new Map<string, Transaction>()
  private locks = new Map<string, Promise<void>>()

  async executeWithLock<T>(
    resourceId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    // انتظر إذا كان هناك transaction نشط
    while (this.locks.has(resourceId)) {
      await this.locks.get(resourceId)
    }

    // أنشئ lock جديد
    let releaseLock: () => void
    const lockPromise = new Promise<void>(resolve => {
      releaseLock = resolve
    })

    this.locks.set(resourceId, lockPromise)

    try {
      // نفّذ العملية
      return await operation()
    } finally {
      // حرر الـ lock
      this.locks.delete(resourceId)
      releaseLock!()
    }
  }
}

// الاستخدام
const transactionManager = new TransactionManager()

await transactionManager.executeWithLock(`tender-${tenderId}`, async () => {
  return await orchestrator.persistPricingAndBOQ(tenderId, pricingData, boqData)
})
```

#### 5.3 Error Recovery

```typescript
// ✅ استرجاع تلقائي من الأخطاء

class ResilientTenderService {
  async saveTender(tender: Tender, options = { maxRetries: 3 }) {
    let lastError: Error

    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      try {
        return await this.repository.save(tender)
      } catch (error) {
        lastError = error

        // Exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000)

        // Try to recover
        if (this.isRecoverable(error)) {
          continue
        } else {
          throw error
        }
      }
    }

    throw new MaxRetriesError(lastError)
  }
}
```

#### 5.4 تنظيف Phase 5

- ✅ اختبار scenarios التضارب
- ✅ اختبار recovery mechanisms
- ✅ توثيق error handling strategy

---

### **Phase 6: الاختبارات (أسبوعين)** 🧪

**الهدف:** 80% Test Coverage

#### 6.1 Unit Tests - Domain Layer

```typescript
// ✅ tests/domain/selectors/tenderSelectors.test.ts

describe('Tender Selectors', () => {
  const mockTenders: Tender[] = [
    { id: '1', status: 'won', value: 100000 },
    { id: '2', status: 'lost', value: 50000 },
    { id: '3', status: 'submitted', value: 150000 },
  ]

  describe('selectWonTendersCount', () => {
    it('returns correct count', () => {
      expect(selectWonTendersCount(mockTenders)).toBe(1)
    })

    it('handles empty array', () => {
      expect(selectWonTendersCount([])).toBe(0)
    })
  })

  describe('selectWinRate', () => {
    it('calculates win rate correctly', () => {
      // 1 won / 1 submitted = 100%
      expect(selectWinRate(mockTenders)).toBe(100.0)
    })

    it('returns 0 when no submitted tenders', () => {
      const tenders = [{ id: '1', status: 'new', value: 0 }]
      expect(selectWinRate(tenders)).toBe(0)
    })
  })
})

// Target: 90% coverage للـ selectors
```

#### 6.2 Integration Tests - Stores

```typescript
// ✅ tests/integration/stores/tenderStores.test.ts

describe('Tender Stores Integration', () => {
  beforeEach(() => {
    // Reset all stores
    useTenderDataStore.getState().reset()
    useTenderFiltersStore.getState().reset()
  })

  it('filters work with data store', async () => {
    // 1. Load tenders
    await useTenderDataStore.getState().loadTenders()

    // 2. Apply filter
    useTenderFiltersStore.getState().setStatus('won')

    // 3. Check filtered results
    const data = useTenderDataStore.getState()
    const filters = useTenderFiltersStore.getState()
    const filtered = applyFilters(data.tenders, filters)

    expect(filtered.every((t) => t.status === 'won')).toBe(true)
  })
})
```

#### 6.3 E2E Tests - Critical Flows

```typescript
// ✅ tests/e2e/tender-complete-flow.spec.ts

test('complete tender lifecycle', async ({ page }) => {
  // 1. Create tender
  await page.goto('/tenders')
  await page.click('[data-testid="create-tender"]')
  await page.fill('[name="title"]', 'E2E Test Tender')
  await page.click('[data-testid="save"]')

  // 2. Add pricing
  await page.click('[data-testid="price-tender"]')
  await page.fill('[name="item-price"]', '10000')
  await page.click('[data-testid="save-pricing"]')

  // 3. Submit tender
  await page.click('[data-testid="submit-tender"]')

  // 4. Mark as won
  await page.click('[data-testid="mark-won"]')

  // 5. Verify project creation
  await page.goto('/projects')
  await expect(page.locator('text=E2E Test Tender')).toBeVisible()
})
```

#### 6.4 تنظيف Phase 6

- ✅ إزالة test files القديمة المكررة
- ✅ توحيد test utilities
- ✅ تحديث test documentation

---

### **Phase 7: التوثيق والنشر (أسبوع واحد)** 📚

**الهدف:** توثيق شامل للنظام الجديد

#### 7.1 توثيق Architecture

```markdown
# نظام المنافسات - دليل المعمارية

## البنية العامة

[رسم توضيحي]

## Stores

- tenderDataStore: إدارة البيانات
- tenderFiltersStore: الفلاتر
  ...

## التكاملات

### مع المشاريع

...
```

#### 7.2 توثيق API

```typescript
/**
 * تحميل جميع المنافسات
 *
 * @returns Promise<Tender[]>
 * @throws LoadError إذا فشل التحميل
 *
 * @example
 * const tenders = await tenderService.loadAll()
 */
```

#### 7.3 Migration Guide

```markdown
# دليل الترحيل من النظام القديم

## Breaking Changes

- `useTenderListStore()` → استخدم `useTenderDataStore()` + `useTenderFiltersStore()`

## Deprecated

- `centralDataService.getTenderStats()` → استخدم `TenderAnalyticsService.getStats()`
```

#### 7.4 تنظيف نهائي

- ❌ حذف TODOS القديمة
- ❌ حذف commented code
- ❌ حذف console.logs
- ❌ حذف unused imports
- ✅ Final cleanup commit

---

## 📐 المبادئ الهندسية (Engineering Principles)

### 1. **Backward Compatibility** (التوافق العكسي)

```typescript
// ✅ طريقة آمنة للتغيير

// Step 1: إضافة الجديد
export const newFunction = () => {
  /* ... */
}

// Step 2: deprecate القديم
/** @deprecated استخدم newFunction بدلاً منه */
export const oldFunction = () => newFunction()

// Step 3: حذف القديم (بعد 2-3 إصدارات)
// export const oldFunction = ...
```

### 2. **Event-Driven Updates** (التحديثات المبنية على الأحداث)

```typescript
// ✅ الحفاظ على Event Bus

// يجب إطلاق events عند التغييرات
await tenderService.update(tender)
emit(APP_EVENTS.TENDER_UPDATED, { tenderId: tender.id })

// المستمعون الحاليون سيستمرون في العمل
// Dashboard, Projects, Charts, etc.
```

### 3. **Relation Preservation** (الحفاظ على العلاقات)

```typescript
// ✅ عدم كسر العلاقات

class TenderService {
  async delete(tenderId: string) {
    // 1. Check relations
    const projectId = relationRepo.getProjectIdByTenderId(tenderId)

    if (projectId) {
      throw new Error('لا يمكن حذف منافسة مرتبطة بمشروع')
    }

    // 2. Safe to delete
    await this.repository.delete(tenderId)
  }
}
```

### 4. **Progressive Enhancement** (التحسين التدريجي)

```typescript
// ✅ إضافة features جديدة بدون كسر القديم

interface Tender {
  // Existing fields
  id: string
  title: string

  // New optional fields
  version?: number // للـ optimistic locking
  lastModified?: Date
  tags?: string[] // للتصنيف
}
```

---

## 🎯 المقاييس والأهداف (Metrics & Targets)

### مقاييس الأداء (Performance)

| المقياس              | الحالي  | المستهدف | طريقة القياس            |
| -------------------- | ------- | -------- | ----------------------- |
| Initial Load Time    | ~2000ms | <800ms   | Lighthouse              |
| Re-render Time       | ~150ms  | <50ms    | React DevTools          |
| Memory Usage         | ~80MB   | <50MB    | Chrome DevTools         |
| Bundle Size (Tender) | ~450KB  | <300KB   | webpack-bundle-analyzer |

### مقاييس الجودة (Quality)

| المقياس           | الحالي    | المستهدف   |
| ----------------- | --------- | ---------- |
| Test Coverage     | 20%       | 80%        |
| TypeScript Errors | 15+       | 0          |
| ESLint Warnings   | 50+       | <10        |
| Code Duplication  | 23+ cases | 0          |
| Average File Size | 350 lines | <200 lines |
| Max File Size     | 900 lines | <300 lines |

### مقاييس SOLID

| المبدأ    | الحالي     | المستهدف   |
| --------- | ---------- | ---------- |
| SRP       | 3/10       | 8/10       |
| OCP       | 5/10       | 8/10       |
| LSP       | 7/10       | 9/10       |
| ISP       | 2/10       | 8/10       |
| DIP       | 4/10       | 8/10       |
| **متوسط** | **4.2/10** | **8.2/10** |

---

## ⚠️ المخاطر والتخفيف (Risks & Mitigation)

### مخاطر عالية

| المخاطر                       | الاحتمالية | التأثير | التخفيف                          |
| ----------------------------- | ---------- | ------- | -------------------------------- |
| كسر التكاملات مع المشاريع     | متوسط      | عالي    | اختبارات integration شاملة       |
| فقدان بيانات أثناء Migration  | منخفض      | حرج     | نسخ احتياطية + تجربة على staging |
| Performance regression        | متوسط      | متوسط   | Performance benchmarks قبل/بعد   |
| فريق غير جاهز                 | عالي       | متوسط   | تدريب + documentation واضحة      |
| فشل data migration            | منخفض      | حرج     | استراتيجية backfill تدريجية      |
| تضارب بيانات أثناء deployment | متوسط      | عالي    | Canary deployment + monitoring   |

---

## 🔄 استراتيجية Deployment (Deployment Strategy)

### المبدأ: Progressive Rollout (النشر التدريجي)

**⚠️ لا ننشر مباشرة إلى Production!**

### المراحل الثلاث للنشر:

```
Development → Staging → Canary (10%) → Production (100%)
    ↓            ↓           ↓              ↓
  تطوير       اختبار      مراقبة         نشر كامل
```

---

### 1. Development Environment

**الهدف:** تطوير واختبار أولي

```bash
# تشغيل محلي
npm run dev

# اختبارات محلية
npm test
npm run test:integration
```

**معايير الانتقال للـ Staging:**

- ✅ جميع unit tests تمر (100%)
- ✅ جميع integration tests تمر
- ✅ لا TypeScript errors
- ✅ Code review approved

---

### 2. Staging Environment

**الهدف:** محاكاة Production بالكامل

```bash
# النشر على staging
npm run deploy:staging

# اختبارات E2E
npm run test:e2e:staging

# Performance testing
npm run test:performance
```

**البيانات في Staging:**

- استخدام **نسخة من Production data** (anonymized)
- أو بيانات اختبار واقعية (10,000+ منافسة)

**معايير الانتقال للـ Canary:**

- ✅ جميع E2E tests تمر
- ✅ Performance metrics ≥ targets
- ✅ لا regression bugs
- ✅ QA approval
- ✅ Smoke tests تمر

**مدة الاختبار في Staging:**

- Phase 1-2: يومان على الأقل
- Phase 3-5: 3 أيام على الأقل
- Phase 6-7: يوم واحد على الأقل

---

### 3. Canary Deployment (النشر التجريبي)

**الهدف:** اختبار على نسبة صغيرة من المستخدمين الحقيقيين

```typescript
// Canary configuration
const CANARY_PERCENTAGE = 10 // 10% من المستخدمين

// Feature flag للتحكم
const isCanaryUser = () => {
  const userId = getCurrentUser().id
  const hash = hashCode(userId)
  return hash % 100 < CANARY_PERCENTAGE
}

// في الكود
const tenderStore = isCanaryUser()
  ? useNewTenderDataStore() // 10% يستخدمون الجديد
  : useOldTenderListStore() // 90% يستخدمون القديم
```

**المراقبة (Monitoring):**

```typescript
// مقاييس يجب مراقبتها
interface CanaryMetrics {
  errorRate: number // معدل الأخطاء
  avgResponseTime: number // متوسط زمن الاستجابة
  crashRate: number // معدل التعطل
  userComplaints: number // شكاوى المستخدمين
}

// عتبات التنبيه
const ALERT_THRESHOLDS = {
  errorRate: 0.5, // > 0.5% أخطاء → تنبيه
  avgResponseTime: 200, // > 200ms → تنبيه
  crashRate: 0.1, // > 0.1% تعطل → تنبيه
  userComplaints: 5, // > 5 شكاوى/ساعة → تنبيه
}
```

**المدة:**

- **Phase 1-2:** 2-3 أيام canary
- **Phase 3-5:** 5-7 أيام canary
- **Phase 6-7:** 1-2 يوم canary

**معايير النجاح:**

- ✅ Error rate ≤ baseline + 0.5%
- ✅ Response time ≤ baseline + 10%
- ✅ Crash rate ≤ baseline
- ✅ لا شكاوى متكررة من نفس المشكلة

**إذا فشل Canary:**
→ **Rollback فوري** (انظر خطة Rollback أدناه)

---

### 4. Production Deployment (النشر الكامل)

**فقط بعد نجاح Canary!**

```bash
# زيادة نسبة المستخدمين تدريجياً
Day 1: 10% canary ✅
Day 3: 25%
Day 5: 50%
Day 7: 75%
Day 10: 100% ✅

# أو نشر مباشر إذا كان canary ناجح جداً
npm run deploy:production
```

**Post-Deployment Monitoring:**

- مراقبة مكثفة لأول 24 ساعة
- فريق On-call جاهز للتدخل

---

## 🚨 خطة الطوارئ الشاملة (Comprehensive Rollback Plan)

### معايير تفعيل Rollback (Rollback Triggers)

**⚠️ يتم تفعيل Rollback تلقائياً في الحالات التالية:**

| المعيار                | العتبة                | الإجراء                |
| ---------------------- | --------------------- | ---------------------- |
| **Error Rate**         | > 1%                  | Rollback تلقائي فوري   |
| **Crash Rate**         | > 0.5%                | Rollback تلقائي فوري   |
| **Response Time**      | > 3x baseline         | Rollback بعد 15 دقيقة  |
| **Data Inconsistency** | أي حالة               | Rollback يدوي فوري     |
| **Integration Broken** | مع المشاريع/Dashboard | Rollback يدوي فوري     |
| **User Complaints**    | > 10 خلال ساعة        | تحقيق + rollback محتمل |

**صلاحيات التفعيل:**

- **Rollback تلقائي:** Monitoring system
- **Rollback يدوي:** Tech Lead + Product Owner (موافقة الاثنين)

---

### مستويات Rollback (3 مستويات)

#### **Level 1: Code Rollback (استرجاع الكود)**

**متى:** أخطاء برمجية، bugs، performance issues

```bash
#!/bin/bash
# rollback_code.sh

echo "🚨 بدء Code Rollback..."

# 1. إيقاف النشر الحالي
kubectl rollout pause deployment/tender-app

# 2. Revert Git commits
PHASE_NUMBER=$1  # e.g., "3"
COMMITS_TO_REVERT=$2  # e.g., "5"

git revert HEAD~${COMMITS_TO_REVERT}..HEAD --no-edit

# 3. إعادة البناء
npm run build

# 4. إعادة النشر للنسخة السابقة
git tag "rollback-phase-${PHASE_NUMBER}-$(date +%Y%m%d-%H%M%S)"
git push origin HEAD --tags

# 5. Deploy النسخة السابقة
npm run deploy:production

# 6. التحقق من الصحة
npm run test:smoke

echo "✅ Code Rollback مكتمل"
```

**المدة المتوقعة:** 10-15 دقيقة

---

#### **Level 2: Data Rollback (استرجاع البيانات)**

**متى:** data corruption، migration فاشلة، data inconsistency

```bash
#!/bin/bash
# rollback_data.sh

echo "🚨 بدء Data Rollback..."

BACKUP_TIMESTAMP=$1  # e.g., "20251103-120000"

# 1. إيقاف التطبيق (منع الكتابة)
kubectl scale deployment/tender-app --replicas=0

# 2. التحقق من النسخة الاحتياطية
if [ ! -f "backups/tenders_${BACKUP_TIMESTAMP}.json" ]; then
  echo "❌ Backup غير موجود!"
  exit 1
fi

# 3. استعادة البيانات من Backup
echo "📦 استعادة البيانات..."

# LocalStorage data
cp "backups/tenders_${BACKUP_TIMESTAMP}.json" \
   "app-data/tenders.json"

cp "backups/tender-pricing_${BACKUP_TIMESTAMP}.json" \
   "app-data/tender-pricing.json"

cp "backups/tender-relations_${BACKUP_TIMESTAMP}.json" \
   "app-data/tender-relations.json"

# 4. التحقق من سلامة البيانات
node scripts/validate-data.js

# 5. إعادة تشغيل التطبيق
kubectl scale deployment/tender-app --replicas=3

# 6. Smoke tests على البيانات
npm run test:data-integrity

echo "✅ Data Rollback مكتمل"
```

**⚠️ تنبيه:** البيانات المُدخلة بين Backup والـ Rollback ستُفقد!

**المدة المتوقعة:** 20-30 دقيقة

---

#### **Level 3: Full System Rollback (استرجاع كامل)**

**متى:** فشل كارثي، data + code معطلين، integrations مكسورة

```bash
#!/bin/bash
# rollback_full.sh

echo "🚨🚨🚨 بدء Full System Rollback..."

PHASE_NUMBER=$1
BACKUP_TIMESTAMP=$2

# 1. إشعار الفريق
notify_team "CRITICAL: Full rollback initiated for Phase ${PHASE_NUMBER}"

# 2. Code rollback
./scripts/rollback_code.sh ${PHASE_NUMBER} 10

# 3. Data rollback
./scripts/rollback_data.sh ${BACKUP_TIMESTAMP}

# 4. استعادة Service configurations
cp "backups/serviceRegistry_${BACKUP_TIMESTAMP}.ts" \
   "src/application/services/serviceRegistry.ts"

# 5. استعادة Store configurations
cp -r "backups/stores_${BACKUP_TIMESTAMP}/" \
      "src/application/stores/"

# 6. Rebuild من الصفر
npm ci
npm run build

# 7. Deploy
npm run deploy:production

# 8. التحقق الشامل
npm run test:all
npm run test:integration

# 9. Post-mortem report
generate_postmortem_report ${PHASE_NUMBER}

echo "✅ Full System Rollback مكتمل"
echo "📝 Post-mortem report: reports/rollback_${PHASE_NUMBER}.md"
```

**المدة المتوقعة:** 45-60 دقيقة

---

### استراتيجية Backup قبل كل Phase

**⚠️ إلزامي قبل البدء في أي Phase!**

```bash
#!/bin/bash
# backup_before_phase.sh

PHASE_NUMBER=$1
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="backups/phase-${PHASE_NUMBER}-${TIMESTAMP}"

echo "📦 إنشاء Backup قبل Phase ${PHASE_NUMBER}..."

# 1. إنشاء مجلد backup
mkdir -p ${BACKUP_DIR}

# 2. Backup الكود (Git tag)
git tag "pre-phase-${PHASE_NUMBER}-${TIMESTAMP}"
git push origin --tags

# 3. Backup البيانات
cp app-data/tenders.json ${BACKUP_DIR}/tenders.json
cp app-data/tender-pricing.json ${BACKUP_DIR}/tender-pricing.json
cp app-data/tender-relations.json ${BACKUP_DIR}/tender-relations.json
cp app-data/projects.json ${BACKUP_DIR}/projects.json  # للتكامل

# 4. Backup Configurations
cp src/application/services/serviceRegistry.ts ${BACKUP_DIR}/
cp -r src/application/stores/ ${BACKUP_DIR}/stores/

# 5. Database snapshot (إن وُجد)
# mysqldump tender_db > ${BACKUP_DIR}/tender_db.sql

# 6. توثيق حالة النظام
cat > ${BACKUP_DIR}/system_state.json <<EOF
{
  "phase": ${PHASE_NUMBER},
  "timestamp": "${TIMESTAMP}",
  "git_commit": "$(git rev-parse HEAD)",
  "git_branch": "$(git branch --show-current)",
  "tenders_count": $(cat app-data/tenders.json | jq '. | length'),
  "projects_count": $(cat app-data/projects.json | jq '. | length'),
  "node_version": "$(node --version)",
  "npm_version": "$(npm --version)"
}
EOF

echo "✅ Backup مكتمل: ${BACKUP_DIR}"
echo "📝 للاسترجاع استخدم: ./rollback_data.sh ${TIMESTAMP}"
```

**جدول Backups:**

| Phase     | Backup قبل | Backup بعد | الاحتفاظ بـ                   |
| --------- | ---------- | ---------- | ----------------------------- |
| Phase 1   | ✅         | ✅         | 30 يوم                        |
| Phase 2   | ✅         | ✅         | 30 يوم                        |
| Phase 3   | ✅         | ✅         | 60 يوم (حرج)                  |
| Phase 4   | ✅         | ✅         | 30 يوم                        |
| Phase 5   | ✅         | ✅         | 90 يوم (حرج - data migration) |
| Phase 6-7 | ✅         | ✅         | 30 يوم                        |

---

### Rollback Testing (اختبار الاسترجاع)

**⚠️ يجب اختبار Rollback قبل Production!**

```bash
# اختبار rollback على staging
# 1. Deploy Phase N على staging
npm run deploy:staging

# 2. عمل backup
./backup_before_phase.sh N

# 3. عمل تغييرات
# ... code changes ...

# 4. اختبار rollback
./rollback_full.sh N [timestamp]

# 5. التحقق من نجاح الاسترجاع
npm run test:all

# ✅ إذا نجح على staging → آمن للـ production
```

**Rollback Drills (تدريبات):**

- **مرة كل شهر:** تدريب على code rollback
- **مرة كل 3 أشهر:** تدريب على data rollback
- **مرة كل 6 أشهر:** تدريب على full system rollback

---

## 📅 الجدول الزمني (Timeline)

```
الأسبوع 1      [====== Phase 1 ======]
الأسبوع 2      [====== Phase 2 ======]
الأسبوع 3      [====== Phase 2 ======]
الأسبوع 4      [====== Phase 3 ======]
الأسبوع 5      [====== Phase 3 ======]
الأسبوع 6      [====== Phase 4 ======]
الأسبوع 7      [====== Phase 4 ======]
الأسبوع 8      [====== Phase 5 ======]
الأسبوع 9      [====== Phase 5 ======]
الأسبوع 10     [====== Phase 6 ======]
الأسبوع 11     [====== Phase 6 ======]
الأسبوع 12     [====== Phase 7 ======]

المدة الكلية: 12 أسبوع (3 أشهر)
```

---

## ✅ معايير النجاح (Success Criteria)

### معايير فنية

- ✅ جميع الاختبارات تمر (100% passing)
- ✅ Test coverage ≥ 80%
- ✅ لا TypeScript errors
- ✅ لا ESLint errors
- ✅ Performance targets متحققة
- ✅ SOLID score ≥ 8/10

### معايير وظيفية

- ✅ جميع التكاملات تعمل (Projects, Dashboard, Development)
- ✅ لا regression bugs
- ✅ User feedback إيجابي
- ✅ Zero data loss

### معايير الجودة

- ✅ Code review approved
- ✅ Documentation كاملة
- ✅ Migration guide واضح
- ✅ Team trained على النظام الجديد

---

## 🔄 التكرار والتحسين (Iteration & Improvement)

### Post-Launch Monitoring

```typescript
// ✅ مراقبة بعد النشر

interface HealthMetrics {
  errorRate: number // Target: < 0.1%
  avgResponseTime: number // Target: < 100ms
  userSatisfaction: number // Target: > 4.5/5
  crashRate: number // Target: < 0.01%
}

// Weekly review
scheduleWeekly(() => {
  const metrics = collectMetrics()
  if (metrics.errorRate > 0.1) {
    alert('Error rate exceeded threshold!')
  }
})
```

### Continuous Improvement

- 📊 أسبوعياً: مراجعة metrics
- 🔍 شهرياً: code quality audit
- 📈 ربع سنوياً: architecture review
- 🎯 سنوياً: major refactoring (if needed)

---

## 📞 الدعم والتواصل (Support & Communication)

### نقاط الاتصال

- **Technical Lead:** مراجعة architecture
- **QA Team:** اختبار شامل
- **Product Owner:** قبول features
- **Dev Team:** تنفيذ

### التواصل

- **Daily:** Standup - تحديثات يومية
- **Weekly:** Progress report - تقرير أسبوعي
- **Bi-weekly:** Demo - عرض توضيحي
- **Monthly:** Retrospective - مراجعة شهرية

---

## 🎓 الخلاصة (Summary)

### ما سيتم تحقيقه

✅ **نظام منافسات متطور** يتوافق مع أفضل الممارسات العالمية
✅ **أداء محسّن** بنسبة 60%
✅ **جودة كود عالية** (8.5/10)
✅ **قابلية صيانة ممتازة**
✅ **تكاملات محفوظة** مع جميع الأنظمة
✅ **اختبارات شاملة** (80% coverage)
✅ **توثيق كامل**

### الخطوات التالية

1. ✅ مراجعة هذه الخطة مع الفريق
2. ✅ الموافقة على الخطة
3. ✅ البدء في Phase 1
4. ✅ متابعة التنفيذ عبر ملف التتبع

---

**تم إعداد الخطة بواسطة:** فريق التطوير
**تاريخ الموافقة:** في انتظار المراجعة
**تاريخ البدء المتوقع:** بعد الموافقة مباشرة
**تاريخ الانتهاء المتوقع:** بعد 12 أسبوع من البدء

---

**ملاحظة مهمة:** 🔒
جميع التغييرات يجب أن تحافظ على **التوافق العكسي** و **التكاملات القائمة**.
لا يُسمح بأي تغيير يكسر الأنظمة المرتبطة بدون موافقة صريحة.
