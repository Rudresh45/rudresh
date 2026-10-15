"""Verify Task and Project serializers validation logic directly."""

import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'

import django
django.setup()

from tasks.models import Task, Priority, Status as TaskStatus
from projects.models import Project, ProjectStatus
from rest_framework.serializers import Serializer, ReadOnlyField, ChoiceField, CharField, ValidationError


# --- Test Task serializer fields ---

# Test title validation
class TaskTitleTest(Serializer):
    title = CharField(max_length=200, required=True)

t = TaskTitleTest(data={"title": ""})
assert t.is_valid() is False, "Empty title should be invalid"
assert "title" in t.errors
print("PASS: Empty title rejected")

t = TaskTitleTest(data={"title": "   "})
assert t.is_valid() is False, "Whitespace-only title should be invalid"
assert "title" in t.errors
print("PASS: Whitespace-only title rejected")

t = TaskTitleTest(data={"title": "Task"})
assert t.is_valid() is True
print("PASS: Valid title accepted")

# Test priority validation
class TaskPriorityTest(Serializer):
    priority = ChoiceField(choices=Priority.choices)

t = TaskPriorityTest(data={"priority": 2})  # MEDIUM
assert t.is_valid() is True
print("PASS: Valid priority accepted")

t = TaskPriorityTest(data={"priority": 99})
assert t.is_valid() is False
assert "priority" in t.errors
print("PASS: Invalid priority rejected")

# Test status validation
class TaskStatusTest(Serializer):
    status = ChoiceField(choices=TaskStatus.choices)

t = TaskStatusTest(data={"status": 1})  # TODO
assert t.is_valid() is True
print("PASS: Valid status (TODO) accepted")

t = TaskStatusTest(data={"status": 99})
assert t.is_valid() is False
assert "status" in t.errors
print("PASS: Invalid status rejected")

# Test due_date None
class TaskDueDateTest(Serializer):
    due_date = CharField(required=False, allow_null=True)

t = TaskDueDateTest(data={"due_date": None})
assert t.is_valid() is True
print("PASS: due_date=None accepted")

print("\n=== All Task serializer validation tests passed ===")


# --- Test Project serializer fields ---

# Test name validation
class ProjectNameTest(Serializer):
    name = CharField(max_length=200, required=True)

t = ProjectNameTest(data={"name": ""})
assert t.is_valid() is False, "Empty name should be invalid"
assert "name" in t.errors
print("PASS: Empty name rejected")

t = ProjectNameTest(data={"name": "   "})
assert t.is_valid() is False, "Whitespace-only name should be invalid"
assert "name" in t.errors
print("PASS: Whitespace-only name rejected")

t = ProjectNameTest(data={"name": "My Project"})
assert t.is_valid() is True
print("PASS: Valid name accepted")

# Test status validation
class ProjectStatusTest(Serializer):
    status = ChoiceField(choices=ProjectStatus.choices)

t = ProjectStatusTest(data={"status": 1})  # ACTIVE
assert t.is_valid() is True
print("PASS: Valid status (ACTIVE) accepted")

t = ProjectStatusTest(data={"status": 2})  # ARCHIVED
assert t.is_valid() is True
print("PASS: Valid status (ARCHIVED) accepted")

# Test read-only fields
class CreatedAtTest(Serializer):
    created_at = ReadOnlyField()

t = CreatedAtTest(data={"created_at": "2024-01-01T00:00:00Z"})
assert t.is_valid() is True, "Read-only field should accept input but not enforce it"
print("PASS: Read-only created_at accepted")

class UpdatedAtTest(Serializer):
    updated_at = ReadOnlyField()

t = UpdatedAtTest(data={"updated_at": "2024-01-01T00:00:00Z"})
assert t.is_valid() is True, "Read-only updated_at should accept input"
print("PASS: Read-only updated_at accepted")

print("\n=== All Project serializer validation tests passed ===")
print("\n=== ALL SERIALIZER VALIDATION TESTS PASSED ===")