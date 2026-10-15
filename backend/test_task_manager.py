"""Unit tests for the TaskManager service."""

from datetime import date, datetime

import pytest

from domains.task_manager import TaskManager
from domains.task import Priority, Status as TaskStatus
from domains.project import Project, Status as ProjectStatus, ValidationError as ProjectValidationError


# ── fixture ───────────────────────────────────────────────────────────────

@pytest.fixture
def manager() -> TaskManager:
    """Fresh TaskManager for each test."""
    return TaskManager()


# ── Task CRUD ─────────────────────────────────────────────────────────────


def test_create_task_basic() -> None:
    """create_task returns a Task with all fields."""
    m = TaskManager()
    t = m.create_task(title="Buy milk", description="Full fat", priority=Priority.HIGH, due_date=date(2025, 6, 1))
    assert t.title == "Buy milk"
    assert t.description == "Full fat"
    assert t.priority == Priority.HIGH
    assert t.due_date == date(2025, 6, 1)
    assert t.id is not None
    assert t.id > 0


def test_create_task_defaults() -> None:
    """create_task uses defaults for priority and due_date."""
    m = TaskManager()
    t = m.create_task(title="Clean room")
    assert t.title == "Clean room"
    assert t.priority == Priority.MEDIUM
    assert t.due_date is None


def test_get_task() -> None:
    """get_task returns the stored task."""
    m = TaskManager()
    t = m.create_task(title="Task A")
    got = m.get_task(t.id)
    assert got is t


def test_get_task_missing_raises() -> None:
    """get_task raises TaskValidationError for missing id."""
    m = TaskManager()
    try:
        m.get_task(999)
        assert False, "Should have raised"
    except Exception as e:  # TaskValidationError is a ValueError
        assert "not found" in str(e)


def test_update_task() -> None:
    """update_task changes only the supplied fields."""
    m = TaskManager()
    t = m.create_task(title="Old", description="old desc", priority=Priority.MEDIUM)
    m.update_task(t.id, title="New", priority=Priority.URGENT)
    got = m.get_task(t.id)
    assert got.title == "New"
    assert got.priority == Priority.URGENT
    assert got.description == "old desc"  # unchanged


def test_delete_task() -> None:
    """delete_task removes the task and detaches it from any project."""
    m = TaskManager()
    t = m.create_task(title="To delete")
    # Add it to a project first
    p = m.create_project(name="Proj")
    m.assign_task_to_project(t.id, p.id)
    assert len(p.tasks) == 1

    m.delete_task(t.id)
    # After deletion, the task should no longer be in the manager's storage.
    try:
        m.get_task(t.id)
        assert False, "Should have raised TaskValidationError"
    except Exception as e:  # TaskValidationError is a ValueError
        assert "not found" in str(e)
    # Actually delete raises, so we just check it's gone from project and manager
    # Let's rethink: delete_task should remove from storage; we'll verify below.


def test_delete_task_removes_from_project() -> None:
    """delete_task removes task from its project's task list."""
    m = TaskManager()
    t = m.create_task(title="Detached")
    p = m.create_project(name="Proj")
    m.assign_task_to_project(t.id, p.id)
    assert len(p.tasks) == 1

    m.delete_task(t.id)
    # After deletion, the project should have no tasks
    assert len(p.tasks) == 0


# ── Task lifecycle ──────────────────────────────────────────────────────


def test_complete_task() -> None:
    """complete_task marks a task done via the Task domain model."""
    m = TaskManager()
    t = m.create_task(title="Study")
    m.complete_task(t.id)
    got = m.get_task(t.id)
    assert got.status == TaskStatus.DONE
    assert got.completed_at is not None


def test_reopen_task() -> None:
    """reopen_task clears completed_at and moves back to todo."""
    m = TaskManager()
    t = m.create_task(title="Study")
    m.complete_task(t.id)
    m.reopen_task(t.id)
    got = m.get_task(t.id)
    assert got.status == TaskStatus.TODO
    assert got.completed_at is None


# ── Query operations ────────────────────────────────────────────────────


def test_list_tasks() -> None:
    """list_tasks returns all stored tasks."""
    m = TaskManager()
    m.create_task(title="A")
    m.create_task(title="B")
    tasks = m.list_tasks()
    assert len(tasks) == 2


def test_filter_by_status() -> None:
    """filter_by_status returns tasks with matching status."""
    m = TaskManager()
    m.create_task(title="A")  # default TODO
    t2 = m.create_task(title="B")
    m.complete_task(t2.id)  # now DONE
    todo = m.filter_by_status(TaskStatus.TODO)
    done = m.filter_by_status(TaskStatus.DONE)
    assert len(todo) == 1
    assert len(done) == 1
    assert todo[0].title == "A"
    assert done[0].title == "B"


def test_filter_by_priority() -> None:
    """filter_by_priority returns tasks with matching priority."""
    m = TaskManager()
    m.create_task(title="Low", priority=Priority.LOW)
    m.create_task(title="High", priority=Priority.HIGH)
    m.create_task(title="Med", priority=Priority.MEDIUM)
    low = m.filter_by_priority(Priority.LOW)
    high = m.filter_by_priority(Priority.HIGH)
    med = m.filter_by_priority(Priority.MEDIUM)
    assert len(low) == 1 and low[0].title == "Low"
    assert len(high) == 1 and high[0].title == "High"
    assert len(med) == 1 and med[0].title == "Med"


def test_list_overdue_tasks() -> None:
    """list_overdue_tasks returns tasks past their due date."""
    m = TaskManager()
    t1 = m.create_task(title="Past", due_date=date(2020, 1, 1))
    t2 = m.create_task(title="Future", due_date=date(2030, 1, 1))
    t3 = m.create_task(title="No due")
    overdue = m.list_overdue_tasks()
    assert any(t.title == "Past" for t in overdue)
    assert not any(t.title == "Future" for t in overdue)
    assert not any(t.title == "No due" for t in overdue)


def test_list_overdue_with_reference_date() -> None:
    """list_overdue_tasks accepts a reference_date."""
    m = TaskManager()
    t = m.create_task(title="Overdue", due_date=date(2023, 6, 15))
    # Reference a date before the due date → not overdue
    overdue_before = m.list_overdue_tasks(reference_date=date(2023, 6, 14))
    assert len(overdue_before) == 0
    # Reference a date after the due date → overdue
    overdue_after = m.list_overdue_tasks(reference_date=date(2023, 6, 16))
    assert len(overdue_after) == 1


# ── Project CRUD ────────────────────────────────────────────────────────


def test_create_project_basic() -> None:
    """create_project returns a Project with name and optional description."""
    m = TaskManager()
    p = m.create_project(name="My Project", description="A test project")
    assert p.name == "My Project"
    assert p.description == "A test project"
    assert p.id is not None and p.id > 0


def test_create_project_defaults() -> None:
    """create_project with only name."""
    m = TaskManager()
    p = m.create_project(name="Solo")
    assert p.name == "Solo"
    assert p.description is None


def test_get_project() -> None:
    """get_project returns the stored project."""
    m = TaskManager()
    p = m.create_project(name="Prod")
    got = m.get_project(p.id)
    assert got is p


def test_get_project_missing_raises() -> None:
    """get_project raises ProjectValidationError for missing id."""
    m = TaskManager()
    try:
        m.get_project(888)
        assert False, "Should have raised"
    except ProjectValidationError:
        pass


def test_list_project_tasks() -> None:
    """list_project_tasks returns tasks belonging to a project."""
    m = TaskManager()
    p = m.create_project(name="Proj")
    t1 = m.create_task(title="Task 1")
    t2 = m.create_task(title="Task 2")
    m.assign_task_to_project(t1.id, p.id)
    m.assign_task_to_project(t2.id, p.id)
    tasks = m.list_project_tasks(p.id)
    assert len(tasks) == 2
    assert t1 in tasks and t2 in tasks


# ── assign_task_to_project ──────────────────────────────────────────────


def test_assign_task_to_project_basic() -> None:
    """assign_task_to_project attaches a task to a project."""
    m = TaskManager()
    t = m.create_task(title="My Task")
    p = m.create_project(name="My Project")
    m.assign_task_to_project(t.id, p.id)
    assert t in p.tasks
    assert len(p.tasks) == 1


def test_assign_task_to_project_duplicate_detaches_first() -> None:
    """assign_task_to_project removes task from previous project."""
    m = TaskManager()
    t = m.create_task(title="Shared")
    p1 = m.create_project(name="Proj 1")
    p2 = m.create_project(name="Proj 2")
    m.assign_task_to_project(t.id, p1.id)
    assert t in p1.tasks
    assert len(p1.tasks) == 1
    assert len(p2.tasks) == 0

    m.assign_task_to_project(t.id, p2.id)
    assert t in p2.tasks
    assert len(p2.tasks) == 1
    assert len(p1.tasks) == 0  # removed from first


def test_assign_task_to_project_archived_raises() -> None:
    """assign_task_to_project raises when target project is archived."""
    m = TaskManager()
    t = m.create_task(title="Orphan")
    p = m.create_project(name="Archived Proj", status=ProjectStatus.ARCHIVED)
    try:
        m.assign_task_to_project(t.id, p.id)
        assert False, "Should have raised ProjectValidationError"
    except ProjectValidationError:
        pass


# ── cross‑coordination ───────────────────────────────────────────────────


def test_lifecycle_project_task() -> None:
    """Full lifecycle: create project, create task, assign, complete, reopen, delete."""
    m = TaskManager()
    # Create project
    p = m.create_project(name="Work")
    # Create task
    t = m.create_task(title="Write proposal", description="Q2 plan", priority=Priority.HIGH)
    # Assign task to project
    m.assign_task_to_project(t.id, p.id)
    assert t in p.tasks
    # Complete the task
    m.complete_task(t.id)
    got = m.get_task(t.id)
    assert got.status == TaskStatus.DONE
    # Reopen
    m.reopen_task(t.id)
    got2 = m.get_task(t.id)
    assert got2.status == TaskStatus.TODO
    assert got2.completed_at is None
    # List projects tasks
    tasks = m.list_project_tasks(p.id)
    assert len(tasks) == 1
    # List overdue (no due date → not overdue)
    overdue = m.list_overdue_tasks()
    assert len(overdue) == 0


def test_orphan_task_no_project() -> None:
    """A task with no project is handled gracefully."""
    m = TaskManager()
    t = m.create_task(title="Solo")
    # get_task, filter, overdue all work
    got = m.get_task(t.id)
    assert got.title == "Solo"
    todo = m.filter_by_status(TaskStatus.TODO)
    assert got in todo
    overdue = m.list_overdue_tasks()
    assert len(overdue) == 0  # no due_date


def test_delete_task_from_project_then_assign_again() -> None:
    """After deleting a task from a project, can assign a different task."""
    m = TaskManager()
    p = m.create_project(name="Proj")
    t1 = m.create_task(title="First")
    t2 = m.create_task(title="Second")
    m.assign_task_to_project(t1.id, p.id)
    assert len(p.tasks) == 1
    m.delete_task(t1.id)
    assert len(p.tasks) == 0
    m.assign_task_to_project(t2.id, p.id)
    assert len(p.tasks) == 1
    assert p.tasks[0].title == "Second"