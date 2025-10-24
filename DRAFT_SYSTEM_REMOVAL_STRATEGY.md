# استراتيجية حذف نظام Draft

**التاريخ:** 24 أكتوبر 2025  
**الحالة:** 📋 قيد التخطيط  
**المدة المتوقعة:** يومان (Days 2-3 من Week 5)

---

## 📊 التحليل التفصيلي

### الوضع الحالي

#### 1. useEditableTenderPricing.ts (223 lines)

**State Variables (9 total):**

```typescript
status: 'loading' | 'ready' | 'empty'
items: PricingSnapshotItem[]
totals: PricingSnapshotTotals | null
source: 'official' | 'draft' | 'none'
hasDraft: boolean              // ❌ للحذف
isDraftNewer: boolean          // ❌ للحذف
dirty: boolean                 // ❌ للحذف
officialAt?: string           // ❌ للحذف
draftAt?: string              // ❌ للحذف
```

**Methods:**

```typescript
saveOfficial() // ✅ يبقى (rename to save)
saveDraft() // ❌ للحذف
markDirty() // ❌ للحذف
reload() // ✅ يبقى
```

**Dependencies:**

- `pricingStorageAdapter` (used for Draft/Official)

**Usage:**

- TenderPricingPage.tsx (line 137)
- useTenderPricingState.ts (type import)
- PricingHeader.tsx (type import)

---

#### 2. pricingStorageAdapter.ts (150 lines)

**Current API:**

```typescript
loadOfficial(tenderId)   // ✅ → load(tenderId)
loadDraft(tenderId)      // ❌ حذف
saveOfficial(...)        // ✅ → save(...)
saveDraft(...)           // ❌ حذف
clearDraft(tenderId)     // ❌ حذف
getStatus(tenderId)      // ❌ حذف
```

**Storage Keys:**

```typescript
STORAGE_KEYS.PRICING_OFFICIAL // ✅ → PRICING_DATA
STORAGE_KEYS.PRICING_DRAFT // ❌ حذف
```

---

#### 3. useTenderPricingPersistence.ts (686 lines)

**Draft-Related Logic:**

- Auto-save mechanism (lines ~300-400)
- Conflict resolution
- Draft status tracking
- Event listeners for draft changes

**Current Parameters (12 total):**

```typescript
tender
pricingData // ✅ من Store
quantityItems // ✅ من Store
defaultPercentages
pricingViewItems // معقد - يحتاج دراسة
domainPricing // integration - يحتاج دراسة
calculateProjectTotal
isLoaded
currentItemId
setPricingData // ❌ سيستبدل بـ Store actions
formatCurrencyValue
```

**للحذف/التبسيط:**

- Auto-save logic (~100 lines)
- Draft conflict resolution (~50 lines)
- Draft status tracking (~30 lines)
- **Total:** ~180 lines للحذف

---

#### 4. UI Components

**Draft-Related UI:**

**TenderPricing/components/PricingHeader.tsx:**

```typescript
// Lines 92-98: Draft badges
{editablePricing.source === 'draft' && editablePricing.isDraftNewer && (
  <Badge variant="warning">تغييرات غير معتمدة</Badge>
)}
{editablePricing.hasDraft && !editablePricing.isDraftNewer && (
  <Badge variant="outline">مسودة قديمة</Badge>
)}
```

**TenderPricing/hooks/useTenderPricingState.ts:**

```typescript
// Lines 76, 82: Dirty check
if (editablePricing.dirty || editablePricing.isDraftNewer) {
  // تحذير قبل الخروج
}
```

**TenderPricingPage.tsx:**

```typescript
// Lines 601-602, 633-634: Auto-save calls
if (editablePricing.saveDraft) {
  void editablePricing.saveDraft(items, totals, 'auto')
}
```

---

## 🎯 الخطة التنفيذية

### Day 2: Draft System Removal (8 ساعات)

#### Task 2.1: تحليل الاعتماديات (1 ساعة)

- [x] قراءة useEditableTenderPricing بالكامل ✅
- [x] قراءة pricingStorageAdapter ✅
- [x] قراءة useTenderPricingPersistence (أول 100 سطر) ✅
- [ ] grep search لجميع استخدامات Draft
- [ ] إنشاء قائمة بالملفات المتأثرة

**الملفات المتأثرة (مؤكدة):**

1. useEditableTenderPricing.ts
2. pricingStorageAdapter.ts
3. useTenderPricingPersistence.ts
4. TenderPricingPage.tsx
5. useTenderPricingState.ts (2 instances)
6. PricingHeader.tsx
7. storageKeys.ts (PRICING_DRAFT)

---

#### Task 2.2: تبسيط pricingStorageAdapter (1.5 ساعة)

**Before (150 lines):**

```typescript
interface PricingRecord {
  tenderId: string
  items: PricingSnapshotItem[]
  totals: PricingSnapshotTotals | null
  meta: {
    status: 'official' | 'draft'
    savedAt: string
    source: 'user' | 'auto' | 'migration'
  }
}

loadOfficial(tenderId)
loadDraft(tenderId)
saveOfficial(tenderId, items, totals, source)
saveDraft(tenderId, items, totals, source)
clearDraft(tenderId)
getStatus(tenderId)
```

**After (~60 lines):**

```typescript
interface PricingRecord {
  tenderId: string
  items: PricingSnapshotItem[]
  totals: PricingSnapshotTotals | null
  meta: {
    savedAt: string
    source: 'user' | 'migration'  // no 'auto'
  }
}

load(tenderId): Promise<PricingRecord | null>
save(tenderId, items, totals, source = 'user'): Promise<PricingRecord>
clear(tenderId): Promise<void>  // optional
```

**Storage Key:**

```typescript
// storageKeys.ts
PRICING_DATA: 'app_pricing_data' // replaces PRICING_OFFICIAL & PRICING_DRAFT
```

**التوفير:** -90 lines (-60%)

---

#### Task 2.3: حذف useEditableTenderPricing (2 ساعات)

**الاستراتيجية:**

1. **Delete the entire file** ❌
2. **Replace with Store integration** ✅

**البديل الجديد:**

```typescript
// في TenderPricingPage.tsx
import { useTenderPricingStore } from '@/stores/tenderPricingStore'

// استبدال
const editablePricing = useEditableTenderPricing(tender)

// بـ
const { pricingData, isLoading, savePricing, loadPricing } = useTenderPricingStore()

useEffect(() => {
  if (tender?.id) {
    void loadPricing(tender.id)
  }
}, [tender?.id, loadPricing])
```

**State Mapping:**

| Old (useEditableTenderPricing) | New (useTenderPricingStore) |
| ------------------------------ | --------------------------- |
| status                         | isLoading                   |
| items                          | pricingData (converted)     |
| totals                         | calculateTotals() selector  |
| source                         | ❌ removed                  |
| hasDraft                       | ❌ removed                  |
| isDraftNewer                   | ❌ removed                  |
| dirty                          | isDirty                     |
| saveOfficial()                 | savePricing()               |
| saveDraft()                    | ❌ removed                  |
| reload()                       | loadPricing()               |

---

#### Task 2.4: تبسيط useTenderPricingPersistence (2.5 ساعة)

**الأجزاء للحذف:**

1. **Auto-save logic (~100 lines):**

```typescript
// ❌ حذف debounced auto-save
const debouncedSave = debounce((data: PricingData) => {
  void editablePricing.saveDraft(...)
}, 2000)
```

2. **Draft status tracking (~30 lines):**

```typescript
// ❌ حذف Draft status updates
if (editablePricing.hasDraft) { ... }
if (editablePricing.isDraftNewer) { ... }
```

3. **Conflict resolution (~50 lines):**

```typescript
// ❌ حذف Draft/Official conflict handling
const resolveDraftConflict = () => { ... }
```

**البديل البسيط:**

```typescript
// Save on button click only
const handleSave = useCallback(async () => {
  if (!tender?.id) return

  const pricingRecord = convertMapToPricingRecord(pricingData)
  await savePricing(tender.id, pricingRecord)

  toast.success('تم حفظ التسعير بنجاح')
}, [tender?.id, pricingData, savePricing])
```

**التوفير:** 686 → ~500 lines (-27%)

---

#### Task 2.5: تحديث UI Components (1 ساعة)

**1. PricingHeader.tsx:**

```typescript
// ❌ حذف Draft badges
{editablePricing.source === 'draft' && ...}  // DELETE
{editablePricing.hasDraft && ...}           // DELETE

// ✅ الاحتفاظ بـ Dirty indicator فقط
{isDirty && (
  <Badge variant="warning">تغييرات غير محفوظة</Badge>
)}
```

**2. useTenderPricingState.ts:**

```typescript
// ❌ حذف Draft checks
if (editablePricing.dirty || editablePricing.isDraftNewer)  // DELETE

// ✅ البديل
if (isDirty)
```

**3. TenderPricingPage.tsx:**

```typescript
// ❌ حذف Auto-save calls
if (editablePricing.saveDraft) {
  void editablePricing.saveDraft(items, totals, 'auto')  // DELETE
}

// ✅ Save on button click فقط
<Button onClick={handleSave}>حفظ</Button>
```

---

### Day 3: Testing & Cleanup (8 ساعات)

#### Task 3.1: Testing الحفظ المباشر (3 ساعات)

**Test Cases:**

1. **Basic Save:**

   - تعديل item → نقر Save → تحقق من localStorage
   - تحديث الصفحة → تحقق من تحميل البيانات

2. **Multiple Items:**

   - تعديل 5 items → Save → Reload
   - تحقق من جميع البيانات

3. **Error Handling:**

   - localStorage ممتلئ
   - Network error (if applicable)

4. **Edge Cases:**
   - Tender بدون pricing
   - Empty pricing data
   - Invalid data format

**Manual Testing Checklist:**

- [ ] فتح TenderPricingPage
- [ ] تعديل Materials section
- [ ] نقر Save → success toast
- [ ] Reload page → البيانات موجودة ✅
- [ ] تعديل Labor section
- [ ] Navigate away → تحذير "تغييرات غير محفوظة"
- [ ] Back → Save → تحذير يختفي
- [ ] Test في 3 متصفحات (Chrome, Edge, Firefox)

---

#### Task 3.2: localStorage Cleanup (2 ساعة)

**Migration Script (optional):**

```typescript
// scripts/migrate-pricing-storage.ts
async function migratePricingData() {
  const officialStore = await loadFromStorage(STORAGE_KEYS.PRICING_OFFICIAL, {})
  const draftStore = await loadFromStorage(STORAGE_KEYS.PRICING_DRAFT, {})

  const merged: Record<string, PricingRecord> = {}

  // Merge: prefer draft if newer
  for (const [tenderId, official] of Object.entries(officialStore)) {
    const draft = draftStore[tenderId]

    if (draft && draft.meta.savedAt > official.meta.savedAt) {
      merged[tenderId] = draft
    } else {
      merged[tenderId] = official
    }
  }

  // Save to new key
  await saveToStorage(STORAGE_KEYS.PRICING_DATA, merged)

  // Clear old keys
  await localStorage.removeItem(STORAGE_KEYS.PRICING_OFFICIAL)
  await localStorage.removeItem(STORAGE_KEYS.PRICING_DRAFT)

  console.log(`✅ Migrated ${Object.keys(merged).length} pricing records`)
}
```

**أو: Simple cleanup**

```typescript
// في main.ts أو App.tsx
useEffect(() => {
  // One-time cleanup
  const hasRun = localStorage.getItem('PRICING_MIGRATION_DONE')
  if (!hasRun) {
    localStorage.removeItem(STORAGE_KEYS.PRICING_DRAFT)
    localStorage.setItem('PRICING_MIGRATION_DONE', '1')
  }
}, [])
```

---

#### Task 3.3: Draft UI Cleanup (2 ساعة)

**البحث الشامل:**

```bash
# في PowerShell
grep -r "saveDraft" src/
grep -r "hasDraft" src/
grep -r "isDraftNewer" src/
grep -r "PRICING_DRAFT" src/
```

**الملفات المحتملة:**

- TenderPricingWizard.tsx (line 212: loadDraftMap)
- NewProjectForm.tsx (line 232: handleSaveDraft) ← هذا مختلف (Projects)
- components/pricing/tender-pricing-process/ (legacy)

**للحذف:**

1. Draft badges في UI
2. Draft alerts
3. Reload buttons (إذا كانت خاصة بـ Draft)
4. Auto-save indicators

---

#### Task 3.4: Documentation (1 ساعة)

**الملفات للتحديث:**

1. **INTEGRATED_TENDERS_MODERNIZATION_PLAN.md** ✅

   - تحديث Week 5 status
   - توثيق التغييرات

2. **TENDERS_SYSTEM_REFACTORING_EXECUTION_PLAN.md**

   - إضافة ملاحظات عن Draft removal

3. **README.md** (if needed)

   - تحديث architecture notes

4. **CHANGELOG.md**
   - إضافة entry للتغيير الكبير

**Migration Guide:**

```markdown
## Breaking Change: Draft System Removed

**Date:** October 24, 2025

### What Changed

- Removed auto-save functionality
- Removed draft/official separation
- Simplified to direct save on button click

### Migration

- All draft data will be lost
- Users must manually save changes
- No automatic backups anymore

### Benefits

- 70% less complexity
- Faster performance
- Easier to maintain
```

---

## 📊 الفوائد المتوقعة

### Code Reduction

| الملف                       | قبل       | بعد       | التوفير  |
| --------------------------- | --------- | --------- | -------- |
| useEditableTenderPricing    | 223       | ❌ DELETE | -100%    |
| pricingStorageAdapter       | 150       | 60        | -60%     |
| useTenderPricingPersistence | 686       | 500       | -27%     |
| **Total**                   | **1,059** | **560**   | **-47%** |

### Complexity Reduction

- ❌ 9 state variables → 3 state variables
- ❌ Draft/Official logic → Simple save
- ❌ Auto-save → Manual save
- ❌ Conflict resolution → None needed
- ✅ Single source of truth (Store)

### Performance Improvement

- Fewer re-renders (less state tracking)
- No debounced saves
- Simpler data flow
- **Expected:** 15-20% faster

### Developer Experience

- Easier to understand
- Easier to debug
- Easier to test
- Less cognitive load

---

## ⚠️ المخاطر والتخفيف

### Risk 1: Data Loss

**المخاطرة:** مستخدمين لديهم drafts غير محفوظة

**التخفيف:**

- Migration script لدمج drafts موجودة
- إشعار للمستخدمين قبل التحديث
- Backup قبل Migration

### Risk 2: Changed UX

**المخاطرة:** مستخدمون معتادون على auto-save

**التخفيف:**

- توضيح في UI أن Save يدوي
- إضافة تحذير عند الخروج بدون حفظ
- Training material

### Risk 3: Bugs

**المخاطرة:** bugs جديدة في save logic

**التخفيف:**

- Comprehensive testing
- Manual QA
- Gradual rollout
- Rollback plan جاهز

---

## 🔄 Rollback Plan

إذا فشل Migration:

1. **Revert commits:**

   ```bash
   git revert <commit-hash>
   ```

2. **Restore old files:**

   ```bash
   git checkout backup/before-draft-removal -- src/
   ```

3. **Clear new storage:**

   ```typescript
   localStorage.removeItem(STORAGE_KEYS.PRICING_DATA)
   ```

4. **Restore Draft system:**
   - Deploy previous version
   - Users' old drafts still exist

---

## ✅ Definition of Done

- [ ] جميع Draft-related code محذوف
- [ ] pricingStorageAdapter مبسّط
- [ ] useTenderPricingPersistence مبسّط
- [ ] UI محدّث (no Draft badges)
- [ ] 0 TypeScript errors
- [ ] 0 ESLint warnings
- [ ] Testing manual مكتمل
- [ ] localStorage migrated
- [ ] Documentation محدّث
- [ ] Commits pushed to GitHub
- [ ] INTEGRATED_TENDERS_MODERNIZATION_PLAN.md محدّث

---

## 📅 Timeline

| Task                                      | الوقت المقدر | الحالة         |
| ----------------------------------------- | ------------ | -------------- |
| 2.1: تحليل الاعتماديات                    | 1 ساعة       | 🔄 قيد التنفيذ |
| 2.2: pricingStorageAdapter                | 1.5 ساعة     | ⏳             |
| 2.3: Delete useEditableTenderPricing      | 2 ساعة       | ⏳             |
| 2.4: Simplify useTenderPricingPersistence | 2.5 ساعة     | ⏳             |
| 2.5: Update UI Components                 | 1 ساعة       | ⏳             |
| 3.1: Testing                              | 3 ساعات      | ⏳             |
| 3.2: localStorage Cleanup                 | 2 ساعة       | ⏳             |
| 3.3: Draft UI Cleanup                     | 2 ساعة       | ⏳             |
| 3.4: Documentation                        | 1 ساعة       | ⏳             |
| **Total**                                 | **16 ساعة**  | **6% مكتمل**   |

---

**Next Action:** Task 2.1 - grep search للاعتماديات الكاملة
