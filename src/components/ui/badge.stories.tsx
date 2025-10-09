import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './badge';
import { Check, X, AlertCircle, Clock, Star, TrendingUp } from 'lucide-react';

const meta: Meta<typeof Badge> = {
  title: 'UI Components/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Badge Component (مكون الشارة)

شارة صغيرة لعرض الحالات والتصنيفات والمعلومات المختصرة.

## المميزات
- ✅ **8 أشكال مختلفة:** default, secondary, destructive, outline, success, warning, info, primary
- ✅ **دعم الأيقونات:** يمكن إضافة أيقونات من lucide-react
- ✅ **دعم الثيمات:** Light, Dark, High Contrast
- ✅ **استخدام Design Tokens:** bg-primary, bg-destructive, text-primary-foreground

## Design Tokens المستخدمة
- \`bg-primary\` - خلفية أساسية
- \`text-primary-foreground\` - نص على خلفية primary
- \`bg-secondary\` - خلفية ثانوية
- \`bg-destructive\` - خلفية تحذيرية
- \`border\` - حدود
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline', 'success', 'warning', 'info', 'primary'],
      description: 'شكل الشارة',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

/**
 * شارة افتراضية
 */
export const Default: Story = {
  args: {
    children: 'جديد',
  },
};

/**
 * شارة ثانوية
 */
export const Secondary: Story = {
  args: {
    children: 'قيد المراجعة',
    variant: 'secondary',
  },
};

/**
 * شارة تحذيرية
 */
export const Destructive: Story = {
  args: {
    children: 'محذوف',
    variant: 'destructive',
  },
};

/**
 * شارة محددة
 */
export const Outline: Story = {
  args: {
    children: 'مسودة',
    variant: 'outline',
  },
};

/**
 * شارة نجاح
 */
export const Success: Story = {
  args: {
    children: 'مكتمل',
    variant: 'success',
  },
};

/**
 * شارة تنبيه
 */
export const Warning: Story = {
  args: {
    children: 'معلق',
    variant: 'warning',
  },
};

/**
 * شارة معلومات
 */
export const Info: Story = {
  args: {
    children: 'معلومة',
    variant: 'info',
  },
};

/**
 * مع أيقونة
 */
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Check className="h-3 w-3" />
        نشط
      </>
    ),
    variant: 'success',
  },
};

/**
 * جميع الأشكال
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-spacing-6">
      <div>
        <h3 className="text-lg font-semibold mb-spacing-4">جميع الأشكال (All Variants)</h3>
        <div className="flex flex-wrap gap-spacing-3">
          <Badge variant="default">افتراضي</Badge>
          <Badge variant="primary">أساسي</Badge>
          <Badge variant="secondary">ثانوي</Badge>
          <Badge variant="destructive">حذف</Badge>
          <Badge variant="outline">محدد</Badge>
          <Badge variant="success">نجاح</Badge>
          <Badge variant="warning">تحذير</Badge>
          <Badge variant="info">معلومات</Badge>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-spacing-4">مع أيقونات (With Icons)</h3>
        <div className="flex flex-wrap gap-spacing-3">
          <Badge variant="success">
            <Check className="h-3 w-3" />
            مكتمل
          </Badge>
          <Badge variant="destructive">
            <X className="h-3 w-3" />
            مرفوض
          </Badge>
          <Badge variant="warning">
            <Clock className="h-3 w-3" />
            قيد الانتظار
          </Badge>
          <Badge variant="info">
            <AlertCircle className="h-3 w-3" />
            جديد
          </Badge>
          <Badge variant="primary">
            <Star className="h-3 w-3" />
            مميز
          </Badge>
          <Badge variant="outline">
            <TrendingUp className="h-3 w-3" />
            نشط
          </Badge>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-spacing-4">حالات المناقصات (Tender Status)</h3>
        <div className="flex flex-wrap gap-spacing-3">
          <Badge variant="info">
            <AlertCircle className="h-3 w-3" />
            جديدة
          </Badge>
          <Badge variant="warning">
            <Clock className="h-3 w-3" />
            قيد المراجعة
          </Badge>
          <Badge variant="primary">
            جاري العمل
          </Badge>
          <Badge variant="success">
            <Check className="h-3 w-3" />
            مقبولة
          </Badge>
          <Badge variant="destructive">
            <X className="h-3 w-3" />
            مرفوضة
          </Badge>
          <Badge variant="outline">
            مسودة
          </Badge>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-spacing-4">حالات المشاريع (Project Status)</h3>
        <div className="flex flex-wrap gap-spacing-3">
          <Badge variant="warning">تخطيط</Badge>
          <Badge variant="primary">قيد التنفيذ</Badge>
          <Badge variant="info">مراجعة</Badge>
          <Badge variant="success">
            <Check className="h-3 w-3" />
            منتهي
          </Badge>
          <Badge variant="destructive">ملغي</Badge>
          <Badge variant="secondary">مؤجل</Badge>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-spacing-4">حالات الدفع (Payment Status)</h3>
        <div className="flex flex-wrap gap-spacing-3">
          <Badge variant="warning">
            <Clock className="h-3 w-3" />
            معلق
          </Badge>
          <Badge variant="info">جزئي</Badge>
          <Badge variant="success">
            <Check className="h-3 w-3" />
            مدفوع
          </Badge>
          <Badge variant="destructive">متأخر</Badge>
          <Badge variant="outline">ملغي</Badge>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-spacing-4">أولويات (Priorities)</h3>
        <div className="flex flex-wrap gap-spacing-3">
          <Badge variant="destructive">
            عاجل جداً
          </Badge>
          <Badge variant="warning">
            عاجل
          </Badge>
          <Badge variant="primary">
            متوسط
          </Badge>
          <Badge variant="outline">
            منخفض
          </Badge>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-spacing-4">أرقام وعدادات (Counts)</h3>
        <div className="flex flex-wrap items-center gap-spacing-4">
          <div className="flex items-center gap-spacing-2">
            <span className="text-sm">الإشعارات</span>
            <Badge variant="destructive">5</Badge>
          </div>
          <div className="flex items-center gap-spacing-2">
            <span className="text-sm">الرسائل</span>
            <Badge variant="primary">12</Badge>
          </div>
          <div className="flex items-center gap-spacing-2">
            <span className="text-sm">المهام</span>
            <Badge variant="warning">3</Badge>
          </div>
          <div className="flex items-center gap-spacing-2">
            <span className="text-sm">الجديد</span>
            <Badge variant="info">24</Badge>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * في السياق (In Context)
 */
export const InContext: Story = {
  render: () => (
    <div className="flex flex-col gap-spacing-6 max-w-md">
      <div>
        <h3 className="text-lg font-semibold mb-spacing-4">في العناوين</h3>
        <div className="space-y-spacing-3">
          <h4 className="text-base font-medium flex items-center gap-spacing-2">
            مناقصة مشروع البناء
            <Badge variant="success">نشطة</Badge>
          </h4>
          <h4 className="text-base font-medium flex items-center gap-spacing-2">
            مشروع التطوير
            <Badge variant="warning">قيد المراجعة</Badge>
          </h4>
          <h4 className="text-base font-medium flex items-center gap-spacing-2">
            عقد الصيانة
            <Badge variant="info">جديد</Badge>
          </h4>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-spacing-4">في القوائم</h3>
        <div className="space-y-spacing-2">
          {[
            { name: 'عميل أ', status: 'نشط', variant: 'success' as const },
            { name: 'عميل ب', status: 'معلق', variant: 'warning' as const },
            { name: 'عميل ج', status: 'غير نشط', variant: 'outline' as const },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-spacing-3 border rounded-lg">
              <span className="text-sm">{item.name}</span>
              <Badge variant={item.variant}>{item.status}</Badge>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-spacing-4">في الجداول</h3>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-right p-spacing-2">المشروع</th>
                <th className="text-right p-spacing-2">الحالة</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-spacing-2">مشروع 1</td>
                <td className="p-spacing-2">
                  <Badge variant="success">مكتمل</Badge>
                </td>
              </tr>
              <tr className="border-t">
                <td className="p-spacing-2">مشروع 2</td>
                <td className="p-spacing-2">
                  <Badge variant="primary">قيد التنفيذ</Badge>
                </td>
              </tr>
              <tr className="border-t">
                <td className="p-spacing-2">مشروع 3</td>
                <td className="p-spacing-2">
                  <Badge variant="warning">تخطيط</Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ),
};

/**
 * اختبار الثيمات
 */
export const ThemeTesting: Story = {
  render: () => (
    <div className="flex flex-col gap-spacing-8">
      <div data-theme="light" className="p-spacing-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-spacing-4">Light Theme</h3>
        <div className="flex flex-wrap gap-spacing-3">
          <Badge variant="default">افتراضي</Badge>
          <Badge variant="primary">أساسي</Badge>
          <Badge variant="secondary">ثانوي</Badge>
          <Badge variant="destructive">حذف</Badge>
          <Badge variant="outline">محدد</Badge>
          <Badge variant="success">نجاح</Badge>
          <Badge variant="warning">تحذير</Badge>
          <Badge variant="info">معلومات</Badge>
        </div>
      </div>

      <div data-theme="dark" className="p-spacing-6 rounded-lg border bg-gray-900">
        <h3 className="text-lg font-semibold mb-spacing-4 text-white">Dark Theme</h3>
        <div className="flex flex-wrap gap-spacing-3">
          <Badge variant="default">افتراضي</Badge>
          <Badge variant="primary">أساسي</Badge>
          <Badge variant="secondary">ثانوي</Badge>
          <Badge variant="destructive">حذف</Badge>
          <Badge variant="outline">محدد</Badge>
          <Badge variant="success">نجاح</Badge>
          <Badge variant="warning">تحذير</Badge>
          <Badge variant="info">معلومات</Badge>
        </div>
      </div>

      <div data-theme="high-contrast" className="p-spacing-6 rounded-lg border bg-black">
        <h3 className="text-lg font-semibold mb-spacing-4 text-white">High Contrast Theme</h3>
        <div className="flex flex-wrap gap-spacing-3">
          <Badge variant="default">افتراضي</Badge>
          <Badge variant="primary">أساسي</Badge>
          <Badge variant="secondary">ثانوي</Badge>
          <Badge variant="destructive">حذف</Badge>
          <Badge variant="outline">محدد</Badge>
          <Badge variant="success">نجاح</Badge>
          <Badge variant="warning">تحذير</Badge>
          <Badge variant="info">معلومات</Badge>
        </div>
      </div>
    </div>
  ),
};

/**
 * دليل الاستخدام
 */
export const UsageGuide: Story = {
  render: () => (
    <div className="max-w-2xl space-y-spacing-6 p-spacing-6">
      <div>
        <h3 className="text-xl font-bold mb-spacing-3">متى تستخدم كل شكل؟</h3>
        
        <div className="space-y-spacing-4">
          <div className="border-l-4 border-green-500 pl-spacing-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Badge variant="success">Success</Badge>
              حالات إيجابية
            </h4>
            <p className="text-sm text-muted-foreground">
              مكتمل، نشط، مقبول، ناجح، مدفوع
            </p>
          </div>

          <div className="border-l-4 border-amber-500 pl-spacing-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Badge variant="warning">Warning</Badge>
              تحتاج انتباه
            </h4>
            <p className="text-sm text-muted-foreground">
              معلق، قيد المراجعة، يتطلب إجراء
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-spacing-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Badge variant="destructive">Destructive</Badge>
              حالات سلبية
            </h4>
            <p className="text-sm text-muted-foreground">
              مرفوض، ملغي، خطأ، فشل، متأخر
            </p>
          </div>

          <div className="border-l-4 border-blue-500 pl-spacing-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Badge variant="info">Info</Badge>
              معلومات جديدة
            </h4>
            <p className="text-sm text-muted-foreground">
              جديد، إشعار، تحديث، رسالة
            </p>
          </div>

          <div className="border-l-4 border-gray-400 pl-spacing-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Badge variant="outline">Outline</Badge>
              حالات محايدة
            </h4>
            <p className="text-sm text-muted-foreground">
              مسودة، غير نشط، عادي
            </p>
          </div>
        </div>
      </div>

      <div className="border-t pt-spacing-6">
        <h3 className="text-xl font-bold mb-spacing-3">Best Practices</h3>
        <ul className="list-disc list-inside space-y-spacing-2 text-sm">
          <li>استخدم النص المختصر (كلمة أو كلمتين كحد أقصى)</li>
          <li>اختر اللون المناسب للحالة (أخضر=نجاح، أحمر=خطأ، أصفر=تحذير)</li>
          <li>أضف أيقونات للوضوح عند الحاجة</li>
          <li>لا تستخدم أكثر من 3 badges في سطر واحد</li>
          <li>تأكد من التباين الكافي مع الخلفية</li>
        </ul>
      </div>
    </div>
  ),
};
