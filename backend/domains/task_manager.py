"""TaskManager service that coordinates task and project operations.

Uses composition to manage Task and Project objects with in-memory storage only.
Validates references, prevents duplicate identifiers, and raises meaningful
exceptions for missing records and invalid operations.
"""

from __future__ import annotations

from datetime import date, datetime
from enum import Enum, auto
from typing import Optional, List

from domains.task import Priority, Status, Task, ValidationError as TaskValidationError
from domains.project import Project, Status as ProjectStatus, ValidationError as ProjectValidationError


class TaskManager:
    """Service layer that orchestrates Task and Project domain objects.

    This class uses composition — it holds references to Task and Project
    instances but does not own their lifecycle.  The caller is responsible for
    creating/owning the objects; TaskManager merely wires them together and
    enforces business rules such as "a task can only belong to one project",
    "archived projects cannot receive new tasks", etc.

    Storage is entirely in‑memory.  No Django ORM or database interaction is
    performed.
    """

    def __init__(self) -> None:
        # In‑memory repositories: simple dicts keyed by integer ID.
        self._tasks: dict[int, Task] = {}
        self._projects: dict[int, Project] = {}

    # ------------------------------------------------------------------
    # Task CRUD
    # ------------------------------------------------------------------
    def create_task(
        self,
        *,
        title: str,
        description: str | None = None,
        priority: Priority = Priority.MEDIUM,
        due_date: date | None = None,
    ) -> Task:
        """Create a new Task and store it in memory.

        Parameters
        ----------
        title : str
            Must be non‑empty after stripping.
        description : str | None
            Optional free‑form text.
        priority : Priority
            One of the Priority enum members.
        due_date : date | None
            Optional deadline.

        Returns
        -------
        Task
        """
        task_id = self._next_id(self._tasks)
        # Let the Task constructor validate title, priority, etc.
        # Pass the generated int id so the constructor accepts it.
        task = Task(
            id=task_id,
            title=title,
            description=description,
            priority=priority,
            due_date=due_date,
        )
        self._tasks[task_id] = task
        return task

    def get_task(self, task_id: int) -> Task:
        """Return the Task with the given id, or raise TaskValidationError."""
        if task_id not in self._tasks:
            raise TaskValidationError(f"Task with id={task_id} not found")
        return self._tasks[task_id]

    def update_task(self, task_id: int, *, title: str | None = None, description: str | None = None, priority: Priority | None = None) -> Task:
        """Update fields of an existing Task.

        Only the fields supplied are changed; others remain intact.
        Raises TaskValidationError if the task does not exist.
        """
        task = self.get_task(task_id)
        if title is not None:
            task.update_title(title)
        if description is not None:
            task.update_description(description)
        if priority is not None:
            task.update_priority(priority)
        return task

    def delete_task(self, task_id: int) -> None:
        """Remove a Task from the manager's storage.

        Raises TaskValidationError if the task does not exist.
        Also removes the task from any Project it may belong to (updates that
        Project's internal task list).
        """
        task = self.get_task(task_id)
        # Remove from any project that owns it.
        for project in self._projects.values():
            if task in project.tasks:
                project._tasks.remove(task)  # type: ignore[attr-defined]
        # Remove from the manager's own dict.
        del self._tasks[task_id]

    # ------------------------------------------------------------------
    # Task lifecycle (complete / reopen)
    # ------------------------------------------------------------------
    def complete_task(self, task_id: int) -> Task:
        """Mark a task as done.

        Raises TaskValidationError if the task does not exist.
        """
        task = self.get_task(task_id)
        task.mark_complete()
        return task

    def reopen_task(self, task_id: int) -> Task:
        """Reopen a completed task, clearing completed_at and moving it back to todo.

        Raises TaskValidationError if the task does not exist.
        """
        task = self.get_task(task_id)
        task.reopen()
        return task

    # ------------------------------------------------------------------
    # Query operations
    # ------------------------------------------------------------------
    def list_tasks(self) -> List[Task]:
        """Return a copy of all tasks stored in the manager."""
        return list(self._tasks.values())

    def filter_by_status(self, status: Status) -> List[Task]:
        """Return tasks whose status matches the given Status enum."""
        return [t for t in self._tasks.values() if t.status == status]

    def filter_by_priority(self, priority: Priority) -> List[Task]:
        """Return tasks whose priority matches the given Priority enum."""
        return [t for t in self._tasks.values() if t.priority == priority]

    def list_overdue_tasks(self, reference_date: date | datetime | None = None) -> List[Task]:
        """Return tasks that are not completed and past their due date.

        Parameters
        ----------
        reference_date : date | datetime | None
            If None, uses today's UTC date.
        """
        return [t for t in self._tasks.values() if t.is_overdue(reference_date)]

    # ------------------------------------------------------------------
    # Project CRUD
    # ------------------------------------------------------------------
    def create_project(self, *, name: str, description: str | None = None, status: ProjectStatus | None = None) -> Project:
        """Create a new Project and store it in memory.

        Parameters
        ----------
        name : str
            Must be non‑empty after stripping.
        description : str | None
            Optional free‑form text.
        status : Status | None
            Either ``ProjectStatus.ACTIVE`` or ``ProjectStatus.ARCHIVED``.
            If None, the project is created ``ACTIVE``.

        Returns
        -------
        Project
        """
        project_id = self._next_id(self._projects)
        project = Project(
            id=project_id,
            name=name,
            description=description,
            status=status,
        )
        self._projects[project_id] = project
        return project

    def get_project(self, project_id: int) -> Project:
        """Return the Project with the given id, or raise ProjectValidationError."""
        if project_id not in self._projects:
            raise ProjectValidationError(f"Project with id={project_id} not found")
        return self._projects[project_id]

    def list_project_tasks(self, project_id: int) -> List[Task]:
        """Return a copy of the tasks belonging to the named project.

        Raises ProjectValidationError if the project does not exist.
        """
        project = self.get_project(project_id)
        return project.tasks  # property returns a copy

    def assign_task_to_project(self, task_id: int, project_id: int) -> Task:
        """Assign an existing task to a project.

        Effects
        ---------
        - The task is removed from any project it was previously attached to
          (if any).
        - The task is added to the target project.
        - Raises TaskValidationError or ProjectValidationError if either
          reference is missing.
        - Raises ProjectValidationError if the target project is archived.

        Returns
        -------
        Task
        """
        task = self.get_task(task_id)
        project = self.get_project(project_id)

        if project.status == ProjectStatus.ARCHIVED:
            raise ProjectValidationError(
                "Cannot assign task to an archived project. "
                "Reactivate the project first."
            )

        # Remove the task from its current project, if any.
        for pid, p in self._projects.items():
            if task in p.tasks:
                p._tasks.remove(task)  # type: ignore[attr-defined]
                break

        # Add to the new project.
        project._tasks.append(task)  # type: ignore[attr-defined]
        return task

    # ------------------------------------------------------------------
    # Helper: next free integer ID
    # ------------------------------------------------------------------
    @staticmethod
    def _next_id(store: dict[int, object]) -> int:
        """Return the next unused integer ID given the current store dict."""
        if not store:
            return 1
        return max(store.keys()) + 1