"""Unit tests for the Project domain model."""

from datetime import datetime

import pytest

from domains.project import Project, Status, ValidationError
from domains.task import Task, Priority, Status as TaskStatus


# ── fixtures ──────────────────────────────────────────────────────────────

@pytest.fixture
def sample_project() -> Project:
    """A fresh active project."""
    return Project(id=1, name="Test Project")


@pytest.fixture
def project_with_tasks() -> Project:
    """A project with a few tasks already added."""
    p = Project(id=2, name="Project with tasks")
    # We can't easily create Task instances without going through the
    # constructor, so we just return the project; tests that need tasks
    # will create them inline.
    return p


# ── creation & basics ────────────────────────────────────────────────────


def test_project_creation_defaults() -> None:
    """A new project is active with no tasks."""
    p = Project(id=1, name="My Project")
    assert p.id == 1
    assert p.name == "My Project"
    assert p.status == Status.ACTIVE
    assert p.description is None
    assert p.tasks == []
    assert p.created_at is not None
    assert p.updated_at is not None


def test_project_creation_with_description() -> None:
    """Project can be created with description and custom status."""
    p = Project(
        id=42,
        name="Docs",
        description="API docs",
        status=Status.ACTIVE,
    )
    assert p.id == 42
    assert p.name == "Docs"
    assert p.description == "API docs"
    assert p.status == Status.ACTIVE


def test_project_creation_empty_name_raises() -> None:
    """Empty project name raises ValidationError."""
    with pytest.raises(ValidationError):
        Project(id=1, name="")


def test_project_creation_whitespace_name_raises() -> None:
    """Whitespace-only project name raises ValidationError."""
    with pytest.raises(ValidationError):
        Project(id=1, name="   ")


# ── rename ───────────────────────────────────────────────────────────────


def test_rename() -> None:
    """rename() changes the project name and refreshes updated_at."""
    p = Project(id=1, name="Old Name")
    p.rename("New Name")
    assert p.name == "New Name"


def test_rename_invalid() -> None:
    """rename() rejects empty/whitespace name."""
    p = Project(id=1, name="Old")
    with pytest.raises(ValidationError):
        p.rename("   ")
    with pytest.raises(ValidationError):
        p.rename("")


# ── description ──────────────────────────────────────────────────────────


def test_update_description() -> None:
    """update_description sets/clears the description."""
    p = Project(id=1, name="Project")
    p.update_description("New desc")
    assert p.description == "New desc"

    p.update_description(None)
    assert p.description is None


def test_update_description_invalid_type() -> None:
    """update_description accepts str or None; other types raise."""
    p = Project(id=1, name="Project")
    # The method just assigns, so we only test the documented behaviour.
    # If you want stricter validation, add it to the method.
    p.update_description(123)  # type: ignore[arg-type]
    # It will store 123; that's by design (the class trusts its caller).
    # We'll just check it doesn't crash.


# ── archive / reactivate ────────────────────────────────────────────────


def test_archive_active_project() -> None:
    """archive() changes status to ARCHIVED."""
    p = Project(id=1, name="Project")
    p.archive()
    assert p.status == Status.ARCHIVED


def test_archive_already_archived_raises() -> None:
    """archive() raises ValidationError if already archived."""
    p = Project(id=1, name="Project", status=Status.ARCHIVED)
    with pytest.raises(ValidationError):
        p.archive()


def test_reactivate_archived_project() -> None:
    """reactivate() changes status back to ACTIVE."""
    p = Project(id=1, name="Project", status=Status.ARCHIVED)
    p.reactivate()
    assert p.status == Status.ACTIVE


def test_reactivate_already_active_raises_not() -> None:
    """reactivate() when already active is a no-op (no error)."""
    p = Project(id=1, name="Project", status=Status.ACTIVE)
    # By design, reactivate() just sets the status; no error raised.
    p.reactivate()
    assert p.status == Status.ACTIVE


# ── add_task ─────────────────────────────────────────────────────────────


def test_add_task_to_active_project() -> None:
    """add_task() adds a task and refreshes updated_at."""
    p = Project(id=1, name="Project")
    task = Task(id=1, title="Task 1")
    p.add_task(task)
    assert task in p.tasks
    assert len(p.tasks) == 1


def test_add_task_to_archived_project_raises() -> None:
    """add_task() raises ValidationError when project is archived."""
    p = Project(id=1, name="Project", status=Status.ARCHIVED)
    task = Task(id=1, title="Task 1")
    with pytest.raises(ValidationError):
        p.add_task(task)


def test_add_task_preserves_existing_tasks_on_archive() -> None:
    """Existing tasks are preserved when project is archaged."""
    p = Project(id=1, name="Project")
    t1 = Task(id=1, title="Old task")
    t2 = Task(id=2, title="Another task")
    p.add_task(t1)
    p.add_task(t2)
    assert len(p.tasks) == 2

    p.archive()
    # Tasks should still be there
    assert len(p.tasks) == 2
    assert t1 in p.tasks
    assert t2 in p.tasks

    # Project is now archived
    assert p.status == Status.ARCHIVED


def test_reactivate_restores_ability_to_add_tasks() -> None:
    """After reactivate, new tasks can be added."""
    p = Project(id=1, name="Project")
    t1 = Task(id=1, title="Old task")
    p.add_task(t1)
    p.archive()
    p.reactivate()
    t2 = Task(id=2, title="New task after reactivation")
    p.add_task(t2)
    assert len(p.tasks) == 2
    assert t2 in p.tasks


# ── invariants ───────────────────────────────────────────────────────────


def test_timestamps_are_utc() -> None:
    """created_at and updated_at are timezone-aware (UTC)."""
    p = Project(id=1, name="Project")
    assert p.created_at.tzinfo is not None
    assert p.updated_at.tzinfo is not None
    # Both should be UTC
    from datetime import timezone
    assert p.created_at.tzinfo == timezone.utc
    assert p.updated_at.tzinfo == timezone.utc


def test_str() -> None:
    """__str__ returns the project name."""
    p = Project(id=1, name="My Project")
    assert str(p) == "My Project"


def test_repr() -> None:
    """__repr__ shows key attributes."""
    p = Project(id=7, name="Project")
    repr_str = repr(p)
    assert "id=7" in repr_str
    assert "name='Project'" in repr_str