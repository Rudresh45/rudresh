/**
 * Central API Configuration & Capabilities
 *
 * Sources of truth verified from backend inspection:
 * - Django tasks app is mounted at `/api/v1/tasks/`
 * - Supported task lifecycle actions: /start/, /block/, /complete/, /reopen/
 * - Supported task query params on list: `status`, `priority`, `due_date`
 * - Note on projects: `/api/v1/projects/` is NOT mounted in backend `urls.py`.
 *   The frontend maintains an explicit adapter for project persistence and task-project associations.
 */

export const API_CONFIG = {
  // Browser requests use relative URL by default so Next.js rewrite proxies without CORS errors
  defaultBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1",
  directBackendUrl: "http://127.0.0.1:8000",
  timeoutMs: 8000,
  endpoints: {
    tasks: {
      list: "/tasks/",
      create: "/tasks/",
      detail: (id: number) => `/tasks/${id}/`,
      start: (id: number) => `/tasks/${id}/start/`,
      block: (id: number) => `/tasks/${id}/block/`,
      complete: (id: number) => `/tasks/${id}/complete/`,
      reopen: (id: number) => `/tasks/${id}/reopen/`,
    },
    projects: {
      list: "/projects/",
      create: "/projects/",
      detail: (id: number) => `/projects/${id}/`,
    },
  },
  capabilities: {
    tasksBackendAvailable: true,
    projectsBackendAvailable: false, // Explicitly false since backend does not route projects
  },
};
