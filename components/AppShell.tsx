"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Calendar,
  ListTodo,
  CalendarClock,
  FolderKanban,
  CheckCircle2,
  Settings,
  Plus,
  Search,
  Menu,
  X,
  Terminal,
  Activity,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Task, Project, CreateTaskPayload, UpdateTaskPayload } from "../lib/types";
import { tasksApi } from "../lib/tasks-api";
import { projectsApi } from "../lib/projects-api";
import { TaskModal } from "./TaskModal";
import { SearchModal } from "./SearchModal";

interface TaskContextType {
  tasks: Task[];
  projects: Project[];
  isLoading: boolean;
  isBackendConnected: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  createTask: (payload: CreateTaskPayload) => Promise<Task>;
  updateTask: (id: number, payload: UpdateTaskPayload) => Promise<Task>;
  deleteTask: (id: number) => Promise<void>;
  startTask: (id: number) => Promise<Task>;
  blockTask: (id: number) => Promise<Task>;
  completeTask: (id: number) => Promise<Task>;
  reopenTask: (id: number) => Promise<Task>;
  openNewTaskModal: (defaultDueDate?: string | null, defaultProjectId?: number | null) => void;
  openEditTaskModal: (task: Task) => void;
}

export const TaskContext = createContext<TaskContextType | null>(null);

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTasks must be used within an AppShell");
  }
  return context;
}

const NAV_ITEMS = [
  { label: "Today", href: "/", icon: Calendar },
  { label: "All Tasks", href: "/tasks", icon: ListTodo },
  { label: "Upcoming", href: "/upcoming", icon: CalendarClock },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Completed", href: "/completed", icon: CheckCircle2 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackendConnected, setIsBackendConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskModalDefaultProjectId, setTaskModalDefaultProjectId] = useState<number | null>(null);
  const [taskModalDefaultDueDate, setTaskModalDefaultDueDate] = useState<string | null>(null);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initial load
  const refreshData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedTasks, fetchedProjects] = await Promise.all([
        tasksApi.getTasks().catch((err) => {
          setIsBackendConnected(false);
          throw err;
        }),
        projectsApi.getProjects(),
      ]);
      setTasks(fetchedTasks);
      setProjects(fetchedProjects);
      setIsBackendConnected(true);
      setError(null);
    } catch (err: any) {
      setIsBackendConnected(false);
      setError(
        err.message ||
          "Unable to connect to Django API on http://127.0.0.1:8000. Start backend server or review connection in Settings."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Keyboard shortcut: Cmd/Ctrl+K for search, N for new task
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (
        (e.key === "c" || e.key === "n") &&
        !isTaskModalOpen &&
        !isSearchOpen &&
        !(["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName))
      ) {
        e.preventDefault();
        openNewTaskModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTaskModalOpen, isSearchOpen]);

  // Task Mutations
  const createTask = async (payload: CreateTaskPayload): Promise<Task> => {
    const created = await tasksApi.createTask(payload);
    setTasks((prev) => [created, ...prev]);
    return created;
  };

  const updateTask = async (id: number, payload: UpdateTaskPayload): Promise<Task> => {
    const updated = await tasksApi.updateTask(id, payload);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  };

  const deleteTask = async (id: number): Promise<void> => {
    await tasksApi.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const startTask = async (id: number): Promise<Task> => {
    const updated = await tasksApi.startTask(id);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  };

  const blockTask = async (id: number): Promise<Task> => {
    const updated = await tasksApi.blockTask(id);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  };

  const completeTask = async (id: number): Promise<Task> => {
    const updated = await tasksApi.completeTask(id);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  };

  const reopenTask = async (id: number): Promise<Task> => {
    const updated = await tasksApi.reopenTask(id);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  };

  const openNewTaskModal = (defaultDueDate?: string | null, defaultProjectId?: number | null) => {
    setEditingTask(null);
    setTaskModalDefaultDueDate(defaultDueDate || null);
    setTaskModalDefaultProjectId(defaultProjectId || null);
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveModal = async (payload: CreateTaskPayload | UpdateTaskPayload) => {
    if (editingTask) {
      await updateTask(editingTask.id, payload as UpdateTaskPayload);
    } else {
      await createTask(payload as CreateTaskPayload);
    }
  };

  // Compute active task counts for badges
  const todayStr = new Date().toISOString().split("T")[0];
  const todayTasksCount = tasks.filter(
    (t) => t.status !== "done" && (t.due_date === todayStr || (t.due_date && t.due_date < todayStr))
  ).length;

  const activeTasksCount = tasks.filter((t) => t.status !== "done").length;

  return (
    <TaskContext.Provider
      value={{
        tasks,
        projects,
        isLoading,
        isBackendConnected,
        error,
        refreshData,
        createTask,
        updateTask,
        deleteTask,
        startTask,
        blockTask,
        completeTask,
        reopenTask,
        openNewTaskModal,
        openEditTaskModal,
      }}
    >
      <div className="min-h-screen bg-page flex text-main">
        {/* Desktop Sidebar */}
        <aside
          className="hidden md:flex flex-col w-60 bg-surface border-r border-border h-screen sticky top-0 flex-shrink-0 z-20"
          aria-label="Main sidebar"
        >
          {/* Logo / Brand Header */}
          <div className="h-14 flex items-center px-5 border-b border-border/80 gap-2.5">
            <div className="w-7 h-7 rounded bg-brand-indigo text-white flex items-center justify-center font-bold text-xs shadow-subtle">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight text-main block">
                DevTask
              </span>
              <span className="text-[10px] text-secondary tracking-wide uppercase font-medium block -mt-0.5">
                Developer Manager
              </span>
            </div>
          </div>

          {/* New Task Action Button */}
          <div className="p-3">
            <button
              type="button"
              onClick={() => openNewTaskModal()}
              className="w-full flex items-center justify-between px-3 py-2 bg-brand-indigo hover:bg-brand-indigo-hover text-white text-xs font-medium rounded shadow-subtle transition-colors focus-ring"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>New Task</span>
              </div>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-white/20 rounded font-mono text-white/90">
                N
              </kbd>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-2.5 py-1 space-y-0.5 overflow-y-auto" aria-label="Sidebar navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-colors ${
                    isActive
                      ? "bg-subtle text-brand-indigo font-semibold border-l-2 border-brand-indigo"
                      : "text-secondary hover:text-main hover:bg-subtle/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-brand-indigo" : "text-secondary"}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.href === "/" && todayTasksCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-brand-indigo-subtle text-brand-indigo font-semibold">
                      {todayTasksCount}
                    </span>
                  )}
                  {item.href === "/tasks" && activeTasksCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-subtle text-secondary font-medium">
                      {activeTasksCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer: Backend Connection Status */}
          <div className="p-3 border-t border-border bg-subtle/30">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isBackendConnected ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                  }`}
                />
                <span className="text-secondary font-medium">
                  {isBackendConnected ? "API Connected" : "API Offline"}
                </span>
              </div>
              <button
                onClick={refreshData}
                disabled={isLoading}
                title="Refresh from backend"
                className="text-secondary hover:text-main p-1 rounded hover:bg-subtle focus-ring"
                aria-label="Refresh data"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Drawer */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div
              className="w-64 bg-surface h-full flex flex-col p-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-brand-indigo text-white flex items-center justify-center font-bold text-xs">
                    <Terminal className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-semibold text-main">DevTask</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-secondary hover:text-main rounded"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openNewTaskModal();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-brand-indigo text-white text-xs font-medium rounded shadow-subtle"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Task</span>
                </button>
              </div>

              <nav className="flex-1 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded ${
                        isActive
                          ? "bg-subtle text-brand-indigo font-semibold border-l-2 border-brand-indigo"
                          : "text-secondary hover:text-main"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content Workspace */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-14 bg-surface border-b border-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-1.5 text-secondary hover:text-main rounded focus-ring"
                aria-label="Open sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="text-xs font-medium text-secondary">
                {pathname === "/" && "Today's Focus"}
                {pathname === "/tasks" && "All Tasks"}
                {pathname === "/upcoming" && "Upcoming Schedule"}
                {pathname === "/projects" && "Projects"}
                {pathname.startsWith("/projects/") && "Project Overview"}
                {pathname === "/completed" && "Completed Archive"}
                {pathname === "/settings" && "Preferences & Settings"}
              </div>
            </div>

            {/* Quick Actions & Search */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-secondary bg-subtle hover:bg-gray-200/60 border border-border rounded transition-colors focus-ring"
                aria-label="Search tasks"
              >
                <Search className="w-3.5 h-3.5 text-secondary" />
                <span className="hidden sm:inline">Search...</span>
                <kbd className="hidden sm:inline px-1 py-0.2 text-[10px] bg-surface border border-border rounded font-mono">
                  ⌘K
                </kbd>
              </button>

              <button
                type="button"
                onClick={() => openNewTaskModal()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-indigo hover:bg-brand-indigo-hover rounded shadow-subtle transition-colors focus-ring"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Task</span>
              </button>
            </div>
          </header>

          {/* Connection Banner (if backend is offline) */}
          {!isBackendConnected && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>
                  Django backend offline on <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px]">http://127.0.0.1:8000</code>. Run{" "}
                  <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px]">backend\.venv\Scripts\python.exe backend\manage.py runserver</code> to connect.
                </span>
              </div>
              <button
                onClick={refreshData}
                className="underline hover:text-amber-950 font-medium ml-3 flex-shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {/* Route Content */}
          <main className="flex-1 p-4 sm:p-6 max-w-6xl w-full mx-auto">
            {children}
          </main>
        </div>

        {/* Global Modals */}
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onSave={handleSaveModal}
          task={editingTask}
          projects={projects}
          defaultProjectId={taskModalDefaultProjectId}
          defaultDueDate={taskModalDefaultDueDate}
        />

        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          tasks={tasks}
          projects={projects}
          onSelectTask={(task) => openEditTaskModal(task)}
          onSelectProject={(project) => router.push(`/projects/${project.id}`)}
        />
      </div>
    </TaskContext.Provider>
  );
}
