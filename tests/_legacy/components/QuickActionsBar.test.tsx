/**
 * Quick Actions Bar Component Tests
 * 
 * اختبارات شاملة لمكون شريط الإجراءات السريعة
 * 
 * @version 1.0.0
 * @date 2024-01-15
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Building, FileText, Calculator, Calendar } from 'lucide-react';
import { QuickActionsBar, defaultQuickActions, type QuickAction } from '@/components/dashboard/enhanced/QuickActionsBar';

// Mock للمكونات الخارجية
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div data-testid="card" className={className} {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div data-testid="card-content" className={className} {...props}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className, ...props }: any) => (
    <button
      type="button"
      data-testid="action-button"
      data-variant={variant}
      data-size={size}
      onClick={onClick}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, ...props }: any) => (
    <span data-testid="badge" className={className} {...props}>
      {children}
    </span>
  ),
}));

vi.mock('@/components/ui/separator', () => ({
  Separator: ({ className, ...props }: any) => (
    <hr data-testid="separator" className={className} {...props} />
  ),
}));

// Mock للـ Tooltip
vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <div data-testid="tooltip-provider">{children}</div>,
  Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
  TooltipTrigger: ({ children, asChild, ...props }: any) => 
    asChild ? React.cloneElement(children, props) : <div {...props}>{children}</div>,
  TooltipContent: ({ children, ...props }: any) => (
    <div data-testid="tooltip-content" {...props}>{children}</div>
  ),
}));

describe('QuickActionsBar', () => {
  const mockActions: QuickAction[] = [
    {
      id: 'new-project',
      label: 'مشروع جديد',
      icon: Building,
      onClick: vi.fn(),
      category: 'projects',
      priority: 'high',
      shortcut: 'Ctrl+N',
      description: 'إنشاء مشروع جديد',
    },
    {
      id: 'new-tender',
      label: 'منافسة جديدة',
      icon: FileText,
      onClick: vi.fn(),
      category: 'tenders',
      priority: 'high',
      badge: 2,
      description: 'تقديم على منافسة جديدة',
    },
    {
      id: 'calculate-cost',
      label: 'حساب التكلفة',
      icon: Calculator,
      onClick: vi.fn(),
      category: 'financial',
      priority: 'medium',
      description: 'حساب تكلفة مشروع',
    },
    {
      id: 'schedule-meeting',
      label: 'جدولة اجتماع',
      icon: Calendar,
      onClick: vi.fn(),
      category: 'projects',
      priority: 'low',
      enabled: false,
      description: 'جدولة اجتماع أو زيارة موقع',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render quick actions bar with title', () => {
      render(<QuickActionsBar actions={mockActions} />);

      expect(screen.getByText('الإجراءات السريعة')).toBeInTheDocument();
    });

    it('should render all enabled actions', () => {
      render(<QuickActionsBar actions={mockActions} />);

      expect(screen.getByText('مشروع جديد')).toBeInTheDocument();
      expect(screen.getByText('منافسة جديدة')).toBeInTheDocument();
      expect(screen.getByText('حساب التكلفة')).toBeInTheDocument();
      // الإجراء المعطل لا يجب أن يظهر
      expect(screen.queryByText('جدولة اجتماع')).not.toBeInTheDocument();
    });

    it('should render actions sorted by priority', () => {
      render(<QuickActionsBar actions={mockActions} />);

      const buttons = screen.getAllByTestId('action-button');
      const buttonTexts = buttons.map(button => button.textContent);
      
      // الإجراءات عالية الأولوية يجب أن تظهر أولاً
      expect(buttonTexts[0]).toContain('مشروع جديد');
      expect(buttonTexts[1]).toContain('منافسة جديدة');
      expect(buttonTexts[2]).toContain('حساب التكلفة');
    });
  });

  describe('Action Interaction', () => {
    it('should call onClick when action button is clicked', () => {
      const mockOnClick = vi.fn();
      const actions = [
        {
          ...mockActions[0],
          onClick: mockOnClick,
        },
      ];

      render(<QuickActionsBar actions={actions} />);

      const button = screen.getByText('مشروع جديد');
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should not render disabled actions', () => {
      const actions = [
        {
          ...mockActions[0],
          enabled: false,
        },
      ];

      render(<QuickActionsBar actions={actions} />);

      expect(screen.queryByText('مشروع جديد')).not.toBeInTheDocument();
    });
  });

  describe('Badge Display', () => {
    it('should render badge when action has badge number', () => {
      render(<QuickActionsBar actions={mockActions} />);

      const badges = screen.getAllByTestId('badge');
      expect(badges).toHaveLength(1);
      expect(badges[0]).toHaveTextContent('2');
    });

    it('should render 99+ for badges over 99', () => {
      const actions = [
        {
          ...mockActions[1],
          badge: 150,
        },
      ];

      render(<QuickActionsBar actions={actions} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('99+');
    });

    it('should not render badge when badge is 0', () => {
      const actions = [
        {
          ...mockActions[1],
          badge: 0,
        },
      ];

      render(<QuickActionsBar actions={actions} />);

      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    });
  });

  describe('Layout Options', () => {
    it('should render with horizontal layout by default', () => {
      render(<QuickActionsBar actions={mockActions} />);

      const container = screen.getByTestId('card-content');
      expect(container).toBeInTheDocument();
    });

    it('should render with grid layout when specified', () => {
      render(<QuickActionsBar actions={mockActions} layout="grid" />);

      const container = screen.getByTestId('card-content');
      expect(container).toBeInTheDocument();
    });

    it('should hide labels when showLabels is false', () => {
      render(<QuickActionsBar actions={mockActions} showLabels={false} />);

      const buttons = screen.getAllByTestId('action-button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('data-size', 'icon');
      });
    });

    it('should show labels when showLabels is true', () => {
      render(<QuickActionsBar actions={mockActions} showLabels={true} />);

      const buttons = screen.getAllByTestId('action-button');
      expect(buttons[0]).toHaveTextContent('مشروع جديد');
      expect(buttons[1]).toHaveTextContent('منافسة جديدة');
    });
  });

  describe('Categories', () => {
    it('should group actions by category when showCategories is true', () => {
      render(<QuickActionsBar actions={mockActions} showCategories={true} />);

      expect(screen.getByText('المشاريع')).toBeInTheDocument();
      expect(screen.getByText('المنافسات')).toBeInTheDocument();
      expect(screen.getByText('المالية')).toBeInTheDocument();
    });

    it('should not show category headers when showCategories is false', () => {
      render(<QuickActionsBar actions={mockActions} showCategories={false} />);

      expect(screen.queryByText('المشاريع')).not.toBeInTheDocument();
      expect(screen.queryByText('المنافسات')).not.toBeInTheDocument();
    });

    it('should render separators between categories', () => {
      render(<QuickActionsBar actions={mockActions} showCategories={true} />);

      const separators = screen.getAllByTestId('separator');
      expect(separators.length).toBeGreaterThan(0);
    });
  });

  describe('Max Visible Actions', () => {
    it('should limit visible actions to maxVisible', () => {
      render(<QuickActionsBar actions={mockActions} maxVisible={2} />);

      const buttons = screen.getAllByTestId('action-button');
      // يجب أن يكون هناك 2 أزرار إجراء + زر "المزيد"
      expect(buttons.length).toBeLessThanOrEqual(3);
    });

    it('should show "More" button when there are hidden actions', () => {
      render(<QuickActionsBar actions={mockActions} maxVisible={2} />);

      expect(screen.getByText(/المزيد/)).toBeInTheDocument();
    });

    it('should not show "More" button when all actions are visible', () => {
      render(<QuickActionsBar actions={mockActions} maxVisible={10} />);

      expect(screen.queryByText(/المزيد/)).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should handle keyboard shortcuts when enabled', async () => {
      const mockOnClick = vi.fn();
      const actions = [
        {
          ...mockActions[0],
          onClick: mockOnClick,
          shortcut: 'Ctrl+N',
        },
      ];

      render(<QuickActionsBar actions={actions} enableKeyboardShortcuts={true} />);

      // محاكاة ضغط Ctrl+N
      fireEvent.keyDown(document, { key: 'n', ctrlKey: true });

      await waitFor(() => {
        expect(mockOnClick).toHaveBeenCalledTimes(1);
      });
    });

    it('should not handle keyboard shortcuts when disabled', async () => {
      const mockOnClick = vi.fn();
      const actions = [
        {
          ...mockActions[0],
          onClick: mockOnClick,
          shortcut: 'Ctrl+N',
        },
      ];

      render(<QuickActionsBar actions={actions} enableKeyboardShortcuts={false} />);

      fireEvent.keyDown(document, { key: 'n', ctrlKey: true });

      await waitFor(() => {
        expect(mockOnClick).not.toHaveBeenCalled();
      });
    });
  });

  describe('Default Actions', () => {
    it('should use default actions when no actions provided', () => {
      render(<QuickActionsBar />);

      // يجب أن تظهر بعض الإجراءات الافتراضية
      expect(screen.getByText('الإجراءات السريعة')).toBeInTheDocument();
      
      const buttons = screen.getAllByTestId('action-button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should render default actions correctly', () => {
      render(<QuickActionsBar actions={defaultQuickActions} />);

      const buttons = screen.getAllByTestId('action-button');
      expect(buttons.length).toBeGreaterThan(0);

      // التحقق من وجود بعض الإجراءات الافتراضية
      const buttonTexts = buttons.map(btn => btn.textContent);
      expect(buttonTexts.some(text => text?.includes('مشروع جديد'))).toBe(true);
      expect(buttonTexts.some(text => text?.includes('منافسة جديدة'))).toBe(true);
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      render(<QuickActionsBar actions={mockActions} className="custom-class" />);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
    });

    it('should apply action colors when provided', () => {
      const actions = [
        {
          ...mockActions[0],
          color: '#ff0000',
        },
      ];

      render(<QuickActionsBar actions={actions} />);

      const button = screen.getByTestId('action-button');
      expect(button).toHaveStyle({
        '--action-color': '#ff0000',
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<QuickActionsBar actions={mockActions} />);

      const buttons = screen.getAllByTestId('action-button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('should be keyboard navigable', () => {
      render(<QuickActionsBar actions={mockActions} />);

      const firstButton = screen.getAllByTestId('action-button')[0];
      firstButton.focus();
      
      expect(document.activeElement).toBe(firstButton);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty actions array', () => {
      render(<QuickActionsBar actions={[]} />);

      expect(screen.getByText('الإجراءات السريعة')).toBeInTheDocument();
      expect(screen.queryAllByTestId('action-button')).toHaveLength(0);
    });

    it('should handle actions without shortcuts', () => {
      const actions = [
        {
          ...mockActions[0],
          shortcut: undefined,
        },
      ];

      render(<QuickActionsBar actions={actions} />);

      const button = screen.getByTestId('action-button');
      expect(button).toHaveTextContent('مشروع جديد');
    });

    it('should handle actions without descriptions', () => {
      const actions = [
        {
          ...mockActions[0],
          description: undefined,
        },
      ];

      render(<QuickActionsBar actions={actions} />);

      const button = screen.getByTestId('action-button');
      expect(button).toHaveTextContent('مشروع جديد');
    });
  });
});
