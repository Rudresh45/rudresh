"""Django ORM model for a Task.

Synchronises with the domain model ``domains.task.Task`` but persists to the
database via Django's ORM.  Fields and constraints mirror the domain class
so that conversion between the two is straightforward.

``Task`` is optionaly associated to a ``Project`` via a foreign key.
"""

from django.db import models


class Priority(models.IntegerChoices):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    URGENT = 4

    def to_domain(self) -> 'domains.task.Priority':
        return {
            Priority.LOW: 1,
            Priority.MEDIUM: 2,
            Priority.HIGH: 3,
            Priority.URGENT: 4,
        }[self.value]


class Status(models.IntegerChoices):
    TODO = 1
    IN_PROGRESS = 2
    BLOCKED = 3
    DONE = 4

    def to_domain(self) -> 'domains.task.Status':
        return {
            Status.TODO: 1,
            Status.IN_PROGRESS: 2,
            Status.BLOCKED: 3,
            Status.DONE: 4,
        }[self.value]


class Task(models.Model):
    """Persistent task with lifecycle state, priority, due date and project link."""

    # ── fields ─────────────────────────────────────────────────────────
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    priority = models.SmallIntegerField(choices=Priority.choices, default=Priority.MEDIUM)
    status = models.SmallIntegerField(choices=Status.choices, default=Status.TODO)
    due_date = models.DateField(blank=True, null=True)
    # optional link to a Project; cascade delete so tasks disappear when the
    # project is removed (the manager / service layer can re‑assign before delete
    # if a softer behaviour is desired).
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="tasks",
    )
    # timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    # ── lifecycle methods ──────────────────────────────────────────────
    def start(self):
        """Transition task to in_progress."""
        if self.status != Status.DONE:
            self.status = Status.IN_PROGRESS
            self.save(update_fields=['status', 'updated_at'])

    def block(self):
        """Transition task to blocked."""
        self.status = Status.BLOCKED
        self.save(update_fields=['status', 'updated_at'])

    def mark_complete(self):
        """Mark task as done."""
        from django.utils import timezone
        self.status = Status.DONE
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'completed_at', 'updated_at'])

    def reopen(self):
        """Reopen a completed task to todo."""
        self.status = Status.TODO
        self.completed_at = None
        self.save(update_fields=['status', 'completed_at', 'updated_at'])

    # ── meta ───────────────────────────────────────────────────────────
    class Meta:
        ordering = ["-created_at"]
        verbose_name = "task"
        verbose_name_plural = "tasks"

    # ── domain ↓↑ conversion ──────────────────────────────────────────
    def to_domain(self) -> 'domains.task.Task':
        from domains.task import Priority as DomPriority, Status as DomStatus, Task as DomTask

        return DomTask(
            id=self.pk,
            title=self.title,
            description=self.description,
            status=DomStatus(self.status).name.lower(),  # type: ignore[attr-defined]
            priority=DomPriority(self.priority).name.lower(),  # type: ignore[attr-defined]
            due_date=self.due_date,
            created_at=self.created_at,
            updated_at=self.updated_at,
            completed_at=self.completed_at,
        )

    def from_domain(task: 'domains.task.Task') -> 'Task':
        """Class method to create a Django model instance from a domain object."""
        p = Priority[task.priority.upper()]  # type: ignore[attr-defined]
        s = Status[task.status.upper()]  # type: ignore[attr-defined]
        return Task(
            title=task.title,
            description=task.description,
            priority=p.value,
            status=s.value,
            due_date=task.due_date,
        )

    # ── string repr ────────────────────────────────────────────────────
    def __str__(self) -> str:
        return self.title