# نظام التصميم (Design System)

> **الإصدار**: 1.0.0
> **تاريخ الإنشاء**: 7 أكتوبر 2025
> **الحالة**: ✅ نشط

## 📋 جدول المحتويات

- [نظرة عامة](#نظرة-عامة)
- [Design Tokens](#design-tokens)
- [السمات (Themes)](#السمات-themes)
- [الألوان](#الألوان)
- [Typography](#typography)
- [المسافات (Spacing)](#المسافات-spacing)
- [الظلال (Shadows)](#الظلال-shadows)
- [الرسوم المتحركة](#الرسوم-المتحركة)
- [أمثلة الاستخدام](#أمثلة-الاستخدام)
- [إرشادات أفضل الممارسات](#إرشادات-أفضل-الممارسات)

---

## نظرة عامة

نظام التصميم الموحد للتطبيق يوفر:

- **300+ Design Token** شاملة (ألوان، typography، spacing، shadows)
- **3 سمات رئيسية**: Light، Dark، High Contrast
- **دعم كامل للغة العربية** مع RTL
- **نظام ألوان دلالية** للحالات المختلفة
- **إمكانية وصول WCAG 2.1 AAA**

### البنية

```
src/
├── config/
│   └── design/
│       ├── tokens.config.ts      # جميع الـ Design Tokens
│       ├── themes.config.ts      # تعريف السمات الثلاث
│       └── index.ts              # Entry point
├── application/
│   └── providers/
│       └── ThemeProvider.tsx     # مزود السمات
└── styles/
    └── globals.css               # CSS Variables والأنماط العامة
```

---

## Design Tokens

### الوصول إلى Tokens

```typescript
import { designTokens } from '@/config/design';

// استخدام الألوان
const primaryColor = designTokens.colors.brand.primary[500];

// استخدام المسافات
const spacing = designTokens.spacing[4]; // 1rem = 16px

// استخدام الظلال
const shadow = designTokens.shadows.md;
```

### الفئات المتاحة

| الفئة | الوصف | عدد القيم |
|------|-------|----------|
| `colors` | نظام الألوان الشامل | 11 درجة × 8 مجموعات |
| `typography` | خطوط، أحجام، أوزان | 13 حجم، 9 أوزان |
| `spacing` | نظام المسافات (4px base) | 40+ قيمة |
| `shadows` | الظلال والتأثيرات | 12 نوع |
| `borderRadius` | حواف العناصر | 9 مستويات |
| `transitions` | الانتقالات والحركة | 7 سرعات، 6 منحنيات |
| `zIndex` | الطبقات | 11 مستوى |
| `opacity` | الشفافية | 14 درجة |
| `breakpoints` | نقاط التوقف | 7 أحجام شاشة |

---

## السمات (Themes)

### السمات المتاحة

#### 1. Light Theme (الافتراضية)
- خلفية فاتحة نظيفة
- ألوان ناعمة ومريحة للعين
- مناسبة للاستخدام النهاري

#### 2. Dark Theme
- خلفية داكنة لتقليل إجهاد العين
- ألوان محسّنة للإضاءة المنخفضة
- مناسبة للاستخدام الليلي

#### 3. High Contrast Theme
- تباين عالي (7:1+) لإمكانية الوصول
- ألوان مشبعة للوضوح الأقصى
- متوافق مع WCAG 2.1 AAA

### استخدام السمات

```tsx
import { ThemeProvider, useTheme } from '@/application/providers/ThemeProvider';

// في الجذر
function App() {
  return (
    <ThemeProvider defaultTheme="light" useSystemTheme={true}>
      <YourApp />
    </ThemeProvider>
  );
}

// في المكونات
function MyComponent() {
  const { theme, setTheme, toggleTheme, isDark } = useTheme();

  return (
    <div>
      <p>السمة الحالية: {theme}</p>
      <button onClick={toggleTheme}>تبديل السمة</button>
      <button onClick={() => setTheme('dark')}>وضع داكن</button>
    </div>
  );
}
```

#### تكامل الواجهة الحالي (9 أكتوبر 2025)

- تم تحديث `App.tsx` لإزالة حالة `isDarkMode` المحلية والاعتماد على `ThemeProvider` مباشرةً، بما في ذلك التخزين التلقائي لتفضيل السمة واسترداده عند الإطلاق.
- أعيد ربط مكون `Header` بزر تبديل واحد يقوم بالدوران بين السمات الثلاث (Light → Dark → High Contrast) عبر سياق التصميم مع أيقونات متوافقة مع كل حالة.
- يستخدم `Settings` الآن مكون `ThemeSelector` الموحد، مع مفاتيح للتحكم بالوضع الداكن والتباين العالي مرتبطة بالسياق بدلاً من الحقول المحلية، إضافةً إلى اعتماد تدرج الهوية (`from-primary` → `to-secondary`).
- تم إعادة بناء `PageLayout` لاستبدال جميع درجات Tailwind الثابتة بـ Tokens (`bg-background`, `bg-card`, `border-border`) وتفعيل احترام تفضيل تقليل الحركة عبر `useReducedMotion`.
- أزيلت جميع عمليات التلاعب اليدوي بـ `document.documentElement.classList` أو `localStorage`، ما يحصر إدارة السمات داخل المزود.

---

## الألوان

### نظام الألوان

#### Neutral Colors (الرمادي)
11 درجة من الرمادي للخلفيات والنصوص:

```css
/* Light theme */
--neutral-50: 0 0% 98%;   /* أفتح */
--neutral-500: 0 0% 45%;  /* متوسط */
--neutral-900: 0 0% 9%;   /* أغمق */
```

#### Brand Colors (هوية العلامة)

```typescript
// Primary - اللون الأساسي
colorTokens.brand.primary[500]  // الافتراضي
colorTokens.brand.primary[700]  // داكن

// Secondary - اللون الثانوي
colorTokens.brand.secondary[500]
```

#### Semantic Colors (الألوان الدلالية)

```typescript
// النجاح
colorTokens.semantic.success[600]  // أخضر

// التحذير
colorTokens.semantic.warning[500]  // برتقالي/أصفر

// الخطأ
colorTokens.semantic.error[500]    // أحمر

// المعلومات
colorTokens.semantic.info[500]     // أزرق
```

### استخدام الألوان في CSS

```css
/* Background colors */
.bg-primary { background-color: hsl(var(--primary)); }
.bg-success { background-color: hsl(var(--success)); }

/* Text colors */
.text-primary { color: hsl(var(--primary)); }
.text-destructive { color: hsl(var(--destructive)); }

/* مع الشفافية */
.bg-primary\/20 { background-color: hsl(var(--primary) / 0.2); }
```

### ألوان الرسوم البيانية

8 ألوان محسّنة للتمييز البصري:

```typescript
chart: {
  1: 'blue',    // أزرق
  2: 'green',   // أخضر
  3: 'yellow',  // أصفر
  4: 'red',     // أحمر
  5: 'purple',  // بنفسجي
  6: 'orange',  // برتقالي
  7: 'teal',    // أزرق مخضر
  8: 'pink',    // وردي
}
```

---

## Typography

### Font Families

```typescript
// Sans-serif (الافتراضي)
font-sans: "Segoe UI", "Cairo", "Tajawal", sans-serif

// Monospace (للكود)
font-mono: "Cascadia Code", "Fira Code", "Consolas"

// Arabic (للنصوص العربية)
font-arabic: "Cairo", "Tajawal", "IBM Plex Sans Arabic"
```

### Font Sizes
مقياس Modular Scale (1.250):

```typescript
text-xs:   0.75rem   // 12px
text-sm:   0.875rem  // 14px
text-base: 1rem      // 16px ← القاعدة
text-lg:   1.125rem  // 18px
text-xl:   1.25rem   // 20px
text-2xl:  1.5rem    // 24px
text-3xl:  1.875rem  // 30px
text-4xl:  2.25rem   // 36px
text-5xl:  3rem      // 48px
```

### Font Weights

```typescript
font-light:     300
font-normal:    400  ← الافتراضي
font-medium:    500
font-semibold:  600
font-bold:      700
font-extrabold: 800
```

### Line Heights

```typescript
leading-tight:   1.25   // للعناوين
leading-normal:  1.5    // للنصوص العادية
leading-relaxed: 1.625  // للنصوص الطويلة
```

### أمثلة الاستخدام

```tsx
// Heading
<h1 className="text-4xl font-bold leading-tight">
  عنوان رئيسي
</h1>

// Body text
<p className="text-base font-normal leading-normal">
  نص عادي للفقرات
</p>

// Caption
<span className="text-sm font-medium text-muted-foreground">
  تسمية توضيحية
</span>
```

---

## المسافات (Spacing)

### نظام المسافات
مبني على **4px base unit**:

```typescript
spacing: {
  1:  '0.25rem',   // 4px
  2:  '0.5rem',    // 8px
  3:  '0.75rem',   // 12px
  4:  '1rem',      // 16px
  6:  '1.5rem',    // 24px
  8:  '2rem',      // 32px
  12: '3rem',      // 48px
  16: '4rem',      // 64px
}
```

### أمثلة الاستخدام

```tsx
// Padding
<div className="p-4">      {/* 16px جميع الجهات */}
<div className="px-6 py-4"> {/* 24px أفقي، 16px عمودي */}

// Margin
<div className="mb-8">     {/* 32px margin-bottom */}
<div className="space-y-4"> {/* 16px بين العناصر الأبناء */}

// Gap
<div className="flex gap-3"> {/* 12px بين العناصر */}
```

---

## الظلال (Shadows)

### مستويات الظل

```typescript
shadow-xs:   // خفيف جداً - للعناصر الدقيقة
shadow-sm:   // خفيف - للبطاقات
shadow-md:   // متوسط - للعناصر المرتفعة
shadow-lg:   // كبير - للـ dropdowns
shadow-xl:   // كبير جداً - للـ modals
shadow-2xl:  // ضخم - للعناصر المميزة
```

### ظلال خاصة

```typescript
shadow-focus:   // للتركيز (أزرق)
shadow-error:   // للأخطاء (أحمر)
shadow-success: // للنجاح (أخضر)

// Glow effects
shadow-glow-sm: // توهج خفيف
shadow-glow:    // توهج متوسط
shadow-glow-lg: // توهج قوي
```

### أمثلة

```tsx
<div className="shadow-md hover:shadow-xl transition-shadow">
  بطاقة مع تأثير hover
</div>

<button className="focus:shadow-focus">
  زر مع ظل تركيز
</button>
```

---

## الرسوم المتحركة

### Animations المتاحة

```typescript
// Fade
animate-fade-in
animate-fade-out

// Slide
animate-slide-up
animate-slide-down
animate-slide-in-right
animate-slide-out-right

// Scale
animate-scale-in
animate-scale-out

// Special
animate-spin-slow      // دوران بطيء
animate-pulse-soft     // نبض ناعم
```

### Transition Durations

```typescript
duration-0:    0ms      // فوري
duration-150:  150ms    // سريع
duration-200:  200ms    // عادي
duration-300:  300ms    // متوسط
duration-500:  500ms    // بطيء
```

### أمثلة

```tsx
<div className="transition-all duration-200 hover:scale-105">
  عنصر مع تحويل سلس
</div>

<div className="animate-fade-in">
  عنصر يظهر تدريجياً
</div>
```

### Reduced Motion
يتم احترام تفضيلات المستخدم تلقائياً:

```css
@media (prefers-reduced-motion: reduce) {
  /* جميع الحركات تصبح فورية */
  * {
    animation-duration: 0.01ms !important;
  }
}
```

---

## أمثلة الاستخدام

### بطاقة احترافية

```tsx
function Card({ title, children }) {
  return (
    <div className="
      bg-card text-card-foreground
      rounded-lg shadow-md
      p-6 space-y-4
      border border-border
      hover:shadow-lg
      transition-shadow duration-200
    ">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="text-base leading-relaxed">
        {children}
      </div>
    </div>
  );
}
```

### زر أساسي

```tsx
function Button({ children, variant = 'primary' }) {
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    success: 'bg-success text-success-foreground hover:bg-success/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  };

  return (
    <button className={`
      ${variants[variant]}
      px-4 py-2 rounded-md
      font-medium
      transition-colors duration-200
      focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
    `}>
      {children}
    </button>
  );
}
```

### تنبيه (Alert)

```tsx
function Alert({ type = 'info', children }) {
  const types = {
    info: 'bg-info/10 text-info border-info/20',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    error: 'bg-error/10 text-error border-error/20',
  };

  return (
    <div className={`
      ${types[type]}
      p-4 rounded-md border-r-4
      flex items-start gap-3
    `}>
      {children}
    </div>
  );
}
```

---

## إرشادات أفضل الممارسات

### ✅ افعل

- **استخدم Tokens دائماً** بدلاً من القيم الثابتة
  ```tsx
  ✅ className="text-primary"
  ❌ style={{ color: '#1a1a1a' }}
  ```

- **استخدم الألوان الدلالية** للحالات
  ```tsx
  ✅ className="text-success"
  ❌ className="text-green-600"
  ```

- **استخدم نظام المسافات** المحدد
  ```tsx
  ✅ className="mb-4"
  ❌ style={{ marginBottom: '17px' }}
  ```

- **اتبع مقياس Typography** الموحد
  ```tsx
  ✅ className="text-xl"
  ❌ style={{ fontSize: '19px' }}
  ```

### ❌ لا تفعل

- **لا تستخدم قيم ثابتة للألوان**
  ```tsx
  ❌ style={{ color: '#ff0000' }}
  ```

- **لا تخلق مسافات مخصصة**
  ```tsx
  ❌ style={{ padding: '13px' }}
  ```

- **لا تتجاوز نظام السمات**
  ```tsx
  ❌ style={{ backgroundColor: 'white' }} في Dark mode
  ```

- **لا تستخدم حركات سريعة جداً**
  ```tsx
  ❌ transition-duration: 50ms (مزعج للعين)
  ```

### التباين والوصولية

- **تأكد من نسبة تباين 4.5:1+** للنصوص العادية
- **استخدم 7:1+** للنصوص الصغيرة
- **اختبر مع High Contrast Theme**
- **وفر بدائل نصية للألوان**

### الأداء

- **استخدم CSS Variables** للسمات الديناميكية
- **قلّل استخدام shadows الثقيلة** في العناصر الكثيرة
- **استخدم will-change** فقط عند الضرورة
- **اختبر الأداء** على الأجهزة الضعيفة

---

## الدعم والمساعدة

### الموارد

- **الملفات الأساسية**:
  - [`src/config/design/tokens.config.ts`](../src/config/design/tokens.config.ts)
  - [`src/config/design/themes.config.ts`](../src/config/design/themes.config.ts)
  - [`src/styles/globals.css`](../src/styles/globals.css)

- **التوثيق**:
  - [Tailwind CSS Docs](https://tailwindcss.com/docs)
  - [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### التحديثات المستقبلية

- [ ] إضافة أمثلة مباشرة في Storybook
- [ ] توليد ملف PDF للـ Design Guidelines
- [ ] إنشاء Figma Design Kit
- [ ] إضافة أدوات تدقيق الوصولية

---

**آخر تحديث**: 7 أكتوبر 2025
**الإصدار**: 1.0.0
**المطور**: فريق التطوير
