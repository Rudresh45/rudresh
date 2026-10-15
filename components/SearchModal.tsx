"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, CheckSquare, FolderKanban, ArrowRight } from "lucide-react";
import { Task, Project } from "../lib/types";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  projects: Project[];
  onSelectTask: (task: Task) => void;
  onSelectProject: (project: Project) => void;
}

export function SearchModal({
  isOpen,
  onClose,
  tasks,
  projects,
  onSelectTask,
  onSelectProject,
}: SearchModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  const matchingTasks = cleanQuery
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(cleanQuery) ||
          (t.description && t.description.toLowerCase().includes(cleanQuery))
      ).slice(0, 8)
    : [];

  const matchingProjects = cleanQuery
    ? projects.filter(
        (p) =>
          p.name.toLowerCase().includes(cleanQuery) ||
          (p.description && p.description.toLowerCase().includes(cleanQuery))
      ).slice(0, 4)
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-16 bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-xl bg-surface rounded-lg shadow-dropdown border border-border flex flex-col overflow-hidden max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-subtle/30">
          <Search className="w-4 h-4 text-secondary flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, descriptions, projects..."
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-secondary/60 text-main"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-secondary hover:text-main rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="px-1.5 py-0.5 text-[10px] text-secondary bg-surface border border-border rounded">
            ESC
          </kbd>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {!cleanQuery ? (
            <div className="py-8 text-center text-xs text-secondary">
              Type to search across tasks and projects...
            </div>
          ) : matchingTasks.length === 0 && matchingProjects.length === 0 ? (
            <div className="py-8 text-center text-xs text-secondary">
              No tasks or projects found matching &quot;{query}&quot;.
            </div>
          ) : (
            <div className="space-y-4">
              {matchingTasks.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[11px] font-semibold text-secondary uppercase tracking-wider">
                    Tasks ({matchingTasks.length})
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchingTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => {
                          onSelectTask(task);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-left rounded hover:bg-subtle text-xs text-main transition-colors focus-ring"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <CheckSquare className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                          <span className={`truncate ${task.status === "done" ? "line-through text-secondary" : ""}`}>
                            {task.title}
                          </span>
                        </div>
                        <span className="text-[10px] uppercase font-semibold text-secondary ml-2 flex-shrink-0">
                          {task.status.replace("_", " ")}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {matchingProjects.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[11px] font-semibold text-secondary uppercase tracking-wider">
                    Projects ({matchingProjects.length})
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchingProjects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => {
                          onSelectProject(project);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-left rounded hover:bg-subtle text-xs text-main transition-colors focus-ring"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FolderKanban className="w-3.5 h-3.5 text-brand-teal flex-shrink-0" />
                          <span className="truncate font-medium">{project.name}</span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-secondary" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
