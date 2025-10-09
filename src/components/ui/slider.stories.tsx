import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Slider } from './slider';
import { Label } from './label';

const meta = {
  title: 'UI Components/Slider',
  component: Slider,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================
// Basic Stories
// ============================================

export const Default: Story = {
  render: () => (
    <div className="w-[400px]">
      <Slider defaultValue={[50]} max={100} step={1} />
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-[400px] space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="volume">مستوى الصوت</Label>
        <span className="text-sm text-muted-foreground">50%</span>
      </div>
      <Slider id="volume" defaultValue={[50]} max={100} step={1} />
    </div>
  ),
};

export const WithValue: Story = {
  render: () => {
    const [value, setValue] = React.useState([25]);
    
    return (
      <div className="w-[400px] space-y-4">
        <div className="flex items-center justify-between">
          <Label>القيمة الحالية</Label>
          <span className="text-sm font-medium">{value[0]}</span>
        </div>
        <Slider
          value={value}
          onValueChange={setValue}
          max={100}
          step={1}
        />
      </div>
    );
  },
};

export const Range: Story = {
  render: () => {
    const [value, setValue] = React.useState([25, 75]);
    
    return (
      <div className="w-[400px] space-y-4">
        <div className="flex items-center justify-between">
          <Label>النطاق السعري</Label>
          <span className="text-sm font-medium">
            {value[0]} - {value[1]} ألف ر.س
          </span>
        </div>
        <Slider
          value={value}
          onValueChange={setValue}
          max={100}
          step={1}
        />
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <Label className="opacity-50">معطل</Label>
      <Slider defaultValue={[50]} max={100} disabled />
    </div>
  ),
};

export const WithSteps: Story = {
  render: () => {
    const [value, setValue] = React.useState([50]);
    
    return (
      <div className="w-[400px] space-y-4">
        <div className="flex items-center justify-between">
          <Label>خطوات 10</Label>
          <span className="text-sm font-medium">{value[0]}</span>
        </div>
        <Slider
          value={value}
          onValueChange={setValue}
          max={100}
          step={10}
        />
      </div>
    );
  },
};

// ============================================
// Application Examples
// ============================================

export const BudgetFilter: Story = {
  render: () => {
    const [budget, setBudget] = React.useState([10000, 500000]);
    
    return (
      <div className="w-[500px] space-y-4 p-4 border rounded-lg">
        <h3 className="font-semibold">فلترة حسب الميزانية</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>نطاق الميزانية</Label>
            <span className="text-sm font-medium">
              {budget[0].toLocaleString()} - {budget[1].toLocaleString()} ر.س
            </span>
          </div>
          
          <Slider
            value={budget}
            onValueChange={setBudget}
            min={0}
            max={1000000}
            step={10000}
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 ر.س</span>
            <span>مليون ر.س</span>
          </div>
        </div>
      </div>
    );
  },
};

export const ProjectProgress: Story = {
  render: () => {
    const [progress, setProgress] = React.useState([65]);
    
    return (
      <div className="w-[450px] space-y-4 p-4 border rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">تقدم المشروع</h3>
            <p className="text-sm text-muted-foreground">
              مشروع التطوير الرقمي
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{progress[0]}%</div>
            <div className="text-xs text-muted-foreground">مكتمل</div>
          </div>
        </div>
        
        <Slider
          value={progress}
          onValueChange={setProgress}
          max={100}
          step={5}
          className="w-full"
        />
        
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">0%</span>
          <span className="text-muted-foreground">25%</span>
          <span className="text-muted-foreground">50%</span>
          <span className="text-muted-foreground">75%</span>
          <span className="text-muted-foreground">100%</span>
        </div>
      </div>
    );
  },
};

export const QualityScore: Story = {
  render: () => {
    const [score, setScore] = React.useState([8]);
    
    const getScoreColor = (value: number) => {
      if (value <= 3) return 'text-red-600';
      if (value <= 6) return 'text-yellow-600';
      return 'text-green-600';
    };
    
    const getScoreLabel = (value: number) => {
      if (value <= 3) return 'ضعيف';
      if (value <= 6) return 'متوسط';
      if (value <= 8) return 'جيد';
      return 'ممتاز';
    };
    
    return (
      <div className="w-[400px] space-y-4 p-4 border rounded-lg">
        <div className="flex items-center justify-between">
          <Label>تقييم الجودة</Label>
          <div className="text-right">
            <div className={`text-xl font-bold ${getScoreColor(score[0])}`}>
              {score[0]}/10
            </div>
            <div className="text-xs text-muted-foreground">
              {getScoreLabel(score[0])}
            </div>
          </div>
        </div>
        
        <Slider
          value={score}
          onValueChange={setScore}
          min={1}
          max={10}
          step={1}
        />
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1 - ضعيف</span>
          <span>10 - ممتاز</span>
        </div>
      </div>
    );
  },
};

export const PriorityLevel: Story = {
  render: () => {
    const [priority, setPriority] = React.useState([2]);
    
    const priorities = ['منخفضة', 'متوسطة', 'عالية', 'عاجل'];
    const colors = [
      'text-green-600',
      'text-yellow-600',
      'text-orange-600',
      'text-red-600',
    ];
    
    return (
      <div className="w-[400px] space-y-4 p-4 border rounded-lg">
        <div className="flex items-center justify-between">
          <Label>مستوى الأولوية</Label>
          <div className={`text-lg font-semibold ${colors[priority[0]]}`}>
            {priorities[priority[0]]}
          </div>
        </div>
        
        <Slider
          value={priority}
          onValueChange={setPriority}
          min={0}
          max={3}
          step={1}
        />
        
        <div className="flex justify-between text-xs">
          {priorities.map((p, i) => (
            <span
              key={p}
              className={priority[0] === i ? colors[i] : 'text-muted-foreground'}
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    );
  },
};

export const TimelineFilter: Story = {
  render: () => {
    const [months, setMonths] = React.useState([1, 6]);
    
    return (
      <div className="w-[500px] space-y-4 p-4 border rounded-lg">
        <h3 className="font-semibold">فترة المشروع</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>المدة الزمنية</Label>
            <span className="text-sm font-medium">
              {months[0]} - {months[1]} شهر
            </span>
          </div>
          
          <Slider
            value={months}
            onValueChange={setMonths}
            min={1}
            max={12}
            step={1}
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>شهر واحد</span>
            <span>12 شهر</span>
          </div>
        </div>
      </div>
    );
  },
};

// ============================================
// Different Configurations
// ============================================

export const DifferentSteps: Story = {
  render: () => (
    <div className="w-[500px] space-y-6">
      <div className="space-y-2">
        <Label>Step = 1 (دقيق)</Label>
        <Slider defaultValue={[50]} max={100} step={1} />
      </div>
      
      <div className="space-y-2">
        <Label>Step = 5</Label>
        <Slider defaultValue={[50]} max={100} step={5} />
      </div>
      
      <div className="space-y-2">
        <Label>Step = 10</Label>
        <Slider defaultValue={[50]} max={100} step={10} />
      </div>
      
      <div className="space-y-2">
        <Label>Step = 25 (ربع)</Label>
        <Slider defaultValue={[50]} max={100} step={25} />
      </div>
    </div>
  ),
};

export const DifferentRanges: Story = {
  render: () => (
    <div className="w-[500px] space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label>0 - 100</Label>
          <span className="text-sm text-muted-foreground">50</span>
        </div>
        <Slider defaultValue={[50]} min={0} max={100} step={1} />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label>0 - 1000</Label>
          <span className="text-sm text-muted-foreground">500</span>
        </div>
        <Slider defaultValue={[500]} min={0} max={1000} step={10} />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label>1 - 10</Label>
          <span className="text-sm text-muted-foreground">5</span>
        </div>
        <Slider defaultValue={[5]} min={1} max={10} step={1} />
      </div>
    </div>
  ),
};

export const MultipleRanges: Story = {
  render: () => {
    const [range1, setRange1] = React.useState([20, 80]);
    const [range2, setRange2] = React.useState([30, 60]);
    const [range3, setRange3] = React.useState([40, 70]);
    
    return (
      <div className="w-[500px] space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>النطاق 1</Label>
            <span className="text-sm text-muted-foreground">
              {range1[0]} - {range1[1]}
            </span>
          </div>
          <Slider value={range1} onValueChange={setRange1} max={100} />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>النطاق 2</Label>
            <span className="text-sm text-muted-foreground">
              {range2[0]} - {range2[1]}
            </span>
          </div>
          <Slider value={range2} onValueChange={setRange2} max={100} />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>النطاق 3</Label>
            <span className="text-sm text-muted-foreground">
              {range3[0]} - {range3[1]}
            </span>
          </div>
          <Slider value={range3} onValueChange={setRange3} max={100} />
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
    <div className="space-y-8 w-[600px]">
      <div className="space-y-4">
        <h3 className="font-semibold">Light Theme</h3>
        <div className="p-4 border rounded-lg space-y-4">
          <Slider defaultValue={[33]} max={100} />
          <Slider defaultValue={[25, 75]} max={100} />
          <Slider defaultValue={[50]} max={100} disabled />
        </div>
      </div>

      <div className="space-y-4 dark">
        <h3 className="font-semibold">Dark Theme</h3>
        <div className="p-4 border rounded-lg bg-background space-y-4">
          <Slider defaultValue={[33]} max={100} />
          <Slider defaultValue={[25, 75]} max={100} />
          <Slider defaultValue={[50]} max={100} disabled />
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
        <h2 className="text-2xl font-bold mb-2">Slider Component</h2>
        <p className="text-muted-foreground">
          مكون Slider لاختيار قيمة أو نطاق من المدى المحدد
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">متى تستخدم Slider؟</h3>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>فلترة حسب النطاق السعري أو الميزانية</li>
          <li>تحديد نطاق زمني (من شهر إلى شهر)</li>
          <li>ضبط المستويات (صوت، سطوع، جودة)</li>
          <li>تقييم الجودة أو الأداء (1-10)</li>
          <li>تحديد مستوى الأولوية</li>
          <li>تتبع تقدم المشروع</li>
          <li>أي قيمة رقمية ضمن نطاق محدد</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">الأنواع</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded">
            <h4 className="font-semibold mb-2">Single Value</h4>
            <p className="text-muted-foreground">
              قيمة واحدة - مثل مستوى الصوت أو التقدم
            </p>
            <code className="block mt-2 text-xs">
              {`defaultValue={[50]}`}
            </code>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-950 rounded">
            <h4 className="font-semibold mb-2">Range</h4>
            <p className="text-muted-foreground">
              نطاق - مثل السعر من...إلى
            </p>
            <code className="block mt-2 text-xs">
              {`defaultValue={[25, 75]}`}
            </code>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Design Tokens</h3>
        <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
          <div>bg-muted - Track الخلفية</div>
          <div>bg-primary - النطاق المحدد</div>
          <div>bg-background - Thumb الدائرة</div>
          <div>border-primary - حدود الدائرة</div>
          <div>hover:ring-4 - عند التمرير</div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">الخصائص الرئيسية</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <code className="bg-muted px-2 py-1 rounded">min</code>
            <span>- الحد الأدنى للقيمة (افتراضي: 0)</span>
          </div>
          <div className="flex items-start gap-2">
            <code className="bg-muted px-2 py-1 rounded">max</code>
            <span>- الحد الأقصى للقيمة (افتراضي: 100)</span>
          </div>
          <div className="flex items-start gap-2">
            <code className="bg-muted px-2 py-1 rounded">step</code>
            <span>- حجم الخطوة (افتراضي: 1)</span>
          </div>
          <div className="flex items-start gap-2">
            <code className="bg-muted px-2 py-1 rounded">defaultValue</code>
            <span>- القيمة الابتدائية (مصفوفة)</span>
          </div>
          <div className="flex items-start gap-2">
            <code className="bg-muted px-2 py-1 rounded">value</code>
            <span>- القيمة الحالية (للتحكم)</span>
          </div>
          <div className="flex items-start gap-2">
            <code className="bg-muted px-2 py-1 rounded">onValueChange</code>
            <span>- عند تغيير القيمة</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Best Practices</h3>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>أضف Label يوضح الغرض من Slider</li>
          <li>اعرض القيمة الحالية بوضوح</li>
          <li>أضف مؤشرات للحد الأدنى والأقصى</li>
          <li>استخدم step مناسب (ليس صغير جداً)</li>
          <li>للنطاق السعري، استخدم range (قيمتين)</li>
          <li>أضف وحدة القياس (ر.س، %, شهر...)</li>
          <li>اجعل منطقة التفاعل كبيرة كافية</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">أمثلة الاستخدام</h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-sm font-medium">قيمة واحدة:</p>
            <code className="block bg-muted p-3 rounded text-xs">
              {`<Slider 
  defaultValue={[50]} 
  max={100} 
  step={1} 
/>`}
            </code>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">نطاق مع التحكم:</p>
            <code className="block bg-muted p-3 rounded text-xs">
              {`const [value, setValue] = useState([25, 75]);

<Slider 
  value={value}
  onValueChange={setValue}
  max={100}
/>`}
            </code>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Accessibility</h3>
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-sm space-y-2">
          <p>✅ keyboard navigation (Arrow keys)</p>
          <p>✅ Home/End للذهاب للحد الأدنى/الأقصى</p>
          <p>✅ Page Up/Down للقفز بخطوات كبيرة</p>
          <p>✅ ARIA attributes تلقائية</p>
          <p>✅ Screen reader يعلن عن القيمة</p>
          <p>✅ Focus indicator واضح</p>
        </div>
      </div>

      <div className="pt-4">
        <h4 className="font-semibold mb-2">مثال تفاعلي:</h4>
        <div className="p-4 border rounded-lg space-y-4">
          <Slider defaultValue={[50]} max={100} step={1} />
        </div>
      </div>
    </div>
  ),
};
