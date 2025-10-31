# نشر سريع للإصدار v1.0.5 - Quick Publish

## المشكلة الحالية

خطأ 404 في التحديث التلقائي = **لا يوجد Release منشور على GitHub**

## الحل السريع (5 دقائق)

### الخطوة 1: احصل على GitHub Token

1. اذهب إلى: https://github.com/settings/tokens/new
2. اسم Token: `Desktop Management System Release v1.0.5`
3. Expiration: 90 days
4. Scope المطلوب: ✅ **repo** (اختر الكل)
5. اضغط "Generate token"
6. **انسخ Token فوراً** (لن تراه مرة أخرى!)

### الخطوة 2: عيّن Token في PowerShell

```powershell
$env:GH_TOKEN = "ghp_paste_your_token_here"
```

### الخطوة 3: نفّذ سكريبت النشر

```powershell
cd "C:\Users\ammn\Desktop\MBM_app\Final_5Sep\Desktop Management System (Community) (Copy) (Copy)"
.\publish-release.ps1
```

السكريبت سيقوم بـ:

1. ✓ حفظ التغييرات
2. ✓ دفع التغييرات إلى main
3. ✓ إنشاء ودفع الوسم v1.0.5
4. ✓ بناء الواجهة
5. ✓ بناء ونشر Electron مع الملفات

### الخطوة 4: تحقق من النشر

1. افتح: https://github.com/anmar534/Desktop-Management-System--Community---Copy---Copy-/releases
2. تأكد من ظهور **v1.0.5**
3. تأكد من وجود:
   - ✅ DesktopManagementSystem-1.0.5-win-x64.exe
   - ✅ latest.yml
   - ✅ Release ليس Draft

### الخطوة 5: اختبر التحديث

1. أغلق وأعد فتح التطبيق
2. اذهب إلى: **الإعدادات → التحديثات التلقائية**
3. اضغط **"التحقق من التحديثات"**
4. يجب أن تظهر: "أنت تستخدم أحدث إصدار"

---

## إذا فشل السكريبت

### البديل 1: النشر اليدوي السريع

```powershell
# 1. ادفع الوسم
git push origin v1.0.5

# 2. ابنِ
npm run build

# 3. انشر
$env:GH_TOKEN = "your_token"
npx electron-builder --win --x64 --publish always
```

### البديل 2: عبر GitHub مباشرة

1. ادفع الوسم: `git push origin v1.0.5`
2. اذهب إلى: https://github.com/anmar534/Desktop-Management-System--Community---Copy---Copy-/releases/new
3. اختر Tag: **v1.0.5**
4. Title: **v1.0.5 - Auto-update fix and improvements**
5. ارفع الملفات من `build/electron/`:
   - DesktopManagementSystem-1.0.5-win-x64.exe
   - latest.yml (مهم!)
6. اضغط **Publish release**

---

## استكشاف الأخطاء

### "GH_TOKEN not set"

```powershell
$env:GH_TOKEN = "ghp_your_token_here"
```

### "401 Unauthorized"

- Token غير صحيح أو منتهي
- احصل على Token جديد

### "latest.yml not found"

```powershell
# أعد البناء
npm run build
npx electron-builder --win --x64
# تحقق من: build/electron/latest.yml
```

### "Release already exists"

- احذف Release القديم من GitHub
- أو ارفع الإصدار إلى 1.0.6

---

## لماذا latest.yml مهم؟

`electron-updater` يقرأ هذا الملف لمعرفة:

- رقم الإصدار الأحدث
- رابط التحميل
- Hash للتحقق من الملف

**بدون latest.yml = لن يعمل التحديث التلقائي أبداً**

---

## الخطوات القادمة

بعد نشر v1.0.5 بنجاح:

1. ✅ التحديث التلقائي سيعمل
2. ✅ المستخدمون سيتلقون التحديثات تلقائياً كل 6 ساعات
3. ✅ يمكن اختبار التحديث من الإعدادات

للإصدارات القادمة (1.0.6، 1.0.7، إلخ):

```powershell
# 1. حدّث package.json version
# 2. حدّث CHANGELOG.md
# 3. حدّث publish-release.ps1
# 4. نفذ:
.\publish-release.ps1
```

---

## ملاحظة مهمة

**لن يظهر "تحديث متاح" حالياً** لأن:

- التطبيق المثبت لديك = v1.0.5
- Release على GitHub = v1.0.5
- (نفس الإصدار = لا يوجد تحديث)

لاختبار التحديث الحقيقي:

1. انشر v1.0.6 على GitHub
2. جرّب التحديث من تطبيق v1.0.5
3. سيظهر "تحديث متاح" ثم تنزيل تلقائي
