# 🎯 الخطة الرئيسية الشاملة لتحديث نظام المنافسات

**Tenders System Modernization - Master Plan**

---

## 📋 معلومات المشروع

| المعلومة           | القيمة                                             |
| ------------------ | -------------------------------------------------- |
| **تاريخ الإنشاء**  | 24 أكتوبر 2025                                     |
| **Branch**         | `feature/tenders-system-quality-improvement`       |
| **Backup Branch**  | `backup/tenders-system-before-refactor-2025-10-22` |
| **المدة المتوقعة** | 9 أسابيع (45 يوم عمل)                              |
| **الحالة**         | 🔵 جاهز للتنفيذ                                    |

---

## 🎯 الأهداف الرئيسية

### 1. تحسينات معمارية

- ✅ استخدام State Management Library (Zustand)
- ✅ إزالة Legacy Data Paths
- ✅ إزالة نظام المسودات بالكامل
- ✅ إضافة Integration Tests

---

## 🧭 الخطة الموحدة لكل صفحة (One-Pass Page Modernization)

فلسفة التنفيذ: إنهاء كل صفحة/ملف بشكل شامل «من الألف إلى الياء» في حزمة واحدة قبل الانتقال للصفحة التالية. كل حزمة تشمل: تفكيك الملف، ربط Zustand، إزالة المسارات القديمة، إزالة الـ Drafts بالكامل، وإضافة اختبارات تكامل وأداء.

### خطوات الحزمة الموحدة (تُكرر لكل صفحة/ملف)

1. Baseline & Snapshot

- توثيق LOC الحالي، الاستيرادات legacy (مثل useUnifiedTenderPricing/useTenderPricingPersistence)، والقياسات الأولية (وقت الحفظ، rerenders، الذاكرة).

1. تفكيك الملف (File Decomposition)

- إنشاء هيكل المجلدات والملفات المستهدفة حسب الجداول المفصلة في `TENDERS_FILE_DECOMPOSITION_PLAN.md`.
- نقل المنطق الثقيل (parsing/mapping/calculations) إلى services/utilities، وإبقاء المكونات رشيقة.

1. إدارة الحالة (Zustand)

- ربط الصفحة بـ store/selectors.
- عند الحاجة: إضافة/تعديل slices (`dataSlice`, `uiSlice`, `effectsSlice`) بدل state المحلي.

1. إزالة المسارات القديمة (Legacy Cleanup)

- استبدال `useTenderPricingPersistence` و/أو `useUnifiedTenderPricing` بآثار المتجر (effects) + services.
- حذف الاستيرادات legacy من المكونات/الصفحات.

1. إزالة نظام المسودات بالكامل (Draft Removal)

- حذف أي شيفرة/مخازن/جداول تخص المسودات (draft\*)، وإزالة أي أعلام isDraft.
- اعتماد مصدر واحد للحقيقة (BOQ Repository) لعمليات الحفظ/القراءة.
- توحيد مسار الحفظ داخل المتجر (effects) مع partialize واضحة، دون أي تفرعات Draft.

1. اختبارات التكامل والأداء (Integration & Perf)

- إضافة اختبار تكامل للصفحة (Vitest + Testing Library/msw) باسم: `tests/integration/tenders/<page>-flow.test.ts`.
- قياس: Save Time، Re-renders، Memory، وتوثيق النتائج في Progress Tracker.

1. معايير القبول (Acceptance)

- لا استيرادات legacy في الصفحة.
- لا ملف يتجاوز 300 سطر ضمن الحزمة المستهدفة.
- اختبارات الوحدة/التكامل PASS + قياسات الأداء ضمن الحدود.

### ترتيب التنفيذ (الصفحات/الملفات المستهدفة)

| الترتيب | الصفحة/الملف                                              | الوصف المختصر                                 | الحالة      |
| ------- | --------------------------------------------------------- | --------------------------------------------- | ----------- |
| 1       | `features/tenders/pricing/TenderPricingWizard.tsx`        | أكبر ملف؛ تفكيك خطوات الـ Wizard ونقل الخدمات | قيد التخطيط |
| 2       | `presentation/pages/Tenders/components/NewTenderForm.tsx` | تقسيم إلى أقسام + hook للنموذج + schema       | قيد التخطيط |
| 3       | `presentation/pages/Tenders/TenderPricingPage.tsx`        | فصل الأشرطة/الجدول/الملخص وربط المتجر         | قيد التخطيط |
| 4       | `presentation/pages/Tenders/TendersPage.tsx`              | فصل الفلاتر/الإحصائيات/القائمة + selectors    | قيد التخطيط |

مراجع التنفيذ:

- التفاصيل الانشائية لكل ملف موجودة في: `TENDERS_FILE_DECOMPOSITION_PLAN.md`.
- تتبع التقدم اليومي/الأسبوعي في: `TENDERS_MODERNIZATION_PROGRESS_TRACKER.md`.

### 2. تحسينات الأداء

- ✅ إزالة Event Loops
- ✅ تقليل Re-renders
- ✅ تحسين Memory Usage
- ✅ تسريع عمليات الحفظ

### 3. تحسينات جودة الكود

- ✅ تقليل حجم الملفات (< 500 سطر لكل ملف)
- ✅ فصل المنطق عن العرض
- ✅ إزالة التكرار
- ✅ توحيد TypeScript Types

### 4. تحسينات تجربة المستخدم

- ✅ استجابة فورية (< 100ms)
- ✅ رسائل خطأ واضحة
- ✅ عدم وجود وميض عند الحفظ
- ✅ Offline mode support

---

## 📊 المقاييس المستهدفة

### Performance Metrics

| المقياس                    | الحالي  | المستهدف | التحسين |
| -------------------------- | ------- | -------- | ------- |
| **Save Time**              | 1,200ms | < 200ms  | -83%    |
| **Re-renders**             | 47      | < 5      | -89%    |
| **Memory Usage**           | 45MB    | < 30MB   | -33%    |
| **Event Loop Iterations**  | 15      | 0        | -100%   |
| **useMemo Recalculations** | 32      | < 3      | -91%    |

### Code Quality Metrics

| المقياس                       | الحالي  | المستهدف | التحسين |
| ----------------------------- | ------- | -------- | ------- |
| **Total Lines**               | ~11,571 | ~9,500   | -18%    |
| **Files > 500 lines**         | 8       | 0        | -100%   |
| **Legacy Hooks**              | 9       | 0        | -100%   |
| **Event Listeners**           | 8+      | 0        | -100%   |
| **Type Definitions (Tender)** | 3       | 1        | -67%    |
| **Test Coverage**             | ~40%    | > 80%    | +100%   |

---

## 🗺️ المراحل الرئيسية

### Phase 0️⃣: الإعداد والتأسيس (يوم واحد)

- ✅ إنشاء branches
- ✅ إعداد بيئة التطوير
- ✅ إنشاء ملفات التوثيق

### Phase 1️⃣: State Management Setup (أسبوع 1)

- ✅ تثبيت Zustand + dependencies
- ✅ إنشاء TenderPricingStore
- ✅ إنشاء Infrastructure

### Phase 2️⃣: Critical Migrations (أسبوع 2-3)

- ✅ Migration من legacy hooks
- ✅ إزالة نظام المسودات بالكامل
- ✅ Performance baseline

### Phase 3️⃣: Legacy Cleanup (أسبوع 4)

- ✅ توحيد TypeScript Types
- ✅ Legacy data migration
- ✅ Hooks audit & cleanup

### Phase 4️⃣: Components Refactoring (أسبوع 5-6)

- ✅ TenderPricingWizard (1540 LOC - الأولوية الأولى)
- ✅ NewTenderForm (1102 LOC)
- ✅ TendersPage (892 LOC)
- ✅ TenderPricingPage (707 LOC)

### Phase 5️⃣: Error Handling & Resilience (أسبوع 7)

- ✅ Error boundaries
- ✅ Retry logic
- ✅ Offline mode
- ✅ User feedback

### Phase 6️⃣: Testing & Quality (أسبوع 8)

- ✅ Unit tests
- ✅ Integration tests
- ✅ Performance tests
- ✅ Accessibility tests

### Phase 7️⃣: Final Integration (أسبوع 9)

- ✅ TendersPage refactoring
- ✅ End-to-end testing
- ✅ Documentation
- ✅ Release preparation

---

## 🧩 خارطة تفكيك الملفات والهيكل المستهدف

| الملف الحالي (الأسطر)                                                                 | أبرز المشكلات                             | الهيكلة المستهدفة                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/presentation/pages/Tenders/TenderPricingPage.tsx` (≈770)                         | منطق وعرض متداخل، اعتماد على hooks legacy | `src/features/tenders/pricing/TenderPricingContainer.tsx`, `components/PricingSidebar.tsx`, `components/PricingTable.tsx`, `components/PricingSummaryPanel.tsx`, `hooks/usePricingFilters.ts`, استخدام `tenderPricingStore.ts` فقط                           |
| `src/presentation/pages/Tenders/components/NewTenderForm.tsx` (≈820)                  | تعدد المسؤوليات، تكرار حالات النموذج      | `src/features/tenders/new-tender/NewTenderFormContainer.tsx`, أقسام `sections/BasicInfoSection.tsx`, `sections/ScopeSection.tsx`, `sections/DocumentsSection.tsx`, hooks مخصصة للتعامل مع BOQ، نقل المنطق إلى `useNewTenderStore.ts`                         |
| `src/features/tenders/pricing/TenderPricingWizard.tsx` (≈1,500)                       | ملف أحادي ضخم، خطوات معقدة                | إنشاء مجلد `src/features/tenders/pricing/wizard/` يحتوي على `WizardContainer.tsx`, خطوات منفصلة `steps/{Registration,Technical,Financial,Review,Submit}.tsx`, مكونات مشتركة `components/{StepIndicator,WizardNavigation}.tsx`, Zustand store خاص بالـ Wizard |
| `src/presentation/pages/Tenders/TendersPage.tsx` (≈850)                               | Events loops، منطق تصفية داخل الصفحة      | `src/features/tenders/list/TendersPageContainer.tsx`, `components/{TendersFilters,TendersGrid,TenderRow,TendersStats}.tsx`, استخدام `tendersStore.ts` مع selectors                                                                                           |
| `src/application/hooks/useUnifiedTenderPricing.ts` + `useTenderPricingPersistence.ts` | مصادر بيانات Legacy، ازدواجية في التخزين  | حذف الملفين بعد دمج المنطق داخل `tenderPricingStore.ts` و `boqRepository`, إنشاء `selectors/pricingSelectors.ts` للمعالجات المشتقة                                                                                                                           |
| تعريفات `Tender` المتعددة (٣ مواقع)                                                   | تناقض في الأنواع، صعوبة الصيانة           | نقل الأنواع إلى `src/domain/types/tender.ts`, تحديث جميع الاستيرادات، توفير type guards مشتركة في `src/domain/guards/`                                                                                                                                       |

**ملاحظات التنفيذ:**

- الالتزام بأن لا يتجاوز أي ملف جديد 250 سطراً وأن يُقسم المنطق إلى وحدات قابلة لإعادة الاستخدام.
- أثناء التفكيك يجب نقل الأساليب المساعدة إلى `src/features/tenders/shared/` مع اختبار وحدوي لكل أداة جديدة.
- تحديث مسارات الاستيراد في `tsconfig.json` و `vite.config.ts` لضمان بقاء aliases فعالة بعد إعادة الهيكلة.

---

## 🔄 بنية الحالة وإدارة البيانات

```
Presentation (Pages / Features)
  │
Selectors + Hooks (useTenderPricingValue, useTenderMetadata)
  │
Zustand Stores (tenderPricingStore, tendersStore, tenderWizardStore)
  │
Repositories (TenderRepository, BOQRepository, AttachmentsRepository)
  │
Electron Storage / API Gateway
```

- **Stores مبدئية:**
  - `tenderPricingStore.ts`: يدير BOQ, pricing, dirty state, save/load.
  - `tendersStore.ts`: تحميل القوائم، الفرز، الإحصائيات، CRUD.
  - `tenderWizardStore.ts`: إدارة بيانات النموذج متعدد الخطوات وحالات التحقق.
  - `attachmentsStore.ts` (مستقبلي): إدارة رفع الملفات والتقدم.
- **القواعد:**
  - يمنع استدعاء repositories مباشرة من المكونات؛ يتم المرور من خلال actions في stores.
  - selectors توجد في `src/stores/selectors/` وتعود بقيم مشتقة مهيأة للعرض.
  - middleware (`electronStorage`, `logger`, لاحقاً `persistErrorBoundary`) يجب أن يظل في مجلد مخصص لسهولة الاختبار.

---

## 🧱 خطة توحيد TypeScript

1. **تجميع الأنواع:**
   - إنشاء `src/domain/types/tender.ts`, `src/domain/types/boq.ts`, `src/domain/types/pricing.ts`.
   - نقل الأنواع المعاد تعريفها في `src/shared/types/contracts.ts`, `src/data/centralData.ts`, `src/api/endpoints/tenders.ts`.
2. **إضافة type guards و helpers:**
   - `src/domain/guards/isTender.ts` للتحقق من البيانات القادمة من Electron store.
   - `src/domain/mappers/tenderMappers.ts` لتحويل legacy shapes إلى الشكل الجديد.
3. **خطة الترحيل:**
   - Phase 3 Day 1: نقل الأنواع وتحديث الاستيرادات (تشغيل `npx tsc --noEmit`).
   - Phase 3 Day 2: refactor الملفات المتأثرة (≈35 ملفاً)، مع اختبارات وحدوية للتأكد من سلامة الأنواع.
   - Phase 3 Day 3: حذف الأنواع القديمة، تحديث الوثائق (`ARCHITECTURE_PRICING_LAYER.md`).

---

## 🧹 إزالة مسارات البيانات القديمة

| المرحلة       | الخطوة                                                       | المخرجات                                                                            | التحقق                                                           |
| ------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Phase 2 Day 2 | تنفيذ `scripts/migrateLegacyQuantitiesToBOQ.ts`              | تحديث مخازن الـ BOQ                                                                 | مقارنة snapshot قبل/بعد في `temp/tender_migration.json`          |
| Phase 2 Day 3 | تحديث `tenderPricingStore.savePricing` ليكتب إلى مصدر واحد   | حذف الحقول `quantities`, `items`, `quantityTable` من type                           | تشغيل اختبارات التكامل `tests/integration/boq-migration.test.ts` |
| Phase 2 Day 4 | إزالة نظام المسودات بالكامل                                  | حذف جميع الحقول/الجداول/المجلدات التي تبدأ بـ `draft*`، وإزالة `isDraft` أينما وجدت | التأكد عبر grep أن لا توجد مراجع لـ `draft` أو `isDraft`         |
| Phase 3 Day 1 | حذف `useUnifiedTenderPricing`, `useTenderPricingPersistence` | الاعتماد الكامل على store                                                           | مراقبة Console للتأكد من اختفاء التحذيرات legacy                 |
| Phase 3 Day 2 | تنظيف المكونات المعتمدة على fallback chains                  | تحديث `NewTenderForm`, `TenderDetails`, `TendersPage`                               | تشغيل E2E test للتأكد من تدفق البيانات                           |

**إجراءات داعمة:**

- إنشاء `docs/migrations/legacy-data-cleanup.md` لتوثيق الحالات الخاصة وأي بيانات تم تصحيحها يدويًا.
- خلال الترحيل، يتم الاحتفاظ بنسخ احتياطية عبر `archive/backups/tenders-before-legacy-cleanup.json`.

---

## 🗑️ خطة إزالة نظام المسودات (تفصيلية)

### Phase 2 Day 4: تنفيذ كامل لإزالة المسودات

#### الخطوة 1: الحصر الشامل (1-2 ساعة)

**أوامر الفحص:**

```bash
# 1. البحث عن جميع المراجع لـ draft و isDraft
grep -rn "draft\|isDraft" src/ --include="*.ts" --include="*.tsx" > temp/draft-references.txt

# 2. البحث عن Draft بحروف كبيرة
grep -rn "Draft\|DRAFT" src/ --include="*.ts" --include="*.tsx" >> temp/draft-references.txt

# 3. فحص أسماء الملفات
find src/ -name "*draft*" -o -name "*Draft*" > temp/draft-files.txt

# 4. فحص قاعدة البيانات/Electron Store
node scripts/inspect-electron-store.js --search draft > temp/draft-data.json
```

**النتائج المتوقعة:**

```
temp/
├── draft-references.txt (قائمة بكل الأسطر)
├── draft-files.txt (قائمة الملفات)
└── draft-data.json (بيانات المسودات المخزنة)
```

#### الخطوة 2: تحليل وتصنيف (1 ساعة)

**الملفات المستهدفة للحذف/التعديل:**

| الملف/المجلد                                    | النوع     | الإجراء                     | الأولوية |
| ----------------------------------------------- | --------- | --------------------------- | -------- |
| `src/types/tender.ts`                           | Type      | حذف حقل `isDraft?: boolean` | 🔴 حرج   |
| `src/stores/draftsStore.ts`                     | Store     | حذف الملف كاملاً (إن وجد)   | 🔴 حرج   |
| `src/data/schemas/tender.schema.json`           | Schema    | حذف `draft_*` fields        | 🔴 حرج   |
| `src/presentation/pages/Tenders/DraftsList.tsx` | Component | حذف كامل (إن وجد)           | 🟡 متوسط |
| `src/api/endpoints/drafts.ts`                   | API       | حذف كامل (إن وجد)           | 🟡 متوسط |
| `src/utils/draftHelpers.ts`                     | Utils     | حذف كامل (إن وجد)           | 🟡 متوسط |

**الفروع الشرطية المستهدفة:**

```typescript
// أمثلة للكود المطلوب حذفه/تعديله:

// ❌ قبل - حذف هذا
if (tender.isDraft) {
  // save to drafts table
}

// ❌ قبل - حذف هذا
const drafts = tenders.filter((t) => t.isDraft)

// ✅ بعد - الاعتماد على BOQ فقط
const allTenders = await boqRepository.getAll()
```

#### الخطوة 3: ترحيل البيانات (2-3 ساعات)

**سكريبت الترحيل:**

```typescript
// scripts/migrate-drafts-to-boq.ts
import { getBOQRepository } from '@/application/services/serviceRegistry'

async function migrateDrafts() {
  // 1. قراءة المسودات الموجودة
  const drafts = await electronStore.get('tender_drafts')

  // 2. تحويل كل مسودة إلى BOQ عادي
  for (const draft of drafts) {
    const boq = {
      ...draft,
      // حذف حقل isDraft
      isDraft: undefined,
      status: 'pending', // أو حالة مناسبة
      createdAt: draft.createdAt || new Date().toISOString(),
    }

    // 3. حفظ في BOQ Repository
    await getBOQRepository().create(boq)
  }

  // 4. backup ثم حذف المسودات القديمة
  await electronStore.set('tender_drafts_backup', drafts)
  await electronStore.delete('tender_drafts')

  console.log(`✅ تم ترحيل ${drafts.length} مسودة`)
}
```

**تشغيل:**

```bash
npm run migrate:drafts
```

#### الخطوة 4: حذف الشيفرة (2-3 ساعات)

**الترتيب الموصى به:**

1. حذف Types أولاً:

   ```bash
   # تعديل src/types/tender.ts
   # حذف: isDraft?: boolean
   ```

2. حذف Stores/State:

   ```bash
   rm -f src/stores/draftsStore.ts
   ```

3. حذف Components:

   ```bash
   rm -rf src/presentation/pages/Tenders/DraftsList.tsx
   rm -rf src/presentation/components/drafts/
   ```

4. حذف API endpoints:

   ```bash
   rm -f src/api/endpoints/drafts.ts
   ```

5. تنظيف الفروع الشرطية في الملفات المتبقية:
   ```bash
   # استخدام editor للبحث والاستبدال
   # البحث عن: if.*isDraft
   # المراجعة اليدوية لكل حالة
   ```

#### الخطوة 5: التحقق النهائي (30 دقيقة)

**معايير النجاح:**

```bash
# 1. لا توجد مراجع لـ draft في الكود
grep -r "isDraft\|draft" src/ --include="*.ts" --include="*.tsx"
# النتيجة المطلوبة: 0 matches

# 2. TypeScript بدون أخطاء
npx tsc --noEmit
# النتيجة: 0 errors

# 3. الاختبارات تعمل
npm test
# النتيجة: All tests passing

# 4. Build ناجح
npm run build
# النتيجة: Build successful
```

**Checklist النهائية:**

- [ ] تم تشغيل جميع أوامر grep
- [ ] تم حفظ النتائج في temp/
- [ ] تم تشغيل سكريبت الترحيل
- [ ] تم backup البيانات القديمة
- [ ] تم حذف جميع الملفات المستهدفة
- [ ] تم تنظيف الفروع الشرطية
- [ ] grep النهائي = 0 نتائج
- [ ] TypeScript 0 errors
- [ ] Tests passing
- [ ] Build successful
- [ ] تم commit التغييرات:

  ```bash
  git add .
  git commit -m "feat: remove draft system completely

  - Delete isDraft field from types
  - Remove draftsStore
  - Migrate draft data to BOQ
  - Clean up conditional branches
  - All tests passing

  BREAKING CHANGE: Draft system removed"
  ```

---

## 🧪 استراتيجية الاختبارات

| نوع الاختبار           | الأدوات                         | النطاق                                                | ملفات جديدة                                                                                           |
| ---------------------- | ------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Unit Tests             | Vitest + Testing Library        | selectors, stores, mappers                            | `tests/unit/stores/tenderPricingStore.test.ts`, `tests/unit/mappers/tenderMapper.test.ts`             |
| Integration Tests      | Vitest + msw                    | تدفق التسعير، إنشاء المناقصة، حفظ الـ BOQ             | `tests/integration/tenders/pricing-flow.test.ts`, `tests/integration/tenders/new-tender-flow.test.ts` |
| E2E Tests              | Playwright                      | Scenarios أساسية: فتح المناقصة، التسعير، الحفظ، البحث | `tests/e2e/tenders/pricing.spec.ts`, `tests/e2e/tenders/list-filters.spec.ts`                         |
| Performance Benchmarks | custom scripts + React Profiler | قياس زمن الحفظ، rerenders, memory                     | `tests/performance/tenders/pricing-save.bench.ts`, تقرير في `docs/performance/benchmark-report.md`    |
| Accessibility          | axe-core + Storybook            | المكونات المعاد استخدامها (بطاقات، نماذج)             | `tests/a11y/tenders/components.spec.ts`                                                               |

- يجب تشغيل regression suite (unit + integration) عبر GitHub Actions عند كل Pull Request.
- إضافة حساسات أداء (performance marks) داخل صفحات التسعير لتسجيل الزمن في console وإرساله إلى `build_log.txt`.
- توثيق نتائج كل مرحلة في `TENDERS_MODERNIZATION_PROGRESS_TRACKER.md` تحت قسم “ملخص الأسبوع”.

---

## 📚 مواءمة الوثائق الحالية

- **INTEGRATED_TENDERS_MODERNIZATION_PLAN.md:** يمثل سياق Week 5 ويجب تحديثه بملخص أسبوعي من الخطة الجديدة حتى لا تتضارب المعلومات.
- **TENDERS_SYSTEM_REFACTORING_EXECUTION_PLAN.md:** سيتم تحويله إلى archive بعد دمج المعلومات الأساسية داخل هذا المستند، مع الإشارة إلى الـ commits التاريخية للرجوع عند الحاجة.
- **ARCHITECTURE_PRICING_LAYER.md:** يتطلب تحديث الأقسام الخاصة بالـ Contexts والـ Hooks legacy لتشير إلى stores الجديدة.
- **RECOMMENDATIONS_IMPLEMENTATION_ROADMAP.md:** يجب إضافة إشارة إلى أن الخطة الحالية تغطي التوصيات الأربع، مع ربط milestone لكل توصية.

---

## 🔄 استراتيجية Rollback وإدارة المخاطر

### لكل Phase: خطة التراجع

#### قبل بدء أي Phase:

```bash
# 1. إنشاء Git tag
git tag -a phase-X-start -m "Snapshot before Phase X"
git push origin phase-X-start

# 2. إنشاء branch منفصل
git checkout -b feature/phase-X-implementation

# 3. Backup كامل للبيانات
node scripts/backup-electron-store.js --output archive/backups/phase-X-start.json

# 4. توثيق الحالة الحالية
npm run measure:performance > docs/performance/phase-X-baseline.log
npm test -- --coverage > docs/tests/phase-X-coverage.log
```

#### معايير Go/No-Go لكل Phase:

| المعيار               | الحد الأدنى للنجاح   | الإجراء عند الفشل           |
| --------------------- | -------------------- | --------------------------- |
| **Tests Passing**     | ≥ 95%                | تأجيل Phase حتى إصلاح الفشل |
| **Performance**       | ضمن ±10% من الهدف    | مراجعة + تحسين قبل المتابعة |
| **TypeScript Errors** | 0 errors             | إصلاح إجباري                |
| **Critical Bugs**     | 0 bugs               | حل جذري قبل المتابعة        |
| **Code Review**       | موافقة (إن وجد فريق) | معالجة التعليقات            |

#### خطة Rollback عند الفشل:

```bash
# السيناريو 1: فشل جزئي - العودة للـ commit السابق
git reset --hard HEAD~1

# السيناريو 2: فشل كامل للـ Phase - العودة للـ tag
git reset --hard phase-X-start
git clean -fd  # حذف الملفات غير المتتبعة

# السيناريو 3: استعادة البيانات
node scripts/restore-electron-store.js --from archive/backups/phase-X-start.json

# السيناريو 4: العودة للـ branch الرئيسي
git checkout feature/tenders-system-quality-improvement
git branch -D feature/phase-X-implementation
```

#### Checkpoints إلزامية:

**Checkpoint 1 - نهاية Phase 1 (Week 1):**

- ✅ Zustand Store يعمل بدون أخطاء
- ✅ DevTools متصل ويعرض البيانات
- ✅ 0 TypeScript errors
- ✅ جميع الاختبارات الموجودة PASS
- ✅ Performance baseline موثقة

**القرار:**

- ✅ Continue → Phase 2
- ❌ Rollback → إصلاح المشاكل

**Checkpoint 2 - نهاية Phase 2-3 (Week 4):**

- ✅ Legacy hooks محذوفة بالكامل
- ✅ نظام المسودات محذوف بالكامل
- ✅ Performance targets met (Save < 300ms مؤقتاً)
- ✅ Data migration ناجحة
- ✅ 0 console errors

**القرار:**

- ✅ Continue → Phase 4
- ⚠️ Pause → معالجة blockers
- ❌ Rollback → مشاكل حرجة

**Checkpoint 3 - نهاية Phase 4 (Week 6):**

- ✅ 4 صفحات معاد هيكلتها
- ✅ LOC reduced by ≥15%
- ✅ No files > 300 LOC
- ✅ Integration tests passing
- ✅ Performance ضمن الهدف

**القرار:**

- ✅ Continue → Phase 5
- ⚠️ Extend → إضافة وقت للتحسين

**Final Checkpoint - نهاية Phase 7 (Week 9):**

- ✅ جميع المقاييس المستهدفة محققة
- ✅ E2E tests passing
- ✅ Documentation كاملة
- ✅ No critical/major bugs
- ✅ Performance production-ready

**القرار:**

- ✅ Go-Live
- ❌ Postpone → مراجعة شاملة

---

## ⚠️ مصفوفة المخاطر والتخفيف

| #   | الخطر                                              | الاحتمالية   | التأثير | درجة الخطر | استراتيجية التخفيف                                                   |
| --- | -------------------------------------------------- | ------------ | ------- | ---------- | -------------------------------------------------------------------- |
| 1   | تعارض في dependencies (Zustand/Immer مع libs أخرى) | متوسطة (40%) | عالي    | 🔴 حرج     | اختبار في sandbox environment + lock versions                        |
| 2   | فقدان بيانات المسودات أثناء الترحيل                | منخفضة (15%) | حرج     | 🔴 حرج     | Backup شامل + migration script مختبر + dry-run                       |
| 3   | تجاوز الوقت المخطط لكل Phase                       | عالية (60%)  | متوسط   | 🟡 متوسط   | Buffer 20% لكل Phase + weekly reviews                                |
| 4   | Performance regression بعد التعديلات               | متوسطة (35%) | عالي    | 🔴 حرج     | Continuous benchmarking + profiling بعد كل تعديل                     |
| 5   | Legacy code dependencies مخفية                     | عالية (55%)  | متوسط   | 🟡 متوسط   | grep شامل + dependency graph analysis + staged rollout               |
| 6   | TypeScript errors بعد حذف types قديمة              | متوسطة (40%) | متوسط   | 🟡 متوسط   | Incremental migration + tsc --noEmit قبل كل commit                   |
| 7   | Breaking changes تؤثر على features أخرى            | متوسطة (30%) | عالي    | 🟡 متوسط   | Regression testing + feature flags + gradual rollout                 |
| 8   | أعضاء الفريق غير متاحين (إن وجد)                   | منخفضة (20%) | متوسط   | 🟢 منخفض   | Documentation واضحة + handover sessions                              |
| 9   | Electron store corruption                          | منخفضة (10%) | حرج     | 🟡 متوسط   | Versioned backups + validation on read/write                         |
| 10  | User experience degradation                        | متوسطة (35%) | عالي    | 🟡 متوسط   | A/B testing (if possible) + user feedback loop + quick rollback plan |

**أولويات المعالجة:**

- 🔴 حرج: يجب معالجتها قبل البدء
- 🟡 متوسط: خطة تخفيف جاهزة
- 🟢 منخفض: مراقبة فقط

**خطة الطوارئ:**

```bash
# في حالة فشل كارثي
cd archive/backups/
# استعادة آخر نسخة مستقرة
git checkout tags/phase-X-start -b emergency-rollback
node scripts/restore-full-state.js
```

---

## 📅 الجدول الزمني التفصيلي

---

## Phase 0️⃣: الإعداد والتأسيس

**المدة:** 1 يوم  
**الأولوية:** 🔴 Critical

## المهام

### Task 0.1: Git Setup

**المدة:** 30 دقيقة

```bash
# 1. التأكد من النسخة الاحتياطية
git checkout main
git pull origin main
git branch backup/tenders-modernization-$(date +%Y%m%d)

# 2. إنشاء branch التطوير
git checkout -b feature/tenders-system-quality-improvement

# 3. التحقق
git branch
git status
```

**معايير الإنجاز:**

- ✅ Branch احتياطي موجود
- ✅ Branch تطوير نشط
- ✅ لا توجد تغييرات غير محفوظة

---

### Task 0.2: Environment Verification

**المدة:** 30 دقيقة

```bash
# 1. فحص البيئة
node --version  # >= 18.x
npm --version   # >= 9.x

# 2. تثبيت Dependencies
npm install

# 3. فحص Build
npm run build

# 4. فحص Tests
npm test
```

**معايير الإنجاز:**

- ✅ Build ناجح بدون أخطاء
- ✅ Tests الموجودة تعمل
- ✅ TypeScript لا يوجد به أخطاء

---

### Task 0.3: Documentation Setup

**المدة:** 1 ساعة

**الملفات المطلوبة:**

1. ✅ `TENDERS_MODERNIZATION_MASTER_PLAN.md` (هذا الملف)
2. ✅ `TENDERS_MODERNIZATION_PROGRESS_TRACKER.md`
3. ✅ `docs/architecture/TENDERS_ARCHITECTURE.md`
4. ✅ `docs/performance/PERFORMANCE_BASELINE.md`

**معايير الإنجاز:**

- ✅ جميع الملفات منشأة
- ✅ التوثيق واضح ومنظم

---

### Task 0.4: Baseline Measurements

**المدة:** 1 ساعة

**القياسات المطلوبة:**

```typescript
// scripts/measure-baseline.ts
import { performance } from 'perf_hooks'

async function measureBaseline() {
  // 1. Save Time
  const saveStart = performance.now()
  // ... perform save
  const saveTime = performance.now() - saveStart

  // 2. Re-renders Count
  // استخدام React DevTools Profiler

  // 3. Memory Usage
  if (performance.memory) {
    console.log('Heap Size:', performance.memory.usedJSHeapSize)
  }

  // 4. توثيق النتائج
  const results = {
    saveTime,
    rerenderCount: 47, // من Console
    memoryUsage: 45, // MB
    eventLoopIterations: 15,
    useMemoRecalculations: 32,
  }

  // حفظ في PERFORMANCE_BASELINE.md
}
```

**معايير الإنجاز:**

- ✅ قياسات موثقة في `PERFORMANCE_BASELINE.md`
- ✅ Screenshots من DevTools
- ✅ Console logs محفوظة

---

### Task 0.5: Git Commit

**المدة:** 15 دقيقة

```bash
git add .
git commit -m "chore: Setup tenders modernization project

- Create branches (development + backup)
- Add master plan and progress tracker
- Document baseline performance metrics
- Verify build and test environment

Baseline Metrics:
- Save Time: 1200ms
- Re-renders: 47
- Memory: 45MB
- Event Loops: 15 iterations
"

git push origin feature/tenders-system-quality-improvement
```

**معايير الإنجاز:**

- ✅ Commit مع رسالة واضحة
- ✅ Push ناجح إلى GitHub
- ✅ Branch مرئي في GitHub

---

## Phase 1️⃣: State Management Setup

**المدة:** أسبوع 1 (5 أيام)  
**الأولوية:** 🔴 Critical

---

## Week 1, Day 1: Zustand Installation & Project Structure

### Task 1.1: Install Dependencies

**المدة:** 30 دقيقة

```bash
# التثبيت
npm install zustand immer --legacy-peer-deps

# التحقق
npm list zustand
npm list immer
```

**معايير الإنجاز:**

- ✅ zustand مثبت (latest version)
- ✅ immer مثبت
- ✅ لا توجد conflicts

---

### Task 1.2: Create Store Infrastructure

**المدة:** 2 ساعة

**الهيكل:**

```
src/
├── stores/
│   ├── index.ts                    # Exports
│   ├── tenderPricingStore.ts       # Main store
│   ├── middleware/
│   │   ├── electronStorage.ts      # Electron persistence
│   │   └── logger.ts               # DevTools logger
│   └── slices/
│       ├── pricingSlice.ts         # Pricing state
│       └── boqSlice.ts             # BOQ state
```

**الملفات:**

**1. `src/stores/middleware/electronStorage.ts`**

```typescript
import { safeLocalStorage } from '@/shared/utils/storage/storage'
import { StateStorage } from 'zustand/middleware'

export const electronStorage: StateStorage = {
  getItem: async (name: string) => {
    try {
      const value = await safeLocalStorage.getItem(name)
      return value || null
    } catch (error) {
      console.error('[ElectronStorage] Get error:', error)
      return null
    }
  },

  setItem: async (name: string, value: string) => {
    try {
      await safeLocalStorage.setItem(name, value)
    } catch (error) {
      console.error('[ElectronStorage] Set error:', error)
    }
  },

  removeItem: async (name: string) => {
    try {
      await safeLocalStorage.removeItem(name)
    } catch (error) {
      console.error('[ElectronStorage] Remove error:', error)
    }
  },
}
```

**2. `src/stores/middleware/logger.ts`**

```typescript
import type { StateCreator, StoreMutatorIdentifier } from 'zustand'

type Logger = <
  T extends unknown,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  f: StateCreator<T, Mps, Mcs>,
  name?: string,
) => StateCreator<T, Mps, Mcs>

type LoggerImpl = <T extends unknown>(
  f: StateCreator<T, [], []>,
  name?: string,
) => StateCreator<T, [], []>

const loggerImpl: LoggerImpl = (f, name) => (set, get, store) => {
  const loggedSet: typeof set = (...a) => {
    set(...a)
    console.log(`[${name || 'Store'}] State changed:`, get())
  }
  store.setState = loggedSet

  return f(loggedSet, get, store)
}

export const logger = loggerImpl as Logger
```

**معايير الإنجاز:**

- ✅ جميع الملفات منشأة
- ✅ لا توجد أخطاء TypeScript
- ✅ Exports صحيحة

---

### Task 1.3: Create TenderPricingStore

**المدة:** 4 ساعات

**الملف:** `src/stores/tenderPricingStore.ts`

```typescript
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { getBOQRepository } from '@/application/services/serviceRegistry'
import { getTenderRepository } from '@/application/services/serviceRegistry'
import type { BOQData, BOQItem } from '@/shared/types/boq'
import { electronStorage } from './middleware/electronStorage'

// ==================== Types ====================

interface PricingData {
  id: string
  unitPrice: number
  totalPrice: number
  quantity: number
  description: string
  unit: string | undefined
  estimated?: {
    unitPrice?: number
    totalPrice?: number
  }
}

interface TenderPricingState {
  // ===== State =====
  currentTenderId: string | null
  pricingData: Map<string, PricingData>
  boqItems: BOQItem[]
  isDirty: boolean
  isLoading: boolean
  lastSaved: string | null
  error: Error | null

  // ===== Actions =====
  setCurrentTender: (tenderId: string) => void
  loadPricing: (tenderId: string) => Promise<void>
  updateItemPricing: (itemId: string, pricing: Partial<PricingData>) => void
  markDirty: () => void
  savePricing: () => Promise<void>
  resetDirty: () => void
  reset: () => void

  // ===== Computed =====
  getTotalValue: () => number
  getPricedItemsCount: () => number
  getCompletionPercentage: () => number
}

// ==================== Initial State ====================

const initialState = {
  currentTenderId: null,
  pricingData: new Map<string, PricingData>(),
  boqItems: [],
  isDirty: false,
  isLoading: false,
  lastSaved: null,
  error: null,
}

// ==================== Store ====================

export const useTenderPricingStore = create<TenderPricingState>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // ===== Actions Implementation =====

        setCurrentTender: (tenderId: string) => {
          set((state) => {
            state.currentTenderId = tenderId
            console.log('[TenderPricingStore] Current tender set:', tenderId)
          })
        },

        loadPricing: async (tenderId: string) => {
          console.log('[TenderPricingStore] Loading pricing for tender:', tenderId)

          set((state) => {
            state.isLoading = true
            state.error = null
          })

          try {
            // 1. Load BOQ data
            const boqRepo = getBOQRepository()
            const boqData: BOQData | null = await boqRepo.getByTenderId(tenderId)

            if (!boqData) {
              throw new Error('BOQ data not found')
            }

            // 2. Convert BOQ items to pricing data
            const pricingMap = new Map<string, PricingData>()
            boqData.items.forEach((item) => {
              pricingMap.set(item.id, {
                id: item.id,
                description: item.description,
                unit: item.unit,
                quantity: item.quantity,
                unitPrice: item.unitPrice || 0,
                totalPrice: item.totalPrice || 0,
                estimated: item.estimated,
              })
            })

            set((state) => {
              state.currentTenderId = tenderId
              state.boqItems = boqData.items
              state.pricingData = pricingMap
              state.isDirty = false
              state.isLoading = false
              state.lastSaved = boqData.updatedAt || null
            })

            console.log('[TenderPricingStore] Loaded:', {
              items: boqData.items.length,
              totalValue: get().getTotalValue(),
            })
          } catch (error) {
            console.error('[TenderPricingStore] Load error:', error)
            set((state) => {
              state.error = error as Error
              state.isLoading = false
            })
            throw error
          }
        },

        updateItemPricing: (itemId: string, pricing: Partial<PricingData>) => {
          set((state) => {
            const existing = state.pricingData.get(itemId)
            if (existing) {
              const updated = { ...existing, ...pricing }
              // Recalculate total if needed
              if (pricing.unitPrice !== undefined || pricing.quantity !== undefined) {
                updated.totalPrice = updated.unitPrice * updated.quantity
              }
              state.pricingData.set(itemId, updated)
              state.isDirty = true
            }
          })
        },

        markDirty: () => {
          set((state) => {
            state.isDirty = true
          })
        },

        savePricing: async () => {
          const { currentTenderId, pricingData, boqItems } = get()
          if (!currentTenderId) {
            throw new Error('No tender selected')
          }

          set((state) => {
            state.isLoading = true
            state.error = null
          })

          try {
            // 1. Convert pricing data to BOQ items
            const updatedItems = boqItems.map((item) => {
              const pricing = pricingData.get(item.id)
              if (pricing) {
                return {
                  ...item,
                  unitPrice: pricing.unitPrice,
                  totalPrice: pricing.totalPrice,
                }
              }
              return item
            })

            // 2. Save to BOQ Repository
            const boqRepo = getBOQRepository()
            await boqRepo.update(currentTenderId, {
              items: updatedItems,
              updatedAt: new Date().toISOString(),
            })

            // 3. Update tender metadata
            const tenderRepo = getTenderRepository()
            const totalValue = get().getTotalValue()
            const pricedItems = get().getPricedItemsCount()
            const completionPercentage = get().getCompletionPercentage()

            await tenderRepo.update(currentTenderId, {
              totalValue,
              pricedItems,
              totalItems: boqItems.length,
              completionPercentage,
              lastUpdate: new Date().toISOString(),
            })

            set((state) => {
              state.isDirty = false
              state.isLoading = false
              state.lastSaved = new Date().toISOString()
            })

            console.log('[TenderPricingStore] Saved successfully:', {
              totalValue,
              pricedItems,
              completionPercentage,
            })
          } catch (error) {
            console.error('[TenderPricingStore] Save error:', error)
            set((state) => {
              state.error = error as Error
              state.isLoading = false
            })
            throw error
          }
        },

        resetDirty: () => {
          set((state) => {
            state.isDirty = false
          })
        },

        reset: () => {
          set(initialState)
        },

        // ===== Computed =====

        getTotalValue: () => {
          const { pricingData } = get()
          return Array.from(pricingData.values()).reduce(
            (sum, item) => sum + (item.totalPrice || 0),
            0,
          )
        },

        getPricedItemsCount: () => {
          const { pricingData } = get()
          return Array.from(pricingData.values()).filter((item) => item.unitPrice > 0).length
        },

        getCompletionPercentage: () => {
          const { boqItems } = get()
          const pricedCount = get().getPricedItemsCount()
          return boqItems.length > 0 ? Math.round((pricedCount / boqItems.length) * 100) : 0
        },
      })),
      {
        name: 'tender-pricing-storage',
        storage: electronStorage,
        partialize: (state) => ({
          currentTenderId: state.currentTenderId,
          pricingData: Array.from(state.pricingData.entries()),
          boqItems: state.boqItems,
          lastSaved: state.lastSaved,
        }),
      },
    ),
    { name: 'TenderPricingStore' },
  ),
)

// ==================== Selectors ====================

export const useTenderPricingValue = () => useTenderPricingStore((state) => state.getTotalValue())

export const useTenderPricingProgress = () =>
  useTenderPricingStore((state) => ({
    pricedItems: state.getPricedItemsCount(),
    totalItems: state.boqItems.length,
    percentage: state.getCompletionPercentage(),
  }))

export const useItemPricing = (itemId: string) =>
  useTenderPricingStore((state) => state.pricingData.get(itemId))

export const useTenderPricingDirty = () => useTenderPricingStore((state) => state.isDirty)
```

**معايير الإنجاز:**

- ✅ Store كامل ويعمل
- ✅ لا توجد أخطاء TypeScript
- ✅ Selectors محسّنة
- ✅ DevTools يعمل

---

### Task 1.4: Testing

**المدة:** 1 ساعة

```bash
# فحص TypeScript
npx tsc --noEmit

# فحص ESLint
npx eslint src/stores/**/*.ts

# فحص Build
npm run build
```

**معايير الإنجاز:**

- ✅ 0 TypeScript errors
- ✅ 0 ESLint warnings
- ✅ Build ناجح

---

### Task 1.5: Git Commit

**المدة:** 15 دقيقة

```bash
git add src/stores/
git commit -m "feat: Add Zustand state management infrastructure

- Install zustand and immer
- Create TenderPricingStore with full CRUD operations
- Add electron storage middleware
- Add logger middleware for DevTools
- Create optimized selectors

Store Features:
- Load/Save pricing data
- Real-time calculations (total, completion)
- Dirty state tracking
- Error handling
- Persistence via Electron storage
"

git push origin feature/tenders-system-quality-improvement
```

**معايير الإنجاز:**

- ✅ Commit واضح ومنظم
- ✅ Push ناجح

---

## Week 1, Day 2-5: سيتم توثيقها في الرسالة القادمة...

---

# Phase 2️⃣ - 7️⃣: سيتم توثيقها بالتفصيل

_ملاحظة: الخطة كاملة تحتوي على 9 أسابيع × 5 أيام = 45 يوم عمل_  
_كل يوم يحتوي على مهام محددة، معايير إنجاز، وتعليمات Git_

---

## 📋 ملاحظات مهمة

### Workflow لكل مهمة:

1. **قبل البدء:**

   - قراءة المهمة بالكامل
   - فهم المعايير المطلوبة
   - التحقق من Dependencies

2. **أثناء التنفيذ:**

   - اتباع الخطوات بالترتيب
   - كتابة Code نظيف ومنظم
   - توثيق التغييرات

3. **بعد الإنجاز:**

   - التحقق من المعايير
   - اختبار شامل
   - Commit + Push

4. **للتحقق:**

   ```bash
   # TypeScript
   npx tsc --noEmit

   # ESLint
   npx eslint src/**/*.ts*

   # Tests
   npm test

   # Build
   npm run build
   ```

5. **Git Workflow:**
   ```bash
   git status
   git add <files>
   git commit -m "type: description"
   git push origin feature/tenders-system-quality-improvement
   ```

---

## 🎯 Success Criteria للمشروع بالكامل

### Technical

- ✅ 0 TypeScript errors
- ✅ 0 ESLint warnings
- ✅ Test coverage > 80%
- ✅ Build size increase < 50KB
- ✅ All performance targets met

### Code Quality

- ✅ No files > 500 lines
- ✅ No legacy hooks
- ✅ No event listeners
- ✅ Single source of truth for all data
- ✅ Clear separation of concerns

### User Experience

- ✅ Save time < 200ms
- ✅ No UI flicker
- ✅ Clear error messages
- ✅ Offline mode works
- ✅ Accessible (WCAG 2.1 AA)

---

## 📚 Resources

### Documentation

- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [Immer Docs](https://immerjs.github.io/immer/)
- [React Performance](https://react.dev/learn/render-and-commit)

### Tools

- React DevTools Profiler
- Chrome Performance Tab
- VS Code Extensions: ESLint, Prettier, TypeScript

---

**الخطوة التالية:** انتقل إلى `TENDERS_MODERNIZATION_PROGRESS_TRACKER.md` لتتبع التنفيذ
