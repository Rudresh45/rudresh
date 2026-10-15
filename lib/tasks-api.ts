import { apiClient } from "./api-client";
import { API_CONFIG } from "./api-config";
import { Task, CreateTaskPayload, UpdateTaskPayload } from "./types";

export interface TaskApiFilters {
  status?: string;
  priority?: string;
  due_date?: string;
  [key: string]: string | undefined;
}

export const tasksApi = {
  /**
   * Fetch all tasks, optionally filtered by backend query params: status, priority, due_date
   */
  async getTasks(filters?: TaskApiFilters, signal?: AbortSignal): Promise<Task[]> {
    return apiClient<Task[]>(API_CONFIG.endpoints.tasks.list, {
      method: "GET",
      params: filters,
      signal,
    });
  },

  /**
   * Retrieve a single task by ID
   */
  async getTask(id: number, signal?: AbortSignal): Promise<Task> {
    return apiClient<Task>(API_CONFIG.endpoints.tasks.detail(id), {
      method: "GET",
      signal,
    });
  },

  /**
   * Create a new task.
   * Required field: title (non-empty string).
   * Optional: description, priority, status, due_date, project.
   */
  async createTask(data: CreateTaskPayload): Promise<Task> {
    return apiClient<Task>(API_CONFIG.endpoints.tasks.create, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Partially update a task.
   */
  async updateTask(id: number, data: UpdateTaskPayload): Promise<Task> {
    return apiClient<Task>(API_CONFIG.endpoints.tasks.detail(id), {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a task.
   */
  async deleteTask(id: number): Promise<void> {
    return apiClient<void>(API_CONFIG.endpoints.tasks.detail(id), {
      method: "DELETE",
    });
  },

  /**
   * Lifecycle: Transition task to in_progress
   */
  async startTask(id: number): Promise<Task> {
    return apiClient<Task>(API_CONFIG.endpoints.tasks.start(id), {
      method: "POST",
    });
  },

  /**
   * Lifecycle: Transition task to blocked
   */
  async blockTask(id: number): Promise<Task> {
    return apiClient<Task>(API_CONFIG.endpoints.tasks.block(id), {
      method: "POST",
    });
  },

  /**
   * Lifecycle: Mark task as done
   */
  async completeTask(id: number): Promise<Task> {
    return apiClient<Task>(API_CONFIG.endpoints.tasks.complete(id), {
      method: "POST",
    });
  },

  /**
   * Lifecycle: Reopen completed task back to todo
   */
  async reopenTask(id: number): Promise<Task> {
    return apiClient<Task>(API_CONFIG.endpoints.tasks.reopen(id), {
      method: "POST",
    });
  },
};
