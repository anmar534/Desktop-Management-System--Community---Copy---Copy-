import type { Meta, StoryObj } from '@storybook/react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  CardAction 
} from './card';
import { Button } from './button';
import { ChevronRight, MoreVertical, TrendingUp, Users, DollarSign } from 'lucide-react';

const meta: Meta<typeof Card> = {
  title: 'UI Components/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Card Component (مكون البطاقة)

مكون بطاقة مرن يستخدم لتجميع المحتوى المرتبط.

## المميزات
- ✅ **مكونات فرعية:** Header, Title, Description, Content, Footer, Action
- ✅ **تخطيط مرن:** دعم Grid و Container queries
- ✅ **دعم الثيمات:** Light, Dark, High Contrast
- ✅ **استخدام Design Tokens:** bg-card, text-card-foreground, border

## Design Tokens المستخدمة
- \`bg-card\` - خلفية البطاقة
- \`text-card-foreground\` - لون النص
- \`border\` - لون الحدود
- \`text-muted-foreground\` - نص ثانوي
- \`rounded-xl\` - حواف مدورة
- \`gap-6\` - مسافات داخلية

## المكونات الفرعية
- **Card:** الحاوية الرئيسية
- **CardHeader:** رأس البطاقة
- **CardTitle:** عنوان البطاقة
- **CardDescription:** وصف البطاقة
- **CardAction:** إجراءات البطاقة (في الرأس)
- **CardContent:** محتوى البطاقة
- **CardFooter:** تذييل البطاقة
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

/**
 * بطاقة بسيطة
 */
export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>عنوان البطاقة</CardTitle>
        <CardDescription>وصف قصير للبطاقة</CardDescription>
      </CardHeader>
      <CardContent>
        <p>محتوى البطاقة يظهر هنا. يمكن أن يحتوي على أي عناصر HTML.</p>
      </CardContent>
    </Card>
  ),
};

/**
 * بطاقة مع تذييل
 */
export const WithFooter: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>إنشاء مشروع جديد</CardTitle>
        <CardDescription>أضف معلومات المشروع الأساسية</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          قم بملء النموذج أدناه لإنشاء مشروع جديد في النظام.
        </p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline" className="flex-1">إلغاء</Button>
        <Button className="flex-1">إنشاء</Button>
      </CardFooter>
    </Card>
  ),
};

/**
 * بطاقة مع إجراء
 */
export const WithAction: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>الإشعارات</CardTitle>
        <CardDescription>لديك 3 إشعارات جديدة</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm">تم إضافة عميل جديد</p>
          <p className="text-sm">تحديث على المناقصة #123</p>
          <p className="text-sm">مشروع جاهز للمراجعة</p>
        </div>
      </CardContent>
    </Card>
  ),
};

/**
 * بطاقة إحصائيات
 */
export const StatCard: Story = {
  render: () => (
    <Card className="w-[300px]">
      <CardHeader>
        <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
        <CardAction>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">52,430 ر.س</div>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
          <TrendingUp className="h-3 w-3 text-green-500" />
          <span className="text-green-500">+12.5%</span>
          من الشهر السابق
        </p>
      </CardContent>
    </Card>
  ),
};

/**
 * بطاقة مع حدود
 */
export const WithBorder: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader className="border-b">
        <CardTitle>معلومات العميل</CardTitle>
        <CardDescription>تفاصيل الاتصال</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">الاسم:</span>
            <span className="text-sm font-medium">أحمد محمد</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">البريد:</span>
            <span className="text-sm font-medium">ahmad@example.com</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">الهاتف:</span>
            <span className="text-sm font-medium">+966 XX XXX XXXX</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t">
        <Button variant="link" className="w-full">
          عرض الملف الكامل
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  ),
};

/**
 * جميع الأشكال
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-spacing-6">
      <div>
        <h3 className="text-lg font-semibold mb-spacing-4">بطاقات بسيطة</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-4">
          <Card className="w-[300px]">
            <CardHeader>
              <CardTitle>بطاقة أساسية</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">محتوى بسيط</p>
            </CardContent>
          </Card>

          <Card className="w-[300px]">
            <CardHeader>
              <CardTitle>مع وصف</CardTitle>
              <CardDescription>وصف توضيحي</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">محتوى البطاقة</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-spacing-4">بطاقات إحصائيات</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-spacing-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">العملاء</CardTitle>
              <CardAction>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground mt-1">
                +180 هذا الشهر
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">المشاريع</CardTitle>
              <CardAction>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
              <p className="text-xs text-muted-foreground mt-1">
                12 قيد التنفيذ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">الإيرادات</CardTitle>
              <CardAction>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">52,430</div>
              <p className="text-xs text-green-500 mt-1">
                +12.5% ↑
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-spacing-4">بطاقات تفاعلية</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-4">
          <Card className="w-[350px] hover:shadow-lg transition-shadow">
            <CardHeader className="border-b">
              <CardTitle>مناقصة جديدة</CardTitle>
              <CardDescription>مشروع بناء</CardDescription>
              <CardAction>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الحالة:</span>
                  <span className="font-medium">قيد المراجعة</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">القيمة:</span>
                  <span className="font-medium">1,200,000 ر.س</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                رفض
              </Button>
              <Button size="sm" className="flex-1">
                موافقة
              </Button>
            </CardFooter>
          </Card>

          <Card className="w-[350px] hover:shadow-lg transition-shadow">
            <CardHeader className="border-b">
              <CardTitle>تنبيه مهم</CardTitle>
              <CardDescription>يتطلب انتباهك</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                هناك 5 فواتير تحتاج إلى مراجعة قبل نهاية الأسبوع.
              </p>
            </CardContent>
            <CardFooter className="border-t">
              <Button variant="link" className="w-full">
                عرض الفواتير
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
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
      <div data-theme="light" className="p-spacing-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-spacing-4">Light Theme</h3>
        <div className="grid grid-cols-2 gap-spacing-4">
          <Card>
            <CardHeader>
              <CardTitle>بطاقة فاتحة</CardTitle>
              <CardDescription>وصف البطاقة</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">محتوى البطاقة</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="border-b">
              <CardTitle>مع حدود</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">محتوى</p>
            </CardContent>
            <CardFooter className="border-t">
              <Button size="sm">إجراء</Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <div data-theme="dark" className="p-spacing-6 rounded-lg bg-gray-900">
        <h3 className="text-lg font-semibold mb-spacing-4 text-white">Dark Theme</h3>
        <div className="grid grid-cols-2 gap-spacing-4">
          <Card>
            <CardHeader>
              <CardTitle>بطاقة داكنة</CardTitle>
              <CardDescription>وصف البطاقة</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">محتوى البطاقة</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="border-b">
              <CardTitle>مع حدود</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">محتوى</p>
            </CardContent>
            <CardFooter className="border-t">
              <Button size="sm">إجراء</Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <div data-theme="high-contrast" className="p-spacing-6 rounded-lg bg-black">
        <h3 className="text-lg font-semibold mb-spacing-4 text-white">High Contrast Theme</h3>
        <div className="grid grid-cols-2 gap-spacing-4">
          <Card>
            <CardHeader>
              <CardTitle>تباين عالي</CardTitle>
              <CardDescription>وصف البطاقة</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">محتوى البطاقة</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="border-b">
              <CardTitle>مع حدود</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">محتوى</p>
            </CardContent>
            <CardFooter className="border-t">
              <Button size="sm">إجراء</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  ),
};

/**
 * أمثلة استخدام
 */
export const UsageExamples: Story = {
  render: () => (
    <div className="flex flex-col gap-spacing-8 max-w-4xl">
      <div>
        <h3 className="text-xl font-bold mb-spacing-4">لوحة تحكم (Dashboard)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-spacing-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">العملاء الجدد</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">+24</div>
              <p className="text-xs text-muted-foreground mt-2">
                هذا الأسبوع
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">المناقصات النشطة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">12</div>
              <p className="text-xs text-muted-foreground mt-2">
                تحتاج مراجعة
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">الإيرادات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">450K</div>
              <p className="text-xs text-green-500 mt-2">
                +15.3% ↑
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-spacing-4">قائمة المهام</h3>
        <Card className="w-full">
          <CardHeader className="border-b">
            <CardTitle>المهام المعلقة</CardTitle>
            <CardDescription>لديك 5 مهام لإنهائها</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[
                'مراجعة عرض المناقصة #123',
                'الاتصال بالعميل أحمد',
                'تحديث بيانات المشروع',
                'إرسال الفاتورة',
                'جدولة اجتماع الفريق'
              ].map((task, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4"
                    id={`task-${i}`}
                    aria-label={task}
                  />
                  <label htmlFor={`task-${i}`} className="text-sm">{task}</label>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t">
            <Button variant="link" className="w-full">
              عرض جميع المهام
            </Button>
          </CardFooter>
        </Card>
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
        <h3 className="text-xl font-bold mb-spacing-3">متى تستخدم Card؟</h3>
        
        <div className="space-y-spacing-4">
          <div className="border-l-4 border-primary pl-spacing-4">
            <h4 className="font-semibold">تجميع المحتوى المرتبط</h4>
            <p className="text-sm text-muted-foreground">
              استخدم Card لتجميع معلومات مرتبطة معاً (معلومات عميل، تفاصيل مناقصة، إحصائية)
            </p>
          </div>

          <div className="border-l-4 border-blue-500 pl-spacing-4">
            <h4 className="font-semibold">عرض البيانات الإحصائية</h4>
            <p className="text-sm text-muted-foreground">
              مثالي لبطاقات KPI والإحصائيات في لوحة التحكم
            </p>
          </div>

          <div className="border-l-4 border-green-500 pl-spacing-4">
            <h4 className="font-semibold">إنشاء قوائم</h4>
            <p className="text-sm text-muted-foreground">
              استخدم عدة بطاقات لإنشاء قوائم من العناصر (قائمة عملاء، مشاريع)
            </p>
          </div>
        </div>
      </div>

      <div className="border-t pt-spacing-6">
        <h3 className="text-xl font-bold mb-spacing-3">Best Practices</h3>
        <ul className="list-disc list-inside space-y-spacing-2 text-sm">
          <li>استخدم CardTitle و CardDescription دائماً لوضوح البطاقة</li>
          <li>أضف border-b و border-t للفصل البصري بين الأقسام</li>
          <li>استخدم CardAction للإجراءات السريعة (قائمة، إعدادات)</li>
          <li>اجعل البطاقات متساوية في الارتفاع عند استخدام Grid</li>
          <li>أضف hover effects للبطاقات القابلة للنقر</li>
          <li>استخدم spacing tokens للمسافات الداخلية</li>
        </ul>
      </div>
    </div>
  ),
};
