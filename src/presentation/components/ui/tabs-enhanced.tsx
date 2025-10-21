/**
 * Enhanced Tabs Component
 *
 * مكون Tabs محسّن للصفحات المعقدة مثل المالية
 * مستوحى من Procore و Autodesk ACC
 *
 * @version 1.0.0
 * @date 2025-10-08
 */

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

// ============================================
// Tabs Variants
// ============================================

const tabsListVariants = cva(
  'inline-flex items-center justify-start gap-1',
  {
    variants: {
      variant: {
        default: 'p-1 bg-muted rounded-lg',
        underline: 'border-b border-border',
        pills: 'gap-2',
      },
      size: {
        sm: 'text-sm',
        default: 'text-base',
        lg: 'text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const tabsTriggerVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap px-4 py-2 font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-background/50',
        underline:
          'border-b-2 border-transparent rounded-none data-[state=active]:border-primary data-[state=active]:text-primary hover:text-primary/80',
        pills:
          'rounded-full border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        sm: 'text-sm px-3 py-1.5',
        default: 'text-sm px-4 py-2',
        lg: 'text-base px-5 py-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

// ============================================
// Tab Item Interface
// ============================================

export interface TabItem {
  /**
   * معرّف التبويب (قيمة فريدة)
   */
  value: string;

  /**
   * النص المعروض
   */
  label: string;

  /**
   * أيقونة التبويب (اختياري)
   */
  icon?: LucideIcon;

  /**
   * Badge count (عدد العناصر - اختياري)
   */
  count?: number;

  /**
   * تعطيل التبويب
   */
  disabled?: boolean;

  /**
   * محتوى التبويب
   */
  content: React.ReactNode;
}

// ============================================
// Enhanced Tabs Component
// ============================================

export interface EnhancedTabsProps
  extends Omit<
      React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>,
      'children'
    >,
    VariantProps<typeof tabsListVariants> {
  /**
   * قائمة التبويبات
   */
  tabs: TabItem[];

  /**
   * التبويب النشط الافتراضي
   */
  defaultValue?: string;

  /**
   * دالة يتم استدعاؤها عند تغيير التبويب
   */
  onTabChange?: (value: string) => void;

  /**
   * محاذاة التبويبات
   * @default "start"
   */
  align?: 'start' | 'center' | 'end';

  /**
   * عرض Badge للعدد
   * @default true
   */
  showCount?: boolean;

  /**
   * إضافة animation عند تغيير المحتوى
   * @default true
   */
  animated?: boolean;
}

export const EnhancedTabs = React.forwardRef<
  HTMLDivElement,
  EnhancedTabsProps
>(
  (
    {
      tabs,
      defaultValue,
      onTabChange,
      variant = 'default',
      size = 'default',
      align = 'start',
      showCount = true,
      animated = true,
      className,
      ...props
    },
    ref
  ) => {
    const alignmentClasses = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
    };

    return (
      <TabsPrimitive.Root
        ref={ref}
  defaultValue={defaultValue ?? tabs[0]?.value}
        onValueChange={onTabChange}
        className={cn('w-full', className)}
        {...props}
      >
        <TabsPrimitive.List
          className={cn(
            tabsListVariants({ variant, size }),
            alignmentClasses[align]
          )}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <TabsPrimitive.Trigger
                key={tab.value}
                value={tab.value}
                disabled={tab.disabled}
                className={cn(tabsTriggerVariants({ variant, size }))}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{tab.label}</span>
                {showCount && tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={cn(
                      'inline-flex items-center justify-center rounded-full text-xs font-medium px-2 py-0.5',
                      variant === 'pills'
                        ? 'bg-background text-foreground'
                        : 'bg-primary/10 text-primary'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </TabsPrimitive.Trigger>
            );
          })}
        </TabsPrimitive.List>

        <div className="mt-6">
          {tabs.map((tab) => (
            <TabsPrimitive.Content
              key={tab.value}
              value={tab.value}
              className="focus:outline-none"
            >
              {animated ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {tab.content}
                </motion.div>
              ) : (
                tab.content
              )}
            </TabsPrimitive.Content>
          ))}
        </div>
      </TabsPrimitive.Root>
    );
  }
);

EnhancedTabs.displayName = 'EnhancedTabs';

// ============================================
// Vertical Tabs Variant
// ============================================

export interface VerticalTabsProps extends EnhancedTabsProps {
  /**
   * عرض قائمة التبويبات
   * @default "250px"
   */
  sidebarWidth?: string;
}

export const VerticalTabs = React.forwardRef<
  HTMLDivElement,
  VerticalTabsProps
>(
  (
    {
      tabs,
      defaultValue,
      onTabChange,
      sidebarWidth = '250px',
      showCount = true,
      animated = true,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <TabsPrimitive.Root
        ref={ref}
  defaultValue={defaultValue ?? tabs[0]?.value}
        onValueChange={onTabChange}
        className={cn('w-full flex gap-6', className)}
        orientation="vertical"
        {...props}
      >
        <TabsPrimitive.List
          className="flex flex-col gap-1 p-1 bg-muted rounded-lg"
          style={{ width: sidebarWidth, minWidth: sidebarWidth }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <TabsPrimitive.Trigger
                key={tab.value}
                value={tab.value}
                disabled={tab.disabled}
                className={cn(
                  'inline-flex items-center justify-between gap-2 w-full px-4 py-3 text-right rounded-md font-medium',
                  'transition-all ring-offset-background',
                  'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
                  'hover:bg-background/50',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'disabled:pointer-events-none disabled:opacity-50'
                )}
              >
                <div className="flex items-center gap-2">
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{tab.label}</span>
                </div>
                {showCount && tab.count !== undefined && tab.count > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium px-2 py-0.5">
                    {tab.count}
                  </span>
                )}
              </TabsPrimitive.Trigger>
            );
          })}
        </TabsPrimitive.List>

        <div className="flex-1">
          {tabs.map((tab) => (
            <TabsPrimitive.Content
              key={tab.value}
              value={tab.value}
              className="focus:outline-none h-full"
            >
              {animated ? (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {tab.content}
                </motion.div>
              ) : (
                tab.content
              )}
            </TabsPrimitive.Content>
          ))}
        </div>
      </TabsPrimitive.Root>
    );
  }
);

VerticalTabs.displayName = 'VerticalTabs';
