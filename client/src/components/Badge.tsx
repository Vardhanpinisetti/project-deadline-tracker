import React from 'react';
import { ProjectStatus } from '../types';
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

interface StatusBadgeProps {
  status: ProjectStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const configs: Record<
    ProjectStatus,
    { label: string; bg: string; text: string; border: string; dot: string }
  > = {
    active: {
      label: 'Active',
      bg: 'bg-[#35D49A]/15',
      text: 'text-[#35D49A]',
      border: 'border-[#35D49A]/40',
      dot: 'bg-[#35D49A]',
    },
    completed: {
      label: 'Completed',
      bg: 'bg-[#5B93FF]/15',
      text: 'text-[#5B93FF]',
      border: 'border-[#5B93FF]/40',
      dot: 'bg-[#5B93FF]',
    },
    on_hold: {
      label: 'On hold',
      bg: 'bg-[#E8C14A]/15',
      text: 'text-[#E8C14A]',
      border: 'border-[#E8C14A]/40',
      dot: 'bg-[#E8C14A]',
    },
  };

  const config = configs[status] || configs.active;
  const padding = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${config.bg} ${config.text} ${config.border} ${padding}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};

export const OverdueBadge: React.FC = () => {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-[#FF4D5E]/15 text-[#FF4D5E] border border-[#FF4D5E]/40">
      <Clock className="w-3.5 h-3.5 text-[#FF4D5E] shrink-0" aria-hidden="true" />
      <span>Overdue</span>
    </span>
  );
};

export const OverBudgetBadge: React.FC<{ extraAmountText?: string }> = ({ extraAmountText }) => {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-[#FF4D5E]/15 text-[#FF4D5E] border border-[#FF4D5E]/40">
      <AlertTriangle className="w-3.5 h-3.5 text-[#FF4D5E] shrink-0" aria-hidden="true" />
      <span>
        Over budget {extraAmountText && <span className="font-normal opacity-90">({extraAmountText})</span>}
      </span>
    </span>
  );
};

export const BudgetFullyUsedBadge: React.FC = () => {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-[#B6A78F]/15 text-[#FFF6EA] border border-[#B6A78F]/40">
      <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" aria-hidden="true" />
      <span>Budget fully used</span>
    </span>
  );
};
