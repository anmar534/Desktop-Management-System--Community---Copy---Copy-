# 📋 GitHub Issues - Phase 0.4

**التاريخ:** 16 أكتوبر 2025  
**الهدف:** إنشاء Issues منظمة لتتبع التقدم في Phase 1 و Phase 2

---

## 🎯 المرحلة 1: إصلاحات عاجلة (Phase 1)

### Issue #1: إصلاح 11 خطأ TypeScript في Tender Interface

**العنوان:** `[Phase 1.1] Fix 11 TypeScript errors in Tender interface`

**الوصف:**

````markdown
## 🐛 المشكلة

يوجد 11 خطأ TypeScript في ملف `tests/integration/system-e2e.test.ts` بسبب واجهة `Tender` غير مكتملة.

## 📊 التفاصيل

### الملف المتأثر

- `tests/integration/system-e2e.test.ts` (11 errors)

### الأخطاء

1. Property 'notes' does not exist (2 occurrences)
2. Property 'documents' does not exist (2 occurrences)
3. Property 'proposals' does not exist (1 occurrence)
4. Property 'evaluationCriteria' does not exist (1 occurrence)
5. Property 'competitors' does not exist (1 occurrence)
6. Property 'requirements' does not exist (1 occurrence)
7. Property 'createdAt' does not exist (1 occurrence)
8. Property 'updatedAt' does not exist (1 occurrence)

## ✅ الحل المطلوب

### 1. تحديث Tender Interface

إضافة الخصائص المفقودة إلى واجهة `Tender`:

```typescript
export interface Tender {
  // Existing properties...

  // Missing properties to add:
  notes?: string
  documents?: TenderDocument[]
  proposals?: TenderProposal[]
  evaluationCriteria?: EvaluationCriterion[]
  competitors?: string[]
  requirements?: string[]
  createdAt: string
  updatedAt: string
}
```
````

### 2. إنشاء Types الداعمة

```typescript
export interface TenderDocument {
  id: string
  name: string
  type: string
  url: string
}

export interface TenderProposal {
  id: string
  vendorId: string
  amount: number
  status: 'pending' | 'accepted' | 'rejected'
}

export interface EvaluationCriterion {
  id: string
  name: string
  weight: number
  description: string
}
```

### 3. تحديث Mock Data

تحديث دالة `createMockTender` في ملف الاختبار لتشمل القيم الافتراضية.

## 🎯 معايير القبول

- [ ] جميع الـ 11 خطأ TypeScript تم إصلاحها
- [ ] الاختبارات تمر بنجاح
- [ ] الـ types موثقة بشكل صحيح
- [ ] لا أخطاء جديدة

## 📚 المراجع

- Baseline Metrics: `docs/baseline/BASELINE_METRICS_2025-10-16.md`
- Implementation Roadmap: `docs/IMPLEMENTATION_ROADMAP_2025.md`

````

**Labels:** `Phase-1`, `TypeScript`, `bug`, `high-priority`
**Milestone:** Phase 1 - Critical Fixes
**Assignee:** (اختياري)

---

### Issue #2: عزل 568 اختبار فاشل إلى مجلد Legacy

**العنوان:** `[Phase 1.2] Isolate 568 failing tests to _legacy folder`

**الوصف:**
```markdown
## 🎯 الهدف

عزل 568 اختبار فاشل (32%) إلى مجلد منفصل للحفاظ على CI/CD نظيف، مع الاحتفاظ بها للإصلاح المستقبلي.

## 📊 الحالة الحالية

````

✅ E2E Tests: 15/15 (100%)
❌ Unit Tests: ~300/868 passing (65%)
❌ Failing: 568 tests (32%)

````

## 📝 خطة التنفيذ

### 1. إنشاء مجلد Legacy
```bash
mkdir tests/_legacy
mkdir tests/_legacy/unit
mkdir tests/_legacy/integration
````

### 2. نقل الاختبارات الفاشلة

- تحديد جميع ملفات الاختبار الفاشلة
- نقلها إلى `tests/_legacy/`
- الاحتفاظ ببنية المجلدات الأصلية

### 3. تحديث vitest.config.ts

```typescript
export default defineConfig({
  test: {
    // Exclude legacy tests
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/_legacy/**', // ← إضافة هذا السطر
    ],
  },
})
```

### 4. إنشاء ملف README

إنشاء `tests/_legacy/README.md` يشرح:

- سبب العزل
- خطة الإصلاح المستقبلية
- كيفية تشغيل هذه الاختبارات يدوياً

### 5. تحديث package.json

```json
{
  "scripts": {
    "test": "vitest run",
    "test:legacy": "vitest run tests/_legacy --reporter=verbose"
  }
}
```

## ✅ معايير القبول

- [ ] 568 اختبار تم نقلها إلى `tests/_legacy/`
- [ ] Test pass rate = 100% (بعد استبعاد القديمة)
- [ ] CI/CD يعمل بنجاح
- [ ] ملف README موجود في \_legacy/
- [ ] يمكن تشغيل الاختبارات القديمة بـ `npm run test:legacy`

## 📚 المراجع

- Baseline Metrics: `docs/baseline/BASELINE_METRICS_2025-10-16.md`
- Test Status Report: `docs/FINAL_TEST_STATUS_REPORT.md`

````

**Labels:** `Phase-1`, `testing`, `refactor`, `high-priority`
**Milestone:** Phase 1 - Critical Fixes

---

### Issue #3: إصلاح Build Pipeline (Vite/Rollup)

**العنوان:** `[Phase 1.3] Fix build failure - react-router-dom externalization`

**الوصف:**
```markdown
## 🐛 المشكلة

Build يفشل حالياً بسبب:
1. ❌ Rollup failed to resolve import "react-router-dom"
2. ⚠️ 28 sourcemap warnings
3. ⚠️ CJS Node API deprecated warning

## 📊 التفاصيل

### خطأ فادح
````

Error: Rollup failed to resolve import "react-router-dom"
from "src/components/navigation/Breadcrumbs.tsx"

```

### Sourcemap Warnings (28 file)
```

- Dashboard.tsx
- NewBankAccount.tsx
- TenderStatusCards.tsx
- ... (25+ more files)

````

## ✅ الحل المطلوب

### 1. إصلاح react-router-dom
تحديث `vite.config.ts`:

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      external: [
        'react-router-dom',
        'electron',
        // ... other externals
      ]
    }
  }
})
````

### 2. إصلاح Sourcemaps

```typescript
export default defineConfig({
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        sourcemap: true,
        sourcemapExcludeSources: false,
      },
    },
  },
})
```

### 3. التحويل من CJS إلى ESM

تحويل `vite.config.ts` لاستخدام ESM بدلاً من CommonJS.

## 🎯 معايير القبول

- [ ] Build يكتمل بنجاح
- [ ] لا أخطاء Rollup
- [ ] Sourcemap warnings محلولة
- [ ] وقت البناء < 25 ثانية
- [ ] حجم Bundle معقول (<5MB)

## 📚 المراجع

- Baseline Metrics: `docs/baseline/BASELINE_METRICS_2025-10-16.md`
- Vite Documentation: https://vitejs.dev/guide/build.html

````

**Labels:** `Phase-1`, `build`, `bug`, `high-priority`
**Milestone:** Phase 1 - Critical Fixes

---

### Issue #4: إضافة Smoke Tests

**العنوان:** `[Phase 1.4] Add smoke tests for critical user journeys`

**الوصف:**
```markdown
## 🎯 الهدف

إضافة 5-10 اختبارات smoke بسيطة للتأكد من عمل الوظائف الحرجة.

## 📝 Smoke Tests المطلوبة

### 1. Application Startup
```typescript
describe('Smoke: Application Startup', () => {
  it('should render main app without crashing', () => {
    render(<App />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
````

### 2. Navigation

```typescript
describe('Smoke: Navigation', () => {
  it('should navigate between main pages', () => {
    // Test dashboard → clients → projects
  })
})
```

### 3. Data Loading

```typescript
describe('Smoke: Data Loading', () => {
  it('should load initial data from storage', async () => {
    // Test StorageLayer initialization
  })
})
```

### 4. CRUD Operations

```typescript
describe('Smoke: CRUD Operations', () => {
  it('should create, read, update, delete tender', async () => {
    // Basic CRUD test
  })
})
```

### 5. Authentication

```typescript
describe('Smoke: Authentication', () => {
  it('should handle login/logout flow', () => {
    // Basic auth flow
  })
})
```

## ✅ معايير القبول

- [ ] 5 smoke tests مضافة على الأقل
- [ ] جميع الاختبارات تمر بنجاح
- [ ] وقت التشغيل < 10 ثواني
- [ ] تغطي الوظائف الحرجة (80% of user journeys)
- [ ] موثقة بشكل واضح

## 📚 المراجع

- Implementation Roadmap: `docs/IMPLEMENTATION_ROADMAP_2025.md` (Section 1.3)

````

**Labels:** `Phase-1`, `testing`, `enhancement`, `medium-priority`
**Milestone:** Phase 1 - Critical Fixes

---

## 🎯 المرحلة 2: تحسينات متوسطة (Phase 2)

### Issue #5: تفكيك Storage Layer Monolith

**العنوان:** `[Phase 2.1] Refactor Storage Layer (1,283 lines → modular architecture)`

**الوصف:**
```markdown
## 🎯 الهدف

تفكيك `src/utils/StorageLayer.ts` (1,283 سطر) إلى معمارية modular منظمة.

## 📊 الحالة الحالية

````

src/utils/StorageLayer.ts: 1,283 lines ❌

- All entities in one file
- Hard to maintain
- Difficult to test
- No clear separation of concerns

```

## 📝 المعمارية المقترحة

```

src/storage/
├── core/
│ ├── BaseRepository.ts (Generic CRUD)
│ ├── StorageAdapter.ts (Electron Store wrapper)
│ └── EncryptionService.ts (AES-GCM)
├── repositories/
│ ├── TenderRepository.ts
│ ├── ClientRepository.ts
│ ├── ProjectRepository.ts
│ ├── BudgetRepository.ts
│ └── InvoiceRepository.ts
├── types/
│ └── index.ts (Shared types)
└── index.ts (Public API)

```

## ✅ خطة التنفيذ

### Phase 2.1.1: إنشاء Core Layer
1. إنشاء `BaseRepository<T>` مع CRUD generics
2. إنشاء `StorageAdapter` للـ electron-store
3. نقل `EncryptionService` إلى ملف منفصل

### Phase 2.1.2: Repository Pattern
1. إنشاء `TenderRepository extends BaseRepository<Tender>`
2. نقل جميع دوال الـ Tenders
3. تطبيق نفس النمط لباقي الـ entities

### Phase 2.1.3: Testing
1. Unit tests لكل repository
2. Integration tests للـ BaseRepository
3. ضمان 85%+ coverage

### Phase 2.1.4: Migration
1. تحديث جميع الاستدعاءات في الـ UI
2. Deprecate old StorageLayer
3. Remove after validation

## 🎯 معايير القبول

- [ ] StorageLayer.ts أقل من 100 سطر (re-exports فقط)
- [ ] كل repository في ملف منفصل (<200 سطر)
- [ ] Test coverage 85%+
- [ ] جميع الاختبارات تمر
- [ ] Performance لا يتأثر سلباً
- [ ] Documentation كاملة

## 📚 المراجع

- Implementation Roadmap Part 2: `docs/IMPLEMENTATION_ROADMAP_2025_PART2.md`
- Current Storage Layer: `src/utils/StorageLayer.ts`
```

**Labels:** `Phase-2`, `refactor`, `architecture`, `high-priority`  
**Milestone:** Phase 2 - Medium-term Improvements

---

### Issue #6: تحسينات Accessibility (WCAG 2.1 AA)

**العنوان:** `[Phase 2.3] Implement WCAG 2.1 AA compliance`

**الوصف:**

```markdown
## 🎯 الهدف

تحسين إمكانية الوصول لتحقيق WCAG 2.1 Level AA compliance.

## 📊 الحالة الحالية
```

❌ Missing ARIA labels on interactive elements
❌ Incomplete keyboard navigation
❌ Poor color contrast in some areas
❌ No screen reader announcements
⚠️ Focus management issues

````

## 📝 خطة التنفيذ

### 1. Semantic HTML
- استبدال `<div>` بـ `<button>`, `<nav>`, `<main>`, etc.
- إضافة proper heading hierarchy (h1 → h6)

### 2. ARIA Attributes
```tsx
<button
  aria-label="إغلاق النافذة"
  aria-describedby="dialog-description"
>
````

### 3. Keyboard Navigation

- Tab order صحيح
- Skip links للمحتوى الرئيسي
- Escape لإغلاق Modals
- Arrow keys للقوائم

### 4. Focus Management

```tsx
const dialogRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  if (isOpen) {
    dialogRef.current?.focus()
  }
}, [isOpen])
```

### 5. Screen Reader Support

```tsx
<div role="status" aria-live="polite">
  تم حفظ التغييرات بنجاح
</div>
```

### 6. Color Contrast

- جميع النصوص: نسبة تباين 4.5:1 على الأقل
- النصوص الكبيرة: 3:1 على الأقل

## 🛠️ الأدوات

1. **axe DevTools** - فحص تلقائي
2. **NVDA/JAWS** - Screen reader testing
3. **Lighthouse** - Accessibility audit
4. **eslint-plugin-jsx-a11y** - Linting rules

## ✅ معايير القبول

- [ ] Lighthouse Accessibility Score ≥ 90
- [ ] جميع عناصر التفاعل بها ARIA labels
- [ ] Keyboard navigation كامل
- [ ] Focus visible دائماً
- [ ] Screen reader announcements صحيحة
- [ ] Color contrast يمر WCAG AA
- [ ] Documentation للمطورين

## 📚 المراجع

- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- Implementation Roadmap Part 2: `docs/IMPLEMENTATION_ROADMAP_2025_PART2.md`

```

**Labels:** `Phase-2`, `accessibility`, `enhancement`, `medium-priority`
**Milestone:** Phase 2 - Medium-term Improvements

---

## 📊 ملخص Issues

### Phase 1 (عاجل - أسبوعين)
1. ✅ [#1] Fix TypeScript errors (11 errors)
2. ✅ [#2] Isolate legacy tests (568 tests)
3. ✅ [#3] Fix build pipeline
4. ✅ [#4] Add smoke tests (5-10 tests)

### Phase 2 (متوسط - 1-3 أشهر)
5. ✅ [#5] Refactor Storage Layer (1,283 → modular)
6. ✅ [#6] WCAG 2.1 AA compliance

---

## 🔗 الخطوة التالية

بعد إنشاء هذه الـ Issues على GitHub:
1. ربط كل Issue بالـ Milestone المناسب
2. إضافة Labels للتصنيف
3. تعيين Assignees (إذا كان هناك فريق)
4. إنشاء Project Board لتتبع التقدم
5. البدء في تنفيذ Phase 1.1

---

**تاريخ الإنشاء:** 16 أكتوبر 2025
**الحالة:** ✅ جاهز للنشر على GitHub
**الالتزام:** Phase 0.4 Complete
```
