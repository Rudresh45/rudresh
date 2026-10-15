"""Domain model for a Project, independent of Django ORM.

This class encapsulates the business logic for a project container that holds
tasks. It is intentionally NOT a Django model - it is a plain Python class that
can be used in services, views, or converted to a Django model later.

The Project supports two lifecycle states: active and archived.
When a project is archived, existing tasks are preserved but no new tasks may be
added until the project is reactivated.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum, auto
from typing import Optional, List


class Status(Enum):
    ACTIVE = auto()
    ARCHIVED = auto()

    def __str__(self) -> str:
        return self.name.lower()


class ValidationError(ValueError):
    """Raised when a Project is constructed or mutated with invalid data."""
    pass


class Project:
    """A project container for tasks.

    Attributes
    ----------
    id : int
        Unique identifier assigned by the caller / repository.
    name : str
        Human-readable project name; must be non-empty after stripping.
    description : str | None
        Optional free-form project description.
    status : Status
        Either ``Status.ACTIVE`` or ``Status.ARCHIVED``.
    created_at : datetime
        When the project was first created (timezone-aware UTC).
    updated_at : datetime
        When the project was last modified.
    tasks : list[Task]
        Collection of tasks owned by this project. Note: this is a plain list;
        the class does not enforce Django‑related relations.
    """

    def __init__(
        self,
        *,
        id: int,
        name: str,
        description: str | None = None,
        status: Status | None = None,
    ) -> None:
        # --- id ---
        if not isinstance(id, int):
            raise ValidationError(f"id must be int, got {type(id).__name__}")
        self.id: int = id

        # --- name ---
        name_stripped = name.strip()
        if not name_stripped:
            raise ValidationError("name must be a non-empty string")
        self.name: str = name_stripped

        # --- description ---
        self.description: str | None = description

        # --- status ---
        self.status: Status = status if status is not None else Status.ACTIVE

        # --- timestamps ---
        now: datetime = datetime.now(self._tz())
        self._created_at: datetime = now
        self._updated_at: datetime = now
        self._tasks: List["Task"] = []

    # ------------------------------------------------------------------
    # Properties
    # ------------------------------------------------------------------
    @property
    def created_at(self) -> datetime:
        return self._created_at

    @property
    def updated_at(self) -> datetime:
        return self._updated_at

    @property
    def tasks(self) -> List["Task"]:
        # Return a copy to avoid accidental mutation of the internal list.
        return list(self._tasks)

    # ------------------------------------------------------------------
    # Mutators
    # ------------------------------------------------------------------
    def rename(self, new_name: str) -> None:
        """Rename the project.

        Parameters
        ----------
        new_name : str
            Must be non-empty after stripping.
        """
        stripped = new_name.strip()
        if not stripped:
            raise ValidationError("name must be a non-empty string")
        self.name = stripped
        self._updated_at = datetime.now(self._tz())
        self._log_update("rename")

    def update_description(self, new_description: str | None) -> None:
        """Update the project description.

        Parameters
        ----------
        new_description : str | None
            None clears the description; any string sets it.
        """
        self.description = new_description
        self._updated_at = datetime.now(self._tz())
        self._log_update("update_description")

    def archive(self) -> None:
        """Archive the project.

        Effects
        ---------
        - Changes ``status`` to ``Status.ARCHIVED``.
        - Updates ``updated_at``.
        - New tasks cannot be added until the project is reactivated.
        - Existing tasks are preserved unchanged.

        Raises
        ------
        ValidationError
            If the project is already archived.
        """
        if self.status == Status.ARCHIVED:
            raise ValidationError("Project is already archived")
        self.status = Status.ARCHIVED
        self._updated_at = datetime.now(self._tz())
        self._log_update("archive")

    def reactivate(self) -> None:
        """Reactivate an archived project.

        Effects
        ---------
        - Changes ``status`` back to ``Status.ACTIVE``.
        - Updates ``updated_at``.
        - New tasks can be added again.
        """
        self.status = Status.ACTIVE
        self._updated_at = datetime.now(self._tz())
        self._log_update("reactivate")

    def add_task(self, task: "Task") -> "Task":
        """Add a task to the project.

        Parameters
        ----------
        task : Task
            The task to add.

        Raises
        ------
        ValidationError
            If the project is archived.
        """
        if self.status == Status.ARCHIVED:
            raise ValidationError(
                "Cannot add task to an archived project. "
                "Reactivate the project first."
            )
        self._tasks.append(task)
        self._updated_at = datetime.now(self._tz())
        self._log_update("add_task")
        return task

    # ------------------------------------------------------------------
    # Timezone helper
    # ------------------------------------------------------------------
    def _tz(self) -> object:
        """Return a fixed UTC timezone instance for datetime-awareness."""
        from datetime import timezone
        return timezone.utc

    # ------------------------------------------------------------------
    # Internal hook
    # ------------------------------------------------------------------
    def _log_update(self, field: str) -> None:
        """Hook for subclasses or middleware to react to attribute changes.

        By default a no-op. Override or connect to signals as needed.
        """
        pass

    def __repr__(self) -> str:
        return (
            f"Project(id={self.id}, name={self.name!r}, "
            f"status={self.status})"
        )

    def __str__(self) -> str:
        return self.name