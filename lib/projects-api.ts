import { Project, CreateProjectPayload, UpdateProjectPayload } from "./types";
import { API_CONFIG } from "./api-config";

// Initial seed matching the actual records present in backend db.sqlite3
const INITIAL_PROJECTS: Project[] = [
  {
    id: 1,
    name: "Test Project",
    description: "A test project initialized in the backend database.",
    status: 1, // 1 = ACTIVE
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 2,
    name: "Second Project",
    description: "Another test project initialized in the backend database.",
    status: 1, // 1 = ACTIVE
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

const STORAGE_KEY = "devtask_projects_v1";

function loadProjectsFromStorage(): Project[] {
  if (typeof window === "undefined") {
    return INITIAL_PROJECTS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
      return INITIAL_PROJECTS;
    }
    return JSON.parse(raw) as Project[];
  } catch {
    return INITIAL_PROJECTS;
  }
}

function saveProjectsToStorage(projects: Project[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error("Failed to persist projects to storage", err);
  }
}

export const projectsApi = {
  isBackendMounted: API_CONFIG.capabilities.projectsBackendAvailable,

  /**
   * Fetch all projects
   */
  async getProjects(): Promise<Project[]> {
    // In local adapter mode since Django backend does not mount /api/v1/projects/
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(loadProjectsFromStorage());
      }, 50);
    });
  },

  /**
   * Fetch project by ID
   */
  async getProject(id: number): Promise<Project | null> {
    const projects = await this.getProjects();
    const found = projects.find((p) => p.id === id);
    return found || null;
  },

  /**
   * Create a new project
   */
  async createProject(payload: CreateProjectPayload): Promise<Project> {
    const projects = loadProjectsFromStorage();
    const cleanName = payload.name.trim();
    if (!cleanName) {
      throw new Error("Project name must not be empty.");
    }

    if (projects.some((p) => p.name.toLowerCase() === cleanName.toLowerCase())) {
      throw new Error(`Project with name "${cleanName}" already exists.`);
    }

    const nextId = projects.length > 0 ? Math.max(...projects.map((p) => p.id)) + 1 : 1;
    const now = new Date().toISOString();

    const newProject: Project = {
      id: nextId,
      name: cleanName,
      description: payload.description?.trim() || null,
      status: payload.status ?? 1,
      created_at: now,
      updated_at: now,
    };

    const updated = [newProject, ...projects];
    saveProjectsToStorage(updated);
    return newProject;
  },

  /**
   * Update an existing project
   */
  async updateProject(id: number, payload: UpdateProjectPayload): Promise<Project> {
    const projects = loadProjectsFromStorage();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Project #${id} not found.`);
    }

    const current = projects[index];
    const now = new Date().toISOString();

    if (payload.name !== undefined) {
      const cleanName = payload.name.trim();
      if (!cleanName) {
        throw new Error("Project name must not be empty.");
      }
      if (
        projects.some(
          (p) => p.id !== id && p.name.toLowerCase() === cleanName.toLowerCase()
        )
      ) {
        throw new Error(`Another project with name "${cleanName}" already exists.`);
      }
      current.name = cleanName;
    }

    if (payload.description !== undefined) {
      current.description = payload.description?.trim() || null;
    }

    if (payload.status !== undefined) {
      current.status = payload.status;
    }

    current.updated_at = now;
    projects[index] = current;
    saveProjectsToStorage(projects);
    return current;
  },

  /**
   * Delete a project
   */
  async deleteProject(id: number): Promise<void> {
    const projects = loadProjectsFromStorage();
    const filtered = projects.filter((p) => p.id !== id);
    saveProjectsToStorage(filtered);
  },
};
