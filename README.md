# Desktop Management System (Community) (Copy) (Copy)

This is a code bundle for Desktop Management System (Community) (Copy) (Copy). The original project is available at [Figma Design](https://www.figma.com/design/RUYv8ycbIa9PAGmZO6DVJR/Desktop-Management-System--Community---Copy---Copy-).

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Testing

- `npm run test` يشغّل مجموعة Vitest (وحدات + تكامل) في بيئة jsdom.
- `npm run test:e2e:desktop` يشغّل سيناريوهات Playwright لنسخة سطح المكتب (يتطلب بيئة Electron محلية). تأكد من تهيئة المتغير `E2E_TEST=1` إن كنت تشغّل الأوامر يدويًا.

## Maintenance scripts

- `npm run backup:export -- --output=./backups/latest.json` يعمل على توليد ملف JSON يحتوي على النسخ الاحتياطية المشفرة (يتبع مصفوفة الاحتفاظ 10×30) لاستخدامه في الأرشفة أو التدقيق.

## Storage (important)

- Single source of truth: electron-store via the unified storage layer in `src/utils/storage.ts`.
- Never use `localStorage` directly in app code. A guard blocks it at runtime, and lint/tests fail if it appears.
- Use these APIs instead:
  - `safeLocalStorage.getItem(key, default)` / `setItem(key, value)` / `removeItem(key)` for synchronous access backed by cache + async persistence to electron-store.
  - `asyncStorage.getItem(key, default)` / `setItem(key, value)` / `removeItem(key)` for explicit async workflows.
  - Prefer going through `src/services/centralDataService.ts` for all CRUD on tenders, projects, clients, BOQ, etc.
- In dev/test (jsdom), the storage layer falls back to browser localStorage internally to keep integration tests working. This is encapsulated; do not call localStorage yourself.
- Direct `localStorage` access is blocked at runtime (guard) and is silent in production (debug-only in dev/test).

## Pricing Engine (Unified BOQ – 2025-09)

تم توحيد نظام التسعير بالكامل بالاعتماد على مصدر واحد: بيانات الـ BOQ المركزية (CentralDataService + PricingEngine). جميع المسارات القديمة (legacy arithmetic, snapshots, dual-write, diff) أزيلت. راجع ملف `MIGRATION_2025_BOQ_UNIFICATION.md` للتفاصيل التاريخية.

Key Files:

- `src/services/pricingEngine.ts` – canonical arithmetic + `PRICING_ENGINE_VERSION` export
- `src/utils/pricingConstants.ts` – single source for field aliases, default overhead percentages, VAT, runtime config helpers
- `src/utils/pricingHelpers.ts` – facade (enrichment, diffing, feature flags)
- `src/analytics/pricingAnalytics.ts` – summary + drift metrics

Feature Flags (الحالية بعد الإزالة): تم التخلص من الأعـلام المتعلقة بالـ legacy أو snapshot. أي أعلام متبقية تخص سلوكيات UI طفيفة فقط.

Runtime Configuration:

```ts
import { getPricingConfig, updatePricingConfig } from '.../pricingConstants'

const current = getPricingConfig()
updatePricingConfig({ VAT_RATE: 0.18 }) // triggers test expectations if changed intentionally
```

Testing & Safety:

- Parity: `tests/pricing/authoringEngineParity.test.ts` enforces < 0.01% divergence vs legacy authoring arithmetic.
- Regression: `tests/pricing/pricingConstants.test.ts` prevents accidental alias / percentage drift.
- Analytics: `tests/pricing/pricingAnalytics.test.ts` validates summary math & drift logic.

إزالة المسارات القديمة:

- تم حذف `legacyAuthoringCompute` وكافة طبقات fallback و parity soak (سبتمبر 2025).
- ألغيت آليات diff / snapshot / dual-write. لم يعد هناك إعادة حساب موازية.

Extension Rules:

1. Never duplicate arithmetic in components—extend `pricingEngine` instead.
2. Add/modify alias lists only in `pricingConstants.ts` and update the constants test if intentional.
3. Bump `PRICING_ENGINE_VERSION` if output numbers could change.

## (Deprecated) Snapshot & Dual-Write (أزيلت)

تمت إزالة نظام الـ Snapshot والديف (Diff) والـ Dual-Write نهائياً. إذا احتجت الرجوع لتاريخ التصميم أو الأسباب، راجع: `MIGRATION_2025_BOQ_UNIFICATION.md`.

فوائد الإزالة:

- تقليل التعقيد وتحسين زمن التفاعل.
- إزالة مخاطر التباين بين عدة مصادر.
- تسهيل الصيانة وخفض عدد الملفات والوحدات.

في حال الحاجة مستقبلاً لتدقيق تاريخي (Historical Reconstruction) يمكن بناء export خارجي أو Layer تحليل منفصل دون إعادة أي منطق snapshot.

## 📚 Documentation

### Core Systems

- **[Tenders & Projects Integration Analysis](./TENDERS_PROJECTS_INTEGRATION_ANALYSIS_REPORT.md)** - تحليل شامل لنظام المنافسات والمشاريع والتكامل بينهما
- **[Migration Guide - BOQ Unification](./MIGRATION_2025_BOQ_UNIFICATION.md)** - دليل توحيد نظام التسعير
- **[Architecture - Pricing Layer](./ARCHITECTURE_PRICING_LAYER.md)** - البنية المعمارية لطبقة التسعير

### Development Guides

- **[Coding Standards](./docs/CODING_STANDARDS.md)** - معايير البرمجة
- **[API Documentation](./docs/API_DOCUMENTATION.md)** - توثيق API
- **[Testing Guide](./docs/AUTOMATED_TESTING_RESULTS.md)** - دليل الاختبارات

### Historical Documentation

- **[Cleanup History](./archive/docs/cleanup-history/)** - سجل عمليات التنظيف والتحسين السابقة

## 🏗️ Project Structure

```
src/
├── repository/              # Data access layer (Repository Pattern)
│   ├── tender.repository.ts
│   ├── project.repository.ts
│   └── providers/          # Storage providers (local, remote)
├── presentation/           # UI Components
│   ├── pages/
│   │   ├── Tenders/       # نظام المنافسات
│   │   └── Projects/      # نظام المشاريع
│   └── components/
├── services/              # Business logic services
│   ├── pricingEngine.ts   # محرك التسعير الموحد
│   └── centralDataService.ts
├── stores/                # Zustand state management
├── utils/                 # Utility functions
│   └── storage.ts         # Unified storage layer
└── config/               # Configuration files
```

## 🔄 Development Workflow

### Branch Strategy

- `my-electron-app` - Default/Production branch
- `cleanup/remove-deprecated-files` - Current cleanup work
- Feature branches: `feature/[feature-name]`
- Bug fixes: `fix/[bug-name]`

### Commit Guidelines

- Follow conventional commits: `type(scope): message`
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- Pre-commit hooks run linting and formatting automatically

## 🧪 Quality Assurance

### Code Quality

- ESLint for code linting
- Prettier for code formatting
- TypeScript strict mode enabled
- Pre-commit hooks for automated checks

### Testing Strategy

- Unit tests with Vitest
- Integration tests for critical paths
- E2E tests with Playwright for desktop app
- Coverage reports available

## 🚀 Performance Optimization

### Current Optimizations

- Unified pricing calculation (single source of truth)
- Async storage layer with caching
- Component lazy loading
- Zustand for efficient state management

### Monitoring

- Analytics tracking in `src/analytics/`
- Performance metrics collection
- Error tracking and logging
