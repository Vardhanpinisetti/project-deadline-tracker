import { ApiErrorResponse, CreateProjectDTO, Project, ProjectStatus, ValidationErrorDetail } from '../types';

// Use relative URLs ("/api/projects") by default; only use VITE_API_URL if it is set
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  public status: number;
  public details?: ValidationErrorDetail[];

  constructor(status: number, message: string, details?: ValidationErrorDetail[]) {
    super(message);
    this.status = status;
    this.details = details;
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorData: ApiErrorResponse | null = null;
    try {
      errorData = (await res.json()) as ApiErrorResponse;
    } catch {
      // Body not JSON
    }

    const message = errorData?.error || `Request failed with status ${res.status}`;
    const details = errorData?.details;
    throw new ApiError(res.status, message, details);
  }

  return (await res.json()) as T;
}

export const api = {
  /**
   * GET /api/projects
   * Optional ?status=active|completed|on_hold
   */
  async getProjects(status?: ProjectStatus): Promise<Project[]> {
    const baseEndpoint = `${API_BASE_URL}/api/projects`;
    const queryString = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetch(`${baseEndpoint}${queryString}`, {
      headers: {
        Accept: 'application/json',
      },
    });
    return handleResponse<Project[]>(res);
  },

  /**
   * POST /api/projects
   */
  async createProject(data: CreateProjectDTO): Promise<Project> {
    const res = await fetch(`${API_BASE_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<Project>(res);
  },

  /**
   * PATCH /api/projects/:id/status
   */
  async updateProjectStatus(id: number, status: ProjectStatus): Promise<Project> {
    const res = await fetch(`${API_BASE_URL}/api/projects/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    return handleResponse<Project>(res);
  },
};
