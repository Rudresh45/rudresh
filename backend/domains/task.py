"""Domain model for a Task, independent of Django ORM.

This class encapsulates the business logic and state machine for a to-do item.
It is intentionally NOT a Django model - it is a plain Python class that can
be used in services, views, or converted to a Django model later.
"""

from __future__ import annotations

from datetime import date, datetime
from enum import Enum, auto
from typing import Optional


class Priority(Enum):
    LOW = auto()
    MEDIUM = auto()
    HIGH = auto()
    URGENT = auto()

    def __str__(self) -> str:
        return self.name.lower()


class Status(Enum):
    TODO = auto()
    IN_PROGRESS = auto()
    BLOCKED = auto()
    DONE = auto()

    def __str__(self) -> str:
        return self.name.lower()


# Valid transitions: current_status -> set of allowed next_statuses
_TRANSITIONS: dict[Status, set[Status]] = {
    Status.TODO: {Status.IN_PROGRESS, Status.BLOCKED, Status.DONE},
    Status.IN_PROGRESS: {Status.TODO, Status.BLOCKED, Status.DONE},
    Status.BLOCKED: {Status.TODO, Status.IN_PROGRESS, Status.DONE},
    Status.DONE: {Status.IN_PROGRESS},  # reopen handled separately via reopen()
}


class ValidationError(ValueError):
    """Raised when a Task is constructed or mutated with invalid data."""
    pass


class Task:
    """A task in a personal developer to-do list.

    Attributes
    ----------
    id : int
        Unique identifier assigned by the caller / repository.
    title : str
        Human-readable title; must be non-empty after stripping.
    description : str | None
        Optional free-form text.
    status : Status
        Current lifecycle state.
    priority : Priority
        Importance level.
    due_date : date | None
        Optional deadline.
    created_at : datetime
        When the task was first created (timezone-aware).
    updated_at : datetime
        When the task was last modified.
    completed_at : datetime | None
        When the task was marked done; None if not completed.
    """

    def __init__(
        self,
        *,
        id: int,
        title: str,
        description: str | None = None,
        status: Status | None = None,
        priority: Priority = Priority.MEDIUM,
        due_date: date | None = None,
    ) -> None:
        # --- id ---
        if not isinstance(id, int):
            raise ValidationError(f"id must be int, got {type(id).__name__}")
        self.id: int = id

        # --- title ---
        title_stripped = title.strip()
        if not title_stripped:
            raise ValidationError("title must be a non-empty string")
        self.title: str = title_stripped

        # --- description ---
        self.description: str | None = description

        # --- status ---
        self.status: Status = status if status is not None else Status.TODO

        # --- priority ---
        if not isinstance(priority, Priority):
            raise ValidationError(f"priority must be a Priority enum, got {type(priority).__name__}")
        self.priority: Priority = priority

        # --- due_date ---
        self.due_date: date | None = due_date

        # --- timestamps ---
        now: datetime = datetime.now(self._tz())
        self._created_at: datetime = now
        self._updated_at: datetime = now
        self._completed_at: Optional[datetime] = None

    @property
    def created_at(self) -> datetime:
        return self._created_at

    @property
    def updated_at(self) -> datetime:
        return self._updated_at

    @property
    def completed_at(self) -> Optional[datetime]:
        return self._completed_at

    # ------------------------------------------------------------------
    # Timezone helper
    # ------------------------------------------------------------------
    def _tz(self) -> object:
        """Return a fixed UTC timezone instance for datetime-awareness."""
        from datetime import timezone
        return timezone.utc

    # ------------------------------------------------------------------
    # Core mutators
    # ------------------------------------------------------------------
    def update_title(self, new_title: str) -> None:
        """Replace the task title.

        Parameters
        ----------
        new_title : str
            Must be non-empty after stripping.
        """
        stripped = new_title.strip()
        if not stripped:
            raise ValidationError("title must be a non-empty string")
        self.title = stripped
        self._updated_at = datetime.now(self._tz())
        self._log_update("title")

    def update_description(self, new_description: str | None) -> None:
        """Replace the task description.

        Parameters
        ----------
        new_description : str | None
            None clears the description; any string sets it.
        """
        self.description = new_description
        self._updated_at = datetime.now(self._tz())
        self._log_update("description")

    def update_priority(self, new_priority: Priority) -> None:
        """Change the task priority.

        Parameters
        ----------
        new_priority : Priority
            New priority value.
        """
        if not isinstance(new_priority, Priority):
            raise ValidationError("priority must be a Priority enum")
        self.priority = new_priority
        self._updated_at = datetime.now(self._tz())
        self._log_update("priority")

    def start(self) -> None:
        """Transition the task from ``todo`` to ``in_progress``.

        Raises
        ------
        ValidationError
            If the current status does not allow starting.
        """
        if self.status != Status.TODO:
            raise ValidationError(
                f"Cannot start task in {self.status} status; "
                f"only tasks in 'todo' can be started"
            )
        self._transition(Status.TODO, Status.IN_PROGRESS)
        self._updated_at = datetime.now(self._tz())
        self._log_update("start")

    def block(self) -> None:
        """Transition the task to ``blocked``.

        A task can be blocked from any status.
        """
        self._transition_any_to(Status.BLOCKED)
        self._updated_at = datetime.now(self._tz())
        self._log_update("block")

    def mark_complete(self) -> None:
        """Mark the task as ``done``.

        Transition depends on current status:
        - ``in_progress`` → ``done``
        - ``blocked`` → ``done`` (unblock and complete)
        - ``todo`` → ``done`` (quick complete)
        - ``done`` → no-op (already done)

        Sets ``completed_at`` to the current UTC time.
        """
        if self.status == Status.DONE:
            # Already done; nothing to transition, but update timestamp
            self._updated_at = datetime.now(self._tz())
            self._log_update("mark_complete (already done)")
            return

        self._transition_any_to(Status.DONE)
        self._completed_at = datetime.now(self._tz())
        self._updated_at = datetime.now(self._tz())
        self._log_update("mark_complete")

    def reopen(self) -> None:
        """Reopen a completed task.

        Clears ``completed_at`` and transitions back to ``todo``.
        """
        self._completed_at = None
        self._transition_any_to(Status.TODO)
        self._updated_at = datetime.now(self._tz())
        self._log_update("reopen")

    def is_overdue(self, reference_date: date | datetime | None = None) -> bool:
        """Return ``True`` if the task is not completed and past its deadline.

        Parameters
        ----------
        reference_date : date | datetime | None
            If ``None``, uses the current UTC date.

        Returns
        -------
        bool
        """
        if self._completed_at is not None:
            return False
        ref = reference_date if reference_date is not None else date.today()
        if self.due_date is None:
            return False
        # Compare dates; ensure both are date objects
        due = self.due_date
        if isinstance(ref, datetime):
            ref = ref.date()
        return due < ref

    # ------------------------------------------------------------------
    # Status transition logic
    # ------------------------------------------------------------------
    def _transition(self, from_status: Status, to_status: Status) -> None:
        """Validate and perform a status change.

        Parameters
        ----------
        from_status : Status
            The current status before the change.
        to_status : Status
            The desired new status.
        """
        allowed = _TRANSITIONS.get(from_status, set())
        if to_status not in allowed:
            raise ValidationError(
                f"Invalid transition from {from_status} to {to_status}. "
                f"Allowed from {from_status}: {[s.name for s in allowed]}"
            )
        self.status = to_status

    def _transition_any_to(self, to_status: Status) -> None:
        """Transition to *to_status* from the current status with loose rules.

        - From ``todo``: allowed to ``in_progress``, ``blocked``, ``done``.
        - From ``in_progress``: allowed to ``todo``, ``blocked``, ``done``.
        - From ``blocked``: allowed to ``todo``, ``in_progress``, ``done``.
        - From ``done``: allowed to ``in_progress`` (reopen) or ``todo``.

        This method is used by ``block()``, ``mark_complete()``, and ``reopen()``
        so that the exact from-status is less critical, but still validates
        that the target is a valid Status value.
        """
        if not isinstance(to_status, Status):
            raise ValidationError(f"to_status must be a Status enum, got {type(to_status).__name__}")

        # Allow reasonable cross-status moves
        current = self.status
        # Simple: allow if 'to' is a valid target from 'current' via known map,
        # or if 'to' is not the same as current and makes semantic sense.
        allowed_from_current = _TRANSITIONS.get(current, set())
        if to_status in allowed_from_current:
            self.status = to_status
            return

        # Extra leniency: from DONE we allow TODO or IN_PROGRESS
        if current == Status.DONE and to_status in (Status.TODO, Status.IN_PROGRESS):
            self.status = to_status
            return

        # Fallback: allow any change that isn't a no-op
        if to_status != current:
            self.status = to_status
            return

        raise ValidationError(f"Cannot transition from {current} to {to_status}")

    def _log_update(self, field: str) -> None:
        """Hook for subclasses or middleware to react to attribute changes.

        By default a no-op. Override or connect to signals as needed.
        """
        pass

    def __repr__(self) -> str:
        return (
            f"Task(id={self.id}, title={self.title!r}, "
            f"status={self.status}, priority={self.priority})"
        )

    def __str__(self) -> str:
        return self.title