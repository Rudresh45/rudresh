"use client";

import React, { useState } from "react";
import {
  CalendarClock,
  Calendar,
  AlertTriangle,
  Plus,
  ArrowRight,
  Clock,
  HelpCircle,
} from "lucide-react";
import { useTasks } from "../../components/AppShell";
import { TaskRow } from "../../components/TaskRow";
import { QuickAddTask } from "../../components/QuickAddTask";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Task } from "../../lib/types";

export default function UpcomingPage() {
  const {
    tasks,
    projects,
    isLoading,
    createTask,
    updateTask,
    completeTask,
    reopenTask,
    startTask,
    blockTask,
    deleteTask,
    openEditTaskModal,
    openNewTaskModal,
  } = useTasks();

  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const getProject = (projectId: number | null) =>
    projectId ? projects.find((p) => p.id === projectId) || null : null;

  // Date helpers
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const nextWeekEnd = new Date(today);
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);
  const nextWeekEndStr = nextWeekEnd.toISOString().split("T")[0];

  // Active tasks only for upcoming planner
  const activeTasks = tasks.filter((t) => t.status !== "done");

  // Groupings
  const overdueTasks = activeTasks.filter((t) => t.due_date && t.due_date < todayStr);
  const todayTasks = activeTasks.filter((t) => t.due_date === todayStr);
  const tomorrowTasks = activeTasks.filter((t) => t.due_date === tomorrowStr);
  const next7DaysTasks = activeTasks.filter(
    (t) => t.due_date && t.due_date > tomorrowStr && t.due_date <= nextWeekEndStr
  );
  const futureTasks = activeTasks.filter(
    (t) => t.due_date && t.due_date > nextWeekEndStr
  );
  const noDueDateTasks = activeTasks.filter((t) => !t.due_date);

  const handleToggleComplete = async (task: Task) => {
    if (task.status === "done") {
      await reopenTask(task.id);
    } else {
      await completeTask(task.id);
    }
  };

  const handleReschedule = async (task: Task, newDate: string | null) => {
    await updateTask(task.id, { due_date: newDate });
  };

  const handleConfirmDelete = async () => {
    if (taskToDelete) {
      await deleteTask(taskToDelete.id);
      setTaskToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-brand-indigo">
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-main mt-0.5">
            Upcoming Schedule
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Chronological task breakdown to manage upcoming deadlines and reschedule work.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openNewTaskModal()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-indigo hover:bg-brand-indigo-hover rounded shadow-subtle transition-colors focus-ring self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2 py-4">
          <div className="h-10 bg-surface border border-border rounded animate-pulse" />
          <div className="h-10 bg-surface border border-border rounded animate-pulse" />
          <div className="h-10 bg-surface border border-border rounded animate-pulse" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Overdue Section */}
          {overdueTasks.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-red-700">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Needs Attention: Overdue ({overdueTasks.length})</span>
                </div>
                <span className="text-[11px] text-red-600 font-medium">
                  Reschedule or complete
                </span>
              </div>
              <div className="space-y-1.5">
                {overdueTasks.map((task) => (
                  <div key={task.id} className="relative group/resched">
                    <TaskRow
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
                    {/* Quick Reschedule to Today button */}
                    <div className="hidden group-hover/resched:flex absolute right-24 top-2 items-center gap-1 bg-surface px-1.5 py-0.5 rounded border border-border shadow-subtle z-10 text-[10px]">
                      <button
                        onClick={() => handleReschedule(task, todayStr)}
                        className="px-1.5 py-0.5 hover:bg-subtle text-brand-indigo rounded font-medium"
                      >
                        Move to Today
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Today */}
          <section className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-border">
              <div className="flex items-center gap-2 text-xs font-semibold text-main">
                <Calendar className="w-3.5 h-3.5 text-brand-indigo" />
                <span>Today</span>
                <span className="text-secondary font-normal">
                  ({today.toLocaleDateString("en-US", { month: "short", day: "numeric" })})
                </span>
              </div>
              <span className="text-[11px] text-secondary">
                {todayTasks.length} {todayTasks.length === 1 ? "task" : "tasks"}
              </span>
            </div>

            <QuickAddTask
              onAdd={async (payload) => {
                await createTask({ ...payload, due_date: todayStr });
              }}
              defaultDueDate={todayStr}
              placeholder="Add task for today..."
            />

            {todayTasks.length === 0 ? (
              <p className="text-xs text-secondary italic py-2 pl-1">
                No tasks due today.
              </p>
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

          {/* Tomorrow */}
          <section className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-border">
              <div className="flex items-center gap-2 text-xs font-semibold text-main">
                <Calendar className="w-3.5 h-3.5 text-brand-teal" />
                <span>Tomorrow</span>
                <span className="text-secondary font-normal">
                  ({tomorrow.toLocaleDateString("en-US", { month: "short", day: "numeric" })})
                </span>
              </div>
              <span className="text-[11px] text-secondary">
                {tomorrowTasks.length} {tomorrowTasks.length === 1 ? "task" : "tasks"}
              </span>
            </div>

            <QuickAddTask
              onAdd={async (payload) => {
                await createTask({ ...payload, due_date: tomorrowStr });
              }}
              defaultDueDate={tomorrowStr}
              placeholder="Add task for tomorrow..."
            />

            {tomorrowTasks.length === 0 ? (
              <p className="text-xs text-secondary italic py-2 pl-1">
                No tasks due tomorrow.
              </p>
            ) : (
              <div className="space-y-1.5">
                {tomorrowTasks.map((task) => (
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

          {/* Next 7 Days */}
          <section className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-border">
              <div className="flex items-center gap-2 text-xs font-semibold text-main">
                <Clock className="w-3.5 h-3.5 text-secondary" />
                <span>Next 7 Days</span>
              </div>
              <span className="text-[11px] text-secondary">
                {next7DaysTasks.length} {next7DaysTasks.length === 1 ? "task" : "tasks"}
              </span>
            </div>

            {next7DaysTasks.length === 0 ? (
              <p className="text-xs text-secondary italic py-2 pl-1">
                No tasks scheduled for the next 7 days.
              </p>
            ) : (
              <div className="space-y-1.5">
                {next7DaysTasks.map((task) => (
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

          {/* Future / Later */}
          {futureTasks.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-border">
                <div className="flex items-center gap-2 text-xs font-semibold text-main">
                  <CalendarClock className="w-3.5 h-3.5 text-secondary" />
                  <span>Later / Future</span>
                </div>
                <span className="text-[11px] text-secondary">
                  {futureTasks.length} {futureTasks.length === 1 ? "task" : "tasks"}
                </span>
              </div>

              <div className="space-y-1.5">
                {futureTasks.map((task) => (
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

          {/* Tasks Without Due Date */}
          <section className="space-y-2 pt-2">
            <div className="flex items-center justify-between pb-1 border-b border-border">
              <div className="flex items-center gap-2 text-xs font-semibold text-secondary">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>No Due Date ({noDueDateTasks.length})</span>
              </div>
              <span className="text-[11px] text-secondary">
                Backlog / Unscheduled
              </span>
            </div>

            {noDueDateTasks.length === 0 ? (
              <p className="text-xs text-secondary italic py-2 pl-1">
                All tasks have scheduled deadlines.
              </p>
            ) : (
              <div className="space-y-1.5">
                {noDueDateTasks.map((task) => (
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
