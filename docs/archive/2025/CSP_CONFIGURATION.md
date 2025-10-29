# Content Security Policy (CSP) Configuration

**آخر تحديث**: 7 أكتوبر 2025

## نظرة عامة

تطبيق Desktop Management System يستخدم Content Security Policy (CSP) صارم لحماية التطبيق من هجمات XSS وغيرها من التهديدات الأمنية.

---

## التكوين الحالي

### 🔧 وضع التطوير (Development)

```javascript
{
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'style-src-elem': ["'self'", "'unsafe-inline'"],
  'style-src-attr': ["'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'blob:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': [
    "'self'",
    'http://localhost:*',
    'ws://localhost:*',
    'ws:',
    'wss:',
    'https://open.er-api.com',
    'https://*.er-api.com'
  ],
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'none'"],
  'form-action': ["'self'"]
}
```

#### لماذا `unsafe-eval` و `unsafe-inline` في التطوير؟

- **`unsafe-eval`**: ضروري لـ Vite Hot Module Replacement (HMR)
- **`unsafe-inline`**: ضروري للسكريبتات والأنماط التي يُضيفها Vite ديناميكياً
- **Hashes**: يتم تجاهلها في التطوير لتجنب تعطيل الأنماط المولدة (يُسمح فقط بـ `'unsafe-inline'`)
- **WebSocket**: `ws:` و `wss:` لدعم Vite HMR

⚠️ **هام**: هذه الاستثناءات **فقط في وضع التطوير** ولن تكون موجودة في الإنتاج.

---

### 🔒 وضع الإنتاج (Production)

```javascript
{
  'default-src': ["'self'"],
  'script-src': ["'self'", "'nonce-XXXXXXXXXX'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'style-src-elem': ["'self'", "'nonce-XXXXXXXXXX'", ...BASELINE_HASHES],
  'style-src-attr': ["'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'blob:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': [
    "'self'",
    'https:',
    'https://open.er-api.com',
    'https://*.er-api.com'
  ],
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'none'"],
  'form-action': ["'self'"]
}
```

#### الحماية في الإنتاج

- ✅ **لا `unsafe-eval`**: حماية كاملة من تنفيذ كود ديناميكي
- ✅ **Nonce-based scripts**: السكريبتات تتطلب nonce فريد
- ✅ **HTTPS فقط**: للاتصالات الخارجية (باستثناء localhost في التطوير)
- ✅ **لا iframes**: منع تضمين المحتوى الخارجي

---

## الاستثناءات المُعتمدة

### 📡 External APIs المسموح بها

#### 1. Exchange Rates API

- **النطاق**: `https://open.er-api.com`, `https://*.er-api.com`
- **الغرض**: جلب أسعار صرف العملات الحية
- **الملف**: `src/services/exchangeRates.ts`
- **التردد**: مرة كل 6 ساعات (cached)

#### كيفية إضافة API جديد

1. **في التطوير**: أضف النطاق إلى `connectSources` في قسم `isDev`
2. **في الإنتاج**: أضف النطاق إلى `connectSources` في القسم الإنتاجي
3. **وثق السبب**: أضف الـ API هنا في هذا الملف

```javascript
// في src/electron/cspBuilder.cjs
if (isDev) {
  connectSources.push(
    'https://api.example.com',  // اشرح الغرض هنا
  );
} else {
  connectSources.push(
    'https://api.example.com',  // نفس الشيء للإنتاج
  );
}
```

---

## Style Hashes المُعتمدة

```javascript
const BASELINE_INLINE_STYLE_HASHES = [
  "'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='", // Empty style
  "'sha256-7lAG9nNPimWNBky6j9qnn0jfFzu5wK96KOj/UzoG0hg='"  // Bootstrap style
];
```

هذه الـ hashes تسمح بأنماط inline محددة مُسبقاً في `index.html`.

### كيفية إضافة Style Hash جديد

إذا أضفت `<style>` inline جديد في `index.html`:

1. شغّل التطبيق وافتح Console
2. ابحث عن الخطأ: `Refused to apply inline style...`
3. انسخ الـ hash من رسالة الخطأ: `'sha256-XXXXXX'`
4. أضفه إلى `BASELINE_INLINE_STYLE_HASHES` في `cspBuilder.cjs`

---

## Nonce Generation

### كيف يعمل

```javascript
// توليد nonce عشوائي لكل تحميل صفحة
const nonce = crypto.randomBytes(16).toString('base64');

// إضافته إلى CSP header
'script-src': ["'self'", `'nonce-${nonce}'`]
```

### التدوير التلقائي

- **عند بداية التطبيق**: يتم توليد nonce جديد
- **عند كل تنقل**: يتم تدوير الـ nonce (`rotateCspNonce()`)
- **لا يُعاد استخدام**: كل nonce يُستخدم مرة واحدة فقط

---

## استكشاف الأخطاء

### مشكلة: "Refused to execute inline script"

**السبب**: السكريبت لا يحتوي على nonce أو غير مسموح به

**الحل**:

1. **في التطوير**: تحقق من وجود `unsafe-inline` في `script-src`
2. **في الإنتاج**: تأكد من إضافة nonce للسكريبت: `<script nonce="${nonce}">`

### مشكلة: "Refused to apply inline style"

**السبب**: الـ style لا يحتوي على nonce أو hash

**الحل**:

1. **في التطوير**: تحقق من وجود `unsafe-inline` في `style-src-elem`
2. **في الإنتاج**: أضف hash الـ style إلى `BASELINE_INLINE_STYLE_HASHES`

### مشكلة: "Refused to connect to 'https://...'"

**السبب**: النطاق غير مسموح به في `connect-src`

**الحل**:

1. أضف النطاق إلى `connectSources` في `cspBuilder.cjs`
2. وثّق السبب في هذا الملف

---

## الاختبار

### التحقق من CSP في التطوير

```bash
# تشغيل التطبيق
node smart-electron-launcher.js

# افتح DevTools
# تحقق من Console - يجب ألا يكون هناك أخطاء CSP
```

### التحقق من CSP في الإنتاج

```bash
# بناء التطبيق
npm run build

# تشغيل النسخة المبنية
npm start

# افتح DevTools وتحقق من:
# 1. لا توجد unsafe-eval أو unsafe-inline في script-src
# 2. جميع السكريبتات تستخدم nonce
# 3. لا أخطاء CSP في Console
```

---

## Security Checklist

قبل الإصدار، تحقق من:

- [ ] لا `unsafe-eval` في الإنتاج
- [ ] لا `unsafe-inline` للسكريبتات في الإنتاج
- [ ] جميع APIs الخارجية موثقة ومُبررة
- [ ] Nonce rotation يعمل بشكل صحيح
- [ ] لا أخطاء CSP في Console (إنتاج)
- [ ] تم اختبار جميع الميزات مع CSP الصارم

---

## المراجع

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security)

---

**آخر مراجعة**: 7 أكتوبر 2025  
**الإصدار**: v1.0  
**المُحدّث بواسطة**: فريق الأمان
