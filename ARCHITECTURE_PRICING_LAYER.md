# Pricing Domain Layer (Unified BOQ – 2025-09)

تم تبسيط طبقة التسعير لتستند إلى مصدر وحيد (BOQ المركزي + PricingEngine). أزيلت تماماً الكيانات والخدمات التالية: Snapshot, DiffService, Dual-Write, SnapshotService. للمراجعة التاريخية راجع: `MIGRATION_2025_BOQ_UNIFICATION.md`.

## Goals (محدثة)

- فصل واضح بين العرض والمنطق والبنية التحتية.
- مصدر واحد للأسعار يمنع التباينات.
- بنية قابلة للاختبار حول `PricingEngine` فقط.
- إمكانية لاحقة لإضافة تدقيق أو حفظ تاريخي خارجي بدون إعادة snapshot.

## Directory Layout

```text
src/
  domain/
    entities/            # Core aggregates and value objects
    services/            # Pure/domain services (engine, snapshot, diff)
    repositories/        # Repository interface contracts
  application/
    services/            # Application facades orchestrating use cases
  infrastructure/
    memory/              # In-memory repository implementations (temporary)
```

## Core Entities

- BoQBase / BoQBaseItem.
- BoQPriced / BoQPricedItem.
- (Removed) Snapshot entity.

## Domain Services

- PricingEngine: الحساب والتجميع.
- (Removed) SnapshotService.
- (Removed) DiffService.

## Application Service (PricingAppService)

حاليًا يقوم فقط بتسهيل إنشاء وتحديث وحفظ السعر (بدون إنشاء snapshot أو diff). أي إشارات في الكود لتعليقات snapshot/diff تعتبر تاريخية.

## Repositories (Interfaces)

- BoQBaseRepository / BoQPricedRepository / PricedItemRepository فقط مستخدمة فعلياً.
- (Removed) SnapshotRepository / DiffRepository.

## Hashing Strategy (Deprecated)

لم يعد هناك Hashing للـ Snapshot داخلي. يمكن مستقبلاً إضافة تدقيق خفيف (إعادة حساب مجموع إجمالي) داخل أداة خارجية.

## Next Steps (Forward Looking)

1. تحسينات أداء على استعلامات BOQ الكبيرة (Pagination / Virtualization).
2. أداة خارجية للتحقق (Consistency Audit) في حال الحاجة.
3. إمكانية Export JSON أو CSV للحالات النهائية.

## Transitional Considerations (Legacy Cleaned)

تمت إزالة dual-write و snapshot وبالتالي لم تعد هناك حاجة لأعلام انتقالية.

## Minimal Example Usage

```ts
const pricing = new PricingAppService(baseRepo, pricedRepo, pricedItemRepo);
const priced = await pricing.startPricing({ baseId: 'base1', userId: 'u1', vatRate: 0.15 });
await pricing.priceItems({ pricedId: priced.id, inputs: [...], defaults: { vatRate: 0.15 } });
await pricing.finalize({ pricedId: priced.id, userId: 'u1' }); // لا ينشئ snapshot
```

## Open Questions (Reframed)

- هل نحتاج طبقة أرشفة تاريخي (External Audit Store)؟
- هل سيتم تتبع إصدارات متعددة لنفس التسعير أم يُستبدل كلياً؟

---
This skeleton is a foundation; it is intentionally light to allow iterative enrichment without blocking the legacy system.

## Phase 1 Decisions (Historic)

- Monetary model: integer cents (helpers in `src/domain/services/money.ts`).
- Migrations: manual SQL files + `schema_migrations` table (to be added in Phase 2).
- Integrity scan: verify last 20 snapshots on boot (planned service).
- Hash chain: future enhancement will add `prev_hash` + `chain_hash` (Phase 3 target).
- Removed external `uuid` dependency in favor of `crypto.randomUUID()`.
- Added foundational unit tests for PricingEngine, SnapshotService, DiffService.

## (Historic) Phase 2 Preview

- Introduce SQLite adapters + schema init script.
- Begin dual data population (optional feature flag) for parity testing.
- Add base migration utility to import legacy pricing JSON into normalized tables.

## (Historic) Phase 2 Implementation

Implemented components:

- `migrations/001_init.sql` establishing tables:
  - `boq_bases`, `boq_base_items`
  - `priced_boqs` (stores vat_rate in basis points, defaults_json for executionMethod/technicalNotes)
  - `priced_items` (integer cents columns + description, unit, completed, JSON breakdown)
  - `snapshots` (integrity_hash, totals_hash, payload_json, meta_json)
  - `diffs` (diff_json with base linkage)
  - `schema_migrations` bookkeeping
- SQLite infrastructure: `connection.ts`, `migrator.ts`, `sqliteRepos.ts`
- Repositories map domain entities with conversion between floats (domain) and integer cents (DB) using canonical rounding.
- Parity integration test (`integration.pricingParity.test.ts`) verifying arithmetic equivalence memory vs SQLite (within 2-decimal tolerance).

## Monetary Representation & Rounding Policy (Still Valid)

Policy: Round Half Up to 2 decimals BEFORE converting to integer cents.

Rationale:

- Prevents binary floating drift and double-rounding inconsistencies.
- Ensures UI-displayed values (formatted to 2 decimals) exactly match persisted integer cents.

Algorithm:

1. Receive raw component cost (float) from UI / calculation.
2. Apply: `rounded = Math.round(raw * 100 + Number.EPSILON) / 100`.
3. Convert: `cents = Math.round(rounded * 100)` (idempotent because rounded has only 2 decimals).
4. Persist `cents`.

Display:

- Read integer cents -> divide by 100 -> format (same 2 decimals).

Edge Cases:

- NaN => 0 cents.
- Negative => clamped to 0 at the domain layer if we introduce validation (planned optional guard).

## Integer Cents Adoption

Adopted early (Phase 2) to avoid later migration complexity. All cost columns in `priced_items` plus aggregate `unit_price`, `total_price`, and `subtotal_cost` are stored as integer cents.

VAT Rate Storage:

- Stored in `priced_boqs.vat_rate` as basis points (e.g., 1500 = 15.00%). Conversion to decimal: `vat = vat_rate / 10000`.

## Column vs JSON Decisions

Promoted to columns (high query/filter value):

- `description`, `unit`, `completed` in `priced_items`.

Deferred (remain JSON initially):

- `executionMethod`, `technicalNotes` (inside `defaults_json` / meta) pending reporting requirements.

## (Historic) Future Enhancements (No Longer Planned Internally)

- Snapshot chain hashing (add `prev_hash`, `chain_hash`).
- Historical priced item versioning for precise diffs across versions.
- Reporting indexes (e.g., composite over `(priced_boq_id, completed)` already present; may add cost range indexes if needed).
- Data migration utility to pull legacy local/electron store pricing into SQLite (with legacy hash stored in `meta_json`).
- Integrity verification CLI: walk snapshots, recompute hashes, report divergence.

## Parity & Validation Strategy (Legacy Context)

1. In-memory vs SQLite parity tests ensure deterministic totals.
2. Additional tolerance-based comparisons can be added for profit/admin/operational percentages.
3. Future dual-write (feature flag) can log divergences to a diagnostics table before full switchover.

---
This section documents Phase 2 live implementation and solidifies monetary & rounding policies to prevent ambiguity in future layers.

---

## Historical Note (Removed Safety Flags)

During the staged migration (Phase 2.7) a temporary emergency switch (`FEATURE_PRICING_LEGACY_FALLBACK` / `VITE_FEATURE_PRICING_LEGACY_FALLBACK`) existed to disable the domain path instantly. After full parity validation and permanent removal of the legacy compute (2025‑09‑20) this flag set was deleted. The system now operates with a single authoritative domain pricing path and dual‑write remains only as an internal persistence mechanism (until further simplification). Any references to the old fallback flag in historical commits should be ignored in new development.

---

## (Deprecated) Dual-Write & Integrity Monitoring

تم حذف هذه المرحلة نهائياً. بقيت للفهم التاريخي فقط. لا يوجد تنفيذ نشط.

### الهدف

الاتجاه التدريجي لاستبدال منطق التسعير القديم دون المخاطرة، عبر كتابة متزامنة (legacy + domain/SQLite) ثم مراقبة الفروقات قبل الإزالة النهائية.

### مكوّنات المرحلة

1. العلم (Feature Flag):
   - `FEATURE_PRICING_DUAL_WRITE` / `VITE_FEATURE_PRICING_DUAL_WRITE` → يفعّل المسار.
2. الوحدة: `dualWritePricing.ts` تقوم بـ:
   - تحويل العناصر (quantityItems + pricingMap) إلى نموذج الدومين.
   - إنشاء/ضمان وجود BoQ Base + Priced BoQ.
   - تخزين العناصر `priced_items` باستخدام التحويل إلى integer cents (نفس سياسة التقريب).
   - حساب فروق إجمالي (`totalDeltaCents`) وأقصى فرق بند (`maxItemDeltaCents`).
3. التكامل: استدعاء داخل `TenderPricingProcess` بعد إكمال الحفظ التقليدي وبث الحدث.

### تدفق التنفيذ

```text
Legacy Save (electron-store)
  └─ Broadcast pricingDataUpdated
      └─ (Flag On) dualWritePricing:
         • Build baseItems + componentInputs
         • Enrich via PricingEngine
         • Persist (boq_bases?, priced_boqs, priced_items)
         • Aggregate totals
         • Compute mismatch (legacy vs domain)
         • Log metrics (قريباً عبر pricingMetrics)
```

### سياسة الفروقات (Mismatch Policy)

- أي فرق != 0 يُسجل كمعلومة (info) حالياً.
- لاحقاً: إعداد عتبة (threshold) للتحذير (warn) عند تجاوز فرق إجمالي أو بندي.
- قياسات مبدئية:
  - totalDeltaCents
  - maxItemDeltaCents

### معايير الانتقال (Promote Domain → Primary)

يُعتبر النظام جاهزاً لإزالة المسار القديم عند تحقق جميع الشروط:

1. تشغيل dual-write في بيئة تجريبية/حلقات إنتاج منخفضة المخاطر ≥ (X) أيام.
2. لا فروقات إجمالية تتجاوز (N cents أو M%) لمدة (Y) يوم متتالٍ.
3. لا قضايا مفتوحة موسومة بـ `pricing-legacy-gap`.
4. اجتياز كامل لاختبارات parity و mismatch tests.
5. اعتماد التوثيق الجديد (PR مدمج) + توقيع المالك التقني.

### التراجع (Rollback Strategy)

- إطفاء العلم يعيد النظام فوراً إلى المسار القديم دون تأثير على استقلالية البيانات.
- بيانات domain المدخلة أثناء التفعيل لا تُستخدم عند الإطفاء لكنها تبقى مرجعية للفحص.

### تحسينات لاحقة (Phase 2.7 / Phase 3)

- توسيع mismatch metrics (عدد العناصر المتأثرة + نسبة الفرق).
- إدراج snapshots تلقائياً بعد نجاح الكتابة المزدوجة.
- ربط dual-write بسجل diff رسمي (جدول diffs) عند تجاوز العتبة.
- دعم version sequencing (بدلاً من معرف ثابت `:priced:v1`).
- ضغط/تنظيف البيانات المتقادمة بعد التثبيت.

### اعتبارات أمنية / سلامة

- جميع العمليات محاطة بـ try/catch لضمان عدم كسر تجربة المستخدم.
- لا تُحجب أي كتابة legacy اعتيادية عند فشل المسار الدوميني.
- عدم إجراء حذف أو تحديث مدمر حتى اعتماد النسخة الدومينية كمسار رئيس.

### نقاط مفتوحة

- تحديد مدة مراقبة معيارية (اقتراح: 10–14 يوم عمل).
- آلية إشعار (Telemetry / Log aggregation) خارج console.
- آلية sync عكسية (import) إن ثبت وجود فجوة وتطلب تعديل legacy بالاستفادة من domain.

---

