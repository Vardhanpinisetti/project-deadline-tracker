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
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  RefreshCw,
  Sparkles,
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
      {/* 3D Orbit Scene (Rendered fixed in the background, lazy loaded + Error Boundary) */}
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

      {/* Main Container: Left content column (max-width 700px) */}
      <div className="relative z-10 max-w-[700px] mx-auto min-[900px]:ml-[max(2rem,calc(50vw-450px))] px-4 sm:px-6 pt-8 sm:pt-12 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          {/* Top Bar: Brand dot & name + Reduce Effects toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-gradient shadow-solar-glow" />
              <span className="text-xs uppercase tracking-widest font-semibold text-muted">
                EnvisionStudio
              </span>
            </div>

            <button
              onClick={() => setReduceEffects(!reduceEffects)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full solar-glass text-muted hover:text-[#FFF6EA] transition-colors"
              title="Toggle background 3D motion"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>{reduceEffects ? 'Effects: Static' : 'Effects: Live'}</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display font-semibold text-[34px] sm:text-[46px] lg:text-[54px] tracking-[-0.03em] leading-tight text-[#FFF6EA]">
                Projects
              </h1>
              <p className="mt-1 text-sm text-muted">
                Every project in its own orbit, with deadlines and budgets under control.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                variant="secondary"
                size="md"
                icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
                onClick={() => fetchProjects(statusFilter)}
                aria-label="Refresh project list"
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setIsModalOpen(true)}
              >
                + New project
              </Button>
            </div>
          </div>
        </div>

        {/* Four Stat Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <StatCard
            label="Total"
            value={stats.total}
            icon={<FolderKanban className="w-4 h-4" />}
            accent="gold"
          />
          <StatCard
            label="Active"
            value={stats.active}
            icon={<CheckCircle2 className="w-4 h-4" />}
            accent="green"
          />
          <StatCard
            label="Overdue"
            value={stats.overdue}
            icon={<Clock className="w-4 h-4" />}
            accent="red"
          />
          <StatCard
            label="Over budget"
            value={stats.overBudget}
            icon={<AlertTriangle className="w-4 h-4" />}
            accent="blue"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
          <StatusFilterTabs
            currentFilter={statusFilter}
            counts={tabCounts}
            onFilterChange={setStatusFilter}
          />

          <span className="text-xs uppercase tracking-wider font-semibold text-muted">
            Showing <strong className="text-[#FFF6EA] tabular-nums lowercase">{projects.length}</strong>{' '}
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
              <h3 className="text-base font-semibold text-[#FFF6EA]">
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
            /* Stacked Cards */
            <div className="space-y-4">
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
