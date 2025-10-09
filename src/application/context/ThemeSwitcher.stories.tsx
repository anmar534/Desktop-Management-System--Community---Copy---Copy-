import type { Meta, StoryObj } from '@storybook/react';
import { ThemeSwitcher } from '../../application/context/ThemeProvider';

/**
 * مكون ThemeSwitcher لتبديل السمات
 * 
 * يوفر 3 أنماط مختلفة:
 * - **dropdown**: قائمة منسدلة (الافتراضي)
 * - **buttons**: أزرار جانبية
 * - **toggle**: تبديل بسيط (Light/Dark فقط)
 */
const meta = {
  title: 'Application/ThemeSwitcher',
  component: ThemeSwitcher,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'مكون لتبديل السمات بين Light, Dark, و High Contrast. يدعم 3 أنماط مختلفة للعرض.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['dropdown', 'buttons', 'toggle'],
      description: 'نمط عرض المكون',
      table: {
        defaultValue: { summary: 'dropdown' },
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'حجم المكون',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    showLabels: {
      control: 'boolean',
      description: 'إظهار أسماء السمات',
      table: {
        defaultValue: { summary: 'true' },
      },
    },
  },
} satisfies Meta<typeof ThemeSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * القائمة المنسدلة (Dropdown)
 * 
 * النمط الافتراضي - قائمة منسدلة بسيطة للاختيار بين السمات الثلاثة
 */
export const Dropdown: Story = {
  args: {
    variant: 'dropdown',
    size: 'md',
    showLabels: true,
  },
};

/**
 * الأزرار (Buttons)
 * 
 * أزرار جانبية تعرض جميع السمات المتاحة
 */
export const Buttons: Story = {
  args: {
    variant: 'buttons',
    size: 'md',
    showLabels: true,
  },
};

/**
 * التبديل (Toggle)
 * 
 * زر تبديل بسيط بين Light و Dark فقط
 */
export const Toggle: Story = {
  args: {
    variant: 'toggle',
    size: 'md',
    showLabels: true,
  },
};

/**
 * حجم صغير (Small)
 */
export const SmallSize: Story = {
  args: {
    variant: 'buttons',
    size: 'sm',
    showLabels: true,
  },
};

/**
 * حجم كبير (Large)
 */
export const LargeSize: Story = {
  args: {
    variant: 'buttons',
    size: 'lg',
    showLabels: true,
  },
};

/**
 * بدون أسماء (No Labels)
 */
export const NoLabels: Story = {
  args: {
    variant: 'buttons',
    size: 'md',
    showLabels: false,
  },
};

/**
 * جميع الأنماط
 * 
 * عرض جميع الأنماط معاً للمقارنة
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8 items-center">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Dropdown</h3>
        <ThemeSwitcher variant="dropdown" />
      </div>
      
      <div>
        <h3 className="mb-4 text-lg font-semibold">Buttons</h3>
        <ThemeSwitcher variant="buttons" />
      </div>
      
      <div>
        <h3 className="mb-4 text-lg font-semibold">Toggle</h3>
        <ThemeSwitcher variant="toggle" />
      </div>
    </div>
  ),
};
