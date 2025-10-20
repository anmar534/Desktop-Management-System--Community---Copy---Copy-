import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
import { Badge } from './badge';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { Input } from './input';

const meta = {
  title: 'UI Components/Table',
  component: Table,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

const WithCheckboxesStory: React.FC = () => {
  const [selectedRows, setSelectedRows] = React.useState<number[]>([]);

  const toggleRow = (index: number) => {
    setSelectedRows((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const toggleAll = () => {
    setSelectedRows((prev) => (prev.length === 3 ? [] : [0, 1, 2]));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          تم تحديد {selectedRows.length} من 3
        </span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedRows.length === 3}
                onCheckedChange={toggleAll}
              />
            </TableHead>
            <TableHead>اسم المشروع</TableHead>
            <TableHead>المدير</TableHead>
            <TableHead>الميزانية</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[
            { name: 'مشروع التطوير الرقمي', manager: 'محمد أحمد', budget: '2,500,000' },
            { name: 'تحديث البنية التحتية', manager: 'سارة علي', budget: '1,800,000' },
            { name: 'تدريب الموظفين', manager: 'خالد محمد', budget: '500,000' },
          ].map((project, index) => (
            <TableRow
              key={index}
              data-state={selectedRows.includes(index) ? 'selected' : ''}
            >
              <TableCell>
                <Checkbox
                  checked={selectedRows.includes(index)}
                  onCheckedChange={() => toggleRow(index)}
                />
              </TableCell>
              <TableCell className="font-medium">{project.name}</TableCell>
              <TableCell>{project.manager}</TableCell>
              <TableCell>{project.budget} ر.س</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// ============================================
// Basic Stories
// ============================================

export const Default: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>الاسم</TableHead>
          <TableHead>الوظيفة</TableHead>
          <TableHead>القسم</TableHead>
          <TableHead className="text-right">الراتب</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>محمد أحمد</TableCell>
          <TableCell>مطور</TableCell>
          <TableCell>تقنية المعلومات</TableCell>
          <TableCell className="text-right">15,000 ر.س</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>سارة علي</TableCell>
          <TableCell>مصممة</TableCell>
          <TableCell>التصميم</TableCell>
          <TableCell className="text-right">12,000 ر.س</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>خالد محمد</TableCell>
          <TableCell>مدير مشروع</TableCell>
          <TableCell>إدارة المشاريع</TableCell>
          <TableCell className="text-right">18,000 ر.س</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const WithCaption: Story = {
  render: () => (
    <Table>
      <TableCaption>قائمة الموظفين - أكتوبر 2025</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>الاسم</TableHead>
          <TableHead>الوظيفة</TableHead>
          <TableHead>تاريخ التعيين</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>محمد أحمد</TableCell>
          <TableCell>مطور</TableCell>
          <TableCell>2023/01/15</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>سارة علي</TableCell>
          <TableCell>مصممة</TableCell>
          <TableCell>2023/03/20</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>خالد محمد</TableCell>
          <TableCell>مدير مشروع</TableCell>
          <TableCell>2022/11/10</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>البند</TableHead>
          <TableHead>الكمية</TableHead>
          <TableHead>السعر</TableHead>
          <TableHead className="text-right">الإجمالي</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>خوادم (Servers)</TableCell>
          <TableCell>10</TableCell>
          <TableCell>50,000 ر.س</TableCell>
          <TableCell className="text-right">500,000 ر.س</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>أجهزة شبكة</TableCell>
          <TableCell>25</TableCell>
          <TableCell>8,000 ر.س</TableCell>
          <TableCell className="text-right">200,000 ر.س</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>تراخيص برمجيات</TableCell>
          <TableCell>100</TableCell>
          <TableCell>2,000 ر.س</TableCell>
          <TableCell className="text-right">200,000 ر.س</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>الإجمالي الكلي</TableCell>
          <TableCell className="text-right font-bold">900,000 ر.س</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};

export const WithBadges: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>اسم المشروع</TableHead>
          <TableHead>المدير</TableHead>
          <TableHead>الحالة</TableHead>
          <TableHead>الأولوية</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">مشروع التطوير الرقمي</TableCell>
          <TableCell>محمد أحمد</TableCell>
          <TableCell>
            <Badge>نشط</Badge>
          </TableCell>
          <TableCell>
            <Badge variant="destructive">عالية</Badge>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">تحديث البنية التحتية</TableCell>
          <TableCell>سارة علي</TableCell>
          <TableCell>
            <Badge variant="outline">قيد الانتظار</Badge>
          </TableCell>
          <TableCell>
            <Badge variant="secondary">متوسطة</Badge>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">تدريب الموظفين</TableCell>
          <TableCell>خالد محمد</TableCell>
          <TableCell>
            <Badge variant="secondary">مكتمل</Badge>
          </TableCell>
          <TableCell>
            <Badge variant="outline">منخفضة</Badge>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const WithActions: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>اسم المناقصة</TableHead>
          <TableHead>الميزانية</TableHead>
          <TableHead>الحالة</TableHead>
          <TableHead className="text-right">الإجراءات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">مناقصة البنية التحتية</TableCell>
          <TableCell>2,500,000 ر.س</TableCell>
          <TableCell>
            <Badge>نشط</Badge>
          </TableCell>
          <TableCell className="text-right">
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm">عرض</Button>
              <Button variant="outline" size="sm">تعديل</Button>
              <Button variant="destructive" size="sm">حذف</Button>
            </div>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">مناقصة التطوير البرمجي</TableCell>
          <TableCell>1,800,000 ر.س</TableCell>
          <TableCell>
            <Badge variant="outline">قيد الانتظار</Badge>
          </TableCell>
          <TableCell className="text-right">
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm">عرض</Button>
              <Button variant="outline" size="sm">تعديل</Button>
              <Button variant="destructive" size="sm">حذف</Button>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const WithCheckboxes: Story = {
  render: () => <WithCheckboxesStory />,
};

// ============================================
// Application Examples
// ============================================

export const TendersList: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">قائمة المناقصات</h3>
        <Button>إضافة مناقصة جديدة</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>رقم المناقصة</TableHead>
            <TableHead>العنوان</TableHead>
            <TableHead>الميزانية</TableHead>
            <TableHead>تاريخ الإغلاق</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>المتقدمين</TableHead>
            <TableHead className="text-right">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-mono">T-2025-001</TableCell>
            <TableCell className="font-medium">مشروع البنية التحتية الرقمية</TableCell>
            <TableCell>2,500,000 ر.س</TableCell>
            <TableCell>2025/10/15</TableCell>
            <TableCell>
              <Badge>نشط</Badge>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">12 شركة</Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm">عرض التفاصيل</Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-mono">T-2025-002</TableCell>
            <TableCell className="font-medium">تطوير نظام إدارة المشاريع</TableCell>
            <TableCell>1,800,000 ر.س</TableCell>
            <TableCell>2025/10/20</TableCell>
            <TableCell>
              <Badge>نشط</Badge>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">8 شركات</Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm">عرض التفاصيل</Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-mono">T-2025-003</TableCell>
            <TableCell className="font-medium">تدريب الموظفين على الأنظمة الجديدة</TableCell>
            <TableCell>500,000 ر.س</TableCell>
            <TableCell>2025/09/30</TableCell>
            <TableCell>
              <Badge variant="outline">منتهي</Badge>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">15 شركة</Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm">عرض التفاصيل</Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-mono">T-2025-004</TableCell>
            <TableCell className="font-medium">تحديث البنية التحتية للشبكة</TableCell>
            <TableCell>3,200,000 ر.س</TableCell>
            <TableCell>2025/11/01</TableCell>
            <TableCell>
              <Badge variant="outline">قيد الانتظار</Badge>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">0 شركة</Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm">عرض التفاصيل</Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-mono">T-2025-005</TableCell>
            <TableCell className="font-medium">تطوير تطبيق الهاتف المحمول</TableCell>
            <TableCell>900,000 ر.س</TableCell>
            <TableCell>2025/10/25</TableCell>
            <TableCell>
              <Badge>نشط</Badge>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">6 شركات</Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm">عرض التفاصيل</Button>
            </TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>إجمالي الميزانية</TableCell>
            <TableCell colSpan={5} className="text-right font-bold">
              8,900,000 ر.س
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  ),
};

export const BOQTable: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">جدول الكميات (BOQ)</h3>
        <p className="text-sm text-muted-foreground">مناقصة البنية التحتية الرقمية</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">#</TableHead>
            <TableHead>البند</TableHead>
            <TableHead>الوصف</TableHead>
            <TableHead>الوحدة</TableHead>
            <TableHead className="text-right">الكمية</TableHead>
            <TableHead className="text-right">السعر الوحدة</TableHead>
            <TableHead className="text-right">الإجمالي</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-mono">1</TableCell>
            <TableCell className="font-medium">خوادم Dell PowerEdge</TableCell>
            <TableCell>خادم R750 - 2x Xeon Gold - 128GB RAM</TableCell>
            <TableCell>وحدة</TableCell>
            <TableCell className="text-right">10</TableCell>
            <TableCell className="text-right">50,000</TableCell>
            <TableCell className="text-right font-semibold">500,000</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-mono">2</TableCell>
            <TableCell className="font-medium">محول شبكة Cisco</TableCell>
            <TableCell>Catalyst 9300 - 48 Port</TableCell>
            <TableCell>وحدة</TableCell>
            <TableCell className="text-right">15</TableCell>
            <TableCell className="text-right">12,000</TableCell>
            <TableCell className="text-right font-semibold">180,000</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-mono">3</TableCell>
            <TableCell className="font-medium">جدار ناري Fortinet</TableCell>
            <TableCell>FortiGate 600E</TableCell>
            <TableCell>وحدة</TableCell>
            <TableCell className="text-right">2</TableCell>
            <TableCell className="text-right">85,000</TableCell>
            <TableCell className="text-right font-semibold">170,000</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-mono">4</TableCell>
            <TableCell className="font-medium">نظام تخزين SAN</TableCell>
            <TableCell>Dell EMC Unity 380 - 100TB</TableCell>
            <TableCell>وحدة</TableCell>
            <TableCell className="text-right">1</TableCell>
            <TableCell className="text-right">250,000</TableCell>
            <TableCell className="text-right font-semibold">250,000</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-mono">5</TableCell>
            <TableCell className="font-medium">تراخيص VMware</TableCell>
            <TableCell>vSphere Enterprise Plus</TableCell>
            <TableCell>ترخيص</TableCell>
            <TableCell className="text-right">20</TableCell>
            <TableCell className="text-right">15,000</TableCell>
            <TableCell className="text-right font-semibold">300,000</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-mono">6</TableCell>
            <TableCell className="font-medium">كابلات الألياف الضوئية</TableCell>
            <TableCell>OM4 Multimode - 50m</TableCell>
            <TableCell>متر</TableCell>
            <TableCell className="text-right">500</TableCell>
            <TableCell className="text-right">80</TableCell>
            <TableCell className="text-right font-semibold">40,000</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-mono">7</TableCell>
            <TableCell className="font-medium">خدمات التركيب والتشغيل</TableCell>
            <TableCell>تركيب وتكوين جميع الأجهزة</TableCell>
            <TableCell>شامل</TableCell>
            <TableCell className="text-right">1</TableCell>
            <TableCell className="text-right">200,000</TableCell>
            <TableCell className="text-right font-semibold">200,000</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-mono">8</TableCell>
            <TableCell className="font-medium">الدعم الفني</TableCell>
            <TableCell>دعم فني 24/7 لمدة سنة</TableCell>
            <TableCell>سنة</TableCell>
            <TableCell className="text-right">1</TableCell>
            <TableCell className="text-right">120,000</TableCell>
            <TableCell className="text-right font-semibold">120,000</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={6}>المجموع الفرعي</TableCell>
            <TableCell className="text-right font-bold">1,760,000 ر.س</TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={6}>ضريبة القيمة المضافة (15%)</TableCell>
            <TableCell className="text-right font-bold">264,000 ر.س</TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={6} className="font-bold">الإجمالي الكلي</TableCell>
            <TableCell className="text-right font-bold text-lg">2,024,000 ر.س</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  ),
};

export const ProjectsTracking: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">تتبع المشاريع</h3>
        <div className="flex gap-2">
          <Input placeholder="بحث..." className="w-64" />
          <Button variant="outline">تصدير</Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>اسم المشروع</TableHead>
            <TableHead>مدير المشروع</TableHead>
            <TableHead>تاريخ البدء</TableHead>
            <TableHead>تاريخ الانتهاء</TableHead>
            <TableHead>التقدم</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>الميزانية</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">مشروع التطوير الرقمي</TableCell>
            <TableCell>محمد أحمد</TableCell>
            <TableCell>2025/01/01</TableCell>
            <TableCell>2025/12/31</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-success h-2 rounded-full w-[75%]" />
                </div>
                <span className="text-sm font-medium">75%</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge>نشط</Badge>
            </TableCell>
            <TableCell>2,500,000 ر.س</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">تحديث البنية التحتية</TableCell>
            <TableCell>سارة علي</TableCell>
            <TableCell>2025/03/01</TableCell>
            <TableCell>2026/02/28</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-warning h-2 rounded-full w-[45%]" />
                </div>
                <span className="text-sm font-medium">45%</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge>نشط</Badge>
            </TableCell>
            <TableCell>1,800,000 ر.س</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">تدريب الموظفين</TableCell>
            <TableCell>خالد محمد</TableCell>
            <TableCell>2024/11/01</TableCell>
            <TableCell>2025/01/31</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full w-full" />
                </div>
                <span className="text-sm font-medium">100%</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">مكتمل</Badge>
            </TableCell>
            <TableCell>500,000 ر.س</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">تطوير تطبيق الموبايل</TableCell>
            <TableCell>فاطمة حسن</TableCell>
            <TableCell>2025/06/01</TableCell>
            <TableCell>2025/12/01</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-muted-foreground h-2 rounded-full w-[20%]" />
                </div>
                <span className="text-sm font-medium">20%</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">قيد الانتظار</Badge>
            </TableCell>
            <TableCell>900,000 ر.س</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};

export const UserManagement: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">إدارة المستخدمين</h3>
        <Button>إضافة مستخدم</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الاسم</TableHead>
            <TableHead>البريد الإلكتروني</TableHead>
            <TableHead>الصلاحية</TableHead>
            <TableHead>القسم</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>آخر تسجيل دخول</TableHead>
            <TableHead className="text-right">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">محمد أحمد</TableCell>
            <TableCell>mohammed@example.com</TableCell>
            <TableCell>
              <Badge variant="destructive">مدير</Badge>
            </TableCell>
            <TableCell>تقنية المعلومات</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full" />
                <span>نشط</span>
              </div>
            </TableCell>
            <TableCell>منذ ساعة</TableCell>
            <TableCell className="text-right">
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm">تعديل</Button>
                <Button variant="ghost" size="sm">حذف</Button>
              </div>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">سارة علي</TableCell>
            <TableCell>sara@example.com</TableCell>
            <TableCell>
              <Badge>مستخدم</Badge>
            </TableCell>
            <TableCell>التصميم</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full" />
                <span>نشط</span>
              </div>
            </TableCell>
            <TableCell>منذ 30 دقيقة</TableCell>
            <TableCell className="text-right">
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm">تعديل</Button>
                <Button variant="ghost" size="sm">حذف</Button>
              </div>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">خالد محمد</TableCell>
            <TableCell>khaled@example.com</TableCell>
            <TableCell>
              <Badge variant="secondary">مشرف</Badge>
            </TableCell>
            <TableCell>إدارة المشاريع</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                <span>غير متصل</span>
              </div>
            </TableCell>
            <TableCell>منذ 3 ساعات</TableCell>
            <TableCell className="text-right">
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm">تعديل</Button>
                <Button variant="ghost" size="sm">حذف</Button>
              </div>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">فاطمة حسن</TableCell>
            <TableCell>fatima@example.com</TableCell>
            <TableCell>
              <Badge>مستخدم</Badge>
            </TableCell>
            <TableCell>المبيعات</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-destructive rounded-full" />
                <span>معطل</span>
              </div>
            </TableCell>
            <TableCell>منذ أسبوع</TableCell>
            <TableCell className="text-right">
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm">تفعيل</Button>
                <Button variant="ghost" size="sm">حذف</Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};

// ============================================
// Theme Testing
// ============================================

export const ThemeTesting: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="font-semibold">Light Theme</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>البند</TableHead>
              <TableHead>القيمة</TableHead>
              <TableHead>الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>البند الأول</TableCell>
              <TableCell>1,000 ر.س</TableCell>
              <TableCell>
                <Badge>نشط</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>البند الثاني</TableCell>
              <TableCell>2,000 ر.س</TableCell>
              <TableCell>
                <Badge variant="outline">قيد الانتظار</Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="space-y-4 dark">
        <h3 className="font-semibold">Dark Theme</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>البند</TableHead>
              <TableHead>القيمة</TableHead>
              <TableHead>الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>البند الأول</TableCell>
              <TableCell>1,000 ر.س</TableCell>
              <TableCell>
                <Badge>نشط</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>البند الثاني</TableCell>
              <TableCell>2,000 ر.س</TableCell>
              <TableCell>
                <Badge variant="outline">قيد الانتظار</Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
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
        <h2 className="text-2xl font-bold mb-2">Table Component</h2>
        <p className="text-muted-foreground">
          مكون Table لعرض البيانات في جداول منظمة
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">متى تستخدم Table؟</h3>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>عرض قوائم المناقصات والمشاريع</li>
          <li>جداول الكميات (BOQ)</li>
          <li>إدارة المستخدمين والصلاحيات</li>
          <li>تقارير مالية وإحصائيات</li>
          <li>سجلات التاريخ والأنشطة</li>
          <li>مقارنة البيانات والعروض</li>
          <li>أي بيانات منظمة في صفوف وأعمدة</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">المكونات الفرعية</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-info/10 dark:bg-info/20 rounded">
            <h4 className="font-semibold mb-2">Table</h4>
            <p className="text-muted-foreground">
              الحاوية الرئيسية - مع overflow-x-auto
            </p>
          </div>
          <div className="p-3 bg-success/10 dark:bg-success/20 rounded">
            <h4 className="font-semibold mb-2">TableHeader</h4>
            <p className="text-muted-foreground">
              رأس الجدول - يحتوي على TableHead
            </p>
          </div>
          <div className="p-3 bg-warning/10 dark:bg-warning/20 rounded">
            <h4 className="font-semibold mb-2">TableBody</h4>
            <p className="text-muted-foreground">
              جسم الجدول - يحتوي على TableRow
            </p>
          </div>
          <div className="p-3 bg-accent/10 dark:bg-accent/20 rounded">
            <h4 className="font-semibold mb-2">TableFooter</h4>
            <p className="text-muted-foreground">
              تذييل الجدول - للإجماليات
            </p>
          </div>
          <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded">
            <h4 className="font-semibold mb-2">TableRow</h4>
            <p className="text-muted-foreground">
              صف الجدول - مع hover effect
            </p>
          </div>
          <div className="p-3 bg-info/10 dark:bg-info/20 rounded">
            <h4 className="font-semibold mb-2">TableHead / TableCell</h4>
            <p className="text-muted-foreground">
              خلايا الرأس والبيانات
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Design Tokens</h3>
        <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
          <div>border-b - حدود الصفوف</div>
          <div>hover:bg-muted/50 - تمييز الصف عند التمرير</div>
          <div>data-[state=selected]:bg-muted - الصف المحدد</div>
          <div>bg-muted/50 - خلفية TableFooter</div>
          <div>text-foreground - لون نص الرأس</div>
          <div>text-sm - حجم الخط</div>
          <div>whitespace-nowrap - منع التفاف النص</div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Best Practices</h3>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>استخدم TableCaption لتوضيح محتوى الجدول</li>
          <li>أضف TableFooter للإجماليات والملخصات</li>
          <li>استخدم font-medium للخلايا المهمة</li>
          <li>أضف text-right للأرقام والمبالغ</li>
          <li>استخدم font-mono لأرقام المراجع (IDs)</li>
          <li>أضف Badge للحالات والأولويات</li>
          <li>ضع الأزرار في عمود &quot;الإجراءات&quot; في النهاية</li>
          <li>استخدم Checkbox مع data-state=&quot;selected&quot;</li>
          <li>تجنب الجداول الواسعة جداً (10+ أعمدة)</li>
          <li>أضف شريط بحث للجداول الكبيرة</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">أمثلة الاستخدام</h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-sm font-medium">جدول بسيط:</p>
            <code className="block bg-muted p-3 rounded text-xs">
              {`<Table>
  <TableHeader>
    <TableRow>
      <TableHead>العمود 1</TableHead>
      <TableHead>العمود 2</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>قيمة 1</TableCell>
      <TableCell>قيمة 2</TableCell>
    </TableRow>
  </TableBody>
</Table>`}
            </code>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">مع Footer:</p>
            <code className="block bg-muted p-3 rounded text-xs">
              {`<TableFooter>
  <TableRow>
    <TableCell colSpan={3}>الإجمالي</TableCell>
    <TableCell className="text-right">
      1,000 ر.س
    </TableCell>
  </TableRow>
</TableFooter>`}
            </code>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Accessibility</h3>
  <div className="bg-info/10 dark:bg-info/20 p-4 rounded-lg text-sm space-y-2">
          <p>✅ Semantic HTML (table, thead, tbody, tr, th, td)</p>
          <p>✅ TableCaption للسياق</p>
          <p>✅ Screen readers تقرأ الجدول بشكل صحيح</p>
          <p>✅ Keyboard navigation للخلايا التفاعلية</p>
          <p>✅ colSpan/rowSpan للدمج</p>
          <p>✅ overflow-x-auto للجداول الواسعة</p>
        </div>
      </div>

      <div className="pt-4">
        <h4 className="font-semibold mb-2">مثال تفاعلي:</h4>
        <Table>
          <TableCaption>مثال جدول تفاعلي</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>البند</TableHead>
              <TableHead>الكمية</TableHead>
              <TableHead className="text-right">السعر</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">المنتج 1</TableCell>
              <TableCell>5</TableCell>
              <TableCell className="text-right">1,000 ر.س</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">المنتج 2</TableCell>
              <TableCell>3</TableCell>
              <TableCell className="text-right">500 ر.س</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2}>الإجمالي</TableCell>
              <TableCell className="text-right font-bold">1,500 ر.س</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  ),
};
