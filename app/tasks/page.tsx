"use client";

import React, { useState, useMemo } from "react";
import {
  ListTodo,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  X,
  AlertCircle,
} from "lucide-react";
import { useTasks } from "../../components/AppShell";
import { TaskRow } from "../../components/TaskRow";
import { QuickAddTask } from "../../components/QuickAddTask";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Task, TaskPriority, TaskStatus } from "../../lib/types";

export default function AllTasksPage() {
  const {
    tasks,
    projects,
    isLoading,
    createTask,
    completeTask,
    reopenTask,
    startTask,
    blockTask,
    deleteTask,
    openEditTaskModal,
    openNewTaskModal,
  } = useTasks();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [dueDateFilter, setDueDateFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"created_at" | "due_date" | "priority" | "title">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const getProject = (projectId: number | null) =>
    projectId ? projects.find((p) => p.id === projectId) || null : null;

  // Filtered and Sorted Tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    // Project filter
    if (projectFilter === "none") {
      result = result.filter((t) => t.project === null);
    } else if (projectFilter !== "all") {
      result = result.filter((t) => t.project === Number(projectFilter));
    }

    // Due date filter
    if (dueDateFilter === "overdue") {
      result = result.filter((t) => t.status !== "done" && t.due_date && t.due_date < todayStr);
    } else if (dueDateFilter === "today") {
      result = result.filter((t) => t.due_date === todayStr);
    } else if (dueDateFilter === "upcoming") {
      result = result.filter((t) => t.due_date && t.due_date > todayStr);
    } else if (dueDateFilter === "no-date") {
      result = result.filter((t) => !t.due_date);
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "created_at") {
        comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === "title") {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === "priority") {
        const priorityWeight: Record<TaskPriority, number> = {
          urgent: 4,
          high: 3,
          med: 2,
          low: 1,
        };
        comparison = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      } else if (sortBy === "due_date") {
        if (!a.due_date && !b.due_date) comparison = 0;
        else if (!a.due_date) comparison = 1;
        else if (!b.due_date) comparison = -1;
        else comparison = a.due_date.localeCompare(b.due_date);
      }
      return sortOrder === "asc" ? -comparison : comparison;
    });

    return result;
  }, [tasks, searchQuery, statusFilter, priorityFilter, projectFilter, dueDateFilter, sortBy, sortOrder, todayStr]);

  const hasActiveFilters =
    searchQuery !== "" ||
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    projectFilter !== "all" ||
    dueDateFilter !== "all";

  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setProjectFilter("all");
    setDueDateFilter("all");
  };

  const handleToggleComplete = async (task: Task) => {
    if (task.status === "done") {
      await reopenTask(task.id);
    } else {
      await completeTask(task.id);
    }
  };

  const handleConfirmDelete = async () => {
    if (taskToDelete) {
      await deleteTask(taskToDelete.id);
      setTaskToDelete(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-brand-indigo">
            <ListTodo className="w-3.5 h-3.5" />
            <span>Workspace</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-main mt-0.5">
            All Tasks
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Browse, filter, and organize all tasks in your system.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openNewTaskModal()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-indigo hover:bg-brand-indigo-hover rounded shadow-subtle transition-colors focus-ring"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Quick Add */}
      <QuickAddTask
        onAdd={async (payload) => {
          await createTask(payload);
        }}
        placeholder="Quick add a new task... (press Enter to save)"
      />

      {/* Filter and Search Bar */}
      <div className="bg-surface border border-border rounded-lg p-3 space-y-3">
        {/* Top row: search + sort */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="w-3.5 h-3.5 text-secondary absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or description..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-subtle/50 hover:bg-subtle focus:bg-surface border border-border rounded focus-ring text-main"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2 text-secondary hover:text-main"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-subtle/50 border border-border rounded px-2 py-1 text-xs">
              <ArrowUpDown className="w-3 h-3 text-secondary" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-secondary text-xs outline-none cursor-pointer"
              >
                <option value="created_at">Created Date</option>
                <option value="due_date">Due Date</option>
                <option value="priority">Priority</option>
                <option value="title">Title</option>
              </select>
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="ml-1 text-[11px] font-semibold text-secondary hover:text-main uppercase"
                title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
              >
                {sortOrder}
              </button>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded border border-red-200 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Second row: select filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
          <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filters:
          </span>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1 text-xs bg-surface border border-border rounded focus-ring text-main font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
          </select>

          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2 py-1 text-xs bg-surface border border-border rounded focus-ring text-main font-medium"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="med">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Project */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-2 py-1 text-xs bg-surface border border-border rounded focus-ring text-main font-medium"
          >
            <option value="all">All Projects</option>
            <option value="none">No Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Due date */}
          <select
            value={dueDateFilter}
            onChange={(e) => setDueDateFilter(e.target.value)}
            className="px-2 py-1 text-xs bg-surface border border-border rounded focus-ring text-main font-medium"
          >
            <option value="all">All Due Dates</option>
            <option value="overdue">Overdue</option>
            <option value="today">Due Today</option>
            <option value="upcoming">Upcoming</option>
            <option value="no-date">No Due Date</option>
          </select>

          <span className="ml-auto text-xs text-secondary font-medium">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </span>
        </div>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="space-y-2 py-4">
          <div className="h-10 bg-surface border border-border rounded animate-pulse" />
          <div className="h-10 bg-surface border border-border rounded animate-pulse" />
          <div className="h-10 bg-surface border border-border rounded animate-pulse" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="px-6 py-12 bg-surface border border-border rounded text-center">
          <div className="w-10 h-10 rounded-full bg-subtle text-secondary flex items-center justify-center mx-auto mb-2">
            <ListTodo className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-main">No tasks match your filters</h3>
          <p className="text-xs text-secondary mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? "Try adjusting your search criteria or resetting filters to see more tasks."
              : "No tasks created yet. Get started by adding a new task above."}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="mt-3 px-3 py-1.5 text-xs font-medium text-brand-indigo hover:underline"
            >
              Reset all filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              project={getProject(task.project)}
              onToggleComplete={handleToggleComplete}
              onStart={async (t) => {
                await startTask(t.id);
              }}
              onBlock={async (t) => {
                await blockTask(t.id);
              }}
              onEdit={openEditTaskModal}
              onDelete={(t) => setTaskToDelete(t)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!taskToDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Task"
        onConfirm={handleConfirmDelete}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
}
