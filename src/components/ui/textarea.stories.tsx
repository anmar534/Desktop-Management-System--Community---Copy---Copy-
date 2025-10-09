import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './textarea';
import { Label } from './label';

const meta = {
  title: 'UI Components/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================
// Basic Stories
// ============================================

export const Default: Story = {
  args: {
    placeholder: 'اكتب نصك هنا...',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <Label htmlFor="description">الوصف</Label>
      <Textarea
        id="description"
        placeholder="أدخل وصف تفصيلي للمشروع..."
      />
    </div>
  ),
};

export const WithValue: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <Label htmlFor="notes">الملاحظات</Label>
      <Textarea
        id="notes"
        defaultValue="هذا نص مثال موجود في حقل النص المتعدد الأسطر.
يمكنك كتابة عدة أسطر هنا.
النص يدعم العربية بشكل كامل."
      />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <Label htmlFor="disabled">نص معطل</Label>
      <Textarea
        id="disabled"
        placeholder="هذا الحقل معطل"
        disabled
      />
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <Label htmlFor="error">التعليقات</Label>
      <Textarea
        id="error"
        placeholder="أدخل تعليقاتك..."
        aria-invalid="true"
      />
      <p className="text-sm text-destructive">
        يجب إدخال تعليقات بحد أدنى 10 أحرف
      </p>
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <Label htmlFor="required">
        الملاحظات الإدارية <span className="text-destructive">*</span>
      </Label>
      <Textarea
        id="required"
        placeholder="حقل إجباري..."
        required
        aria-required="true"
      />
    </div>
  ),
};

export const Readonly: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <Label htmlFor="readonly">محتوى للقراءة فقط</Label>
      <Textarea
        id="readonly"
        value="هذا محتوى للقراءة فقط. لا يمكن تعديله."
        readOnly
      />
    </div>
  ),
};

// ============================================
// Comprehensive Examples
// ============================================

export const AllStates: Story = {
  render: () => (
    <div className="grid gap-6 w-[800px]">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>عادي (Normal)</Label>
          <Textarea placeholder="نص عادي..." />
        </div>
        
        <div className="space-y-2">
          <Label>مملوء (Filled)</Label>
          <Textarea defaultValue="محتوى موجود في الحقل" />
        </div>
        
        <div className="space-y-2">
          <Label>خطأ (Error)</Label>
          <Textarea 
            placeholder="حقل به خطأ..." 
            aria-invalid="true"
          />
        </div>
        
        <div className="space-y-2">
          <Label>معطل (Disabled)</Label>
          <Textarea 
            placeholder="حقل معطل..." 
            disabled
          />
        </div>
        
        <div className="space-y-2">
          <Label>إجباري (Required)</Label>
          <Textarea 
            placeholder="حقل إجباري..." 
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label>للقراءة فقط (Readonly)</Label>
          <Textarea 
            value="للقراءة فقط"
            readOnly
          />
        </div>
      </div>
    </div>
  ),
};

export const DifferentSizes: Story = {
  render: () => (
    <div className="space-y-4 w-[600px]">
      <div className="space-y-2">
        <Label>صغير (min-h-16 - default)</Label>
        <Textarea 
          placeholder="ارتفاع صغير للنصوص القصيرة..."
          className="min-h-16"
        />
      </div>
      
      <div className="space-y-2">
        <Label>متوسط (min-h-24)</Label>
        <Textarea 
          placeholder="ارتفاع متوسط للوصف..."
          className="min-h-24"
        />
      </div>
      
      <div className="space-y-2">
        <Label>كبير (min-h-32)</Label>
        <Textarea 
          placeholder="ارتفاع كبير للملاحظات الطويلة..."
          className="min-h-32"
        />
      </div>
      
      <div className="space-y-2">
        <Label>كبير جداً (min-h-48)</Label>
        <Textarea 
          placeholder="ارتفاع كبير جداً للنصوص المطولة..."
          className="min-h-48"
        />
      </div>
    </div>
  ),
};

export const FormExamples: Story = {
  render: () => (
    <div className="space-y-6 w-[600px]">
      {/* Tender Notes Form */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-semibold">نموذج ملاحظات المناقصة</h3>
        
        <div className="space-y-2">
          <Label htmlFor="tender-desc">وصف المناقصة *</Label>
          <Textarea
            id="tender-desc"
            placeholder="أدخل وصف تفصيلي للمناقصة..."
            className="min-h-24"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="tender-terms">الشروط والأحكام</Label>
          <Textarea
            id="tender-terms"
            placeholder="أدخل شروط المناقصة..."
            className="min-h-32"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="tender-notes">ملاحظات إضافية</Label>
          <Textarea
            id="tender-notes"
            placeholder="أي ملاحظات أخرى..."
            className="min-h-20"
          />
        </div>
      </div>

      {/* Project Description Form */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-semibold">نموذج وصف المشروع</h3>
        
        <div className="space-y-2">
          <Label htmlFor="project-scope">نطاق المشروع *</Label>
          <Textarea
            id="project-scope"
            placeholder="حدد نطاق العمل والأهداف..."
            className="min-h-24"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="project-deliverables">المخرجات المتوقعة</Label>
          <Textarea
            id="project-deliverables"
            placeholder="اذكر المخرجات والنتائج المتوقعة..."
            className="min-h-20"
          />
        </div>
      </div>

      {/* Feedback Form */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-semibold">نموذج الملاحظات</h3>
        
        <div className="space-y-2">
          <Label htmlFor="feedback">ملاحظاتك *</Label>
          <Textarea
            id="feedback"
            placeholder="شاركنا رأيك وملاحظاتك..."
            className="min-h-32"
            required
          />
          <p className="text-sm text-muted-foreground">
            الحد الأدنى: 50 حرف، الحد الأقصى: 500 حرف
          </p>
        </div>
      </div>
    </div>
  ),
};

export const CharacterCount: Story = {
  render: () => {
    const [value, setValue] = React.useState('');
    const maxLength = 200;
    
    return (
      <div className="w-[500px] space-y-2">
        <Label htmlFor="counted">رسالة مع عداد الأحرف</Label>
        <Textarea
          id="counted"
          placeholder="اكتب رسالتك..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={maxLength}
          className="min-h-24"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>الأحرف المتبقية: {maxLength - value.length}</span>
          <span>{value.length} / {maxLength}</span>
        </div>
      </div>
    );
  },
};

// ============================================
// Theme Testing
// ============================================

export const ThemeTesting: Story = {
  render: () => (
    <div className="space-y-8 w-[900px]">
      <div className="space-y-4">
        <h3 className="font-semibold">Light Theme</h3>
        <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
          <Textarea placeholder="عادي" />
          <Textarea placeholder="خطأ" aria-invalid="true" />
          <Textarea placeholder="معطل" disabled />
        </div>
      </div>

      <div className="space-y-4 dark">
        <h3 className="font-semibold">Dark Theme</h3>
        <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg bg-background">
          <Textarea placeholder="عادي" />
          <Textarea placeholder="خطأ" aria-invalid="true" />
          <Textarea placeholder="معطل" disabled />
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
        <h2 className="text-2xl font-bold mb-2">Textarea Component</h2>
        <p className="text-muted-foreground">
          مكون حقل النص المتعدد الأسطر (Textarea) للإدخالات النصية الطويلة
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">متى تستخدم Textarea؟</h3>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>وصف المناقصات والمشروعات</li>
          <li>الملاحظات والتعليقات</li>
          <li>الشروط والأحكام</li>
          <li>نطاق العمل (Scope of Work)</li>
          <li>الملاحظات الإدارية</li>
          <li>أي محتوى نصي يتجاوز سطر واحد</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Design Tokens</h3>
        <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
          <div>bg-input-background - الخلفية</div>
          <div>border-input - الحدود</div>
          <div>text-muted-foreground - placeholder</div>
          <div>focus-visible:border-ring - حالة التركيز</div>
          <div>aria-invalid:border-destructive - حالة الخطأ</div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">الأحجام المتاحة</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <code className="bg-muted px-2 py-1 rounded">min-h-16</code>
            <span>- صغير (default)</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="bg-muted px-2 py-1 rounded">min-h-24</code>
            <span>- متوسط</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="bg-muted px-2 py-1 rounded">min-h-32</code>
            <span>- كبير</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="bg-muted px-2 py-1 rounded">min-h-48</code>
            <span>- كبير جداً</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Best Practices</h3>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>استخدم Label دائماً لتحسين إمكانية الوصول</li>
          <li>أضف placeholder واضح يصف المحتوى المتوقع</li>
          <li>استخدم aria-invalid للأخطاء</li>
          <li>حدد required للحقول الإجبارية</li>
          <li>استخدم maxLength لتحديد عدد الأحرف</li>
          <li>أضف عداد للأحرف للحقول المحدودة</li>
          <li>استخدم الحجم المناسب حسب نوع المحتوى</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">أمثلة الاستخدام</h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <code className="block bg-muted p-3 rounded text-xs">
              {`<Textarea placeholder="أدخل الوصف..." />`}
            </code>
          </div>
          <div className="space-y-2">
            <code className="block bg-muted p-3 rounded text-xs">
              {`<Textarea 
  placeholder="الملاحظات..." 
  className="min-h-32"
  maxLength={500}
/>`}
            </code>
          </div>
          <div className="space-y-2">
            <code className="block bg-muted p-3 rounded text-xs">
              {`<Textarea 
  placeholder="حقل إجباري..." 
  required
  aria-invalid={errors.description}
/>`}
            </code>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Accessibility</h3>
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-sm space-y-2">
          <p>✅ دائماً استخدم Label مع htmlFor</p>
          <p>✅ أضف aria-invalid للحقول بها أخطاء</p>
          <p>✅ استخدم aria-required للحقول الإجبارية</p>
          <p>✅ أضف aria-describedby لنص المساعدة</p>
          <p>✅ يدعم keyboard navigation</p>
        </div>
      </div>
    </div>
  ),
};
