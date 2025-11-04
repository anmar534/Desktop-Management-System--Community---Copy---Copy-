# خطة توحيد Domain Layer للمنافسات

**التاريخ:** 3 نوفمبر 2025  
**الهدف:** توحيد حسابات المنافسات في Domain Layer واستبدال جميع الاستدعاءات المكررة

---

## 📊 التحليل الحالي

### الملفات المكررة المكتشفة:

1. **calculateTenderStats** - موجود في 3 أماكن:

   - `src/calculations/tender.ts` (الأصلي - 119 سطر)
   - `src/utils/unifiedCalculations.ts` (مكرر)
   - `src/shared/utils/pricing/unifiedCalculations.ts` (مكرر)

2. **computeTenderSummary** - موجود في:

   - `src/shared/utils/tender/tenderSummaryCalculator.ts`

3. **isTenderExpired** - موجود في:
   - `src/shared/utils/tender/tenderProgressCalculator.ts`

### الملفات التي تستخدم calculateTenderStats:

1. ✅ `src/domain/selectors/kpiSelectors.ts` (استيراد مباشر)
2. ✅ `src/presentation/pages/Tenders/components/TenderStatusCards.tsx`
3. ✅ `src/presentation/pages/Dashboard/components/AnnualKPICards.tsx`
4. ✅ `src/presentation/pages/Reports/ReportsPage.tsx`
5. ✅ `tests/calculations/tenderStats.test.ts`

### الملفات التي تستخدم computeTenderSummary:

1. ✅ `src/presentation/pages/Tenders/TendersPage.tsx`

---

## 🎯 الحل المقترح (Domain-Driven Architecture)

### البنية الموحدة:

```
Domain Layer (مصدر واحد للحقيقة)
├── tenderSelectors.ts ✅ (موجود - سنكمله)
│   ├── isTenderExpired ✅ (أضيف)
│   ├── isTenderUrgent ✅ (أضيف)
│   ├── selectExpiredTendersCount ✅ (أضيف)
│   ├── selectActiveNonExpiredCount ✅ (أضيف)
│   └── selectAllTenderCalculations (موجود)
│
Application Layer (الخدمات المتقدمة)
├── TenderAnalyticsService.ts ✅ (موجود)
│
Hooks Layer (الواجهة للمكونات)
└── useTenders.ts ✅ (موجود - سنحسنه)
    └── stats ✅ (موجود - سنوسعه)
```

---

## 📋 خطة التنفيذ (7 خطوات)

### ✅ الخطوة 1: تحديث Domain Layer

**الحالة:** مكتملة ✅  
**الملف:** `src/domain/selectors/tenderSelectors.ts`

**ما تم إنجازه:**

- ✅ إضافة `isTenderExpired()`
- ✅ إضافة `isTenderUrgent()`
- ✅ إضافة `selectExpiredTendersCount()`
- ✅ إضافة `selectUrgentTendersCount()`
- ✅ إضافة `selectActiveNonExpiredCount()`

---

### 🔄 الخطوة 2: تحسين useTenders Hook

**الحالة:** قيد التنفيذ  
**الملف:** `src/application/hooks/useTenders.ts`

**المطلوب:**

```typescript
const stats = useMemo(() => {
  return {
    // العدادات الأساسية
    totalTenders: tenders.length,
    activeTenders: selectActiveTendersCount(tenders),
    wonTenders: selectWonTendersCount(tenders),
    lostTenders: selectLostTendersCount(tenders),
    submittedTenders: selectSubmittedTendersCount(tenders),

    // إضافات جديدة
    newTenders: selectNewTendersCount(tenders),
    underActionTenders: selectUnderActionTendersCount(tenders),
    expiredTenders: selectExpiredTendersCount(tenders),
    urgentTenders: selectUrgentTendersCount(tenders),
    activeNonExpired: selectActiveNonExpiredCount(tenders),

    // الحسابات المالية
    wonValue: selectWonTendersValue(tenders),
    lostValue: selectLostTendersValue(tenders),
    submittedValue: selectSubmittedTendersValue(tenders),

    // النسب
    winRate: selectWinRate(tenders),
  }
}, [tenders])
```

**التأثير:** سيصبح `useTenders` المصدر الموحد لجميع الإحصائيات

---

### 🔄 الخطوة 3: استبدال TenderStatusCards

**الحالة:** جاهز للتنفيذ  
**الملف:** `src/presentation/pages/Tenders/components/TenderStatusCards.tsx`

**التغيير:**

```typescript
// ❌ القديم
import { calculateTenderStats } from '@/calculations/tender'
const tenderStats = useMemo(() => calculateTenderStats(tenders), [tenders])

// ✅ الجديد
import { useTenders } from '@/application/hooks/useTenders'
const { stats } = useTenders()
```

**التأثير:** حذف استدعاء `calculateTenderStats` الأول

---

### 🔄 الخطوة 4: استبدال AnnualKPICards

**الحالة:** جاهز للتنفيذ  
**الملف:** `src/presentation/pages/Dashboard/components/AnnualKPICards.tsx`

**التغيير:**

```typescript
// ❌ القديم
import { calculateTenderStats } from '@/calculations/tender'
const stats = useMemo(() => calculateTenderStats(tenders), [tenders])

// ✅ الجديد
import { useTenders } from '@/application/hooks/useTenders'
const { stats } = useTenders()
```

**التأثير:** حذف استدعاء `calculateTenderStats` الثاني

---

### 🔄 الخطوة 5: استبدال ReportsPage

**الحالة:** جاهز للتنفيذ  
**الملف:** `src/presentation/pages/Reports/ReportsPage.tsx`

**التغيير:**

```typescript
// ❌ القديم
import { calculateTenderStats } from '@/calculations/tender'
const stats = useMemo(() => calculateTenderStats(tenders), [tenders])

// ✅ الجديد
import { useTenders } from '@/application/hooks/useTenders'
const { stats } = useTenders()
```

**التأثير:** حذف استدعاء `calculateTenderStats` الثالث

---

### 🔄 الخطوة 6: استبدال kpiSelectors

**الحالة:** جاهز للتنفيذ  
**الملف:** `src/domain/selectors/kpiSelectors.ts`

**التغيير:**

```typescript
// ❌ القديم
import { calculateTenderStats } from '@/calculations/tender'
const stats = calculateTenderStats(tenders)

// ✅ الجديد
import {
  selectWonTendersCount,
  selectLostTendersCount,
  selectSubmittedTendersCount,
  selectWinRate,
  // ... إلخ
} from '@/domain/selectors/tenderSelectors'

const stats = {
  won: selectWonTendersCount(tenders),
  lost: selectLostTendersCount(tenders),
  // ... إلخ
}
```

**التأثير:** حذف استدعاء `calculateTenderStats` الرابع

---

### 🔄 الخطوة 7: استبدال TendersPage (computeTenderSummary)

**الحالة:** جاهز للتنفيذ  
**الملف:** `src/presentation/pages/Tenders/TendersPage.tsx`

**التغيير:**

```typescript
// ❌ القديم
import { computeTenderSummary } from '@/shared/utils/tender/tenderSummaryCalculator'
const summary = useMemo(
  () => computeTenderSummary(tenders, tenderMetrics, tenderPerformance),
  [tenders, tenderMetrics, tenderPerformance],
)

// ✅ الجديد
import {
  selectActiveNonExpiredCount,
  selectExpiredTendersCount,
  selectUrgentTendersCount,
} from '@/domain/selectors/tenderSelectors'

const summary = useMemo(
  () => ({
    total: tenders.length,
    activeNonExpired: selectActiveNonExpiredCount(tenders),
    expired: selectExpiredTendersCount(tenders),
    urgent: selectUrgentTendersCount(tenders),
    // ... باقي الحسابات
  }),
  [tenders],
)
```

**التأثير:** حذف استدعاء `computeTenderSummary`

---

## 🗑️ الخطوة 8: حذف الملفات المكررة

بعد استبدال جميع الاستدعاءات، سيتم حذف:

```bash
# 1. حذف calculateTenderStats الأصلي
git rm src/calculations/tender.ts

# 2. حذف النسخ المكررة
git rm src/utils/unifiedCalculations.ts
git rm src/shared/utils/pricing/unifiedCalculations.ts

# 3. حذف computeTenderSummary
git rm src/shared/utils/tender/tenderSummaryCalculator.ts

# 4. نقل isTenderExpired (تم بالفعل إلى tenderSelectors)
# الاحتفاظ بـ tenderProgressCalculator للدوال الأخرى فقط
```

---

## 📚 الخطوة 9: تحديث معمارية النظام

**الحالة:** جاهز للتنفيذ  
**الملف:** `docs/TENDER_SYSTEM_ARCHITECTURE.md`

**المطلوب:**

- تحديث البنية المعمارية لتعكس Domain Layer الموحد
- توثيق tenderSelectors.ts كمصدر واحد للحقيقة
- توضيح العلاقة بين Domain Layer و Application Layer
- إضافة مخطط التدفق الجديد

---

## ✅ الخطوة 10: تحديث الاختبارات

**الملف:** `tests/calculations/tenderStats.test.ts`

**التغيير:**

```typescript
// ❌ القديم
import { calculateTenderStats } from '@/calculations/tender'

// ✅ الجديد
import { selectAllTenderCalculations } from '@/domain/selectors/tenderSelectors'
```

---

## 🧪 الخطوة 11: الاختبار والتحقق

```bash
# 1. فحص أخطاء TypeScript
npm run type-check

# 2. تشغيل الاختبارات
npm run test

# 3. بناء التطبيق
npm run build

# 4. اختبار يدوي
npm run electron
```

---

## 📊 الفوائد المتوقعة

### قبل التوحيد:

```
❌ 3 نسخ من calculateTenderStats
❌ 2 طرق مختلفة لحساب نفس الإحصائيات
❌ isTenderExpired في Utility Layer
❌ استدعاءات مباشرة من المكونات
❌ صعوبة الصيانة والتحديث
```

### بعد التوحيد:

```
✅ مصدر واحد للحقيقة (tenderSelectors.ts)
✅ جميع الدوال في Domain Layer
✅ hook موحد (useTenders)
✅ سهولة الاختبار والصيانة
✅ تطبيق Clean Architecture
✅ حذف 500+ سطر كود مكرر
```

---

## 🎯 النتيجة النهائية

**البنية بعد التوحيد:**

```
✅ Domain Layer
   └── tenderSelectors.ts (380+ سطر - مصدر واحد للحقيقة)

✅ Application Layer
   ├── TenderAnalyticsService.ts (للتحليلات المتقدمة)
   └── hooks/useTenders.ts (واجهة موحدة للمكونات)

✅ Presentation Layer
   └── جميع المكونات تستخدم useTenders فقط

❌ المحذوفات
   ├── calculations/tender.ts
   ├── utils/unifiedCalculations.ts
   ├── shared/utils/pricing/unifiedCalculations.ts
   └── shared/utils/tender/tenderSummaryCalculator.ts
```

---

## 📝 ملاحظات هامة

1. **الأولوية:** استبدال الاستدعاءات أولاً، ثم الحذف
2. **الاختبار:** بعد كل خطوة، تأكد من عدم وجود أخطاء
3. **Git Commits:** commit بعد كل خطوة مكتملة
4. **التوثيق:** تحديث TENDER_SYSTEM_ENHANCEMENT_TRACKER.md في النهاية

---

## ⏱️ الوقت المتوقع

| الخطوة                          | الوقت                   |
| ------------------------------- | ----------------------- |
| ✅ 1. تحديث tenderSelectors     | مكتمل                   |
| 2. تحسين useTenders             | 15 دقيقة                |
| 3-6. استبدال المكونات (4 ملفات) | 30 دقيقة                |
| 7. استبدال TendersPage          | 20 دقيقة                |
| 8. حذف الملفات المكررة          | 5 دقائق                 |
| 9. تحديث معمارية النظام         | 10 دقائق                |
| 10. تحديث الاختبارات            | 10 دقائق                |
| 11. الاختبار والتحقق            | 20 دقيقة                |
| **المجموع**                     | **110 دقيقة (~2 ساعة)** |

---

**جاهز للبدء في الخطوة 2؟**
