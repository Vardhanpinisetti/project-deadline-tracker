import React, { useState, Suspense, lazy } from 'react';
import { useProjects } from '../hooks/useProjects';
import { StatCard } from '../components/StatCard';
import { StatusFilterTabs } from '../components/StatusFilterTabs';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectModal } from '../components/ProjectModal';
import { CardSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { ToastContainer, ToastMessage } from '../components/Toast';
import { Button } from '../components/Button';
import { OrbitErrorBoundary } from '../components/orbit/ErrorBoundary';
import {
  AlertTriangle,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { CreateProjectDTO, ProjectStatus } from '../types';

// Lazy-load 3D Orbit Scene so it never blocks the initial bundle or core app
const OrbitScene = lazy(() => import('../components/orbit/OrbitScene'));

export const ProjectsPage: React.FC = () => {
  const {
    projects,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    stats,
    tabCounts,
    fetchProjects,
    updateProjectStatus,
    addProject,
  } = useProjects();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [hoveredProjectId, setHoveredProjectId] = useState<number | null>(null);
  const [reduceEffects, setReduceEffects] = useState<boolean>(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleStatusChange = async (id: number, newStatus: ProjectStatus) => {
    const result = await updateProjectStatus(id, newStatus);
    if (result.success) {
      addToast('success', `Status updated to ${newStatus.replace('_', ' ')}.`);
    } else {
      addToast('error', result.error || 'Failed to update status.');
    }
    return result;
  };

  const handleCreateProject = async (data: CreateProjectDTO) => {
    await addProject(data);
    addToast('success', `Project "${data.title}" successfully created!`);
  };

  return (
    <div className="relative min-h-screen bg-[#05060B] bg-solar-glow text-[#FFF6EA] pb-24 overflow-x-hidden">
      {/* 3D Orbit Scene (Rendered fixed in background, lazy loaded + Error Boundary) */}
      <OrbitErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <OrbitScene
            projects={projects}
            statusFilter={statusFilter}
            hoveredProjectId={hoveredProjectId}
            reduceEffects={reduceEffects}
          />
        </Suspense>
      </OrbitErrorBoundary>

      {/* Main Container: max-width 1160px with left content column (max-width 700px) */}
      <main className="relative z-10 max-w-[1160px] mx-auto px-4 sm:px-6 pt-9 pb-20">
        <div className="max-w-[700px] space-y-6">
          {/* Header Layout: brand line + H1 + subtitle on left, "+ New project" on right aligned with bottom */}
          <header className="flex justify-between items-end gap-4 flex-wrap mb-6">
            <div>
              <div className="flex items-center gap-2 text-[13px] text-[#B6A78F] mb-2 font-normal">
                <span className="solar-brand-dot" aria-hidden="true" />
                <span>EnvisionStudio</span>
              </div>
              <h1
                style={{ color: '#FFF6EA' }}
                className="font-display font-semibold text-[34px] sm:text-[46px] lg:text-[54px] tracking-[-0.03em] leading-tight text-[#FFF6EA]"
              >
                Projects
              </h1>
              <p className="mt-2 text-[15px] leading-relaxed text-[#B6A78F] max-w-[42ch]">
                Every project in its own orbit, with deadlines and budgets under control.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsModalOpen(true)}
              className="mb-1"
            >
              New project
            </Button>
          </header>

          {/* Four Stat Tiles: 4 across on desktop, 2x2 below 900px, "Over budget" doesn't wrap */}
          <section className="grid grid-cols-2 min-[900px]:grid-cols-4 gap-2.5" aria-label="Project statistics">
            <StatCard label="Total" value={stats.total} />
            <StatCard label="Active" value={stats.active} />
            <StatCard label="Overdue" value={stats.overdue} />
            <StatCard label="Over budget" value={stats.overBudget} />
          </section>

          {/* Status Filter Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            <StatusFilterTabs
              currentFilter={statusFilter}
              counts={tabCounts}
              onFilterChange={setStatusFilter}
            />

            <span className="text-xs font-normal text-muted">
              Showing <strong className="font-semibold text-[#FFF6EA] tabular-nums">{projects.length}</strong>{' '}
              {projects.length === 1 ? 'project' : 'projects'}
            </span>
          </div>

          {/* Stacked Glass Project Cards / State View */}
          <div>
            {loading ? (
              <CardSkeleton />
            ) : error ? (
              /* Error State */
              <div className="solar-glass p-10 text-center rounded-[18px] my-4 border-[#FF4D5E]/40 space-y-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#FF4D5E]/15 text-alert-red mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-[#FFF6EA]" style={{ color: '#FFF6EA' }}>
                  Failed to load projects
                </h3>
                <p className="text-sm text-muted max-w-sm mx-auto">
                  {error}
                </p>
                <div>
                  <Button
                    variant="secondary"
                    size="md"
                    icon={<RefreshCw className="w-4 h-4" />}
                    onClick={() => fetchProjects(statusFilter)}
                  >
                    Try again
                  </Button>
                </div>
              </div>
            ) : projects.length === 0 ? (
              /* Empty State */
              <EmptyState
                currentFilter={statusFilter}
                onClearFilter={() => setStatusFilter('all')}
                onAddNew={() => setIsModalOpen(true)}
              />
            ) : (
              /* Stacked Cards (10px gap between cards) */
              <div className="space-y-2.5">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onStatusChange={handleStatusChange}
                    onHover={setHoveredProjectId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Subtle Reduce effects toggle placed bottom-left */}
      <button
        type="button"
        onClick={() => setReduceEffects(!reduceEffects)}
        className="fixed bottom-4 left-4 z-20 text-xs text-[#B6A78F] hover:text-[#FFF6EA] px-3 py-1.5 rounded-full bg-[rgba(24,18,12,0.6)] border border-[rgba(255,180,84,0.22)] backdrop-blur-md transition-colors shadow-sm"
        title="Toggle 3D background animation"
      >
        {reduceEffects ? 'Enable effects' : 'Reduce effects'}
      </button>

      {/* Add Project Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export default ProjectsPage;
