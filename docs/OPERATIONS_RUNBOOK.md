# دليل التشغيل التشغيلي

> تاريخ آخر تحديث: 7 أكتوبر 2025  
> الغرض من هذا الدليل توفير خطوات الدعم التشغيلي اليومية ومعالجة الحالات الطارئة لمعالج التسعير، النسخ الاحتياطية، وسجلات التدقيق.

## نظرة سريعة

| السيناريو | المرجع السريع | الأدوات المرتبطة |
| --- | --- | --- |
| فحص حفظ مسودات معالج التسعير | `npx playwright test tests/e2e/desktop/tender-pricing-wizard.spec.ts` | Playwright + SecureStore |
| تنظيف مسودات غير صالحة | `tsx scripts/migrations/cleanup-tender-wizards.ts --input <snapshot>` | `sanitizeTenderPricingWizardStore` |
| تصدير نسخة احتياطية | `npm run backup:export -- --output=./exports/backups.json` | `backupManager` |
| مراجعة سجل التدقيق | لوحة الإدارة *(قيد التطوير)* أو `subscribeToAuditLog()` | `app_security_audit_log` |

## إجراءات معالج التسعير

### التحقق التشغيلي اليومي

1. شغّل سيناريو Playwright الخاص بالمعالج للتأكد من أن الحفظ التلقائي، الاستئناف، والإرسال يعملان:

   ```powershell
   cd "c:\Users\ammn\Desktop\MBM_app\Final_5Sep\Desktop Management System (Community) (Copy) (Copy)"
   npx playwright test tests/e2e/desktop/tender-pricing-wizard.spec.ts
   ```

2. احتفظ بالتقارير الناتجة (`playwright-report/index.html`, ملفات الـ trace) لمدة 7 أيام للمراجعة.
3. في حال وجود فشل، انتقل إلى قسم الاسترداد الطارئ أدناه.

### الاسترداد بعد فشل الحفظ أو الإرسال

1. **مراجعة السجلات**: استخدم `getAuditEvents()` أو تصدير `app_security_audit_log` للتأكد من ظهور حدث `set` أو `remove` لمفتاح `app_tender_pricing_wizards` في وقت قريب من الحادثة.
2. **تشغيل أداة التنظيف**:

   ```powershell
   tsx scripts/migrations/cleanup-tender-wizards.ts --input "./exports/app-storage.json" --dry-run
   ```

   - راجع المخرجات بحثًا عن المفاتيح المحذوفة (مثل `orphan`).
   - أعد تشغيل الأداة بدون `--dry-run` لحفظ التغييرات.
3. **استعادة النسخة الاحتياطية**: في حال اختفاء المسودة:
   - شغّل `npm run backup:export -- --output=./exports/backups.json`.
   - استورد بيانات المناقصة من الملف الناتج بواسطة أداة الدعم الداخلية (قيد التطوير) أو من خلال `restoreTenderBackup()`.
4. **إعادة الفتح والتحقق**: افتح معالج التسعير وتأكد من عودة المسودة إلى المرحلة الصحيحة.
5. **توثيق الحادثة**: أضف سجلًا في `docs/OPERATIONS_LOG.md` *(أنشئ الملف عند الحاجة)* وارفق تقارير Playwright ونتيجة أداة التنظيف.

## النسخ الاحتياطي واستعادة البيانات

1. تتم الجدولة الليلية تلقائيًا، لكن يستطيع الفريق فرض نسخة احتياطية:

   ```powershell
   npm run backup:export -- --output="./exports/backups.json"
   ```

2. تأكد من أن مسار `./exports/` قابل للوصول وتتم مزامنته مع مخزن الشركة الآمن.
3. يحتفظ النظام بآخر 10 نسخ لكل مناقصة، ويمكن تعديل الإعداد عبر `backupManager` عند الحاجة.
4. في حال فشل نسخ متتالية، سيتلقى المستخدم إشعارًا داخليًا. قم بمراجعة سجل التدقيق لحالات `backup-failure-alert` واتبع خطة الطوارئ في `docs/SECURITY_GUIDE.md`.

## سجل التدقيق

- للوصول السريع أثناء الدعم:

   ```powershell
   node -e "require('./dist/utils/auditLog').printLatestEvents(100)"
   ```

- استخدم `subscribeToAuditLog()` داخل أدوات المراقبة للحصول على بث لحظي.
- قبل تنظيف السجل، احفظ نسخة احتياطية باستخدام `backupManager` ثم نفّذ `clearAuditLog()`.

## خطة الطوارئ المختصرة

| الحدث | الإجراء الأولي | تذكير |
| --- | --- | --- |
| فقد البيانات غير المشفرة في المعالج | تشغيل أداة التنظيف ثم استعادة النسخة الاحتياطية | لا تُعد أي خطوة ناجحة إلا بعد تأكيد Playwright |
| فشل متكرر في النسخ الاحتياطي | راجع سجل التدقيق، أعد المحاولة، وافتح تذكرة للبنية التحتية | لا تتجاوز محاولتين يدويتين متتاليتين دون تذكرة |
| تعطل التطبيق أثناء الإرسال | استرجع آخر نسخة احتياطية واطلع على تقارير Playwright | دوّن معرف النسخة ووقت التعطل |

## مراجع ذات صلة

- `docs/SECURITY_GUIDE.md` – تفاصيل التشفير، النسخ الاحتياطي، واسترداد معالج التسعير.
- `docs/CHANGELOG.md` – آخر التحديثات على مسار المعالج والأدوات المرافقة.
- `tests/e2e/desktop/tender-pricing-wizard.spec.ts` – السيناريو الرسمي للتحقق من المسار الكامل.
