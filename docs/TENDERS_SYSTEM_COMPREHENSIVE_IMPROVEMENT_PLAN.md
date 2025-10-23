# خطة التحسين الشاملة لنظام المنافسات

## Tenders System Comprehensive Improvement Plan

**التاريخ:** 23 أكتوبر 2025  
**الإصدار:** 1.0  
**الحالة:** 📋 جاهز للتنفيذ  
**المدة المتوقعة:** 6-8 أسابيع

---

## 📊 الملخص التنفيذي

### الوضع الحالي

- **إجمالي الملفات:** 39 ملف
- **إجمالي الأسطر:** 18,119 سطر
- **الملفات الكبيرة (>800 سطر):** 5 ملفات (6,512 سطر)
- **الملفات القديمة (Legacy):** 3 ملفات (3,975 سطر)
- **نسخ احتياطية:** 1 ملف (1,560 سطر)

### الأهداف الرئيسية

1. ✂️ **تقليل الأسطر:** من 18,119 إلى ~12,000 سطر (توفير 33%)
2. 📦 **تفكيك الملفات الكبيرة:** تقسيم 5 ملفات إلى 25+ ملف صغير
3. 🗑️ **حذف الملفات القديمة:** إزالة 4 ملفات (5,535 سطر)
4. 🔄 **إزالة التكرار:** توحيد المنطق المكرر في 8+ موقع
5. 🏗️ **تحسين البنية المعمارية:** فصل واضح للطبقات (Presentation, Application, Domain)
6. ✅ **رفع التغطية الاختبارية:** من الحالي إلى 75%+

### الفوائد المتوقعة

- ⚡ **تحسين الأداء:** تقليل زمن التحميل بنسبة 40-50%
- 🔧 **سهولة الصيانة:** ملفات أصغر وأكثر تركيزًا
- 🐛 **تقليل الأخطاء:** كود أقل تعقيدًا وأكثر وضوحًا
- 📈 **قابلية التوسع:** بنية معمارية أفضل
- 👥 **تعاون أفضل:** كود أسهل للفهم والمراجعة

---

## 📋 تحليل النظام الحالي

### 1. هيكل الملفات

```
src/
├── presentation/
│   ├── pages/Tenders/
│   │   ├── TendersPage.tsx (855 سطر) ⚠️
│   │   ├── TenderPricingPage.tsx (1,415 سطر) 🔴
│   │   ├── TenderPricingPage.LEGACY.tsx (1,415 سطر) 🗑️
│   │   ├── TenderPricingPage_OLD.tsx (1,350 سطر) 🗑️
│   │   ├── TenderPricingPage.BEFORE_PHASE_2.5.tsx (1,210 سطر) 🗑️
│   │   ├── TenderPricingPage.tsx.backup (1,560 سطر) 🗑️
│   │   └── components/
│   │       ├── NewTenderForm.tsx (1,102 سطر) ⚠️
│   │       ├── TenderStatusManager.tsx (360 سطر) ✅
│   │       ├── TenderStatusCards.tsx (398 سطر) ✅
│   │       ├── TenderResultsManager.tsx (447 سطر) ✅
│   │       └── TenderQuickResults.tsx (340 سطر) ✅
│   └── components/tenders/
│       ├── TenderDetails.tsx (1,600 سطر) 🔴
│       ├── EnhancedTenderCard.tsx (659 سطر) ✅
│       ├── PricingTemplateManager.tsx (582 سطر) ✅
│       └── RiskAssessmentMatrix.tsx (489 سطر) ✅
├── features/tenders/
│   └── pricing/
│       └── TenderPricingWizard.tsx (1,540 سطر) 🔴
├── application/
│   ├── hooks/
│   │   ├── useTenders.ts (99 سطر) ✅
│   │   ├── useUnifiedTenderPricing.ts (185 سطر) ✅
│   │   ├── useEditableTenderPricing.ts (170 سطر) ✅
│   │   └── useTenderStatus.ts (133 سطر) ✅
│   └── services/
│       └── tenderSubmissionService.ts (79 سطر) ✅
├── domain/
│   ├── services/
│   │   └── tenderMetricsService.ts (190 سطر) ✅
│   └── utils/
│       └── tenderPerformance.ts (55 سطر) ✅
└── shared/utils/tender/
    ├── tenderNotifications.ts (459 سطر) ✅
    ├── tenderProgressCalculator.ts (303 سطر) ✅
    ├── tenderStatusHelpers.ts (233 سطر) ✅
    └── tenderStatusMigration.ts (186 سطر) ✅
```

**الأيقونات:**

- 🔴 = ملف كبير جدًا (>1000 سطر) - يحتاج تفكيك عاجل
- ⚠️ = ملف متوسط (800-1000 سطر) - يحتاج تفكيك
- ✅ = ملف بحجم جيد (<700 سطر)
- 🗑️ = ملف قديم للحذف

### 2. الملفات التي تحتاج تدخل عاجل

#### 2.1 الملفات الكبيرة جدًا (Priority: P0)

| الملف                       | الأسطر | المشكلة                                                                                                          | الحل المقترح                                                                                                                                         |
| --------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TenderPricingPage.tsx**   | 1,415  | - تحتوي على business logic مباشرة<br>- دمج بين presentation و data management<br>- معالجات كثيرة للحفظ والمزامنة | تقسيم إلى:<br>1. TenderPricingPageContainer (200)<br>2. PricingDataManager (300)<br>3. PricingSyncService (150)<br>4. PricingCalculations (مع hooks) |
| **TenderDetails.tsx**       | 1,600  | - تحتوي على 4 تبويبات في ملف واحد<br>- منطق معقد لإدارة الحالة<br>- معالجات متعددة للإجراءات                     | تقسيم إلى:<br>1. TenderDetailsContainer (300)<br>2. GeneralInfoTab (250)<br>3. AttachmentsTab (200)<br>4. TimelineTab (180)<br>5. WorkflowTab (220)  |
| **TenderPricingWizard.tsx** | 1,540  | - 5 خطوات في ملف واحد<br>- منطق معقد للتنقل<br>- validation مكرر                                                 | تقسيم إلى:<br>1. WizardContainer (250)<br>2. RegistrationStep (200)<br>3. TechnicalStep (220)<br>4. FinancialStep (240)<br>5. ReviewStep (180)       |
| **NewTenderForm.tsx**       | 1,102  | - validation معقد<br>- معالجات متعددة للحقول<br>- منطق Excel مدمج                                                | تقسيم إلى:<br>1. TenderFormContainer (300)<br>2. BasicInfoFields (200)<br>3. QuantityTableEditor (250)<br>4. ExcelImportHandler (150)                |
| **TendersPage.tsx**         | 855    | - دمج عرض البطاقات والفلترة<br>- معالجات متعددة للإجراءات                                                        | تقسيم إلى:<br>1. TendersPageContainer (250)<br>2. TendersGrid (200)<br>3. TenderFilters (150)<br>4. TenderActions (150)                              |

#### 2.2 الملفات القديمة للحذف (Priority: P0)

| الملف                                  | الأسطر    | السبب         | الإجراء         |
| -------------------------------------- | --------- | ------------- | --------------- |
| TenderPricingPage.LEGACY.tsx           | 1,415     | نسخة قديمة    | حذف كامل        |
| TenderPricingPage_OLD.tsx              | 1,350     | نسخة قديمة    | حذف كامل        |
| TenderPricingPage.BEFORE_PHASE_2.5.tsx | 1,210     | نسخة قديمة    | حذف كامل        |
| TenderPricingPage.tsx.backup-\*        | 1,560     | نسخة احتياطية | حذف كامل        |
| **المجموع**                            | **5,535** |               | **توفير مباشر** |

### 3. التكرارات المكتشفة

#### 3.1 منطق الحسابات (يتكرر في 4 مواقع)

```typescript
// المواقع:
- TenderPricingPage.tsx (سطور 500-650)
- TenderDetails.tsx (سطور 800-920)
- useTenderPricingCalculations.ts (التطبيق الصحيح)
- SummaryView.tsx (سطور 100-180)

// الحل: توحيد الكل في useTenderPricingCalculations
```

#### 3.2 معالجات الحفظ والمزامنة (يتكرر في 3 مواقع)

```typescript
// المواقع:
- TenderPricingPage.tsx (سطور 700-900)
- TenderDetails.tsx (سطور 950-1100)
- useTenderPricingPersistence.ts (التطبيق الصحيح)

// الحل: الاعتماد الكامل على useTenderPricingPersistence
```

#### 3.3 إدارة الحالة (يتكرر في 3 مواقع)

```typescript
// المواقع:
- TenderPricingPage.tsx (useState متعددة)
- TenderDetails.tsx (useState متعددة)
- useTenderPricingState.ts (التطبيق الصحيح)

// الحل: استخدام useTenderPricingState حصريًا
```

#### 3.4 validation وتحقق البيانات (يتكرر في 5 مواقع)

```typescript
// المواقع:
- NewTenderForm.tsx (سطور 300-450)
- TenderPricingWizard.tsx (سطور 600-750)
- TenderDetails.tsx (سطور 200-280)
- SummaryView.tsx (سطور 50-90)
- PricingView.tsx (سطور 80-120)

// الحل: إنشاء useTenderValidation hook مركزي
```

### 4. المشاكل المعمارية

#### 4.1 دمج Presentation و Business Logic

**المشكلة:** العديد من مكونات العرض تحتوي على منطق أعمال مباشرة

**الأمثلة:**

```typescript
// ❌ خطأ: في TenderPricingPage.tsx
const calculateTotal = () => {
  const materials = currentPricing.materials.reduce(...)
  const labor = currentPricing.labor.reduce(...)
  // ... منطق حساب معقد
}

// ✅ صحيح: استخدام hook
const { totals } = useTenderPricingCalculations(...)
```

**الحل:**

- نقل جميع منطق الأعمال إلى Hooks وServices
- المكونات تكون presentational فقط

#### 4.2 استيرادات دائرية (Circular Imports)

**المشكلة:** بعض الملفات تستورد من بعضها بشكل دائري

**الأمثلة:**

```
TenderPricingPage → useTenderPricingPersistence → pricingService → TenderPricingPage
```

**الحل:**

- إعادة هيكلة التبعيات
- استخدام Dependency Injection
- فصل الواجهات (Interfaces) عن التطبيقات

#### 4.3 عدم الالتزام بـ Single Responsibility Principle

**المشكلة:** ملفات كبيرة تقوم بمسؤوليات متعددة

**الأمثلة:**

- TenderDetails.tsx: عرض + إدارة حالة + API calls + validation
- TenderPricingWizard.tsx: 5 خطوات + تنقل + validation + حفظ

**الحل:**

- تطبيق SRP بدقة
- كل ملف مسؤولية واحدة فقط

---

## 🎯 الخطة التنفيذية

### المرحلة 0: التحضير والتجهيز (أسبوع واحد)

#### الأهداف

- إعداد بيئة التطوير
- توثيق النظام الحالي
- إنشاء نسخ احتياطية
- إعداد خطة اختبار شاملة

#### المهام

1. **إنشاء فرع Git جديد**

   ```bash
   git checkout -b feature/tenders-comprehensive-refactor
   ```

2. **توثيق Baseline الحالي**

   - تشغيل اختبارات القياس (Benchmarks)
   - قياس أزمنة التحميل
   - حساب حجم الحزم (Bundle Sizes)
   - توثيق نسبة التغطية الاختبارية

3. **إعداد خطة اختبار**

   - تحديد Test Cases الحرجة
   - إنشاء Smoke Tests
   - إعداد Integration Tests
   - تجهيز E2E Tests

4. **إعداد أدوات القياس**
   - Lighthouse للأداء
   - Bundle Analyzer للحزم
   - Test Coverage Tools

#### المخرجات

- ✅ فرع Git جديد
- ✅ تقرير Baseline شامل
- ✅ خطة اختبار مفصلة
- ✅ أدوات القياس جاهزة

---

### المرحلة 1: التنظيف السريع (أسبوع واحد)

#### الأهداف

- حذف الملفات القديمة والنسخ الاحتياطية
- تنظيف الاستيرادات غير المستخدمة
- إزالة الكود الميت (Dead Code)

#### المهام

##### 1.1 حذف الملفات القديمة (يوم 1)

**الملفات المستهدفة:**

```
✗ TenderPricingPage.LEGACY.tsx (1,415 سطر)
✗ TenderPricingPage_OLD.tsx (1,350 سطر)
✗ TenderPricingPage.BEFORE_PHASE_2.5.tsx (1,210 سطر)
✗ TenderPricingPage.tsx.backup-* (1,560 سطر)
```

**الأوامر:**

```bash
# حذف الملفات
git rm src/presentation/pages/Tenders/TenderPricingPage.LEGACY.tsx
git rm src/presentation/pages/Tenders/TenderPricingPage_OLD.tsx
git rm src/presentation/pages/Tenders/TenderPricingPage.BEFORE_PHASE_2.5.tsx
git rm src/presentation/pages/Tenders/TenderPricingPage.tsx.backup-*

# التحقق
npm run lint
npm run test
npm run build
```

**التوفير المتوقع:** 5,535 سطر (30% من الإجمالي)

##### 1.2 تنظيف الاستيرادات (يوم 2)

**الأهداف:**

- إزالة الاستيرادات غير المستخدمة
- توحيد مسارات الاستيراد
- تنظيف التعليقات القديمة

**الأدوات:**

```bash
# استخدام ESLint
npm run lint -- --fix

# مراجعة يدوية
# البحث عن: import.*from.*that is declared but never used
```

##### 1.3 إزالة الكود الميت (يوم 3)

**الاستراتيجية:**

- البحث عن دوال غير مستخدمة
- حذف المتغيرات غير المرجعية
- إزالة التعليقات القديمة الطويلة

#### المخرجات المتوقعة

- ✅ حذف 4 ملفات (5,535 سطر)
- ✅ تنظيف ~200 سطر استيرادات
- ✅ إزالة ~300 سطر كود ميت
- ✅ **توفير إجمالي: ~6,035 سطر (33%)**

---

### المرحلة 2: تفكيك TenderPricingPage.tsx (أسبوع واحد)

#### الهيكل المستهدف

```
src/presentation/pages/Tenders/TenderPricing/
├── TenderPricingPageContainer.tsx (200 سطر)
│   └── المسؤولية: تنسيق المكونات وإدارة الحالة العليا
├── components/
│   ├── PricingHeader.tsx (100 سطر) ✅ موجود
│   ├── PricingProgress.tsx (80 سطر) 🆕
│   ├── PricingActions.tsx (120 سطر) 🆕
│   ├── RestoreBackupDialog.tsx (80 سطر) ✅ موجود
│   └── TemplateManagerDialog.tsx (100 سطر) ✅ موجود
├── sections/
│   ├── MaterialsSection.tsx (180 سطر) ✅ موجود
│   ├── LaborSection.tsx (170 سطر) ✅ موجود
│   ├── EquipmentSection.tsx (160 سطر) ✅ موجود
│   └── SubcontractorsSection.tsx (175 سطر) ✅ موجود
└── hooks/
    ├── useTenderPricingState.ts (93 سطر) ✅ موجود
    ├── useTenderPricingCalculations.ts (267 سطر) ✅ موجود
    ├── useTenderPricingPersistence.ts (552 سطر) ✅ موجود
    ├── usePricingTemplates.ts (150 سطر) ✅ موجود
    └── usePricingBackup.ts (100 سطر) 🆕
```

#### المهام التفصيلية

##### يوم 1-2: إنشاء المكونات الجديدة

1. **PricingProgress.tsx** (80 سطر)

```typescript
// عرض شريط التقدم والإحصائيات
interface PricingProgressProps {
  completedCount: number
  totalCount: number
  completionPercentage: number
}
```

2. **PricingActions.tsx** (120 سطر)

```typescript
// أزرار الإجراءات: حفظ، استعادة، تصدير
interface PricingActionsProps {
  onSave: () => Promise<void>
  onRestore: () => void
  onExport: () => void
  isSaving: boolean
}
```

3. **usePricingBackup.ts** (100 سطر)

```typescript
// إدارة النسخ الاحتياطية
export function usePricingBackup(tenderId: string) {
  const createBackup = async () => { ... }
  const listBackups = async () => { ... }
  const restoreBackup = async (backupId: string) => { ... }
  return { createBackup, listBackups, restoreBackup }
}
```

##### يوم 3-4: نقل المنطق من TenderPricingPage

**الخطوات:**

1. تحديد الأجزاء المستقلة
2. نقلها إلى المكونات/Hooks الجديدة
3. استبدال الكود القديم بالجديد
4. اختبار كل جزء على حدة

##### يوم 5: إنشاء TenderPricingPageContainer

```typescript
// TenderPricingPageContainer.tsx (200 سطر)
export function TenderPricingPageContainer({ tender, onBack }: Props) {
  // استخدام Hooks فقط
  const state = useTenderPricingState(...)
  const calculations = useTenderPricingCalculations(...)
  const persistence = useTenderPricingPersistence(...)
  const backup = usePricingBackup(...)
  const templates = usePricingTemplates(...)

  // تنسيق المكونات
  return (
    <PageLayout>
      <PricingHeader {...headerProps} />
      <PricingProgress {...progressProps} />
      <TenderPricingTabs {...tabsProps} />
      <PricingActions {...actionsProps} />
    </PageLayout>
  )
}
```

#### المخرجات المتوقعة

- ✅ TenderPricingPage من 1,415 إلى 200 سطر (تقليل 85%)
- ✅ 3 مكونات جديدة (280 سطر)
- ✅ 1 hook جديد (100 سطر)
- ✅ **توفير صافي: ~835 سطر**

---

### المرحلة 3: تفكيك TenderDetails.tsx (أسبوع واحد)

#### الهيكل المستهدف

```
src/presentation/components/tenders/TenderDetails/
├── TenderDetailsContainer.tsx (300 سطر)
├── components/
│   ├── TenderHeader.tsx (100 سطر) ✅ موجود
│   ├── TenderInfoCard.tsx (120 سطر) ✅ موجود
│   ├── AttachmentItem.tsx (60 سطر) ✅ موجود
│   ├── CostAnalysisTable.tsx (150 سطر) ✅ موجود
│   ├── TechnicalFilesSection.tsx (120 سطر) 🆕
│   └── SubmitDialog.tsx (80 سطر) 🆕
├── tabs/
│   ├── GeneralInfoTab.tsx (250 سطر) ✅ موجود
│   ├── AttachmentsTab.tsx (180 سطر) ✅ موجود
│   ├── TimelineTab.tsx (200 سطر) ✅ موجود
│   └── WorkflowTab.tsx (220 سطر) ✅ موجود
└── hooks/
    ├── useTenderDetails.ts (150 سطر) ✅ موجود
    ├── useTenderActions.ts (180 سطر) ✅ موجود
    ├── useTenderAttachments.ts (100 سطر) ✅ موجود
    └── useTenderSubmission.ts (120 سطر) 🆕
```

#### المهام التفصيلية

##### يوم 1-2: إنشاء المكونات المفقودة

1. **TechnicalFilesSection.tsx** (120 سطر)
2. **SubmitDialog.tsx** (80 سطر)
3. **useTenderSubmission.ts** (120 سطر)

##### يوم 3-4: تحسين التبويبات الموجودة

- تقليل التبعيات
- توحيد أنماط الكود
- تحسين الأداء

##### يوم 5: إنشاء TenderDetailsContainer

```typescript
// TenderDetailsContainer.tsx (300 سطر)
export function TenderDetailsContainer({ tender, onBack }: Props) {
  const { localTender, unified } = useTenderDetails(tender)
  const actions = useTenderActions(tender, localTender, ...)
  const { submit, isSubmitting } = useTenderSubmission(tender)

  return (
    <PageLayout>
      <TenderHeader tender={localTender} onBack={onBack} />
      <Tabs>
        <GeneralInfoTab tender={localTender} unified={unified} />
        <AttachmentsTab tender={localTender} />
        <TimelineTab tender={localTender} />
        <WorkflowTab tender={localTender} />
      </Tabs>
      <SubmitDialog onSubmit={submit} isSubmitting={isSubmitting} />
    </PageLayout>
  )
}
```

#### المخرجات المتوقعة

- ✅ TenderDetails من 1,600 إلى 300 سطر (تقليل 81%)
- ✅ 2 مكونات جديدة (200 سطر)
- ✅ 1 hook جديد (120 سطر)
- ✅ **توفير صافي: ~980 سطر**

---

### المرحلة 4: تفكيك TenderPricingWizard.tsx (أسبوع واحد)

#### الهيكل المستهدف

```
src/features/tenders/pricing/TenderPricingWizard/
├── TenderPricingWizardContainer.tsx (250 سطر)
├── steps/
│   ├── RegistrationStep.tsx (200 سطر)
│   ├── TechnicalStep.tsx (220 سطر)
│   ├── FinancialStep.tsx (240 سطر)
│   ├── ReviewStep.tsx (180 سطر)
│   └── SubmitStep.tsx (150 سطر)
├── components/
│   ├── WizardNavigation.tsx (100 سطر)
│   ├── WizardProgress.tsx (80 سطر)
│   ├── StepIndicator.tsx (60 سطر)
│   └── ChecklistItem.tsx (40 سطر)
└── hooks/
    ├── useWizardState.ts (120 سطر)
    ├── useWizardNavigation.ts (100 سطر)
    ├── useWizardValidation.ts (150 سطر)
    └── useWizardPersistence.ts (180 سطر)
```

#### المهام التفصيلية

##### يوم 1: إنشاء Hooks

1. **useWizardState.ts** (120 سطر)
2. **useWizardNavigation.ts** (100 سطر)
3. **useWizardValidation.ts** (150 سطر)
4. **useWizardPersistence.ts** (180 سطر)

##### يوم 2-3: إنشاء مكونات الخطوات

1. **RegistrationStep.tsx** (200 سطر)
2. **TechnicalStep.tsx** (220 سطر)
3. **FinancialStep.tsx** (240 سطر)
4. **ReviewStep.tsx** (180 سطر)
5. **SubmitStep.tsx** (150 سطر)

##### يوم 4: إنشاء مكونات الواجهة

1. **WizardNavigation.tsx** (100 سطر)
2. **WizardProgress.tsx** (80 سطر)
3. **StepIndicator.tsx** (60 سطر)
4. **ChecklistItem.tsx** (40 سطر)

##### يوم 5: التجميع والاختبار

```typescript
// TenderPricingWizardContainer.tsx (250 سطر)
export function TenderPricingWizardContainer({ tender, onExit }: Props) {
  const state = useWizardState(tender)
  const navigation = useWizardNavigation(state)
  const validation = useWizardValidation(state)
  const persistence = useWizardPersistence(state)

  const steps = [
    <RegistrationStep {...stepProps} />,
    <TechnicalStep {...stepProps} />,
    <FinancialStep {...stepProps} />,
    <ReviewStep {...stepProps} />,
    <SubmitStep {...stepProps} />
  ]

  return (
    <WizardLayout>
      <WizardProgress current={state.currentStep} total={5} />
      {steps[state.currentStep]}
      <WizardNavigation {...navigation} />
    </WizardLayout>
  )
}
```

#### المخرجات المتوقعة

- ✅ TenderPricingWizard من 1,540 إلى 250 سطر (تقليل 84%)
- ✅ 5 مكونات خطوات (990 سطر)
- ✅ 4 مكونات واجهة (280 سطر)
- ✅ 4 hooks (550 سطر)
- ✅ **توفير صافي: ~(-530) سطر** (زيادة بسبب التنظيم، لكن أسهل للصيانة)

---

### المرحلة 5: تفكيك NewTenderForm.tsx (أسبوع واحد)

#### الهيكل المستهدف

```
src/presentation/pages/Tenders/components/NewTenderForm/
├── NewTenderFormContainer.tsx (300 سطر)
├── sections/
│   ├── BasicInfoSection.tsx (200 سطر)
│   ├── ProjectDetailsSection.tsx (180 سطر)
│   ├── QuantityTableSection.tsx (250 سطر)
│   └── AttachmentsSection.tsx (150 سطر)
├── components/
│   ├── FormField.tsx (60 سطر)
│   ├── QuantityRow.tsx (80 سطر)
│   ├── ExcelImportButton.tsx (100 سطر)
│   └── FormActions.tsx (80 سطر)
└── hooks/
    ├── useNewTenderForm.ts (150 سطر)
    ├── useTenderValidation.ts (180 سطر)
    ├── useExcelImport.ts (120 سطر)
    └── useQuantityTable.ts (200 سطر)
```

#### المهام التفصيلية

##### يوم 1: إنشاء Hooks الأساسية

1. **useNewTenderForm.ts** (150 سطر)
2. **useTenderValidation.ts** (180 سطر)
3. **useExcelImport.ts** (120 سطر)
4. **useQuantityTable.ts** (200 سطر)

##### يوم 2-3: إنشاء Sections

1. **BasicInfoSection.tsx** (200 سطر)
2. **ProjectDetailsSection.tsx** (180 سطر)
3. **QuantityTableSection.tsx** (250 سطر)
4. **AttachmentsSection.tsx** (150 سطر)

##### يوم 4: إنشاء مكونات صغيرة

1. **FormField.tsx** (60 سطر)
2. **QuantityRow.tsx** (80 سطر)
3. **ExcelImportButton.tsx** (100 سطر)
4. **FormActions.tsx** (80 سطر)

##### يوم 5: التجميع والاختبار

```typescript
// NewTenderFormContainer.tsx (300 سطر)
export function NewTenderFormContainer({ existingTender, onSave, onBack }: Props) {
  const form = useNewTenderForm(existingTender)
  const validation = useTenderValidation(form.data)
  const excelImport = useExcelImport()
  const quantityTable = useQuantityTable(form.data.quantities)

  return (
    <FormLayout>
      <BasicInfoSection form={form} validation={validation} />
      <ProjectDetailsSection form={form} validation={validation} />
      <QuantityTableSection
        table={quantityTable}
        onImport={excelImport.importFromExcel}
      />
      <AttachmentsSection form={form} />
      <FormActions
        onSave={form.handleSave}
        onBack={onBack}
        isValid={validation.isValid}
      />
    </FormLayout>
  )
}
```

#### المخرجات المتوقعة

- ✅ NewTenderForm من 1,102 إلى 300 سطر (تقليل 73%)
- ✅ 4 sections (780 سطر)
- ✅ 4 مكونات صغيرة (320 سطر)
- ✅ 4 hooks (650 سطر)
- ✅ **توفير صافي: ~(-648) سطر** (زيادة بسبب التنظيم)

---

### المرحلة 6: تفكيك TendersPage.tsx (3 أيام)

#### الهيكل المستهدف

```
src/presentation/pages/Tenders/TendersPage/
├── TendersPageContainer.tsx (250 سطر)
├── components/
│   ├── TendersGrid.tsx (200 سطر)
│   ├── TendersFilters.tsx (150 سطر)
│   ├── TenderActions.tsx (100 سطر)
│   └── TendersStats.tsx (120 سطر)
└── hooks/
    ├── useTendersFilters.ts (100 سطر)
    └── useTendersActions.ts (80 سطر)
```

#### المهام التفصيلية

##### يوم 1: إنشاء Hooks

1. **useTendersFilters.ts** (100 سطر)
2. **useTendersActions.ts** (80 سطر)

##### يوم 2: إنشاء المكونات

1. **TendersGrid.tsx** (200 سطر)
2. **TendersFilters.tsx** (150 سطر)
3. **TenderActions.tsx** (100 سطر)
4. **TendersStats.tsx** (120 سطر)

##### يوم 3: التجميع

```typescript
// TendersPageContainer.tsx (250 سطر)
export function TendersPageContainer() {
  const { tenders, isLoading } = useTenders()
  const filters = useTendersFilters(tenders)
  const actions = useTendersActions()

  return (
    <PageLayout>
      <TendersStats tenders={filters.filtered} />
      <TendersFilters filters={filters} />
      <TendersGrid tenders={filters.filtered} actions={actions} />
      <TenderActions actions={actions} />
    </PageLayout>
  )
}
```

#### المخرجات المتوقعة

- ✅ TendersPage من 855 إلى 250 سطر (تقليل 71%)
- ✅ 4 مكونات (570 سطر)
- ✅ 2 hooks (180 سطر)
- ✅ **توفير صافي: ~(-145) سطر**

---

### المرحلة 7: توحيد المنطق المكرر (أسبوع واحد)

#### الأهداف

- إنشاء Hooks مشتركة للمنطق المكرر
- حذف التكرارات من جميع الملفات
- توحيد أنماط الكود

#### المهام

##### يوم 1-2: إنشاء Hooks مركزية

**1. useTenderValidation.ts** (200 سطر)

```typescript
// توحيد جميع قواعد التحقق
export function useTenderValidation(tender: Partial<Tender>) {
  const validateBasicInfo = () => { ... }
  const validateQuantities = () => { ... }
  const validatePricing = () => { ... }
  const validateAttachments = () => { ... }

  return {
    isValid,
    errors,
    validateBasicInfo,
    validateQuantities,
    validatePricing,
    validateAttachments
  }
}
```

**2. useTenderOperations.ts** (180 سطر)

```typescript
// توحيد العمليات المشتركة
export function useTenderOperations() {
  const createTender = async (data) => { ... }
  const updateTender = async (id, data) => { ... }
  const deleteTender = async (id) => { ... }
  const submitTender = async (id) => { ... }

  return {
    createTender,
    updateTender,
    deleteTender,
    submitTender,
    isLoading,
    error
  }
}
```

**3. useTenderFormatting.ts** (120 سطر)

```typescript
// توحيد عمليات التنسيق
export function useTenderFormatting() {
  const formatCurrency = (value) => { ... }
  const formatDate = (value) => { ... }
  const formatQuantity = (value) => { ... }
  const formatStatus = (status) => { ... }

  return {
    formatCurrency,
    formatDate,
    formatQuantity,
    formatStatus
  }
}
```

##### يوم 3-5: إزالة التكرارات

**الاستراتيجية:**

1. تحديد جميع التكرارات في الكود
2. استبدالها بالـ Hooks الجديدة
3. اختبار كل تغيير

**المناطق المستهدفة:**

```typescript
// قبل: تكرار في 4 ملفات
const calculateTotal = () => {
  // ... نفس المنطق في كل ملف
}

// بعد: استخدام hook واحد
const { totals } = useTenderPricingCalculations(...)
```

#### المخرجات المتوقعة

- ✅ 3 hooks مركزية جديدة (500 سطر)
- ✅ حذف تكرارات من 8 ملفات
- ✅ **توفير صافي: ~1,200 سطر**

---

### المرحلة 8: تحسين الاختبارات (أسبوع واحد)

#### الأهداف

- رفع التغطية الاختبارية من الحالي إلى 75%+
- إضافة اختبارات للمكونات الجديدة
- إنشاء Integration Tests
- إعداد E2E Tests

#### المهام

##### يوم 1-2: Unit Tests للـ Hooks

```typescript
// useTenderPricingCalculations.test.ts
describe('useTenderPricingCalculations', () => {
  it('should calculate totals correctly', () => {
    // ...
  })

  it('should handle empty data', () => {
    // ...
  })

  it('should apply percentages correctly', () => {
    // ...
  })
})
```

**الهدف:** 40 اختبار جديد للـ Hooks

##### يوم 3-4: Component Tests

```typescript
// TenderPricingPageContainer.test.tsx
describe('TenderPricingPageContainer', () => {
  it('should render correctly', () => {
    // ...
  })

  it('should save data on button click', () => {
    // ...
  })

  it('should show validation errors', () => {
    // ...
  })
})
```

**الهدف:** 30 اختبار جديد للمكونات

##### يوم 5: Integration Tests

```typescript
// tenderPricingFlow.integration.test.tsx
describe('Tender Pricing Flow', () => {
  it('should complete full pricing workflow', async () => {
    // 1. إنشاء منافسة
    // 2. فتح صفحة التسعير
    // 3. إدخال البيانات
    // 4. الحفظ
    // 5. التحقق من النتائج
  })
})
```

**الهدف:** 10 اختبارات تكامل شاملة

##### يوم 6-7: E2E Tests (Playwright)

```typescript
// tenderManagement.e2e.ts
test('complete tender lifecycle', async ({ page }) => {
  // 1. إنشاء منافسة جديدة
  await page.goto('/tenders')
  await page.click('[data-testid="new-tender-btn"]')
  // ... باقي الخطوات

  // 2. التسعير
  // 3. رفع الملفات
  // 4. التقديم
  // 5. متابعة النتائج
})
```

**الهدف:** 5 اختبارات E2E شاملة

#### المخرجات المتوقعة

- ✅ 40 Unit Tests للـ Hooks
- ✅ 30 Component Tests
- ✅ 10 Integration Tests
- ✅ 5 E2E Tests
- ✅ **التغطية: 75%+**

---

## 📊 ملخص التوفير المتوقع

### قبل التحسين

| الفئة                   | العدد | الأسطر |
| ----------------------- | ----- | ------ |
| إجمالي الملفات          | 39    | 18,119 |
| ملفات كبيرة (>1000)     | 5     | 6,512  |
| ملفات قديمة             | 4     | 5,535  |
| ملفات متوسطة (700-1000) | 2     | 1,757  |
| ملفات صغيرة (<700)      | 28    | 4,315  |

### بعد التحسين

| الفئة                   | العدد | الأسطر  |
| ----------------------- | ----- | ------- |
| إجمالي الملفات          | 60+   | ~12,000 |
| ملفات كبيرة (>1000)     | 0     | 0       |
| ملفات قديمة             | 0     | 0       |
| ملفات متوسطة (700-1000) | 0     | 0       |
| ملفات صغيرة (<700)      | 60+   | ~12,000 |

### التوفير التفصيلي

| المرحلة                        | التوفير              |
| ------------------------------ | -------------------- |
| حذف الملفات القديمة            | -5,535 سطر           |
| تنظيف الاستيرادات والكود الميت | -500 سطر             |
| تفكيك TenderPricingPage        | -835 سطر             |
| تفكيك TenderDetails            | -980 سطر             |
| تفكيك TenderPricingWizard      | +530 سطر             |
| تفكيك NewTenderForm            | +648 سطر             |
| تفكيك TendersPage              | +145 سطر             |
| توحيد المنطق المكرر            | -1,200 سطر           |
| **الإجمالي**                   | **-6,119 سطر (33%)** |

---

## 🎯 معايير النجاح

### 1. معايير الكود

- ✅ لا يوجد ملف أكبر من 700 سطر
- ✅ تغطية اختبارية 75%+
- ✅ صفر تحذيرات ESLint
- ✅ صفر أخطاء TypeScript
- ✅ Bundle Size أصغر بنسبة 20%+

### 2. معايير الأداء

- ✅ زمن تحميل الصفحة أقل بنسبة 40%+
- ✅ First Contentful Paint < 1.5s
- ✅ Time to Interactive < 3s
- ✅ Lighthouse Score > 90

### 3. معايير الصيانة

- ✅ كل ملف له مسؤولية واحدة واضحة
- ✅ فصل واضح بين Presentation و Business Logic
- ✅ لا توجد استيرادات دائرية
- ✅ توثيق شامل للمكونات والـ Hooks

### 4. معايير التجربة

- ✅ جميع الوظائف تعمل كما هي
- ✅ لا توجد انحدارات (Regressions)
- ✅ تجربة مستخدم محسّنة
- ✅ رسائل خطأ واضحة ومفيدة

---

## 🚨 المخاطر وخطط التخفيف

### خطر 1: انحدارات في الوظائف

**الاحتمالية:** متوسطة  
**التأثير:** عالي

**خطة التخفيف:**

- ✅ كتابة اختبارات شاملة قبل التغيير
- ✅ مراجعة كود دقيقة لكل PR
- ✅ اختبار يدوي شامل بعد كل مرحلة
- ✅ الاحتفاظ بنسخ احتياطية

### خطر 2: تأخير الجدول الزمني

**الاحتمالية:** متوسطة  
**التأثير:** متوسط

**خطة التخفيف:**

- ✅ تقسيم العمل إلى مراحل صغيرة
- ✅ مراجعة يومية للتقدم
- ✅ تحديد الأولويات بوضوح
- ✅ buffer time لكل مرحلة

### خطر 3: صعوبة الدمج (Merge Conflicts)

**الاحتمالية:** عالية  
**التأثير:** منخفض

**خطة التخفيف:**

- ✅ العمل في فرع مخصص
- ✅ مزامنة متكررة مع الفرع الرئيسي
- ✅ دمج صغير ومتكرر
- ✅ استخدام أدوات الدمج المتقدمة

### خطر 4: مقاومة التغيير من الفريق

**الاحتمالية:** منخفضة  
**التأثير:** متوسط

**خطة التخفيف:**

- ✅ شرح الفوائد بوضوح
- ✅ إشراك الفريق في القرارات
- ✅ توفير توثيق شامل
- ✅ جلسات تدريبية

---

## 📚 التوثيق المطلوب

### 1. توثيق فني

- ✅ معمارية النظام الجديدة
- ✅ دليل الـ Hooks والمكونات
- ✅ أمثلة الاستخدام
- ✅ أفضل الممارسات

### 2. توثيق المطورين

- ✅ دليل المساهمة
- ✅ معايير الكود
- ✅ دليل الاختبارات
- ✅ دليل استكشاف الأخطاء

### 3. توثيق المستخدم

- ✅ دليل استخدام التسعير
- ✅ دليل إدارة المنافسات
- ✅ الأسئلة الشائعة
- ✅ فيديوهات تعليمية

---

## ✅ Checklist النهائي

### قبل البدء

- [ ] مراجعة الخطة مع الفريق
- [ ] الموافقة على الجدول الزمني
- [ ] إعداد بيئة التطوير
- [ ] إنشاء الفرع الجديد
- [ ] توثيق Baseline

### أثناء التنفيذ

- [ ] متابعة يومية للتقدم
- [ ] مراجعة كود أسبوعية
- [ ] اختبارات مستمرة
- [ ] تحديث التوثيق
- [ ] تواصل مع الفريق

### بعد الإنجاز

- [ ] اختبار شامل
- [ ] مراجعة نهائية للكود
- [ ] تحديث التوثيق
- [ ] قياس النتائج
- [ ] تقرير الإنجاز
- [ ] احتفال بالنجاح! 🎉

---

## 📞 جهات الاتصال

### مسؤول المشروع

- الاسم: [ضع الاسم]
- البريد الإلكتروني: [ضع البريد]
- الدور: إدارة المشروع والمتابعة

### المطور الرئيسي

- الاسم: GitHub Copilot + فريق التطوير
- الدور: التنفيذ التقني

### مراجع الكود

- الاسم: [ضع الاسم]
- الدور: مراجعة الجودة والمعايير

---

**تمت كتابة هذه الخطة بواسطة:** GitHub Copilot  
**التاريخ:** 23 أكتوبر 2025  
**الإصدار:** 1.0

🚀 **جاهزون للبدء؟ لنبدأ في تحسين نظام المنافسات!**
