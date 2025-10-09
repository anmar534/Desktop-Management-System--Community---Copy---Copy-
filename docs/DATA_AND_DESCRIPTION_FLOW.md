# Data Storage & Description Flow

هذه الوثيقة توضح المسار الكامل لتخزين البيانات (العطاءات، بنود الـ BOQ، الأسعار والتكاليف، الوصف) بعد إزالة النظام القديم (snapshots / diff / dual-write) واعتماد مصدر واحد.

## 1. الهدف المعماري

- مصدر وحيد للحقيقة لبيانات التسعير: `CentralDataService` (واجهة فوق electron-store)
- جميع الصفحات (العرض / القراءة) لا تقوم بأي حسابات – فقط تقرأ القيم المخزنة.
- الحساب والتجميع (Totals) يحدث مرة واحدة في مرحلة التحرير (صفحة التسعير) ثم يُخزن.
- الوصف الكامل للبند يُستخرج ويُطبَّع عند الاستيراد (من Excel أو الإدخال اليدوي) ولا يعتمد على عمليات لاحقة أو سكربتات تصحيح.

## 2. تخزين البيانات (Persistence Layer)

| الكيان | المفتاح في التخزين | المصدر | ملاحظات |
|--------|--------------------|--------|---------|
| العطاءات (Tenders) | app_tenders_data | electron-store (أو localStorage fallback) | يحتوي تعريف العطاء بدون حسابات مشتقة |
| المشاريع (Projects) | app_projects_data | نفس المصدر | روابط العطاءات والمشتريات |
| العملاء (Clients) | app_clients_data | نفس المصدر | بيانات مرجعية |
| BOQ (التسعير) | ضمن كائن العطاء -> `boqData` | centralDataService | يحتوي العناصر + `totals` |
| العناصر (Quantity Items) | `boqData.items[]` | ناتج التحرير / الاستيراد | كل عنصر مثرى بالوصف الكامل + الأسعار |
| المجاميع (Totals) | `boqData.totals` | تُحسب أثناء التحرير وتُخزن | القراءة لاحقاً فقط |

عند تشغيل التطبيق في المتصفح (بيئة اختبار بدون Electron) تُستخدم localStorage بنفس المفاتيح لمحاكاة السلوك.

## 3. مسار الوصف (Description Pipeline)

1. الاستيراد من Excel (داخل `excelProcessor.ts`):

- يتم تحليل الصف ويُستخرج حقل الوصف (probable description) من الخلايا (عادة عمود المواصفات).
- تُنشأ الحقول: `originalDescription`, `description`, `canonicalDescription`, و `specifications` كلها بنفس القيمة الأولية (إلا إذا توفر تمييز).

2. النموذج (NewTenderForm):

- عند الحفظ: أي عنصر يفتقد أحد الحقول يتم ملؤه من الحقول المتاحة (لا يسمح بفراغ يؤدي لسقوط في واجهة العرض).

3. مرحلة التسعير (Pricing / Authoring Component):

- عند التعديل أو إدخال بنود جديدة تبقى الحقول متناسقة؛ أي تحديث للوصف يمكن أن يُخزن في `canonicalDescription` (الأكثر استقراراً) و `description`.

4. القراءة (Hooks / Views):

- `useUnifiedTenderPricing` يختار: `canonicalDescription || description || originalDescription || specifications || 'البند N'`.
- لا توجد الآن أي خوارزمية تخمين أو دمج متأخر. البيانات موثوقة لأنها طُبعت عند المصدر.

## 4. الهيكل داخل العطاء

```ts
interface BOQData {
  items: QuantityItem[]
  totals?: {
    totalValue: number
    vatAmount?: number
    vatRate?: number
    totalWithVat?: number
    profit?: number
    administrative?: number
    operational?: number
    adminOperational?: number
    profitPercentage?: number
    administrativePercentage?: number
    operationalPercentage?: number
    adminOperationalPercentage?: number
    baseSubtotal?: number
  }
  lastUpdated?: string
}

interface QuantityItem {
  id: string
  quantity: number
  unitPrice?: number
  totalPrice?: number
  estimated?: { quantity?: number; unitPrice?: number; totalPrice?: number }
  specifications?: string
  originalDescription?: string
  description?: string
  canonicalDescription?: string
  unit?: string
  // ... أي حقول إضافية (تصنيف، ملاحظات، ...)
}
```

## 5. لماذا إزالة divergence و snapshot؟

- كان divergence يُستخدم لمقارنة مسارين (legacy vs new). بعد التوحيد أصبح دائماً false.
- تم الإبقاء على حقل `divergence.hasDivergence` (قيمة ثابتة) فقط لضمان عدم كسر اختبارات أو أجزاء متبقية مؤقتاً؛ يمكن حذفه لاحقاً مع تنظيف الاختبارات.

## 6. تدفق التحديث (Update Flow)

1. المستخدم يُعدل بنداً أو نسبة ربح/إداري/تشغيلي في واجهة التحرير.
2. يتم إعادة حساب المجاميع (في نفس الصفحة) وتخزينها داخل `boqData.totals`.
3. يُرسل حدث `boqUpdated` مع `tenderId`.
4. أي صفحة عرض (تعتمد على `useUnifiedTenderPricing`) تلتقط الحدث وتُعيد قراءة البيانات بدون حساب جديد.

## 7. سياسة عدم الحساب في واجهات القراءة

- يُمنع جمع أو اشتقاق أرقام جديدة باستثناء fallback بسيط (جمع `totalPrice` إذا لم توجد totals) لضمان استمرارية العرض في حالات البيانات الجزئية.
- أي منطق حساب يجب أن يعيش حصراً في مرحلة التحرير أو خدمة مركزية مستقبلية.

## 8. أخطاء تم تجنبها سابقاً

| مشكلة قديمة | كيف حُلَّت جذرياً |
|-------------|--------------------|
| مكان الوصف غير موحد (specifications فقط أو أسماء مختزلة) | تطبيع upstream وتعدد الحقول مع ترتيب تفضيل ثابت |
| سكربتات backfill لمعالجة النقص | إزالة السكربت والاعتماد على إدخال نظيف من المصدر |
| ازدواجية مصادر التسعير (legacy tables + new BOQ) | مصدر واحد: `boqData` داخل العطاء |
| إعادة حساب عشوائي في صفحات العرض | تحويل الصفحات إلى قراءة فقط + hook موحد |

## 9. إزالة تقنية مستقبلية (Optional Cleanup Roadmap)

- إزالة حقل `divergence` و أي اختبار يعتمد عليه (بعد تأكيد عدم الحاجة له خارج الاختبارات).
- إضافة فحص سلامة (health check) عند بدء التطبيق: يتحقق أن كل بند يملك `description` غير فارغ.
- توسيع التوثيق لتشمل تدفق إدراج أوامر الشراء المرتبطة بالعطاء (PO linkage).

## 10. أسئلة سريعة (FAQ)

- ماذا يحدث إذا حقل الوصف جاء فارغاً من Excel؟
  -> تتم تعبئته تلقائياً من `specifications` أو يُنشأ placeholder أثناء التحرير؛ لا يصل للعرض فارغ.
- لماذا لا نحسب VAT في واجهة العرض؟
  -> منع التباينات وزمن التحميل؛ الحساب تم واعتمد.
- هل يمكن دعم إصدارات متعددة من المجاميع؟
  -> أضف حقلًا `history[]` داخل `boqData` عند الحاجة مستقبلاً دون مساس بالمصدر الحالي.

---
تم إعداد هذا التوثيق بعد تفكيك النظام القديم بتاريخ (2025-09) لضمان وضوح معماري واستقرار طويل الأمد.
