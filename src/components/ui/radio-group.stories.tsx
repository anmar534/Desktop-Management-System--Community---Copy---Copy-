import type { Meta, StoryObj } from '@storybook/react';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Label } from './label';

const meta = {
  title: 'UI Components/RadioGroup',
  component: RadioGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================
// Basic Stories
// ============================================

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="option1">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option1" id="r1" />
        <Label htmlFor="r1" className="cursor-pointer">
          الخيار الأول
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option2" id="r2" />
        <Label htmlFor="r2" className="cursor-pointer">
          الخيار الثاني
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option3" id="r3" />
        <Label htmlFor="r3" className="cursor-pointer">
          الخيار الثالث
        </Label>
      </div>
    </RadioGroup>
  ),
};

export const WithGroupLabel: Story = {
  render: () => (
    <div className="space-y-3">
      <Label className="font-semibold">اختر طريقة الدفع</Label>
      <RadioGroup defaultValue="bank">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="cash" id="pay-cash" />
          <Label htmlFor="pay-cash" className="cursor-pointer">
            نقدي
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="bank" id="pay-bank" />
          <Label htmlFor="pay-bank" className="cursor-pointer">
            تحويل بنكي
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="check" id="pay-check" />
          <Label htmlFor="pay-check" className="cursor-pointer">
            شيك
          </Label>
        </div>
      </RadioGroup>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="option1" disabled>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option1" id="d1" />
        <Label htmlFor="d1" className="cursor-pointer opacity-50">
          خيار محدد (معطل)
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option2" id="d2" />
        <Label htmlFor="d2" className="cursor-pointer opacity-50">
          خيار آخر (معطل)
        </Label>
      </div>
    </RadioGroup>
  ),
};

export const DisabledOption: Story = {
  render: () => (
    <RadioGroup defaultValue="available1">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="available1" id="a1" />
        <Label htmlFor="a1" className="cursor-pointer">
          خيار متاح 1
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="disabled" id="a2" disabled />
        <Label htmlFor="a2" className="cursor-pointer opacity-50">
          خيار معطل
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="available2" id="a3" />
        <Label htmlFor="a3" className="cursor-pointer">
          خيار متاح 2
        </Label>
      </div>
    </RadioGroup>
  ),
};

export const WithDescriptions: Story = {
  render: () => (
    <div className="w-[400px] space-y-3">
      <Label className="font-semibold">نوع المناقصة</Label>
      <RadioGroup defaultValue="public">
        <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
          <RadioGroupItem value="public" id="type-public" className="mt-1" />
          <div className="flex-1">
            <Label htmlFor="type-public" className="cursor-pointer font-medium">
              مناقصة عامة
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              متاحة لجميع المتقدمين دون قيود
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
          <RadioGroupItem value="limited" id="type-limited" className="mt-1" />
          <div className="flex-1">
            <Label htmlFor="type-limited" className="cursor-pointer font-medium">
              مناقصة محدودة
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              محصورة على قائمة محددة من المتقدمين
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
          <RadioGroupItem value="direct" id="type-direct" className="mt-1" />
          <div className="flex-1">
            <Label htmlFor="type-direct" className="cursor-pointer font-medium">
              شراء مباشر
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              التعاقد المباشر مع مورّد محدد
            </p>
          </div>
        </div>
      </RadioGroup>
    </div>
  ),
};

// ============================================
// Application Examples
// ============================================

export const TenderStatus: Story = {
  render: () => (
    <div className="w-[350px] space-y-3 p-4 border rounded-lg">
      <Label className="font-semibold">حالة المناقصة</Label>
      <RadioGroup defaultValue="open">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="draft" id="status-draft" />
          <Label htmlFor="status-draft" className="cursor-pointer flex items-center gap-2">
            <span className="size-2 rounded-full bg-muted-foreground" />
            مسودة
          </Label>
        </div>
        
        <div className="flex items-center gap-2">
          <RadioGroupItem value="open" id="status-open" />
          <Label htmlFor="status-open" className="cursor-pointer flex items-center gap-2">
            <span className="size-2 rounded-full bg-info" />
            مفتوحة
          </Label>
        </div>
        
        <div className="flex items-center gap-2">
          <RadioGroupItem value="evaluation" id="status-eval" />
          <Label htmlFor="status-eval" className="cursor-pointer flex items-center gap-2">
            <span className="size-2 rounded-full bg-warning" />
            قيد التقييم
          </Label>
        </div>
        
        <div className="flex items-center gap-2">
          <RadioGroupItem value="closed" id="status-closed" />
          <Label htmlFor="status-closed" className="cursor-pointer flex items-center gap-2">
            <span className="size-2 rounded-full bg-destructive" />
            مغلقة
          </Label>
        </div>
        
        <div className="flex items-center gap-2">
          <RadioGroupItem value="awarded" id="status-awarded" />
          <Label htmlFor="status-awarded" className="cursor-pointer flex items-center gap-2">
            <span className="size-2 rounded-full bg-success" />
            تم الترسية
          </Label>
        </div>
      </RadioGroup>
    </div>
  ),
};

export const ProjectPriority: Story = {
  render: () => (
    <div className="w-[300px] space-y-3 p-4 border rounded-lg">
      <Label className="font-semibold">أولوية المشروع</Label>
      <RadioGroup defaultValue="medium">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="low" id="priority-low" />
          <Label htmlFor="priority-low" className="cursor-pointer">
            🟢 منخفضة
          </Label>
        </div>
        
        <div className="flex items-center gap-2">
          <RadioGroupItem value="medium" id="priority-medium" />
          <Label htmlFor="priority-medium" className="cursor-pointer">
            🟡 متوسطة
          </Label>
        </div>
        
        <div className="flex items-center gap-2">
          <RadioGroupItem value="high" id="priority-high" />
          <Label htmlFor="priority-high" className="cursor-pointer">
            🟠 عالية
          </Label>
        </div>
        
        <div className="flex items-center gap-2">
          <RadioGroupItem value="urgent" id="priority-urgent" />
          <Label htmlFor="priority-urgent" className="cursor-pointer">
            🔴 عاجل
          </Label>
        </div>
      </RadioGroup>
    </div>
  ),
};

export const PaymentTerms: Story = {
  render: () => (
    <div className="w-[400px] space-y-3 p-4 border rounded-lg">
      <Label className="font-semibold">شروط الدفع</Label>
      <RadioGroup defaultValue="installments">
        <div className="flex items-start gap-3">
          <RadioGroupItem value="full" id="payment-full" className="mt-1" />
          <div>
            <Label htmlFor="payment-full" className="cursor-pointer font-medium">
              دفعة واحدة
            </Label>
            <p className="text-sm text-muted-foreground">
              دفع كامل المبلغ دفعة واحدة
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <RadioGroupItem value="installments" id="payment-install" className="mt-1" />
          <div>
            <Label htmlFor="payment-install" className="cursor-pointer font-medium">
              أقساط
            </Label>
            <p className="text-sm text-muted-foreground">
              تقسيط المبلغ على عدة دفعات
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <RadioGroupItem value="milestones" id="payment-milestones" className="mt-1" />
          <div>
            <Label htmlFor="payment-milestones" className="cursor-pointer font-medium">
              حسب المراحل
            </Label>
            <p className="text-sm text-muted-foreground">
              الدفع عند إتمام كل مرحلة
            </p>
          </div>
        </div>
      </RadioGroup>
    </div>
  ),
};

export const DeliveryOptions: Story = {
  render: () => (
    <div className="w-[450px] space-y-3 p-4 border rounded-lg">
      <Label className="font-semibold">خيارات التسليم</Label>
      <RadioGroup defaultValue="standard">
        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50">
          <div className="flex items-center gap-3">
            <RadioGroupItem value="express" id="delivery-express" />
            <div>
              <Label htmlFor="delivery-express" className="cursor-pointer font-medium">
                تسليم سريع
              </Label>
              <p className="text-xs text-muted-foreground">2-3 أيام عمل</p>
            </div>
          </div>
          <span className="font-semibold">500 ر.س</span>
        </div>
        
        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50">
          <div className="flex items-center gap-3">
            <RadioGroupItem value="standard" id="delivery-standard" />
            <div>
              <Label htmlFor="delivery-standard" className="cursor-pointer font-medium">
                تسليم عادي
              </Label>
              <p className="text-xs text-muted-foreground">5-7 أيام عمل</p>
            </div>
          </div>
          <span className="font-semibold">200 ر.س</span>
        </div>
        
        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50">
          <div className="flex items-center gap-3">
            <RadioGroupItem value="economy" id="delivery-economy" />
            <div>
              <Label htmlFor="delivery-economy" className="cursor-pointer font-medium">
                تسليم اقتصادي
              </Label>
              <p className="text-xs text-muted-foreground">10-14 يوم عمل</p>
            </div>
          </div>
          <span className="font-semibold">مجاناً</span>
        </div>
      </RadioGroup>
    </div>
  ),
};

// ============================================
// Form Example
// ============================================

export const CompleteForm: Story = {
  render: () => (
    <div className="w-[500px] space-y-6 p-6 border rounded-lg">
      <h3 className="font-semibold text-lg">تقديم عطاء</h3>
      
      <div className="space-y-3">
        <Label className="font-semibold">نوع العطاء *</Label>
        <RadioGroup defaultValue="technical">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="technical" id="bid-technical" />
            <Label htmlFor="bid-technical" className="cursor-pointer">
              عطاء فني
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="financial" id="bid-financial" />
            <Label htmlFor="bid-financial" className="cursor-pointer">
              عطاء مالي
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="combined" id="bid-combined" />
            <Label htmlFor="bid-combined" className="cursor-pointer">
              عطاء فني ومالي
            </Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="space-y-3">
        <Label className="font-semibold">فترة التنفيذ *</Label>
        <RadioGroup defaultValue="3-6">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="0-3" id="duration-1" />
            <Label htmlFor="duration-1" className="cursor-pointer">
              أقل من 3 أشهر
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="3-6" id="duration-2" />
            <Label htmlFor="duration-2" className="cursor-pointer">
              3-6 أشهر
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="6-12" id="duration-3" />
            <Label htmlFor="duration-3" className="cursor-pointer">
              6-12 شهر
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="12+" id="duration-4" />
            <Label htmlFor="duration-4" className="cursor-pointer">
              أكثر من سنة
            </Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="space-y-3">
        <Label className="font-semibold">الضمان البنكي *</Label>
        <RadioGroup defaultValue="yes">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="yes" id="guarantee-yes" />
            <Label htmlFor="guarantee-yes" className="cursor-pointer">
              نعم، متوفر
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="pending" id="guarantee-pending" />
            <Label htmlFor="guarantee-pending" className="cursor-pointer">
              قيد الإصدار
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="no" id="guarantee-no" />
            <Label htmlFor="guarantee-no" className="cursor-pointer">
              غير متوفر
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  ),
};

// ============================================
// All States
// ============================================

export const AllStates: Story = {
  render: () => (
    <div className="grid gap-6 w-[700px]">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <h4 className="text-sm font-medium">عادي (Normal)</h4>
          <RadioGroup>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="1" id="normal-1" />
              <Label htmlFor="normal-1" className="cursor-pointer">خيار 1</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="2" id="normal-2" />
              <Label htmlFor="normal-2" className="cursor-pointer">خيار 2</Label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="space-y-3">
          <h4 className="text-sm font-medium">محدد (Selected)</h4>
          <RadioGroup defaultValue="1">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="1" id="selected-1" />
              <Label htmlFor="selected-1" className="cursor-pointer">محدد</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="2" id="selected-2" />
              <Label htmlFor="selected-2" className="cursor-pointer">غير محدد</Label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="space-y-3">
          <h4 className="text-sm font-medium">خطأ (Error)</h4>
          <RadioGroup aria-invalid="true">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="1" id="error-1" aria-invalid="true" />
              <Label htmlFor="error-1" className="cursor-pointer">خيار 1</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="2" id="error-2" aria-invalid="true" />
              <Label htmlFor="error-2" className="cursor-pointer">خيار 2</Label>
            </div>
          </RadioGroup>
          <p className="text-sm text-destructive">يجب اختيار أحد الخيارات</p>
        </div>
        
        <div className="space-y-3">
          <h4 className="text-sm font-medium">معطل (Disabled)</h4>
          <RadioGroup defaultValue="1" disabled>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="1" id="disabled-1" />
              <Label htmlFor="disabled-1" className="cursor-pointer opacity-50">محدد ومعطل</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="2" id="disabled-2" />
              <Label htmlFor="disabled-2" className="cursor-pointer opacity-50">معطل</Label>
            </div>
          </RadioGroup>
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
        <div className="p-4 border rounded-lg">
          <RadioGroup defaultValue="selected">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="unselected" id="light-unselected" />
              <Label htmlFor="light-unselected">غير محدد</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="selected" id="light-selected" />
              <Label htmlFor="light-selected">محدد</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="disabled" id="light-disabled" disabled />
              <Label htmlFor="light-disabled" className="opacity-50">معطل</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div className="space-y-4 dark">
        <h3 className="font-semibold">Dark Theme</h3>
        <div className="p-4 border rounded-lg bg-background">
          <RadioGroup defaultValue="selected">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="unselected" id="dark-unselected" />
              <Label htmlFor="dark-unselected">غير محدد</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="selected" id="dark-selected" />
              <Label htmlFor="dark-selected">محدد</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="disabled" id="dark-disabled" disabled />
              <Label htmlFor="dark-disabled" className="opacity-50">معطل</Label>
            </div>
          </RadioGroup>
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
        <h2 className="text-2xl font-bold mb-2">RadioGroup Component</h2>
        <p className="text-muted-foreground">
          مكون RadioGroup للاختيار الحصري من قائمة خيارات
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">المكونات الفرعية</h3>
        <div className="space-y-2 text-sm">
          <div><code className="bg-muted px-2 py-1 rounded">RadioGroup</code> - المجموعة الأساسية</div>
          <div><code className="bg-muted px-2 py-1 rounded">RadioGroupItem</code> - عنصر الاختيار</div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">متى تستخدم RadioGroup؟</h3>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>اختيار حصري من قائمة خيارات (خيار واحد فقط)</li>
          <li>تحديد حالة المناقصة أو المشروع</li>
          <li>اختيار الأولوية</li>
          <li>تحديد طريقة الدفع</li>
          <li>خيارات التسليم</li>
          <li>أي سؤال بإجابة واحدة</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Design Tokens</h3>
        <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
          <div>border-input - الحدود</div>
          <div>dark:bg-input/30 - الخلفية (dark mode)</div>
          <div>text-primary - اللون عند التحديد</div>
          <div>fill-primary - دائرة التحديد</div>
          <div>focus-visible:border-ring - عند التركيز</div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Best Practices</h3>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>استخدم Label لكل RadioGroupItem</li>
          <li>اجعل Label قابل للنقر مع htmlFor</li>
          <li>حدد defaultValue للقيمة الافتراضية</li>
          <li>استخدم disabled للخيارات غير المتاحة</li>
          <li>أضف أوصاف للخيارات المعقدة</li>
          <li>استخدم Checkbox للاختيارات المتعددة</li>
          <li>رتب الخيارات بشكل منطقي</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">أمثلة الاستخدام</h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <code className="block bg-muted p-3 rounded text-xs">
              {`<RadioGroup defaultValue="option1">
  <div className="flex items-center gap-2">
    <RadioGroupItem value="option1" id="r1" />
    <Label htmlFor="r1">الخيار الأول</Label>
  </div>
</RadioGroup>`}
            </code>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Accessibility</h3>
  <div className="bg-info/10 dark:bg-info/20 p-4 rounded-lg text-sm space-y-2">
          <p>✅ استخدم Label مع htmlFor لكل عنصر</p>
          <p>✅ keyboard navigation (Arrow keys, Space)</p>
          <p>✅ ARIA attributes تلقائية من Radix UI</p>
          <p>✅ Focus management محسّن</p>
          <p>✅ Screen reader support</p>
        </div>
      </div>
    </div>
  ),
};
