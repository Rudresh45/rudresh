"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  FolderKanban,
  ChevronLeft,
  Edit2,
  Archive,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle2,
  ListTodo,
} from "lucide-react";
import { useTasks } from "../../../components/AppShell";
import { TaskRow } from "../../../components/TaskRow";
import { QuickAddTask } from "../../../components/QuickAddTask";
import { ProjectModal } from "../../../components/ProjectModal";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { projectsApi } from "../../../lib/projects-api";
import { Task, Project, ProjectStatus } from "../../../lib/types";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);

  const {
    tasks,
    projects,
    isLoading,
    refreshData,
    createTask,
    completeTask,
    reopenTask,
    startTask,
    blockTask,
    deleteTask,
    openEditTaskModal,
    openNewTaskModal,
  } = useTasks();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const project = projects.find((p) => p.id === projectId);
  const projectTasks = tasks.filter((t) => t.project === projectId);

  const totalTasks = projectTasks.length;
  const completedTasks = projectTasks.filter((t) => t.status === "done").length;
  const inProgressTasks = projectTasks.filter((t) => t.status === "in_progress").length;
  const blockedTasks = projectTasks.filter((t) => t.status === "blocked").length;
  const progressPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const isArchived = project?.status === 2;

  const handleToggleComplete = async (task: Task) => {
    if (task.status === "done") {
      await reopenTask(task.id);
    } else {
      await completeTask(task.id);
    }
  };

  const handleUpdateProject = async (payload: any) => {
    if (project) {
      await projectsApi.updateProject(project.id, payload);
      await refreshData();
    }
  };

  const handleToggleArchive = async () => {
    if (project) {
      const newStatus: ProjectStatus = project.status === 1 ? 2 : 1;
      await projectsApi.updateProject(project.id, { status: newStatus });
      await refreshData();
    }
  };

  const handleDeleteProject = async () => {
    if (project) {
      await projectsApi.deleteProject(project.id);
      await refreshData();
      router.push("/projects");
    }
  };

  const handleDeleteTask = async () => {
    if (taskToDelete) {
      await deleteTask(taskToDelete.id);
      setTaskToDelete(null);
    }
  };

  if (!isLoading && !project) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-main">Project Not Found</h2>
        <p className="text-xs text-secondary max-w-sm mx-auto">
          Project #{params.id} does not exist or may have been deleted.
        </p>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-brand-indigo hover:bg-brand-indigo-hover rounded shadow-subtle transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 text-xs text-secondary">
        <Link href="/projects" className="hover:text-main hover:underline flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Projects</span>
        </Link>
        <span>/</span>
        <span className="text-main font-medium truncate">{project?.name}</span>
      </div>

      {/* Project Card Header */}
      <div className="bg-surface border border-border rounded-lg p-5 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-main">
                {project?.name}
              </h1>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                  isArchived ? "bg-gray-100 text-gray-700" : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {isArchived ? "Archived" : "Active"}
              </span>
            </div>
            {project?.description && (
              <p className="text-xs sm:text-sm text-secondary leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-secondary hover:text-main bg-subtle hover:bg-gray-200/60 rounded border border-border transition-colors focus-ring"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={handleToggleArchive}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-secondary hover:text-main bg-subtle hover:bg-gray-200/60 rounded border border-border transition-colors focus-ring"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{isArchived ? "Reactivate" : "Archive"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="p-1.5 text-secondary hover:text-red-600 bg-subtle hover:bg-red-50 rounded border border-border transition-colors focus-ring"
              title="Delete project"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Real Calculated Progress Bar */}
        <div className="pt-2 border-t border-border/70 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-secondary font-medium">
              Progress: {completedTasks} of {totalTasks} tasks completed
            </span>
            <span className="font-semibold text-main">{progressPercentage}%</span>
          </div>
          <div className="w-full h-2 bg-subtle rounded-full overflow-hidden border border-border/40">
            <div
              className="h-full bg-brand-teal transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="flex items-center gap-4 text-[11px] text-secondary pt-1">
            <span>Total: <strong>{totalTasks}</strong></span>
            <span>Completed: <strong>{completedTasks}</strong></span>
            <span>In Progress: <strong>{inProgressTasks}</strong></span>
            {blockedTasks > 0 && (
              <span className="text-red-600">Blocked: <strong>{blockedTasks}</strong></span>
            )}
          </div>
        </div>
      </div>

      {/* Task Creation within Project */}
      {isArchived ? (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            This project is archived. In accordance with backend rules, tasks cannot be added to archived projects. Reactivate the project to add new tasks.
          </span>
        </div>
      ) : (
        <QuickAddTask
          onAdd={async (payload) => {
            await createTask({ ...payload, project: projectId });
          }}
          defaultProjectId={projectId}
          placeholder={`Add task to "${project?.name}"... (press Enter to save)`}
        />
      )}

      {/* Task List */}
      <section className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-main">
          <span>Project Tasks ({projectTasks.length})</span>
          {!isArchived && (
            <button
              onClick={() => openNewTaskModal(null, projectId)}
              className="text-brand-indigo hover:underline font-medium text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add task</span>
            </button>
          )}
        </div>

        {projectTasks.length === 0 ? (
          <div className="px-6 py-12 bg-surface border border-border rounded text-center">
            <ListTodo className="w-10 h-10 text-secondary/60 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-main">No tasks in this project yet</h3>
            <p className="text-xs text-secondary mt-1">
              Add tasks using the quick creation box above to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {projectTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                project={project}
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

      {/* Edit Project Modal */}
      <ProjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateProject}
        project={project}
      />

      {/* Delete Project Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="Delete Project"
        message={`Are you sure you want to delete "${project?.name}"? Associated tasks will be kept in your workspace without a project association.`}
        confirmLabel="Delete Project"
        onConfirm={handleDeleteProject}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />

      {/* Delete Task Confirmation */}
      <ConfirmDialog
        isOpen={!!taskToDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Task"
        onConfirm={handleDeleteTask}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
}
