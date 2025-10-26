import type { Meta, StoryObj } from '@storybook/react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion'
import { Badge } from './badge'
import { Button } from './button'

const meta = {
  title: 'UI Components/Accordion',
  component: Accordion,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

// ============================================
// Basic Stories
// ============================================

export const Default: Story = {
  args: {
    type: 'single',
    collapsible: true,
  },
  render: (args) => (
    <Accordion {...args} className="w-[500px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>ما هو نظام إدارة المناقصات؟</AccordionTrigger>
        <AccordionContent>
          نظام إدارة المناقصات هو منصة شاملة لإدارة عمليات المناقصات والمشتريات الحكومية والخاصة، من
          مرحلة الإعلان حتى الترسية والتنفيذ.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>كيف يمكنني إنشاء مناقصة جديدة؟</AccordionTrigger>
        <AccordionContent>
          يمكنك إنشاء مناقصة جديدة من خلال الضغط على زر &quot;إضافة مناقصة&quot; في لوحة التحكم، ثم
          ملء البيانات المطلوبة مثل العنوان والميزانية وجدول الكميات.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>ما هي المستندات المطلوبة؟</AccordionTrigger>
        <AccordionContent>
          المستندات المطلوبة تشمل: المواصفات الفنية، الشروط والأحكام، جدول الكميات، ورخصة العمل أو
          السجل التجاري للشركات المتقدمة.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

export const Single: Story = {
  args: {
    type: 'single',
    collapsible: true,
  },
  render: (args) => (
    <Accordion {...args} className="w-[500px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>العنوان الأول</AccordionTrigger>
        <AccordionContent>محتوى القسم الأول. يمكن فتح قسم واحد فقط في كل مرة.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>العنوان الثاني</AccordionTrigger>
        <AccordionContent>
          محتوى القسم الثاني. عند فتح هذا القسم، سيُغلق القسم الأول تلقائياً.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

export const Multiple: Story = {
  args: {
    type: 'multiple',
  },
  render: (args) => (
    <Accordion {...args} className="w-[500px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>القسم الأول</AccordionTrigger>
        <AccordionContent>محتوى القسم الأول. يمكن فتح عدة أقسام في نفس الوقت.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>القسم الثاني</AccordionTrigger>
        <AccordionContent>محتوى القسم الثاني. جميع الأقسام مستقلة عن بعضها.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>القسم الثالث</AccordionTrigger>
        <AccordionContent>محتوى القسم الثالث. افتح أي عدد من الأقسام.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

export const DefaultOpen: Story = {
  args: {
    type: 'single',
    collapsible: true,
    defaultValue: 'item-1',
  },
  render: (args) => (
    <Accordion {...args} className="w-[500px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>قسم مفتوح افتراضياً</AccordionTrigger>
        <AccordionContent>
          هذا القسم مفتوح عند تحميل الصفحة باستخدام defaultValue=&quot;item-1&quot;
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>قسم مغلق افتراضياً</AccordionTrigger>
        <AccordionContent>هذا القسم مغلق ويمكن فتحه بالنقر على العنوان.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

export const WithBadges: Story = {
  args: {
    type: 'single',
    collapsible: true,
  },
  render: (args) => (
    <Accordion {...args} className="w-[600px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <span>المناقصات النشطة</span>
            <Badge>15</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          عرض جميع المناقصات النشطة حالياً والتي يمكن التقديم عليها.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <span>المناقصات المنتهية</span>
            <Badge variant="secondary">8</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>المناقصات التي انتهى موعد التقديم عليها أو تم ترسيتها.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <span>المناقصات المؤجلة</span>
            <Badge variant="outline">3</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>المناقصات التي تم تأجيل موعدها أو تعليقها مؤقتاً.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

// ============================================
// Application Examples
// ============================================

export const FAQ: Story = {
  args: {
    type: 'single',
    collapsible: true,
  },
  render: () => (
    <div className="w-[700px] space-y-4">
      <div>
        <h2 className="text-2xl font-bold">الأسئلة الشائعة</h2>
        <p className="text-sm text-muted-foreground">
          إجابات على أكثر الأسئلة شيوعاً حول نظام إدارة المناقصات
        </p>
      </div>
      <Accordion type="single" collapsible>
        <AccordionItem value="faq-1">
          <AccordionTrigger>كيف يمكنني التسجيل في النظام؟</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <p>للتسجيل في النظام، اتبع الخطوات التالية:</p>
              <ol className="list-decimal list-inside space-y-1 mr-4">
                <li>انقر على زر &quot;التسجيل&quot; في الصفحة الرئيسية</li>
                <li>أدخل بياناتك الشخصية والتجارية</li>
                <li>قم بتحميل المستندات المطلوبة (السجل التجاري، الرخصة)</li>
                <li>انتظر موافقة الإدارة (عادةً خلال 24 ساعة)</li>
                <li>ستصلك رسالة تأكيد عبر البريد الإلكتروني</li>
              </ol>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="faq-2">
          <AccordionTrigger>ما هي رسوم التقديم على المناقصات؟</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <p>الرسوم تختلف حسب قيمة المناقصة:</p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>مناقصات أقل من 100,000 ر.س: 500 ر.س</li>
                <li>مناقصات من 100,000 إلى 500,000 ر.س: 1,000 ر.س</li>
                <li>مناقصات من 500,000 إلى 1,000,000 ر.س: 2,500 ر.س</li>
                <li>مناقصات أكثر من 1,000,000 ر.س: 5,000 ر.س</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">* الرسوم غير قابلة للاسترداد</p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="faq-3">
          <AccordionTrigger>كيف أعرف إذا تم قبول عرضي؟</AccordionTrigger>
          <AccordionContent>
            <p>
              سيتم إشعارك عبر البريد الإلكتروني والرسائل النصية فور البت في العرض. كما يمكنك متابعة
              حالة عروضك من خلال لوحة التحكم في قسم &quot;عروضي&quot;.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="faq-4">
          <AccordionTrigger>هل يمكنني تعديل العرض بعد التقديم؟</AccordionTrigger>
          <AccordionContent>
            <p>
              لا يمكن تعديل العرض بعد التقديم إلا في حالات استثنائية وقبل موعد إغلاق المناقصة بـ 48
              ساعة على الأقل. يجب التواصل مع الدعم الفني لطلب التعديل.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="faq-5">
          <AccordionTrigger>ما هي مدة صلاحية العروض؟</AccordionTrigger>
          <AccordionContent>
            <p>
              صلاحية العروض عادة 90 يوماً من تاريخ إغلاق المناقصة، ما لم ينص على خلاف ذلك في شروط
              المناقصة. يمكن للجهة المعنية طلب تمديد صلاحية العرض إذا لزم الأمر.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
}

export const TenderDetails: Story = {
  args: {
    type: 'multiple',
    defaultValue: ['overview'],
  },
  render: () => (
    <div className="w-[700px] space-y-4">
      <div>
        <h2 className="text-xl font-bold">مناقصة البنية التحتية الرقمية</h2>
        <p className="text-sm text-muted-foreground">رقم المناقصة: T-2025-001</p>
      </div>
      <Accordion type="multiple" defaultValue={['overview']} className="w-full">
        <AccordionItem value="overview">
          <AccordionTrigger>نظرة عامة</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">الميزانية</p>
                  <p className="font-semibold">2,500,000 ر.س</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">المدة</p>
                  <p className="font-semibold">12 شهر</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">تاريخ الإغلاق</p>
                  <p className="font-semibold">2025/10/15</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الحالة</p>
                  <Badge>نشط</Badge>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="description">
          <AccordionTrigger>الوصف التفصيلي</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 text-sm">
              <p>
                يهدف المشروع إلى تطوير وتحديث البنية التحتية التقنية للجهة، ويشمل توريد وتركيب
                وتشغيل الأنظمة التالية:
              </p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>خوادم عالية الأداء (Servers)</li>
                <li>أنظمة التخزين (Storage Systems)</li>
                <li>معدات الشبكات (Networking Equipment)</li>
                <li>أنظمة الحماية والأمان السيبراني</li>
                <li>البرمجيات والتراخيص اللازمة</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="requirements">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <span>المتطلبات والشروط</span>
              <Badge variant="destructive">مهم</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 text-sm">
              <p className="font-semibold">شروط المتقدم:</p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>سجل تجاري ساري المفعول</li>
                <li>رخصة عمل في المجال التقني</li>
                <li>خبرة لا تقل عن 5 سنوات في مشاريع مماثلة</li>
                <li>شهادات معتمدة من الشركات المصنعة</li>
                <li>القدرة المالية والفنية على التنفيذ</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="documents">
          <AccordionTrigger>المستندات المطلوبة</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">📄 المواصفات الفنية.pdf</span>
                <Button variant="outline" size="sm">
                  تحميل
                </Button>
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">📄 الشروط والأحكام.pdf</span>
                <Button variant="outline" size="sm">
                  تحميل
                </Button>
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">📊 جدول الكميات.xlsx</span>
                <Button variant="outline" size="sm">
                  تحميل
                </Button>
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">📋 نموذج العرض.docx</span>
                <Button variant="outline" size="sm">
                  تحميل
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="timeline">
          <AccordionTrigger>الجدول الزمني</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="secondary">المرحلة 1</Badge>
                <div>
                  <p className="font-semibold text-sm">التخطيط والتصميم</p>
                  <p className="text-sm text-muted-foreground">2 شهر</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="secondary">المرحلة 2</Badge>
                <div>
                  <p className="font-semibold text-sm">التوريد والتركيب</p>
                  <p className="text-sm text-muted-foreground">6 أشهر</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="secondary">المرحلة 3</Badge>
                <div>
                  <p className="font-semibold text-sm">الاختبار والتشغيل</p>
                  <p className="text-sm text-muted-foreground">2 شهر</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="secondary">المرحلة 4</Badge>
                <div>
                  <p className="font-semibold text-sm">التدريب والتسليم</p>
                  <p className="text-sm text-muted-foreground">2 شهر</p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
}

export const UserGuide: Story = {
  args: {
    type: 'single',
    collapsible: true,
  },
  render: () => (
    <div className="w-[700px] space-y-4">
      <div>
        <h2 className="text-xl font-bold">دليل المستخدم</h2>
        <p className="text-sm text-muted-foreground">تعلم كيفية استخدام نظام إدارة المناقصات</p>
      </div>
      <Accordion type="single" collapsible>
        <AccordionItem value="getting-started">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <span>البدء السريع</span>
              <Badge variant="outline">للمبتدئين</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <p className="text-sm">اتبع هذه الخطوات للبدء:</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Badge className="mt-0.5">1</Badge>
                  <div>
                    <p className="font-semibold text-sm">إنشاء حساب</p>
                    <p className="text-sm text-muted-foreground">سجل في النظام وأكمل بياناتك</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Badge className="mt-0.5">2</Badge>
                  <div>
                    <p className="font-semibold text-sm">تصفح المناقصات</p>
                    <p className="text-sm text-muted-foreground">ابحث عن المناقصات المناسبة</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Badge className="mt-0.5">3</Badge>
                  <div>
                    <p className="font-semibold text-sm">قدّم عرضك</p>
                    <p className="text-sm text-muted-foreground">املأ النموذج وأرفق المستندات</p>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="search">
          <AccordionTrigger>البحث والفلترة</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm">
              يمكنك البحث عن المناقصات باستخدام الفلاتر التالية: النوع، الميزانية، تاريخ الإغلاق،
              والحالة. استخدم البحث المتقدم للعثور على المناقصات المناسبة لشركتك.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="submit-bid">
          <AccordionTrigger>تقديم العروض</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 text-sm">
              <p>لتقديم عرض على مناقصة:</p>
              <ol className="list-decimal list-inside space-y-1 mr-4">
                <li>افتح صفحة المناقصة</li>
                <li>انقر على &quot;تقديم عرض&quot;</li>
                <li>املأ نموذج العرض بالتفصيل</li>
                <li>أرفق المستندات المطلوبة</li>
                <li>راجع العرض قبل الإرسال</li>
                <li>انقر على &quot;إرسال العرض&quot;</li>
              </ol>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="track">
          <AccordionTrigger>تتبع العروض</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm">
              من لوحة التحكم، يمكنك متابعة حالة جميع عروضك. ستظهر لك الحالة الحالية (قيد المراجعة،
              مقبول، مرفوض، يتطلب توضيح) مع إمكانية عرض التفاصيل والملاحظات.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="support">
          <AccordionTrigger>الدعم الفني</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 text-sm">
              <p>للحصول على المساعدة:</p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>البريد الإلكتروني: support@tenders.sa</li>
                <li>الهاتف: 920012345</li>
                <li>ساعات العمل: من الأحد إلى الخميس، 8 صباحاً - 5 مساءً</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
}

export const SettingsPanel: Story = {
  args: {
    type: 'multiple',
  },
  render: () => (
    <div className="w-[600px] space-y-4">
      <h3 className="text-lg font-semibold">الإعدادات المتقدمة</h3>
      <Accordion type="multiple" className="w-full">
        <AccordionItem value="notifications">
          <AccordionTrigger>إعدادات الإشعارات</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">إشعارات البريد الإلكتروني</span>
                <Badge variant="secondary">مفعل</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">إشعارات الرسائل النصية</span>
                <Badge variant="outline">معطل</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">الإشعارات الفورية</span>
                <Badge variant="secondary">مفعل</Badge>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="privacy">
          <AccordionTrigger>الخصوصية والأمان</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full">
                تغيير كلمة المرور
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                تفعيل المصادقة الثنائية
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                إدارة الجلسات النشطة
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="preferences">
          <AccordionTrigger>التفضيلات</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">اللغة</p>
                <div className="flex gap-2">
                  <Badge>العربية</Badge>
                  <Badge variant="outline">English</Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">المظهر</p>
                <div className="flex gap-2">
                  <Badge variant="outline">فاتح</Badge>
                  <Badge>داكن</Badge>
                  <Badge variant="outline">تلقائي</Badge>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="account">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <span>إدارة الحساب</span>
              <Badge variant="destructive">حساس</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full">
                تصدير البيانات
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                إلغاء تنشيط الحساب
              </Button>
              <Button variant="destructive" size="sm" className="w-full">
                حذف الحساب نهائياً
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
}

// ============================================
// Theme Testing
// ============================================

export const ThemeTesting: Story = {
  args: {
    type: 'single',
    collapsible: true,
  },
  render: () => (
    <div className="space-y-8 w-[600px]">
      <div className="space-y-4">
        <h3 className="font-semibold">Light Theme</h3>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>القسم الأول</AccordionTrigger>
            <AccordionContent>محتوى القسم الأول في الوضع الفاتح</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>القسم الثاني</AccordionTrigger>
            <AccordionContent>محتوى القسم الثاني في الوضع الفاتح</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="space-y-4 dark">
        <h3 className="font-semibold">Dark Theme</h3>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>القسم الأول</AccordionTrigger>
            <AccordionContent>محتوى القسم الأول في الوضع الداكن</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>القسم الثاني</AccordionTrigger>
            <AccordionContent>محتوى القسم الثاني في الوضع الداكن</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  ),
}

// ============================================
// Usage Guide
// ============================================

export const UsageGuide: Story = {
  args: {
    type: 'single',
    collapsible: true,
  },
  render: () => (
    <div className="max-w-4xl space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Accordion Component</h2>
        <p className="text-muted-foreground">مكون Accordion لعرض المحتوى القابل للطي والتوسيع</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">متى تستخدم Accordion؟</h3>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>الأسئلة الشائعة (FAQ)</li>
          <li>تفاصيل المناقصات والمشاريع</li>
          <li>دليل المستخدم والإرشادات</li>
          <li>إعدادات متقدمة منظمة في أقسام</li>
          <li>عرض معلومات طويلة بشكل منظم</li>
          <li>توفير مساحة الشاشة مع الحفاظ على إمكانية الوصول</li>
          <li>تجميع محتوى مترابط في أقسام</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">الأنواع</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 rounded bg-info/10 dark:bg-info/20">
            <h4 className="font-semibold mb-2">Single</h4>
            <p className="text-muted-foreground">قسم واحد مفتوح في كل مرة</p>
            <code className="block mt-2 text-xs">{`type="single" collapsible`}</code>
          </div>
          <div className="p-3 rounded bg-success/10 dark:bg-success/20">
            <h4 className="font-semibold mb-2">Multiple</h4>
            <p className="text-muted-foreground">فتح عدة أقسام في نفس الوقت</p>
            <code className="block mt-2 text-xs">{`type="multiple"`}</code>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">المكونات الفرعية</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 rounded bg-warning/10 dark:bg-warning/20">
            <h4 className="font-semibold mb-2">Accordion</h4>
            <p className="text-muted-foreground">الحاوية الرئيسية - تدير الحالة</p>
          </div>
          <div className="p-3 rounded bg-primary/10 dark:bg-primary/20">
            <h4 className="font-semibold mb-2">AccordionItem</h4>
            <p className="text-muted-foreground">كل قسم في Accordion</p>
          </div>
          <div className="p-3 rounded bg-accent/10 dark:bg-accent/20">
            <h4 className="font-semibold mb-2">AccordionTrigger</h4>
            <p className="text-muted-foreground">العنوان القابل للنقر</p>
          </div>
          <div className="p-3 rounded bg-info/10 dark:bg-info/20">
            <h4 className="font-semibold mb-2">AccordionContent</h4>
            <p className="text-muted-foreground">المحتوى القابل للطي</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Design Tokens</h3>
        <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
          <div>border-b - حدود بين الأقسام</div>
          <div>hover:underline - تسطير عند التمرير</div>
          <div>text-muted-foreground - أيقونة ChevronDown</div>
          <div>rotate-180 - دوران الأيقونة عند الفتح</div>
          <div>animate-accordion-up/down - حركة الفتح/الإغلاق</div>
          <div>focus-visible:ring-ring - حلقة التركيز</div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">الخصائص الرئيسية</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <code className="bg-muted px-2 py-1 rounded">type</code>
            <span>- &quot;single&quot; أو &quot;multiple&quot;</span>
          </div>
          <div className="flex items-start gap-2">
            <code className="bg-muted px-2 py-1 rounded">collapsible</code>
            <span>- السماح بإغلاق القسم المفتوح (لـ single)</span>
          </div>
          <div className="flex items-start gap-2">
            <code className="bg-muted px-2 py-1 rounded">defaultValue</code>
            <span>- القسم المفتوح افتراضياً</span>
          </div>
          <div className="flex items-start gap-2">
            <code className="bg-muted px-2 py-1 rounded">value</code>
            <span>- القسم المفتوح (للتحكم)</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Best Practices</h3>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>استخدم عناوين واضحة ومختصرة</li>
          <li>ضع المحتوى الأهم في الأعلى</li>
          <li>استخدم type=&quot;single&quot; للأسئلة الشائعة</li>
          <li>استخدم type=&quot;multiple&quot; للإعدادات</li>
          <li>أضف Badge للمعلومات المهمة أو الأعداد</li>
          <li>تجنب المحتوى الطويل جداً في القسم</li>
          <li>استخدم defaultValue لفتح قسم مهم افتراضياً</li>
          <li>حافظ على عدد الأقسام معقول (5-10 مثالي)</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">أمثلة الاستخدام</h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-sm font-medium">Accordion بسيط:</p>
            <code className="block bg-muted p-3 rounded text-xs">
              {`<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>العنوان</AccordionTrigger>
    <AccordionContent>المحتوى</AccordionContent>
  </AccordionItem>
</Accordion>`}
            </code>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">مع Badge:</p>
            <code className="block bg-muted p-3 rounded text-xs">
              {`<AccordionTrigger>
  <div className="flex items-center gap-2">
    <span>العنوان</span>
    <Badge>15</Badge>
  </div>
</AccordionTrigger>`}
            </code>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">مفتوح افتراضياً:</p>
            <code className="block bg-muted p-3 rounded text-xs">
              {`<Accordion 
  type="single" 
  defaultValue="item-1"
  collapsible
>`}
            </code>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Accessibility</h3>
        <div className="p-4 text-sm space-y-2 rounded-lg bg-info/10 dark:bg-info/20">
          <p>✅ Keyboard navigation (Space, Enter لفتح/إغلاق)</p>
          <p>✅ Arrow keys للتنقل بين الأقسام</p>
          <p>✅ ARIA attributes تلقائية</p>
          <p>✅ Screen readers تعلن عن الحالة (expanded/collapsed)</p>
          <p>✅ Focus indicator واضح</p>
          <p>✅ ChevronDown تشير للحالة بصرياً</p>
        </div>
      </div>

      <div className="pt-4">
        <h4 className="font-semibold mb-2">مثال تفاعلي:</h4>
        <Accordion type="single" collapsible>
          <AccordionItem value="demo-1">
            <AccordionTrigger>السؤال الأول</AccordionTrigger>
            <AccordionContent>الإجابة على السؤال الأول. انقر على العنوان للإغلاق.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="demo-2">
            <AccordionTrigger>السؤال الثاني</AccordionTrigger>
            <AccordionContent>الإجابة على السؤال الثاني. جرب فتح هذا القسم.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  ),
}
