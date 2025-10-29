# نظام حماية بيانات المستخدم عند التحديثات

## 📍 موقع تخزين البيانات

يتم تخزين جميع بيانات المستخدم في مجلد `userData` الذي يُحدد تلقائياً بواسطة Electron:

### Windows

```
C:\Users\<username>\AppData\Roaming\desktop-management-system-community
```

### macOS

```
~/Library/Application Support/desktop-management-system-community
```

### Linux

```
~/.config/desktop-management-system-community
```

## 🔒 آلية الحماية

### 1. فصل البيانات عن الكود

- **ملفات التطبيق**: يتم تثبيتها في `C:\Program Files` أو `C:\Program Files (x86)`
- **بيانات المستخدم**: محفوظة في `AppData\Roaming`
- عند التحديث، يتم استبدال ملفات التطبيق فقط دون المساس ببيانات المستخدم

### 2. ملفات البيانات المحمية

```
userData/
├── config.json              # إعدادات electron-store
├── error-logs/              # سجلات الأخطاء
│   ├── error-log-*.json
│   └── ...
├── Cache/                   # ملفات الكاش
├── databases/               # قواعد البيانات المحلية
└── backups/                 # النسخ الاحتياطية
```

### 3. التشفير

- يتم تشفير البيانات الحساسة باستخدام `keytar` (Windows Credential Manager)
- مفاتيح التشفير محفوظة بشكل آمن خارج مجلد التطبيق

## 🔄 سيناريوهات التحديث

### التحديث العادي (Same Version Schema)

1. ✅ يتم تحميل النسخة الجديدة
2. ✅ يتم تثبيتها في نفس الموقع (استبدال الملفات)
3. ✅ البيانات في `userData` تبقى كما هي
4. ✅ التطبيق يقرأ البيانات القديمة بنجاح

### التحديث مع تغيير Schema

```javascript
// في main.cjs - عند بدء التطبيق
async function migrateUserData() {
  const currentVersion = app.getVersion()
  const lastVersion = store.get('app.lastVersion')

  if (currentVersion !== lastVersion) {
    // تنفيذ Migration Scripts
    await runMigrations(lastVersion, currentVersion)
    store.set('app.lastVersion', currentVersion)
  }
}
```

### إلغاء التثبيت

- عند إلغاء التثبيت، يتم سؤال المستخدم:
  - **حذف البيانات**: يتم حذف مجلد `userData` كاملاً
  - **الحفاظ على البيانات**: يتم الاحتفاظ بالبيانات لإعادة التثبيت لاحقاً

## 🛡️ ضمانات إضافية

### 1. نظام النسخ الاحتياطي التلقائي

```javascript
// نسخ احتياطي تلقائي قبل كل تحديث
autoUpdater.on('update-downloaded', async () => {
  await createBackup()
  // ... بقية عملية التحديث
})
```

### 2. التحقق من سلامة البيانات

```javascript
async function verifyDataIntegrity() {
  try {
    // التحقق من وجود الملفات الأساسية
    const configExists = await fileExists(configPath)
    if (!configExists) {
      await restoreFromBackup()
    }
    return true
  } catch (error) {
    logError(error, { context: 'data-integrity-check' })
    return false
  }
}
```

### 3. Rollback عند الفشل

```javascript
autoUpdater.on('error', async (error) => {
  // في حالة فشل التحديث
  await restoreFromBackup()
  await rollbackToLastVersion()
})
```

## 📊 مراقبة سلامة البيانات

### عند كل بدء تشغيل

```javascript
app.on('ready', async () => {
  // 1. التحقق من وجود مجلد userData
  const userDataPath = app.getPath('userData')
  await ensureDirectoryExists(userDataPath)

  // 2. التحقق من سلامة البيانات
  const isValid = await verifyDataIntegrity()

  // 3. تسجيل الحالة
  logError(new Error('App started'), {
    context: 'startup',
    userDataPath,
    dataValid: isValid,
    version: app.getVersion(),
  })
})
```

## 🔧 إعدادات electron-builder للحماية

```yaml
# electron-builder.yml
nsis:
  oneClick: false
  perMachine: false # تثبيت لكل مستخدم (يحمي البيانات)
  allowToChangeInstallationDirectory: true

  # لا تحذف userData عند إلغاء التثبيت
  deleteAppDataOnUninstall: false
```

## ✅ اختبار الحماية

### سيناريو الاختبار

1. تثبيت الإصدار 1.0.0
2. إنشاء بيانات تجريبية
3. التحديث إلى 1.0.1
4. التحقق من وجود جميع البيانات
5. التحقق من عمل التطبيق بشكل صحيح

### كود الاختبار

```javascript
// في tests/e2e/update-protection.spec.ts
test('user data survives updates', async () => {
  // 1. إنشاء بيانات
  await createTestData()

  // 2. محاكاة التحديث
  await simulateUpdate()

  // 3. التحقق
  const dataExists = await verifyTestData()
  expect(dataExists).toBe(true)
})
```

## 📝 أفضل الممارسات

1. **عدم تخزين البيانات داخل مجلد التطبيق**

   - ❌ `app.getAppPath()/data`
   - ✅ `app.getPath('userData')/data`

2. **استخدام أسماء ثابتة للمجلدات**

   ```javascript
   // في main.cjs
   const safeAppName = resolveScopedAppName()
   app.setPath('userData', path.join(app.getPath('appData'), safeAppName))
   ```

3. **النسخ الاحتياطي الدوري**

   ```javascript
   setInterval(
     async () => {
       await createIncrementalBackup()
     },
     24 * 60 * 60 * 1000,
   ) // كل 24 ساعة
   ```

4. **تسجيل العمليات الحرجة**
   ```javascript
   async function criticalOperation() {
     logError(new Error('Critical operation started'), {
       context: 'data-modification',
       timestamp: new Date().toISOString(),
     })

     try {
       // العملية
     } catch (error) {
       logError(error, { context: 'critical-operation-failed' })
     }
   }
   ```

## 🚨 حالات الطوارئ

### فقدان البيانات

1. البحث في النسخ الاحتياطية: `userData/backups/`
2. استعادة آخر نسخة صالحة
3. إرسال تقرير للمطور عبر GitHub Issues

### بيانات فاسدة

1. تشغيل أدوات الإصلاح التلقائي
2. محاولة الاستعادة من النسخة الاحتياطية
3. إعادة تهيئة البيانات (آخر حل)

## 📞 الدعم

في حالة مشاكل البيانات:

1. تحقق من السجلات: `userData/error-logs/`
2. أرسل تقرير تلقائي: `Help > Send Error Report`
3. افتح Issue على GitHub مع السجلات

---

**آخر تحديث**: أكتوبر 2025  
**الإصدار**: 1.0.0
