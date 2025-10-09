# Storage Migration and Hardening Report

Date: 2025-09-15

This document summarizes the final storage migration, cleanup, guards, and service unification implemented to prevent data loss and ensure electron-store is the single source of truth.

## What changed

- Legacy migration paths were removed. The app no longer reads from browser localStorage at runtime in Electron. Electron-store is the only persistence layer.
- The previous catch-up and full localStorage cleanup have been finalized and removed from the codebase. The guard remains to prevent regressions.
- LocalStorage guard blocks reads/writes/removes for unified and legacy keys. It now logs once-per-key using console.debug in dev/test and remains silent in production. Installed in `src/main.tsx` via `installLegacyStorageGuard()`.
- Legacy services cleaned up: all CRUD for tenders, projects, clients now route through `centralDataService`. Attempts to use legacy keys in `StorageService` are warned and blocked.
- Non-Electron fallback in tests/jsdom: storage helpers read/write/remove to browser localStorage to keep integration tests working.

## Unified keys (STORAGE_KEYS)

- app_tenders_data
- app_projects_data
- app_clients_data
- app_pricing_data
- app_purchase_orders_data
- app_expenses_data
- app_boq_data
- app_entity_relations
- app_tender_backups
- app_tender_stats

## Legacy keys removed/guarded

- app_tenders, app_tenders_list, tenders, construction_tenders, construction_app_tenders, app_tenders_old
- app_projects, projects, construction_projects, construction_app_projects, app_projects_old
- app_clients, clients, construction_clients, construction_app_clients, app_clients_old
- pricing, tender_pricing, app_pricing, construction_app_pricing
- Any key starting with `construction_app_`

## Flags

All legacy migration flags were removed from runtime. No flags are required going forward.

## Where to look in code

- Migration + electron-store wrapper: `src/utils/storage.ts`
- Startup wiring (guard + sync): `src/main.tsx`
- Central data orchestration: `src/services/centralDataService.ts`
- Legacy services shimmed to central: `src/services/index.ts`

## Verification steps

- Run unit/integration tests (Vitest). Ensure guard test passes and smoke test verifies persistence across restarts.
- Start the app; storage should initialize cache and render data without any migration logs. No red warnings should appear in production.
- After creating/updating tenders/projects/clients, confirm data lives in electron-store (through preload bridge).

## Notes

- The old `migrateLegacyLocalStorage` and `migrateFromElectronStoreIfAvailable` were removed. `storage.ts` now exposes a unified electron-store-backed API only.
- If any third-party or older internal code still uses localStorage with legacy prefixes, it will be blocked; a debug message appears once per key in dev/test.

## Next potential improvements

- Add a dedicated test to assert guard behavior (blocked write to `construction_app_tenders`).
- Telemetry hook to count/trace any guard hits in production for a short period.

## Smoke Tests

Purpose: Verify that tenders are loaded from electron-store automatically across restarts and that no legacy localStorage path is needed.

Test file: `tests/integration/smokeTestUI.test.ts`

Flow:

- Boots the app in jsdom with a mocked `window.electronAPI.store` backed by a temporary JSON file (simulating electron-store).
- Inserts a Demo tender if not present.
- Mounts the React App and verifies the Demo tender name appears in the DOM.
- Simulates an app restart by resetting modules and remounting the App, then verifies the tender appears again.

Expectations:

- Runs automatically with the default test suite (`npm run test`).
- If data fails to appear after restart, the test fails with a clear assertion error.
- The test relies only on electron-store (mock), never browser localStorage.

Debug output:

- The test prints console logs at each stage: before insert, after restart, and after DOM checks to help diagnose failures.
