import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './checkbox';
import { Label } from './label';

const meta = {
  title: 'UI Components/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================
// Basic Stories
// ============================================

export const Default: Story = {
  args: {},
};

export const Checked: Story = {
  args: {
    checked: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    checked: true,
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms" className="cursor-pointer">
        أوافق على الشروط والأحكام
      </Label>
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Checkbox id="error" aria-invalid="true" />
        <Label htmlFor="error" className="cursor-pointer">
          هذا الحقل إجباري
        </Label>
      </div>
      <p className="text-sm text-destructive mr-6">
        يجب الموافقة على الشروط
      </p>
    </div>
  ),
};

// ============================================
// Multiple Checkboxes
// ============================================

export const CheckboxList: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Checkbox id="option1" />
        <Label htmlFor="option1" className="cursor-pointer">
          الخيار الأول
        </Label>
      </div>
      
      <div className="flex items-center gap-2">
        <Checkbox id="option2" defaultChecked />
        <Label htmlFor="option2" className="cursor-pointer">
          الخيار الثاني (محدد)
        </Label>
      </div>
      
      <div className="flex items-center gap-2">
        <Checkbox id="option3" />
        <Label htmlFor="option3" className="cursor-pointer">
          الخيار الثالث
        </Label>
      </div>
      
      <div className="flex items-center gap-2">
        <Checkbox id="option4" disabled />
        <Label htmlFor="option4" className="cursor-pointer opacity-50">
          الخيار الرابع (معطل)
        </Label>
      </div>
    </div>
  ),
};

export const NestedCheckboxes: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Checkbox id="parent" defaultChecked />
        <Label htmlFor="parent" className="cursor-pointer font-semibold">
          تحديد الكل
        </Label>
      </div>
      
      <div className="mr-6 space-y-3 border-r-2 pr-4">
        <div className="flex items-center gap-2">
          <Checkbox id="child1" defaultChecked />
          <Label htmlFor="child1" className="cursor-pointer">
            الإنشاءات
          </Label>
        </div>
        
        <div className="flex items-center gap-2">
          <Checkbox id="child2" defaultChecked />
          <Label htmlFor="child2" className="cursor-pointer">
            تقنية المعلومات
          </Label>
        </div>
        
        <div className="flex items-center gap-2">
          <Checkbox id="child3" defaultChecked />
          <Label htmlFor="child3" className="cursor-pointer">
            التوريدات
          </Label>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// Application Examples
// ============================================

export const TenderPreferences: Story = {
  render: () => (
    <div className="w-[400px] space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold">تفضيلات المناقصات</h3>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox id="pref-email" defaultChecked />
          <Label htmlFor="pref-email" className="cursor-pointer">
            إشعارات البريد الإلكتروني
          </Label>
        </div>
        
        <div className="flex items-center gap-2">
          <Checkbox id="pref-sms" />
          <Label htmlFor="pref-sms" className="cursor-pointer">
            إشعارات الرسائل النصية
          </Label>
        </div>
        
        <div className="flex items-center gap-2">
          <Checkbox id="pref-push" defaultChecked />
          <Label htmlFor="pref-push" className="cursor-pointer">
            إشعارات التطبيق
          </Label>
        </div>
      </div>
      
      <div className="border-t pt-3 space-y-3">
        <h4 className="text-sm font-medium">أنواع الإشعارات</h4>
        
        <div className="flex items-center gap-2">
          <Checkbox id="notif-new" defaultChecked />
          <Label htmlFor="notif-new" className="cursor-pointer text-sm">
            مناقصات جديدة
          </Label>
        </div>
        
        <div className="flex items-center gap-2">
          <Checkbox id="notif-update" defaultChecked />
          <Label htmlFor="notif-update" className="cursor-pointer text-sm">
            تحديثات المناقصات
          </Label>
        </div>
        
        <div className="flex items-center gap-2">
          <Checkbox id="notif-deadline" defaultChecked />
          <Label htmlFor="notif-deadline" className="cursor-pointer text-sm">
            اقتراب المواعيد النهائية
          </Label>
        </div>
      </div>
    </div>
  ),
};

export const ProjectFilters: Story = {
  render: () => (
    <div className="w-[350px] space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold">فلترة المشاريع</h3>
      
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">الحالة</h4>
        
        <div className="flex items-center gap-2">
          <Checkbox id="status-active" defaultChecked />
          <Label htmlFor="status-active" className="cursor-pointer">
            نشط
          </Label>
        </div>
        
        <div className="flex items-center gap-2">
          <Checkbox id="status-pending" defaultChecked />
          <Label htmlFor="status-pending" className="cursor-pointer">
            قيد الانتظار
          </Label>
        </div>
        
        <div className="flex items-center gap-2">
          <Checkbox id="status-completed" />
          <Label htmlFor="status-completed" className="cursor-pointer">
            مكتمل
          </Label>
        </div>
        
        <div className="flex items-center gap-2">
          <Checkbox id="status-cancelled" />
          <Label htmlFor="status-cancelled" className="cursor-pointer">
            ملغى
          </Label>
        </div>
      </div>
      
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">الفئة</h4>
        
        <div className="flex items-center gap-2">
          <Checkbox id="cat-construction" />
          <Label htmlFor="cat-construction" className="cursor-pointer">
            إنشاءات
          </Label>
        </div>
        
        <div className="flex items-center gap-2">
          <Checkbox id="cat-it" />
          <Label htmlFor="cat-it" className="cursor-pointer">
            تقنية المعلومات
          </Label>
        </div>
        
        <div className="flex items-center gap-2">
          <Checkbox id="cat-supplies" />
          <Label htmlFor="cat-supplies" className="cursor-pointer">
            توريدات
          </Label>
        </div>
      </div>
    </div>
  ),
};

export const TermsAndConditions: Story = {
  render: () => (
    <div className="w-[500px] space-y-4 p-6 border rounded-lg">
      <h3 className="font-semibold text-lg">الموافقة على الشروط</h3>
      
      <div className="space-y-4">
        <div className="flex items-start gap-2">
          <Checkbox id="agree-terms" className="mt-1" />
          <Label htmlFor="agree-terms" className="cursor-pointer leading-relaxed">
            أوافق على <a href="#" className="text-primary hover:underline">الشروط والأحكام</a> الخاصة بتقديم العطاءات
          </Label>
        </div>
        
        <div className="flex items-start gap-2">
          <Checkbox id="agree-privacy" className="mt-1" />
          <Label htmlFor="agree-privacy" className="cursor-pointer leading-relaxed">
            أوافق على <a href="#" className="text-primary hover:underline">سياسة الخصوصية</a> وشروط استخدام البيانات
          </Label>
        </div>
        
        <div className="flex items-start gap-2">
          <Checkbox id="agree-eligibility" className="mt-1" />
          <Label htmlFor="agree-eligibility" className="cursor-pointer leading-relaxed">
            أقر بأنني مؤهل قانونياً للمشاركة في هذه المناقصة
          </Label>
        </div>
        
        <div className="flex items-start gap-2">
          <Checkbox id="agree-documents" className="mt-1" aria-invalid="true" />
          <Label htmlFor="agree-documents" className="cursor-pointer leading-relaxed">
            أقر بأن جميع المستندات المقدمة صحيحة وكاملة <span className="text-destructive">*</span>
          </Label>
        </div>
      </div>
      
      <div className="pt-2">
        <p className="text-sm text-destructive">
          * يجب الموافقة على جميع الشروط الإجبارية
        </p>
      </div>
    </div>
  ),
};

// ============================================
// All States
// ============================================

export const AllStates: Story = {
  render: () => (
    <div className="grid gap-6 w-[600px]">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">عادي (Unchecked)</h4>
          <div className="flex items-center gap-2">
            <Checkbox id="normal-unchecked" />
            <Label htmlFor="normal-unchecked" className="cursor-pointer">
              غير محدد
            </Label>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">محدد (Checked)</h4>
          <div className="flex items-center gap-2">
            <Checkbox id="normal-checked" defaultChecked />
            <Label htmlFor="normal-checked" className="cursor-pointer">
              محدد
            </Label>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">خطأ (Error)</h4>
          <div className="flex items-center gap-2">
            <Checkbox id="error-state" aria-invalid="true" />
            <Label htmlFor="error-state" className="cursor-pointer">
              حقل به خطأ
            </Label>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">معطل (Disabled)</h4>
          <div className="flex items-center gap-2">
            <Checkbox id="disabled-state" disabled />
            <Label htmlFor="disabled-state" className="cursor-pointer opacity-50">
              معطل
            </Label>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">معطل ومحدد</h4>
          <div className="flex items-center gap-2">
            <Checkbox id="disabled-checked" disabled defaultChecked />
            <Label htmlFor="disabled-checked" className="cursor-pointer opacity-50">
              معطل ومحدد
            </Label>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">إجباري</h4>
          <div className="flex items-center gap-2">
            <Checkbox id="required-state" required />
            <Label htmlFor="required-state" className="cursor-pointer">
              حقل إجباري <span className="text-destructive">*</span>
            </Label>
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// Theme Testing
// ============================================

export const ThemeTesting: Story = {
  render: () => (
    <div className="space-y-8 w-[700px]">
      <div className="space-y-4">
        <h3 className="font-semibold">Light Theme</h3>
        <div className="flex gap-6 p-4 border rounded-lg">
          <div className="flex items-center gap-2">
            <Checkbox id="light-unchecked" />
            <Label htmlFor="light-unchecked">غير محدد</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="light-checked" defaultChecked />
            <Label htmlFor="light-checked">محدد</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="light-error" aria-invalid="true" />
            <Label htmlFor="light-error">خطأ</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="light-disabled" disabled />
            <Label htmlFor="light-disabled" className="opacity-50">معطل</Label>
          </div>
        </div>
      </div>

      <div className="space-y-4 dark">
        <h3 className="font-semibold">Dark Theme</h3>
        <div className="flex gap-6 p-4 border rounded-lg bg-background">
          <div className="flex items-center gap-2">
            <Checkbox id="dark-unchecked" />
            <Label htmlFor="dark-unchecked">غير محدد</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="dark-checked" defaultChecked />
            <Label htmlFor="dark-checked">محدد</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="dark-error" aria-invalid="true" />
            <Label htmlFor="dark-error">خطأ</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="dark-disabled" disabled />
            <Label htmlFor="dark-disabled" className="opacity-50">معطل</Label>
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// Usage Guide
// ============================================

export const UsageGuide: Story = {
  render: () => (
    <div className="max-w-4xl space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Checkbox Component</h2>
        <p className="text-muted-foreground">
          مكون Checkbox للاختيارات المتعددة والموافقات
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">متى تستخدم Checkbox؟</h3>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>الموافقة على الشروط والأحكام</li>
          <li>اختيار متعدد من قائمة خيارات</li>
          <li>تفعيل/تعطيل الميزات</li>
          <li>فلاتر البحث المتعددة</li>
          <li>اختيار التفضيلات والإعدادات</li>
          <li>تحديد عناصر متعددة في قائمة</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Checkbox vs Radio</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-info/10 dark:bg-info/20 rounded">
            <h4 className="font-semibold mb-2">استخدم Checkbox عندما:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>يمكن اختيار أكثر من خيار</li>
              <li>الخيارات مستقلة عن بعضها</li>
              <li>الاختيار نعم/لا</li>
            </ul>
          </div>
          <div className="p-3 bg-warning/10 dark:bg-warning/20 rounded">
            <h4 className="font-semibold mb-2">استخدم Radio عندما:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>يمكن اختيار خيار واحد فقط</li>
              <li>الخيارات حصرية</li>
              <li>يجب الاختيار من قائمة</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Design Tokens</h3>
        <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
          <div>bg-input-background - الخلفية</div>
          <div>border - الحدود</div>
          <div>data-[state=checked]:bg-primary - عند التحديد</div>
          <div>focus-visible:border-ring - عند التركيز</div>
          <div>aria-invalid:border-destructive - حالة الخطأ</div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Best Practices</h3>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>استخدم Label دائماً مع htmlFor</li>
          <li>اجعل Label قابل للنقر (cursor-pointer)</li>
          <li>استخدم aria-invalid للأخطاء</li>
          <li>أضف asterisk (*) للحقول الإجبارية</li>
          <li>وضح أي خيارات معطلة</li>
          <li>استخدم disabled بحذر</li>
          <li>اجعل منطقة النقر كبيرة كافية</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">أمثلة الاستخدام</h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <code className="block bg-muted p-3 rounded text-xs">
              {`<div className="flex items-center gap-2">
  <Checkbox id="agree" />
  <Label htmlFor="agree">أوافق</Label>
</div>`}
            </code>
          </div>
          <div className="space-y-2">
            <code className="block bg-muted p-3 rounded text-xs">
              {`<Checkbox 
  id="required" 
  aria-invalid={hasError}
  required
/>`}
            </code>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Accessibility</h3>
  <div className="bg-info/10 dark:bg-info/20 p-4 rounded-lg text-sm space-y-2">
          <p>✅ دائماً استخدم Label مع htmlFor</p>
          <p>✅ استخدم aria-invalid للحالات الخاطئة</p>
          <p>✅ يدعم keyboard navigation (Space to toggle)</p>
          <p>✅ Focus indicator واضح</p>
          <p>✅ Screen reader friendly من Radix UI</p>
        </div>
      </div>
    </div>
  ),
};
