# 🏗️ Tenders System - Architecture Documentation

**النسخة:** 1.0.0  
**تاريخ الإنشاء:** 24 أكتوبر 2025  
**الحالة:** 🔄 قيد التطوير

---

## 📋 نظرة عامة

هذا المستند يوثق المعمارية الحالية والمستهدفة لنظام المنافسات (Tenders System) ضمن تطبيق Desktop Management System.

---

## 🎯 الأهداف المعمارية

1. **Single Source of Truth:** مصدر واحد للحقيقة باستخدام Zustand Store
2. **Separation of Concerns:** فصل واضح بين العرض والمنطق والبيانات
3. **Predictable State:** حالة يمكن التنبؤ بها وسهلة التتبع
4. **Performance:** أداء محسّن (< 200ms save time, < 5 re-renders)
5. **Testability:** كود قابل للاختبار بسهولة

---

## 🗺️ المعمارية المستهدفة

```
┌─────────────────────────────────────────────────────────┐
│                  Presentation Layer                      │
│  (Pages, Components, Features)                          │
│  - TendersPage                                          │
│  - TenderPricingPage                                    │
│  - TenderPricingWizard                                  │
│  - NewTenderForm                                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ uses selectors/actions
                 ▼
┌─────────────────────────────────────────────────────────┐
│              Application Layer (Zustand)                │
│  - tenderPricingStore (slices: data, ui, effects)       │
│  - tendersStore                                         │
│  - attachmentsStore (future)                            │
│  - Selectors (memoized, derived state)                  │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ calls services
                 ▼
┌─────────────────────────────────────────────────────────┐
│                  Domain Layer                           │
│  - Types (tender.ts, boq.ts, pricing.ts)                │
│  - Validators (type guards)                             │
│  - Mappers (legacy → new format)                        │
│  - Services (pure functions):                           │
│    • calculations.ts                                    │
│    • fileParsers.ts                                     │
│    • mappingEngine.ts                                   │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ calls repositories
                 ▼
┌─────────────────────────────────────────────────────────┐
│              Infrastructure Layer                       │
│  - Repositories:                                        │
│    • TenderRepository                                   │
│    • BOQRepository                                      │
│    • AttachmentsRepository                              │
│  - Electron Storage Adapter                             │
│  - API Gateway (future: backend sync)                   │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 هيكل المجلدات المستهدف

```
src/
├── presentation/
│   └── pages/
│       └── Tenders/
│           ├── TendersPage/                    # List view
│           │   ├── index.tsx                   # Container
│           │   └── sections/
│           │       ├── Filters.tsx
│           │       ├── Toolbar.tsx
│           │       ├── Stats.tsx
│           │       ├── List.tsx
│           │       └── Empty.tsx
│           ├── TenderPricingPage/              # Pricing view
│           │   ├── index.tsx
│           │   └── components/
│           │       ├── HeaderBar.tsx
│           │       ├── ActionsBar.tsx
│           │       ├── Table.tsx
│           │       └── SummarySidebar.tsx
│           └── NewTenderForm/                  # Create tender
│               ├── index.tsx
│               ├── schema.ts                   # Validation
│               ├── sections/
│               │   ├── MetaSection.tsx
│               │   ├── AttachmentsSection.tsx
│               │   └── BOQUploadSection.tsx
│               └── hooks/
│                   └── useNewTenderForm.ts
│
├── features/
│   └── tenders/
│       └── pricing/
│           └── wizard/                         # Pricing wizard
│               ├── Container.tsx
│               ├── steps/
│               │   ├── ItemsImportStep.tsx
│               │   ├── MappingStep.tsx
│               │   ├── ReviewStep.tsx
│               │   ├── PricingStep.tsx
│               │   └── SummaryStep.tsx
│               ├── hooks/
│               │   ├── useWizardNavigation.ts
│               │   └── useWizardState.ts
│               ├── services/
│               │   ├── fileParsers.ts
│               │   └── mappingEngine.ts
│               └── types.ts
│
├── stores/                                     # Zustand stores
│   ├── tenderPricing/
│   │   ├── index.ts                           # Composed store
│   │   ├── dataSlice.ts                       # Data state
│   │   ├── uiSlice.ts                         # UI state
│   │   └── effectsSlice.ts                    # Side effects
│   ├── tenders/
│   │   └── index.ts
│   └── middleware/
│       ├── electronStorage.ts
│       └── logger.ts
│
├── domain/                                     # Business logic
│   ├── types/
│   │   ├── tender.ts                          # Single source
│   │   ├── boq.ts
│   │   └── pricing.ts
│   ├── guards/
│   │   └── isTender.ts
│   ├── mappers/
│   │   └── tenderMappers.ts
│   └── services/
│       ├── tenderPricing/
│       │   ├── calculations.ts
│       │   └── persistence/
│       │       ├── boqPersistence.ts
│       │       └── tenderPersistence.ts
│       └── shared/
│
├── infrastructure/
│   └── repositories/
│       ├── TenderRepository.ts
│       ├── BOQRepository.ts
│       └── AttachmentsRepository.ts
│
└── application/
    ├── hooks/                                  # Thin hooks
    │   └── useUnifiedTenderPricing.ts         # (refactored)
    └── selectors/
        └── tenderPricingSelectors.ts
```

---

## 🔄 Data Flow

### قراءة البيانات (Read Flow)

```
Component
   │
   │ uses selector
   ▼
useTenderPricingValue(selector)
   │
   │ reads from
   ▼
tenderPricingStore (Zustand)
   │
   │ derives from
   ▼
Raw State + Memoized Selectors
```

### كتابة البيانات (Write Flow)

```
Component
   │
   │ dispatches action
   ▼
store.updateItemPricing(itemId, value)
   │
   │ updates state (Immer)
   ▼
Store State (immutable update)
   │
   │ triggers effect
   ▼
effectsSlice (save logic)
   │
   │ calls service
   ▼
boqPersistence.save(data)
   │
   │ calls repository
   ▼
BOQRepository.save()
   │
   │ persists to
   ▼
Electron Store / File System
```

---

## 🧩 Store Structure

### tenderPricingStore

```typescript
interface TenderPricingState {
  // Data Slice
  currentTenderId: string | null
  pricingData: Map<string, PricingItem>
  boqItems: BOQItem[]

  // UI Slice
  isDirty: boolean
  isLoading: boolean
  selectedItems: Set<string>
  filters: FilterState

  // Effects Slice
  lastSaved: Date | null
  error: Error | null

  // Actions
  setCurrentTender: (id: string) => void
  loadPricing: (tenderId: string) => Promise<void>
  updateItemPricing: (itemId: string, value: number) => void
  markDirty: () => void
  savePricing: () => Promise<void>
  resetDirty: () => void
  reset: () => void

  // Computed
  getTotalValue: () => number
  getPricedItemsCount: () => number
  getCompletionPercentage: () => number
}
```

### Middleware Stack

```typescript
create<TenderPricingState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // ... store implementation
      })),
      {
        name: 'tender-pricing-storage',
        storage: createElectronStorage(),
        partialize: (state) => ({
          currentTenderId: state.currentTenderId,
          pricingData: state.pricingData,
        }),
      },
    ),
  ),
)
```

---

## 🎯 Migration Strategy

### Phase 1: Co-existence

- إنشاء Zustand store بجانب الكود القديم
- استخدام store في مكونات جديدة
- الكود القديم يستمر في العمل

### Phase 2: Gradual Migration

- تحويل مكون واحد في كل مرة
- استبدال `useTenderPricingPersistence` بـ store actions
- حذف legacy hooks بعد التأكد من عدم استخدامها

### Phase 3: Cleanup

- حذف جميع legacy hooks
- حذف draft system بالكامل
- توحيد TypeScript types

---

## 🧪 Testing Strategy

### Unit Tests

- Store actions/selectors
- Pure services (calculations, parsers)
- Mappers and validators

### Integration Tests

- Component + Store interactions
- Save/Load flows
- Wizard complete flow

### E2E Tests

- Full user scenarios
- Create tender → Price → Save
- Search → Filter → Edit

---

## 📊 Performance Targets

| المقياس             | الهدف   |
| ------------------- | ------- |
| Save Time           | < 200ms |
| Re-renders          | < 5     |
| Memory Usage        | < 30MB  |
| Component LOC       | < 300   |
| Time to Interactive | < 2s    |

---

## 🔒 Rules and Constraints

### ✅ Do

- Use selectors for all reads from store
- Keep components thin (< 300 LOC)
- Write pure functions in services/
- Test all business logic
- Use Immer for state updates

### ❌ Don't

- Call repositories directly from components
- Use local state for server data
- Prop-drill more than 2 levels
- Import legacy hooks in new code
- Mix UI and business logic

---

## 📝 Decision Log

### 2025-10-24: Zustand vs Redux

**القرار:** استخدام Zustand  
**الأسباب:**

- أخف وزناً (< 1KB)
- API أبسط
- Built-in DevTools
- TypeScript support ممتاز
- لا يحتاج boilerplate كثير

### 2025-10-24: Slices Pattern

**القرار:** تقسيم Store إلى Slices  
**الأسباب:**

- فصل واضح للمسؤوليات
- أسهل للصيانة
- ملفات أصغر (< 150 LOC per slice)

---

**آخر تحديث:** 24 أكتوبر 2025  
**المحدث بواسطة:** GitHub Copilot  
**الحالة:** 🟢 Draft Complete
