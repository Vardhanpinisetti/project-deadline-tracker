export type ProjectStatus = 'active' | 'completed' | 'on_hold';

export interface Project {
  id: number;
  title: string;
  status: ProjectStatus;
  deadline: string | null;
  budget: number;
  spentAmount: number;
  createdAt: string;
}

export type StatusFilter = 'all' | 'active' | 'completed' | 'on_hold';

export interface CreateProjectDTO {
  title: string;
  status: ProjectStatus;
  deadline: string | null;
  budget: number;
  spentAmount: number;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  error: string;
  details?: ValidationErrorDetail[];
}

export interface ProjectStats {
  total: number;
  active: number;
  overdue: number;
  overBudget: number;
}
