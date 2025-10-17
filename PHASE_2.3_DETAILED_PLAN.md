# Phase 2.3: خطة التوسع في التغطية الاختبارية - خطة تفصيلية

## 📋 نظرة عامة

**الهدف الرئيسي:** رفع نسبة التغطية الاختبارية من 8.12% إلى 50%+ مع التركيز على الأجزاء الحرجة

**المدة المتوقعة:** 3-4 أسابيع

**الحالة الحالية:**

- ✅ Phase 2.1: Storage Refactoring - مكتمل 100%
- ✅ Phase 2.2: Test Coverage Improvement - مكتمل 100%
- 🎯 Phase 2.3: Coverage Expansion - قيد التخطيط
- ⏳ Phase 2.4: Legacy Tests Analysis - معلق

---

## 📊 تحليل الوضع الحالي

### نتائج التغطية الحالية

| الفئة                | التغطية | الحالة        | الأولوية |
| -------------------- | ------- | ------------- | -------- |
| **Overall**          | 8.12%   | 🔴 منخفض جداً | حرج      |
| **Storage Modules**  | 87.83%  | 🟢 ممتاز      | منخفض    |
| **Storage Core**     | 81.28%  | 🟢 قوي        | منخفض    |
| **Storage Adapters** | 64.40%  | 🟡 جيد        | متوسط    |
| **Services**         | 0%      | 🔴 لا يوجد    | **حرج**  |
| **Utils**            | 17.93%  | 🔴 ضعيف       | عالي     |
| **Components**       | 0%      | 🔴 لا يوجد    | عالي     |

### الملفات الحرجة التي تحتاج اختبارات

#### 🔴 خدمات حرجة (0% تغطية)

1. **financePricingService.ts** - 837 سطر

   - حسابات التسعير المالية
   - العمليات المالية
   - إنشاء التقارير المالية
   - **التأثير:** عالي جداً (حسابات مالية دقيقة)

2. **tenderAnalysisService.ts** - 1104 سطر

   - تحليل المناقصات
   - تجميع البيانات
   - منطق الأعمال المعقد
   - **التأثير:** عالي جداً (قرارات العمل)

3. **projectManagementService.ts** - 848 سطر
   - إدارة المشاريع CRUD
   - إدارة الحالات
   - تتبع المعالم
   - **التأثير:** عالي (وظائف أساسية)

#### 🟡 أدوات مساعدة تحتاج تحسين

4. **dataMigration.ts** - 714 سطر، 0% تغطية

   - منطق تحويل البيانات
   - ترحيل الإصدارات
   - تحديثات المخطط
   - **التأثير:** عالي (سلامة البيانات)

5. **dataImport.ts** - 590 سطر، 0% تغطية

   - تحليل الملفات
   - التحقق من البيانات
   - معالجة الاستيراد
   - **التأثير:** متوسط-عالي

6. **storage.ts** - 1279 سطر، 30.26% تغطية
   - يحتاج تحسين من 30% إلى 80%
   - اختبار الحالات الاستثنائية
   - اختبار الفروع غير المغطاة

---

## 🎯 الأهداف المحددة

### أهداف التغطية الرئيسية

```
الهدف النهائي Phase 2.3:
├── التغطية الإجمالية: 8.12% → 50%+
├── الخدمات الحرجة: 0% → 70%+
├── طبقة Utils: 17.93% → 65%+
├── المكونات: 0% → 50%+
└── Storage: 64.40% → 85%+
```

### مؤشرات الأداء الرئيسية (KPIs)

1. **تغطية الكود:**

   - Statements: 50%+
   - Branches: 60%+
   - Functions: 65%+
   - Lines: 50%+

2. **جودة الاختبارات:**

   - 100% نجاح الاختبارات
   - صفر اختبارات متخطاة
   - وقت التنفيذ < 5 دقائق

3. **الامتثال:**
   - WCAG 2.1 AA للمكونات
   - معايير الأمان
   - أفضل ممارسات الاختبار

---

## 📅 الجدول الزمني التفصيلي

### الأسبوع 1: اختبار الخدمات المالية والتحليلية

#### اليوم 1-2: financePricingService.ts

**المهام:**

1. ✅ تحليل الكود وفهم منطق التسعير
2. ✅ إنشاء ملف الاختبار: `tests/services/financePricingService.test.ts`
3. ✅ اختبار الحسابات الأساسية
4. ✅ اختبار الخصومات والضرائب
5. ✅ اختبار نطاقات الأسعار
6. ✅ اختبار معالجة الفواتير
7. ✅ اختبار تتبع المدفوعات
8. ✅ اختبار التقارير المالية
9. ✅ اختبار الحالات الاستثنائية

**الهدف:** 70% تغطية

**بيانات الاختبار المطلوبة:**

```typescript
// Mock data
- Sample invoices
- Price calculations
- Tax rates (multiple regions)
- Discount scenarios
- Payment records
```

**أنماط الاختبار:**

```typescript
describe('FinancePricingService', () => {
  describe('Basic Pricing Calculations', () => {
    it('should calculate unit price correctly')
    it('should calculate total price with quantity')
    it('should apply single discount')
    it('should apply multiple discounts')
    it('should calculate tax correctly')
    it('should handle zero prices')
    it('should handle negative values gracefully')
  })

  describe('Complex Pricing', () => {
    it('should calculate tiered pricing')
    it('should apply volume discounts')
    it('should handle currency conversion')
    it('should calculate with custom formulas')
  })

  describe('Invoice Processing', () => {
    it('should create invoice from order')
    it('should update invoice status')
    it('should calculate invoice totals')
    it('should handle partial payments')
  })

  describe('Financial Reports', () => {
    it('should generate revenue report')
    it('should calculate profit margins')
    it('should group by time period')
    it('should filter by criteria')
  })

  describe('Edge Cases', () => {
    it('should handle zero quantity')
    it('should handle very large numbers')
    it('should handle rounding errors')
    it('should validate price ranges')
  })
})
```

#### اليوم 3-5: tenderAnalysisService.ts

**المهام:**

1. ✅ تحليل منطق تحليل المناقصات
2. ✅ إنشاء ملف الاختبار: `tests/services/tenderAnalysisService.test.ts`
3. ✅ اختبار تحليل البيانات الأساسية
4. ✅ اختبار التجميع والإحصائيات
5. ✅ اختبار المقارنات
6. ✅ اختبار توليد التقارير
7. ✅ اختبار الفلاتر والبحث
8. ✅ اختبار التكامل مع الخدمات الأخرى
9. ✅ اختبار الأداء مع بيانات كبيرة

**الهدف:** 70% تغطية

**سيناريوهات الاختبار:**

```typescript
describe('TenderAnalysisService', () => {
  describe('Data Analysis', () => {
    it('should analyze tender structure')
    it('should calculate tender statistics')
    it('should identify trends')
    it('should compare with historical data')
  })

  describe('Report Generation', () => {
    it('should generate summary report')
    it('should generate detailed analysis')
    it('should export to PDF')
    it('should export to Excel')
  })

  describe('Comparisons', () => {
    it('should compare multiple tenders')
    it('should rank by criteria')
    it('should calculate cost differences')
    it('should identify best value')
  })

  describe('Performance', () => {
    it('should handle 1000+ tenders')
    it('should complete analysis in <3s')
    it('should cache results')
  })
})
```

#### اليوم 6-7: projectManagementService.ts

**المهام:**

1. ✅ تحليل وظائف إدارة المشاريع
2. ✅ إنشاء ملف الاختبار: `tests/services/projectManagementService.test.ts`
3. ✅ اختبار CRUD للمشاريع
4. ✅ اختبار إدارة الحالات
5. ✅ اختبار تتبع المعالم
6. ✅ اختبار تعيين المهام
7. ✅ اختبار الجداول الزمنية
8. ✅ اختبار التقارير

**الهدف:** 70% تغطية

**أنماط الاختبار:**

```typescript
describe('ProjectManagementService', () => {
  describe('CRUD Operations', () => {
    it('should create new project')
    it('should read project by id')
    it('should update project details')
    it('should delete project')
    it('should list all projects')
    it('should search projects')
  })

  describe('Status Management', () => {
    it('should update project status')
    it('should validate status transitions')
    it('should trigger status events')
    it('should track status history')
  })

  describe('Milestone Tracking', () => {
    it('should create milestone')
    it('should mark milestone complete')
    it('should calculate progress')
    it('should identify delays')
  })

  describe('Task Assignment', () => {
    it('should assign task to user')
    it('should update task status')
    it('should track task completion')
    it('should calculate workload')
  })
})
```

**المخرجات المتوقعة للأسبوع 1:**

- ✅ 3 ملفات اختبار جديدة
- ✅ ~150-200 اختبار جديد
- ✅ تغطية الخدمات: 0% → 70%+
- ✅ Commit واحد لكل خدمة

---

### الأسبوع 2: اختبار طبقة Utils والأدوات المساعدة

#### اليوم 8-10: dataMigration.ts

**المهام:**

1. ✅ فهم منطق الترحيل
2. ✅ إنشاء: `tests/utils/dataMigration.test.ts`
3. ✅ اختبار تحويل البيانات
4. ✅ اختبار ترحيل الإصدارات
5. ✅ اختبار التحقق من البيانات
6. ✅ اختبار الاسترجاع عند الفشل
7. ✅ اختبار سلامة البيانات

**الهدف:** 65% تغطية

**بيانات الاختبار:**

```typescript
// Sample migrations
const v1Data = { /* old schema */ }
const v2Data = { /* new schema */ }
const v3Data = { /* latest schema */ }

// Test scenarios
- Migrate v1 → v2
- Migrate v2 → v3
- Migrate v1 → v3 (skip v2)
- Rollback on error
- Partial migration
- Batch migration
```

**أنماط الاختبار:**

```typescript
describe('DataMigration', () => {
  describe('Schema Transformation', () => {
    it('should transform v1 to v2 schema')
    it('should transform v2 to v3 schema')
    it('should handle missing fields')
    it('should set default values')
    it('should preserve data integrity')
  })

  describe('Version Management', () => {
    it('should detect current version')
    it('should determine migration path')
    it('should skip unnecessary migrations')
    it('should track migration history')
  })

  describe('Data Validation', () => {
    it('should validate before migration')
    it('should validate after migration')
    it('should report validation errors')
    it('should suggest fixes')
  })

  describe('Error Handling', () => {
    it('should rollback on error')
    it('should backup before migration')
    it('should restore from backup')
    it('should log migration errors')
  })

  describe('Performance', () => {
    it('should migrate 10k records in <10s')
    it('should handle memory efficiently')
    it('should support batch processing')
  })
})
```

#### اليوم 11-13: dataImport.ts

**المهام:**

1. ✅ تحليل وظائف الاستيراد
2. ✅ إنشاء: `tests/utils/dataImport.test.ts`
3. ✅ اختبار تحليل CSV
4. ✅ اختبار تحليل Excel
5. ✅ اختبار تحليل JSON
6. ✅ اختبار التحقق من البيانات
7. ✅ اختبار معالجة الأخطاء
8. ✅ اختبار تحويل البيانات

**الهدف:** 65% تغطية

**ملفات الاختبار:**

```typescript
// Sample files
- valid-data.csv
- invalid-data.csv
- large-data.csv (10k rows)
- valid-data.xlsx
- malformed-data.json
- empty-file.csv
```

**أنماط الاختبار:**

```typescript
describe('DataImport', () => {
  describe('File Parsing', () => {
    it('should parse CSV file')
    it('should parse Excel file')
    it('should parse JSON file')
    it('should detect file encoding')
    it('should handle BOM')
  })

  describe('Data Validation', () => {
    it('should validate required fields')
    it('should validate data types')
    it('should validate constraints')
    it('should report validation errors')
    it('should collect all errors')
  })

  describe('Data Transformation', () => {
    it('should map columns')
    it('should transform values')
    it('should handle defaults')
    it('should normalize data')
  })

  describe('Error Handling', () => {
    it('should handle malformed files')
    it('should handle encoding errors')
    it('should handle large files')
    it('should provide meaningful errors')
  })

  describe('Import Process', () => {
    it('should preview before import')
    it('should import in batches')
    it('should track progress')
    it('should support rollback')
  })
})
```

#### اليوم 14: storage.ts - تحسين التغطية

**المهام:**

1. ✅ تحليل الفروع غير المغطاة
2. ✅ تحديث: `tests/utils/storage.test.ts`
3. ✅ اختبار الحالات الاستثنائية
4. ✅ اختبار فروع معالجة الأخطاء
5. ✅ اختبار التكامل

**الهدف:** 30.26% → 80% تغطية

**التركيز على:**

```typescript
// Uncovered branches
- Error handling paths
- Edge cases
- Browser compatibility
- Quota exceeded scenarios
- Security validations
```

**المخرجات المتوقعة للأسبوع 2:**

- ✅ 3 ملفات اختبار جديدة/محدثة
- ✅ ~120-150 اختبار جديد
- ✅ تغطية Utils: 17.93% → 65%+
- ✅ Commits منتظمة

---

### الأسبوع 3: اختبار المكونات والواجهات

#### اليوم 15-17: اختبار النماذج (Forms)

**المكونات المستهدفة:**

- ProjectForm
- TenderForm
- ClientForm
- BOQItemForm

**المهام:**

1. ✅ إنشاء: `tests/components/forms/ProjectForm.test.tsx`
2. ✅ إنشاء: `tests/components/forms/TenderForm.test.tsx`
3. ✅ إنشاء: `tests/components/forms/ClientForm.test.tsx`
4. ✅ إنشاء: `tests/components/forms/BOQItemForm.test.tsx`

**الهدف:** 50% تغطية للنماذج

**أنماط الاختبار:**

```typescript
describe('ProjectForm', () => {
  describe('Rendering', () => {
    it('should render all fields')
    it('should render with initial values')
    it('should render in create mode')
    it('should render in edit mode')
  })

  describe('Validation', () => {
    it('should validate required fields')
    it('should validate field formats')
    it('should show validation errors')
    it('should prevent invalid submission')
  })

  describe('User Interaction', () => {
    it('should handle text input')
    it('should handle select change')
    it('should handle checkbox toggle')
    it('should handle date picker')
  })

  describe('Form Submission', () => {
    it('should submit valid form')
    it('should call onSubmit with data')
    it('should show loading state')
    it('should handle submission errors')
    it('should reset form after success')
  })

  describe('Accessibility', () => {
    it('should have proper labels')
    it('should support keyboard navigation')
    it('should announce errors to screen readers')
    it('should have proper focus management')
  })
})
```

#### اليوم 18-19: اختبار مكونات البيانات المعقدة

**المكونات المستهدفة:**

- DataTable
- BOQTable
- TenderList
- ProjectDashboard

**المهام:**

1. ✅ اختبار عرض البيانات
2. ✅ اختبار الفرز
3. ✅ اختبار التصفية
4. ✅ اختبار الترقيم
5. ✅ اختبار التحديد
6. ✅ اختبار الإجراءات

**أنماط الاختبار:**

```typescript
describe('DataTable', () => {
  describe('Data Display', () => {
    it('should render rows')
    it('should render columns')
    it('should handle empty data')
    it('should show loading state')
  })

  describe('Sorting', () => {
    it('should sort ascending')
    it('should sort descending')
    it('should sort multiple columns')
    it('should maintain sort on data update')
  })

  describe('Filtering', () => {
    it('should filter by text')
    it('should filter by date range')
    it('should filter by status')
    it('should combine multiple filters')
  })

  describe('Pagination', () => {
    it('should paginate data')
    it('should change page size')
    it('should navigate pages')
    it('should show correct total')
  })

  describe('Selection', () => {
    it('should select row')
    it('should select all')
    it('should deselect all')
    it('should handle bulk actions')
  })
})
```

#### اليوم 20-21: اختبار المكونات البصرية

**المكونات المستهدفة:**

- Charts (LineChart, BarChart, PieChart)
- Dashboard widgets
- Statistics cards
- Progress indicators

**المهام:**

1. ✅ اختبار عرض البيانات البصرية
2. ✅ اختبار التفاعل
3. ✅ اختبار التحديث الديناميكي
4. ✅ اختبار الاستجابة

**أنماط الاختبار:**

```typescript
describe('LineChart', () => {
  it('should render chart with data')
  it('should update on data change')
  it('should show tooltip on hover')
  it('should handle empty data')
  it('should be responsive')
})

describe('DashboardWidget', () => {
  it('should display title')
  it('should show loading state')
  it('should render content')
  it('should handle refresh')
  it('should support actions')
})
```

**المخرجات المتوقعة للأسبوع 3:**

- ✅ 10-15 ملف اختبار مكونات
- ✅ ~100-150 اختبار جديد
- ✅ تغطية المكونات: 0% → 50%+
- ✅ Commits يومية

---

### الأسبوع 4: اختبار إمكانية الوصول والتوثيق

#### اليوم 22-24: اختبارات إمكانية الوصول (Accessibility)

**المهام:**

1. ✅ تثبيت أدوات الاختبار:

   ```bash
   npm install --save-dev @testing-library/jest-dom
   npm install --save-dev jest-axe
   npm install --save-dev @axe-core/react
   ```

2. ✅ إنشاء: `tests/accessibility/wcag-compliance.test.tsx`

3. ✅ اختبار معايير WCAG 2.1 AA:
   - Perceivable (قابل للإدراك)
   - Operable (قابل للتشغيل)
   - Understandable (قابل للفهم)
   - Robust (قوي)

**أنماط الاختبار:**

```typescript
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

describe('Accessibility - WCAG 2.1 AA', () => {
  describe('Forms', () => {
    it('should have no a11y violations in ProjectForm', async () => {
      const { container } = render(<ProjectForm />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA labels')
    it('should support keyboard navigation')
    it('should have proper focus indicators')
  })

  describe('Navigation', () => {
    it('should have skip links')
    it('should have landmark regions')
    it('should have proper heading hierarchy')
  })

  describe('Interactive Elements', () => {
    it('should have accessible buttons')
    it('should have accessible links')
    it('should announce state changes')
  })

  describe('Color Contrast', () => {
    it('should meet contrast ratio 4.5:1')
    it('should not rely on color alone')
  })

  describe('Screen Reader Support', () => {
    it('should have descriptive alt text')
    it('should announce loading states')
    it('should announce errors')
  })
})
```

**قائمة التحقق من WCAG 2.1 AA:**

✅ **1. Perceivable (قابل للإدراك)**

- [ ] نص بديل لجميع الصور
- [ ] تسميات للنماذج
- [ ] نسبة تباين الألوان 4.5:1
- [ ] عدم الاعتماد على اللون وحده
- [ ] محتوى يمكن تكبيره 200%

✅ **2. Operable (قابل للتشغيل)**

- [ ] الوصول لجميع الوظائف عبر لوحة المفاتيح
- [ ] عدم وجود فخاخ لوحة المفاتيح
- [ ] مؤشرات التركيز واضحة
- [ ] وقت كافٍ لإكمال المهام
- [ ] روابط تخطي للمحتوى الرئيسي

✅ **3. Understandable (قابل للفهم)**

- [ ] لغة الصفحة محددة
- [ ] التنقل متسق
- [ ] التسميات واضحة
- [ ] رسائل الخطأ مفيدة
- [ ] المساعدة متوفرة

✅ **4. Robust (قوي)**

- [ ] HTML صالح
- [ ] ARIA مستخدمة بشكل صحيح
- [ ] متوافق مع قارئات الشاشة
- [ ] يعمل على متصفحات مختلفة

#### اليوم 25-26: اختبارات التكامل الشاملة (E2E)

**المهام:**

1. ✅ إنشاء: `tests/e2e/critical-flows.test.ts`
2. ✅ اختبار التدفقات الحرجة:
   - إنشاء مشروع كامل
   - إنشاء مناقصة وتحليلها
   - إدارة BOQ
   - توليد التقارير

**سيناريوهات E2E:**

```typescript
describe('E2E: Complete Project Workflow', () => {
  it('should create project, add tender, analyze, and generate report', async () => {
    // 1. Create new project
    await createProject({
      name: 'Test Project',
      client: 'Test Client',
    })

    // 2. Add tender
    await addTender({
      projectId: 'project-1',
      amount: 100000,
    })

    // 3. Add BOQ items
    await addBOQItems([
      { description: 'Item 1', quantity: 10, price: 1000 },
      { description: 'Item 2', quantity: 5, price: 2000 },
    ])

    // 4. Run analysis
    const analysis = await analyzeTender()
    expect(analysis.totalCost).toBe(20000)

    // 5. Generate report
    const report = await generateReport()
    expect(report).toBeDefined()
  })
})
```

#### اليوم 27-28: التوثيق والمراجعة النهائية

**المهام:**

1. ✅ إنشاء: `PHASE_2.3_COMPLETION_REPORT.md`
2. ✅ تحديث: `TESTING_GUIDE.md`
3. ✅ إنشاء: `COVERAGE_REPORT.md`
4. ✅ مراجعة جودة الاختبارات
5. ✅ تحسين الاختبارات البطيئة
6. ✅ إضافة تعليقات توضيحية

**التوثيق المطلوب:**

````markdown
# TESTING_GUIDE.md

## دليل الاختبارات

### كيفية تشغيل الاختبارات

```bash
# جميع الاختبارات
npm test

# اختبارات محددة
npm test -- financePricingService

# مع التغطية
npm run test:coverage

# وضع المراقبة
npm test -- --watch
```
````

### أنماط الاختبار

#### اختبارات الوحدة (Unit Tests)

- اختبار دالة واحدة
- بيانات وهمية (mocks/stubs)
- سريعة جداً

#### اختبارات التكامل (Integration Tests)

- اختبار عدة وحدات معاً
- قواعد بيانات وهمية
- متوسطة السرعة

#### اختبارات E2E

- اختبار التدفق الكامل
- بيئة حقيقية
- بطيئة نسبياً

### أفضل الممارسات

1. **الترتيب AAA:**

   - Arrange: تحضير البيانات
   - Act: تنفيذ الإجراء
   - Assert: التحقق من النتيجة

2. **أسماء وصفية:**

   ```typescript
   // ✅ جيد
   it('should calculate total price with 10% discount')

   // ❌ سيء
   it('test1')
   ```

3. **اختبار واحد لكل سيناريو**
4. **استقلالية الاختبارات**
5. **تنظيف بعد كل اختبار**

````

**المخرجات المتوقعة للأسبوع 4:**
- ✅ اختبارات إمكانية الوصول شاملة
- ✅ اختبارات E2E للتدفقات الحرجة
- ✅ توثيق كامل
- ✅ تقرير الإنجاز النهائي

---

## 🛠️ الأدوات والتقنيات

### أدوات الاختبار

```json
{
  "devDependencies": {
    "vitest": "^1.6.0",
    "@vitest/coverage-v8": "^1.6.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1",
    "jest-axe": "^8.0.0",
    "@axe-core/react": "^4.8.0",
    "msw": "^2.0.0"
  }
}
````

### أوامر مفيدة

```bash
# تشغيل جميع الاختبارات
npm test

# تشغيل اختبارات محددة
npm test -- services/financePricing

# تشغيل مع التغطية
npm run test:coverage

# تشغيل بوضع المراقبة
npm test -- --watch

# تشغيل اختبارات محددة فقط
npm test -- --grep "ProjectForm"

# تحديث snapshots
npm test -- -u

# عرض التغطية في المتصفح
npm run test:coverage && open coverage/index.html
```

---

## 📊 معايير النجاح

### المعايير الإجبارية

1. **تغطية الكود:**

   - ✅ التغطية الإجمالية: 50%+
   - ✅ الخدمات الحرجة: 70%+
   - ✅ طبقة Utils: 65%+
   - ✅ المكونات: 50%+

2. **جودة الاختبارات:**

   - ✅ 100% نجاح جميع الاختبارات
   - ✅ صفر اختبارات متخطاة
   - ✅ وقت التنفيذ < 5 دقائق
   - ✅ لا توجد تحذيرات

3. **إمكانية الوصول:**

   - ✅ WCAG 2.1 AA compliance
   - ✅ صفر انتهاكات axe
   - ✅ اختبار قارئ الشاشة

4. **التوثيق:**
   - ✅ دليل الاختبار كامل
   - ✅ تعليقات واضحة
   - ✅ أمثلة عملية

### المعايير الاختيارية

1. **الأداء:**

   - ⭐ اختبارات سريعة (< 100ms للوحدة)
   - ⭐ تحسين الاختبارات البطيئة
   - ⭐ Parallel execution

2. **الجودة:**
   - ⭐ Mutation testing score > 80%
   - ⭐ Code complexity monitoring
   - ⭐ Performance benchmarks

---

## 🚨 المخاطر وخطط التخفيف

### المخاطر المحتملة

1. **الوقت:**

   - 🔴 **خطر:** تجاوز الجدول الزمني
   - 🟢 **تخفيف:**
     - مراجعات يومية
     - تحديد الأولويات الصارم
     - طلب المساعدة مبكراً

2. **التعقيد:**

   - 🔴 **خطر:** الكود معقد جداً للاختبار
   - 🟢 **تخفيف:**
     - Refactoring تدريجي
     - استخدام Test Doubles
     - تبسيط السيناريوهات

3. **البيانات:**

   - 🔴 **خطر:** عدم توفر بيانات اختبار كافية
   - 🟢 **تخفيف:**
     - إنشاء Data Factories
     - استخدام Mock data generators
     - استخراج بيانات مجهولة

4. **الأداء:**

   - 🔴 **خطر:** الاختبارات بطيئة جداً
   - 🟢 **تخفيف:**
     - Parallel execution
     - تحسين setup/teardown
     - استخدام fixtures

5. **الصيانة:**
   - 🔴 **خطر:** اختبارات هشة (flaky tests)
   - 🟢 **تخفيف:**
     - تجنب الاعتماد على التوقيت
     - استقلالية الاختبارات
     - استخدام Test IDs ثابتة

---

## 📝 قائمة التحقق اليومية

### قبل البدء

- [ ] Pull آخر التحديثات من الريبو
- [ ] تشغيل `npm test` للتأكد من حالة نظيفة
- [ ] مراجعة المهام لليوم

### أثناء العمل

- [ ] كتابة الاختبارات أولاً (TDD عند الإمكان)
- [ ] تشغيل الاختبارات بشكل متكرر
- [ ] التحقق من التغطية
- [ ] إضافة تعليقات توضيحية
- [ ] Commit منتظمة (كل 1-2 ساعة)

### نهاية اليوم

- [ ] تشغيل جميع الاختبارات
- [ ] التحقق من التغطية النهائية
- [ ] مراجعة الكود
- [ ] Push للريبو
- [ ] تحديث قائمة المهام
- [ ] توثيق التقدم

---

## 📈 تتبع التقدم

### الصيغة الأسبوعية

```markdown
## تقرير الأسبوع X

### الإنجازات

- ✅ [قائمة المهام المكتملة]

### التغطية

- Before: X%
- After: Y%
- Gain: +Z%

### الاختبارات

- Tests added: N
- Tests passing: M/N

### المشاكل

- [قائمة المشاكل والحلول]

### الأسبوع القادم

- [خطة الأسبوع التالي]
```

### لوحة التحكم

```
Phase 2.3 Progress Dashboard
═══════════════════════════════════════════════════════

Overall Progress:      [████░░░░░░] 40% (Week 2 of 4)

Coverage Targets:
├── Services:          [███████░░░] 70% (Target: 70%)
├── Utils:             [█████░░░░░] 50% (Target: 65%)
├── Components:        [███░░░░░░░] 30% (Target: 50%)
└── Overall:           [████░░░░░░] 40% (Target: 50%+)

Tests:
├── Total:             450
├── Passing:           450 (100%)
├── Failing:           0
└── Coverage:          40.5%

Current Sprint:
├── Week:              2 of 4
├── Day:               10 of 28
└── On Track:          ✅ Yes
```

---

## 🎯 الخطوات التالية الفورية

### للبدء الآن:

1. **إعداد البيئة:**

   ```bash
   # التأكد من نظافة البيئة
   npm test

   # إنشاء فرع للعمل
   git checkout -b feature/phase-2.3-testing
   ```

2. **الأسبوع الأول - اليوم الأول:**

   ```bash
   # إنشاء ملف الاختبار الأول
   touch tests/services/financePricingService.test.ts
   ```

3. **البدء بأول اختبار:**

   ```typescript
   // tests/services/financePricingService.test.ts
   import { describe, it, expect } from 'vitest'
   import { FinancePricingService } from '@/services/financePricingService'

   describe('FinancePricingService', () => {
     describe('Basic Calculations', () => {
       it('should calculate unit price correctly', () => {
         // Arrange
         const service = new FinancePricingService()
         const quantity = 10
         const unitPrice = 100

         // Act
         const total = service.calculateTotal(quantity, unitPrice)

         // Assert
         expect(total).toBe(1000)
       })
     })
   })
   ```

---

## 📚 الموارد المرجعية

### التوثيق

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [jest-axe Documentation](https://github.com/nickcolley/jest-axe)

### أمثلة وأنماط

- `tests/storage/` - أمثلة من Phase 2.2
- `tests/repository/` - أنماط الاختبار الحالية
- `PHASE_2.2_COMPLETION_REPORT.md` - الدروس المستفادة

### الدعم

- GitHub Issues للمشاكل التقنية
- الفريق للمراجعات
- الوثائق للمرجعية

---

## ✅ الموافقة على الخطة

هذه الخطة التفصيلية جاهزة للتنفيذ. تحتاج إلى:

1. **مراجعة الخطة:** التأكد من الفهم الكامل
2. **تأكيد الجدول الزمني:** 3-4 أسابيع واقعي؟
3. **تخصيص الموارد:** هل أنت متفرغ للعمل؟
4. **الموافقة على البدء:** إشارة "GO" للانطلاق

**بعد الموافقة، سنبدأ مباشرة بـ:**

- إنشاء أول ملف اختبار: `financePricingService.test.ts`
- كتابة أول 10 اختبارات
- Commit أول تقدم

---

## 📞 التواصل

**للموافقة على الخطة والبدء:**

- أخبرني إذا كنت موافق على الخطة
- أخبرني إذا كان هناك تعديلات مطلوبة
- أخبرني متى تريد البدء

**هل أنت مستعد للبدء؟** 🚀
