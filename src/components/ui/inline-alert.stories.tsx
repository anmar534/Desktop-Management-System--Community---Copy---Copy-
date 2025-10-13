import type { Meta, StoryObj } from '@storybook/react';
import { InlineAlert } from './inline-alert';
import { Button } from './button';

const meta: Meta<typeof InlineAlert> = {
  title: 'Design System/InlineAlert',
  component: InlineAlert,
  args: {
    title: 'تم تحديث البيانات بنجاح',
    description: 'آخر تحديث للبيانات كان قبل 5 دقائق. يمكنك متابعة العمل بأمان.',
    variant: 'success',
  },
};

export default meta;

type Story = StoryObj<typeof InlineAlert>;

export const Success: Story = {};

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'تحذير من تجاوز الميزانية',
    description: 'اقتربت المصروفات من الحد المسموح به لهذا الشهر. راجع خطة الصرف.',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    title: 'خطأ في تزامن البيانات',
    description: 'تعذر مزامنة البيانات مع النظام المركزي. يرجى المحاولة لاحقًا أو التواصل مع الدعم.',
    actions: (
      <Button size="sm" variant="secondary">
        إعادة المحاولة
      </Button>
    ),
  },
};

export const Info: Story = {
  args: {
    variant: 'info',
    title: 'معلومة مهمة',
    description: 'يمكنك الآن تفعيل وضع التباين العالي من الإعدادات لراحة أكبر في القراءة.',
  },
};

export const WithChildren: Story = {
  args: {
    variant: 'neutral',
    title: 'إرشاد عام',
    description: 'تأكد من مراجعة البيانات التالية قبل إرسال التقرير للمدير التنفيذي.',
    children: (
      <ul className="list-disc space-y-1 ps-4 text-xs text-muted-foreground">
        <li>تأكيد الأرقام النهائية بعد تطبيق الضرائب.</li>
        <li>التأكد من توقيع جميع الجهات المختصة.</li>
        <li>إرفاق المستندات الداعمة للاستحقاقات المالية.</li>
      </ul>
    ),
  },
};
