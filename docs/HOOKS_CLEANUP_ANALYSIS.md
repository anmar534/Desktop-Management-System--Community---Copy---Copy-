# 📊 تحليل تنظيف src/hooks/

**التاريخ**: 2025-10-21  
**المرحلة**: 2.8-2.13 - تنظيف src/hooks/  
**الحالة**: 🔄 قيد التنفيذ

---

## 📁 الملفات الموجودة في src/hooks/

### ✅ ملفات Proxy (يجب الاحتفاظ بها مؤقتاً)

#### 1. **index.ts**
- **الحالة**: proxy يعيد تصدير من `@/application/hooks`
- **المحتوى**: `export * from '@/application/hooks'`
- **الإجراء**: ✅ الاحتفاظ به للتوافق مع الإصدارات السابقة
- **الأولوية**: 🟢 منخفضة

#### 2. **useCentralData.ts**
- **الحالة**: proxy يعيد تصدير من `@/application/hooks/useCentralData`
- **المحتوى**: `export * from '@/application/hooks/useCentralData'`
- **الإجراء**: ✅ الاحتفاظ به (الخطاف الأصلي deprecated)
- **الأولوية**: 🟢 منخفضة

#### 3. **useSystemData.ts**
- **الحالة**: proxy يعيد تصدير من `@/application/hooks/useSystemData`
- **المحتوى**: `export { useSystemData } from '@/application/hooks/useSystemData'`
- **الإجراء**: ✅ الاحتفاظ به
- **الأولوية**: 🟢 منخفضة

#### 4. **useAuditLog.ts**
- **الحالة**: proxy يعيد تصدير من `@/application/hooks/useAuditLog`
- **المحتوى**: `export * from '@/application/hooks/useAuditLog'`
- **الإجراء**: ✅ الاحتفاظ به
- **الأولوية**: 🟢 منخفضة

---

### 🔴 خطافات نشطة (يجب نقلها إلى src/application/hooks/)

#### 5. **useEnhancedKPIs.ts** (478 سطر)
- **الحالة**: نشط ومستخدم
- **الاستخدام**: `src/components/analytics/CompetitiveAnalyticsBoard.tsx`
- **التبعيات**: 
  - `useFinancialState` من `@/application/context`
  - `AggregatedFinancialMetrics` من `@/domain/selectors/financialMetrics`
  - أيقونات من `lucide-react`
- **الإجراء**: نقل إلى `src/application/hooks/useEnhancedKPIs.ts`
- **الأولوية**: 🔴 عالية

#### 6. **useDashboardAlerts.ts** (357 سطر)
- **الحالة**: نشط ومستخدم
- **الاستخدام**: `src/components/analytics/CompetitiveAnalyticsBoard.tsx`
- **التبعيات**:
  - `useFinancialState` من `@/application/context`
  - `AggregatedFinancialMetrics`, `FinancialHighlights` من `@/domain/selectors/financialMetrics`
  - `Activity`, `Alert` من `@/components/analytics/enhanced`
- **الإجراء**: نقل إلى `src/application/hooks/useDashboardAlerts.ts`
- **الأولوية**: 🔴 عالية

---

### ⚠️ خطافات مكررة (موجودة في src/application/hooks/)

#### 7. **useBOQ.ts**
- **الحالة**: ❌ مكرر - موجود في `src/application/hooks/useBOQ.ts`
- **الإجراء**: حذف من `src/hooks/` (استخدام النسخة في `src/application/hooks/`)
- **الأولوية**: 🔴 عالية

#### 8. **useProjectBOQ.ts**
- **الحالة**: ❌ مكرر - موجود في `src/application/hooks/useProjectBOQ.ts`
- **الإجراء**: حذف من `src/hooks/` (استخدام النسخة في `src/application/hooks/`)
- **الأولوية**: 🔴 عالية

#### 9. **useExpenses.ts**
- **الحالة**: ❌ مكرر - موجود في `src/application/hooks/useExpenses.ts`
- **الإجراء**: حذف من `src/hooks/` (استخدام النسخة في `src/application/hooks/`)
- **الأولوية**: 🔴 عالية

#### 10. **useProjects.ts**
- **الحالة**: ❌ مكرر - موجود في `src/application/hooks/useProjects.ts`
- **الإجراء**: حذف من `src/hooks/` (استخدام النسخة في `src/application/hooks/`)
- **الأولوية**: 🔴 عالية

#### 11. **useTenders.ts**
- **الحالة**: ❌ مكرر - موجود في `src/application/hooks/useTenders.ts`
- **الإجراء**: حذف من `src/hooks/` (استخدام النسخة في `src/application/hooks/`)
- **الأولوية**: 🔴 عالية

---

## 📋 خطة التنفيذ

### المرحلة 1: نقل الخطافات النشطة (1-2 ساعة)

```bash
# 1. نقل useEnhancedKPIs
git mv src/hooks/useEnhancedKPIs.ts src/application/hooks/useEnhancedKPIs.ts

# 2. نقل useDashboardAlerts
git mv src/hooks/useDashboardAlerts.ts src/application/hooks/useDashboardAlerts.ts

# 3. تحديث index.ts في src/application/hooks/
# إضافة:
# export { useEnhancedKPIs } from './useEnhancedKPIs'
# export { useDashboardAlerts } from './useDashboardAlerts'
```

### المرحلة 2: تحديث الاستيرادات (30 دقيقة)

```bash
# البحث عن جميع الاستيرادات من src/hooks/useEnhancedKPIs
# تحديثها إلى @/application/hooks/useEnhancedKPIs

# الملفات المتأثرة:
# - src/components/analytics/CompetitiveAnalyticsBoard.tsx
```

### المرحلة 3: حذف الخطافات المكررة (30 دقيقة)

```bash
# حذف الخطافات المكررة
git rm src/hooks/useBOQ.ts
git rm src/hooks/useProjectBOQ.ts
git rm src/hooks/useExpenses.ts
git rm src/hooks/useProjects.ts
git rm src/hooks/useTenders.ts
```

### المرحلة 4: فحص TypeScript واختبار النظام (30 دقيقة)

```bash
# فحص TypeScript
npx tsc --noEmit

# اختبار النظام
npm run dev
```

### المرحلة 5: إنشاء commit نهائي (15 دقيقة)

```bash
git commit -m "refactor: تنظيف src/hooks/ - نقل وحذف الخطافات المكررة"
```

---

## 🔍 الملفات المتأثرة (تحتاج تحديث الاستيرادات)

### استيرادات useEnhancedKPIs

- `src/components/analytics/CompetitiveAnalyticsBoard.tsx` (سطر 11)

### استيرادات useDashboardAlerts

- `src/components/analytics/CompetitiveAnalyticsBoard.tsx` (سطر 12)

---

## ✅ معايير النجاح

- [ ] جميع الخطافات النشطة منقولة إلى `src/application/hooks/`
- [ ] جميع الخطافات المكررة محذوفة
- [ ] جميع الاستيرادات محدثة
- [ ] `npx tsc --noEmit` يعمل بدون أخطاء جديدة
- [ ] `npm run dev` يعمل بنجاح
- [ ] commits منظمة

---

## 📊 الإحصائيات المتوقعة

- **عدد الخطافات المنقولة**: 2 خطاف (useEnhancedKPIs, useDashboardAlerts)
- **عدد الخطافات المحذوفة**: 5 خطافات (useBOQ, useProjectBOQ, useExpenses, useProjects, useTenders)
- **عدد الخطافات Proxy المحتفظ بها**: 4 خطافات (index.ts, useCentralData, useSystemData, useAuditLog)
- **عدد الملفات المتأثرة**: 1 ملف (CompetitiveAnalyticsBoard.tsx)
- **الوقت المتوقع**: 2-3 ساعات
- **عدد الـ commits**: 1 commit

---

## 📝 ملاحظات مهمة

### لماذا نحتفظ بملفات Proxy؟

الملفات الأربعة (index.ts, useCentralData, useSystemData, useAuditLog) هي ملفات proxy تعيد التصدير من `src/application/hooks/`. نحتفظ بها للأسباب التالية:

1. **التوافق مع الإصدارات السابقة**: بعض المكونات قد تستورد من `@/hooks/` بدلاً من `@/application/hooks/`
2. **تقليل التغييرات**: تجنب تحديث مئات الاستيرادات في وقت واحد
3. **الانتقال التدريجي**: يمكن حذفها لاحقاً بعد التأكد من عدم استخدامها

### الخطافات المكررة

الخطافات الخمسة (useBOQ, useProjectBOQ, useExpenses, useProjects, useTenders) موجودة في كلا الموقعين:
- `src/hooks/` (نسخة قديمة)
- `src/application/hooks/` (نسخة جديدة ونشطة)

يجب حذف النسخ القديمة من `src/hooks/` لأن:
1. جميع الاستيرادات تستخدم النسخ من `src/application/hooks/`
2. ملف `src/hooks/index.ts` يعيد التصدير من `src/application/hooks/` بالفعل
3. الاحتفاظ بنسختين يسبب ارتباكاً

---

**آخر تحديث**: 2025-10-21  
**الحالة**: جاهز للتنفيذ

