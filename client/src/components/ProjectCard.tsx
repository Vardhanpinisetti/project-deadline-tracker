import React, { useState } from 'react';
import { Project, ProjectStatus } from '../types';
import { StatusBadge, OverdueBadge, OverBudgetBadge, BudgetFullyUsedBadge } from './Badge';
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
      className="solar-glass solar-glass-hover p-4 sm:p-5 space-y-4 rounded-[18px]"
    >
      {/* Top Header: Title & Badges */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h3
            id={`project-title-${project.id}`}
            className="text-base font-semibold text-[#FFF6EA] tracking-tight break-words"
          >
            {project.title}
          </h3>
          <div className="shrink-0">
            <StatusBadge status={project.status} size="sm" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {overdue && <OverdueBadge />}
          {overBudget && (
            <OverBudgetBadge
              extraAmountText={`+${formatCurrencyINR(extraAmount)}`}
            />
          )}
          {budgetFullyUsed && <BudgetFullyUsedBadge />}
        </div>
      </div>

      {/* Deadline */}
      <div className="flex items-center gap-2 text-xs">
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
                  ? 'text-alert-red font-bold'
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

      {/* Financials & Progress bar */}
      <div className="space-y-1.5 pt-2 border-t border-[rgba(255,180,84,0.12)]">
        <div className="flex items-center justify-between text-xs">
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

      {/* Inline status selector */}
      <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,180,84,0.12)] text-xs text-muted">
        <span>Status:</span>
        <div className="relative inline-flex items-center gap-2">
          {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />}
          <select
            value={project.status}
            disabled={isUpdating}
            onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
            aria-label={`Change status for ${project.title}`}
            className="min-h-[44px] px-3 text-xs font-semibold text-[#FFF6EA] bg-[#0B1020] border border-[rgba(255,180,84,0.22)] hover:border-[rgba(255,180,84,0.45)] rounded-xl pr-8 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/60 transition-colors"
          >
            <option value="active" className="bg-[#0B1020] text-[#FFF6EA]">Active</option>
            <option value="completed" className="bg-[#0B1020] text-[#FFF6EA]">Completed</option>
            <option value="on_hold" className="bg-[#0B1020] text-[#FFF6EA]">On hold</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        </div>
      </div>
    </article>
  );
};
