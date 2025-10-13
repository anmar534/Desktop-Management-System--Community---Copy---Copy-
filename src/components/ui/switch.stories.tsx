import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './switch';
import { Label } from './label';

const meta = {
  title: 'UI Components/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Switch>;

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
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode" className="cursor-pointer">
        وضع الطيران
      </Label>
    </div>
  ),
};

// ============================================
// Settings Examples
// ============================================

export const NotificationSettings: Story = {
  render: () => (
    <div className="w-[400px] space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold">إعدادات الإشعارات</h3>
      
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="email-notif" className="cursor-pointer font-medium">
            إشعارات البريد الإلكتروني
          </Label>
          <p className="text-sm text-muted-foreground">
            استلام الإشعارات عبر البريد
          </p>
        </div>
        <Switch id="email-notif" defaultChecked />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="sms-notif" className="cursor-pointer font-medium">
            إشعارات الرسائل النصية
          </Label>
          <p className="text-sm text-muted-foreground">
            استلام الإشعارات عبر SMS
          </p>
        </div>
        <Switch id="sms-notif" />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="push-notif" className="cursor-pointer font-medium">
            الإشعارات الفورية
          </Label>
          <p className="text-sm text-muted-foreground">
            استلام إشعارات التطبيق
          </p>
        </div>
        <Switch id="push-notif" defaultChecked />
      </div>
    </div>
  ),
};

export const TenderSettings: Story = {
  render: () => (
    <div className="w-[450px] space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold">إعدادات المناقصات</h3>
      
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="auto-notify" className="cursor-pointer font-medium">
            إشعار تلقائي عند مناقصة جديدة
          </Label>
          <p className="text-sm text-muted-foreground">
            إرسال إشعار فوري عند نشر مناقصة جديدة
          </p>
        </div>
        <Switch id="auto-notify" defaultChecked />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="deadline-reminder" className="cursor-pointer font-medium">
            تذكير بالمواعيد النهائية
          </Label>
          <p className="text-sm text-muted-foreground">
            تذكير قبل 24 ساعة من انتهاء المناقصة
          </p>
        </div>
        <Switch id="deadline-reminder" defaultChecked />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="auto-archive" className="cursor-pointer font-medium">
            أرشفة تلقائية
          </Label>
          <p className="text-sm text-muted-foreground">
            نقل المناقصات المنتهية للأرشيف تلقائياً
          </p>
        </div>
        <Switch id="auto-archive" />
      </div>
    </div>
  ),
};

export const PrivacySettings: Story = {
  render: () => (
    <div className="w-[400px] space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold">الخصوصية والأمان</h3>
      
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="two-factor" className="cursor-pointer font-medium">
            المصادقة الثنائية
          </Label>
          <p className="text-sm text-muted-foreground">
            حماية إضافية للحساب
          </p>
        </div>
        <Switch id="two-factor" defaultChecked />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="public-profile" className="cursor-pointer font-medium">
            الملف الشخصي العام
          </Label>
          <p className="text-sm text-muted-foreground">
            السماح للآخرين بمشاهدة ملفك
          </p>
        </div>
        <Switch id="public-profile" />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="analytics" className="cursor-pointer font-medium">
            مشاركة البيانات التحليلية
          </Label>
          <p className="text-sm text-muted-foreground">
            مساعدتنا على تحسين الخدمة
          </p>
        </div>
        <Switch id="analytics" defaultChecked />
      </div>
    </div>
  ),
};

export const ProjectSettings: Story = {
  render: () => (
    <div className="w-[450px] space-y-6 p-4 border rounded-lg">
      <div className="space-y-4">
        <h3 className="font-semibold">إعدادات المشروع</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="project-active" className="cursor-pointer font-medium">
              المشروع نشط
            </Label>
            <p className="text-sm text-muted-foreground">
              تفعيل/تعطيل المشروع
            </p>
          </div>
          <Switch id="project-active" defaultChecked />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-update" className="cursor-pointer font-medium">
              تحديثات تلقائية
            </Label>
            <p className="text-sm text-muted-foreground">
              تحديث حالة المشروع تلقائياً
            </p>
          </div>
          <Switch id="auto-update" />
        </div>
      </div>
      
      <div className="border-t pt-4 space-y-4">
        <h4 className="text-sm font-medium">التنبيهات</h4>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="milestone-alert" className="cursor-pointer text-sm">
            تنبيهات المراحل الرئيسية
          </Label>
          <Switch id="milestone-alert" defaultChecked />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="budget-alert" className="cursor-pointer text-sm">
            تنبيهات تجاوز الميزانية
          </Label>
          <Switch id="budget-alert" defaultChecked />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="team-alert" className="cursor-pointer text-sm">
            تنبيهات الفريق
          </Label>
          <Switch id="team-alert" />
        </div>
      </div>
    </div>
  ),
};

// ============================================
// Feature Toggles
// ============================================

export const FeatureToggles: Story = {
  render: () => (
    <div className="w-[500px] space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold">تفعيل الميزات</h3>
      
      <div className="grid gap-4">
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Label htmlFor="advanced-search" className="cursor-pointer font-medium">
                البحث المتقدم
              </Label>
              <span className="text-xs bg-info/10 dark:bg-info/20 text-info px-2 py-0.5 rounded">
                Beta
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              تفعيل خيارات البحث والفلترة المتقدمة
            </p>
          </div>
          <Switch id="advanced-search" />
        </div>
        
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Label htmlFor="ai-assist" className="cursor-pointer font-medium">
                المساعد الذكي
              </Label>
              <span className="text-xs bg-success/10 dark:bg-success/20 text-success px-2 py-0.5 rounded">
                جديد
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              اقتراحات ذكية لتحسين العطاءات
            </p>
          </div>
          <Switch id="ai-assist" defaultChecked />
        </div>
        
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="export-pdf" className="cursor-pointer font-medium">
              تصدير PDF متقدم
            </Label>
            <p className="text-sm text-muted-foreground">
              تصدير التقارير بتنسيقات احترافية
            </p>
          </div>
          <Switch id="export-pdf" defaultChecked />
        </div>
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
          <h4 className="text-sm font-medium">عادي - غير مفعّل</h4>
          <div className="flex items-center gap-2">
            <Switch id="normal-off" />
            <Label htmlFor="normal-off" className="cursor-pointer">
              غير مفعّل
            </Label>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">عادي - مفعّل</h4>
          <div className="flex items-center gap-2">
            <Switch id="normal-on" defaultChecked />
            <Label htmlFor="normal-on" className="cursor-pointer">
              مفعّل
            </Label>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">معطل - غير مفعّل</h4>
          <div className="flex items-center gap-2">
            <Switch id="disabled-off" disabled />
            <Label htmlFor="disabled-off" className="cursor-pointer opacity-50">
              معطل
            </Label>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">معطل - مفعّل</h4>
          <div className="flex items-center gap-2">
            <Switch id="disabled-on" disabled defaultChecked />
            <Label htmlFor="disabled-on" className="cursor-pointer opacity-50">
              معطل ومفعّل
            </Label>
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// List Examples
// ============================================

export const SettingsList: Story = {
  render: () => (
    <div className="w-[450px] space-y-1 border rounded-lg">
      <div className="flex items-center justify-between p-3 hover:bg-accent/50 transition-colors">
        <Label htmlFor="setting1" className="cursor-pointer">
          تفعيل الإشعارات
        </Label>
        <Switch id="setting1" defaultChecked />
      </div>
      
      <div className="flex items-center justify-between p-3 hover:bg-accent/50 transition-colors border-t">
        <Label htmlFor="setting2" className="cursor-pointer">
          الوضع المظلم
        </Label>
        <Switch id="setting2" />
      </div>
      
      <div className="flex items-center justify-between p-3 hover:bg-accent/50 transition-colors border-t">
        <Label htmlFor="setting3" className="cursor-pointer">
          الحفظ التلقائي
        </Label>
        <Switch id="setting3" defaultChecked />
      </div>
      
      <div className="flex items-center justify-between p-3 hover:bg-accent/50 transition-colors border-t">
        <Label htmlFor="setting4" className="cursor-pointer">
          مزامنة البيانات
        </Label>
        <Switch id="setting4" defaultChecked />
      </div>
      
      <div className="flex items-center justify-between p-3 hover:bg-accent/50 transition-colors border-t">
        <Label htmlFor="setting5" className="cursor-pointer">
          التحديثات التلقائية
        </Label>
        <Switch id="setting5" />
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
            <Switch id="light-off" />
            <Label htmlFor="light-off">غير مفعّل</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="light-on" defaultChecked />
            <Label htmlFor="light-on">مفعّل</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="light-disabled" disabled />
            <Label htmlFor="light-disabled" className="opacity-50">معطل</Label>
          </div>
        </div>
      </div>

      <div className="space-y-4 dark">
        <h3 className="font-semibold">Dark Theme</h3>
        <div className="flex gap-6 p-4 border rounded-lg bg-background">
          <div className="flex items-center gap-2">
            <Switch id="dark-off" />
            <Label htmlFor="dark-off">غير مفعّل</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="dark-on" defaultChecked />
            <Label htmlFor="dark-on">مفعّل</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="dark-disabled" disabled />
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
        <h2 className="text-2xl font-bold mb-2">Switch Component</h2>
        <p className="text-muted-foreground">
          مكون Switch للتبديل بين حالتين (مفعّل/غير مفعّل)
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">متى تستخدم Switch؟</h3>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>تفعيل/تعطيل الميزات والإعدادات</li>
          <li>الإشعارات والتنبيهات</li>
          <li>خيارات الخصوصية والأمان</li>
          <li>تفعيل/تعطيل المشاريع أو الحسابات</li>
          <li>خيارات الحفظ التلقائي</li>
          <li>أي خيار بحالتين (نعم/لا، مفعّل/معطّل)</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Switch vs Checkbox</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-info/10 dark:bg-info/20 rounded">
            <h4 className="font-semibold mb-2">استخدم Switch عندما:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>التأثير فوري (مثل تفعيل الوضع المظلم)</li>
              <li>تغيير إعداد في النظام</li>
              <li>تفعيل/تعطيل ميزة</li>
            </ul>
          </div>
          <div className="p-3 bg-warning/10 dark:bg-warning/20 rounded">
            <h4 className="font-semibold mb-2">استخدم Checkbox عندما:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>جزء من نموذج يتطلب حفظ</li>
              <li>اختيار متعدد من قائمة</li>
              <li>الموافقة على الشروط</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Design Tokens</h3>
        <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
          <div>data-[state=checked]:bg-primary - عند التفعيل</div>
          <div>data-[state=unchecked]:bg-switch-background - عند عدم التفعيل</div>
          <div>bg-card - لون الدائرة المتحركة</div>
          <div>focus-visible:border-ring - عند التركيز</div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Best Practices</h3>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>استخدم Label دائماً لتوضيح الغرض</li>
          <li>اجعل التأثير واضح ومباشر</li>
          <li>استخدم وصف قصير تحت التسمية للتوضيح</li>
          <li>رتب المفاتيح منطقياً في مجموعات</li>
          <li>استخدم disabled بحذر - وضح السبب</li>
          <li>تجنب استخدام أكثر من 10 مفاتيح في صفحة واحدة</li>
          <li>اجعل منطقة النقر كبيرة (Label + Switch)</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">أمثلة الاستخدام</h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-sm font-medium">بسيط:</p>
            <code className="block bg-muted p-3 rounded text-xs">
              {`<div className="flex items-center gap-2">
  <Switch id="setting" />
  <Label htmlFor="setting">الإعداد</Label>
</div>`}
            </code>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">مع وصف:</p>
            <code className="block bg-muted p-3 rounded text-xs">
              {`<div className="flex items-center justify-between">
  <div className="space-y-0.5">
    <Label htmlFor="notif">الإشعارات</Label>
    <p className="text-sm text-muted-foreground">
      استلام التنبيهات
    </p>
  </div>
  <Switch id="notif" defaultChecked />
</div>`}
            </code>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Accessibility</h3>
  <div className="bg-info/10 dark:bg-info/20 p-4 rounded-lg text-sm space-y-2">
          <p>✅ استخدم Label مع htmlFor</p>
          <p>✅ keyboard navigation (Space to toggle)</p>
          <p>✅ ARIA attributes تلقائية من Radix UI</p>
          <p>✅ Focus indicator واضح</p>
          <p>✅ Screen reader friendly</p>
          <p>✅ يعلن عن الحالة (on/off)</p>
        </div>
      </div>

      <div className="pt-4">
        <h4 className="font-semibold mb-2">مثال تفاعلي:</h4>
        <div className="flex items-center gap-2 p-4 border rounded-lg">
          <Switch id="demo-switch" />
          <Label htmlFor="demo-switch" className="cursor-pointer">
            جرب التبديل الآن!
          </Label>
        </div>
      </div>
    </div>
  ),
};
