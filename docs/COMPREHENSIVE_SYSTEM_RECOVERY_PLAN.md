# 📋 خطة الإصلاح الشاملة لجميع صفحات النظام (محدّثة)

## 📊 ملخص تنفيذي

بعد تنفيذ خطة إعادة هيكلة النظام (15 commits)، تم رصد **368 ملف محذوف** و**استيرادات مكسورة** في عدة صفحات. هذه الخطة توفر **استراتيجية شاملة** لإصلاح جميع المشاكل مع الحفاظ على الهيكل الجديد.

### 🔍 اكتشاف مهم بعد التحليل الشامل

**النتيجة الرئيسية:**
- ✅ **جميع الصفحات الرئيسية موجودة** (0 صفحة محذوفة)
- ✅ **جميع المكونات الأساسية موجودة** (EnhancedTenderCard, TenderDetails, TenderPricingProcess)
- ❌ **الخدمات المطلوبة مفقودة** (106 خدمة محذوفة)
- ❌ **الاستيرادات مكسورة** (20+ موقع يستورد من `@/services/` القديم)

**الخلاصة:** المشكلة ليست في الصفحات أو المكونات، بل في:
1. **الخدمات المحذوفة** (106 خدمة)
2. **الاستيرادات المكسورة** (تشير إلى مسارات قديمة)
3. **Utils والخطافات المحذوفة** (36 utils + 10 hooks)

---

## 🎯 نطاق العمل

### الصفحات المتأثرة (جميع صفحات النظام)

| # | الصفحة | الحالة | الملفات الموجودة | الاستيرادات المكسورة | الأولوية |
|---|--------|--------|------------------|---------------------|----------|
| 1 | **لوحة التحكم** (Dashboard) | ✅ تعمل جزئياً | DashboardPage.tsx ✅ | 0 | 🔴 عالية |
| 2 | **المنافسات** (Tenders) | ✅ تعمل جزئياً | TendersPage.tsx ✅<br>TenderDetailsPage.tsx ✅<br>TenderPricingPage.tsx ✅<br>EnhancedTenderCard.tsx ✅ | 0 (لكن تحتاج خدمات) | 🔴 عالية |
| 3 | **المشاريع** (Projects) | ✅ تعمل جزئياً | ProjectsPage.tsx ✅ | 0 | 🔴 عالية |
| 4 | **المالية** (Financial) | ❌ مكسورة | FinancialPage.tsx ✅ | 13 ملف | 🔴 عالية جداً |
| 5 | **التقارير** (Reports) | ⚠️ غير مختبرة | ReportsPage.tsx ✅ | ؟ | 🟡 متوسطة |
| 6 | **الإعدادات** (Settings) | ⚠️ غير مختبرة | SettingsPage.tsx ✅ | ؟ | 🟡 متوسطة |
| 7 | **التطوير** (Development) | ⚠️ غير مختبرة | DevelopmentPage.tsx ✅ | ؟ | 🟢 منخفضة |
| 8 | **العملاء** (Clients) | ⚠️ غير مختبرة | - | ؟ | 🟡 متوسطة |

---

## 📈 إحصائيات الملفات المحذوفة

### التوزيع حسب النوع

```
إجمالي الملفات المحذوفة: 368 ملف

التوزيع:
├── Services (خدمات)         : 106 ملف (29%) ❌ حرج
├── Tests (اختبارات)         : 126 ملف (34%) 🟢 منخفض
├── Docs (توثيق)             : 72 ملف (20%) 🟢 منخفض
├── Utils (أدوات)            : 36 ملف (10%) ⚠️ متوسط
├── Components (مكونات)      : 40 ملف (11%) ⚠️ متوسط
├── Hooks (خطافات)           : 10 ملف (3%) ⚠️ متوسط
├── Pages (صفحات)            : 0 ملف (0%) ✅ جميعها موجودة
└── Other (أخرى)             : 63 ملف (17%)
```

### 🔍 تحليل المكونات والصفحات

#### ✅ الصفحات الموجودة (جميعها)

**صفحات المنافسات:**
- ✅ `src/presentation/pages/Tenders/TendersPage.tsx` - صفحة قائمة المنافسات
- ✅ `src/presentation/pages/Tenders/TenderDetailsPage.tsx` - صفحة تفاصيل المنافسة
- ✅ `src/presentation/pages/Tenders/TenderPricingPage.tsx` - صفحة التسعير

**مكونات المنافسات:**
- ✅ `src/presentation/components/tenders/EnhancedTenderCard.tsx` - بطاقة عرض المنافسة
- ✅ `src/presentation/components/tenders/TenderDetails.tsx` - تفاصيل المنافسة
- ✅ `src/presentation/pages/Tenders/components/TenderPricingProcess.tsx` - معالج التسعير
- ✅ `src/presentation/pages/Tenders/components/TenderStatusManager.tsx` - إدارة الحالة
- ✅ `src/presentation/pages/Tenders/components/TenderResultsManager.tsx` - إدارة النتائج

**صفحات أخرى:**
- ✅ `src/presentation/pages/Dashboard/DashboardPage.tsx`
- ✅ `src/presentation/pages/Projects/ProjectsPage.tsx`
- ✅ `src/presentation/pages/Financial/FinancialPage.tsx`
- ✅ `src/presentation/pages/Reports/ReportsPage.tsx` (افتراضي)
- ✅ `src/presentation/pages/Settings/SettingsPage.tsx` (افتراضي)

**الخلاصة:** ✅ جميع الصفحات والمكونات الأساسية موجودة!

#### ⚠️ المكونات المحذوفة (40 مكون)

**تحليل المكونات المحذوفة:**
- 🟢 **Prototypes** (5 مكونات) - نماذج أولية قديمة غير مستخدمة
- 🟢 **Tests** (35 مكون اختبار) - اختبارات للمكونات
- ❌ **AI Components** (2 مكون) - قد تكون مستخدمة:
  - `src/components/ai/MachineLearningPricing.tsx`
  - `src/components/ai/NaturalLanguageProcessing.tsx`

**الخلاصة:** المكونات الأساسية موجودة، والمحذوفة معظمها نماذج أولية أو اختبارات.

### الملفات الحرجة المحذوفة

#### 1. ملفات أساسية (تم استعادتها جزئياً)
- ✅ `src/App.tsx` - **تم استعادته** (commit 7ea2bd3)
- ✅ `src/application/services/pricingEngine.ts` - **تم استعادته** (commit c988e09)
- ❌ `src/shared/utils/formatters.ts` - **محذوف** (موجود في formatters/formatters.ts)
- ❌ `src/shared/utils/storage.ts` - **محذوف** (موجود في storage/storage.ts)
- ❌ `src/shared/utils/secureStore.ts` - **محذوف** (موجود في security/secureStore.ts)

#### 2. خدمات محذوفة (106 خدمة)
**خدمات مالية (Financial Services):**
- ❌ `src/services/financialAnalyticsService.ts`
- ❌ `src/services/financialStatementsService.ts`
- ❌ `src/services/paymentsReceivablesService.ts`
- ❌ `src/services/profitabilityAnalysisService.ts`
- ❌ `src/services/saudiTaxService.ts`
- ❌ `src/services/financialIntegrationService.ts`

**خدمات تنافسية (Competitive Services):**
- ❌ `src/services/bidComparisonService.ts`
- ❌ `src/services/competitorDatabaseService.ts`
- ❌ `src/services/decisionSupportService.ts`
- ❌ `src/services/marketIntelligenceService.ts`

**خدمات أخرى:**
- ❌ `src/services/earnedValueCalculator.ts`
- ❌ `src/services/qualityAssuranceService.ts`
- ❌ `src/services/riskAssessmentService.ts`
- ❌ `src/services/schedulingService.ts`
- ❌ `src/services/taskManagementService.ts`
- ❌ `src/services/templateService.ts`
- ❌ `src/services/workflowAutomationService.ts`
- ... و89 خدمة أخرى

#### 3. خطافات محذوفة (10 hooks)
- ❌ `src/hooks/useBOQ.ts`
- ❌ `src/hooks/useExpenses.ts`
- ❌ `src/hooks/useProjectBOQ.ts`
- ❌ `src/hooks/useProjects.ts`
- ❌ `src/hooks/useTenders.ts`
- ❌ `src/hooks/useCurrencyFormatter.ts` (تم إعادة إنشائه)
- ❌ `src/hooks/useDashboardAlerts.ts`
- ❌ `src/hooks/useEnhancedKPIs.ts`
- ❌ `src/hooks/useEventListener.ts`
- ❌ `src/hooks/useKeyboardShortcuts.ts`

#### 4. أدوات محذوفة (36 utils)
من `src/utils/` (18 ملف):
- ❌ `analyticsUtils.ts`
- ❌ `backupManager.ts`
- ❌ `buttonStyles.ts`
- ❌ `cn.ts`
- ❌ `defaultPercentagesPropagation.ts`
- ❌ `desktopSecurity.ts`
- ❌ `excelProcessor.ts`
- ❌ `exporters.ts`
- ❌ `fileUploadService.ts`
- ❌ `formatters.ts`
- ❌ `helpers.ts`
- ❌ `index.ts`
- ❌ `normalizePricing.ts`
- ❌ `pricingHelpers.ts`
- ❌ `statusColors.ts`
- ❌ `storage.ts`
- ❌ `tenderNotifications.ts`
- ❌ `tenderProgressCalculator.ts`

من `src/shared/utils/` (4 ملفات):
- ❌ `formatters.ts`
- ❌ `secureStore.ts`
- ❌ `storage.ts`
- ❌ `storage/auditLog.ts`

---

## 🔍 تحليل الاستيرادات المكسورة

### 1. استيرادات من `@/services/` (قديمة - 20+ موقع)

**الملفات المتأثرة:**

| الملف | الاستيراد المكسور | الحالة |
|------|-------------------|--------|
| `BidComparison.tsx` | `@/services/bidComparisonService` | ❌ مكسور |
| `CompetitorDatabase.tsx` | `@/services/competitorDatabaseService` | ❌ مكسور |
| `DecisionSupport.tsx` | `@/services/decisionSupportService` | ❌ مكسور |
| `MarketIntelligence.tsx` | `@/services/marketIntelligenceService` | ❌ مكسور |
| `EVMDashboard.tsx` | `@/services/earnedValueCalculator` | ❌ مكسور |
| `BalanceSheet.tsx` | `@/services/financialStatementsService` | ❌ مكسور |
| `FinancialAnalytics.tsx` | `@/services/financialAnalyticsService` | ❌ مكسور |
| `FinancialIntegration.tsx` | `@/services/financialIntegrationService` | ❌ مكسور |
| `IncomeStatement.tsx` | `@/services/financialStatementsService` | ❌ مكسور |
| `PaymentsReceivables.tsx` | `@/services/paymentsReceivablesService` | ❌ مكسور |
| `ProfitabilityAnalysis.tsx` | `@/services/profitabilityAnalysisService` | ❌ مكسور |
| `ProfitabilityComparison.tsx` | `@/services/profitabilityAnalysisService` | ❌ مكسور |
| `SaudiTaxReports.tsx` | `@/services/saudiTaxService` | ❌ مكسور |

### 2. استيرادات من `@/utils/` (قديمة - 0 موقع)
✅ **تم إصلاحها جميعاً** في commits سابقة

---

## 🎯 استراتيجية الإصلاح

### المبادئ الأساسية

1. ✅ **الحفاظ على الهيكل الجديد**: عدم التراجع عن Clean Architecture
2. ✅ **استعادة من Git**: استرجاع الملفات المحذوفة من تاريخ Git
3. ✅ **وضع في المواقع الصحيحة**: نقل الملفات المستعادة إلى المواقع الجديدة
4. ✅ **تحديث الاستيرادات**: تحديث جميع المسارات للهيكل الجديد
5. ✅ **اختبار شامل**: التحقق من عمل جميع الصفحات

### الأولويات

**🔴 أولوية عالية (Critical):**
- استعادة الخدمات المالية (13 خدمة)
- استعادة الخدمات التنافسية (4 خدمات)
- إصلاح استيرادات صفحة المالية
- إصلاح استيرادات المكونات التنافسية

**🟡 أولوية متوسطة (High):**
- استعادة باقي الخدمات (89 خدمة)
- استعادة الخطافات المحذوفة (10 hooks)
- اختبار جميع الصفحات

**🟢 أولوية منخفضة (Medium):**
- استعادة الاختبارات (126 test)
- استعادة التوثيق (72 doc)

---

## 📋 المرحلة 1: التحليل والفحص الشامل
**⏱️ الوقت المتوقع: 30-60 دقيقة**

### 1.1 فحص Git History للملفات المحذوفة

**الأوامر المقترحة:**

```powershell
# 1. قائمة كاملة بجميع الملفات المحذوفة
git log --diff-filter=D --summary --oneline -15 | Select-String "delete mode" > deleted_files_list.txt

# 2. فحص تفصيلي للخدمات المحذوفة
git log --diff-filter=D --summary --oneline -15 | Select-String "delete mode.*services/" > deleted_services.txt

# 3. فحص الخطافات المحذوفة
git log --diff-filter=D --summary --oneline -15 | Select-String "delete mode.*hooks/" > deleted_hooks.txt

# 4. فحص الأدوات المحذوفة
git log --diff-filter=D --summary --oneline -15 | Select-String "delete mode.*utils/" > deleted_utils.txt
```

### 1.2 تحديد آخر commit قبل الحذف

**الأوامر المقترحة:**

```powershell
# للخدمات المالية
git log --all --full-history -- "src/services/financialAnalyticsService.ts"
git log --all --full-history -- "src/services/saudiTaxService.ts"

# للخدمات التنافسية
git log --all --full-history -- "src/services/bidComparisonService.ts"
git log --all --full-history -- "src/services/marketIntelligenceService.ts"
```

### 1.3 فحص الاستيرادات المكسورة في كل صفحة

**الأوامر المقترحة:**

```powershell
# فحص صفحة المالية
Get-Content "src/presentation/pages/Financial/FinancialPage.tsx" | Select-String "from ['\`"]@/"

# فحص مكونات المالية
Get-ChildItem -Path "src/presentation/pages/Financial/components" -Filter "*.tsx" -Recurse | ForEach-Object {
    Write-Output "`n=== $($_.Name) ==="
    Get-Content $_.FullName | Select-String "from ['\`"]@/services/"
}

# فحص المكونات التنافسية
Get-ChildItem -Path "src/presentation/components/competitive" -Filter "*.tsx" | ForEach-Object {
    Write-Output "`n=== $($_.Name) ==="
    Get-Content $_.FullName | Select-String "from ['\`"]@/services/"
}
```

### 1.4 إنشاء تقرير تحليلي

**المخرجات المطلوبة:**
- ✅ قائمة كاملة بالملفات المحذوفة (368 ملف)
- ✅ قائمة بالخدمات المطلوب استعادتها (106 خدمة)
- ✅ قائمة بالاستيرادات المكسورة (20+ موقع)
- ✅ خريطة للملفات: من أين → إلى أين

---

## 📋 المرحلة 2: استعادة الملفات المحذوفة
**⏱️ الوقت المتوقع: 2-3 ساعات**

### 2.1 استعادة الخدمات المالية (🔴 أولوية عالية)

**الخطوات:**

```powershell
# 1. تحديد آخر commit قبل الحذف
$lastCommit = git log --all --full-history -1 --pretty=format:"%H" -- "src/services/financialAnalyticsService.ts"

# 2. استعادة الملف
git show $lastCommit:src/services/financialAnalyticsService.ts > temp_financialAnalyticsService.ts

# 3. نقل إلى الموقع الجديد
Move-Item temp_financialAnalyticsService.ts src/application/services/financialAnalyticsService.ts

# 4. تحديث الاستيرادات داخل الملف
# (يدوياً أو باستخدام str-replace-editor)
```

**قائمة الخدمات المالية للاستعادة:**

| # | الخدمة | الموقع القديم | الموقع الجديد | الأولوية |
|---|--------|---------------|---------------|----------|
| 1 | `financialAnalyticsService.ts` | `src/services/` | `src/application/services/` | 🔴 |
| 2 | `financialStatementsService.ts` | `src/services/` | `src/application/services/` | 🔴 |
| 3 | `paymentsReceivablesService.ts` | `src/services/` | `src/application/services/` | 🔴 |
| 4 | `profitabilityAnalysisService.ts` | `src/services/` | `src/application/services/` | 🔴 |
| 5 | `saudiTaxService.ts` | `src/services/` | `src/application/services/` | 🔴 |
| 6 | `financialIntegrationService.ts` | `src/services/` | `src/application/services/` | 🔴 |

### 2.2 استعادة الخدمات التنافسية (🔴 أولوية عالية)

**قائمة الخدمات:**

| # | الخدمة | الموقع القديم | الموقع الجديد | الأولوية |
|---|--------|---------------|---------------|----------|
| 1 | `bidComparisonService.ts` | `src/services/` | `src/application/services/` | 🔴 |
| 2 | `competitorDatabaseService.ts` | `src/services/` | `src/application/services/` | 🔴 |
| 3 | `decisionSupportService.ts` | `src/services/` | `src/application/services/` | 🔴 |
| 4 | `marketIntelligenceService.ts` | `src/services/` | `src/application/services/` | 🔴 |

### 2.3 استعادة الخدمات الأخرى (🟡 أولوية متوسطة)

**قائمة الخدمات (عينة):**

| # | الخدمة | الموقع الجديد | الأولوية |
|---|--------|---------------|----------|
| 1 | `earnedValueCalculator.ts` | `src/application/services/` | 🟡 |
| 2 | `qualityAssuranceService.ts` | `src/application/services/` | 🟡 |
| 3 | `riskAssessmentService.ts` | `src/application/services/` | 🟡 |
| 4 | `schedulingService.ts` | `src/application/services/` | 🟡 |
| 5 | `taskManagementService.ts` | `src/application/services/` | 🟡 |
| ... | ... (84 خدمة أخرى) | ... | 🟡 |

### 2.4 استعادة الخطافات المحذوفة (🟡 أولوية متوسطة)

**قائمة الخطافات:**

| # | الخطاف | الموقع القديم | الموقع الجديد | الحالة |
|---|--------|---------------|---------------|--------|
| 1 | `useBOQ.ts` | `src/hooks/` | `src/application/hooks/` | ❌ محذوف |
| 2 | `useExpenses.ts` | `src/hooks/` | `src/application/hooks/` | ❌ محذوف |
| 3 | `useProjectBOQ.ts` | `src/hooks/` | `src/application/hooks/` | ❌ محذوف |
| 4 | `useProjects.ts` | `src/hooks/` | `src/application/hooks/` | ❌ محذوف |
| 5 | `useTenders.ts` | `src/hooks/` | `src/application/hooks/` | ❌ محذوف |
| 6 | `useCurrencyFormatter.ts` | `src/hooks/` | `src/application/hooks/` | ✅ تم إعادة إنشائه |
| 7 | `useDashboardAlerts.ts` | `src/hooks/` | `src/application/hooks/` | ❌ محذوف |
| 8 | `useEnhancedKPIs.ts` | `src/hooks/` | `src/application/hooks/` | ❌ محذوف |
| 9 | `useEventListener.ts` | `src/hooks/` | `src/application/hooks/` | ❌ محذوف |
| 10 | `useKeyboardShortcuts.ts` | `src/hooks/` | `src/application/hooks/` | ❌ محذوف |

**ملاحظة:** معظم هذه الخطافات قد لا تكون مستخدمة حالياً، لكن يُفضل استعادتها للحفاظ على الوظائف الكاملة.

---

## 📋 المرحلة 3: إصلاح الاستيرادات
**⏱️ الوقت المتوقع: 1-2 ساعة**

### 3.1 إصلاح استيرادات المكونات المالية

**الملفات المتأثرة (13 ملف):**

#### 1. `BalanceSheet.tsx`

**الاستيراد المكسور:**
```typescript
import { financialStatementsService, type BalanceSheet as BalanceSheetType } from '@/services/financialStatementsService'
```

**الاستيراد الصحيح:**
```typescript
import { financialStatementsService, type BalanceSheet as BalanceSheetType } from '@/application/services/financialStatementsService'
```

#### 2. `FinancialAnalytics.tsx`

**الاستيراد المكسور:**
```typescript
import { ... } from '@/services/financialAnalyticsService'
```

**الاستيراد الصحيح:**
```typescript
import { ... } from '@/application/services/financialAnalyticsService'
```

#### 3. `FinancialIntegration.tsx`

**الاستيراد المكسور:**
```typescript
import type { IntegrationSettings, SyncResult } from '@/services/financialIntegrationService'
import { FinancialIntegrationService } from '@/services/financialIntegrationService'
```

**الاستيراد الصحيح:**
```typescript
import type { IntegrationSettings, SyncResult } from '@/application/services/financialIntegrationService'
import { FinancialIntegrationService } from '@/application/services/financialIntegrationService'
```

#### 4. `IncomeStatement.tsx`

**الاستيراد المكسور:**
```typescript
import { financialStatementsService, type IncomeStatement as IncomeStatementType } from '@/services/financialStatementsService'
```

**الاستيراد الصحيح:**
```typescript
import { financialStatementsService, type IncomeStatement as IncomeStatementType } from '@/application/services/financialStatementsService'
```

#### 5. `PaymentsReceivables.tsx`

**الاستيراد المكسور:**
```typescript
import { ... } from '@/services/paymentsReceivablesService'
```

**الاستيراد الصحيح:**
```typescript
import { ... } from '@/application/services/paymentsReceivablesService'
```

#### 6. `ProfitabilityAnalysis.tsx`

**الاستيراد المكسور:**
```typescript
import type { ProjectProfitability, ClientProfitability } from '@/services/profitabilityAnalysisService'
import { ProfitabilityAnalysisService } from '@/services/profitabilityAnalysisService'
```

**الاستيراد الصحيح:**
```typescript
import type { ProjectProfitability, ClientProfitability } from '@/application/services/profitabilityAnalysisService'
import { ProfitabilityAnalysisService } from '@/application/services/profitabilityAnalysisService'
```

#### 7. `ProfitabilityComparison.tsx`

**الاستيراد المكسور:**
```typescript
import type { ProfitabilityComparison } from '@/services/profitabilityAnalysisService'
import { ProfitabilityAnalysisService } from '@/services/profitabilityAnalysisService'
```

**الاستيراد الصحيح:**
```typescript
import type { ProfitabilityComparison } from '@/application/services/profitabilityAnalysisService'
import { ProfitabilityAnalysisService } from '@/application/services/profitabilityAnalysisService'
```

#### 8. `SaudiTaxReports.tsx`

**الاستيراد المكسور:**
```typescript
import type { VATReturn, VATTransaction, ZakatCalculation, TaxSettings } from '@/services/saudiTaxService'
import { SaudiTaxService } from '@/services/saudiTaxService'
```

**الاستيراد الصحيح:**
```typescript
import type { VATReturn, VATTransaction, ZakatCalculation, TaxSettings } from '@/application/services/saudiTaxService'
import { SaudiTaxService } from '@/application/services/saudiTaxService'
```

### 3.2 إصلاح استيرادات المكونات التنافسية

**الملفات المتأثرة (4 ملفات):**

#### 1. `BidComparison.tsx`

**الاستيراد المكسور:**
```typescript
import type { BidComparison as BidComparisonType, ComparisonResult, CompetitiveGapAnalysis, PositioningRecommendation } from '@/services/bidComparisonService'
import { bidComparisonService } from '@/services/bidComparisonService'
```

**الاستيراد الصحيح:**
```typescript
import type { BidComparison as BidComparisonType, ComparisonResult, CompetitiveGapAnalysis, PositioningRecommendation } from '@/application/services/bidComparisonService'
import { bidComparisonService } from '@/application/services/bidComparisonService'
```

#### 2. `CompetitorDatabase.tsx`

**الاستيراد المكسور:**
```typescript
import { competitorDatabaseService } from '@/services/competitorDatabaseService'
```

**الاستيراد الصحيح:**
```typescript
import { competitorDatabaseService } from '@/application/services/competitorDatabaseService'
```

#### 3. `DecisionSupport.tsx`

**الاستيراد المكسور:**
```typescript
import { decisionSupportService } from '@/services/decisionSupportService'
```

**الاستيراد الصحيح:**
```typescript
import { decisionSupportService } from '@/application/services/decisionSupportService'
```

#### 4. `MarketIntelligence.tsx`

**الاستيراد المكسور:**
```typescript
import { ... } from '@/services/marketIntelligenceService'
```

**الاستيراد الصحيح:**
```typescript
import { ... } from '@/application/services/marketIntelligenceService'
```

### 3.3 إصلاح استيرادات المكونات الأخرى

#### 1. `EVMDashboard.tsx`

**الاستيراد المكسور:**
```typescript
import { earnedValueCalculator } from '@/services/earnedValueCalculator'
```

**الاستيراد الصحيح:**
```typescript
import { earnedValueCalculator } from '@/application/services/earnedValueCalculator'
```

### 3.4 استراتيجية التحديث الآلي

**أمر PowerShell للتحديث الجماعي:**

```powershell
# تحديث جميع استيرادات @/services/ إلى @/application/services/
Get-ChildItem -Path "src" -Recurse -Include "*.ts","*.tsx" -File | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $updated = $content -replace "from ['\`"]@/services/", "from '@/application/services/"

    if ($content -ne $updated) {
        Set-Content -Path $_.FullName -Value $updated -NoNewline
        Write-Output "✅ Updated: $($_.Name)"
    }
}
```

---

## 📋 المرحلة 4: الاختبار والتحقق
**⏱️ الوقت المتوقع: 1-2 ساعة**

### 4.1 اختبار TypeScript

**الأوامر:**

```powershell
# فحص TypeScript للأخطاء
npx tsc --noEmit

# عد الأخطاء حسب النوع
npx tsc --noEmit 2>&1 | Select-String "error TS" | Group-Object | Select-Object Count, Name | Sort-Object Count -Descending
```

**معايير النجاح:**
- ✅ لا أخطاء TS2307 (Cannot find module) جديدة
- ✅ لا أخطاء TS2305 (Module has no exported member) جديدة
- ⚠️ الأخطاء الموجودة مسبقاً (TS6133, TS7006, TS2339) مقبولة

### 4.2 اختبار التطبيق في وضع التطوير

**الأوامر:**

```powershell
# تشغيل التطبيق
npm run dev

# فتح المتصفح
Start-Process "http://localhost:3001"
```

**معايير النجاح:**
- ✅ التطبيق يبدأ بدون أخطاء
- ✅ لا أخطاء 500 في console
- ✅ لا أخطاء "Failed to resolve import"

### 4.3 اختبار الصفحات الرئيسية

**قائمة الاختبار:**

| # | الصفحة | الاختبار | الحالة المتوقعة |
|---|--------|----------|-----------------|
| 1 | **Dashboard** | فتح الصفحة | ✅ تعرض KPIs |
| 2 | **Dashboard** | عرض الرسوم البيانية | ✅ تعرض Charts |
| 3 | **Tenders** | فتح قائمة المنافسات | ✅ تعرض القائمة |
| 4 | **Tenders** | فتح تفاصيل منافسة | ✅ تعرض التفاصيل |
| 5 | **Tenders** | فتح معالج التسعير | ✅ يعمل المعالج |
| 6 | **Projects** | فتح قائمة المشاريع | ✅ تعرض القائمة |
| 7 | **Projects** | فتح تفاصيل مشروع | ✅ تعرض التفاصيل |
| 8 | **Financial** | فتح صفحة المالية | ✅ تعرض الملخص |
| 9 | **Financial** | عرض Balance Sheet | ✅ يعمل |
| 10 | **Financial** | عرض Income Statement | ✅ يعمل |
| 11 | **Financial** | عرض Tax Reports | ✅ يعمل |
| 12 | **Reports** | فتح صفحة التقارير | ✅ تعرض القائمة |
| 13 | **Settings** | فتح الإعدادات | ✅ تعرض الخيارات |

### 4.3.1 اختبار مفصل لنظام المنافسات (🔴 أولوية عالية)

**سبب الأولوية:** نظام المنافسات هو الأكثر تعقيداً ويحتوي على أكبر عدد من الوظائف.

#### اختبار 1: صفحة قائمة المنافسات (TendersPage)

**الخطوات:**
```
1. فتح التطبيق والانتقال إلى صفحة المنافسات
2. التحقق من عرض بطاقات المنافسات (EnhancedTenderCard)
3. التحقق من عرض معلومات كل منافسة:
   - اسم المنافسة
   - اسم العميل
   - تاريخ الإغلاق
   - القيمة المقدرة
   - الحالة (Status Badge)
   - نسبة الإنجاز (Progress Bar)
4. التحقق من أزرار الإجراءات:
   - "عرض التفاصيل"
   - "بدء التسعير"
   - "تقديم المنافسة"
   - "تعديل"
   - "حذف"
```

**الحالة المتوقعة:**
- ✅ جميع البطاقات تعرض بشكل صحيح
- ✅ جميع المعلومات تظهر
- ✅ جميع الأزرار تعمل

#### اختبار 2: صفحة تفاصيل المنافسة (TenderDetailsPage)

**الخطوات:**
```
1. النقر على "عرض التفاصيل" لمنافسة موجودة
2. التحقق من عرض التبويبات (Tabs):
   - تبويب "الملخص" (Summary)
   - تبويب "جدول الكميات" (BOQ)
   - تبويب "المرفقات" (Attachments)
   - تبويب "الجدول الزمني" (Timeline)
3. التحقق من محتوى كل تبويب:
   - الملخص: معلومات عامة، العميل، الموقع، النوع
   - جدول الكميات: قائمة البنود مع الأسعار
   - المرفقات: الملفات الفنية والمستندات
   - الجدول الزمني: التواريخ المهمة
4. التحقق من أزرار الإجراءات:
   - "بدء التسعير"
   - "تقديم المنافسة"
   - "تحديث الحالة"
   - "إدارة النتائج"
```

**الحالة المتوقعة:**
- ✅ جميع التبويبات تعمل
- ✅ جميع المعلومات تعرض بشكل صحيح
- ✅ جميع الأزرار تعمل

#### اختبار 3: معالج التسعير (TenderPricingPage)

**الخطوات:**
```
1. النقر على "بدء التسعير" من صفحة التفاصيل
2. التحقق من فتح صفحة التسعير (TenderPricingPage)
3. التحقق من عرض التبويبات:
   - تبويب "الملخص" (Summary)
   - تبويب "التسعير" (Pricing)
   - تبويب "الفنية" (Technical)
4. التحقق من تبويب التسعير:
   - قائمة بنود الكميات
   - إمكانية إضافة تكاليف:
     * المواد (Materials)
     * العمالة (Labor)
     * المعدات (Equipment)
     * المقاولين الفرعيين (Subcontractors)
   - حساب الإجماليات تلقائياً
   - إضافة النسب المئوية:
     * الإدارية (Administrative)
     * التشغيلية (Operational)
     * الربح (Profit)
   - حساب ضريبة القيمة المضافة (VAT)
   - عرض الإجمالي النهائي
5. التحقق من أزرار الإجراءات:
   - "حفظ"
   - "السابق" / "التالي" (للتنقل بين البنود)
   - "إنهاء التسعير"
```

**الحالة المتوقعة:**
- ✅ معالج التسعير يفتح بدون أخطاء
- ✅ جميع التبويبات تعمل
- ✅ إضافة التكاليف تعمل
- ✅ الحسابات التلقائية تعمل
- ✅ الحفظ يعمل
- ✅ التنقل بين البنود يعمل

#### اختبار 4: إدارة حالة المنافسة (TenderStatusManager)

**الخطوات:**
```
1. فتح تفاصيل منافسة
2. النقر على "تحديث الحالة"
3. التحقق من الحالات المتاحة:
   - "جديدة" (new)
   - "قيد التسعير" (pricing)
   - "جاهزة للتقديم" (ready_to_submit)
   - "مقدمة" (submitted)
   - "فائزة" (won)
   - "خاسرة" (lost)
4. تغيير الحالة والتحقق من التحديث
```

**الحالة المتوقعة:**
- ✅ جميع الحالات متاحة
- ✅ تغيير الحالة يعمل
- ✅ التحديث يظهر فوراً

#### اختبار 5: إدارة النتائج (TenderResultsManager)

**الخطوات:**
```
1. فتح تفاصيل منافسة مقدمة
2. النقر على "إدارة النتائج"
3. التحقق من إمكانية:
   - تسجيل النتيجة (فوز/خسارة)
   - إدخال القيمة الفائزة
   - إضافة ملاحظات
   - حفظ النتيجة
```

**الحالة المتوقعة:**
- ✅ إدارة النتائج تعمل
- ✅ حفظ النتيجة يعمل
- ✅ تحديث الحالة تلقائياً

### 4.4 اختبار الوظائف الحرجة

**سيناريوهات الاختبار:**

#### 1. إنشاء منافسة جديدة
```
1. الذهاب إلى صفحة المنافسات
2. النقر على "منافسة جديدة"
3. ملء البيانات الأساسية
4. حفظ المنافسة
✅ المتوقع: تُحفظ المنافسة بنجاح
```

#### 2. معالج التسعير
```
1. فتح منافسة موجودة
2. النقر على "بدء التسعير"
3. إضافة بنود
4. حساب التكاليف
✅ المتوقع: يعمل المعالج بدون أخطاء
```

#### 3. إنشاء مشروع جديد
```
1. الذهاب إلى صفحة المشاريع
2. النقر على "مشروع جديد"
3. ملء البيانات
4. حفظ المشروع
✅ المتوقع: يُحفظ المشروع بنجاح
```

#### 4. عرض التقارير المالية
```
1. الذهاب إلى صفحة المالية
2. فتح Balance Sheet
3. فتح Income Statement
4. فتح Tax Reports
✅ المتوقع: تعرض جميع التقارير بدون أخطاء
```

### 4.5 توثيق نتائج الاختبار

**قالب التوثيق:**

```markdown
# نتائج اختبار النظام بعد الإصلاح

## التاريخ: [التاريخ]
## المُختبِر: [الاسم]

### 1. اختبار TypeScript
- ✅/❌ عدد الأخطاء: [العدد]
- ✅/❌ أخطاء TS2307: [العدد]
- ✅/❌ أخطاء TS2305: [العدد]

### 2. اختبار التطبيق
- ✅/❌ التطبيق يبدأ بنجاح
- ✅/❌ لا أخطاء في Console
- ✅/❌ جميع الصفحات تُحمّل

### 3. اختبار الوظائف
- ✅/❌ إنشاء منافسة جديدة
- ✅/❌ معالج التسعير
- ✅/❌ إنشاء مشروع جديد
- ✅/❌ التقارير المالية

### 4. المشاكل المتبقية
[قائمة بأي مشاكل لم تُحل]

### 5. التوصيات
[توصيات للتحسين]
```

---

## 📊 تقدير الوقت والموارد

### الوقت الإجمالي المتوقع

| المرحلة | الوقت المتوقع | الصعوبة | المخاطر |
|---------|---------------|---------|---------|
| **المرحلة 1**: التحليل والفحص | 30-60 دقيقة | 🟢 منخفضة | منخفضة |
| **المرحلة 2**: استعادة الملفات | 2-3 ساعات | 🟡 متوسطة | متوسطة |
| **المرحلة 3**: إصلاح الاستيرادات | 1-2 ساعة | 🟢 منخفضة | منخفضة |
| **المرحلة 4**: الاختبار والتحقق | 1-2 ساعة | 🟡 متوسطة | متوسطة |
| **الإجمالي** | **5-8 ساعات** | 🟡 متوسطة | متوسطة |

### عدد الملفات المتأثرة

| الفئة | العدد | الحالة |
|------|------|--------|
| **ملفات للاستعادة** | 106 خدمة + 10 hooks | ❌ محذوفة |
| **ملفات للتحديث** | 20+ ملف | ⚠️ استيرادات مكسورة |
| **ملفات للاختبار** | 11 صفحة رئيسية | ⚠️ تحتاج اختبار |

### مستوى الصعوبة والمخاطر

**🟢 منخفضة:**
- إصلاح الاستيرادات (بحث واستبدال بسيط)
- التحليل والفحص (قراءة فقط)

**🟡 متوسطة:**
- استعادة الملفات من Git (يحتاج دقة)
- الاختبار الشامل (يحتاج وقت)

**🔴 عالية:**
- لا توجد مخاطر عالية (الحفاظ على Git history)

---

## 🎯 الخطوات التنفيذية التفصيلية

### الخطوة 1: الإعداد والتحضير

```powershell
# 1. إنشاء branch جديد للإصلاح
git checkout -b fix/restore-deleted-services

# 2. إنشاء مجلد مؤقت للملفات المستعادة
New-Item -ItemType Directory -Path "temp_restored" -Force

# 3. إنشاء ملف لتتبع التقدم
New-Item -ItemType File -Path "restoration_progress.md" -Force
```

### الخطوة 2: استعادة الخدمات المالية (🔴 أولوية عالية)

```powershell
# قائمة الخدمات المالية
$financialServices = @(
    "financialAnalyticsService.ts",
    "financialStatementsService.ts",
    "paymentsReceivablesService.ts",
    "profitabilityAnalysisService.ts",
    "saudiTaxService.ts",
    "financialIntegrationService.ts"
)

# استعادة كل خدمة
foreach ($service in $financialServices) {
    Write-Output "استعادة $service..."

    # 1. تحديد آخر commit
    $lastCommit = git log --all --full-history -1 --pretty=format:"%H" -- "src/services/$service"

    if ($lastCommit) {
        # 2. استعادة الملف
        git show "${lastCommit}:src/services/$service" > "temp_restored/$service"

        # 3. نقل إلى الموقع الجديد
        Move-Item "temp_restored/$service" "src/application/services/$service" -Force

        Write-Output "✅ تم استعادة $service"
    } else {
        Write-Output "❌ لم يتم العثور على $service في Git history"
    }
}
```

### الخطوة 3: استعادة الخدمات التنافسية (🔴 أولوية عالية)

```powershell
# قائمة الخدمات التنافسية
$competitiveServices = @(
    "bidComparisonService.ts",
    "competitorDatabaseService.ts",
    "decisionSupportService.ts",
    "marketIntelligenceService.ts"
)

# استعادة كل خدمة (نفس الطريقة أعلاه)
foreach ($service in $competitiveServices) {
    Write-Output "استعادة $service..."
    $lastCommit = git log --all --full-history -1 --pretty=format:"%H" -- "src/services/$service"

    if ($lastCommit) {
        git show "${lastCommit}:src/services/$service" > "temp_restored/$service"
        Move-Item "temp_restored/$service" "src/application/services/$service" -Force
        Write-Output "✅ تم استعادة $service"
    }
}
```

### الخطوة 4: استعادة الخدمات الأخرى (🟡 أولوية متوسطة)

```powershell
# قائمة الخدمات الأخرى المهمة
$otherServices = @(
    "earnedValueCalculator.ts",
    "qualityAssuranceService.ts",
    "riskAssessmentService.ts",
    "schedulingService.ts",
    "taskManagementService.ts",
    "templateService.ts",
    "workflowAutomationService.ts"
)

# استعادة كل خدمة
foreach ($service in $otherServices) {
    Write-Output "استعادة $service..."
    $lastCommit = git log --all --full-history -1 --pretty=format:"%H" -- "src/services/$service"

    if ($lastCommit) {
        git show "${lastCommit}:src/services/$service" > "temp_restored/$service"
        Move-Item "temp_restored/$service" "src/application/services/$service" -Force
        Write-Output "✅ تم استعادة $service"
    }
}
```

### الخطوة 5: إصلاح الاستيرادات

```powershell
# تحديث جميع استيرادات @/services/ إلى @/application/services/
Write-Output "إصلاح الاستيرادات..."

$filesUpdated = 0
Get-ChildItem -Path "src" -Recurse -Include "*.ts","*.tsx" -File | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $updated = $content -replace "from (['\`"])@/services/", "from `$1@/application/services/"

    if ($content -ne $updated) {
        Set-Content -Path $_.FullName -Value $updated -NoNewline
        Write-Output "✅ Updated: $($_.Name)"
        $filesUpdated++
    }
}

Write-Output "`nتم تحديث $filesUpdated ملف"
```

### الخطوة 6: فحص TypeScript

```powershell
Write-Output "فحص TypeScript..."
npx tsc --noEmit

# عد الأخطاء
$errors = npx tsc --noEmit 2>&1 | Select-String "error TS"
Write-Output "عدد الأخطاء: $($errors.Count)"
```

### الخطوة 7: اختبار التطبيق

```powershell
# تشغيل التطبيق
Write-Output "تشغيل التطبيق..."
npm run dev

# فتح المتصفح
Start-Sleep -Seconds 10
Start-Process "http://localhost:3001"
```

### الخطوة 8: إنشاء Commit

```powershell
# إضافة جميع التغييرات
git add -A

# إنشاء commit
git commit -m "fix: استعادة الخدمات المحذوفة وإصلاح الاستيرادات

🔧 الخدمات المستعادة:
- 6 خدمات مالية
- 4 خدمات تنافسية
- 7 خدمات أخرى

✅ الإصلاحات:
- تحديث 20+ استيراد من @/services/ إلى @/application/services/
- جميع الصفحات تعمل بدون أخطاء
- لا أخطاء TypeScript جديدة

Related to: System Recovery Plan"

# عرض الحالة
git log --oneline -1
git status --short
```

---

## 📝 ملاحظات مهمة

### ⚠️ تحذيرات

1. **لا تستخدم `git reset`**: الحفاظ على تاريخ Git كاملاً
2. **اختبر بعد كل خطوة**: تأكد من عمل النظام قبل المتابعة
3. **احتفظ بنسخة احتياطية**: قبل البدء، انسخ المجلد كاملاً
4. **راجع الاستيرادات داخل الملفات المستعادة**: قد تحتاج تحديث

### ✅ أفضل الممارسات

1. **استعادة تدريجية**: ابدأ بالخدمات الحرجة أولاً
2. **اختبار مستمر**: اختبر بعد كل مجموعة من الاستعادات
3. **توثيق التقدم**: سجل كل خطوة في `restoration_progress.md`
4. **Commits منتظمة**: أنشئ commit بعد كل مرحلة

### 🎯 معايير النجاح النهائية

- ✅ جميع الصفحات الرئيسية تعمل (8 صفحات)
- ✅ لا أخطاء TypeScript جديدة
- ✅ لا أخطاء 500 في Console
- ✅ جميع الوظائف الحرجة تعمل
- ✅ التطبيق يبدأ بدون مشاكل

---

## 📞 الدعم والمساعدة

إذا واجهت أي مشاكل أثناء التنفيذ:

1. **راجع Git history**: `git log --all --full-history -- <file-path>`
2. **تحقق من الاستيرادات**: `Get-Content <file> | Select-String "from"`
3. **فحص TypeScript**: `npx tsc --noEmit`
4. **راجع Console**: افتح DevTools في المتصفح

---

**آخر تحديث**: 2025-10-22
**الحالة**: 📋 خطة جاهزة للتنفيذ
**الوقت المتوقع**: 5-8 ساعات
**المخاطر**: 🟡 متوسطة
**الأولوية**: 🔴 عالية جداً


