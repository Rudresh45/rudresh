"use client";

import React, { useState } from "react";
import {
  Calendar,
  FolderKanban,
  Play,
  Ban,
  CheckCircle2,
  Circle,
  MoreVertical,
  Edit2,
  Trash2,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { Task, Project } from "../lib/types";

interface TaskRowProps {
  task: Task;
  project?: Project | null;
  onToggleComplete: (task: Task) => Promise<void>;
  onStart?: (task: Task) => Promise<void>;
  onBlock?: (task: Task) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskRow({
  task,
  project,
  onToggleComplete,
  onStart,
  onBlock,
  onEdit,
  onDelete,
}: TaskRowProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const isDone = task.status === "done";
  const isBlocked = task.status === "blocked";
  const isInProgress = task.status === "in_progress";

  // Check if overdue
  let isOverdue = false;
  let formattedDueDate = "";
  if (task.due_date) {
    const todayStr = new Date().toISOString().split("T")[0];
    isOverdue = !isDone && task.due_date < todayStr;

    // Friendly date representation
    const parts = task.due_date.split("-");
    if (parts.length === 3) {
      const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const diffDays = Math.round(
        (dateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 0) {
        formattedDueDate = "Today";
      } else if (diffDays === 1) {
        formattedDueDate = "Tomorrow";
      } else if (diffDays === -1) {
        formattedDueDate = "Yesterday";
      } else {
        formattedDueDate = dateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }
    } else {
      formattedDueDate = task.due_date;
    }
  }

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isActionLoading) return;
    setIsActionLoading(true);
    try {
      await onToggleComplete(task);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStart && !isActionLoading) {
      setIsActionLoading(true);
      try {
        await onStart(task);
      } finally {
        setIsActionLoading(false);
        setIsMenuOpen(false);
      }
    }
  };

  const handleBlock = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBlock && !isActionLoading) {
      setIsActionLoading(true);
      try {
        await onBlock(task);
      } finally {
        setIsActionLoading(false);
        setIsMenuOpen(false);
      }
    }
  };

  // Priority badge styling
  const priorityStyles: Record<string, { label: string; text: string; bg: string }> = {
    low: { label: "Low", text: "text-secondary", bg: "bg-subtle" },
    med: { label: "Med", text: "text-brand-teal", bg: "bg-brand-teal-subtle" },
    high: { label: "High", text: "text-amber-700", bg: "bg-amber-50" },
    urgent: { label: "Urgent", text: "text-red-700", bg: "bg-red-50" },
  };
  const pStyle = priorityStyles[task.priority] || priorityStyles.med;

  return (
    <div
      onClick={() => onEdit(task)}
      className={`group relative flex items-center gap-3 px-3.5 py-2.5 bg-surface hover:bg-subtle/40 border border-border rounded transition-colors cursor-pointer select-none ${
        isDone ? "opacity-75 bg-subtle/20" : ""
      }`}
    >
      {/* Complete Checkbox */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={isActionLoading}
        className={`flex-shrink-0 p-1 rounded transition-colors focus-ring ${
          isDone
            ? "text-brand-teal hover:text-brand-teal-hover"
            : "text-secondary/50 hover:text-brand-indigo"
        }`}
        aria-label={isDone ? "Reopen task" : "Complete task"}
      >
        {isDone ? (
          <CheckCircle2 className="w-4 h-4 fill-brand-teal-subtle text-brand-teal" />
        ) : (
          <Circle className="w-4 h-4 stroke-[1.75]" />
        )}
      </button>

      {/* Task Content: Title & Details */}
      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs sm:text-sm font-medium text-main truncate ${
                isDone ? "line-through text-secondary" : ""
              }`}
            >
              {task.title}
            </span>

            {/* In Progress indicator */}
            {isInProgress && !isDone && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-indigo-subtle text-brand-indigo flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-indigo animate-pulse" />
                In Progress
              </span>
            )}

            {/* Blocked indicator */}
            {isBlocked && !isDone && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 flex-shrink-0">
                <Ban className="w-2.5 h-2.5" />
                Blocked
              </span>
            )}
          </div>

          {task.description && (
            <p className="text-[11px] text-secondary truncate mt-0.5 max-w-xl">
              {task.description}
            </p>
          )}
        </div>

        {/* Metadata Badges */}
        <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-auto">
          {/* Project Badge */}
          {project && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-subtle text-secondary border border-border/60">
              <FolderKanban className="w-3 h-3 text-secondary/70" />
              <span className="truncate max-w-[120px]">{project.name}</span>
            </span>
          )}

          {/* Due Date Badge */}
          {task.due_date && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                isOverdue
                  ? "bg-red-50 text-red-700 border-red-200"
                  : formattedDueDate === "Today"
                  ? "bg-brand-indigo-subtle text-brand-indigo border-brand-indigo/20 font-semibold"
                  : "bg-surface text-secondary border-border"
              }`}
            >
              {isOverdue && <AlertTriangle className="w-3 h-3" />}
              {!isOverdue && <Calendar className="w-3 h-3" />}
              <span>{formattedDueDate}</span>
            </span>
          )}

          {/* Priority Pill */}
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${pStyle.bg} ${pStyle.text}`}
          >
            {pStyle.label}
          </span>
        </div>
      </div>

      {/* Action Buttons (visible on hover or mobile) */}
      <div
        className="flex items-center gap-1 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Quick lifecycle action */}
        {!isDone && task.status === "todo" && onStart && (
          <button
            type="button"
            onClick={handleStart}
            disabled={isActionLoading}
            title="Start working (in progress)"
            className="p-1 text-secondary hover:text-brand-indigo hover:bg-subtle rounded focus-ring transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
          </button>
        )}

        {!isDone && task.status !== "blocked" && onBlock && (
          <button
            type="button"
            onClick={handleBlock}
            disabled={isActionLoading}
            title="Mark as blocked"
            className="p-1 text-secondary hover:text-red-600 hover:bg-subtle rounded focus-ring transition-colors"
          >
            <Ban className="w-3.5 h-3.5" />
          </button>
        )}

        {isDone && (
          <button
            type="button"
            onClick={handleToggle}
            disabled={isActionLoading}
            title="Reopen task"
            className="p-1 text-secondary hover:text-brand-teal hover:bg-subtle rounded focus-ring transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={() => onEdit(task)}
          title="Edit task"
          className="p-1 text-secondary hover:text-main hover:bg-subtle rounded focus-ring transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(task)}
          title="Delete task"
          className="p-1 text-secondary hover:text-red-600 hover:bg-subtle rounded focus-ring transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
