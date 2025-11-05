# دليل نشر التطبيق مع التحديثات الأوتوماتيكية

## المتطلبات الأساسية

### 1. إنشاء GitHub Personal Access Token

1. اذهب إلى GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. اضغط "Generate new token (classic)"
3. أعط التوكن اسماً مثل "Desktop Management System Release"
4. اختر الصلاحيات التالية:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `write:packages` (Upload packages to GitHub Package Registry)
5. اضغط "Generate token"
6. **انسخ التوكن فوراً** (لن تتمكن من رؤيته مرة أخرى)

### 2. إعداد متغير البيئة GH_TOKEN

#### PowerShell (للجلسة الحالية فقط):

```powershell
$env:GH_TOKEN = "ghp_your_token_here"
```

#### PowerShell (دائم - للمستخدم الحالي):

```powershell
[System.Environment]::SetEnvironmentVariable('GH_TOKEN', 'ghp_your_token_here', 'User')
```

#### CMD:

```cmd
setx GH_TOKEN "ghp_your_token_here"
```

## طريقة النشر

### الطريقة 1: النشر الأوتوماتيكي (موصى بها)

```bash
# 1. تحديث رقم الإصدار في package.json
# عدّل "version": "1.0.3" مثلاً

# 2. بناء ونشر التطبيق
npm run build:electron:publish
```

هذا الأمر سيقوم بـ:

- بناء التطبيق
- تعبئته في ملف exe
- **رفع ملف exe وملف latest.yml إلى GitHub Releases**
- إنشاء Release جديد تلقائياً

### الطريقة 2: النشر اليدوي (إذا لم يتوفر GH_TOKEN)

```bash
# 1. بناء التطبيق فقط
npm run build:electron
```

ثم ارفع الملفات يدوياً:

1. اذهب إلى GitHub Releases
2. اضغط "Create new release"
3. املأ البيانات:
   - Tag: `v1.0.3` (نفس رقم الإصدار في package.json)
   - Title: `Desktop Management System v1.0.3`
   - Description: وصف التحديثات
4. ارفع الملفات التالية من `build\electron\`:
   - ✅ `DesktopManagementSystem-X.X.X-win-x64.exe`
   - ✅ **`latest.yml`** (مهم جداً للتحديثات الأوتوماتيكية)
5. اضغط "Publish release"

## حل مشكلة الإصدار 1.0.2

الإصدار 1.0.2 الحالي لا يحتوي على ملف `latest.yml`، لذلك لا يمكن اكتشافه تلقائياً.

### الحل السريع:

1. افتح: https://github.com/anmar534/Desktop-Management-System--Community---Copy---Copy-/releases/tag/v1.0.2
2. اضغط "Edit"
3. ارفع ملف `latest.yml` من المسار:
   ```
   build\electron\latest.yml
   ```
4. اضغط "Update release"

بعد رفع `latest.yml`، سيتمكن التطبيق من اكتشاف التحديث.

## التحقق من نجاح النشر

### 1. تحقق من GitHub Release:

```
https://github.com/anmar534/Desktop-Management-System--Community---Copy---Copy-/releases/tag/vX.X.X
```

يجب أن يحتوي على:

- ✅ ملف exe
- ✅ ملف latest.yml
- ✅ معلومات الإصدار

### 2. تحقق من محتوى latest.yml:

يجب أن يحتوي على:

```yaml
version: 1.0.X
files:
  - url: DesktopManagementSystem-1.0.X-win-x64.exe
    sha512: ...
    size: ...
path: DesktopManagementSystem-1.0.X-win-x64.exe
releaseDate: '2025-XX-XXTXX:XX:XX.XXXZ'
```

### 3. اختبر التحديث:

- شغّل الإصدار القديم
- اذهب إلى الإعدادات → التحديثات
- اضغط "التحقق من التحديثات"
- يجب أن تظهر رسالة "تحديث متاح"

## ملاحظات مهمة

### أرقام الإصدارات:

- استخدم Semantic Versioning: `MAJOR.MINOR.PATCH`
- مثال: `1.0.0` → `1.0.1` → `1.1.0` → `2.0.0`
- رقم الإصدار في `package.json` **يجب** أن يكون أكبر من الإصدار السابق

### GitHub Release Tags:

- استخدم البادئة `v` قبل رقم الإصدار: `v1.0.2`, `v1.0.3`
- Tag يجب أن يطابق رقم الإصدار في package.json

### أمان التوكن:

- **لا تشارك** GH_TOKEN مع أحد
- **لا تحفظه** في الكود المصدري أو Git
- احفظه في متغيرات البيئة فقط
- إذا تسرب، احذفه فوراً من GitHub وأنشئ واحداً جديداً

## استكشاف الأخطاء

### "Update not detected"

- تحقق من وجود `latest.yml` في GitHub Release
- تحقق من أن رقم الإصدار في `latest.yml` أكبر من الإصدار الحالي
- تحقق من اتصال الإنترنت

### "Publishing failed"

- تحقق من صلاحية GH_TOKEN
- تحقق من صلاحيات التوكن (يجب أن يحتوي على `repo`)
- تحقق من اسم المستودع في `electron-builder.yml`

### "Build failed"

- احذف مجلد `build` وحاول مرة أخرى
- تحقق من عدم وجود عملية Electron قيد التشغيل
- استخدم `force-build.bat` كمسؤول

## أوامر مفيدة

```bash
# عرض رقم الإصدار الحالي
Get-Content package.json | Select-String -Pattern '"version"'

# عرض الإصدارات على GitHub
gh release list

# عرض تفاصيل إصدار معين
gh release view v1.0.2

# حذف إصدار
gh release delete v1.0.2

# إعادة بناء فقط (بدون نشر)
npm run build:electron

# بناء ونشر
npm run build:electron:publish
```

## روابط مفيدة

- [electron-builder Documentation](https://www.electron.build/)
- [GitHub Releases API](https://docs.github.com/en/rest/releases)
- [Semantic Versioning](https://semver.org/)
