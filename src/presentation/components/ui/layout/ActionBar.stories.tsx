import type { Meta, StoryObj } from '@storybook/react'
import { ActionBar } from './ActionBar'
import { Button } from '../button'
import { Badge } from '../badge'

const meta: Meta<typeof ActionBar> = {
  title: 'Design System/Layout/ActionBar',
  component: ActionBar,
  args: {
    align: 'between',
    elevated: false,
    subdued: false,
    sticky: false,
    position: 'bottom',
    children: (
      <>
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">تأكيد حفظ التغييرات</span>
          <span>تم تعديل 3 بنود من تسعير المنافسة الحالية.</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">تغييرات غير محفوظة</Badge>
          <Button variant="outline" size="sm">
            إلغاء
          </Button>
          <Button size="sm">حفظ</Button>
        </div>
      </>
    ),
  },
}

export default meta

type Story = StoryObj<typeof ActionBar>

export const Default: Story = {}

export const Elevated: Story = {
  args: {
    elevated: true,
  },
}

export const Subdued: Story = {
  args: {
    subdued: true,
  },
}

export const StickyTop: Story = {
  args: {
    sticky: true,
    position: 'top',
  },
  parameters: {
    layout: 'fullscreen',
  },
}

export const StickyBottom: Story = {
  args: {
    sticky: true,
    position: 'bottom',
  },
  parameters: {
    layout: 'fullscreen',
  },
}
