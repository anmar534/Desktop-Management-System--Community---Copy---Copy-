import type React from 'react';
import clsx from 'clsx';
import { Users } from 'lucide-react';
import type { TeamStatusData, BaseWidgetProps, TeamMemberState } from '../types';
import { WidgetContainer, type WidgetStatusVariant } from './WidgetContainer';

export interface TeamStatusWidgetProps extends Omit<BaseWidgetProps, 'data'> {
  data: TeamStatusData;
}

const statusDotClass: Record<TeamMemberState['status'], string> = {
  online: 'bg-success',
  offline: 'bg-muted-foreground/50',
  busy: 'bg-warning',
};

export const TeamStatusWidget: React.FC<TeamStatusWidgetProps> = ({ data, loading, error, onRefresh }) => {
  const { title, subtitle, members, status = 'normal' } = data;
  const statusVariant: WidgetStatusVariant = status === 'normal' ? 'default' : status;

  return (
    <WidgetContainer
      title={title}
      description={subtitle}
      icon={<Users className="h-4 w-4 text-primary" />}
      status={statusVariant}
      isLoading={loading}
      error={error}
      onRefresh={onRefresh}
    >
      <ul className="flex flex-col gap-3">
        {members.map((member) => (
          <li key={member.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/70 px-3 py-2">
            <div className="flex items-center gap-3">
              <span className={clsx('h-2.5 w-2.5 rounded-full', statusDotClass[member.status])} />
              <div className="flex flex-col text-right">
                <span className="text-sm font-semibold text-foreground">{member.name}</span>
                {member.role && <span className="text-xs text-muted-foreground">{member.role}</span>}
              </div>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              {member.metricLabel && (
                <div className="font-medium text-foreground">{member.metricValue ?? '--'}</div>
              )}
              {member.metricLabel && <div>{member.metricLabel}</div>}
            </div>
          </li>
        ))}
      </ul>
    </WidgetContainer>
  );
};

export default TeamStatusWidget;
