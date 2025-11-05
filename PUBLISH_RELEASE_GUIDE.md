# دليل نشر الإصدارات - Publishing Releases Guide

## المشكلة الحالية

التحديث التلقائي يفشل بخطأ 404 لأن GitHub Releases غير منشورة.

## الحل الكامل

### الخطوة 1: التأكد من البناء

```bash
# تأكد أن package.json يحتوي على الإصدار الصحيح
# الإصدار الحالي: 1.0.4

# ابنِ التطبيق
npm run build
npm run build:electron
```

### الخطوة 2: نشر الوسم على GitHub

```bash
# تأكد أن جميع التغييرات محفوظة
git add -A
git commit -m "chore(release): v1.0.4 - auto-update fix and improvements"

# ادفع الوسم إلى GitHub
git push origin v1.0.4

# أو ادفع جميع الوسوم
git push origin --tags
```

### الخطوة 3: إنشاء GitHub Release يدوياً

1. اذهب إلى: https://github.com/anmar534/Desktop-Management-System--Community---Copy---Copy-/releases/new

2. املأ النموذج:

   - **Tag**: `v1.0.4` (اختر من القائمة)
   - **Release title**: `v1.0.4 - Auto-Update Fix & Dashboard Improvements`
   - **Description**: انسخ من `RELEASE_NOTES_v1.0.4.md`

3. ارفع الملفات المبنية:

   - من مجلد `build/electron/`
   - ملفات مطلوبة:
     - `DesktopManagementSystem-1.0.4-win-x64.exe`
     - `latest.yml` (مهم جداً!)
     - أي ملفات `.blockmap` إن وُجدت

4. **مهم**: تأكد أن المربع "Set as a pre-release" غير محدد
5. اضغط "Publish release"

### الخطوة 4: نشر باستخدام electron-builder مباشرة (الطريقة الأسهل)

```bash
# احصل على GitHub Token من:
# https://github.com/settings/tokens
# الصلاحيات المطلوبة: repo (full control)

# في PowerShell:
$env:GH_TOKEN = "ghp_your_token_here"

# ابنِ وانشر مباشرة
npm run build
npm run build:electron:publish

# أو:
npm run build
npx electron-builder --win --x64 --publish always
```

### الخطوة 5: التحقق من النشر

```bash
# تحقق من وجود Release على:
# https://github.com/anmar534/Desktop-Management-System--Community---Copy---Copy-/releases

# تحقق من وجود latest.yml:
# https://github.com/anmar534/Desktop-Management-System--Community---Copy---Copy-/releases/download/v1.0.4/latest.yml
```

## هيكل latest.yml المطلوب

```yaml
version: 1.0.4
files:
  - url: DesktopManagementSystem-1.0.4-win-x64.exe
    sha512: [hash]
    size: [bytes]
path: DesktopManagementSystem-1.0.4-win-x64.exe
sha512: [hash]
releaseDate: '2025-10-31T...'
```

## اختبار التحديث التلقائي

بعد النشر:

1. أعد تشغيل التطبيق
2. انتقل إلى: الإعدادات → التحديثات التلقائية
3. اضغط "التحقق من التحديثات"
4. يجب أن يظهر:
   - إما "لا توجد تحديثات" (إذا كنت على 1.0.4)
   - أو "تحديث متاح" + تنزيل تلقائي

## الإصدارات القادمة

لنشر إصدار جديد (مثل 1.0.5):

```bash
# 1. حدّث package.json
# 2. حدّث CHANGELOG.md
# 3. أنشئ RELEASE_NOTES_v1.0.5.md

# 4. احفظ وأنشئ وسم
git add -A
git commit -m "chore(release): v1.0.5"
git tag v1.0.5
git push origin HEAD --tags

# 5. ابنِ وانشر
npm run build
$env:GH_TOKEN = "your_token"
npm run build:electron:publish
```

## استكشاف الأخطاء

### خطأ 404 في التحديث

- السبب: لا يوجد Release على GitHub
- الحل: اتبع الخطوات أعلاه لنشر Release

### خطأ "No published versions on GitHub"

- السبب: Release موجود لكن محدد كـ "Pre-release" أو "Draft"
- الحل: عدّل Release وألغِ تحديد "Pre-release"

### خطأ "latest.yml not found"

- السبب: لم يتم رفع latest.yml إلى Release
- الحل: ابنِ مجدداً واحرص على رفع latest.yml

### GH_TOKEN invalid

- احصل على Token جديد من: https://github.com/settings/tokens
- صلاحيات مطلوبة: `repo` (كاملة)

## ملاحظات مهمة

1. **لا تنشر بدون latest.yml**: electron-updater يعتمد عليه تماماً
2. **تأكد أن Release ليس Draft**: التحديث التلقائي يتجاهل Draft releases
3. **اسم الـ Repo يجب أن يطابق تماماً**: `Desktop-Management-System--Community---Copy---Copy-`
4. **الوسم يجب أن يبدأ بـ `v`**: `v1.0.4` وليس `1.0.4`

## روابط مفيدة

- Releases: https://github.com/anmar534/Desktop-Management-System--Community---Copy---Copy-/releases
- Tokens: https://github.com/settings/tokens
- electron-builder docs: https://www.electron.build/configuration/publish
