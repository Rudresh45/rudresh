"""Unit tests for the Task domain model."""

from datetime import date, datetime, timezone

import pytest

from domains.task import Priority, Status, Task


# ── fixtures ──────────────────────────────────────────────────────────────

@pytest.fixture
def sample_task() -> Task:
    """A fresh task in the default state."""
    return Task(id=1, title="Test task", description="A test", priority=Priority.MEDIUM)


@pytest.fixture
def due_task() -> Task:
    """A task with a past due date."""
    return Task(id=2, title="Overdue task", due_date=date(2023, 1, 1))


@pytest.fixture
def future_due_task() -> Task:
    """A task with a future due date."""
    return Task(id=3, title="Future task", due_date=date(2030, 12, 31))


# ── valid operations ─────────────────────────────────────────────────────


def test_task_creation_defaults() -> None:
    """A new task starts todo with medium priority."""
    t = Task(id=1, title="Buy milk")
    assert t.title == "Buy milk"
    assert t.status == Status.TODO
    assert t.priority == Priority.MEDIUM
    assert t.description is None
    assert t.due_date is None
    assert t.completed_at is None
    assert t.id == 1


def test_task_creation_with_all_fields() -> None:
    """Task can be created with all attributes."""
    t = Task(
        id=42,
        title="Write docs",
        description="API documentation",
        status=Status.IN_PROGRESS,
        priority=Priority.HIGH,
        due_date=date(2025, 6, 15),
    )
    assert t.id == 42
    assert t.title == "Write docs"
    assert t.description == "API documentation"
    assert t.status == Status.IN_PROGRESS
    assert t.priority == Priority.HIGH
    assert t.due_date == date(2025, 6, 15)


def test_update_title() -> None:
    """update_title changes title and refreshes updated_at."""
    t = Task(id=1, title="Old title")
    t.update_title("New title")
    assert t.title == "New title"
    assert t.status == Status.TODO  # unchanged


def test_update_title_invalid() -> None:
    """update_title rejects empty/whitespace-only strings."""
    t = Task(id=1, title="Old")
    with pytest.raises(ValueError):  # ValidationError is a ValueError
        t.update_title("   ")
    with pytest.raises(ValueError):
        t.update_title("")


def test_update_description() -> None:
    """update_description sets/clears the description."""
    t = Task(id=1, title="Task", description="Old desc")
    t.update_description("New desc")
    assert t.description == "New desc"

    t.update_description(None)
    assert t.description is None


def test_update_priority() -> None:
    """update_priority changes priority."""
    t = Task(id=1, title="Task")
    t.update_priority(Priority.URGENT)
    assert t.priority == Priority.URGENT


def test_update_priority_invalid() -> None:
    """update_priority rejects non-enum."""
    t = Task(id=1, title="Task")
    with pytest.raises(ValueError):
        t.update_priority("high")  # type: ignore[arg-type]


# ── status transitions ──────────────────────────────────────────────────


def test_start_from_todo() -> None:
    """start() moves task from todo to in_progress."""
    t = Task(id=1, title="Task")
    t.start()
    assert t.status == Status.IN_PROGRESS


def test_start_from_in_progress_raises() -> None:
    """start() raises when already in_progress (transition not allowed)."""
    t = Task(id=1, title="Task")
    t.start()
    with pytest.raises(ValueError):  # ValidationError
        t.start()


def test_block_any_from() -> None:
    """block() can be called from any status."""
    t = Task(id=1, title="Task")
    t.block()
    assert t.status == Status.BLOCKED

    t2 = Task(id=2, title="Task", status=Status.IN_PROGRESS)
    t2.block()
    assert t2.status == Status.BLOCKED


def test_mark_complete_from_in_progress() -> None:
    """mark_complete() from in_progress sets done and completed_at."""
    t = Task(id=1, title="Task")
    t.start()
    t.mark_complete()
    assert t.status == Status.DONE
    assert t.completed_at is not None
    assert isinstance(t.completed_at, datetime)


def test_mark_complete_from_blocked() -> None:
    """mark_complete() from blocked sets done and clears completed_at logic."""
    t = Task(id=1, title="Task", status=Status.BLOCKED)
    t.mark_complete()
    assert t.status == Status.DONE
    assert t.completed_at is not None


def test_reopen_clears_completed_at() -> None:
    """reopen() clears completed_at and moves to todo."""
    t = Task(id=1, title="Task")
    t.start()
    t.mark_complete()
    assert t.completed_at is not None

    t.reopen()
    assert t.completed_at is None
    assert t.status == Status.TODO


def test_is_overdue_pending() -> None:
    """is_overdue() returns False for a pending task with no due_date."""
    t = Task(id=1, title="Task")
    assert t.is_overdue() is False


def test_is_overdue_with_due_past() -> None:
    """is_overdue() returns True when due_date is in the past and not completed."""
    t = Task(id=1, title="Task", due_date=date(2020, 1, 1))
    assert t.is_overdue() is True


def test_is_overdue_already_done() -> None:
    """is_overdue() returns False when task is already done."""
    t = Task(id=1, title="Task", due_date=date(2020, 1, 1))
    t.mark_complete()
    assert t.is_overdue() is False


def test_is_overdue_future_due() -> None:
    """is_overdue() returns False when due_date is in the future."""
    t = Task(id=1, title="Task", due_date=date(2030, 1, 1))
    assert t.is_overdue() is False


# ── invalid inputs ──────────────────────────────────────────────────────


def test_empty_title_raises() -> None:
    """Task with empty title raises ValidationError."""
    with pytest.raises(ValueError):
        Task(id=1, title="")


def test_whitespace_only_title_raises() -> None:
    """Task with whitespace-only title raises ValidationError."""
    with pytest.raises(ValueError):
        Task(id=1, title="   ")


def test_non_enum_priority_raises() -> None:
    """Non-Priority enum for priority raises ValidationError."""
    with pytest.raises(ValueError):
        Task(id=1, title="Task", priority="high")  # type: ignore[arg-type]


# ── timezone-aware timestamps ───────────────────────────────────────────


def test_timestamps_are_utc() -> None:
    """created_at and updated_at are timezone-aware (UTC)."""
    t = Task(id=1, title="Task")
    assert t.created_at.tzinfo is not None
    assert t.updated_at.tzinfo is not None
    # Both should be UTC
    assert t.created_at.tzinfo == timezone.utc
    assert t.updated_at.tzinfo == timezone.utc


def test_completed_at_is_utc_when_set() -> None:
    """completed_at is a UTC datetime when the task is marked done."""
    t = Task(id=1, title="Task")
    t.mark_complete()
    assert t.completed_at is not None
    assert t.completed_at.tzinfo == timezone.utc


# ── __repr__ and __str__ ────────────────────────────────────────────────


def test_repr() -> None:
    """__repr__ shows key attributes."""
    t = Task(id=7, title="Task")
    repr_str = repr(t)
    assert "id=7" in repr_str
    assert "title='Task'" in repr_str


def test_str() -> None:
    """__str__ returns the title."""
    t = Task(id=1, title="My Task")
    assert str(t) == "My Task"