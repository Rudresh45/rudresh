"use client";

import React, { useState } from "react";
import {
  Calendar,
  AlertTriangle,
  Play,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ListFilter,
  Check,
} from "lucide-react";
import { useTasks } from "../components/AppShell";
import { TaskRow } from "../components/TaskRow";
import { QuickAddTask } from "../components/QuickAddTask";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Task } from "../lib/types";

export default function TodayPage() {
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
  } = useTasks();

  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // 1. Overdue tasks: due before today, not done
  const overdueTasks = tasks.filter(
    (t) => t.status !== "done" && t.due_date && t.due_date < todayStr
  );

  // 2. Today's tasks: due today, not done
  const todayTasks = tasks.filter(
    (t) => t.status !== "done" && t.due_date === todayStr
  );

  // 3. In-Progress tasks: status is in_progress, not in overdue or today
  const inProgressTasks = tasks.filter(
    (t) =>
      t.status === "in_progress" &&
      t.due_date !== todayStr &&
      !(t.due_date && t.due_date < todayStr)
  );

  // 4. Completed today: completed_at starts with todayStr or status is done and due today
  const completedTodayTasks = tasks.filter(
    (t) =>
      t.status === "done" &&
      (t.completed_at?.startsWith(todayStr) || t.due_date === todayStr)
  );

  const getProject = (projectId: number | null) =>
    projectId ? projects.find((p) => p.id === projectId) || null : null;

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
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-brand-indigo">
          <Calendar className="w-3.5 h-3.5" />
          <span>{todayFormatted}</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-main mt-1">
          Today&apos;s Focus
        </h1>
        <p className="text-xs sm:text-sm text-secondary mt-0.5">
          Prioritize and execute tasks scheduled for today.
        </p>
      </div>

      {/* Quick Add for Today */}
      <QuickAddTask
        onAdd={async (payload) => {
          await createTask({ ...payload, due_date: todayStr });
        }}
        defaultDueDate={todayStr}
        placeholder="Add a task for today... (press Enter to save)"
      />

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-2 py-4">
          <div className="h-10 bg-surface border border-border rounded animate-pulse" />
          <div className="h-10 bg-surface border border-border rounded animate-pulse" />
          <div className="h-10 bg-surface border border-border rounded animate-pulse" />
        </div>
      )}

      {!isLoading && (
        <div className="space-y-6">
          {/* Overdue Section */}
          {overdueTasks.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-red-700">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Overdue ({overdueTasks.length})</span>
              </div>
              <div className="space-y-1.5">
                {overdueTasks.map((task) => (
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
            </section>
          )}

          {/* In-Progress Section */}
          {inProgressTasks.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-brand-indigo">
                <Play className="w-3.5 h-3.5" />
                <span>Active / In Progress ({inProgressTasks.length})</span>
              </div>
              <div className="space-y-1.5">
                {inProgressTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    project={getProject(task.project)}
                    onToggleComplete={handleToggleComplete}
                    onBlock={async (t) => {
                      await blockTask(t.id);
                    }}
                    onEdit={openEditTaskModal}
                    onDelete={(t) => setTaskToDelete(t)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Today's Tasks Section */}
          <section className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-main">
              <span>Today&apos;s Tasks ({todayTasks.length})</span>
            </div>

            {todayTasks.length === 0 && overdueTasks.length === 0 && inProgressTasks.length === 0 ? (
              <div className="px-6 py-10 bg-surface border border-border rounded text-center">
                <div className="w-10 h-10 rounded-full bg-brand-teal-subtle text-brand-teal flex items-center justify-center mx-auto mb-2">
                  <Check className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-main">All caught up for today</h3>
                <p className="text-xs text-secondary mt-1 max-w-sm mx-auto">
                  No pending tasks scheduled for today. Create a new task above or view all tasks.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {todayTasks.map((task) => (
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
          </section>

          {/* Completed Today Summary */}
          {completedTodayTasks.length > 0 && (
            <section className="pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
                className="flex items-center gap-2 text-xs font-medium text-secondary hover:text-main transition-colors focus-ring"
              >
                {isCompletedExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <span>Completed Today ({completedTodayTasks.length})</span>
              </button>

              {isCompletedExpanded && (
                <div className="space-y-1.5 mt-2">
                  {completedTodayTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      project={getProject(task.project)}
                      onToggleComplete={handleToggleComplete}
                      onEdit={openEditTaskModal}
                      onDelete={(t) => setTaskToDelete(t)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
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