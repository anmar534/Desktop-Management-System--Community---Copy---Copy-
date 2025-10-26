import type { Meta, StoryObj } from '@storybook/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Input } from './input'
import { Label } from './label'
import { Button } from './button'
import { Badge } from './badge'

const meta = {
  title: 'UI Components/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

// ============================================
// Basic Stories
// ============================================

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="tab1">التبويب الأول</TabsTrigger>
        <TabsTrigger value="tab2">التبويب الثاني</TabsTrigger>
        <TabsTrigger value="tab3">التبويب الثالث</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1" className="p-4">
        <p>محتوى التبويب الأول</p>
      </TabsContent>
      <TabsContent value="tab2" className="p-4">
        <p>محتوى التبويب الثاني</p>
      </TabsContent>
      <TabsContent value="tab3" className="p-4">
        <p>محتوى التبويب الثالث</p>
      </TabsContent>
    </Tabs>
  ),
}

export const TwoTabs: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[500px]">
      <TabsList>
        <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
        <TabsTrigger value="details">التفاصيل</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="p-4 border rounded-lg mt-2">
        <h3 className="font-semibold mb-2">نظرة عامة على المشروع</h3>
        <p className="text-sm text-muted-foreground">معلومات أساسية وملخص سريع عن المشروع الحالي</p>
      </TabsContent>
      <TabsContent value="details" className="p-4 border rounded-lg mt-2">
        <h3 className="font-semibold mb-2">التفاصيل الكاملة</h3>
        <p className="text-sm text-muted-foreground">
          جميع التفاصيل الفنية والمواصفات الخاصة بالمشروع
        </p>
      </TabsContent>
    </Tabs>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="home" className="w-[500px]">
      <TabsList>
        <TabsTrigger value="home" className="gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          الرئيسية
        </TabsTrigger>
        <TabsTrigger value="projects" className="gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          المشاريع
        </TabsTrigger>
        <TabsTrigger value="settings" className="gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          الإعدادات
        </TabsTrigger>
      </TabsList>
      <TabsContent value="home" className="p-4 border rounded-lg mt-2">
        محتوى الصفحة الرئيسية
      </TabsContent>
      <TabsContent value="projects" className="p-4 border rounded-lg mt-2">
        قائمة المشاريع
      </TabsContent>
      <TabsContent value="settings" className="p-4 border rounded-lg mt-2">
        إعدادات التطبيق
      </TabsContent>
    </Tabs>
  ),
}

export const WithBadges: Story = {
  render: () => (
    <Tabs defaultValue="all" className="w-[600px]">
      <TabsList>
        <TabsTrigger value="all" className="gap-2">
          الكل
          <Badge variant="secondary" className="ml-1">
            15
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="active" className="gap-2">
          نشط
          <Badge variant="default" className="ml-1">
            8
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="pending" className="gap-2">
          قيد الانتظار
          <Badge variant="outline" className="ml-1">
            5
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="completed" className="gap-2">
          مكتمل
          <Badge variant="secondary" className="ml-1">
            2
          </Badge>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="all" className="p-4 border rounded-lg mt-2">
        جميع المناقصات (15)
      </TabsContent>
      <TabsContent value="active" className="p-4 border rounded-lg mt-2">
        المناقصات النشطة (8)
      </TabsContent>
      <TabsContent value="pending" className="p-4 border rounded-lg mt-2">
        المناقصات قيد الانتظار (5)
      </TabsContent>
      <TabsContent value="completed" className="p-4 border rounded-lg mt-2">
        المناقصات المكتملة (2)
      </TabsContent>
    </Tabs>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Tabs defaultValue="enabled" className="w-[500px]">
      <TabsList>
        <TabsTrigger value="enabled">متاح</TabsTrigger>
        <TabsTrigger value="disabled" disabled>
          معطل
        </TabsTrigger>
        <TabsTrigger value="locked" disabled>
          مقفل 🔒
        </TabsTrigger>
      </TabsList>
      <TabsContent value="enabled" className="p-4 border rounded-lg mt-2">
        هذا التبويب متاح ويمكن الوصول إليه
      </TabsContent>
      <TabsContent value="disabled" className="p-4 border rounded-lg mt-2">
        هذا التبويب معطل
      </TabsContent>
      <TabsContent value="locked" className="p-4 border rounded-lg mt-2">
        هذا التبويب مقفل
      </TabsContent>
    </Tabs>
  ),
}

// ============================================
// Application Examples
// ============================================

export const TenderManagement: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[800px]">
      <TabsList>
        <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
        <TabsTrigger value="boq">جدول الكميات</TabsTrigger>
        <TabsTrigger value="timeline">الجدول الزمني</TabsTrigger>
        <TabsTrigger value="documents">المستندات</TabsTrigger>
        <TabsTrigger value="bidders">المتقدمين</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-2">
        <Card>
          <CardHeader>
            <CardTitle>مناقصة البنية التحتية الرقمية</CardTitle>
            <CardDescription>مشروع تطوير وتحديث البنية التحتية التقنية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الميزانية</Label>
                <p className="text-2xl font-bold">2,500,000 ر.س</p>
              </div>
              <div>
                <Label>المدة</Label>
                <p className="text-2xl font-bold">12 شهر</p>
              </div>
            </div>
            <div>
              <Label>الحالة</Label>
              <div className="mt-1">
                <Badge>نشط</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="boq" className="mt-2">
        <Card>
          <CardHeader>
            <CardTitle>جدول الكميات</CardTitle>
            <CardDescription>البنود والكميات المطلوبة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 bg-muted rounded">
                <span>خوادم (Servers)</span>
                <span className="font-semibold">10 وحدات</span>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded">
                <span>أجهزة شبكة (Networking)</span>
                <span className="font-semibold">25 وحدة</span>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded">
                <span>تراخيص برمجيات</span>
                <span className="font-semibold">100 ترخيص</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="timeline" className="mt-2">
        <Card>
          <CardHeader>
            <CardTitle>الجدول الزمني</CardTitle>
            <CardDescription>المراحل الرئيسية للمشروع</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">المرحلة 1</Badge>
                <span>التخطيط والتصميم - 2 شهر</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">المرحلة 2</Badge>
                <span>التنفيذ - 8 أشهر</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">المرحلة 3</Badge>
                <span>الاختبار والتسليم - 2 شهر</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="documents" className="mt-2">
        <Card>
          <CardHeader>
            <CardTitle>المستندات</CardTitle>
            <CardDescription>الملفات والوثائق المرفقة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2 border rounded">
                <span>📄 المواصفات الفنية.pdf</span>
                <Button variant="outline" size="sm">
                  تحميل
                </Button>
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <span>📄 الشروط والأحكام.pdf</span>
                <Button variant="outline" size="sm">
                  تحميل
                </Button>
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <span>📊 جدول الكميات.xlsx</span>
                <Button variant="outline" size="sm">
                  تحميل
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="bidders" className="mt-2">
        <Card>
          <CardHeader>
            <CardTitle>المتقدمين</CardTitle>
            <CardDescription>الشركات المتقدمة للمناقصة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-semibold">شركة التقنية المتقدمة</p>
                  <p className="text-sm text-muted-foreground">العرض: 2,300,000 ر.س</p>
                </div>
                <Badge>قيد المراجعة</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-semibold">مجموعة الحلول الرقمية</p>
                  <p className="text-sm text-muted-foreground">العرض: 2,450,000 ر.س</p>
                </div>
                <Badge variant="secondary">مقبول</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
}

export const UserProfile: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[700px]">
      <TabsList>
        <TabsTrigger value="account">الحساب</TabsTrigger>
        <TabsTrigger value="security">الأمان</TabsTrigger>
        <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
        <TabsTrigger value="preferences">التفضيلات</TabsTrigger>
      </TabsList>

      <TabsContent value="account" className="mt-2">
        <Card>
          <CardHeader>
            <CardTitle>معلومات الحساب</CardTitle>
            <CardDescription>إدارة معلوماتك الشخصية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم الكامل</Label>
              <Input id="name" defaultValue="محمد أحمد" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" defaultValue="mohammed@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input id="phone" defaultValue="+966 50 123 4567" />
            </div>
            <Button>حفظ التغييرات</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security" className="mt-2">
        <Card>
          <CardHeader>
            <CardTitle>الأمان</CardTitle>
            <CardDescription>إعدادات الأمان وكلمة المرور</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current">كلمة المرور الحالية</Label>
              <Input id="current" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">كلمة المرور الجديدة</Label>
              <Input id="new" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">تأكيد كلمة المرور</Label>
              <Input id="confirm" type="password" />
            </div>
            <div className="flex items-center gap-2">
              <Button>تحديث كلمة المرور</Button>
              <Button variant="outline">تفعيل المصادقة الثنائية</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications" className="mt-2">
        <Card>
          <CardHeader>
            <CardTitle>الإشعارات</CardTitle>
            <CardDescription>إدارة تفضيلات الإشعارات</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium">إشعارات البريد الإلكتروني</p>
                <p className="text-sm text-muted-foreground">تلقي التحديثات عبر البريد</p>
              </div>
              <Badge variant="secondary">مفعل</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium">إشعارات الرسائل النصية</p>
                <p className="text-sm text-muted-foreground">تلقي رسائل SMS</p>
              </div>
              <Badge variant="outline">معطل</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium">الإشعارات الفورية</p>
                <p className="text-sm text-muted-foreground">إشعارات داخل التطبيق</p>
              </div>
              <Badge variant="secondary">مفعل</Badge>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="preferences" className="mt-2">
        <Card>
          <CardHeader>
            <CardTitle>التفضيلات</CardTitle>
            <CardDescription>تخصيص تجربة الاستخدام</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>اللغة</Label>
              <div className="flex gap-2">
                <Badge>العربية</Badge>
                <Badge variant="outline">English</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label>المظهر</Label>
              <div className="flex gap-2">
                <Badge variant="outline">فاتح</Badge>
                <Badge>داكن</Badge>
                <Badge variant="outline">تلقائي</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label>حجم الخط</Label>
              <div className="flex gap-2">
                <Badge variant="outline">صغير</Badge>
                <Badge>متوسط</Badge>
                <Badge variant="outline">كبير</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
}

export const DashboardFilters: Story = {
  render: () => (
    <Tabs defaultValue="today" className="w-[700px]">
      <TabsList>
        <TabsTrigger value="today">اليوم</TabsTrigger>
        <TabsTrigger value="week">هذا الأسبوع</TabsTrigger>
        <TabsTrigger value="month">هذا الشهر</TabsTrigger>
        <TabsTrigger value="year">هذا العام</TabsTrigger>
        <TabsTrigger value="custom">مخصص</TabsTrigger>
      </TabsList>

      <TabsContent value="today" className="mt-2">
        <Card>
          <CardHeader>
            <CardTitle>إحصائيات اليوم</CardTitle>
            <CardDescription>8 أكتوبر 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-info/10 dark:bg-info/20 rounded-lg">
                <p className="text-sm text-muted-foreground">المناقصات الجديدة</p>
                <p className="text-3xl font-bold">3</p>
              </div>
              <div className="p-4 bg-success/10 dark:bg-success/20 rounded-lg">
                <p className="text-sm text-muted-foreground">العروض المقدمة</p>
                <p className="text-3xl font-bold">5</p>
              </div>
              <div className="p-4 bg-warning/10 dark:bg-warning/20 rounded-lg">
                <p className="text-sm text-muted-foreground">قيد المراجعة</p>
                <p className="text-3xl font-bold">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="week" className="mt-2">
        <Card>
          <CardHeader>
            <CardTitle>إحصائيات الأسبوع</CardTitle>
            <CardDescription>من 2 إلى 8 أكتوبر 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-info/10 dark:bg-info/20 rounded-lg">
                <p className="text-sm text-muted-foreground">المناقصات الجديدة</p>
                <p className="text-3xl font-bold">12</p>
              </div>
              <div className="p-4 bg-success/10 dark:bg-success/20 rounded-lg">
                <p className="text-sm text-muted-foreground">العروض المقدمة</p>
                <p className="text-3xl font-bold">28</p>
              </div>
              <div className="p-4 bg-warning/10 dark:bg-warning/20 rounded-lg">
                <p className="text-sm text-muted-foreground">قيد المراجعة</p>
                <p className="text-3xl font-bold">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="month" className="mt-2">
        <Card>
          <CardHeader>
            <CardTitle>إحصائيات الشهر</CardTitle>
            <CardDescription>أكتوبر 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-info/10 dark:bg-info/20 rounded-lg">
                <p className="text-sm text-muted-foreground">المناقصات الجديدة</p>
                <p className="text-3xl font-bold">45</p>
              </div>
              <div className="p-4 bg-success/10 dark:bg-success/20 rounded-lg">
                <p className="text-sm text-muted-foreground">العروض المقدمة</p>
                <p className="text-3xl font-bold">103</p>
              </div>
              <div className="p-4 bg-warning/10 dark:bg-warning/20 rounded-lg">
                <p className="text-sm text-muted-foreground">قيد المراجعة</p>
                <p className="text-3xl font-bold">32</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="year" className="mt-2">
        <Card>
          <CardHeader>
            <CardTitle>إحصائيات العام</CardTitle>
            <CardDescription>2025</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-info/10 dark:bg-info/20 rounded-lg">
                <p className="text-sm text-muted-foreground">المناقصات الجديدة</p>
                <p className="text-3xl font-bold">428</p>
              </div>
              <div className="p-4 bg-success/10 dark:bg-success/20 rounded-lg">
                <p className="text-sm text-muted-foreground">العروض المقدمة</p>
                <p className="text-3xl font-bold">1,247</p>
              </div>
              <div className="p-4 bg-warning/10 dark:bg-warning/20 rounded-lg">
                <p className="text-sm text-muted-foreground">قيد المراجعة</p>
                <p className="text-3xl font-bold">189</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="custom" className="mt-2">
        <Card>
          <CardHeader>
            <CardTitle>فترة مخصصة</CardTitle>
            <CardDescription>اختر النطاق الزمني</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from">من</Label>
                <Input id="from" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to">إلى</Label>
                <Input id="to" type="date" />
              </div>
            </div>
            <Button>عرض الإحصائيات</Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
}

export const ProductCategories: Story = {
  render: () => (
    <Tabs defaultValue="all" className="w-[800px]">
      <TabsList>
        <TabsTrigger value="all">
          الكل
          <Badge variant="secondary" className="ml-1">
            42
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="hardware">
          أجهزة
          <Badge variant="secondary" className="ml-1">
            18
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="software">
          برمجيات
          <Badge variant="secondary" className="ml-1">
            15
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="services">
          خدمات
          <Badge variant="secondary" className="ml-1">
            9
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="mt-2">
        <Card>
          <CardHeader>
            <CardTitle>جميع المنتجات (42)</CardTitle>
            <CardDescription>عرض جميع الفئات</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {['خوادم', 'أجهزة شبكة', 'تراخيص', 'استشارات', 'صيانة', 'تطوير'].map((item) => (
                <div
                  key={item}
                  className="p-3 border rounded-lg text-center hover:bg-muted cursor-pointer"
                >
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="hardware" className="mt-2">
        <Card>
          <CardHeader>
            <CardTitle>الأجهزة (18)</CardTitle>
            <CardDescription>معدات وأجهزة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {['خوادم', 'أجهزة شبكة', 'طابعات', 'حواسيب', 'لابتوب', 'أجهزة تخزين'].map((item) => (
                <div
                  key={item}
                  className="p-3 border rounded-lg text-center hover:bg-muted cursor-pointer"
                >
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="software" className="mt-2">
        <Card>
          <CardHeader>
            <CardTitle>البرمجيات (15)</CardTitle>
            <CardDescription>تراخيص وبرامج</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {[
                'تراخيص Windows',
                'Office 365',
                'برامج محاسبة',
                'أنظمة ERP',
                'حماية',
                'قواعد بيانات',
              ].map((item) => (
                <div
                  key={item}
                  className="p-3 border rounded-lg text-center hover:bg-muted cursor-pointer"
                >
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="services" className="mt-2">
        <Card>
          <CardHeader>
            <CardTitle>الخدمات (9)</CardTitle>
            <CardDescription>خدمات فنية واستشارية</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {['استشارات', 'صيانة', 'تطوير', 'تدريب', 'دعم فني', 'تحليل بيانات'].map((item) => (
                <div
                  key={item}
                  className="p-3 border rounded-lg text-center hover:bg-muted cursor-pointer"
                >
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
}

// ============================================
// Theme Testing
// ============================================

export const ThemeTesting: Story = {
  render: () => (
    <div className="space-y-8 w-[700px]">
      <div className="space-y-4">
        <h3 className="font-semibold">Light Theme</h3>
        <Tabs defaultValue="tab1" className="w-full">
          <TabsList>
            <TabsTrigger value="tab1">التبويب الأول</TabsTrigger>
            <TabsTrigger value="tab2">التبويب الثاني</TabsTrigger>
            <TabsTrigger value="tab3" disabled>
              معطل
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="p-4 border rounded-lg mt-2">
            محتوى التبويب الأول في الوضع الفاتح
          </TabsContent>
          <TabsContent value="tab2" className="p-4 border rounded-lg mt-2">
            محتوى التبويب الثاني في الوضع الفاتح
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-4 dark">
        <h3 className="font-semibold">Dark Theme</h3>
        <Tabs defaultValue="tab1" className="w-full">
          <TabsList>
            <TabsTrigger value="tab1">التبويب الأول</TabsTrigger>
            <TabsTrigger value="tab2">التبويب الثاني</TabsTrigger>
            <TabsTrigger value="tab3" disabled>
              معطل
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="p-4 border rounded-lg mt-2 bg-background">
            محتوى التبويب الأول في الوضع الداكن
          </TabsContent>
          <TabsContent value="tab2" className="p-4 border rounded-lg mt-2 bg-background">
            محتوى التبويب الثاني في الوضع الداكن
          </TabsContent>
        </Tabs>
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
        <h2 className="text-2xl font-bold mb-2">Tabs Component</h2>
        <p className="text-muted-foreground">مكون Tabs لتنظيم المحتوى في تبويبات منفصلة</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">متى تستخدم Tabs؟</h3>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>تنظيم محتوى كبير في أقسام منفصلة</li>
          <li>عرض معلومات مترابطة في صفحة واحدة</li>
          <li>إعدادات متعددة (الحساب، الأمان، الإشعارات)</li>
          <li>تفاصيل مناقصة (نظرة عامة، BOQ، جدول زمني)</li>
          <li>فلترة البيانات حسب الفئات</li>
          <li>إحصائيات حسب الفترة الزمنية</li>
          <li>عرض بيانات متعددة دون تحميل صفحات جديدة</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">المكونات الفرعية</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-info/10 dark:bg-info/20 rounded">
            <h4 className="font-semibold mb-2">Tabs</h4>
            <p className="text-muted-foreground">الحاوية الرئيسية - تدير الحالة</p>
            <code className="block mt-2 text-xs">{'<Tabs defaultValue="tab1">'}</code>
          </div>
          <div className="p-3 bg-success/10 dark:bg-success/20 rounded">
            <h4 className="font-semibold mb-2">TabsList</h4>
            <p className="text-muted-foreground">قائمة التبويبات - الأزرار العلوية</p>
            <code className="block mt-2 text-xs">{'<TabsList>...</TabsList>'}</code>
          </div>
          <div className="p-3 bg-warning/10 dark:bg-warning/20 rounded">
            <h4 className="font-semibold mb-2">TabsTrigger</h4>
            <p className="text-muted-foreground">زر التبويب - للتنقل بين المحتوى</p>
            <code className="block mt-2 text-xs">{'<TabsTrigger value="tab1">'}</code>
          </div>
          <div className="p-3 bg-accent/10 dark:bg-accent/20 rounded">
            <h4 className="font-semibold mb-2">TabsContent</h4>
            <p className="text-muted-foreground">محتوى التبويب - يظهر عند الاختيار</p>
            <code className="block mt-2 text-xs">{'<TabsContent value="tab1">'}</code>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Design Tokens</h3>
        <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
          <div>bg-muted - خلفية TabsList</div>
          <div>data-[state=active]:bg-card - التبويب النشط</div>
          <div>text-muted-foreground - التبويب غير النشط</div>
          <div>text-foreground - التبويب النشط</div>
          <div>rounded-xl - حواف دائرية</div>
          <div>focus-visible:ring-ring - حلقة التركيز</div>
          <div>disabled:opacity-50 - التبويب المعطل</div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">الخصائص الرئيسية</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <code className="bg-muted px-2 py-1 rounded">defaultValue</code>
            <span>- التبويب النشط عند التحميل</span>
          </div>
          <div className="flex items-start gap-2">
            <code className="bg-muted px-2 py-1 rounded">value</code>
            <span>- التبويب النشط الحالي (للتحكم)</span>
          </div>
          <div className="flex items-start gap-2">
            <code className="bg-muted px-2 py-1 rounded">onValueChange</code>
            <span>- عند تغيير التبويب</span>
          </div>
          <div className="flex items-start gap-2">
            <code className="bg-muted px-2 py-1 rounded">disabled</code>
            <span>- لتعطيل تبويب معين</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Best Practices</h3>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>استخدم أسماء واضحة للتبويبات (3-12 حرف مثالي)</li>
          <li>3-5 تبويبات هو العدد المثالي (تجنب أكثر من 7)</li>
          <li>أضف Badge لعرض الأعداد (مثل: الكل 15)</li>
          <li>استخدم أيقونات مع النصوص للتوضيح</li>
          <li>حافظ على محتوى متناسق بين التبويبات</li>
          <li>ضع التبويب الأهم في البداية (defaultValue)</li>
          <li>عطّل التبويبات غير المتاحة بدلاً من إخفائها</li>
          <li>تجنب تحميل بيانات ثقيلة في جميع التبويبات مرة واحدة</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">أمثلة الاستخدام</h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-sm font-medium">تبويبات بسيطة:</p>
            <code className="block bg-muted p-3 rounded text-xs">
              {`<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">الأول</TabsTrigger>
    <TabsTrigger value="tab2">الثاني</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">محتوى 1</TabsContent>
  <TabsContent value="tab2">محتوى 2</TabsContent>
</Tabs>`}
            </code>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">مع أيقونات وبادجات:</p>
            <code className="block bg-muted p-3 rounded text-xs">
              {`<TabsTrigger value="all" className="gap-2">
  <Icon />
  الكل
  <Badge variant="secondary">15</Badge>
</TabsTrigger>`}
            </code>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">تعطيل تبويب:</p>
            <code className="block bg-muted p-3 rounded text-xs">
              {`<TabsTrigger value="locked" disabled>
  مقفل 🔒
</TabsTrigger>`}
            </code>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Accessibility</h3>
        <div className="bg-info/10 dark:bg-info/20 p-4 rounded-lg text-sm space-y-2">
          <p>✅ Keyboard navigation (Arrow keys, Tab)</p>
          <p>✅ Home/End للذهاب للتبويب الأول/الأخير</p>
          <p>✅ ARIA attributes تلقائية (role=&quot;tablist&quot;)</p>
          <p>✅ Screen readers تعلن عن التبويب النشط</p>
          <p>✅ Focus indicator واضح</p>
          <p>✅ disabled يمنع التفاعل بشكل صحيح</p>
        </div>
      </div>

      <div className="pt-4">
        <h4 className="font-semibold mb-2">مثال تفاعلي:</h4>
        <Tabs defaultValue="demo1" className="w-full">
          <TabsList>
            <TabsTrigger value="demo1">التبويب 1</TabsTrigger>
            <TabsTrigger value="demo2">التبويب 2</TabsTrigger>
            <TabsTrigger value="demo3">التبويب 3</TabsTrigger>
          </TabsList>
          <TabsContent value="demo1" className="p-4 border rounded-lg mt-2">
            محتوى التبويب الأول
          </TabsContent>
          <TabsContent value="demo2" className="p-4 border rounded-lg mt-2">
            محتوى التبويب الثاني
          </TabsContent>
          <TabsContent value="demo3" className="p-4 border rounded-lg mt-2">
            محتوى التبويب الثالث
          </TabsContent>
        </Tabs>
      </div>
    </div>
  ),
}
