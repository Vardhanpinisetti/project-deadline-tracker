import React from 'react';
import { FolderKanban, FilterX, Plus } from 'lucide-react';
import { Button } from './Button';
import { StatusFilter } from '../types';

interface EmptyStateProps {
  currentFilter: StatusFilter;
  onClearFilter: () => void;
  onAddNew: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  currentFilter,
  onClearFilter,
  onAddNew,
}) => {
  const isFiltered = currentFilter !== 'all';

  const filterNames: Record<StatusFilter, string> = {
    all: 'projects',
    active: 'active projects',
    completed: 'completed projects',
    on_hold: 'on-hold projects',
  };

  return (
    <div className="solar-glass p-12 text-center rounded-[18px] my-4 flex flex-col items-center justify-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-accent/15 border border-accent/30 text-accent mb-4 shadow-inner">
        {isFiltered ? (
          <FilterX className="w-6 h-6" />
        ) : (
          <FolderKanban className="w-6 h-6" />
        )}
      </div>

      <h3 className="text-base font-semibold text-[#FFF6EA]">
        {isFiltered
          ? `No ${filterNames[currentFilter]} found`
          : 'No projects added yet'}
      </h3>

      <p className="mt-1 text-sm text-muted max-w-sm">
        {isFiltered
          ? `There are currently no projects matching the "${currentFilter.replace('_', ' ')}" status filter.`
          : 'Add your first project to start tracking deadlines and client budgets.'}
      </p>

      <div className="mt-6 flex items-center gap-3">
        {isFiltered ? (
          <Button variant="secondary" size="md" onClick={onClearFilter}>
            Clear filter
          </Button>
        ) : null}
        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={onAddNew}
        >
          {isFiltered ? 'New project' : 'Add your first project'}
        </Button>
      </div>
    </div>
  );
};
