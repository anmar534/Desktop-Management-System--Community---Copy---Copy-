# 2025-09 BOQ Pricing Unification Migration

تم في سبتمبر 2025 تنفيذ إحلال كامل لمسار التسعير القديم (snapshots + dual-write + diff) والاعتماد على مصدر واحد فقط: بيانات الـ BOQ المركزية.

## الأهداف

- تبسيط المنظومة وإزالة التعقيد (snapshot hashing / integrity / diff).
- إزالة مخاطر التباين بين عدة مصادر (legacy hook, snapshot, central BOQ).
- تسريع عمليات التعديل وعرض الأسعار.
- تقليل حجم الشفرة ومسارات الفشل المحتملة.

## ما تم حذفه

| الوحدة | الحالة |
|--------|--------|
| `src/pricing/snapshotCompute.ts` | Removed |
| `src/pricing/snapshotModel.ts` | Removed |
| `src/pricing/snapshotStorage.ts` | Removed |
| `src/pricing/snapshotMetrics.ts` | Removed |
| `src/domain/entities/snapshot.ts` | Legacy shim → re-exported from `src/domain/model.ts` |
| `src/domain/services/snapshotService.ts` | Legacy shim (empty) |
| `src/domain/services/diffService.ts` | Kept (parity tests rely on diffing) |
| `src/domain/services/dualWritePricing.ts` | Legacy shim (empty) |
| Skipped legacy tests (runtime/metrics/diff/snapshot) | Deleted |

## التعديلات الرئيسية

- تحديث `useUnifiedTenderPricing` لإزالة منطق divergence والسnapshot placeholders.
- تبسيط `pricingRuntimeMonitor` ليحتفظ بعداد واحد فقط: `domainComputations`.
- تنظيف واجهة المستخدم من أي شارات أو نصوص مرتبطة بالـ Snapshot.
- إزالة عدادات dual-write من سجل الصحة في `main.tsx`.

## ما بقي مقصوداً

- بعض التعليقات التاريخية داخل الشفرة (Marked Removed 2025-09) ستُنظَّف لاحقاً أو تُستبدل بمراجع لهذه الوثيقة.
- الحقول `sourceSnapshotId` داخل بعض الجداول/الموديلات ستُقيَّم لاحقاً (قد تزال في ترقية لاحقة لقاعدة البيانات إذا ثبت عدم الحاجة لها).

## اعتبارات مستقبلية

- في حال الحاجة لتحليل تطوري (Historical Auditing) يمكن إضافة Layer خارجي (Export/Rebuild) بدلاً من تخزين snapshot دائم.
- يمكن إضافة آلية تحقق خفيفة (Lightweight Consistency Check) لاحقاً معتمدة مباشرة على إعادة حساب مجموع الـ BOQ لتأكيد السلامة بدون هيكل snapshot كامل.

## مؤشرات نجاح

- نجاح جميع الاختبارات (Vitest) بدون أي تحذيرات مرتبطة بـ snapshot أو dual-write.
- تقليل زمن التحديث عند تحرير الأسعار.
- انخفاض التعقيدات (Lines of Code & Modules) في طبقة التسعير.

## خطوات لاحقة (Optional)

- ترحيل الحقل `sourceSnapshotId` من مخطط قاعدة البيانات.
- حذف التعليقات المتكررة الخاصة بالإزالة بعد دمج نهائي.
- تحديث دليل README لإزالة أي إشارات تاريخية لم تعد ذات صلة.

---
تم إنشاء هذه الوثيقة آلياً لدعم المراجعة وعمليات الـ PR.
