"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Calendar, FolderKanban, Flag, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Task, Project, TaskPriority, TaskStatus, CreateTaskPayload, UpdateTaskPayload } from "../lib/types";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateTaskPayload | UpdateTaskPayload) => Promise<void>;
  task?: Task | null;
  projects?: Project[];
  defaultProjectId?: number | null;
  defaultDueDate?: string | null;
}

export function TaskModal({
  isOpen,
  onClose,
  onSave,
  task,
  projects = [],
  defaultProjectId = null,
  defaultDueDate = null,
}: TaskModalProps) {
  const isEditing = !!task;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("med");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [dueDate, setDueDate] = useState<string>("");
  const [projectId, setProjectId] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (task) {
        setTitle(task.title);
        setDescription(task.description || "");
        setPriority(task.priority);
        setStatus(task.status);
        setDueDate(task.due_date || "");
        setProjectId(task.project);
      } else {
        setTitle("");
        setDescription("");
        setPriority("med");
        setStatus("todo");
        setDueDate(defaultDueDate || "");
        setProjectId(defaultProjectId);
      }
      setError(null);
      setIsSubmitting(false);

      // Focus first input after modal opens
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, task, defaultProjectId, defaultDueDate]);

  const handleSubmit = React.useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError("Task title is required.");
      titleInputRef.current?.focus();
      return;
    }

    if (cleanTitle.length > 200) {
      setError("Title cannot exceed 200 characters.");
      return;
    }

    // Verify project is not archived if assigned
    if (projectId) {
      const selectedProj = projects.find((p) => p.id === projectId);
      if (selectedProj && selectedProj.status === 2) {
        setError("Cannot assign a task to an archived project. Please select an active project.");
        return;
      }
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const payload: CreateTaskPayload = {
        title: cleanTitle,
        description: description.trim() ? description.trim() : null,
        priority,
        status,
        due_date: dueDate ? dueDate : null,
        project: projectId ? Number(projectId) : null,
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [title, description, priority, status, dueDate, projectId, projects, onSave, onClose]);

  // Keyboard navigation: Escape closes, Ctrl+Enter / Cmd+Enter submits
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !isSubmitting) {
        handleSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose, handleSubmit]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div
        className="w-full max-w-lg bg-surface rounded-lg shadow-dropdown border border-border flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-subtle/50">
          <h2 id="task-modal-title" className="text-sm font-semibold text-main tracking-tight">
            {isEditing ? "Edit Task" : "Create New Task"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-secondary hover:text-main p-1 rounded hover:bg-subtle transition-colors focus-ring"
            aria-label="Close dialog"
            disabled={isSubmitting}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="task-title" className="block text-xs font-medium text-main mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="task-title"
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement refresh token rotation in auth service"
              disabled={isSubmitting}
              maxLength={200}
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded focus-ring placeholder:text-secondary/50 text-main"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="task-description" className="block text-xs font-medium text-main mb-1.5">
              Description <span className="text-secondary font-normal">(optional)</span>
            </label>
            <textarea
              id="task-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, links, or reproduction steps..."
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded focus-ring placeholder:text-secondary/50 text-main resize-y"
            />
          </div>

          {/* Row: Priority & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-priority" className="block text-xs font-medium text-main mb-1.5 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-secondary" />
                Priority
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                disabled={isSubmitting}
                className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded focus-ring text-main font-medium"
              >
                <option value="low">Low</option>
                <option value="med">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label htmlFor="task-status" className="block text-xs font-medium text-main mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
                Status
              </label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                disabled={isSubmitting}
                className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded focus-ring text-main font-medium"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          {/* Row: Due Date & Project */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-due-date" className="block text-xs font-medium text-main mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-secondary" />
                Due Date
              </label>
              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded focus-ring text-main"
              />
            </div>

            <div>
              <label htmlFor="task-project" className="block text-xs font-medium text-main mb-1.5 flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-secondary" />
                Project
              </label>
              <select
                id="task-project"
                value={projectId || ""}
                onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : null)}
                disabled={isSubmitting}
                className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded focus-ring text-main font-medium"
              >
                <option value="">No Project</option>
                {projects.map((proj) => {
                  const isArchived = proj.status === 2;
                  return (
                    <option
                      key={proj.id}
                      value={proj.id}
                      disabled={isArchived}
                    >
                      {proj.name} {isArchived ? "(Archived - read only)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-subtle/30">
          <span className="text-[11px] text-secondary hidden sm:inline">
            <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded text-[10px]">Enter</kbd> to save
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs font-medium text-secondary hover:text-main bg-surface hover:bg-subtle rounded border border-border transition-colors focus-ring"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-brand-indigo hover:bg-brand-indigo-hover rounded shadow-subtle transition-colors focus-ring disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? "Save Changes" : "Create Task"}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
