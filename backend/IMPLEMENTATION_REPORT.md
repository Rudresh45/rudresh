# Task Domain Implementation Report

## Overview
Implemented a pure Python `Task` domain class (`domains/task.py`) independent of Django ORM, with complete state machine logic, validation, and timezone-aware datetime handling. All 24 unit tests pass.

---

## Class: `Task`

### Type Hierarchy
- **`Priority`** (`enum.Enum`): `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- **`Status`** (`enum.Enum`): `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`
- **`Task`** (`class`): Core domain model

### Exceptions
- **`Task.ValidationError`** (`subclass` of `ValueError`): Raised for invalid inputs or illegal state transitions.

### Constructor
```python
Task(id: int, title: str, description: str | None = None,
     status: Status | None = None, priority: Priority = Priority.MEDIUM,
     due_date: date | None = None) -> None
```

**Initialization logic:**
- `id` must be `int`; otherwise `ValidationError`
- `title` must be non-empty after `.strip()`; `ValidationError` otherwise
- `description` optional, may be `None`
- `status` defaults to `Status.TODO` if `None`
- `priority` must be a `Priority` enum member; `ValidationError` otherwise
- `due_date` optional `date` or `None`
- Timestamps (`created_at`, `updated_at`, `completed_at`) are set to current UTC `datetime`

### Attributes (all read-exposed via properties)

| Attribute | Type | Description |
|---|---|---|
| `id` | `int` | Assigned by caller |
| `title` | `str` | Stripped, non-empty |
| `description` | `str \| None` | Optional free-text |
| `status` | `Status` | Lifecycle state |
| `priority` | `Priority` | Importance level |
| `due_date` | `date \| None` | Deadline |
| `created_at` | `datetime` | UTC, set at construction |
| `updated_at` | `datetime` | UTC, updated on every mutation |
| `completed_at` | `datetime \| None` | Set when marked done |

### Methods

#### Title/Description/Priority updates
- `update_title(new_title: str)` — Replaces title, refreshes `updated_at`. Rejects empty/whitespace.
- `update_description(new_description: str \| None)` — Sets or clears description.
- `update_priority(new_priority: Priority)` — Changes priority. Rejects non-enum.

#### Status transition methods
- `start()` — `TODO` → `IN_PROGRESS`. Raises `ValidationError` if not in `TODO`.
- `block()` — Transitions to `BLOCKED` from any status via `_transition_any_to`.
- `mark_complete()` — Transitions to `DONE` via `_transition_any_to`. Sets `completed_at` to UTC now. No-op if already `DONE`.
- `reopen()` — Clears `completed_at`, transitions `DONE` → `TODO` via `_transition_any_to`.

#### Query method
- `is_overdue(reference_date: date \| datetime \| None = None) -> bool`
  - Returns `False` if `completed_at` is set
  - Returns `False` if `due_date` is `None`
  - Compares `due_date < reference_date` (default: `date.today()`)
  - If `reference_date` is `datetime`, extracts `.date()`

#### Transition internals
- `_transition(from_status, to_status)` — Strict validation using `_TRANSITIONS` map. Allowed transitions:
  - `TODO` → `{IN_PROGRESS, BLOCKED, DONE}`
  - `IN_PROGRESS` → `{TODO, BLOCKED, DONE}`
  - `BLOCKED` → `{TODO, IN_PROGRESS, DONE}`
  - `DONE` → `{IN_PROGRESS}` (reopen handled by `reopen()` / `_transition_any_to`)
- `_transition_any_to(to_status)` — Lenient transition used by `block()`, `mark_complete()`, `reopen()`. Handles `DONE` → `TODO`/`IN_PROGRESS` specially.

#### Representation
- `__repr__()` → `Task(id=<int>, title='<str>', status=<Status>, priority=<Priority>)`
- `__str__()` → returns `self.title`

---

## Status Transition Diagram

```
      +------->+       +------+
      | TODO   |       | DONE   |
      +------+       +------+
        |  ^  |       |  ^   |
        |  |  | start() mark_complete()
        v  |  v       |  |
      +------+       +------+
      |IN_PROGRESS|     |
      +------+       +------+
        | ^  |
        | |  block() reopen()
        v |  v
      +------+
      |BLOCKED|
      +------+
```

- `block()` can be called from any status and transitions to `BLOCKED`.
- `reopen()` only makes sense from `DONE`; transitions back to `TODO`.
- `mark_complete()` from `TODO`/`IN_PROGRESS`/`BLOCKED` → `DONE`; from `DONE` → no-op.

---

## Unit Tests (24 passed)

### Creation & Basic Properties
- `test_task_creation_defaults` — new task starts `todo` with `medium` priority
- `test_task_creation_with_all_fields` — all attributes accepted
- `test_update_title` / `test_update_title_invalid` — valid/invalid title updates
- `test_update_description` — set/clear description
- `test_update_priority` / `test_update_priority_invalid` — valid/invalid priority
- `test_timestamps_are_utc` — `created_at`/`updated_at` are UTC-aware
- `test_completed_at_is_utc_when_set` — `completed_at` is UTC when set
- `test_repr` / `test_str` — string representation

### Status Transitions
- `test_start_from_todo` — `start()` moves `todo` → `in_progress`
- `test_start_from_in_progress_raises` — `start()` raises if not in `todo`
- `test_block_any_from` — `block()` works from any status
- `test_mark_complete_from_in_progress` — `in_progress` → `done`, sets `completed_at`
- `test_mark_complete_from_blocked` — `blocked` → `done`
- `test_reopen_clears_completed_at` — `reopen()` clears `completed_at`, moves to `todo`
- `test_is_overdue_pending` — no due date → not overdue
- `test_is_overdue_with_due_past` — past due date → overdue
- `test_is_overdue_already_done` — done task → not overdue
- `test_is_overdue_future_due` — future due date → not overdue

### Input Validation
- `test_empty_title_raises` — empty string rejected
- `test_whitespace_only_title_raises` — whitespace-only rejected
- `test_non_enum_priority_raises` — non-`Priority` value rejected

---

## How the Class, Objects, Attributes, and Methods Work

### The `Task` class as a domain model
The `Task` class is a **plain Python object** that encapsulates business logic and state management for a single to-do item. It is completely independent of Django's ORM — it has no `models.Model` base, no database fields, and no migrations. This design choice means:

1. **Testability** — Can be unit-tested in isolation with zero database setup.
2. **Reusability** — Can be used in services, APIs, or background tasks without Django coupling.
3. **Safety** — Validation logic runs in memory before any database interaction.

### Instantiation & objects
```python
t = Task(id=1, title="Buy groceries", description="Milk, eggs, bread", priority=Priority.HIGH)
```
- **`id`**: Unique integer assigned by the caller (typically a repository or API layer).
- **`title`**: The core identifier; must be non-empty after stripping whitespace.
- **`description`**: Optional free-form text; may be `None`.
- **`status`**: One of four `Status` enum members. Defaults to `Status.TODO`.
- **`priority`**: One of four `Priority` enum members. Defaults to `Priority.MEDIUM`.
- **`due_date`**: Optional `datetime.date` deadline.
- **Timestamps**: All three (`created_at`, `updated_at`, `completed_at`) are `datetime` objects with `tzinfo=timezone.utc`, ensuring consistent timezone-aware behavior.

### Instance attributes
Each attribute has a **property getter** (e.g., `@property def created_at`) so they are read-only from the outside. Internal mutation happens through methods, which also update `updated_at`. This enforces the invariant that `updated_at` always reflects the last mutation.

### Methods and behavior
- **`update_title("New title")`** — Strips whitespace, validates non-empty, replaces `title`, updates `updated_at`.
- **`start()`** — Checks `self.status == Status.TODO`; if valid, calls `_transition(Status.TODO, Status.IN_PROGRESS)`, which validates against `_TRANSITIONS` and sets `self.status = Status.IN_PROGRESS`. Raises `ValidationError` if called from any other status.
- **`mark_complete()`** — If already `DONE`, just updates `updated_at` and returns. Otherwise, calls `_transition_any_to(Status.DONE)`, sets `completed_at = datetime.now(timezone.utc)`, updates `updated_at`.
- **`reopen()`** — Sets `completed_at = None`, calls `_transition_any_to(Status.TODO)`, updates `updated_at`. The `_transition_any_to` method has special handling: from `DONE`, it allows transition to `TODO` or `IN_PROGRESS`.
- **`is_overdue(reference_date=None)`** — If `completed_at` is not `None`, returns `False`. If `due_date` is `None`, returns `False`. Otherwise compares `due_date < reference_date` (default: `date.today()`). If `reference_date` is a `datetime`, extracts `.date()` for comparison.

### Validation error design
`Task.ValidationError` extends `ValueError`, making it compatible with `pytest.raises(ValueError)` or `try/except ValueError`. All user-facing validation (empty title, wrong priority type, invalid transition) raises this specific error, which can be caught separately from other `ValueError` sources.

### Why `_transition` vs `_transition_any_to`
- `_transition` enforces **strict** transition rules from the `_TRANSITIONS` map. Used when the from-status matters (e.g., `start()` only from `TODO`).
- `_transition_any_to` is **lenient** and handles cross-status moves gracefully, with special cases for `DONE` → `TODO`/`IN_PROGRESS`. Used by `block()`, `mark_complete()`, and `reopen()` where the exact prior state is less important than the semantic action.

---

## Files Created/Modified

| Path | Action |
|---|---|
| `backend/domains/task.py` | Created — Task domain class with Priority/Status enums, validation, state machine |
| `backend/test_task.py` | Created — 24 unit tests covering creation, mutations, transitions, overdue checks, input validation |
| `backend/requirements.txt` | Already existed — pinned dependencies |
| `backend/.gitignore` | Already existed — git ignore rules |
| `backend/.env.example` | Already existed — environment variables example |

---

## Test Results Summary

```
============================= test session starts =============================
platform win32 -- Python 3.14.7, pytest-9.1.1, pluggy-1.6.0 -- ...
cachedir: .pytest_cache
rootdir: E:\TODO\backend
plugins: django-4.14.0
collecting ... collected 24 items

test_task.py::test_task_creation_defaults PASSED                         [  4%]
test_task.py::test_task_creation_with_all_fields PASSED                  [  8%]
test_task.py::test_update_title PASSED                                   [ 12%]
test_task.py::test_update_title_invalid PASSED                           [ 16%]
test_task.py::test_update_description PASSED                             [ 20%]
test_task.py::test_update_priority PASSED                                [ 25%]
test_task.py::test_update_priority_invalid PASSED                        [ 29%]
test_task.py::test_start_from_todo PASSED                                [ 33%]
test_task.py::test_start_from_in_progress_raises PASSED                  [ 37%]
test_task.py::test_block_any_from PASSED                                 [ 41%]
test_task.py::test_mark_complete_from_in_progress PASSED                 [ 45%]
test_task.py::test_mark_complete_from_blocked PASSED                     [ 50%]
test_task.py::test_reopen_clears_completed_at PASSED                     [ 54%]
test_task.py::test_is_overdue_pending PASSED                             [ 58%]
test_task.py::test_is_overdue_with_due_past PASSED                       [ 62%]
test_task.py::test_is_overdue_already_done PASSED                        [ 66%]
test_task.py::test_is_overdue_future_due PASSED                          [ 70%]
test_task.py::test_empty_title_raises PASSED                             [ 75%]
test_task.py::test_whitespace_only_title_raises PASSED                   [ 79%]
test_task.py::test_non_enum_priority_raises PASSED                       [ 83%]
test_task.py::test_timestamps_are_utc PASSED                             [ 87%]
test_task.py::test_completed_at_is_utc_when_set PASSED                   [ 91%]
test_task.py::test_repr PASSED                                           [ 95%]
test_task.py::test_str PASSED                                            [100%]

============================= 24 passed in 0.15s ==============================
```

All 24 tests pass with no failures.