export type TaskPriority = 'low' | 'med' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null; // YYYY-MM-DD
  project: number | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface CreateTaskPayload {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  due_date?: string | null;
  project?: number | null;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  due_date?: string | null;
  project?: number | null;
}

export type ProjectStatus = 1 | 2; // 1 = ACTIVE, 2 = ARCHIVED

export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string | null;
  status?: ProjectStatus;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
}

export interface TaskFilters {
  search?: string;
  status?: TaskStatus | 'all';
  priority?: TaskPriority | 'all';
  projectId?: number | 'all' | 'none';
  dueDate?: string | 'today' | 'upcoming' | 'overdue' | 'all';
  sortBy?: 'due_date' | 'priority' | 'created_at' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface UserPreferences {
  defaultPriority: TaskPriority;
  startOfWeek: 'sunday' | 'monday';
  dateFormat: 'relative' | 'standard' | 'iso';
  apiBaseUrl: string;
  offlineMode: boolean;
}

export interface ApiErrorResponse {
  detail?: string;
  message?: string;
  [key: string]: any;
}
