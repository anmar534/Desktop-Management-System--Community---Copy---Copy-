import type { ReactNode } from 'react';
import { cn } from '../utils';

export type ActionBarAlignment = 'start' | 'center' | 'end' | 'between';
export type ActionBarPosition = 'top' | 'bottom';

const ALIGNMENT_MAP: Record<ActionBarAlignment, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
};

const POSITION_BORDER: Record<ActionBarPosition, string> = {
  top: 'border-b',
  bottom: 'border-t',
};

export interface ActionBarProps {
  children: ReactNode;
  align?: ActionBarAlignment;
  sticky?: boolean;
  position?: ActionBarPosition;
  elevated?: boolean;
  subdued?: boolean;
  className?: string;
}

export const ActionBar = ({
  children,
  align = 'between',
  sticky = false,
  position = 'bottom',
  elevated = false,
  subdued = false,
  className,
}: ActionBarProps) => {
  const stickyClasses = sticky
    ? cn('sticky z-sticky', position === 'bottom' ? 'bottom-0' : 'top-0')
    : undefined;

  const backgroundClass = subdued ? 'bg-muted/70 supports-[backdrop-filter]:bg-muted/50' : 'bg-card/90 supports-[backdrop-filter]:bg-card/70';

  return (
    <div className={cn('w-full', stickyClasses)}>
      <div
        className={cn(
          'flex flex-wrap items-center gap-2 border px-4 py-3 backdrop-blur-sm transition-shadow duration-200',
          backgroundClass,
          ALIGNMENT_MAP[align],
          POSITION_BORDER[position],
          elevated ? 'shadow-md' : 'shadow-sm shadow-transparent',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default ActionBar;
