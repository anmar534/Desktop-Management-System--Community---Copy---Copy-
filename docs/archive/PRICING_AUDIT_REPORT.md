# تقرير تدقيق منظومة التسعير (Pricing Audit Report)

التاريخ: 2025-09-19  
النطاق: مكونات التسعير، التطبيع، التخزين، وإظهار التفاصيل (TenderPricingProcess / TenderDetails / pricingEngine / normalizePricing / pricingService) + نقاط التكرار الحسابي.

---

## 1. ملخص تنفيذي (Executive Summary)

تم إنشاء محرك مركزي `pricingEngine` لتوحيد الحسابات (Breakdown + Percentages + Totals + VAT) لكنه غير مُعتَمَد بعد في مكونات الإنتاج الأساسية. حالياً تُكرر المعادلات في ثلاثة مواضع (أعلى مخاطرة للانحراف). هذا التقرير يُقدّم:  

- جرد حقول (inventory.json)  
- رسم تبعيات (pricing-deps.dot)  
- كتالوج تكرار (DUPLICATION_CATALOG.json)  
- خطة دمج مرحلي آمن تقلل المخاطر وتُبقي قابلية التراجع (rollback) عالية.

أولوية الإصلاح: 1) إزالة تكرار ArithmeticCore 2) توحيد نسب الافتراض 3) اعتماد التجميع النهائي من المحرك 4) توحيد وصف البند 5) توحيد اشتقاق سعر الوحدة.

---

## 2. نموذج البيانات (Data Model Schema)

الفئات المنطقية:

- Descriptive: description (+ aliases)
- Quantity & Units: unit, quantity
- Cost Components (Arrays): materials, labor, equipment, subcontractors
- Percentage Adders: adminPercentage, operationalPercentage, profitPercentage (مصدرها DEFAULT_PERCENTAGES أو additionalPercentages لكل بند)
- Derived Totals: subtotal, breakdown.{...}, unitPrice, totalPrice, vatAmount, totalWithVat
- Meta / Storage: defaultPercentages, lastUpdated, version, additionalPercentages, __raw

العلاقات:

subtotal = Σ(cost components)  
percentageCost = subtotal * (percentage / 100)  
total (per item) = subtotal + Σ(percentageCosts)  
unitPrice = total / quantity (مع حماية من القسمة على صفر)  
Aggregate: totalValue = Σ(totalPrice)، vatAmount=15%، totalWithVat=+15%.

---

## 3. حصر الحقول (Field Inventory)

راجع الملف: `inventory.json`  
نقاط بارزة:

- وصف البند يعتمد 11 alias.  
- price derivation يظهر مسارين (normalize vs engine).  
- VAT محصور داخل `aggregateTotals` فقط (الوضع الصحيح).  
- بيانات breakdown تُبنى يدوياً في المكونات بدلاً من استدعاء `computeBreakdown`.

مخاطر رئيسية:

1. Divergence: أي تعديل مستقبلي في النسب أو طريقة التدوير لن ينتقل تلقائياً.  
2. Placeholder Leakage: وحدات افتراضية '—' تظهر إن لم يتم التطبيع مبكراً.  
3. Rounding Inconsistency: فرق بين toFixed(2) وتخزين القيم الخام قد يخلق فروقات بواجهات مختلفة.

---

## 4. رسم التبعيات (Dependency Graph)

ملف: `pricing-deps.dot`  
الوضع الحالي: `pricingEngine` معزول (لا واردات إليه من المكونات).  
الوضع المستهدف: TenderPricingProcess و TenderDetails و unifiedCalculations تعتمد المحرك مباشرة.

رموز الرسم:

- Solid: وارد قائم.  
- Green Dashed: تبنٍّ مخطط.  
- Dotted: استخدام غير مباشر أو قيم.

---

## 5. كتالوج التكرار (Duplication Catalog)

ملف: `DUPLICATION_CATALOG.json`  
العنقود الأعلى خطورة: ArithmeticCore (3 مواقع).  
النسب الافتراضية مكررة في ثلاثة أماكن (PercentagesDefaults).  
TotalsAggregation جزئي (يجب توحيده بسرعة بعد دمج المحرك في المكونات).

---

## 6. تحليل المخاطر (Risk Analysis)

| عامل | التأثير | الاحتمال | التقييم | التخفيف |
|------|---------|----------|---------|---------|
| تكرار الحساب الأساسي | خطأ أسعار شامل | متوسط | مرتفع | توحيد عبر pricingEngine |
| اختلاف نسب افتراضية | انحراف هوامش | متوسط | مرتفع | مصدر واحد DEFAULT_PERCENTAGES |
| اختلاف اشتقاق unitPrice | فروقات ظاهرية | منخفض | متوسط | اعتماد enrichPricingItems |
| وصف غير متسق | ارتباك المستخدم والبحث | متوسط | متوسط | getCanonicalDescription |
| حسابات إجمالية مستقلة | أرقام Dashboard خاطئة | متوسط | متوسط | aggregateTotals |

---

## 7. خطة الدمج المرحلية (Phased Integration Plan)

### المرحلة 1 (Safe Adoption – Read Path)

- استدعاء `enrichPricingItems` في `TenderDetails` بدل المنطق اليدوي.  
- استخدام `aggregateTotals` لبطاقات الملخص.  
- إبقاء الكود القديم خلف فلاغ (قابل للإزالة لاحقاً) أو تعليق كتلة قديمة مؤقتاً.

### المرحلة 2 (Write/Authoring Path)

- في `TenderPricingProcess`: إزالة إنشاء breakdown اليدوي.  
- عند التغيير، بناء نموذج خام (materials/labor/...) ثم تمريره إلى محرك enrichment للحصول على unitPrice + totalPrice + breakdown.  
- حفظ النسب في additionalPercentages فقط؛ عدم تكرار defaultPercentages محلياً.

### المرحلة 3 (Analytics Alignment)

- تحديث أي وحدة إحصائية (unifiedCalculations أو مستقبلية) لتستهلك نفس enriched dataset بدلاً من إعادة subtotal.

### المرحلة 4 (Field Helpers)

- إضافة `getCanonicalDescription(raw: any): string` + توثيق alias array (تُسحب من normalizePricing).  
- توحيد إستراتيجية rounding (toFixed أثناء العرض فقط، تخزين أرقام float أصلية للحسابات).

### المرحلة 5 (Hardening & Cleanup)

- إزالة الكتل القديمة ورفع إصدار المخطط (schema version bump = 2).  
- إضافة اختبار snapshot لهيكل breakdown.

---

## 8. إستراتيجية الاختبارات (Testing Strategy)

اختبارات حرجة:

1. Breakdown Integrity: لكل بند (subtotal = Σ components) و total = subtotal + admin + operational + profit.  
2. Percentage Override: بند بنسبة مخصصة يعكس القيمة الصحيحة دون تأثير على آخرين.  
3. Zero Quantity: unitPrice = total (لا قسمة) مع إشارة isPriced صحيحة.  
4. VAT Aggregation: vatAmount = totalValue * 0.15 بدقة سنتين.  
5. Description Canonicalization: جميع الحقول alias تُنتج نفس description.

أدوات مقترحة: Vitest + factory helpers (بناء بند بمواد/عمالة) + snapshot لهيكل enriched item.

---

## 9. واجهات موحدة مقترحة (Unified Interfaces)

```ts
export interface PricingItemInput { id: string; description?: string; unit?: string; quantity?: number; materials?: any[]; labor?: any[]; equipment?: any[]; subcontractors?: any[]; additionalPercentages?: Partial<DefaultPercentages>; }
export interface CanonicalPricingItem extends EnrichedPricingItem {}
export function getCanonicalDescription(raw: any): string { /* يقرأ نفس alias من normalizePricing */ }
```

النهج: مكوّن الإنشاء (Authoring) يبني PricingItemInput → محرك enrichment → تخزين + بث حدث موحد.

---

## 10. مؤشرات إنهاء النجاح (Success Criteria)

- لا توجد حسابات subtotal/percentage خارج `pricingEngine`.  
- رسم التبعيات بعد الدمج يُظهر واردات فعلية إلى `pricingEngine` من المكونات.  
- جميع القيم المعروضة في Pricing و Details متطابقة عددياً (diff tests = 0).  
- إزالة التكرارات في الكتالوج (ArithmeticCore و TotalsAggregation مؤشرة كمحلولة).  
- إضافة 5 اختبارات وحدة تغطي السيناريوهات الحرجة.

---

## 11. خطة التراجع (Rollback Plan)

- إبقاء نسخة من المكونات قبل الدمج (git tag: pricing-pre-engine-adoption).  
- إذا ظهر اختلاف أسعار > 0.5% في مقارنة مخرجات الاختبار بعد الدمج:  
  1) عودة سريعة للوسم.  2) استخراج حالات البنود المسببة.  3) تعديل computeBreakdown وفق السياسة (مثلاً التدوير أو تجاهل عنصر ناقص).  

---

## 12. تحسينات مستقبلية (Future Enhancements)

- دعم نسبة VAT متغيرة (configurable).  
- دعم Discount layer قبل profit.  
- Cache Layer: memoization حسب (hash(components + percentages)).  
- توسعة breakdown لتشمل costPerUnit لكل عنصر.  
- تصدير تقرير PDF تلخيصي للبنود مع breakdown.

---

## 13. الخلاصة

الهيكلة الحالية ناضجة للانتقال إلى مركزية الحسابات. المخاطرة الأساسية متركزة في الانحراف الحسابي بسبب التكرار. اعتماد المحرك سيقلل التعقيد ويُبسّط أي تعديل مستقبلي للسياسات (نسب أو VAT). الملفات الداعمة في المستودع الآن تمهد لعملية دمج قابلة للتتبع.

الملفات المنتَجة:

- `inventory.json`
- `pricing-deps.dot`
- `DUPLICATION_CATALOG.json`
- هذا التقرير: `PRICING_AUDIT_REPORT.md`

انتهى.
