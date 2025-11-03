# Desktop Management System (Community)

> **النسخة:** v2.0.0  
> **آخر تحديث:** 3 نوفمبر 2025  
> **الحالة:** Production Ready ✅

نظام إدارة سطح المكتب الشامل مع دعم كامل للمناقصات، المشاريع، التسعير، والتقارير.

This is a code bundle for Desktop Management System (Community). The original project is available at [Figma Design](https://www.figma.com/design/RUYv8ycbIa9PAGmZO6DVJR/Desktop-Management-System--Community---Copy---Copy-).

---

## 🚀 Quick Start

### Installation

```bash
npm i
```

### Development

```bash
npm run dev
```

### Build & Run (Electron)

```bash
npm run build
npm run electron
```

---

## ✨ Features

### Core Features

- 📊 **Tender Management** - إدارة شاملة للمناقصات مع تتبع الحالة
- 💰 **Advanced Pricing** - نظام تسعير متطور مع BOQ integration
- 🏗️ **Project Management** - ربط المناقصات بالمشاريع
- 📈 **Analytics & Reports** - تحليلات وتقارير مفصلة
- 🔐 **Data Security** - حماية البيانات مع optimistic locking
- 🔄 **Auto-Migration** - ترقية تلقائية للبيانات

### Technical Features (v2.0)

- ✅ **Clean Architecture** - 4 layers (Presentation, Application, Domain, Infrastructure)
- ✅ **Store Separation** - 4 specialized stores for better performance
- ✅ **Service Layer** - Business logic separation from UI
- ✅ **Optimistic Locking** - Conflict detection and resolution
- ✅ **Auto-Migration System** - Seamless data upgrades
- ✅ **TypeScript** - Full type safety (0 errors)
- ✅ **JSDoc Documentation** - Comprehensive API documentation
- ✅ **Virtual Scrolling** - Optimized rendering for large lists
- ✅ **Memoization** - Smart caching for better performance

---

## 🏗️ Architecture

النظام مبني على **Clean Architecture** مع 4 طبقات منفصلة:

```
┌─────────────────────────────────────────────┐
│         Presentation Layer                  │
│  (Pages, Components, Hooks)                 │
├─────────────────────────────────────────────┤
│         Application Layer                   │
│  (Services, Stores, Business Logic)         │
├─────────────────────────────────────────────┤
│         Domain Layer                        │
│  (Entities, Validation, Selectors)          │
├─────────────────────────────────────────────┤
│         Infrastructure Layer                │
│  (Repositories, Storage, Migration)         │
└─────────────────────────────────────────────┘
```

### للمزيد من التفاصيل:

- 📖 [TENDER_SYSTEM_ARCHITECTURE.md](./docs/TENDER_SYSTEM_ARCHITECTURE.md) - توثيق معماري شامل
- 📊 [TENDER_SYSTEM_ENHANCEMENT_TRACKER.md](./TENDER_SYSTEM_ENHANCEMENT_TRACKER.md) - سجل التطوير والتحسينات

---

## 📚 Documentation

### Architecture & Design

- **[Tender System Architecture](./docs/TENDER_SYSTEM_ARCHITECTURE.md)** - بنية نظام المناقصات الكاملة (850+ سطر)
  - Clean Architecture layers
  - Store separation strategy
  - Service layer design
  - Migration system
  - Security features (Optimistic Locking)
  - Performance optimizations
  - 50+ code examples

### Integration & Migration

- **[Tenders & Projects Integration](./TENDERS_PROJECTS_INTEGRATION_ANALYSIS_REPORT.md)** - تحليل التكامل بين المناقصات والمشاريع
- **[BOQ Unification Migration](./MIGRATION_2025_BOQ_UNIFICATION.md)** - دليل توحيد نظام التسعير
- **[Pricing Layer Architecture](./ARCHITECTURE_PRICING_LAYER.md)** - البنية المعمارية لطبقة التسعير

### Development

- **[Coding Standards](./docs/CODING_STANDARDS.md)** - معايير البرمجة
- **[API Documentation](./docs/API_DOCUMENTATION.md)** - توثيق API
- **[Testing Guide](./docs/AUTOMATED_TESTING_RESULTS.md)** - دليل الاختبارات

### Progress Tracking

- **[Enhancement Tracker](./TENDER_SYSTEM_ENHANCEMENT_TRACKER.md)** - سجل شامل لجميع التحسينات
  - Phase 1-7 implementation details
  - 77% overall progress
  - Performance metrics
  - Architecture decisions

### Code Documentation

- **JSDoc في الكود** - توثيق شامل لجميع الـ APIs:
  - `TenderSubmissionService` - خدمة تقديم المناقصات
  - `PricingOrchestrator` - تنسيق عمليات التسعير
  - `PricingDataRepository` - إدارة بيانات التسعير
  - `BOQSyncRepository` - مزامنة BOQ
  - `TenderStatusRepository` - إدارة حالة المناقصات
  - 15+ methods موثقة
  - 25+ code examples

---

## 🧪 Testing

### Unit & Integration Tests

```bash
npm run test
```

يشغّل مجموعة Vitest (وحدات + تكامل) في بيئة jsdom.

### End-to-End Tests

```bash
npm run test:e2e:desktop
```

يشغّل سيناريوهات Playwright لنسخة سطح المكتب (يتطلب بيئة Electron محلية).  
تأكد من تهيئة المتغير `E2E_TEST=1` إن كنت تشغّل الأوامر يدويًا.

---

## 🛠️ Maintenance Scripts

### Backup Export

```bash
npm run backup:export -- --output=./backups/latest.json
```

يعمل على توليد ملف JSON يحتوي على النسخ الاحتياطية المشفرة (يتبع مصفوفة الاحتفاظ 10×30) لاستخدامه في الأرشفة أو التدقيق.

---

## 💾 Storage (Important)

### Storage Guidelines

- **Single source of truth:** electron-store via the unified storage layer in `src/utils/storage.ts`
- **Never use `localStorage` directly** - A guard blocks it at runtime, and lint/tests fail if it appears

### APIs to Use

```typescript
// Synchronous access (backed by cache + async persistence)
safeLocalStorage.getItem(key, default)
safeLocalStorage.setItem(key, value)
safeLocalStorage.removeItem(key)

// Explicit async workflows
asyncStorage.getItem(key, default)
asyncStorage.setItem(key, value)
asyncStorage.removeItem(key)

// Preferred: Use centralized service
import { centralDataService } from '@/services/centralDataService'
```

### Development Notes

- In dev/test (jsdom), the storage layer falls back to browser localStorage internally to keep integration tests working
- This is encapsulated; do not call localStorage yourself
- Direct `localStorage` access is blocked at runtime (guard) and is silent in production (debug-only in dev/test)

---

### Key Features

تم توحيد نظام التسعير بالكامل بالاعتماد على مصدر واحد: بيانات الـ BOQ المركزية (CentralDataService + PricingEngine). جميع المسارات القديمة (legacy arithmetic, snapshots, dual-write, diff) أزيلت.

**Core Components:**

- `src/services/pricingEngine.ts` – Canonical arithmetic + version export
- `src/utils/pricingConstants.ts` – Field aliases, default percentages, VAT, runtime config
- `src/utils/pricingHelpers.ts` – Facade (enrichment, diffing, feature flags)
- `src/analytics/pricingAnalytics.ts` – Summary + drift metrics

**Testing & Safety:**

- **Parity:** `tests/pricing/authoringEngineParity.test.ts` - < 0.01% divergence vs legacy
- **Regression:** `tests/pricing/pricingConstants.test.ts` - Prevents alias/percentage drift
- **Analytics:** `tests/pricing/pricingAnalytics.test.ts` - Validates summary math

**Extension Rules:**

1. Never duplicate arithmetic in components—extend `pricingEngine` instead
2. Add/modify alias lists only in `pricingConstants.ts` and update tests
3. Bump `PRICING_ENGINE_VERSION` if output numbers could change

راجع `MIGRATION_2025_BOQ_UNIFICATION.md` للتفاصيل التاريخية.

---

## 🏗️ Project Structure

```
src/
├── repository/              # Data Access Layer (Repository Pattern)
│   ├── tender.repository.ts
│   ├── project.repository.ts
│   ├── pricing-data.repository.ts
│   ├── boq-sync.repository.ts
│   ├── tender-status.repository.ts
│   └── providers/          # Storage providers (local, remote)
├── presentation/           # UI Components (Presentation Layer)
│   ├── pages/
│   │   ├── Tenders/       # نظام المنافسات
│   │   └── Projects/      # نظام المشاريع
│   └── components/
├── services/              # Business Logic Layer
│   ├── tender-submission.service.ts
│   ├── pricing-orchestrator.ts
│   ├── pricingEngine.ts   # محرك التسعير الموحد
│   └── centralDataService.ts
├── stores/                # State Management (4 separated stores)
│   ├── tendersStore.ts
│   ├── projectsStore.ts
│   ├── pricingStore.ts
│   └── uiStore.ts
├── utils/                 # Utility Functions
│   ├── storage.ts         # Unified storage layer
│   ├── pricingConstants.ts
│   └── pricingHelpers.ts
└── config/               # Configuration Files
```

---

## 📚 Additional Documentation

### Historical Context

- **[Cleanup History](./archive/docs/cleanup-history/)** - سجل عمليات التنظيف والتحسين السابقة

### Deprecated Systems

تم إزالة نظام الـ Snapshot والديف (Diff) والـ Dual-Write نهائياً في سبتمبر 2025:

- ❌ `legacyAuthoringCompute` وكافة طبقات fallback
- ❌ آليات diff / snapshot / dual-write
- ❌ إعادة حساب موازية

**فوائد الإزالة:**

- تقليل التعقيد وتحسين زمن التفاعل
- إزالة مخاطر التباين بين عدة مصادر
- تسهيل الصيانة وخفض عدد الملفات والوحدات

راجع `MIGRATION_2025_BOQ_UNIFICATION.md` للتفاصيل الكاملة.

---

## 🔄 Development Workflow

### Branch Strategy

- `my-electron-app` - Default/Production branch
- Feature branches: `feature/[feature-name]`
- Bug fixes: `fix/[bug-name]`

### Commit Guidelines

- Follow conventional commits: `type(scope): message`
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- Pre-commit hooks run linting and formatting automatically

---

## 🧪 Quality Assurance

### Code Quality

- ✅ ESLint for code linting
- ✅ Prettier for code formatting
- ✅ TypeScript strict mode (0 errors)
- ✅ Pre-commit hooks for automated checks
- ✅ Comprehensive JSDoc in all services/repositories

### Testing Strategy

- ✅ Unit tests with Vitest
- ✅ Integration tests for critical paths
- ✅ E2E tests with Playwright for desktop app
- ✅ Coverage reports available
- ✅ Pricing parity tests (< 0.01% divergence)

---

## 🚀 Performance Optimization

### Current Optimizations

- ✅ Unified pricing calculation (single source of truth)
- ✅ Async storage layer with caching
- ✅ Component lazy loading
- ✅ Zustand for efficient state management
- ✅ Virtual scrolling for large lists
- ✅ Optimistic locking for concurrent edits
- ✅ Memoization for expensive calculations

### Monitoring

- Analytics tracking in `src/analytics/`
- Performance metrics collection
- Error tracking and logging

---

## 📝 License

Community Edition - Internal Use

---

## 🤝 Support

للدعم الفني أو الاستفسارات، راجع ملفات التوثيق في مجلد `docs/` أو تواصل مع فريق التطوير.
