# إصلاح التحديث التلقائي للمستودعات الخاصة

# Fixing Auto-Update for Private Repositories

## المشكلة المكتشفة

المستودع على GitHub **خاص (Private)** لذلك:

- ❌ `electron-updater` لا يستطيع الوصول إلى Releases
- ❌ يظهر خطأ 404 دائماً
- ❌ التحديث التلقائي لن يعمل بدون مصادقة

## الحلول الممكنة

### الحل 1: جعل المستودع عاماً (موصى به للتطبيقات العامة) ⭐

أسهل حل إذا كان التطبيق للاستخدام العام:

1. اذهب إلى: https://github.com/anmar534/Desktop-Management-System--Community---Copy---Copy-/settings
2. انزل إلى **Danger Zone**
3. اضغط **"Change repository visibility"**
4. اختر **"Make public"**
5. أكد بكتابة اسم المستودع

**المزايا:**

- ✅ التحديث التلقائي يعمل فوراً
- ✅ لا حاجة لـ tokens
- ✅ أبسط وأسهل

**العيوب:**

- ⚠️ الكود يصبح متاحاً للجميع

---

### الحل 2: استخدام GitHub Token للمستودعات الخاصة

إذا كان المستودع يجب أن يبقى خاصاً:

#### 2.1: إنشاء Token

1. اذهب إلى: https://github.com/settings/tokens/new
2. اسم Token: `Desktop Management Updates`
3. Expiration: No expiration (أو حسب الحاجة)
4. Scopes المطلوبة:
   - ✅ `repo` (full control of private repositories)
5. اضغط **Generate token**
6. **انسخ Token** (لن تراه مرة أخرى!)

#### 2.2: تعديل electron-builder.yml

```yaml
publish:
  - provider: github
    owner: anmar534
    repo: Desktop-Management-System--Community---Copy---Copy-
    releaseType: release
    private: true # ← أضف هذا السطر
    token: ${GH_TOKEN} # ← أضف هذا السطر
```

#### 2.3: تعديل src/electron/main.cjs

```javascript
// في دالة setupAutoUpdater()
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'anmar534',
  repo: 'Desktop-Management-System--Community---Copy---Copy-',
  releaseType: 'release',
  private: true, // ← أضف
  token: process.env.GH_TOKEN, // ← أضف
})
```

#### 2.4: تضمين Token في التطبيق (غير آمن!)

⚠️ **تحذير**: هذه الطريقة غير آمنة لأن Token سيكون مكشوفاً في التطبيق!

بدلاً من ذلك، استخدم **Generic Provider** مع رابط مباشر:

```yaml
publish:
  - provider: generic
    url: https://${GH_TOKEN}@github.com/anmar534/Desktop-Management-System--Community---Copy---Copy-/releases/download/v${version}
```

**المزايا:**

- ✅ المستودع يبقى خاصاً
- ✅ التحديث التلقائي يعمل

**العيوب:**

- ⚠️ معقد أكثر
- ⚠️ يحتاج token management
- ⚠️ مشاكل أمنية محتملة

---

### الحل 3: استخدام خادم تحديثات مخصص

للمؤسسات الكبيرة:

1. استضف الملفات على خادم خاص
2. استخدم `provider: generic` في electron-builder.yml
3. وفر مصادقة مخصصة

```yaml
publish:
  - provider: generic
    url: https://updates.yourcompany.com/desktop-management/${version}
```

---

## الحل الموصى به حسب الحالة

### للاستخدام الداخلي فقط (شركة واحدة)

- **الحل 3**: خادم تحديثات داخلي
- أو **الحل 2** مع token management محكم

### للتوزيع العام/التجاري

- **الحل 1**: اجعل المستودع عاماً ✅
- أو أنشئ مستودع منفصل عام للـ releases فقط

### للمصادر المفتوحة

- **الحل 1**: اجعل المستودع عاماً ✅

---

## الخطوات العملية (الحل 1 - موصى به)

### 1. اجعل المستودع عاماً

```
1. https://github.com/anmar534/Desktop-Management-System--Community---Copy---Copy-/settings
2. Danger Zone → Change repository visibility
3. Make public
4. أكد
```

### 2. انشر Release

```powershell
# الآن النشر سيعمل بدون مشاكل
git push origin v1.0.4
$env:GH_TOKEN = "your_token"
npm run build
npm run build:electron:publish
```

### 3. جرّب التحديث

```
من الإعدادات → التحقق من التحديثات
✅ يجب أن يعمل الآن!
```

---

## إذا كان المستودع يجب أن يبقى خاصاً

### تطبيق الحل 2 (مع Token)

#### ملف: electron-builder.yml

```yaml
publish:
  - provider: github
    owner: anmar534
    repo: Desktop-Management-System--Community---Copy---Copy-
    releaseType: release
    private: true
```

#### ملف: src/electron/main.cjs

```javascript
// في setupAutoUpdater()
const updateToken = process.env.GITHUB_UPDATE_TOKEN || ''

if (updateToken) {
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'anmar534',
    repo: 'Desktop-Management-System--Community---Copy---Copy-',
    releaseType: 'release',
    private: true,
    token: updateToken,
  })
} else {
  console.warn('⚠️ No GITHUB_UPDATE_TOKEN found - updates may not work for private repo')
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'anmar534',
    repo: 'Desktop-Management-System--Community---Copy---Copy-',
    releaseType: 'release',
  })
}
```

#### توزيع Token للمستخدمين

```powershell
# على كل جهاز مستخدم:
[System.Environment]::SetEnvironmentVariable('GITHUB_UPDATE_TOKEN', 'ghp_xxxxx', 'User')
```

---

## الخلاصة

| الحل                 | صعوبة         | أمان     | يعمل مع Private? |
| -------------------- | ------------- | -------- | ---------------- |
| **1. Public Repo**   | ⭐ سهل        | ✅ عام   | ❌               |
| **2. GitHub Token**  | ⭐⭐⭐ صعب    | ⚠️ متوسط | ✅               |
| **3. Custom Server** | ⭐⭐⭐⭐ معقد | ✅ ممتاز | ✅               |

**توصيتي:**

1. إذا لم يكن هناك مانع → **اجعل المستودع عاماً** (الأسهل)
2. إذا كان خاصاً → استخدم **Custom Update Server** للمؤسسات
3. تجنب تضمين Tokens في التطبيق (خطر أمني)

---

## اختبار الحل

بعد تطبيق أي حل:

```powershell
# 1. انشر release
git push origin v1.0.4

# 2. أنشئ Release على GitHub (يدوياً أو تلقائي)

# 3. جرب التحديث
# من التطبيق: الإعدادات → التحقق من التحديثات
```

يجب أن ترى:

- ✅ "أنت تستخدم أحدث إصدار" (إذا كنت على نفس الإصدار)
- أو ✅ "تحديث متاح" (إذا كان هناك إصدار أحدث)
- ❌ لا خطأ 404

---

## روابط مفيدة

- [electron-updater docs](https://www.electron.build/auto-update)
- [Private repositories](https://www.electron.build/auto-update#private-github-update-repo)
- [Generic Provider](https://www.electron.build/configuration/publish#genericserveroptions)
