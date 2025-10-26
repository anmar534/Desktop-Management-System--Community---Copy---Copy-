import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './input'
import { Search as SearchIcon, Mail, Lock, User, Phone, Calendar } from 'lucide-react'

const meta: Meta<typeof Input> = {
  title: 'UI Components/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Input Component (مكون الإدخال)

مكون إدخال نصي مع دعم كامل للثيمات وحالات مختلفة.

## المميزات
- ✅ **أنواع متعددة:** text, email, password, number, tel, url, search
- ✅ **حالات مختلفة:** عادي، disabled، error، valid
- ✅ **دعم RTL:** يعمل بشكل صحيح مع العربية
- ✅ **دعم الثيمات:** Light, Dark, High Contrast
- ✅ **استخدام Design Tokens:** border-input, bg-input-background, text-muted-foreground

## Design Tokens المستخدمة
- \`border-input\` - لون الحدود
- \`bg-input-background\` - خلفية الإدخال
- \`text-muted-foreground\` - نص placeholder
- \`focus-visible:border-ring\` - لون عند التركيز
- \`aria-invalid:border-destructive\` - لون عند الخطأ
        `,
      },
    },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
      description: 'نوع الإدخال',
    },
    placeholder: {
      control: 'text',
      description: 'النص التوضيحي',
    },
    disabled: {
      control: 'boolean',
      description: 'تعطيل الحقل',
    },
  },
}

export default meta
type Story = StoryObj<typeof Input>

/**
 * حقل إدخال افتراضي
 */
export const Default: Story = {
  args: {
    placeholder: 'اكتب هنا...',
  },
}

/**
 * حقل بريد إلكتروني
 */
export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'example@company.com',
  },
}

/**
 * حقل كلمة المرور
 */
export const Password: Story = {
  args: {
    type: 'password',
    placeholder: '••••••••',
  },
}

/**
 * حقل بحث
 */
export const Search: Story = {
  args: {
    type: 'search',
    placeholder: 'البحث...',
  },
}

/**
 * حقل رقمي
 */
export const Number: Story = {
  args: {
    type: 'number',
    placeholder: '0',
  },
}

/**
 * حقل معطل
 */
export const Disabled: Story = {
  args: {
    placeholder: 'حقل معطل',
    disabled: true,
  },
}

/**
 * حقل مع خطأ
 */
export const WithError: Story = {
  args: {
    placeholder: 'البريد الإلكتروني',
    'aria-invalid': true,
  },
}

/**
 * جميع الأنواع - عرض شامل
 */
export const AllTypes: Story = {
  render: () => (
    <div className="flex flex-col gap-spacing-6 w-full max-w-md">
      <div>
        <h3 className="text-lg font-semibold mb-spacing-4">أنواع الإدخال (Input Types)</h3>
        <div className="space-y-spacing-3">
          <div>
            <label className="text-sm font-medium mb-spacing-1 block">نص عادي</label>
            <Input type="text" placeholder="اكتب نصاً..." />
          </div>

          <div>
            <label className="text-sm font-medium mb-spacing-1 block">بريد إلكتروني</label>
            <Input type="email" placeholder="example@company.com" />
          </div>

          <div>
            <label className="text-sm font-medium mb-spacing-1 block">كلمة المرور</label>
            <Input type="password" placeholder="••••••••" />
          </div>

          <div>
            <label className="text-sm font-medium mb-spacing-1 block">بحث</label>
            <Input type="search" placeholder="البحث..." />
          </div>

          <div>
            <label className="text-sm font-medium mb-spacing-1 block">رقم</label>
            <Input type="number" placeholder="0" />
          </div>

          <div>
            <label className="text-sm font-medium mb-spacing-1 block">هاتف</label>
            <Input type="tel" placeholder="+966 XX XXX XXXX" />
          </div>

          <div>
            <label className="text-sm font-medium mb-spacing-1 block">رابط</label>
            <Input type="url" placeholder="https://example.com" />
          </div>

          <div>
            <label className="text-sm font-medium mb-spacing-1 block">تاريخ</label>
            <Input type="date" />
          </div>
        </div>
      </div>
    </div>
  ),
}

/**
 * الحالات المختلفة
 */
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-spacing-6 w-full max-w-md">
      <div>
        <h3 className="text-lg font-semibold mb-spacing-4">الحالات (States)</h3>
        <div className="space-y-spacing-4">
          <div>
            <label className="text-sm font-medium mb-spacing-1 block">عادي</label>
            <Input placeholder="حقل إدخال عادي" />
            <p className="text-xs text-muted-foreground mt-spacing-1">الحالة الافتراضية</p>
          </div>

          <div>
            <label className="text-sm font-medium mb-spacing-1 block">مع قيمة</label>
            <Input defaultValue="نص موجود مسبقاً" />
            <p className="text-xs text-muted-foreground mt-spacing-1">حقل يحتوي على قيمة</p>
          </div>

          <div>
            <label className="text-sm font-medium mb-spacing-1 block text-destructive">خطأ</label>
            <Input placeholder="البريد الإلكتروني" aria-invalid={true} />
            <p className="text-xs text-destructive mt-spacing-1">البريد الإلكتروني غير صحيح</p>
          </div>

          <div>
            <label className="text-sm font-medium mb-spacing-1 block text-muted-foreground">
              معطل
            </label>
            <Input placeholder="حقل معطل" disabled />
            <p className="text-xs text-muted-foreground mt-spacing-1">لا يمكن التعديل</p>
          </div>

          <div>
            <label className="text-sm font-medium mb-spacing-1 block">قراءة فقط</label>
            <Input defaultValue="نص للقراءة فقط" readOnly />
            <p className="text-xs text-muted-foreground mt-spacing-1">يمكن القراءة فقط</p>
          </div>
        </div>
      </div>
    </div>
  ),
}

/**
 * مع أيقونات
 */
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-spacing-4 w-full max-w-md">
      <h3 className="text-lg font-semibold mb-spacing-2">مع أيقونات</h3>

      <div className="relative">
        <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="البحث..." className="pr-10" />
      </div>

      <div className="relative">
        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input type="email" placeholder="البريد الإلكتروني" className="pr-10" />
      </div>

      <div className="relative">
        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input type="password" placeholder="كلمة المرور" className="pr-10" />
      </div>

      <div className="relative">
        <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="اسم المستخدم" className="pr-10" />
      </div>

      <div className="relative">
        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input type="tel" placeholder="رقم الهاتف" className="pr-10" />
      </div>

      <div className="relative">
        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input type="date" className="pr-10" />
      </div>
    </div>
  ),
}

/**
 * نماذج استخدام شائعة
 */
export const CommonPatterns: Story = {
  render: () => (
    <div className="flex flex-col gap-spacing-8 w-full max-w-md">
      <div>
        <h3 className="text-lg font-semibold mb-spacing-4">نموذج تسجيل الدخول</h3>
        <div className="space-y-spacing-4 p-spacing-6 border rounded-lg">
          <div>
            <label htmlFor="login-email" className="text-sm font-medium mb-spacing-1 block">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="login-email"
                type="email"
                placeholder="example@company.com"
                className="pr-10"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="text-sm font-medium mb-spacing-1 block">
              كلمة المرور
            </label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="login-password" type="password" placeholder="••••••••" className="pr-10" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-spacing-4">نموذج بحث متقدم</h3>
        <div className="space-y-spacing-3 p-spacing-6 border rounded-lg">
          <div className="relative">
            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="البحث في العملاء..." className="pr-10" />
          </div>

          <div className="grid grid-cols-2 gap-spacing-3">
            <Input type="date" placeholder="من تاريخ" />
            <Input type="date" placeholder="إلى تاريخ" />
          </div>
        </div>
      </div>
    </div>
  ),
}

/**
 * اختبار الثيمات
 */
export const ThemeTesting: Story = {
  render: () => (
    <div className="flex flex-col gap-spacing-8">
      <div data-theme="light" className="p-spacing-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-spacing-4">Light Theme</h3>
        <div className="space-y-spacing-3 max-w-md">
          <Input placeholder="حقل إدخال عادي" />
          <Input defaultValue="مع قيمة" />
          <Input placeholder="حقل معطل" disabled />
          <Input placeholder="خطأ" aria-invalid={true} />
        </div>
      </div>

      <div data-theme="dark" className="p-spacing-6 rounded-lg border bg-background">
        <h3 className="text-lg font-semibold mb-spacing-4 text-foreground">Dark Theme</h3>
        <div className="space-y-spacing-3 max-w-md">
          <Input placeholder="حقل إدخال عادي" />
          <Input defaultValue="مع قيمة" />
          <Input placeholder="حقل معطل" disabled />
          <Input placeholder="خطأ" aria-invalid={true} />
        </div>
      </div>

      <div
        data-theme="high-contrast"
        className="p-spacing-6 rounded-lg border bg-foreground text-background"
      >
        <h3 className="text-lg font-semibold mb-spacing-4">High Contrast Theme</h3>
        <div className="space-y-spacing-3 max-w-md">
          <Input placeholder="حقل إدخال عادي" />
          <Input defaultValue="مع قيمة" />
          <Input placeholder="حقل معطل" disabled />
          <Input placeholder="خطأ" aria-invalid={true} />
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
        <h3 className="text-xl font-bold mb-spacing-3">إرشادات الاستخدام</h3>

        <div className="space-y-spacing-4">
          <div className="border-l-4 border-primary pl-spacing-4">
            <h4 className="font-semibold">استخدم labels دائماً</h4>
            <p className="text-sm text-muted-foreground">
              كل input يجب أن يكون له label واضح لتحسين إمكانية الوصول
            </p>
            <div className="mt-spacing-2">
              <label htmlFor="example" className="text-sm font-medium block mb-1">
                الاسم
              </label>
              <Input id="example" placeholder="اكتب اسمك" />
            </div>
          </div>

          <div className="border-l-4 border-warning pl-spacing-4">
            <h4 className="font-semibold">استخدم placeholder بحكمة</h4>
            <p className="text-sm text-muted-foreground">
              Placeholder للتوضيح فقط، ليس بديلاً عن Label
            </p>
            <Input placeholder="مثال: أحمد محمد" />
          </div>

          <div className="border-l-4 border-destructive pl-spacing-4">
            <h4 className="font-semibold">أظهر رسائل الخطأ بوضوح</h4>
            <p className="text-sm text-muted-foreground">استخدم aria-invalid وأضف رسالة توضيحية</p>
            <div className="mt-spacing-2">
              <Input aria-invalid={true} placeholder="البريد الإلكتروني" />
              <p className="text-xs text-destructive mt-1">البريد الإلكتروني مطلوب</p>
            </div>
          </div>

          <div className="border-l-4 border-success pl-spacing-4">
            <h4 className="font-semibold">استخدم النوع الصحيح</h4>
            <p className="text-sm text-muted-foreground">
              type=&quot;email&quot; للبريد، type=&quot;tel&quot; للهاتف، وهكذا
            </p>
            <Input type="email" placeholder="example@company.com" />
          </div>
        </div>
      </div>

      <div className="border-t pt-spacing-6">
        <h3 className="text-xl font-bold mb-spacing-3">Best Practices</h3>
        <ul className="list-disc list-inside space-y-spacing-2 text-sm">
          <li>استخدم autocomplete للحقول الشائعة (name, email, tel)</li>
          <li>أضف validation في الوقت الفعلي</li>
          <li>استخدم disabled فقط عند الضرورة</li>
          <li>أضف أيقونات لتوضيح نوع الحقل</li>
          <li>اجعل حجم الحقل مناسباً للمحتوى المتوقع</li>
        </ul>
      </div>
    </div>
  ),
}
