import type { Meta, StoryObj } from '@storybook/react'
import { Label } from './label'
import { Input } from './input'
import { Checkbox } from './checkbox'
import { RadioGroup, RadioGroupItem } from './radio-group'
import { Switch } from './switch'
import { Textarea } from './textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

const meta = {
  title: 'UI Components/Label',
  component: Label,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

// ============================================
// Basic Stories
// ============================================

export const Default: Story = {
  render: () => <Label>اسم المشروع</Label>,
}

export const WithInput: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="project">اسم المشروع</Label>
      <Input id="project" placeholder="أدخل اسم المشروع" />
    </div>
  ),
}

export const Required: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="email">
        البريد الإلكتروني
        <span className="text-destructive mr-1">*</span>
      </Label>
      <Input id="email" type="email" placeholder="example@domain.com" required />
    </div>
  ),
}

export const WithDescription: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="budget">الميزانية المتوقعة</Label>
      <Input id="budget" type="number" placeholder="0.00" />
      <p className="text-sm text-muted-foreground">أدخل الميزانية بالريال السعودي</p>
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="disabled" className="opacity-50">
        حقل معطل
      </Label>
      <Input id="disabled" disabled placeholder="لا يمكن التعديل" />
    </div>
  ),
}

// ============================================
// Form Field Examples
// ============================================

export const TextInputField: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <Label htmlFor="tender-name">
        اسم المناقصة
        <span className="text-destructive mr-1">*</span>
      </Label>
      <Input id="tender-name" placeholder="مناقصة البنية التحتية الرقمية" required />
      <p className="text-sm text-muted-foreground">سيظهر هذا الاسم في جميع المستندات الرسمية</p>
    </div>
  ),
}

export const TextareaField: Story = {
  render: () => (
    <div className="w-[500px] space-y-2">
      <Label htmlFor="description">
        وصف المشروع
        <span className="text-destructive mr-1">*</span>
      </Label>
      <Textarea id="description" placeholder="أدخل وصفاً تفصيلياً للمشروع..." rows={4} />
      <p className="text-sm text-muted-foreground">حد أدنى 50 كلمة، حد أقصى 500 كلمة</p>
    </div>
  ),
}

export const SelectField: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <Label htmlFor="status">
        حالة المشروع
        <span className="text-destructive mr-1">*</span>
      </Label>
      <Select>
        <SelectTrigger id="status">
          <SelectValue placeholder="اختر الحالة" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">نشط</SelectItem>
          <SelectItem value="pending">قيد الانتظار</SelectItem>
          <SelectItem value="completed">مكتمل</SelectItem>
          <SelectItem value="cancelled">ملغي</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}

export const CheckboxField: Story = {
  render: () => (
    <div className="flex items-center space-x-2 space-x-reverse">
      <Checkbox id="terms" />
      <Label htmlFor="terms" className="font-normal cursor-pointer">
        أوافق على{' '}
        <a href="#" className="text-primary underline">
          الشروط والأحكام
        </a>
      </Label>
    </div>
  ),
}

export const RadioGroupField: Story = {
  render: () => (
    <div className="space-y-3">
      <Label>نوع المناقصة</Label>
      <RadioGroup defaultValue="public">
        <div className="flex items-center space-x-2 space-x-reverse">
          <RadioGroupItem value="public" id="public" />
          <Label htmlFor="public" className="font-normal cursor-pointer">
            مناقصة عامة
          </Label>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <RadioGroupItem value="limited" id="limited" />
          <Label htmlFor="limited" className="font-normal cursor-pointer">
            مناقصة محدودة
          </Label>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <RadioGroupItem value="private" id="private" />
          <Label htmlFor="private" className="font-normal cursor-pointer">
            مناقصة خاصة
          </Label>
        </div>
      </RadioGroup>
    </div>
  ),
}

export const SwitchField: Story = {
  render: () => (
    <div className="flex items-center justify-between w-[400px]">
      <div className="space-y-0.5">
        <Label htmlFor="notifications">إشعارات البريد الإلكتروني</Label>
        <p className="text-sm text-muted-foreground">تلقي إشعارات عن التحديثات المهمة</p>
      </div>
      <Switch id="notifications" />
    </div>
  ),
}

// ============================================
// Complete Form Examples
// ============================================

export const TenderCreationForm: Story = {
  render: () => (
    <div className="w-[600px] space-y-6 p-6 border rounded-lg">
      <div>
        <h3 className="text-lg font-semibold">إنشاء مناقصة جديدة</h3>
        <p className="text-sm text-muted-foreground">أدخل المعلومات الأساسية للمناقصة</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tender-title">
            عنوان المناقصة
            <span className="text-destructive mr-1">*</span>
          </Label>
          <Input id="tender-title" placeholder="مشروع التطوير الرقمي" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tender-type">
            نوع المناقصة
            <span className="text-destructive mr-1">*</span>
          </Label>
          <Select>
            <SelectTrigger id="tender-type">
              <SelectValue placeholder="اختر النوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="construction">إنشاءات</SelectItem>
              <SelectItem value="it">تقنية معلومات</SelectItem>
              <SelectItem value="consulting">استشارات</SelectItem>
              <SelectItem value="services">خدمات</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="budget">
              الميزانية (ر.س)
              <span className="text-destructive mr-1">*</span>
            </Label>
            <Input id="budget" type="number" placeholder="500,000" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">
              المدة (أشهر)
              <span className="text-destructive mr-1">*</span>
            </Label>
            <Input id="duration" type="number" placeholder="6" required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            الوصف
            <span className="text-destructive mr-1">*</span>
          </Label>
          <Textarea id="description" placeholder="وصف تفصيلي للمناقصة..." rows={4} />
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          <Checkbox id="urgent" />
          <Label htmlFor="urgent" className="font-normal cursor-pointer">
            مناقصة عاجلة
          </Label>
        </div>
      </div>
    </div>
  ),
}

export const UserProfileForm: Story = {
  render: () => (
    <div className="w-[600px] space-y-6 p-6 border rounded-lg">
      <div>
        <h3 className="text-lg font-semibold">الملف الشخصي</h3>
        <p className="text-sm text-muted-foreground">تحديث معلوماتك الشخصية</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first-name">
              الاسم الأول
              <span className="text-destructive mr-1">*</span>
            </Label>
            <Input id="first-name" placeholder="محمد" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last-name">
              اسم العائلة
              <span className="text-destructive mr-1">*</span>
            </Label>
            <Input id="last-name" placeholder="أحمد" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">
            البريد الإلكتروني
            <span className="text-destructive mr-1">*</span>
          </Label>
          <Input id="email" type="email" placeholder="mohammed@example.com" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">رقم الهاتف</Label>
          <Input id="phone" type="tel" placeholder="+966 50 123 4567" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">الوظيفة</Label>
          <Select>
            <SelectTrigger id="role">
              <SelectValue placeholder="اختر الوظيفة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">مدير النظام</SelectItem>
              <SelectItem value="manager">مدير مشروع</SelectItem>
              <SelectItem value="user">مستخدم</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>الإشعارات</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox id="email-notif" defaultChecked />
              <Label htmlFor="email-notif" className="font-normal cursor-pointer">
                إشعارات البريد الإلكتروني
              </Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox id="sms-notif" />
              <Label htmlFor="sms-notif" className="font-normal cursor-pointer">
                إشعارات الرسائل النصية
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
}

export const ProjectSettingsForm: Story = {
  render: () => (
    <div className="w-[600px] space-y-6 p-6 border rounded-lg">
      <div>
        <h3 className="text-lg font-semibold">إعدادات المشروع</h3>
        <p className="text-sm text-muted-foreground">تخصيص إعدادات المشروع</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="project-name">
            اسم المشروع
            <span className="text-destructive mr-1">*</span>
          </Label>
          <Input id="project-name" defaultValue="مشروع التطوير الرقمي" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="visibility">مستوى الرؤية</Label>
          <Select defaultValue="private">
            <SelectTrigger id="visibility">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">عام - يمكن للجميع المشاهدة</SelectItem>
              <SelectItem value="team">الفريق - أعضاء الفريق فقط</SelectItem>
              <SelectItem value="private">خاص - أنت فقط</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>الخيارات المتقدمة</Label>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-save" className="font-normal">
                حفظ تلقائي
              </Label>
              <p className="text-sm text-muted-foreground">حفظ التغييرات تلقائياً كل 5 دقائق</p>
            </div>
            <Switch id="auto-save" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications" className="font-normal">
                التنبيهات
              </Label>
              <p className="text-sm text-muted-foreground">تلقي إشعارات عن التحديثات</p>
            </div>
            <Switch id="notifications" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="archive" className="font-normal">
                أرشفة تلقائية
              </Label>
              <p className="text-sm text-muted-foreground">أرشفة المشاريع المكتملة بعد 30 يوم</p>
            </div>
            <Switch id="archive" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>نوع المشروع</Label>
          <RadioGroup defaultValue="development">
            <div className="flex items-center space-x-2 space-x-reverse">
              <RadioGroupItem value="development" id="dev" />
              <Label htmlFor="dev" className="font-normal cursor-pointer">
                تطوير برمجيات
              </Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <RadioGroupItem value="infrastructure" id="infra" />
              <Label htmlFor="infra" className="font-normal cursor-pointer">
                بنية تحتية
              </Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <RadioGroupItem value="consulting" id="consult" />
              <Label htmlFor="consult" className="font-normal cursor-pointer">
                استشارات
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  ),
}

// ============================================
// Label Variations
// ============================================

export const LabelSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">حجم صغير جداً (xs)</Label>
        <Input placeholder="xs label" />
      </div>

      <div className="space-y-2">
        <Label className="text-sm">حجم صغير (sm - افتراضي)</Label>
        <Input placeholder="sm label" />
      </div>

      <div className="space-y-2">
        <Label className="text-base">حجم متوسط (base)</Label>
        <Input placeholder="base label" />
      </div>

      <div className="space-y-2">
        <Label className="text-lg">حجم كبير (lg)</Label>
        <Input placeholder="lg label" />
      </div>
    </div>
  ),
}

export const LabelWithIcons: Story = {
  render: () => (
    <div className="space-y-4 w-[400px]">
      <div className="space-y-2">
        <Label htmlFor="search" className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          البحث
        </Label>
        <Input id="search" placeholder="ابحث..." />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email-icon" className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          البريد الإلكتروني
        </Label>
        <Input id="email-icon" type="email" placeholder="email@example.com" />
      </div>
    </div>
  ),
}

export const LabelWithBadge: Story = {
  render: () => (
    <div className="space-y-4 w-[400px]">
      <div className="space-y-2">
        <Label htmlFor="feature1" className="flex items-center gap-2">
          الميزة الجديدة
          <span className="px-2 py-0.5 text-xs bg-info/10 text-info dark:bg-info/20 rounded-full">
            جديد
          </span>
        </Label>
        <Input id="feature1" placeholder="جرب الميزة الجديدة" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="beta" className="flex items-center gap-2">
          الوضع التجريبي
          <span className="px-2 py-0.5 text-xs bg-warning/10 text-warning dark:bg-warning/20 rounded-full">
            تجريبي
          </span>
        </Label>
        <Input id="beta" placeholder="قيد التطوير" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="premium" className="flex items-center gap-2">
          ميزة مميزة
          <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary dark:bg-primary/20 rounded-full">
            مميز
          </span>
        </Label>
        <Input id="premium" placeholder="للمشتركين فقط" />
      </div>
    </div>
  ),
}

// ============================================
// Theme Testing
// ============================================

export const ThemeTesting: Story = {
  render: () => (
    <div className="space-y-8 w-[600px]">
      <div className="space-y-4">
        <h3 className="font-semibold">Light Theme</h3>
        <div className="p-4 border rounded-lg space-y-4">
          <div className="space-y-2">
            <Label htmlFor="light-input">
              اسم المشروع
              <span className="text-destructive mr-1">*</span>
            </Label>
            <Input id="light-input" placeholder="أدخل اسم المشروع" />
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox id="light-check" />
            <Label htmlFor="light-check" className="font-normal cursor-pointer">
              أوافق على الشروط والأحكام
            </Label>
          </div>
        </div>
      </div>

      <div className="space-y-4 dark">
        <h3 className="font-semibold">Dark Theme</h3>
        <div className="p-4 border rounded-lg bg-background space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dark-input">
              اسم المشروع
              <span className="text-destructive mr-1">*</span>
            </Label>
            <Input id="dark-input" placeholder="أدخل اسم المشروع" />
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox id="dark-check" />
            <Label htmlFor="dark-check" className="font-normal cursor-pointer">
              أوافق على الشروط والأحكام
            </Label>
          </div>
        </div>
      </div>
    </div>
  ),
}

// ============================================
// Usage Guide
// ============================================

export const UsageGuide: Story = {
  render: () => (
    <div className="max-w-4xl space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Label Component</h2>
        <p className="text-muted-foreground">مكون Label لتسمية عناصر النموذج وتحسين الوصولية</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">متى تستخدم Label؟</h3>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>مع جميع عناصر الإدخال (Input, Textarea, Select)</li>
          <li>مع Checkbox و RadioButton لتحسين منطقة النقر</li>
          <li>عند الحاجة لتوضيح غرض الحقل</li>
          <li>لتحديد الحقول المطلوبة (*)</li>
          <li>لتوفير سياق إضافي للمستخدم</li>
          <li>لتحسين الوصولية للقارئات الشاشة</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">الأنماط</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-info/10 dark:bg-info/20 rounded">
            <h4 className="font-semibold mb-2">مع Input</h4>
            <p className="text-muted-foreground">استخدم htmlFor للربط مع id الحقل</p>
            <code className="block mt-2 text-xs">{'<Label htmlFor="name">الاسم</Label>'}</code>
          </div>
          <div className="p-3 bg-success/10 dark:bg-success/20 rounded">
            <h4 className="font-semibold mb-2">مع Checkbox</h4>
            <p className="text-muted-foreground">اجعله قابل للنقر cursor-pointer</p>
            <code className="block mt-2 text-xs">{'className="font-normal cursor-pointer"'}</code>
          </div>
          <div className="p-3 bg-warning/10 dark:bg-warning/20 rounded">
            <h4 className="font-semibold mb-2">حقل مطلوب</h4>
            <p className="text-muted-foreground">أضف علامة * حمراء</p>
            <code className="block mt-2 text-xs">
              {'<span className="text-destructive">*</span>'}
            </code>
          </div>
          <div className="p-3 bg-accent/10 dark:bg-accent/20 rounded">
            <h4 className="font-semibold mb-2">مع أيقونة</h4>
            <p className="text-muted-foreground">استخدم flex items-center gap-2</p>
            <code className="block mt-2 text-xs">{'className="flex items-center gap-2"'}</code>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Design Tokens</h3>
        <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
          <div>text-sm - حجم الخط</div>
          <div>font-medium - وزن الخط (افتراضي)</div>
          <div>font-normal - للـ checkbox/radio labels</div>
          <div>leading-none - المسافة بين الأسطر</div>
          <div>select-none - منع التحديد</div>
          <div>peer-disabled:opacity-50 - عند تعطيل الحقل</div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Best Practices</h3>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>دائماً استخدم htmlFor للربط مع id الحقل</li>
          <li>اجعل النص واضح ومختصر</li>
          <li>ضع علامة * للحقول المطلوبة</li>
          <li>للـ Checkbox/Radio: استخدم font-normal و cursor-pointer</li>
          <li>أضف وصف إضافي text-muted-foreground أسفل الحقل</li>
          <li>تجنب Label فارغ أو غير واضح</li>
          <li>استخدم أيقونات لتوضيح نوع البيانات</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">أمثلة الاستخدام</h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-sm font-medium">مع Input:</p>
            <code className="block bg-muted p-3 rounded text-xs">
              {`<div className="space-y-2">
  <Label htmlFor="email">
    البريد الإلكتروني
  <span className="text-destructive mr-1">*</span>
  </Label>
  <Input id="email" type="email" />
</div>`}
            </code>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">مع Checkbox:</p>
            <code className="block bg-muted p-3 rounded text-xs">
              {`<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label 
    htmlFor="terms" 
    className="font-normal cursor-pointer"
  >
    أوافق على الشروط
  </Label>
</div>`}
            </code>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">مع وصف:</p>
            <code className="block bg-muted p-3 rounded text-xs">
              {`<div className="space-y-2">
  <Label htmlFor="budget">الميزانية</Label>
  <Input id="budget" type="number" />
  <p className="text-sm text-muted-foreground">
    أدخل الميزانية بالريال السعودي
  </p>
</div>`}
            </code>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Accessibility</h3>
        <div className="bg-info/10 dark:bg-info/20 p-4 rounded-lg text-sm space-y-2">
          <p>✅ htmlFor يربط Label بالـ Input تلقائياً</p>
          <p>✅ النقر على Label يُفعّل الحقل</p>
          <p>✅ Screen readers تقرأ Label مع الحقل</p>
          <p>✅ peer-disabled يعكس حالة التعطيل</p>
          <p>✅ cursor-pointer للـ clickable labels</p>
          <p>✅ علامة * تُعلن للـ screen readers</p>
        </div>
      </div>

      <div className="pt-4">
        <h4 className="font-semibold mb-2">مثال تفاعلي:</h4>
        <div className="p-4 border rounded-lg space-y-4">
          <div className="space-y-2">
            <Label htmlFor="demo">
              حقل تجريبي
              <span className="text-destructive mr-1">*</span>
            </Label>
            <Input id="demo" placeholder="انقر على Label أعلاه" />
            <p className="text-sm text-muted-foreground">النقر على Label سيُركز على Input</p>
          </div>
        </div>
      </div>
    </div>
  ),
}
