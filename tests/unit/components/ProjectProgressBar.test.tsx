import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectProgressBar, getProgressStatus } from '@/presentation/components/projects/ProjectProgressBar';

describe('ProjectProgressBar', () => {
  describe('Rendering', () => {
    it('renders progress bar with correct value', () => {
      render(<ProjectProgressBar progress={75} />);
      expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    });

    it('renders outside label by default', () => {
      render(<ProjectProgressBar progress={50} />);
      expect(screen.getByTestId('progress-label-outside')).toHaveTextContent('50%');
    });

    it('renders inside label when labelPosition is inside', () => {
      render(<ProjectProgressBar progress={60} labelPosition="inside" />);
      expect(screen.getByTestId('progress-label-inside')).toHaveTextContent('60%');
    });

    it('renders both labels when labelPosition is both', () => {
      render(<ProjectProgressBar progress={80} labelPosition="both" />);
      expect(screen.getByTestId('progress-label-outside')).toBeInTheDocument();
      expect(screen.getByTestId('progress-label-inside')).toBeInTheDocument();
    });

    it('hides labels when showLabel is false', () => {
      render(<ProjectProgressBar progress={40} showLabel={false} />);
      expect(screen.queryByTestId('progress-label-outside')).not.toBeInTheDocument();
      expect(screen.queryByTestId('progress-label-inside')).not.toBeInTheDocument();
    });
  });

  describe('Progress Clamping', () => {
    it('clamps negative progress to 0', () => {
      render(<ProjectProgressBar progress={-10} />);
      expect(screen.getByTestId('progress-label-outside')).toHaveTextContent('0%');
    });

    it('clamps progress over 100 to 100', () => {
      render(<ProjectProgressBar progress={150} />);
      expect(screen.getByTestId('progress-label-outside')).toHaveTextContent('100%');
    });

    it('handles decimal progress values', () => {
      render(<ProjectProgressBar progress={45.7} />);
      expect(screen.getByTestId('progress-label-outside')).toHaveTextContent('46%');
    });

    it('handles zero progress', () => {
      render(<ProjectProgressBar progress={0} />);
      expect(screen.getByTestId('progress-label-outside')).toHaveTextContent('0%');
    });

    it('handles full progress', () => {
      render(<ProjectProgressBar progress={100} />);
      expect(screen.getByTestId('progress-label-outside')).toHaveTextContent('100%');
    });
  });

  describe('Height Variants', () => {
    it('renders small height correctly', () => {
      const { container } = render(<ProjectProgressBar progress={50} height="sm" />);
      const progressBar = container.querySelector('[data-testid="progress-bar"]');
      expect(progressBar?.className).toMatch(/h-2/);
    });

    it('renders medium height correctly', () => {
      const { container } = render(<ProjectProgressBar progress={50} height="md" />);
      const progressBar = container.querySelector('[data-testid="progress-bar"]');
      expect(progressBar?.className).toMatch(/h-3/);
    });

    it('renders large height correctly', () => {
      const { container } = render(<ProjectProgressBar progress={50} height="lg" />);
      const progressBar = container.querySelector('[data-testid="progress-bar"]');
      expect(progressBar?.className).toMatch(/h-4/);
    });

    it('does not show inside label for small height', () => {
      render(<ProjectProgressBar progress={50} height="sm" labelPosition="inside" />);
      expect(screen.queryByTestId('progress-label-inside')).not.toBeInTheDocument();
    });
  });

  describe('Color Variants', () => {
    it('auto color shows green for high progress (>=75%)', () => {
      const { container } = render(<ProjectProgressBar progress={80} variant="auto" />);
      const progressBar = container.querySelector('[data-testid="progress-bar"]');
      expect(progressBar?.className).toMatch(/green/);
    });

    it('auto color shows blue for medium progress (50-74%)', () => {
      const { container } = render(<ProjectProgressBar progress={60} variant="auto" />);
      const progressBar = container.querySelector('[data-testid="progress-bar"]');
      expect(progressBar?.className).toMatch(/blue/);
    });

    it('auto color shows yellow for low-medium progress (25-49%)', () => {
      const { container } = render(<ProjectProgressBar progress={30} variant="auto" />);
      const progressBar = container.querySelector('[data-testid="progress-bar"]');
      expect(progressBar?.className).toMatch(/yellow/);
    });

    it('auto color shows red for very low progress (<25%)', () => {
      const { container } = render(<ProjectProgressBar progress={10} variant="auto" />);
      const progressBar = container.querySelector('[data-testid="progress-bar"]');
      expect(progressBar?.className).toMatch(/red/);
    });

    it('applies success variant color', () => {
      const { container } = render(<ProjectProgressBar progress={30} variant="success" />);
      const progressBar = container.querySelector('[data-testid="progress-bar"]');
      expect(progressBar?.className).toMatch(/green/);
    });

    it('applies warning variant color', () => {
      const { container } = render(<ProjectProgressBar progress={80} variant="warning" />);
      const progressBar = container.querySelector('[data-testid="progress-bar"]');
      expect(progressBar?.className).toMatch(/yellow/);
    });

    it('applies danger variant color', () => {
      const { container } = render(<ProjectProgressBar progress={90} variant="danger" />);
      const progressBar = container.querySelector('[data-testid="progress-bar"]');
      expect(progressBar?.className).toMatch(/red/);
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      render(<ProjectProgressBar progress={50} className="custom-class" />);
      const container = screen.getByTestId('progress-bar-container');
      expect(container.className).toContain('custom-class');
    });
  });

  describe('Helper Functions', () => {
    it('getProgressStatus returns correct status for 0%', () => {
      expect(getProgressStatus(0)).toBe('لم يبدأ');
    });

    it('getProgressStatus returns correct status for 100%', () => {
      expect(getProgressStatus(100)).toBe('مكتمل');
    });

    it('getProgressStatus returns correct status for >=75%', () => {
      expect(getProgressStatus(80)).toBe('متقدم جيداً');
    });

    it('getProgressStatus returns correct status for 50-74%', () => {
      expect(getProgressStatus(60)).toBe('في المسار');
    });

    it('getProgressStatus returns correct status for 25-49%', () => {
      expect(getProgressStatus(40)).toBe('في البداية');
    });

    it('getProgressStatus returns correct status for <25%', () => {
      expect(getProgressStatus(15)).toBe('متأخر');
    });
  });

  describe('Accessibility', () => {
    it('has correct data-testid attributes', () => {
      render(<ProjectProgressBar progress={50} />);
      expect(screen.getByTestId('progress-bar-container')).toBeInTheDocument();
      expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    });

    it('inside label has aria-hidden', () => {
      const { container } = render(<ProjectProgressBar progress={50} labelPosition="inside" />);
      const insideLabel = container.querySelector('[data-testid="progress-label-inside"]');
      expect(insideLabel).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
