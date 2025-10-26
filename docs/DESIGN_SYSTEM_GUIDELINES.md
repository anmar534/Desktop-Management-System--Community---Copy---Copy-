# Design System Guidelines - دليل نظام التصميم

**Version:** 1.0  
**Date:** October 8, 2025  
**Status:** Active

---

## 📚 جدول المحتويات

1. [مقدمة](#مقدمة)
2. [نظام الألوان](#نظام-الألوان)
3. [نظام التباعد](#نظام-التباعد)
4. [نظام الطباعة](#نظام-الطباعة)
5. [المكونات الأساسية](#المكونات-الأساسية)
6. [الثيمات](#الثيمات)
7. [إمكانية الوصول](#إمكانية-الوصول)
8. [الأنماط الشائعة](#الأنماط-الشائعة)

---

## 🎯 مقدمة

### الهدف

نظام التصميم هذا يوفر مجموعة موحدة من المكونات والإرشادات لضمان:

- **التناسق:** نفس الشكل والشعور في جميع أنحاء التطبيق
- **الكفاءة:** تطوير أسرع باستخدام مكونات جاهزة
- **جودة:** معايير عالية لإمكانية الوصول والأداء
- **المرونة:** سهولة التخصيص والتوسع

### المبادئ الأساسية

1. **البساطة أولاً:** تصاميم واضحة وسهلة الاستخدام
2. **إمكانية الوصول:** WCAG 2.1 AAA compliance
3. **الأداء:** مكونات سريعة ومحسّنة
4. **RTL Support:** دعم كامل للغة العربية
5. **Dark Mode:** دعم جميع الثيمات (Light, Dark, High Contrast)

---

## 🎨 نظام الألوان

### الألوان الأساسية (Primitive Colors)

```typescript
// من tokens.config.ts
colors: {
  // Grays
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    // ... إلى 900
  },

  // Blues
  blue: {
    50: '#eff6ff',
    // ... إلى 900
  },

  // وهكذا لجميع الألوان الـ 11
}
```

### الألوان الدلالية (Semantic Colors)

استخدم الألوان الدلالية دائماً بدلاً من الألوان المباشرة:

#### ✅ صحيح

```tsx
<div className="bg-primary text-primary-foreground" />
<div className="bg-destructive text-destructive-foreground" />
<div className="border-input" />
```

#### ❌ خطأ

```tsx
<div className="bg-blue-500 text-white" />
<div className="bg-red-500 text-white" />
<div style={{ borderColor: '#e5e7eb' }} />
```

### جدول الألوان الدلالية

| الاسم         | الاستخدام          | مثال                 |
| ------------- | ------------------ | -------------------- |
| `primary`     | الإجراءات الأساسية | أزرار الحفظ، الروابط |
| `secondary`   | الإجراءات الثانوية | أزرار مساعدة         |
| `destructive` | إجراءات خطيرة      | حذف، إلغاء           |
| `muted`       | محتوى ثانوي        | نصوص توضيحية         |
| `accent`      | تمييز              | hover states         |
| `card`        | خلفية البطاقات     | Card component       |
| `border`      | الحدود             | borders عامة         |
| `input`       | حقول الإدخال       | Input fields         |

### استخدام الألوان في الحالات

```tsx
// Normal state
<Button>حفظ</Button>

// Hover state (تلقائي في المكون)
<Button>حفظ</Button> // hover:bg-primary/90

// Disabled state
<Button disabled>حفظ</Button> // opacity-50

// Error state
<Input aria-invalid={true} /> // border-destructive
```

---

## 📏 نظام التباعد

### مقياس التباعد

نستخدم نظام تباعد من 8px base:

```typescript
spacing: {
  0: '0px',
  1: '4px',    // 0.25rem
  2: '8px',    // 0.5rem
  3: '12px',   // 0.75rem
  4: '16px',   // 1rem
  5: '20px',   // 1.25rem
  6: '24px',   // 1.5rem
  8: '32px',   // 2rem
  10: '40px',  // 2.5rem
  12: '48px',  // 3rem
  // ... حتى 96
}
```

### متى تستخدم كل حجم؟

| الحجم               | الاستخدام           | مثال                 |
| ------------------- | ------------------- | -------------------- |
| `spacing-1` (4px)   | مسافات صغيرة جداً   | بين الأيقونة والنص   |
| `spacing-2` (8px)   | مسافات صغيرة        | داخل الأزرار         |
| `spacing-3` (12px)  | مسافات متوسطة صغيرة | بين العناصر المرتبطة |
| `spacing-4` (16px)  | مسافات افتراضية     | padding عام          |
| `spacing-6` (24px)  | مسافات متوسطة       | بين الأقسام          |
| `spacing-8` (32px)  | مسافات كبيرة        | بين المكونات الكبيرة |
| `spacing-12` (48px) | مسافات كبيرة جداً   | هوامش الصفحات        |

### أمثلة الاستخدام

```tsx
// Padding
<div className="p-spacing-4">محتوى</div>

// Gap في Flexbox/Grid
<div className="flex gap-spacing-3">
  <Button>زر 1</Button>
  <Button>زر 2</Button>
</div>

// Margin
<div className="mb-spacing-6">
  <h2>عنوان</h2>
</div>
```

---

## ✍️ نظام الطباعة

### أحجام الخطوط

```typescript
fontSize: {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem',// 30px
  '4xl': '2.25rem', // 36px
  // ... حتى 9xl
}
```

### أوزان الخطوط

```typescript
fontWeight: {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
}
```

### هرمية الطباعة

| المستوى    | الحجم   | الوزن    | الاستخدام               |
| ---------- | ------- | -------- | ----------------------- |
| H1         | 4xl-5xl | bold     | عناوين الصفحات الرئيسية |
| H2         | 3xl-4xl | bold     | عناوين الأقسام          |
| H3         | 2xl-3xl | semibold | عناوين فرعية            |
| H4         | xl-2xl  | semibold | عناوين البطاقات         |
| Body Large | lg      | normal   | نصوص مهمة               |
| Body       | base    | normal   | نصوص عادية              |
| Body Small | sm      | normal   | نصوص ثانوية             |
| Caption    | xs      | normal   | ملاحظات                 |

### أمثلة

```tsx
// عنوان رئيسي
<h1 className="text-4xl font-bold">لوحة التحكم</h1>

// عنوان قسم
<h2 className="text-3xl font-semibold mb-spacing-4">المناقصات</h2>

// نص عادي
<p className="text-base">هذا نص عادي للمحتوى...</p>

// نص ثانوي
<p className="text-sm text-muted-foreground">معلومات إضافية</p>

// ملاحظة صغيرة
<span className="text-xs text-muted-foreground">آخر تحديث: اليوم</span>
```

---

## 🧩 المكونات الأساسية

### Button (الزر)

**متى تستخدم:**

- للإجراءات الأساسية (حفظ، إرسال، حذف)
- للتنقل بين الصفحات
- لفتح نوافذ أو dialogs

**الأشكال:**

```tsx
// Primary - الإجراء الأساسي في الصفحة
<Button>حفظ التغييرات</Button>

// Destructive - إجراءات خطيرة
<Button variant="destructive">حذف</Button>

// Outline - إجراءات ثانوية
<Button variant="outline">إلغاء</Button>

// Ghost - للتنقل والإجراءات الخفيفة
<Button variant="ghost">تحرير</Button>
```

**الإرشادات:**

- ✅ استخدم زر primary واحد فقط في كل قسم
- ✅ أضف أيقونات للوضوح
- ✅ استخدم نصوص واضحة ومختصرة
- ❌ لا تستخدم أكثر من 3 أزرار متتالية
- ❌ لا تستخدم destructive للإجراءات القابلة للتراجع

### Input (حقل الإدخال)

**متى تستخدم:**

- لإدخال نصوص قصيرة (اسم، بريد إلكتروني، رقم)
- للبحث
- للنماذج

**الأنواع:**

```tsx
// نص عادي
<Input type="text" placeholder="الاسم" />

// بريد إلكتروني
<Input type="email" placeholder="example@company.com" />

// كلمة مرور
<Input type="password" placeholder="••••••••" />

// بحث
<Input type="search" placeholder="البحث..." />
```

**الإرشادات:**

- ✅ استخدم labels دائماً
- ✅ أضف placeholder توضيحي
- ✅ استخدم النوع الصحيح (email, tel, number)
- ✅ أظهر رسائل الخطأ بوضوح
- ❌ لا تستخدم placeholder بديلاً عن label
- ❌ لا تجعل الحقل أكبر من اللازم

### Card (البطاقة)

**متى تستخدم:**

- لتجميع محتوى مرتبط
- لعرض معلومات منفصلة (عميل، مشروع، إحصائية)
- لإنشاء قوائم من العناصر

**البنية:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>عنوان البطاقة</CardTitle>
    <CardDescription>وصف قصير</CardDescription>
    <CardAction>
      <Button variant="ghost" size="icon">
        ⋮
      </Button>
    </CardAction>
  </CardHeader>
  <CardContent>{/* المحتوى الرئيسي */}</CardContent>
  <CardFooter>{/* أزرار أو روابط */}</CardFooter>
</Card>
```

**الإرشادات:**

- ✅ استخدم CardTitle و CardDescription دائماً
- ✅ أضف border-b و border-t للفصل البصري
- ✅ اجعل البطاقات متساوية في Grid
- ❌ لا تضع بطاقة داخل بطاقة
- ❌ لا تجعل المحتوى مزدحماً

### Badge (الشارة)

**متى تستخدم:**

- لعرض الحالات (نشط، معلق، مكتمل)
- للتصنيفات والعلامات
- للعدادات والأرقام

**الأشكال حسب الحالة:**

```tsx
// نجاح/إيجابي
<Badge variant="success">مكتمل</Badge>

// تحذير/يحتاج انتباه
<Badge variant="warning">قيد المراجعة</Badge>

// خطأ/سلبي
<Badge variant="destructive">مرفوض</Badge>

// معلومات/جديد
<Badge variant="info">جديد</Badge>

// محايد
<Badge variant="outline">مسودة</Badge>
```

**الإرشادات:**

- ✅ استخدم نصوص مختصرة (1-2 كلمة)
- ✅ اختر اللون المناسب للحالة
- ✅ أضف أيقونات عند الحاجة
- ❌ لا تستخدم أكثر من 3 badges متتالية
- ❌ لا تضع نصوص طويلة

---

## 🌓 الثيمات

### الثيمات المتاحة

1. **Light Theme (فاتح)**

   - الثيمة الافتراضية
   - خلفية بيضاء/رمادية فاتحة
   - نصوص داكنة

2. **Dark Theme (داكن)**

   - خلفية داكنة
   - نصوص فاتحة
   - ألوان أقل سطوعاً

3. **High Contrast Theme (تباين عالي)**
   - تباين WCAG AAA
   - للمستخدمين ذوي ضعف البصر
   - حدود واضحة جداً

### استخدام الثيمات

```tsx
// تبديل الثيمة
import { ThemeSwitcher } from '@/application/context/ThemeSwitcher'
;<ThemeSwitcher variant="dropdown" />
```

### اختبار المكونات في الثيمات

جميع المكونات يجب أن تُختبر في الثيمات الثلاثة:

```tsx
<div data-theme="light">
  {/* مكونك هنا */}
</div>

<div data-theme="dark">
  {/* مكونك هنا */}
</div>

<div data-theme="high-contrast">
  {/* مكونك هنا */}
</div>
```

---

## ♿ إمكانية الوصول

### المبادئ الأساسية

1. **التباين اللوني:**

   - WCAG AAA: نسبة 7:1 للنصوص العادية
   - WCAG AA: نسبة 4.5:1 كحد أدنى

2. **التنقل بلوحة المفاتيح:**

   - جميع المكونات يجب أن تكون قابلة للوصول بـ Tab
   - استخدم focus-visible للتركيز البصري

3. **قارئات الشاشة:**
   - استخدم ARIA labels عند الحاجة
   - استخدم semantic HTML

### أمثلة

```tsx
// Label صريح للـ Input
<label htmlFor="email">البريد الإلكتروني</label>
<Input id="email" type="email" />

// ARIA label لزر بدون نص
<Button aria-label="إغلاق" size="icon">
  <X />
</Button>

// حالة الخطأ
<Input
  aria-invalid={true}
  aria-describedby="error-message"
/>
<p id="error-message" className="text-destructive text-sm">
  البريد الإلكتروني مطلوب
</p>
```

---

## 🎯 الأنماط الشائعة

### نموذج (Form)

```tsx
<form className="space-y-spacing-4">
  <div>
    <label htmlFor="name" className="text-sm font-medium block mb-spacing-1">
      الاسم
    </label>
    <Input id="name" placeholder="أحمد محمد" />
  </div>

  <div>
    <label htmlFor="email" className="text-sm font-medium block mb-spacing-1">
      البريد الإلكتروني
    </label>
    <Input id="email" type="email" placeholder="ahmad@example.com" />
  </div>

  <div className="flex gap-spacing-2">
    <Button type="submit">حفظ</Button>
    <Button type="button" variant="outline">
      إلغاء
    </Button>
  </div>
</form>
```

### قائمة بطاقات (Card Grid)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-4">
  {items.map((item) => (
    <Card key={item.id}>
      <CardHeader>
        <CardTitle>{item.title}</CardTitle>
        <CardDescription>{item.description}</CardDescription>
      </CardHeader>
      <CardContent>{/* محتوى */}</CardContent>
    </Card>
  ))}
</div>
```

### صفحة بـ Header و Content

```tsx
<div className="space-y-spacing-6">
  <div className="flex justify-between items-center">
    <div>
      <h1 className="text-4xl font-bold">لوحة التحكم</h1>
      <p className="text-muted-foreground mt-spacing-2">مرحباً بك في النظام</p>
    </div>
    <Button>
      <Plus className="h-4 w-4" />
      إضافة جديد
    </Button>
  </div>

  <div className="grid grid-cols-3 gap-spacing-4">{/* بطاقات الإحصائيات */}</div>
</div>
```

### ترويسة لوحة تقارير/مشاريع (Page Hero Header)

استخدم هذا النمط عندما تحتاج لعرض مؤشرات أساسية وإجراءات سريعة في أعلى الصفحة (كما في صفحات المشاريع، المنافسات، التقارير، الإعدادات):

```tsx
<PageLayout
  tone="primary"
  title="التقارير والتحليلات"
  description="نظرة شاملة على الأداء"
  icon={FileText}
  quickActions={quickActions}
  quickStats={[]}
  showSearch={false}
  headerExtra={
    <div className="space-y-4">
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-l from-primary/10 via-card/40 to-background p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-muted-foreground md:gap-3">
          <StatusBadge
            status="default"
            label="إجمالي 42"
            icon={ListChecks}
            size="sm"
            className="shadow-none"
          />
          <StatusBadge
            status="success"
            label="جاهزة 28"
            icon={CheckCircle2}
            size="sm"
            className="shadow-none"
          />
          <StatusBadge
            status="info"
            label="قيد الإنشاء 6"
            icon={RefreshCw}
            size="sm"
            className="shadow-none"
          />
          <StatusBadge
            status="error"
            label="تحتاج تحديث 3"
            icon={AlertTriangle}
            size="sm"
            className="shadow-none"
          />
        </div>
      </div>

      <div className="rounded-3xl border border-border/40 bg-card/80 p-4 shadow-lg shadow-primary/10 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DetailCard
            title="المشاريع النشطة"
            value="12"
            subtitle="من إجمالي 32"
            icon={Building2}
            color="text-primary"
            bgColor="bg-primary/10"
            trend={{ value: '+5%', direction: 'up' }}
          />
          {/* بطاقات إضافية */}
        </div>
      </div>
    </div>
  }
/>
```

**ملاحظات أساسية:**

- اجعل `quickStats` مصفوفة فارغة لإخفاء البطاقات الصغيرة تحت العنوان.
- غلّف شارات الحالة داخل لوحة زجاجية مع تدرّج يعتمد على `tone` المستخدم.
- استخدم لون الظل والحدود الملائم لنبرة الصفحة (`primary`, `secondary`, ...).
- كرّر نفس البنية في الصفحات التي تتطلب مقارنة بصرية سريعة بين المؤشرات.

---

## 📖 موارد إضافية

- [Storybook Documentation](http://localhost:6006) - لعرض جميع المكونات
- [Design Tokens Reference](../config/tokens.config.ts) - جميع الـ tokens
- [Theme Configuration](../config/themes.config.ts) - إعدادات الثيمات
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) - معايير إمكانية الوصول

---

**آخر تحديث:** 8 أكتوبر 2025  
**الإصدار:** 1.0  
**الحالة:** نشط
