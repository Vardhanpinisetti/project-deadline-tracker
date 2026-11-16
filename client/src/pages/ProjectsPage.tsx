import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useProjects } from '../hooks/useProjects';
import { useScrollProgress } from '../components/scene/useScrollProgress';
import { useReducedEffects } from '../hooks/useReducedEffects';
import { SceneStack } from '../components/scene/SceneStack';
import { Nav } from '../components/layout/Nav';
import { Hero } from '../components/layout/Hero';
import { OverviewSection } from '../components/layout/OverviewSection';
import { BudgetOrbitSection } from '../components/layout/BudgetOrbitSection';
import { Footer } from '../components/layout/Footer';
import { StatusFilterTabs } from '../components/StatusFilterTabs';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectModal } from '../components/ProjectModal';
import { CardSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { ToastContainer, ToastMessage } from '../components/Toast';
import { Button } from '../components/Button';
import { OrbitErrorBoundary } from '../components/orbit/ErrorBoundary';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { CreateProjectDTO, ProjectStatus } from '../types';

// Lazy-load 3D Orbit Scene
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

  const scrollState = useScrollProgress();
  const [reduceEffects, setReduceEffects] = useReducedEffects();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [hoveredProjectId, setHoveredProjectId] = useState<number | null>(null);

  // Section 2 Scroll Reveal Observer: adds .in once when threshold 0.15 is reached
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (reduceEffects) {
      document.querySelectorAll('[data-reveal]').forEach((el) => {
        el.classList.add('in');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll('[data-reveal]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [reduceEffects, projects, loading]);

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
    <div className="relative min-h-screen bg-base text-ink selection:bg-accent/30 selection:text-white">
      {/* Fixed 4-Layer Scene Stack (z-index 0) */}
      <SceneStack scrollState={scrollState} reduceEffects={reduceEffects}>
        <OrbitErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <OrbitScene
              projects={projects}
              statusFilter={statusFilter}
              hoveredProjectId={hoveredProjectId}
              reduceEffects={reduceEffects}
              scrollY={scrollState.scrollY}
              scrollVelocity={scrollState.scrollVelocity}
              viewportHeight={scrollState.viewportHeight}
            />
          </Suspense>
        </OrbitErrorBoundary>
      </SceneStack>

      {/* Fixed Navigation (z-index 20) */}
      <Nav
        isScrolled={scrollState.isScrolled}
        onOpenModal={() => setIsModalOpen(true)}
      />

      {/* Main Content Sections (z-index 10) */}
      <main className="relative z-10 w-full">
        {/* Section 6: Hero (id top) */}
        <Hero
          onOpenModal={() => setIsModalOpen(true)}
          reduceEffects={reduceEffects}
        />

        {/* Section 7.1: Overview (id overview) */}
        <OverviewSection
          stats={stats}
          onOpenModal={() => setIsModalOpen(true)}
          reduceEffects={reduceEffects}
        />

        {/* Section 7.2: Projects List & Filter (id projects) */}
        <section
          id="projects"
          className="relative z-10 w-full mx-auto
            px-[16px] py-[110px_80px]
            min-[821px]:px-[calc(64*var(--u,1px))] min-[821px]:pt-[calc(150*var(--u,1px))] min-[821px]:pb-[calc(160*var(--u,1px))]
          "
          aria-label="Active Project Tracker"
        >
          <div
            className="w-full mx-auto
              max-w-full
              min-[821px]:max-w-[calc(1100*var(--u,1px))]
            "
          >
            {/* Header / Headline */}
            <div data-reveal className="mb-8">
              <h2
                className="solar-headline
                  text-[32px]
                  min-[821px]:text-[calc(52*var(--u,1px))]
                "
              >
                Your projects,{' '}
                <span className="solar-serif-accent">sorted by what's next.</span>
              </h2>
              <p
                className="text-ink-2 mt-3
                  text-[15px]
                  min-[821px]:text-[calc(17*var(--u,1px))]
                "
              >
                Nearest deadline first. Projects without a deadline come last.
              </p>
            </div>

            {/* Segmented status filter and sentence-case project count */}
            <div
              data-reveal
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
            >
              <StatusFilterTabs
                currentFilter={statusFilter}
                counts={tabCounts}
                onFilterChange={setStatusFilter}
              />

              <span className="text-xs font-normal text-ink-3">
                Showing{' '}
                <strong className="font-semibold text-ink font-mono tabular-nums">
                  {projects.length}
                </strong>{' '}
                {projects.length === 1 ? 'project' : 'projects'}
              </span>
            </div>

            {/* Project Cards Stack / State View */}
            <div data-reveal>
              {loading ? (
                <CardSkeleton />
              ) : error ? (
                /* Error State */
                <div className="solar-glass p-10 text-center rounded-[18px] my-4 border-[#FF4D5E]/40 space-y-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#FF4D5E]/15 text-alert-red mx-auto">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-ink">
                    Failed to load projects
                  </h3>
                  <p className="text-sm text-ink-3 max-w-sm mx-auto">
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
        </section>

        {/* Section 7.3: Budget Orbit Panel (id orbit) */}
        <BudgetOrbitSection
          projects={projects}
          reduceEffects={reduceEffects}
        />

        {/* Section 7.4: Footer and CTA (id end) */}
        <Footer onOpenModal={() => setIsModalOpen(true)} />
      </main>

      {/* Subtle Reduce effects toggle placed bottom-left (z-index 30) */}
      <button
        type="button"
        onClick={() => setReduceEffects(!reduceEffects)}
        className="fixed bottom-4 left-4 z-30 text-xs text-ink-3 hover:text-ink px-3 py-1.5 rounded-full bg-[rgba(24,18,12,0.65)] border border-[rgba(255,180,84,0.22)] backdrop-blur-md transition-colors shadow-sm"
        title="Toggle background motion & 3D effects"
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
