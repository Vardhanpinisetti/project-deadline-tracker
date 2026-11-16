import { useState, useEffect, useCallback, useMemo } from 'react';
import { Project, ProjectStatus, StatusFilter, ProjectStats, CreateProjectDTO, UpdateProjectDTO } from '../types';
import { api, ApiError } from '../lib/api';
import { isOverdue, isOverBudget } from '../lib/projectRules';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects from backend based on the active filter
  const fetchProjects = useCallback(async (filter: StatusFilter = statusFilter) => {
    setLoading(true);
    setError(null);
    try {
      const filterParam = filter === 'all' ? undefined : (filter as ProjectStatus);
      const data = await api.getProjects(filterParam);
      setProjects(data);

      // If fetching 'all', also sync allProjects for stat cards and tab counts
      if (filter === 'all') {
        setAllProjects(data);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load projects. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // Initial load and filter change trigger
  useEffect(() => {
    fetchProjects(statusFilter);
  }, [statusFilter, fetchProjects]);

  // Also ensure allProjects is populated on first mount if initial filter was not 'all'
  useEffect(() => {
    if (statusFilter !== 'all' && allProjects.length === 0) {
      api.getProjects()
        .then((data) => setAllProjects(data))
        .catch(() => {});
    }
  }, [statusFilter, allProjects.length]);

  // Compute stats across all known projects
  const stats: ProjectStats = useMemo(() => {
    const source = allProjects.length > 0 ? allProjects : projects;
    let active = 0;
    let overdue = 0;
    let overBudget = 0;

    for (const p of source) {
      if (p.status === 'active') active++;
      if (isOverdue(p)) overdue++;
      if (isOverBudget(p)) overBudget++;
    }

    return {
      total: source.length,
      active,
      overdue,
      overBudget,
    };
  }, [allProjects, projects]);

  // Tab counts for segmented filter
  const tabCounts = useMemo(() => {
    const source = allProjects.length > 0 ? allProjects : projects;
    return {
      all: source.length,
      active: source.filter((p) => p.status === 'active').length,
      completed: source.filter((p) => p.status === 'completed').length,
      on_hold: source.filter((p) => p.status === 'on_hold').length,
    };
  }, [allProjects, projects]);

  /**
   * Optimistically updates a project's status with automatic rollback on error.
   */
  const updateProjectStatus = useCallback(
    async (id: number, newStatus: ProjectStatus): Promise<{ success: boolean; error?: string }> => {
      const prevProjects = [...projects];
      const prevAll = [...allProjects];

      // Optimistic update
      setProjects((current) =>
        current.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
      );
      setAllProjects((current) =>
        current.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
      );

      try {
        const updated = await api.updateProjectStatus(id, newStatus);
        // Replace with server-confirmed record
        setProjects((current) =>
          current.map((p) => (p.id === id ? updated : p))
        );
        setAllProjects((current) =>
          current.map((p) => (p.id === id ? updated : p))
        );
        return { success: true };
      } catch (err: unknown) {
        // Rollback state on error
        setProjects(prevProjects);
        setAllProjects(prevAll);

        const errorMessage =
          err instanceof ApiError ? err.message : 'Failed to update project status';
        return { success: false, error: errorMessage };
      }
    },
    [projects, allProjects]
  );

  /**
   * Adds a new project and triggers a refresh of the project list.
   */
  const addProject = useCallback(
    async (data: CreateProjectDTO): Promise<Project> => {
      const newProj = await api.createProject(data);
      // Refresh list to preserve backend sort order
      await fetchProjects(statusFilter);
      // Also update allProjects
      const all = await api.getProjects();
      setAllProjects(all);
      return newProj;
    },
    [statusFilter, fetchProjects]
  );

  /**
   * Updates an existing project via PATCH /api/projects/:id
   * Updates local state and refreshes projects to preserve backend sort order.
   */
  const editProject = useCallback(
    async (id: number, data: UpdateProjectDTO): Promise<Project> => {
      const updated = await api.updateProject(id, data);
      // Immediately update local arrays
      setProjects((current) => current.map((p) => (p.id === id ? updated : p)));
      setAllProjects((current) => current.map((p) => (p.id === id ? updated : p)));
      // Re-fetch to guarantee backend sort order
      await fetchProjects(statusFilter);
      const all = await api.getProjects();
      setAllProjects(all);
      return updated;
    },
    [statusFilter, fetchProjects]
  );

  /**
   * Optimistically deletes a project with rollback on error.
   * If 404 is encountered, treats it as already deleted (keeps removed).
   */
  const deleteProject = useCallback(
    async (
      id: number
    ): Promise<{ success: boolean; error?: string; notFound?: boolean }> => {
      const prevProjects = [...projects];
      const prevAll = [...allProjects];

      // Optimistically remove from state
      setProjects((current) => current.filter((p) => p.id !== id));
      setAllProjects((current) => current.filter((p) => p.id !== id));

      try {
        await api.deleteProject(id);
        return { success: true };
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404) {
          // 404: treat as already deleted, keep removed, do not rollback
          return { success: false, notFound: true, error: err.message };
        }
        // Rollback on error
        setProjects(prevProjects);
        setAllProjects(prevAll);
        const errorMessage =
          err instanceof ApiError ? err.message : 'Failed to delete project';
        return { success: false, error: errorMessage };
      }
    },
    [projects, allProjects]
  );

  return {
    projects,
    allProjects,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    stats,
    tabCounts,
    fetchProjects,
    updateProjectStatus,
    addProject,
    editProject,
    deleteProject,
  };
}
