import type { Meta, StoryObj } from '@storybook/react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select';
import { Label } from './label';

const meta = {
  title: 'UI Components/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================
// Basic Stories
// ============================================

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="اختر خياراً" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">الخيار الأول</SelectItem>
        <SelectItem value="option2">الخيار الثاني</SelectItem>
        <SelectItem value="option3">الخيار الثالث</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-[280px] space-y-2">
      <Label htmlFor="status">حالة المناقصة</Label>
      <Select>
        <SelectTrigger id="status">
          <SelectValue placeholder="اختر الحالة" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="draft">مسودة</SelectItem>
          <SelectItem value="open">مفتوحة</SelectItem>
          <SelectItem value="closed">مغلقة</SelectItem>
          <SelectItem value="awarded">تم الترسية</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <div className="w-[280px] space-y-2">
      <Label htmlFor="category">الفئة</Label>
      <Select>
        <SelectTrigger id="category">
          <SelectValue placeholder="اختر الفئة" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>مناقصات</SelectLabel>
            <SelectItem value="tender-construction">إنشاءات</SelectItem>
            <SelectItem value="tender-it">تقنية المعلومات</SelectItem>
            <SelectItem value="tender-supplies">توريدات</SelectItem>
          </SelectGroup>
          
          <SelectSeparator />
          
          <SelectGroup>
            <SelectLabel>مشاريع</SelectLabel>
            <SelectItem value="project-internal">مشاريع داخلية</SelectItem>
            <SelectItem value="project-external">مشاريع خارجية</SelectItem>
          </SelectGroup>
          
          <SelectSeparator />
          
          <SelectGroup>
            <SelectLabel>أخرى</SelectLabel>
            <SelectItem value="other-consulting">استشارات</SelectItem>
            <SelectItem value="other-services">خدمات</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-[280px] space-y-2">
      <Label htmlFor="disabled">اختيار معطل</Label>
      <Select disabled>
        <SelectTrigger id="disabled">
          <SelectValue placeholder="هذا الحقل معطل" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">خيار 1</SelectItem>
          <SelectItem value="option2">خيار 2</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const WithDefaultValue: Story = {
  render: () => (
    <div className="w-[280px] space-y-2">
      <Label htmlFor="priority">الأولوية</Label>
      <Select defaultValue="medium">
        <SelectTrigger id="priority">
          <SelectValue placeholder="اختر الأولوية" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="low">منخفضة</SelectItem>
          <SelectItem value="medium">متوسطة</SelectItem>
          <SelectItem value="high">عالية</SelectItem>
          <SelectItem value="urgent">عاجل</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const SmallSize: Story = {
  render: () => (
    <div className="w-[250px] space-y-2">
      <Label htmlFor="small">حجم صغير</Label>
      <Select>
        <SelectTrigger id="small" size="sm">
          <SelectValue placeholder="اختر" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">خيار 1</SelectItem>
          <SelectItem value="2">خيار 2</SelectItem>
          <SelectItem value="3">خيار 3</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const DisabledOptions: Story = {
  render: () => (
    <div className="w-[280px] space-y-2">
      <Label htmlFor="options">خيارات مختلطة</Label>
      <Select>
        <SelectTrigger id="options">
          <SelectValue placeholder="اختر خياراً" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="available1">متاح 1</SelectItem>
          <SelectItem value="available2">متاح 2</SelectItem>
          <SelectItem value="disabled1" disabled>
            معطل 1
          </SelectItem>
          <SelectItem value="available3">متاح 3</SelectItem>
          <SelectItem value="disabled2" disabled>
            معطل 2
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

// ============================================
// Application Examples
// ============================================

export const TenderStatusSelect: Story = {
  render: () => (
    <div className="w-[300px] space-y-2">
      <Label htmlFor="tender-status">حالة المناقصة</Label>
      <Select defaultValue="open">
        <SelectTrigger id="tender-status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="draft">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-gray-400" />
              مسودة
            </span>
          </SelectItem>
          <SelectItem value="open">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-blue-500" />
              مفتوحة
            </span>
          </SelectItem>
          <SelectItem value="evaluation">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-yellow-500" />
              قيد التقييم
            </span>
          </SelectItem>
          <SelectItem value="closed">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-red-500" />
              مغلقة
            </span>
          </SelectItem>
          <SelectItem value="awarded">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-green-500" />
              تم الترسية
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const ProjectCategorySelect: Story = {
  render: () => (
    <div className="w-[350px] space-y-2">
      <Label htmlFor="project-category">فئة المشروع</Label>
      <Select>
        <SelectTrigger id="project-category">
          <SelectValue placeholder="اختر فئة المشروع" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>📋 إنشاءات</SelectLabel>
            <SelectItem value="building">مباني</SelectItem>
            <SelectItem value="roads">طرق</SelectItem>
            <SelectItem value="infrastructure">بنية تحتية</SelectItem>
          </SelectGroup>

          <SelectSeparator />

          <SelectGroup>
            <SelectLabel>💻 تقنية</SelectLabel>
            <SelectItem value="software">برمجيات</SelectItem>
            <SelectItem value="hardware">أجهزة</SelectItem>
            <SelectItem value="network">شبكات</SelectItem>
          </SelectGroup>

          <SelectSeparator />

          <SelectGroup>
            <SelectLabel>📦 توريدات</SelectLabel>
            <SelectItem value="equipment">معدات</SelectItem>
            <SelectItem value="materials">مواد</SelectItem>
            <SelectItem value="furniture">أثاث</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const PaymentMethodSelect: Story = {
  render: () => (
    <div className="w-[300px] space-y-2">
      <Label htmlFor="payment">طريقة الدفع</Label>
      <Select>
        <SelectTrigger id="payment">
          <SelectValue placeholder="اختر طريقة الدفع" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="cash">نقدي</SelectItem>
          <SelectItem value="bank-transfer">تحويل بنكي</SelectItem>
          <SelectItem value="check">شيك</SelectItem>
          <SelectItem value="installments">أقساط</SelectItem>
          <SelectItem value="letter-of-credit">خطاب ضمان</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const YearMonthSelect: Story = {
  render: () => (
    <div className="flex gap-4">
      <div className="w-[150px] space-y-2">
        <Label htmlFor="year">السنة</Label>
        <Select defaultValue="2025">
          <SelectTrigger id="year">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2023">2023</SelectItem>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2025">2025</SelectItem>
            <SelectItem value="2026">2026</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-[150px] space-y-2">
        <Label htmlFor="month">الشهر</Label>
        <Select defaultValue="10">
          <SelectTrigger id="month">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">يناير</SelectItem>
            <SelectItem value="2">فبراير</SelectItem>
            <SelectItem value="3">مارس</SelectItem>
            <SelectItem value="4">أبريل</SelectItem>
            <SelectItem value="5">مايو</SelectItem>
            <SelectItem value="6">يونيو</SelectItem>
            <SelectItem value="7">يوليو</SelectItem>
            <SelectItem value="8">أغسطس</SelectItem>
            <SelectItem value="9">سبتمبر</SelectItem>
            <SelectItem value="10">أكتوبر</SelectItem>
            <SelectItem value="11">نوفمبر</SelectItem>
            <SelectItem value="12">ديسمبر</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
};

// ============================================
// Comprehensive Examples
// ============================================

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="w-[250px] space-y-2">
        <Label>صغير (sm)</Label>
        <Select>
          <SelectTrigger size="sm">
            <SelectValue placeholder="حجم صغير" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">خيار 1</SelectItem>
            <SelectItem value="2">خيار 2</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-[280px] space-y-2">
        <Label>عادي (default)</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="حجم عادي" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">خيار 1</SelectItem>
            <SelectItem value="2">خيار 2</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
};

export const FilterForm: Story = {
  render: () => (
    <div className="w-[800px] space-y-4 p-6 border rounded-lg">
      <h3 className="font-semibold text-lg">فلترة المناقصات</h3>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="filter-status">الحالة</Label>
          <Select>
            <SelectTrigger id="filter-status">
              <SelectValue placeholder="جميع الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="open">مفتوحة</SelectItem>
              <SelectItem value="closed">مغلقة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-category">الفئة</Label>
          <Select>
            <SelectTrigger id="filter-category">
              <SelectValue placeholder="جميع الفئات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الفئات</SelectItem>
              <SelectItem value="construction">إنشاءات</SelectItem>
              <SelectItem value="it">تقنية</SelectItem>
              <SelectItem value="supplies">توريدات</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-priority">الأولوية</Label>
          <Select>
            <SelectTrigger id="filter-priority">
              <SelectValue placeholder="جميع الأولويات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأولويات</SelectItem>
              <SelectItem value="low">منخفضة</SelectItem>
              <SelectItem value="medium">متوسطة</SelectItem>
              <SelectItem value="high">عالية</SelectItem>
            </SelectContent>
          </Select>
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
    <div className="space-y-8 w-[900px]">
      <div className="space-y-4">
        <h3 className="font-semibold">Light Theme</h3>
        <div className="flex gap-4 p-4 border rounded-lg">
          <Select>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="عادي" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">خيار 1</SelectItem>
              <SelectItem value="2">خيار 2</SelectItem>
            </SelectContent>
          </Select>

          <Select disabled>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="معطل" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">خيار 1</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="selected">
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="selected">محدد</SelectItem>
              <SelectItem value="other">آخر</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4 dark">
        <h3 className="font-semibold">Dark Theme</h3>
        <div className="flex gap-4 p-4 border rounded-lg bg-background">
          <Select>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="عادي" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">خيار 1</SelectItem>
              <SelectItem value="2">خيار 2</SelectItem>
            </SelectContent>
          </Select>

          <Select disabled>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="معطل" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">خيار 1</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="selected">
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="selected">محدد</SelectItem>
              <SelectItem value="other">آخر</SelectItem>
            </SelectContent>
          </Select>
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
        <h2 className="text-2xl font-bold mb-2">Select Component</h2>
        <p className="text-muted-foreground">
          مكون القائمة المنسدلة (Select) للاختيار من قائمة خيارات
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">المكونات الفرعية</h3>
        <div className="space-y-2 text-sm">
          <div><code className="bg-muted px-2 py-1 rounded">Select</code> - المكون الأساسي</div>
          <div><code className="bg-muted px-2 py-1 rounded">SelectTrigger</code> - الزر المحفز</div>
          <div><code className="bg-muted px-2 py-1 rounded">SelectValue</code> - القيمة المعروضة</div>
          <div><code className="bg-muted px-2 py-1 rounded">SelectContent</code> - محتوى القائمة</div>
          <div><code className="bg-muted px-2 py-1 rounded">SelectItem</code> - عنصر في القائمة</div>
          <div><code className="bg-muted px-2 py-1 rounded">SelectGroup</code> - مجموعة عناصر</div>
          <div><code className="bg-muted px-2 py-1 rounded">SelectLabel</code> - عنوان المجموعة</div>
          <div><code className="bg-muted px-2 py-1 rounded">SelectSeparator</code> - فاصل</div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">متى تستخدم Select؟</h3>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>اختيار حالة المناقصة أو المشروع</li>
          <li>اختيار الفئة أو التصنيف</li>
          <li>اختيار الأولوية</li>
          <li>اختيار السنة أو الشهر</li>
          <li>اختيار طريقة الدفع</li>
          <li>الفلاتر والبحث المتقدم</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Design Tokens</h3>
        <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
          <div>bg-input-background - خلفية الزر</div>
          <div>border-input - حدود الزر</div>
          <div>bg-popover - خلفية القائمة</div>
          <div>focus:bg-accent - العنصر عند التركيز</div>
          <div>text-muted-foreground - placeholder</div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">الأحجام المتاحة</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <code className="bg-muted px-2 py-1 rounded">size=&quot;sm&quot;</code>
            <span>- صغير (h-8)</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="bg-muted px-2 py-1 rounded">size=&quot;default&quot;</code>
            <span>- عادي (h-9)</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Best Practices</h3>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>استخدم Label دائماً لتحسين إمكانية الوصول</li>
          <li>أضف placeholder واضح يصف الاختيار المطلوب</li>
          <li>استخدم SelectGroup لتنظيم الخيارات المرتبطة</li>
          <li>أضف SelectSeparator بين المجموعات المختلفة</li>
          <li>استخدم defaultValue للقيم الافتراضية</li>
          <li>أضف أيقونات أو ألوان للخيارات المهمة</li>
          <li>استخدم disabled للخيارات غير المتاحة</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">أمثلة الاستخدام</h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <code className="block bg-muted p-3 rounded text-xs">
              {`<Select>
  <SelectTrigger>
    <SelectValue placeholder="اختر..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">خيار 1</SelectItem>
  </SelectContent>
</Select>`}
            </code>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Accessibility</h3>
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-sm space-y-2">
          <p>✅ دائماً استخدم Label مع htmlFor</p>
          <p>✅ يدعم keyboard navigation (Arrow keys, Enter, Esc)</p>
          <p>✅ يدعم type-ahead search</p>
          <p>✅ ARIA attributes تلقائية من Radix UI</p>
          <p>✅ Focus management محسّن</p>
        </div>
      </div>
    </div>
  ),
};
