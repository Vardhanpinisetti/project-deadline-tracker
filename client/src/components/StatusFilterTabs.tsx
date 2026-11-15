import React from 'react';
import { StatusFilter } from '../types';

interface StatusFilterTabsProps {
  currentFilter: StatusFilter;
  counts: {
    all: number;
    active: number;
    completed: number;
    on_hold: number;
  };
  onFilterChange: (filter: StatusFilter) => void;
}

export const StatusFilterTabs: React.FC<StatusFilterTabsProps> = ({
  currentFilter,
  counts,
  onFilterChange,
}) => {
  const tabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'active', label: 'Active', count: counts.active },
    { key: 'completed', label: 'Completed', count: counts.completed },
    { key: 'on_hold', label: 'On hold', count: counts.on_hold },
  ];

  return (
    <div className="overflow-x-auto max-w-full py-0.5">
      <div
        role="tablist"
        aria-label="Filter projects by status"
        className="inline-flex p-1 solar-glass rounded-full min-w-max"
      >
        {tabs.map((tab) => {
          const isActive = currentFilter === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => onFilterChange(tab.key)}
              className={`relative flex items-center gap-2 px-3.5 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shrink-0 ${
                isActive
                  ? 'bg-accent-gradient text-[#05060B] shadow-solar-glow'
                  : 'text-muted hover:text-[#FFF6EA] hover:bg-white/[0.04]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 text-[11px] rounded-full tabular-nums font-semibold transition-colors ${
                  isActive
                    ? 'bg-black/20 text-[#05060B]'
                    : 'bg-white/[0.08] text-muted'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
