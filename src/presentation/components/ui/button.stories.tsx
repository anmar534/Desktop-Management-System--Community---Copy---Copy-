import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'
import { Download, Trash2, Save, Plus, RefreshCw, Check, X } from 'lucide-react'

const meta: Meta<typeof Button> = {
  title: 'UI Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Button Component (مكون الزر)

مكون زر قابل للتخصيص بشكل كامل مع دعم متعدد للأشكال والأحجام والحالات.

## المميزات
- ✅ **6 أشكال مختلفة:** default, destructive, outline, secondary, ghost, link
- ✅ **4 أحجام:** sm, default, lg, icon
- ✅ **دعم الأيقونات:** يمكن إضافة أيقونات من lucide-react
- ✅ **حالات متعددة:** عادي، hover، disabled، loading
- ✅ **دعم كامل للثيمات:** Light, Dark, High Contrast
- ✅ **استخدام Design Tokens:** يستخدم ألوان semantic من نظام التصميم

## استخدام Design Tokens
- \`bg-primary\` - اللون الأساسي من tokens
- \`bg-destructive\` - لون الحذف/التحذير
- \`border-input\` - حدود الإدخال
- \`text-primary-foreground\` - نص على خلفية primary
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'شكل الزر',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'حجم الزر',
    },
    disabled: {
      control: 'boolean',
      description: 'تعطيل الزر',
    },
    asChild: {
      control: 'boolean',
      description: 'استخدام كمكون child',
    },
  },
}

export default meta
type Story = StoryObj<typeof Button>

/**
 * الزر الافتراضي مع اللون الأساسي
 */
export const Default: Story = {
  args: {
    children: 'حفظ',
    variant: 'default',
  },
}

/**
 * زر الحذف مع لون تحذيري
 */
export const Destructive: Story = {
  args: {
    children: 'حذف',
    variant: 'destructive',
  },
}

/**
 * زر بحدود فقط
 */
export const Outline: Story = {
  args: {
    children: 'إلغاء',
    variant: 'outline',
  },
}

/**
 * زر ثانوي
 */
export const Secondary: Story = {
  args: {
    children: 'ثانوي',
    variant: 'secondary',
  },
}

/**
 * زر شبحي (بدون خلفية)
 */
export const Ghost: Story = {
  args: {
    children: 'تحرير',
    variant: 'ghost',
  },
}

/**
 * زر كرابط
 */
export const Link: Story = {
  args: {
    children: 'اقرأ المزيد',
    variant: 'link',
  },
}

/**
 * زر صغير
 */
export const Small: Story = {
  args: {
    children: 'صغير',
    size: 'sm',
  },
}

/**
 * زر كبير
 */
export const Large: Story = {
  args: {
    children: 'كبير',
    size: 'lg',
  },
}

/**
 * زر مع أيقونة فقط
 */
export const IconOnly: Story = {
  args: {
    variant: 'outline',
    size: 'icon',
    children: <Plus className="h-4 w-4" />,
  },
}

/**
 * زر مع أيقونة ونص
 */
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Download className="h-4 w-4" />
        تنزيل
      </>
    ),
  },
}

/**
 * زر معطل
 */
export const Disabled: Story = {
  args: {
    children: 'معطل',
    disabled: true,
  },
}

/**
 * زر التحميل
 */
export const Loading: Story = {
  args: {
    disabled: true,
    children: (
      <>
        <RefreshCw className="h-4 w-4 animate-spin" />
        جاري التحميل...
      </>
    ),
  },
}

/**
 * جميع الأشكال - عرض شامل
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-spacing-6">
      <div>
        <h3 className="text-lg font-semibold mb-spacing-4">جميع الأشكال (All Variants)</h3>
        <div className="flex flex-wrap gap-spacing-3">
          <Button variant="default">افتراضي</Button>
          <Button variant="destructive">حذف</Button>
          <Button variant="outline">محدد</Button>
          <Button variant="secondary">ثانوي</Button>
          <Button variant="ghost">شبحي</Button>
          <Button variant="link">رابط</Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-spacing-4">جميع الأحجام (All Sizes)</h3>
        <div className="flex flex-wrap items-center gap-spacing-3">
          <Button size="sm">صغير</Button>
          <Button size="default">عادي</Button>
          <Button size="lg">كبير</Button>
          <Button size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-spacing-4">مع الأيقونات (With Icons)</h3>
        <div className="flex flex-wrap gap-spacing-3">
          <Button>
            <Download className="h-4 w-4" />
            تنزيل
          </Button>
          <Button variant="destructive">
            <Trash2 className="h-4 w-4" />
            حذف
          </Button>
          <Button variant="outline">
            <Save className="h-4 w-4" />
            حفظ
          </Button>
          <Button variant="secondary">
            <Plus className="h-4 w-4" />
            إضافة
          </Button>
          <Button variant="ghost">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-spacing-4">أيقونات فقط (Icon Only)</h3>
        <div className="flex flex-wrap gap-spacing-3">
          <Button size="icon">
            <Download className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline">
            <Save className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary">
            <Plus className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-spacing-4">حالات خاصة (Special States)</h3>
        <div className="flex flex-wrap gap-spacing-3">
          <Button disabled>معطل</Button>
          <Button disabled>
            <RefreshCw className="h-4 w-4 animate-spin" />
            جاري التحميل...
          </Button>
          <Button variant="outline">
            <Check className="h-4 w-4" />
            تم الحفظ
          </Button>
          <Button variant="destructive">
            <X className="h-4 w-4" />
            إلغاء العملية
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-spacing-4">مجموعات أزرار (Button Groups)</h3>
        <div className="flex flex-col gap-spacing-4">
          <div className="flex gap-spacing-2">
            <Button variant="outline">السابق</Button>
            <Button>التالي</Button>
          </div>
          <div className="flex gap-spacing-2">
            <Button variant="destructive">حذف</Button>
            <Button variant="outline">إلغاء</Button>
            <Button>حفظ</Button>
          </div>
        </div>
      </div>
    </div>
  ),
}

/**
 * اختبار الثيمات - يظهر الزر في جميع الثيمات
 */
export const ThemeTesting: Story = {
  render: () => (
    <div className="flex flex-col gap-spacing-8">
      <div data-theme="light" className="p-spacing-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-spacing-4">Light Theme</h3>
        <div className="flex flex-wrap gap-spacing-3">
          <Button>افتراضي</Button>
          <Button variant="destructive">حذف</Button>
          <Button variant="outline">محدد</Button>
          <Button variant="secondary">ثانوي</Button>
          <Button variant="ghost">شبحي</Button>
        </div>
      </div>

      <div
        data-theme="dark"
        className="p-spacing-6 rounded-lg border bg-muted text-muted-foreground"
      >
        <h3 className="text-lg font-semibold mb-spacing-4 text-foreground">Dark Theme</h3>
        <div className="flex flex-wrap gap-spacing-3">
          <Button>افتراضي</Button>
          <Button variant="destructive">حذف</Button>
          <Button variant="outline">محدد</Button>
          <Button variant="secondary">ثانوي</Button>
          <Button variant="ghost">شبحي</Button>
        </div>
      </div>

      <div
        data-theme="high-contrast"
        className="p-spacing-6 rounded-lg border bg-background text-foreground"
      >
        <h3 className="text-lg font-semibold mb-spacing-4">High Contrast Theme</h3>
        <div className="flex flex-wrap gap-spacing-3">
          <Button>افتراضي</Button>
          <Button variant="destructive">حذف</Button>
          <Button variant="outline">محدد</Button>
          <Button variant="secondary">ثانوي</Button>
          <Button variant="ghost">شبحي</Button>
        </div>
      </div>
    </div>
  ),
}

/**
 * دليل الاستخدام
 */
export const UsageGuide: Story = {
  render: () => (
    <div className="max-w-2xl space-y-spacing-6 p-spacing-6">
      <div>
        <h3 className="text-xl font-bold mb-spacing-3">متى تستخدم كل شكل؟</h3>

        <div className="space-y-spacing-4">
          <div className="border-l-4 border-primary pl-spacing-4">
            <h4 className="font-semibold">Default (افتراضي)</h4>
            <p className="text-sm text-muted-foreground">
              للإجراءات الأساسية والمهمة: حفظ، إرسال، تأكيد
            </p>
            <Button className="mt-spacing-2">حفظ التغييرات</Button>
          </div>

          <div className="border-l-4 border-destructive pl-spacing-4">
            <h4 className="font-semibold">Destructive (تدميري)</h4>
            <p className="text-sm text-muted-foreground">
              للإجراءات الخطيرة: حذف، إزالة، إلغاء نهائي
            </p>
            <Button variant="destructive" className="mt-spacing-2">
              حذف العنصر
            </Button>
          </div>

          <div className="border-l-4 border-muted pl-spacing-4">
            <h4 className="font-semibold">Outline (محدد)</h4>
            <p className="text-sm text-muted-foreground">للإجراءات الثانوية: إلغاء، رجوع، تعديل</p>
            <Button variant="outline" className="mt-spacing-2">
              إلغاء
            </Button>
          </div>

          <div className="border-l-4 border-muted-foreground pl-spacing-4">
            <h4 className="font-semibold">Secondary (ثانوي)</h4>
            <p className="text-sm text-muted-foreground">لإجراءات مساعدة أقل أهمية</p>
            <Button variant="secondary" className="mt-spacing-2">
              عرض التفاصيل
            </Button>
          </div>

          <div className="border-l-4 border-border pl-spacing-4">
            <h4 className="font-semibold">Ghost (شبحي)</h4>
            <p className="text-sm text-muted-foreground">لأزرار التنقل والإجراءات الخفيفة</p>
            <Button variant="ghost" className="mt-spacing-2">
              تحرير
            </Button>
          </div>

          <div className="border-l-4 border-info pl-spacing-4">
            <h4 className="font-semibold">Link (رابط)</h4>
            <p className="text-sm text-muted-foreground">للروابط داخل النصوص</p>
            <Button variant="link" className="mt-spacing-2">
              اقرأ المزيد
            </Button>
          </div>
        </div>
      </div>

      <div className="border-t pt-spacing-6">
        <h3 className="text-xl font-bold mb-spacing-3">إرشادات إضافية</h3>
        <ul className="list-disc list-inside space-y-spacing-2 text-sm">
          <li>استخدم أيقونات مع النصوص للوضوح</li>
          <li>الأزرار الأساسية يجب أن تكون واضحة ومميزة</li>
          <li>تجنب استخدام أكثر من زر primary في نفس الصفحة</li>
          <li>استخدم size=&quot;lg&quot; للـ CTAs المهمة</li>
          <li>أضف حالة loading عند إرسال البيانات</li>
        </ul>
      </div>
    </div>
  ),
}
