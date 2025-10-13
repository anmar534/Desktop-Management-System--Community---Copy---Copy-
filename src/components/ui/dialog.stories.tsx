import type { Meta, StoryObj } from '@storybook/react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

const meta = {
  title: 'UI Components/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================
// Basic Stories
// ============================================

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>فتح النافذة</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>عنوان النافذة</DialogTitle>
          <DialogDescription>
            هذا وصف تفصيلي للنافذة المنبثقة. يمكنك إضافة أي محتوى هنا.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>محتوى النافذة يظهر هنا.</p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">إلغاء</Button>
          </DialogClose>
          <Button>تأكيد</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const WithForm: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>إضافة مناقصة</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>إضافة مناقصة جديدة</DialogTitle>
          <DialogDescription>
            أدخل بيانات المناقصة الجديدة. انقر حفظ عند الانتهاء.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">اسم المناقصة</Label>
            <Input id="name" placeholder="أدخل اسم المناقصة..." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">الفئة</Label>
            <Select>
              <SelectTrigger id="category">
                <SelectValue placeholder="اختر الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="construction">إنشاءات</SelectItem>
                <SelectItem value="it">تقنية المعلومات</SelectItem>
                <SelectItem value="supplies">توريدات</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              placeholder="وصف تفصيلي للمناقصة..."
              className="min-h-24"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">إلغاء</Button>
          </DialogClose>
          <Button type="submit">حفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const ConfirmationDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">حذف</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>تأكيد الحذف</DialogTitle>
          <DialogDescription>
            هل أنت متأكد من حذف هذا العنصر؟ هذا الإجراء لا يمكن التراجع عنه.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline">إلغاء</Button>
          </DialogClose>
          <Button variant="destructive">حذف</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const ScrollableContent: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>الشروط والأحكام</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>الشروط والأحكام</DialogTitle>
          <DialogDescription>
            يرجى قراءة الشروط والأحكام بعناية قبل المتابعة.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[400px] overflow-y-auto pr-4">
          <div className="space-y-4 text-sm">
            <h3 className="font-semibold">1. المقدمة</h3>
            <p>
              هذه الشروط والأحكام تحكم استخدامك لهذا النظام. باستخدامك للنظام،
              فإنك توافق على هذه الشروط.
            </p>
            
            <h3 className="font-semibold">2. حقوق الاستخدام</h3>
            <p>
              يُمنح المستخدم حق الوصول المحدود إلى النظام للأغراض المصرح بها فقط.
            </p>
            
            <h3 className="font-semibold">3. المسؤوليات</h3>
            <p>
              المستخدم مسؤول عن الحفاظ على سرية بيانات الدخول الخاصة به.
            </p>
            
            <h3 className="font-semibold">4. الخصوصية</h3>
            <p>
              نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية وفقاً لسياسة
              الخصوصية.
            </p>
            
            <h3 className="font-semibold">5. التعديلات</h3>
            <p>
              نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إشعارك بأي
              تغييرات جوهرية.
            </p>
            
            <h3 className="font-semibold">6. القانون الحاكم</h3>
            <p>
              تخضع هذه الشروط لقوانين المملكة العربية السعودية.
            </p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button>أوافق</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const WithoutDescription: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">فتح</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>عنوان فقط</DialogTitle>
        </DialogHeader>
        <p className="text-sm">محتوى النافذة بدون وصف.</p>
        <DialogFooter>
          <DialogClose asChild>
            <Button>إغلاق</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// ============================================
// Application Examples
// ============================================

export const AddProjectDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>إضافة مشروع</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>إنشاء مشروع جديد</DialogTitle>
          <DialogDescription>
            أدخل معلومات المشروع الأساسية للبدء
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="project-name">اسم المشروع *</Label>
            <Input id="project-name" placeholder="مشروع التطوير..." />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start-date">تاريخ البداية</Label>
              <Input id="start-date" type="date" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-date">تاريخ النهاية</Label>
              <Input id="end-date" type="date" />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="budget">الميزانية</Label>
            <Input id="budget" type="number" placeholder="0.00" />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="manager">مدير المشروع</Label>
            <Select>
              <SelectTrigger id="manager">
                <SelectValue placeholder="اختر المدير" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">أحمد محمد</SelectItem>
                <SelectItem value="2">فاطمة علي</SelectItem>
                <SelectItem value="3">محمد سعيد</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">إلغاء</Button>
          </DialogClose>
          <Button>إنشاء المشروع</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const SubmitBidDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>تقديم عطاء</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>تقديم عطاء للمناقصة</DialogTitle>
          <DialogDescription>
            أدخل تفاصيل العطاء المقدم. تأكد من صحة جميع المعلومات.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="bid-amount">قيمة العطاء (ريال سعودي) *</Label>
            <Input
              id="bid-amount"
              type="number"
              placeholder="0.00"
              step="0.01"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="delivery-time">مدة التنفيذ (أيام) *</Label>
            <Input id="delivery-time" type="number" placeholder="30" />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="notes">ملاحظات إضافية</Label>
            <Textarea
              id="notes"
              placeholder="أي ملاحظات أو تفاصيل إضافية..."
              className="min-h-24"
            />
          </div>
          
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
            <p className="text-sm text-warning-foreground">
              ⚠️ تنبيه: بمجرد تقديم العطاء، لن تتمكن من تعديله. يرجى مراجعة
              جميع المعلومات بعناية.
            </p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">إلغاء</Button>
          </DialogClose>
          <Button>تقديم العطاء</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const ApprovalDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">اعتماد</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>اعتماد المناقصة</DialogTitle>
          <DialogDescription>
            قم بمراجعة التفاصيل قبل الاعتماد النهائي
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">رقم المناقصة:</span>
              <p className="font-medium">TND-2025-001</p>
            </div>
            <div>
              <span className="text-muted-foreground">القيمة:</span>
              <p className="font-medium">500,000 ر.س</p>
            </div>
            <div>
              <span className="text-muted-foreground">الموعد النهائي:</span>
              <p className="font-medium">2025-12-31</p>
            </div>
            <div>
              <span className="text-muted-foreground">عدد العطاءات:</span>
              <p className="font-medium">12 عطاء</p>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <Label htmlFor="approval-notes">ملاحظات الاعتماد</Label>
            <Textarea
              id="approval-notes"
              placeholder="أضف ملاحظاتك..."
              className="mt-2 min-h-20"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">رفض</Button>
          </DialogClose>
          <Button>اعتماد</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const FileUploadDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">رفع ملفات</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>رفع المستندات</DialogTitle>
          <DialogDescription>
            قم برفع المستندات المطلوبة للمناقصة
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="file-type">نوع المستند</Label>
            <Select>
              <SelectTrigger id="file-type">
                <SelectValue placeholder="اختر النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="financial">المستندات المالية</SelectItem>
                <SelectItem value="technical">المستندات الفنية</SelectItem>
                <SelectItem value="legal">المستندات القانونية</SelectItem>
                <SelectItem value="other">أخرى</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="file-upload">الملف</Label>
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-accent/50 transition-colors cursor-pointer">
              <p className="text-sm text-muted-foreground">
                انقر أو اسحب الملف هنا
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                PDF, DOC, DOCX - حتى 10 ميجا
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">إلغاء</Button>
          </DialogClose>
          <Button>رفع الملف</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// ============================================
// Different Sizes
// ============================================

export const SmallDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">صغير</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[350px]">
        <DialogHeader>
          <DialogTitle>نافذة صغيرة</DialogTitle>
          <DialogDescription>
            نافذة بحجم 350px للرسائل البسيطة
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm">محتوى مختصر.</p>
        <DialogFooter>
          <DialogClose asChild>
            <Button size="sm">حسناً</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const LargeDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">كبير</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>نافذة كبيرة</DialogTitle>
          <DialogDescription>
            نافذة بحجم 800px للمحتوى الموسع
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-4">
            <h4 className="font-semibold">المعلومات الأساسية</h4>
            <div className="grid gap-2">
              <Label htmlFor="field1">الحقل 1</Label>
              <Input id="field1" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="field2">الحقل 2</Label>
              <Input id="field2" />
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold">معلومات إضافية</h4>
            <div className="grid gap-2">
              <Label htmlFor="field3">الحقل 3</Label>
              <Input id="field3" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="field4">الحقل 4</Label>
              <Input id="field4" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">إلغاء</Button>
          </DialogClose>
          <Button>حفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// ============================================
// Theme Testing
// ============================================

export const ThemeTesting: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-2">Light Theme</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button>فتح في Light Mode</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Light Theme</DialogTitle>
              <DialogDescription>
                النافذة في وضع الإضاءة
              </DialogDescription>
            </DialogHeader>
            <p>المحتوى يظهر بوضوح في الوضع الفاتح.</p>
            <DialogFooter>
              <DialogClose asChild>
                <Button>إغلاق</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="dark">
        <h3 className="font-semibold mb-2">Dark Theme</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button>فتح في Dark Mode</Button>
          </DialogTrigger>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle>Dark Theme</DialogTitle>
              <DialogDescription>
                النافذة في الوضع المظلم
              </DialogDescription>
            </DialogHeader>
            <p>المحتوى يظهر بوضوح في الوضع المظلم.</p>
            <DialogFooter>
              <DialogClose asChild>
                <Button>إغلاق</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
        <h2 className="text-2xl font-bold mb-2">Dialog Component</h2>
        <p className="text-muted-foreground">
          مكون النافذة المنبثقة (Modal) للتفاعلات المهمة
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">المكونات الفرعية</h3>
        <div className="space-y-2 text-sm">
          <div><code className="bg-muted px-2 py-1 rounded">Dialog</code> - المكون الأساسي</div>
          <div><code className="bg-muted px-2 py-1 rounded">DialogTrigger</code> - الزر المحفز</div>
          <div><code className="bg-muted px-2 py-1 rounded">DialogContent</code> - محتوى النافذة</div>
          <div><code className="bg-muted px-2 py-1 rounded">DialogHeader</code> - رأس النافذة</div>
          <div><code className="bg-muted px-2 py-1 rounded">DialogTitle</code> - العنوان</div>
          <div><code className="bg-muted px-2 py-1 rounded">DialogDescription</code> - الوصف</div>
          <div><code className="bg-muted px-2 py-1 rounded">DialogFooter</code> - تذييل النافذة</div>
          <div><code className="bg-muted px-2 py-1 rounded">DialogClose</code> - زر الإغلاق</div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">متى تستخدم Dialog؟</h3>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>تأكيد الإجراءات المهمة (حذف، اعتماد)</li>
          <li>إدخال بيانات سريع (نموذج قصير)</li>
          <li>عرض معلومات مهمة تتطلب تركيز المستخدم</li>
          <li>الشروط والأحكام</li>
          <li>إضافة/تعديل سجلات</li>
          <li>رفع الملفات</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Design Tokens</h3>
        <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
          <div>bg-background - خلفية النافذة</div>
          <div>bg-black/50 - Overlay الخلفية</div>
          <div>border - حدود النافذة</div>
          <div>shadow-lg - الظل</div>
          <div>rounded-lg - الحواف المستديرة</div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">الأحجام المتاحة</h3>
        <div className="space-y-2 text-sm">
          <div><code className="bg-muted px-2 py-1 rounded">sm:max-w-[350px]</code> - صغير (رسائل بسيطة)</div>
          <div><code className="bg-muted px-2 py-1 rounded">sm:max-w-[500px]</code> - متوسط (نماذج قصيرة)</div>
          <div><code className="bg-muted px-2 py-1 rounded">sm:max-w-[600px]</code> - كبير (نماذج مفصلة)</div>
          <div><code className="bg-muted px-2 py-1 rounded">sm:max-w-[800px]</code> - كبير جداً (محتوى موسع)</div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Best Practices</h3>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>استخدم DialogTitle دائماً للوصول (Accessibility)</li>
          <li>أضف DialogDescription لتوضيح الغرض</li>
          <li>استخدم DialogFooter للأزرار</li>
          <li>اجعل الزر الأساسي في اليمين</li>
          <li>استخدم variant=&quot;destructive&quot; للإجراءات الخطرة</li>
          <li>لا تستخدم أكثر من نافذة واحدة في نفس الوقت</li>
          <li>للمحتوى الطويل، استخدم max-h مع overflow-y-auto</li>
        </ul>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Accessibility</h3>
        <div className="rounded-lg border border-info/30 bg-info/10 p-4 text-sm space-y-2">
          <p className="text-info-foreground">✅ يُغلق بالضغط على Escape</p>
          <p className="text-info-foreground">✅ Focus trap - التركيز يبقى داخل النافذة</p>
          <p className="text-info-foreground">✅ ARIA attributes تلقائية من Radix UI</p>
          <p className="text-info-foreground">✅ Screen reader support كامل</p>
          <p className="text-info-foreground">✅ Overlay يمنع التفاعل مع الخلفية</p>
        </div>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button className="mt-4">جرّب Dialog الآن</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>مثال تفاعلي</DialogTitle>
            <DialogDescription>
              هذا مثال حي لمكون Dialog
            </DialogDescription>
          </DialogHeader>
          <p>يمكنك التفاعل مع هذه النافذة مباشرة!</p>
          <DialogFooter>
            <DialogClose asChild>
              <Button>فهمت</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  ),
};
