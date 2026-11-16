import React, { useState } from 'react';
import { Project, ProjectStatus } from '../types';
import { OverdueBadge, OverBudgetBadge, BudgetFullyUsedBadge } from './Badge';
import { formatCurrencyINR, formatDate } from '../lib/format';
import {
  isOverdue,
  isOverBudget,
  isBudgetFullyUsed,
  getBudgetUsagePercentage,
  getOverBudgetAmount,
} from '../lib/projectRules';
import { Calendar, Minus, ChevronDown, Loader2 } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onStatusChange: (id: number, status: ProjectStatus) => Promise<{ success: boolean; error?: string }>;
  onHover?: (id: number | null) => void;
}

const statusConfigs: Record<
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

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onStatusChange,
  onHover,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const overdue = isOverdue(project);
  const overBudget = isOverBudget(project);
  const budgetFullyUsed = isBudgetFullyUsed(project);
  const usagePercent = getBudgetUsagePercentage(project.budget, project.spentAmount);
  const extraAmount = getOverBudgetAmount(project.budget, project.spentAmount);

  const statusConfig = statusConfigs[project.status] || statusConfigs.active;

  const handleStatusChange = async (newStatus: ProjectStatus) => {
    setIsUpdating(true);
    try {
      await onStatusChange(project.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <article
      aria-labelledby={`project-title-${project.id}`}
      onMouseEnter={() => onHover?.(project.id)}
      onMouseLeave={() => onHover?.(null)}
      className="solar-glass solar-glass-hover rounded-[18px] transition-all duration-200"
      style={{ padding: '18px 20px' }}
    >
      <div className="flex flex-col gap-2.5">
        {/* 1. Title and Status Select on one row */}
        <div className="flex items-start justify-between gap-3">
          <h3
            id={`project-title-${project.id}`}
            style={{
              color: '#FFF6EA',
              fontWeight: 600,
              fontSize: 'max(17px, calc(17 * var(--u, 1px)))',
            }}
            className="card-project-title break-words tracking-tight flex-1 pr-2"
          >
            {project.title}
          </h3>

          <div className="shrink-0 relative inline-flex items-center">
            {/* Status Select Pill (min 12px) */}
            <span
              aria-hidden="true"
              style={{ fontSize: 'max(12px, calc(12 * var(--u, 1px)))' }}
              className={`inline-flex items-center gap-1.5 font-semibold rounded-full border px-2.5 py-1 pointer-events-none transition-colors ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
              <span>{statusConfig.label}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </span>
            <select
              value={project.status}
              disabled={isUpdating}
              onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
              aria-label={`Change status for ${project.title}`}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            >
              <option value="active" className="bg-[#0B1020] text-[#FFF6EA]">Active</option>
              <option value="completed" className="bg-[#0B1020] text-[#FFF6EA]">Completed</option>
              <option value="on_hold" className="bg-[#0B1020] text-[#FFF6EA]">On hold</option>
            </select>
            {isUpdating && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-accent ml-1.5" />
            )}
          </div>
        </div>

        {/* 2. Badges row (Overdue / Over budget / Budget fully used) */}
        {(overdue || overBudget || budgetFullyUsed) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {overdue && <OverdueBadge />}
            {overBudget && (
              <OverBudgetBadge
                extraAmountText={`+${formatCurrencyINR(extraAmount)}`}
              />
            )}
            {budgetFullyUsed && <BudgetFullyUsedBadge />}
          </div>
        )}

        {/* 3. Due date line (min 14px) */}
        <div
          className="flex items-center gap-2"
          style={{ fontSize: 'max(14px, calc(14 * var(--u, 1px)))' }}
        >
          {project.deadline ? (
            <>
              <Calendar
                className={`w-3.5 h-3.5 shrink-0 ${
                  overdue ? 'text-alert-red' : 'text-muted'
                }`}
                aria-hidden="true"
              />
              <span
                className={`tabular-nums ${
                  overdue
                    ? 'text-alert-red font-semibold'
                    : 'text-muted'
                }`}
              >
                Due {formatDate(project.deadline)}
              </span>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-muted italic">
              <Minus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>No deadline</span>
            </div>
          )}
        </div>

        {/* 4. Spent row with the progress bar (min 14px) */}
        <div className="space-y-1.5 pt-0.5">
          <div
            className="flex items-center justify-between"
            style={{ fontSize: 'max(14px, calc(14 * var(--u, 1px)))' }}
          >
            <span className="text-muted">Spent:</span>
            <div>
              <span
                className={`font-semibold tabular-nums ${
                  overBudget ? 'text-alert-red' : 'text-[#FFF6EA]'
                }`}
              >
                {formatCurrencyINR(project.spentAmount)}
              </span>
              <span className="text-muted font-normal ml-1 tabular-nums">
                / {formatCurrencyINR(project.budget)}
              </span>
            </div>
          </div>

          {/* Progress bar: 7px height, background rgba(255,255,255,.07), fill linear-gradient or #FF4D5E */}
          <div className="solar-progress-bar w-full">
            <div
              className={`solar-progress-fill ${overBudget ? 'over-budget' : ''}`}
              style={{ width: `${usagePercent}%` }}
              role="progressbar"
              aria-valuenow={usagePercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Budget usage: ${usagePercent}%`}
            />
          </div>
        </div>
      </div>
    </article>
  );
};
