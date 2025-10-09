# Cleanup Proposal (Codebase Hygiene Phase)

تاريخ: 2025-09-20
الحالة: مسودة للاعتماد قبل التنفيذ

## 🎯 الهدف
تقليل الضجيج (noise) في المستودع قبل تنفيذ طبقة persistence الجديدة (SQLite + Domain Layer) عبر إزالة السكربتات المؤقتة، أرشفة التقارير، وتنظيم ملفات الاسترجاع.

---
## 1. تصنيف العناصر

### 1.1 Scripts (Root *.js)

| File | Action | Reason | Risk | Rollback Ease |
|------|--------|--------|------|---------------|
| final-desktop-simulation.js | Delete | Diagnostic run-only | Low | Simple restore |
| deep-pricing-simulation.js | Delete | Legacy experiment | Low | Simple restore |
| final-integration-validation.js | Delete | One-off validation | Low | Simple restore |
| final-recovery-attempt.js | Delete | Recovery phase complete | Low | Simple restore |
| final-timestamp-fix-test.js | Delete | Ad-hoc test logic | Low | Simple restore |
| test-pricing-sync-fix.js | Delete | Temporary test script | Low | Simple restore |
| test-simple-pricing-fix.js | Delete | Temporary test script | Low | Simple restore |
| test-description-fix.js | Delete | Temporary test script | Low | Simple restore |
| test-comprehensive-improvements.js | Delete | Exploratory script | Low | Simple restore |
| diagnose-zero-values.js | Delete | Forensic | Low | Simple restore |
| diagnose-description-issue.js | Delete | Forensic | Low | Simple restore |
| diagnose-description-mapping.js | Delete | Forensic | Low | Simple restore |
| debug-pricing-summary-data.js | Delete | Debug-only | Low | Simple restore |
| debug-pricing-data-source.js | Delete | Debug-only | Low | Simple restore |
| debug-description-tracking.js | Delete | Debug-only | Low | Simple restore |
| debug-browser-console.js | Delete | Debug-only | Low | Simple restore |
| debug-electron-data.js | Delete | Debug-only | Low | Simple restore |
| check-buttons-live.js | Delete | UI manual check | Low | Simple restore |
| check-pricing-data.js | Delete | Data inspection | Low | Simple restore |
| check-electron-storage.js | Delete | Data inspection | Low | Simple restore |
| check-storage-data.js | Delete | Data inspection | Low | Simple restore |
| check-localStorage.js | Delete | Legacy localStorage era | Low | Simple restore |
| recovery-test.js | Delete | Recovery phase finished | Low | Simple restore |
| advanced-pricing-recovery.js | Delete | Obsolete recovery flow | Low | Simple restore |
| binary-data-recovery.js | Delete | Obsolete recovery flow | Low | Simple restore |
| binary-data-extractor.js | Delete | One-off extraction | Low | Simple restore |
| data-discovery-tool.js | Delete | Forensic | Low | Simple restore |
| pricing-diagnostics.js | Delete | Transitional | Low | Simple restore |
| final-comprehensive-description-test.js | Delete | Exploratory | Low | Simple restore |
| final-boq-description-fix.js | Delete | Transitional | Low | Simple restore |
| extract-backup-pricing.js | Archive | May document storage shapes | Low | Keep copy |
| extract-ldb-data.js | Archive | Reference for legacy source | Low | Keep copy |
| restore-tender-from-pricing.js | Archive | Possibly useful for controlled restore | Low | Keep copy |
| RESTORE_PRICING_DATA.js | Archive | Generated restore script | Low | Regenerate |
| create-test-tender.js | Archive | Helpful for demo seed | Low | Keep copy |
| inject-test-tender.js | Archive | Paired with create-test-tender | Low | Keep copy |
| fix-project-boq.js | Archive | Data patch reference | Low | Keep copy |
| utf16-pricing-recovery.js | Archive | Edge-case encoding recovery | Low | Keep copy |
| auto-restore.js | Review | Might still be used in critical fallback | Medium | Verify before |
| MINIMAL_RESTORE.js | Review | Generated—confirm not used | Medium | Verify before |
| run-full-system.js | Review | Check if dev flow relies on it | Medium | Verify before |
| run_system.bat | Review | Possibly part of Windows start | Medium | Verify usage |
| run-system.ps1 | Review | Possibly part of Windows start | Medium | Verify usage |
| smart-electron-launcher.js | Keep | Might be part of improved startup | Medium | Keep until refactor |

#### تحديث التنفيذ – 29 سبتمبر 2025

- تم نقل الحزمة التاريخية من سكربتات الاستعادة/التشخيص (`auto-restore.js`, `clean-pricing-recovery.js`, `clear-snapshot.js`, إلخ) إلى `archive/scripts/` مع تسجيلها في `archive/ARCHIVE_MANIFEST.md`.
- أبقينا `smart-electron-launcher.js` في الجذر لأنه مستخدم في أوامر npm الفعلية (`dev:electron:smart`).
- بقي `MINIMAL_RESTORE.js` تحت المراجعة للتأكد من عدم الحاجة إليه قبل نقله أو حذفه.

### 1.2 Markdown Reports

Action: Archive to `docs/archive/` (create if missing) except core README & technical docs.

| File (examples) | Action | Notes |
|-----------------|--------|-------|
| PRICING_AUDIT_REPORT.md | Archive | Historical audit |
| PRICING_PHASE3_SUMMARY.md | Archive | Phase summary |
| FINAL_IMPROVEMENTS_REPORT.md | Archive | Historical |
| DESCRIPTION_FIX_REPORT.md | Archive | Historical |
| ENHANCED_INTEGRATION_SUMMARY.md | Archive | Historical |
| ARCHITECTURAL_IMPROVEMENTS_REPORT.md | Archive | Superseded by new plan |
| MIGRATION_TO_ELECTRON_STORE.md | Archive | Migration complete |
| STORAGE_MIGRATION_REPORT.md | Archive | Same |
| PHASE_2_UI_IMPROVEMENTS_REPORT.md | Archive | Historical |
| DATA_RECOVERY_REPORT.md | Archive | Recovery complete |
| PROJECT_DETAILS_ANALYSIS_REPORT.md | Archive | Historical |
| README.md | Keep | Primary root doc |
| src/TECHNICAL_DOCUMENTATION.md | Keep | Internal structure |

### 1.3 JSON / TXT Data Artifacts

| File | Action | Reason |
|------|--------|--------|
| ALL_RECOVERED_DATA.json | Archive | Forensic bundle |
| RECOVERED_PRICING_DATA.json | Archive | Recovery artifact |
| RECOVERED_DATA_BACKUP.json | Archive | Backup variant |
| MINIMAL_RECOVERY.json | Archive | Skeleton snapshot |
| DATA_BACKUP.json | Archive | Raw dump |
| DETAILED_DATA_BACKUP.json | Archive | Generated by analyzer |
| PRICING_DATA_TO_FIX.json | Archive | Transitional debugging |
| RAW_PRICING_DATA.txt | Archive | Raw textual recovery |
| RAW_BACKUP_JSON.txt | Archive | Raw textual recovery |
| COMPLETE_RECOVERED_PRICING.json | Archive | Full reconstruction |
| RECONSTRUCTED_FINAL.json | Archive | Final reconstruction |
| DUPLICATION_CATALOG.json | Archive | Linked in audit docs |
| inventory.json | Archive | Referenced only in reports |
| RESTORATION_REPORT.json | Archive | Post-restore log |
| test_data.json | Delete | Generated ad-hoc (not needed in src/tests) |

(أي ملف جديد بنفس النمط يوضع في /archive/data/ للحفاظ على نظافة الجذر.)

---

## 2. التنفيذ المرحلي

1. Create folders: `docs/archive`, `archive/scripts`, `archive/data`.
2. Move Archive items للحفاظ على سجل (git history + مسار جديد).
3. Delete SafeRemove items (موثقة هنا).
4. Run: build + tests.
5. If failure: rollback individually (git restore path).

## 3. معايير الحذف الآمن

- عدم وجود import / require / dynamic fs.readFile داخل src/.*
- ليس جزءاً من npm scripts.
- لا يُستدعى في package.json (scripts).
- ليس مذكوراً في وثائق حية (README الحالي).

## 4. مخاطر محتملة + تخفيف

| Risk | Scenario | Mitigation |
|------|----------|------------|
| Lost forensic reference | حاجة مفاجئة لتحليل تسرب بيانات | موجود في archive/ |
| حذف سكربت تشغيل فعلي | run-full-system.js مستخدم داخلياً | وضعه تحت Review والتأكد قبل الحذف |
| فقدان سيناريو استعادة نادر | auto-restore.js مطلوب بحالات فساد | تركه Review + توثيق جديد لو لازم |

## 5. Follow-up بعد التنظيف

- توحيد مسار documentation الرسمي (مجلد docs/ فقط).
- إضافة قسم في README يشرح سياسة الأرشفة.
- إعداد GitHub Action مستقبلاً لفحص ملفات جذرية غير مرجعية (اختياري).

## 6. طلب اعتماد

يرجى الموافقة على أحد الخيارات:

A) تنفيذ فوري وفق الخطة.
B) تعديل (حدد الملفات).
C) إلغاء أو تأجيل (اذكر السبب).

أكتب A أو B مع التعديلات، أو C.
