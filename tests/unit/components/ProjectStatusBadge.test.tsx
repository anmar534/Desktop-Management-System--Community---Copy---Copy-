import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectStatusBadge, getStatusLabel, getStatusColorClass } from '@/presentation/components/projects/ProjectStatusBadge';
import { ProjectStatus } from '@/types/project.types';

describe('ProjectStatusBadge', () => {
  describe('Rendering', () => {
    it('renders active status correctly', () => {
      render(<ProjectStatusBadge status="active" />);
      expect(screen.getByText('نشط')).toBeInTheDocument();
      expect(screen.getByTestId('status-badge-active')).toBeInTheDocument();
    });

    it('renders completed status correctly', () => {
      render(<ProjectStatusBadge status="completed" />);
      expect(screen.getByText('مكتمل')).toBeInTheDocument();
    });

    it('renders delayed status correctly', () => {
      render(<ProjectStatusBadge status="delayed" />);
      expect(screen.getByText('متأخر')).toBeInTheDocument();
    });

    it('renders onHold status correctly', () => {
      render(<ProjectStatusBadge status="onHold" />);
      expect(screen.getByText('معلق')).toBeInTheDocument();
    });

    it('renders cancelled status correctly', () => {
      render(<ProjectStatusBadge status="cancelled" />);
      expect(screen.getByText('ملغى')).toBeInTheDocument();
    });

    it('renders planning status correctly', () => {
      render(<ProjectStatusBadge status="planning" />);
      expect(screen.getByText('تخطيط')).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('shows icon when showIcon is true', () => {
      const { container } = render(<ProjectStatusBadge status="active" showIcon />);
      expect(container.textContent).toContain('●');
    });

    it('hides icon when showIcon is false', () => {
      const { container } = render(<ProjectStatusBadge status="active" showIcon={false} />);
      expect(container.textContent).not.toContain('●');
    });

    it('displays correct icon for each status', () => {
      const statuses: Record<ProjectStatus, string> = {
        active: '●',
        completed: '✓',
        delayed: '⚠',
        onHold: '⏸',
        cancelled: '✕',
        planning: '📋',
      };

      Object.entries(statuses).forEach(([status, icon]) => {
        const { container, unmount } = render(
          <ProjectStatusBadge status={status as ProjectStatus} showIcon />
        );
        expect(container.textContent).toContain(icon);
        unmount();
      });
    });
  });

  describe('Sizes', () => {
    it('applies small size classes correctly', () => {
      const { container } = render(<ProjectStatusBadge status="active" size="sm" />);
      const badge = container.querySelector('[data-testid="status-badge-active"]');
      expect(badge?.className).toMatch(/text-xs/);
    });

    it('applies medium size classes correctly', () => {
      const { container } = render(<ProjectStatusBadge status="active" size="md" />);
      const badge = container.querySelector('[data-testid="status-badge-active"]');
      expect(badge?.className).toMatch(/text-sm/);
    });

    it('applies large size classes correctly', () => {
      const { container } = render(<ProjectStatusBadge status="active" size="lg" />);
      const badge = container.querySelector('[data-testid="status-badge-active"]');
      expect(badge?.className).toMatch(/text-base/);
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      const { container } = render(<ProjectStatusBadge status="active" className="custom-class" />);
      const badge = container.querySelector('[data-testid="status-badge-active"]');
      expect(badge?.className).toContain('custom-class');
    });

    it('applies correct color for active status', () => {
      const { container } = render(<ProjectStatusBadge status="active" />);
      const badge = container.querySelector('[data-testid="status-badge-active"]');
      expect(badge?.className).toMatch(/green/);
    });

    it('applies correct color for delayed status', () => {
      const { container } = render(<ProjectStatusBadge status="delayed" />);
      const badge = container.querySelector('[data-testid="status-badge-delayed"]');
      expect(badge?.className).toMatch(/red/);
    });
  });

  describe('Helper Functions', () => {
    it('getStatusLabel returns correct Arabic label', () => {
      expect(getStatusLabel('active')).toBe('نشط');
      expect(getStatusLabel('completed')).toBe('مكتمل');
      expect(getStatusLabel('delayed')).toBe('متأخر');
      expect(getStatusLabel('onHold')).toBe('معلق');
      expect(getStatusLabel('cancelled')).toBe('ملغى');
      expect(getStatusLabel('planning')).toBe('تخطيط');
    });

    it('getStatusColorClass returns correct color classes', () => {
      expect(getStatusColorClass('active')).toMatch(/green/);
      expect(getStatusColorClass('delayed')).toMatch(/red/);
      expect(getStatusColorClass('completed')).toMatch(/blue/);
    });

    it('handles unknown status gracefully', () => {
      const unknownStatus = 'unknown' as ProjectStatus;
      expect(getStatusLabel(unknownStatus)).toBe(unknownStatus);
    });
  });

  describe('Accessibility', () => {
    it('has correct data-testid attribute', () => {
      render(<ProjectStatusBadge status="active" />);
      expect(screen.getByTestId('status-badge-active')).toBeInTheDocument();
    });

    it('icon has aria-hidden when shown', () => {
      const { container } = render(<ProjectStatusBadge status="active" showIcon />);
      const icon = container.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });
  });
});
