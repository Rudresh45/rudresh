"use client";

import React, { useState } from "react";
import { Plus, Calendar, Flag, Loader2 } from "lucide-react";
import { CreateTaskPayload, TaskPriority } from "../lib/types";

interface QuickAddTaskProps {
  onAdd: (payload: CreateTaskPayload) => Promise<void>;
  defaultDueDate?: string | null;
  defaultProjectId?: number | null;
  placeholder?: string;
}

export function QuickAddTask({
  onAdd,
  defaultDueDate = null,
  defaultProjectId = null,
  placeholder = "Quick add a task... (press Enter to save)",
}: QuickAddTaskProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("med");
  const [dueDate, setDueDate] = useState<string>(defaultDueDate || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle || isLoading) return;

    setIsLoading(true);
    try {
      await onAdd({
        title: cleanTitle,
        priority,
        status: "todo",
        due_date: dueDate || null,
        project: defaultProjectId,
      });
      setTitle("");
      setDueDate(defaultDueDate || "");
      setPriority("med");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex items-center gap-2 px-3 py-2 bg-surface border rounded transition-all ${
        isFocused ? "border-brand-indigo ring-1 ring-brand-indigo/30 shadow-subtle" : "border-border"
      }`}
    >
      <div className="flex-shrink-0 text-secondary">
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-brand-indigo" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={isLoading}
        className="flex-1 text-xs sm:text-sm bg-transparent outline-none placeholder:text-secondary/60 text-main"
      />

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Quick Priority Toggle */}
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          disabled={isLoading}
          className="text-[11px] font-medium bg-subtle text-secondary hover:text-main px-1.5 py-1 rounded border border-border/80 focus-ring"
          title="Select priority"
        >
          <option value="low">Low</option>
          <option value="med">Med</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <button
          type="submit"
          disabled={!title.trim() || isLoading}
          className="hidden sm:inline-flex px-2 py-1 text-[11px] font-medium text-white bg-brand-indigo hover:bg-brand-indigo-hover rounded disabled:opacity-40 transition-colors focus-ring"
        >
          Add
        </button>
      </div>
    </form>
  );
}
