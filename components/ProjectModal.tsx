"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, FolderKanban, AlertCircle, Loader2 } from "lucide-react";
import { Project, ProjectStatus, CreateProjectPayload, UpdateProjectPayload } from "../lib/types";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateProjectPayload | UpdateProjectPayload) => Promise<void>;
  project?: Project | null;
}

export function ProjectModal({
  isOpen,
  onClose,
  onSave,
  project,
}: ProjectModalProps) {
  const isEditing = !!project;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (project) {
        setName(project.name);
        setDescription(project.description || "");
        setStatus(project.status);
      } else {
        setName("");
        setDescription("");
        setStatus(1);
      }
      setError(null);
      setIsSubmitting(false);

      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, project]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Project name is required.");
      nameInputRef.current?.focus();
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onSave({
        name: cleanName,
        description: description.trim() ? description.trim() : null,
        status,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
    >
      <div
        className="w-full max-w-md bg-surface rounded-lg shadow-dropdown border border-border flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-subtle/50">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-brand-indigo" />
            <h2 id="project-modal-title" className="text-sm font-semibold text-main">
              {isEditing ? "Edit Project" : "New Project"}
            </h2>
          </div>
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="project-name" className="block text-xs font-medium text-main mb-1.5">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              id="project-name"
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Core Auth Refactor"
              disabled={isSubmitting}
              maxLength={200}
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded focus-ring text-main"
            />
          </div>

          <div>
            <label htmlFor="project-description" className="block text-xs font-medium text-main mb-1.5">
              Description <span className="text-secondary font-normal">(optional)</span>
            </label>
            <textarea
              id="project-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is the objective of this project?"
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded focus-ring text-main resize-y"
            />
          </div>

          <div>
            <label htmlFor="project-status" className="block text-xs font-medium text-main mb-1.5">
              Lifecycle Status
            </label>
            <select
              id="project-status"
              value={status}
              onChange={(e) => setStatus(Number(e.target.value) as ProjectStatus)}
              disabled={isSubmitting}
              className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded focus-ring text-main font-medium"
            >
              <option value={1}>Active</option>
              <option value={2}>Archived</option>
            </select>
            {status === 2 && (
              <p className="mt-1 text-[11px] text-amber-700">
                Archived projects cannot be assigned new tasks.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs font-medium text-secondary hover:text-main bg-surface hover:bg-subtle rounded border border-border transition-colors focus-ring"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-brand-indigo hover:bg-brand-indigo-hover rounded shadow-subtle transition-colors focus-ring disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? "Save Changes" : "Create Project"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
