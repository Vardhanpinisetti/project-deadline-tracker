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

interface ProjectTableProps {
  projects: Project[];
  onStatusChange: (id: number, status: ProjectStatus) => Promise<{ success: boolean; error?: string }>;
}

export const ProjectTable: React.FC<ProjectTableProps> = ({ projects, onStatusChange }) => {
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const handleStatusSelect = async (projectId: number, newStatus: ProjectStatus) => {
    setUpdatingId(projectId);
    try {
      await onStatusChange(projectId, newStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-surface border border-border backdrop-blur-xl shadow-glass">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-bg-elevated/95 backdrop-blur-md border-b border-border">
            <tr className="text-xs uppercase tracking-wider font-semibold text-text-muted">
              <th scope="col" className="px-6 py-3.5">Project</th>
              <th scope="col" className="px-6 py-3.5">Status</th>
              <th scope="col" className="px-6 py-3.5">Deadline</th>
              <th scope="col" className="px-6 py-3.5">Financials</th>
              <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {projects.map((project) => {
              const overdue = isOverdue(project);
              const overBudget = isOverBudget(project);
              const budgetFullyUsed = isBudgetFullyUsed(project);
              const usagePercent = getBudgetUsagePercentage(project.budget, project.spentAmount);
              const extraAmount = getOverBudgetAmount(project.budget, project.spentAmount);
              const isUpdating = updatingId === project.id;

              return (
                <tr
                  key={project.id}
                  className="group h-16 transition-colors duration-150 ease-out hover:bg-white/[0.03]"
                >
                  {/* Title & Badges */}
                  <td className="px-6 py-3.5 font-medium text-text-primary max-w-xs sm:max-w-md">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm font-semibold tracking-tight text-text-primary group-hover:text-white transition-colors">
                        {project.title}
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {overdue && <OverdueBadge />}
                        {overBudget && (
                          <OverBudgetBadge
                            extraAmountText={`+${formatCurrencyINR(extraAmount)} over`}
                          />
                        )}
                        {budgetFullyUsed && <BudgetFullyUsedBadge />}
                      </div>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <StatusBadge status={project.status} />
                  </td>

                  {/* Deadline (tabular-nums) */}
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {project.deadline ? (
                        <>
                          <Calendar
                            className={`w-4 h-4 shrink-0 ${
                              overdue ? 'text-danger' : 'text-text-muted'
                            }`}
                          />
                          <span
                            className={`text-sm tabular-nums ${
                              overdue
                                ? 'text-danger font-semibold'
                                : 'text-text-secondary'
                            }`}
                          >
                            {formatDate(project.deadline)}
                          </span>
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 text-text-muted italic text-sm">
                          <Minus className="w-3.5 h-3.5" />
                          <span>No deadline</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Financials & Progress bar */}
                  <td className="px-6 py-3.5 min-w-[200px]">
                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-text-muted font-medium">Spent:</span>
                        <div className="text-right">
                          <span
                            className={`font-semibold tabular-nums ${
                              overBudget
                                ? 'text-danger'
                                : 'text-text-primary'
                            }`}
                          >
                            {formatCurrencyINR(project.spentAmount)}
                          </span>
                          <span className="text-text-muted font-normal ml-1 tabular-nums">
                            / {formatCurrencyINR(project.budget)}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar: 6px, rounded-full, track white/8%, fill brand-gradient (danger red when over budget) */}
                      <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-200 ease-out ${
                            overBudget
                              ? 'bg-danger-gradient'
                              : 'bg-brand-gradient'
                          }`}
                          style={{ width: `${usagePercent}%` }}
                          role="progressbar"
                          aria-valuenow={usagePercent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Budget usage: ${usagePercent}%`}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Inline Status Dropdown */}
                  <td className="px-6 py-3.5 whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-2">
                      {isUpdating && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-violet" />
                      )}
                      <div className="relative inline-block">
                        <select
                          value={project.status}
                          disabled={isUpdating}
                          onChange={(e) =>
                            handleStatusSelect(project.id, e.target.value as ProjectStatus)
                          }
                          aria-label={`Change status for ${project.title}`}
                          className="h-8 px-2.5 text-xs font-medium text-text-secondary hover:text-text-primary bg-bg-elevated hover:border-border-strong border border-border rounded-xl pr-7 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-violet/50 transition-all duration-150 ease-out disabled:opacity-50"
                        >
                          <option value="active" className="bg-bg-elevated text-text-primary">
                            Active
                          </option>
                          <option value="completed" className="bg-bg-elevated text-text-primary">
                            Completed
                          </option>
                          <option value="on_hold" className="bg-bg-elevated text-text-primary">
                            On Hold
                          </option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
