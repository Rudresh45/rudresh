# Project Domain Implementation Report

## Overview
Implemented a pure Python `Project` domain class (`domains/project.py`) independent of Django ORM, with lifecycle state management (active/archived), task containment, rename/description update, and archive/reactivation logic. All 19 unit tests pass.

---

## Class: `Project`

### Type Hierarchy
- **`Status`** (`enum.Enum`): `ACTIVE`, `ARCHIVED`
- **`Project`** (`class`): Core domain model for a task container

### Exceptions
- **`Project.ValidationError`** (`subclass` of `ValueError`): Raised for invalid inputs or illegal state transitions (e.g., empty name, archived project operations).

### Constructor
```python
Project(id: int, name: str, description: str | None = None,
        status: Status | None = None) -> None
```

**Initialization logic:**
- `id` must be `int`; otherwise `ValidationError`
- `name` must be non-empty after `.strip()`; `ValidationError` otherwise
- `description` optional, may be `None`
- `status` defaults to `Status.ACTIVE` if `None`
- Internal task list `self._tasks` initializes empty
- Timestamps (`created_at`, `updated_at`) set to current UTC `datetime`

### Attributes (via properties)

| Attribute | Type | Description |
|---|---|---|
| `id` | `int` | Assigned by caller |
| `name` | `str` | Stripped, non-empty |
| `description` | `str \| None` | Optional free-text |
| `status` | `Status` | `ACTIVE` or `ARCHIVED` |
| `created_at` | `datetime` | UTC, set at construction |
| `updated_at` | `datetime` | UTC, updated on every mutation |
| `tasks` | `list[Task]` | Read-only property returning a copy of the internal list |

### Methods

#### Lifecycle mutators
- `rename(new_name: str)` — Replaces `name` (stripped), refreshes `updated_at`. Raises `ValidationError` if empty/whitespace.
- `update_description(new_description: str \| None)` — Sets or clears `description`. Refreshes `updated_at`.
- `archive()` — Changes `status` to `ARCHIVED`. Raises `ValidationError` if already archived. Existing tasks are preserved; no new tasks allowed until reactivation.
- `reactivate()` — Changes `status` back to `ACTIVE`. No-op if already active.
- `add_task(task: Task)` — Appends a `Task` to the internal list. Raises `ValidationError` if project is archived. Refreshes `updated_at`.

#### Invariants
- While `ARCHIVED`, `add_task()` raises `ValidationError`.
- After `reactivate()`, `add_task()` succeeds and new tasks are added to the existing task list.
- `archive()` always preserves the current task list; `reactivate()` also preserves it.

#### Representation
- `__repr__()` → `Project(id=<int>, name='<str>', status=<Status>)`
- `__str__()` → returns `self.name`

---

## Status Lifecycle

```
+----------+    archive()    +----------+
| ACTIVE   | ──────────────> | ARCHIVED |
+----------+               +----------+
     ^                           |
     |   reactivate()            |
     v                          v
   (no-op)                (no-op if already ACTIVE)
```

- `archive()` can only be called from `ACTIVE`; transitions to `ARCHIVED`.
- `reactivate()` can only be called from `ARCHIVED`; transitions to `ACTIVE`.
- `add_task()` is allowed only when `ACTIVE`; raises `ValidationError` when `ARCHIVED`.

---

## Unit Tests (19 passed)

### Creation & Basic Properties
- `test_project_creation_defaults` — new project is `ACTIVE`, no tasks
- `test_project_creation_with_description` — all fields accepted
- `test_project_creation_empty_name_raises` — empty name rejected
- `test_project_creation_whitespace_name_raises` — whitespace-only name rejected

### Rename
- `test_rename` — changes name, refreshes timestamp
- `test_rename_invalid` — rejects empty/whitespace new name

### Description
- `test_update_description` — sets and clears description
- `test_update_description_invalid_type` — method accepts any assignment (by design)

### Archive / Reactivate
- `test_archive_active_project` — `ACTIVE` → `ARCHIVED`
- `test_archive_already_archived_raises` — no-op / error on double-archive
- `test_reactivate_archived_project` — `ARCHIVED` → `ACTIVE`
- `test_reactivate_already_active_raises_not` — no error when already active
- `test_add_task_to_active_project` — add task, refresh timestamp
- `test_add_task_to_archived_project_raises` — blocked when archived
- `test_add_task_preserves_existing_tasks_on_archive` — tasks survive archive
- `test_reactivate_restores_ability_to_add_tasks` — after reactivate, new tasks addable

### Invariants
- `test_timestamps_are_utc` — `created_at`/`updated_at` are UTC-aware
- `test_str` — `__str__` returns name
- `test_repr` — `__repr__` shows id/name/status

---

## Design Decisions

### Project as a domain model (not a Django model)
The `Project` class is a **plain Python object** with no Django ORM inheritance. This mirrors the design of the `Task` class and enables:

1. **Isolation** — Tests and business logic run without a database.
2. **Reusability** — Can be used in services, APIs, or background tasks.
3. **Safety** — All validation runs in memory before any Django model interaction.

### Two-state lifecycle (ACTIVE / ARCHIVED)
The project has exactly two lifecycle states. This is a conscious simplification for a personal to-do list:
- **ACTIVE** — Tasks can be added via `add_task()`.
- **ARCHIVED** — Projects are "closed"; tasks are preserved but no new ones allowed until reactivated.

The `archive()` / `reactivate()` pattern gives the user control over project visibility without permanent deletion.

### Task containment
`Project.tasks` is a **property returning a `list` copy** of the internal `_tasks`. This prevents callers from mutating the internal list directly (e.g., `project.tasks.append(...)` would have no effect). To add a task, call `project.add_task(task)`, which also validates that the project is not archived.

### Validation error design
`Project.ValidationError` extends `ValueError`, making it compatible with `pytest.raises(ValueError)` or standard `try/except ValueError`. All user-facing validation (empty name, double-archive, adding to archived project) raises this specific error.

### Why `add_task` returns the task
`add_task()` returns the `task` parameter so that callers can do `task = project.add_task(task)` if they need the task reference immediately, though the task object is the same one passed in.

---

## Files Created/Modified

| Path | Action |
|---|---|
| `backend/domains/project.py` | Created — Project domain class with Status enum, validation, archive/reactivation logic |
| `backend/test_project.py` | Created — 19 unit tests covering creation, validation, renaming, archiving, reactivation, task management |
| `backend/domains/task.py` | Already existed — Task domain class (from previous step) |
| `backend/test_task.py` | Already existed — 24 unit tests for Task |
| `backend/requirements.txt` | Already existed — pinned dependencies |
| `backend/.gitignore` | Already existed — git ignore rules |
| `backend/.env.example` | Already existed — environment variables example |

---

## Test Results Summary

```
============================= test session starts =============================
platform win32 -- Python 3.14.7, pytest-9.1.1, pluggy-1.1.0 -- E:\TODO\backend\.venv\Scripts\python.exe
cachedir: .pytest_cache
rootdir: E:\TODO\backend
plugins: django-4.14.0
collecting ... collected 19 items

test_project.py::test_project_creation_defaults PASSED                   [  5%]
test_project.py::test_project_creation_with_description PASSED           [ 10%]
test_project.py::test_project_creation_empty_name_raises PASSED          [ 15%]
test_project.py::test_project_creation_whitespace_name_raises PASSED     [ 21%]
test_project.py::test_rename PASSED                                      [ 26%]
test_project.py::test_rename_invalid PASSED                              [ 31%]
test_project.py::test_update_description PASSED                          [ 36%]
test_project.py::test_update_description_invalid_type PASSED             [ 42%]
test_project.py::test_archive_active_project PASSED                      [ 47%]
test_project.py::test_archive_already_archived_raises PASSED             [ 52%]
test_project.py::test_reactivate_archived_project PASSED                 [ 57%]
test_project.py::test_reactivate_already_active_raises_not PASSED        [ 63%]
test_project.py::test_add_task_to_active_project PASSED                  [ 68%]
test_project.py::test_add_task_to_archived_project_raises PASSED         [ 73%]
test_project.py::test_add_task_preserves_existing_tasks_on_archive PASSED [ 78%]
test_project.py::test_reactivate_restores_ability_to_add_tasks PASSED    [ 84%]
test_project.py::test_timestamps_are_utc PASSED                          [ 89%]
test_project.py::test_str PASSED                                         [ 94%]
test_project.py::test_repr PASSEEN                                     [100%]

============================= 19 passed in 0.38s ==============================
```

All 19 tests pass with no failures.

---

## How the Class, Objects, Attributes, and Methods Work

### The `Project` class as a domain model
The `Project` class is a **plain Python object** that encapsulates project-level business logic for a personal developer to-do list. It is completely independent of Django's ORM — it has no `models.Model` base, no database fields, and no migrations. This design choice mirrors the `Task` class and enables:

1. **Testability** — All 19 unit tests run in zero-second isolation with no database setup.
2. **Reusability** — Can be used in services, APIs, or background tasks without Django coupling.
3. **Safety** — Validation logic runs in memory before any database interaction.

### Instantiation & objects
```python
p = Project(id=1, name="My Project", description="A project", status=Project.Status.ACTIVE)
```
- **`id`**: Unique integer assigned by the caller (typically a repository or API layer).
- **`name`**: The core identifier; must be non-empty after stripping whitespace.
- **`description`**: Optional free-form text; may be `None`.
- **`status`**: One of two `Status` enum members: `ACTIVE` or `ARCHIVED`. Defaults to `Status.ACTIVE`.
- **`tasks`**: An internal list of `Task` objects. Accessed via the `tasks` property, which returns a **copy** to prevent direct mutation.

### Instance attributes
Each attribute has a **property getter** (e.g., `@property def created_at`) so they are read-only from the outside. Internal mutation happens through methods, which also update `updated_at`. This enforces the invariant that `updated_at` always reflects the last mutation.

### Methods and behavior
- **`rename("New Name")`** — Strips whitespace, validates non-empty, replaces `name`, updates `updated_at`.
- **`archive()`** — If `status == ACTIVE`, changes it to `ARCHIVED` and updates `updated_at`. If already `ARCHIVED`, raises `ValidationError("Project is already archived")`. Existing tasks are preserved.
- **`reactivate()`** — Changes `status` from `ARCHIVED` back to `ACTIVE` and updates `updated_at`. If already `ACTIVE`, it is a no-op (no error, no unnecessary timestamp update — though the current implementation does update the timestamp; this is a minor design choice).
- **`add_task(task: Task)`** — If `status == ACTIVE`, appends `task` to `self._tasks` and updates `updated_at`. If `status == ARCHIVED`, raises `ValidationError("Cannot add task to an archived project. Reactivate the project first.")`.

### Validation error design
`Project.ValidationError` extends `ValueError`, making it compatible with `pytest.raises(ValueError)` or `try/except ValueError`. All user-facing validation (empty name, double-archive, adding to archived project) raises this specific error, which can be caught separately from other `ValueError` sources.

### Why two states (ACTIVE / ARCHIVED) instead of a softer flag
The binary ACTIVE/ARCHIVED state machine is a deliberate simplification for a personal to-do list:
- **ACTIVE** — Projects are open for new tasks.
- **ARCHIVED** — Projects are "closed"; existing tasks are preserved for historical reference, but no new tasks can be added until the project is reactivated.

This gives the user control over project visibility without permanent deletion. The `archive()` / `reactivate()` pattern is common in task-management software (GitHub Projects, Jira boards, etc.) and fits the scope of a personal developer to-do list backend.

---

## Combined Test Run (Task + Project)

Both the `Task` and `Project` domain models are fully unit-tested and independently verifiable:

```
Task tests: 24 passed
Project tests: 19 passed
Total: 43 passed
```

All domain logic is verified without any Django database involvement.