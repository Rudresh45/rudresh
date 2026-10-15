"use client";

import React, { useState, useMemo } from "react";
import {
  CheckCircle2,
  Search,
  Filter,
  RotateCcw,
  Calendar,
  FolderKanban,
  Trash2,
  X,
} from "lucide-react";
import { useTasks } from "../../components/AppShell";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Task } from "../../lib/types";

export default function CompletedTasksPage() {
  const { tasks, projects, isLoading, reopenTask, deleteTask, openEditTaskModal } = useTasks();

  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const getProject = (projectId: number | null) =>
    projectId ? projects.find((p) => p.id === projectId) || null : null;

  // Filter completed tasks
  const completedTasks = useMemo(() => {
    let result = tasks.filter((t) => t.status === "done");

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    if (projectFilter === "none") {
      result = result.filter((t) => t.project === null);
    } else if (projectFilter !== "all") {
      result = result.filter((t) => t.project === Number(projectFilter));
    }

    // Sort by completed_at desc, or updated_at desc
    result.sort((a, b) => {
      const timeA = new Date(a.completed_at || a.updated_at).getTime();
      const timeB = new Date(b.completed_at || b.updated_at).getTime();
      return timeB - timeA;
    });

    return result;
  }, [tasks, searchQuery, projectFilter]);

  const handleReopen = async (task: Task) => {
    await reopenTask(task.id);
  };

  const handleDelete = async () => {
    if (taskToDelete) {
      await deleteTask(taskToDelete.id);
      setTaskToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-brand-teal">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Archive</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-main mt-0.5">
          Completed Tasks
        </h1>
        <p className="text-xs sm:text-sm text-secondary mt-0.5">
          Review completed work history and reopen tasks if needed.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface border border-border rounded-lg p-3 flex flex-col sm:flex-row items-center gap-2.5">
        <div className="flex-1 w-full relative">
          <Search className="w-3.5 h-3.5 text-secondary absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search completed tasks..."
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

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-full sm:w-auto px-2 py-1 text-xs bg-surface border border-border rounded focus-ring text-main font-medium"
          >
            <option value="all">All Projects</option>
            <option value="none">No Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="space-y-2 py-4">
          <div className="h-10 bg-surface border border-border rounded animate-pulse" />
          <div className="h-10 bg-surface border border-border rounded animate-pulse" />
        </div>
      ) : completedTasks.length === 0 ? (
        <div className="px-6 py-12 bg-surface border border-border rounded text-center">
          <div className="w-10 h-10 rounded-full bg-subtle text-secondary flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-main">No completed tasks found</h3>
          <p className="text-xs text-secondary mt-1">
            {searchQuery || projectFilter !== "all"
              ? "No completed tasks match your search filter."
              : "Completed tasks will appear here once you finish tasks."}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {completedTasks.map((task) => {
            const project = getProject(task.project);
            const dateStr = task.completed_at || task.updated_at;
            const formattedDate = dateStr
              ? new Date(dateStr).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : null;

            return (
              <div
                key={task.id}
                className="group flex items-center justify-between gap-3 px-3.5 py-2.5 bg-surface hover:bg-subtle/40 border border-border rounded transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CheckCircle2 className="w-4 h-4 fill-brand-teal-subtle text-brand-teal flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-medium text-secondary line-through block truncate">
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-secondary mt-0.5">
                      {project && (
                        <span className="flex items-center gap-1 text-secondary/80">
                          <FolderKanban className="w-3 h-3" />
                          <span>{project.name}</span>
                        </span>
                      )}
                      {formattedDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Finished {formattedDate}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleReopen(task)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-brand-teal hover:bg-brand-teal-subtle rounded border border-brand-teal/30 transition-colors focus-ring"
                    title="Reopen task to todo"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reopen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTaskToDelete(task)}
                    className="p-1 text-secondary hover:text-red-600 rounded hover:bg-subtle transition-colors focus-ring"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!taskToDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Task"
        onConfirm={handleDelete}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
}
