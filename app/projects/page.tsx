"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Plus,
  ArrowRight,
  Archive,
  CheckCircle2,
  ListTodo,
  Edit2,
  Trash2,
  Info,
} from "lucide-react";
import { useTasks } from "../../components/AppShell";
import { ProjectModal } from "../../components/ProjectModal";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { projectsApi } from "../../lib/projects-api";
import { Project, ProjectStatus } from "../../lib/types";

export default function ProjectsPage() {
  const { tasks, projects, refreshData } = useTasks();

  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "archived">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const filteredProjects = projects.filter((p) => {
    if (filterStatus === "active") return p.status === 1;
    if (filterStatus === "archived") return p.status === 2;
    return true;
  });

  const getProjectStats = (projectId: number) => {
    const projectTasks = tasks.filter((t) => t.project === projectId);
    const total = projectTasks.length;
    const completed = projectTasks.filter((t) => t.status === "done").length;
    const inProgress = projectTasks.filter((t) => t.status === "in_progress").length;
    const blocked = projectTasks.filter((t) => t.status === "blocked").length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, blocked, percentage };
  };

  const handleSaveProject = async (payload: any) => {
    if (editingProject) {
      await projectsApi.updateProject(editingProject.id, payload);
    } else {
      await projectsApi.createProject(payload);
    }
    await refreshData();
  };

  const handleDeleteProject = async () => {
    if (projectToDelete) {
      await projectsApi.deleteProject(projectToDelete.id);
      setProjectToDelete(null);
      await refreshData();
    }
  };

  const handleToggleArchive = async (project: Project, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newStatus: ProjectStatus = project.status === 1 ? 2 : 1;
    await projectsApi.updateProject(project.id, { status: newStatus });
    await refreshData();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-brand-indigo">
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Workspace</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-main mt-0.5">
            Projects
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Group tasks into coherent initiatives and track actual completion progress.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingProject(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-indigo hover:bg-brand-indigo-hover rounded shadow-subtle transition-colors focus-ring self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>
      </div>

      {/* Backend Limitation Notice Banner */}
      <div className="p-3 bg-subtle border border-border rounded-lg text-xs text-secondary flex items-start gap-2.5">
        <Info className="w-4 h-4 text-brand-teal flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-medium text-main">
            Project Storage Status
          </p>
          <p className="text-secondary leading-relaxed">
            Django models and serializers for Project exist in <code className="bg-white px-1 py-0.5 rounded border border-border text-[11px]">projects/models.py</code>, but the backend URL router currently only mounts <code className="bg-white px-1 py-0.5 rounded border border-border text-[11px]">/api/v1/tasks/</code>. Projects are persisted in your local workspace store with project IDs synced to backend tasks.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              filterStatus === "all"
                ? "bg-brand-indigo text-white shadow-subtle"
                : "text-secondary hover:text-main hover:bg-subtle"
            }`}
          >
            All Projects ({projects.length})
          </button>
          <button
            onClick={() => setFilterStatus("active")}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              filterStatus === "active"
                ? "bg-brand-indigo text-white shadow-subtle"
                : "text-secondary hover:text-main hover:bg-subtle"
            }`}
          >
            Active ({projects.filter((p) => p.status === 1).length})
          </button>
          <button
            onClick={() => setFilterStatus("archived")}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              filterStatus === "archived"
                ? "bg-brand-indigo text-white shadow-subtle"
                : "text-secondary hover:text-main hover:bg-subtle"
            }`}
          >
            Archived ({projects.filter((p) => p.status === 2).length})
          </button>
        </div>
      </div>

      {/* Project Grid */}
      {filteredProjects.length === 0 ? (
        <div className="px-6 py-12 bg-surface border border-border rounded text-center">
          <FolderKanban className="w-10 h-10 text-secondary/60 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-main">No projects found</h3>
          <p className="text-xs text-secondary mt-1">
            Create your first project to organize related tasks together.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((project) => {
            const stats = getProjectStats(project.id);
            const isArchived = project.status === 2;

            return (
              <div
                key={project.id}
                className={`bg-surface border rounded-lg p-5 flex flex-col justify-between hover:border-brand-indigo/40 transition-all shadow-card ${
                  isArchived ? "opacity-75 bg-subtle/30" : ""
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FolderKanban className={`w-4 h-4 ${isArchived ? "text-secondary" : "text-brand-indigo"}`} />
                      <h2 className="text-sm font-bold text-main tracking-tight">
                        <Link
                          href={`/projects/${project.id}`}
                          className="hover:text-brand-indigo hover:underline"
                        >
                          {project.name}
                        </Link>
                      </h2>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          isArchived
                            ? "bg-gray-100 text-gray-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {isArchived ? "Archived" : "Active"}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setEditingProject(project);
                          setIsModalOpen(true);
                        }}
                        className="p-1 text-secondary hover:text-main rounded hover:bg-subtle"
                        title="Edit project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleToggleArchive(project, e)}
                        className="p-1 text-secondary hover:text-main rounded hover:bg-subtle"
                        title={isArchived ? "Activate project" : "Archive project"}
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setProjectToDelete(project);
                        }}
                        className="p-1 text-secondary hover:text-red-600 rounded hover:bg-subtle"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {project.description && (
                    <p className="mt-2 text-xs text-secondary line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-border/70 space-y-2">
                  {/* Progress Header */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-secondary font-medium">
                      {stats.completed} of {stats.total} completed
                    </span>
                    <span className="font-semibold text-main">
                      {stats.percentage}%
                    </span>
                  </div>

                  {/* Real Calculated Progress Bar */}
                  <div className="w-full h-1.5 bg-subtle rounded-full overflow-hidden border border-border/50">
                    <div
                      className="h-full bg-brand-teal transition-all duration-300"
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>

                  {/* Task counts footer */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3 text-[11px] text-secondary">
                      <span>{stats.inProgress} in progress</span>
                      {stats.blocked > 0 && (
                        <span className="text-red-600 font-medium">{stats.blocked} blocked</span>
                      )}
                    </div>

                    <Link
                      href={`/projects/${project.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-indigo hover:text-brand-indigo-hover hover:underline"
                    >
                      <span>View Tasks</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProject}
        project={editingProject}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!projectToDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${projectToDelete?.name}"? Tasks associated with this project will be preserved without project association.`}
        confirmLabel="Delete Project"
        onConfirm={handleDeleteProject}
        onCancel={() => setProjectToDelete(null)}
      />
    </div>
  );
}
