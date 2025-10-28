# Cleanup Backlog

Last updated: 2025-10-08

## Legend

- ✅ Done
- 🔄 In Progress
- ⏭️ Queued
- 🛑 Blocked / Needs Clarification

## Phase 0 – Completed

- ✅ `src/components`
- ✅ Legacy pricing cleanup (per previous sessions)

## Phase 1 – Core Foundations

- ✅ `src/hooks`
  - Result: removed `useTenderCalculations`, `useVirtualizedList`, and deprecated `useTenderPricing`; verified all remaining hooks have live usage in UI/services/tests.
- ✅ `src/constants`
  - Result: removed empty `systemConstants.ts`, dropped the unused folder, and confirmed no additional global constant stubs remain.
- ✅ `src/types`
  - Result: moved active contracts into `src/types/contracts.ts`, updated all imports, and reduced `src/types/index.ts` to a thin re-export to prevent legacy type duplication.
- ✅ `src/utils`
  - Result: deleted nine dormant utility modules (`dataDisplayUtils`, `dataFilters`, `dataManagement`, `dataMigration`, `eventManager`, `systemCheck`, `systemDesign`, `tenderColors`, `tenderHelpers`) after confirming no live imports; retained only helpers exercised by components/tests.

## Phase 2 – Domain & Pricing Engines

- ✅ `src/domain`
  - Result: consolidated domain entity/repository types into `src/domain/model.ts`, updated repositories/tests to use the shared model, and stubbed legacy dual-write/snapshot/metrics modules as empty shims while keeping docs accurate.
- ✅ `src/pricing`
  - Result: inlined snapshot hashing utilities inside `snapshotCompute`, removed the unused storage/metrics modules, and confirmed snapshot tests still pass against the unified pricing engine helpers.
- ✅ `src/calculations`
  - Result: refactored tender stats to reuse unified win-rate & document price helpers, collapsing multi-pass loops into a single pass shared math utility.
- ✅ `src/analytics`
  - Result: refactored the pricing summary helper to reuse the centralized pricing engine aggregation and refreshed tests to cover the new flow only.

## Phase 3 – Application Layer

- ✅ `src/application`
  - Result: المجلد فارغ حاليًا ولا توجد orchestrators متبقية؛ لا حاجة لإجراءات إضافية.
- ✅ `src/services`
  - Result: أزلنا الواجهات التجميعية legacy (`services.ts` و `index.ts`) واستبدلناها بحراس تعطيل تمنع الرجوع للطبقة القديمة، مع تحديث المستهلك الوحيد (`systemCheck`) للاعتماد على `centralDataService` و `TenderNotificationService`.
- ✅ `src/repository`
  - Result: أزلنا طبقة المستودع المحلية (`providers/tender.local.ts` و`tender.repository.ts`) وحدثنا `useTenders` للاعتماد مباشرة على `centralDataService` مع استمرار بث الأحداث الموحدة.
- ✅ `src/infrastructure`
  - Result: removed the legacy memory/sqlite repositories from source, migrated parity setup into `test/support`, and left no runtime dependencies on the old infrastructure shims.
- ✅ `src/system`
  - Result: removed the empty `system` module entirely; no feature toggles or schedulers remained.
- ✅ `src/lib`
  - Result: deleted the unused `lib/utils.ts` helper after centralizing `cn` in `src/utils/cn.ts`.

## Phase 4 – Presentation & Styling

- ✅ `src/components`
- ✅ `src/styles`
  - Result: removed the unused cost stylesheet, kept only `globals.css`, and leaned on Tailwind classes instead of bespoke grids.
- ✅ `src/index.css`, `src/App.tsx`, `src/main.tsx`
  - Result: deleted the stale Tailwind build artifact, updated Boot loader to Tailwind classes, and ensured entrypoints use the centralized global styles only.

## Phase 5 – Data & Testing

- ✅ `src/data`
  - Result: أبقينا على `centralData.ts` كحاوية أنواع وبيانات افتراضية فقط مع توجيهات التحميل من electron-store، وتأكدنا أن `expenseCategories.ts` مستخدم فعليًا في الخدمات والواجهات (`useExpenses`, `expensesService`, `ExpenseManagement`). لا توجد بيانات جامدة زائدة للحذف.
- ✅ `src/events`
  - Result: راجعنا `bus.ts` وتأكدنا أنه المصدر الوحيد لأسماء الأحداث ويخدم الخدمات الحية (`projectCostService`, `purchaseOrderService`, `pricingDataSyncService`). لا توجد طبقات أحداث قديمة متبقية.
- ⏭️ `src/__tests__`, `test/`, `tests/`
  - Goal: remove tests for deleted modules; add coverage where gaps appear.

## Non-`src` Targets

- ⏭️ `scripts/`: purge ad-hoc utilities that no longer align with current flows.
- ⏭️ `docs/`: archive outdated manuals.
- ⏭️ `archive/` & `backup_old_hooks/`: evaluate for full removal or long-term storage.
- ✅ Root automation: نقلنا السكربتات القديمة من الجذر إلى `archive/scripts` مع تحديث `ARCHIVE_MANIFEST.md`. بقي `smart-electron-launcher.js` تحت المراجعة لأنه مستخدم في أوامر npm.
- ✅ Root caches: حذفت مجلدات `build/`, `playwright-report/`, `test-results/`, `.swc/`, و`.claude/` (كانت مجرد مخلفات بناء أو إعدادات محلية) وأضفتها إلى `.gitignore` لضمان عدم عودتها.
- ✅ `src/database`
  - Removed unused SQLite runtime layer (`src/database/database.ts`, `src/services/sqliteServices.ts`, `src/utils/dataMigration.ts`) to reflect the live electron-store architecture. Test-only SQLite helpers remain under `test/support/sqlite/`.
- ⏭️ `tests/security`: توسيع تغطية `tests/utils/cspBuilder.test.ts` لمسارات التعليقات والتجزئة الجديدة وتوثيق مخرجات Playwright في `docs/SECURITY_GUIDE.md`.

## Execution Notes

- After each folder cleanup, rerun Vitest suite (`npm run -s test`).
- Record decisions (keep/remove) in this backlog for traceability.
- Prefer removing exports over commenting; delete dead code outright.
