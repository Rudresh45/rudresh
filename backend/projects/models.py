"""Django ORM model for a Project.

Mirrors the domain model ``domains.project.Project`` and persists to the
SQLite database via Django's ORM.  Tasks are linked via a foreign key; the
project has an explicit ``status`` field (ACTIVE / ARCHIVED) and timestamps.

``Project`` owns its tasks — when a project is deleted its tasks are cascade‑
deleted as well.
"""

from django.db import models


class ProjectStatus(models.IntegerChoices):
    ACTIVE = 1
    ARCHIVED = 2

    def to_domain(self) -> 'domains.project.Status':
        return {
            ProjectStatus.ACTIVE: 1,
            ProjectStatus.ARCHIVED: 2,
        }[self.value]


class Project(models.Model):
    """Persistent project container with active / archived lifecycle."""

    # ── fields ─────────────────────────────────────────────────────────
    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True, null=True)
    status = models.SmallIntegerField(choices=ProjectStatus.choices, default=ProjectStatus.ACTIVE)
    # timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ── many-to-many to tasks (implicit through table) ───────────────────
    # Django automatically creates a reverse relation ``project.tasks`` and a
    # through table when we add a ForeignKey from Task.project with
    # related_name="projects".  No explicit field is needed here.
    # We just declare the reverse name so the ORM knows how to wire things.

    # ── meta ───────────────────────────────────────────────────────────
    class Meta:
        ordering = ["-created_at"]
        verbose_name = "project"
        verbose_name_plural = "projects"

    # ── domain ↓↑ conversion ──────────────────────────────────────────
    def to_domain(self) -> 'domains.project.Project':
        from domains.project import Status as ProStatus, Project as Proj

        return Proj(
            id=self.pk,
            name=self.name,
            description=self.description,
            status=ProStatus(self.status).name.lower(),  # type: ignore[attr-defined]
            created_at=self.created_at,
            updated_at=self.updated_at,
        )

    def from_domain(proj: 'domains.project.Project') -> 'Project':
        """Class method to create a Django model instance from a domain object."""
        s = ProjectStatus[proj.status.upper()]  # type: ignore[attr-defined]
        return Project(
            name=proj.name,
            description=proj.description,
            status=s.value,
        )

    # ── string repr ────────────────────────────────────────────────────
    def __str__(self) -> str:
        return self.name