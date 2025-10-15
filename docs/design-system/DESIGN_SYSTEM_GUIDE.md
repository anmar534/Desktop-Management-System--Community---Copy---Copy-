# دليل نظام التصميم
# Design System Guide

**Sprint:** 5.4.1 - توحيد نظام التصميم  
**التاريخ / Date:** 15 أكتوبر 2025  
**الإصدار / Version:** 1.0.0

---

## 📋 جدول المحتويات / Table of Contents

1. [نظرة عامة / Overview](#overview)
2. [الألوان / Colors](#colors)
3. [الطباعة / Typography](#typography)
4. [المسافات / Spacing](#spacing)
5. [المكونات / Components](#components)
6. [الأنماط / Patterns](#patterns)
7. [إمكانية الوصول / Accessibility](#accessibility)
8. [أمثلة الاستخدام / Usage Examples](#usage-examples)

---

## <a name="overview"></a>نظرة عامة / Overview

نظام التصميم الموحد لنظام إدارة المقاولات يوفر مجموعة شاملة من المبادئ التوجيهية، المكونات، والأنماط لضمان تجربة مستخدم متسقة عبر التطبيق.

The unified design system for the Desktop Management System provides a comprehensive set of guidelines, components, and patterns to ensure a consistent user experience across the application.

### الملفات الأساسية / Core Files

```
src/styles/
├── design-system.ts      # Design tokens and constants
├── variables.css         # CSS variables
├── global.css           # Global styles
└── theme.config.ts      # Theme configuration
```

---

## <a name="colors"></a>الألوان / Colors

### لوحة الألوان الأساسية / Primary Color Palette

#### Primary (الأزرق / Blue)
```css
--color-primary-50: #E3F2FD
--color-primary-500: #2196F3  /* Main */
--color-primary-900: #0D47A1
```

**الاستخدام / Usage:**
- الأزرار الأساسية / Primary buttons
- الروابط / Links
- العناصر التفاعلية / Interactive elements

#### Secondary (البنفسجي / Purple)
```css
--color-secondary-50: #F3E5F5
--color-secondary-500: #9C27B0  /* Main */
--color-secondary-900: #4A148C
```

**الاستخدام / Usage:**
- الأزرار الثانوية / Secondary buttons
- التمييز / Accents
- العناصر الداعمة / Supporting elements

### ألوان الحالة / Status Colors

#### Success (النجاح / Green)
```css
--color-success-500: #4CAF50
```
**الاستخدام:** رسائل النجاح، الحالات الإيجابية

#### Warning (التحذير / Orange)
```css
--color-warning-500: #FF9800
```
**الاستخدام:** تحذيرات، تنبيهات

#### Error (الخطأ / Red)
```css
--color-error-500: #F44336
```
**الاستخدام:** رسائل الخطأ، الحالات السلبية

#### Info (المعلومات / Light Blue)
```css
--color-info-500: #03A9F4
```
**الاستخدام:** رسائل معلوماتية، نصائح

### الألوان المحايدة / Neutral Colors

```css
--color-neutral-0: #FFFFFF    /* White */
--color-neutral-100: #F5F5F5  /* Light gray */
--color-neutral-500: #9E9E9E  /* Medium gray */
--color-neutral-900: #212121  /* Dark gray */
--color-neutral-1000: #000000 /* Black */
```

### أمثلة الاستخدام / Usage Examples

#### TypeScript
```typescript
import { designTokens } from '@/styles/design-system'

const primaryColor = designTokens.colors.primary[500]
const successColor = designTokens.colors.success[500]
```

#### CSS
```css
.button-primary {
  background-color: var(--color-primary-500);
  color: var(--color-neutral-0);
}
```

#### Tailwind CSS
```jsx
<button className="bg-primary-500 text-white">
  Click me
</button>
```

---

## <a name="typography"></a>الطباعة / Typography

### عائلات الخطوط / Font Families

#### Primary (English)
```css
--font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
```

#### Arabic (العربية)
```css
--font-family-arabic: 'Tajawal', 'Cairo', 'Noto Sans Arabic', sans-serif
```

#### Monospace (الكود)
```css
--font-family-mono: 'Fira Code', 'Courier New', monospace
```

### أحجام الخطوط / Font Sizes

| الحجم / Size | القيمة / Value | الاستخدام / Usage |
|-------------|---------------|------------------|
| xs | 0.75rem (12px) | نص صغير جداً / Very small text |
| sm | 0.875rem (14px) | نص صغير / Small text |
| base | 1rem (16px) | نص أساسي / Body text |
| lg | 1.125rem (18px) | نص كبير / Large text |
| xl | 1.25rem (20px) | عناوين صغيرة / Small headings |
| 2xl | 1.5rem (24px) | عناوين متوسطة / Medium headings |
| 3xl | 1.875rem (30px) | عناوين كبيرة / Large headings |
| 4xl | 2.25rem (36px) | عناوين رئيسية / Main headings |

### أوزان الخطوط / Font Weights

| الوزن / Weight | القيمة / Value | الاستخدام / Usage |
|---------------|---------------|------------------|
| light | 300 | نص خفيف / Light text |
| regular | 400 | نص عادي / Regular text |
| medium | 500 | نص متوسط / Medium text |
| semibold | 600 | نص شبه عريض / Semibold text |
| bold | 700 | نص عريض / Bold text |
| extrabold | 800 | نص عريض جداً / Extra bold text |

### أمثلة / Examples

```css
/* Heading 1 */
h1 {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
}

/* Body text */
p {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-normal);
}

/* Small text */
small {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-regular);
}
```

---

## <a name="spacing"></a>المسافات / Spacing

### نظام المسافات / Spacing System

نستخدم نظام مسافات قائم على 4px:

| الاسم / Name | القيمة / Value | الاستخدام / Usage |
|-------------|---------------|------------------|
| 0 | 0 | بدون مسافة / No spacing |
| 1 | 0.25rem (4px) | مسافة صغيرة جداً / Extra small |
| 2 | 0.5rem (8px) | مسافة صغيرة / Small |
| 3 | 0.75rem (12px) | مسافة متوسطة صغيرة / Small-medium |
| 4 | 1rem (16px) | مسافة متوسطة / Medium |
| 6 | 1.5rem (24px) | مسافة كبيرة / Large |
| 8 | 2rem (32px) | مسافة كبيرة جداً / Extra large |
| 12 | 3rem (48px) | مسافة ضخمة / Huge |

### أمثلة / Examples

```css
/* Padding */
.card {
  padding: var(--spacing-6);
}

/* Margin */
.section {
  margin-bottom: var(--spacing-8);
}

/* Gap */
.flex-container {
  display: flex;
  gap: var(--spacing-4);
}
```

---

## <a name="components"></a>المكونات / Components

### الأزرار / Buttons

#### الأحجام / Sizes

```typescript
// Extra Small
<Button size="xs">Button</Button>

// Small
<Button size="sm">Button</Button>

// Medium (default)
<Button size="md">Button</Button>

// Large
<Button size="lg">Button</Button>

// Extra Large
<Button size="xl">Button</Button>
```

#### الأنواع / Variants

```typescript
// Primary
<Button variant="primary">Primary</Button>

// Secondary
<Button variant="secondary">Secondary</Button>

// Success
<Button variant="success">Success</Button>

// Warning
<Button variant="warning">Warning</Button>

// Error
<Button variant="error">Error</Button>

// Ghost
<Button variant="ghost">Ghost</Button>

// Outline
<Button variant="outline">Outline</Button>
```

### الحقول / Inputs

```typescript
// Small
<Input size="sm" placeholder="Small input" />

// Medium (default)
<Input size="md" placeholder="Medium input" />

// Large
<Input size="lg" placeholder="Large input" />
```

---

## <a name="patterns"></a>الأنماط / Patterns

### البطاقات / Cards

```css
.card {
  background-color: var(--color-background-paper);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-6);
}
```

### النماذج / Forms

```css
.form-group {
  margin-bottom: var(--spacing-6);
}

.form-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--spacing-2);
  color: var(--color-text-primary);
}

.form-input {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
}
```

---

## <a name="accessibility"></a>إمكانية الوصول / Accessibility

### التباين / Contrast

جميع الألوان تلبي معايير WCAG 2.1 AA:
- نسبة تباين 4.5:1 للنص العادي
- نسبة تباين 3:1 للنص الكبير

### التركيز / Focus States

```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### دعم RTL / RTL Support

```css
body[dir="rtl"] {
  font-family: var(--font-family-arabic);
}
```

---

## <a name="usage-examples"></a>أمثلة الاستخدام / Usage Examples

### مثال كامل / Complete Example

```tsx
import { designTokens } from '@/styles/design-system'
import styled from 'styled-components'

const Card = styled.div`
  background-color: ${designTokens.colors.background.paper};
  border-radius: ${designTokens.borderRadius.lg};
  box-shadow: ${designTokens.shadows.md};
  padding: ${designTokens.spacing[6]};
  transition: ${designTokens.transitions.default};

  &:hover {
    box-shadow: ${designTokens.shadows.lg};
  }
`

const Title = styled.h2`
  font-size: ${designTokens.typography.fontSize['2xl']};
  font-weight: ${designTokens.typography.fontWeight.bold};
  color: ${designTokens.colors.text.primary};
  margin-bottom: ${designTokens.spacing[4]};
`

const Description = styled.p`
  font-size: ${designTokens.typography.fontSize.base};
  color: ${designTokens.colors.text.secondary};
  line-height: ${designTokens.typography.lineHeight.relaxed};
`

export function ExampleCard() {
  return (
    <Card>
      <Title>عنوان البطاقة / Card Title</Title>
      <Description>
        وصف البطاقة / Card description
      </Description>
    </Card>
  )
}
```

---

## 📚 المراجع / References

- [Material Design](https://material.io/design)
- [Tailwind CSS](https://tailwindcss.com)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**آخر تحديث / Last Updated:** 15 أكتوبر 2025

