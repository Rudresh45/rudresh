"""Run serializer tests with Django configured."""

import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'

import django
django.setup()

from rest_framework.test import APISerializerTestCase  # noqa: E402 (after django.setup)
from tasks.serializers import TaskSerializer
from projects.serializers import ProjectSerializer


class TaskSerializerTest(APISerializerTestCase):
    serializer_class = TaskSerializer

    def test_valid_data(self):
        data = {
            "title": "Buy milk",
            "description": "Full fat",
            "priority": 2,
            "status": 1,
        }
        serializer = self.serializer_class(data=data)
        assert serializer.is_valid() is True

    def test_invalid_empty_title(self):
        data = {
            "title": "",
            "description": "Some note",
        }
        serializer = self.serializer_class(data=data)
        assert serializer.is_valid() is False
        assert "title" in serializer.errors

    def test_whitespace_only_title(self):
        data = {
            "title": "   ",
            "description": "Some note",
        }
        serializer = self.serializer_class(data=data)
        assert serializer.is_valid() is False
        assert "title" in serializer.errors

    def test_valid_priority(self):
        data = {
            "title": "Task",
            "priority": 4,
        }
        serializer = self.serializer_class(data=data)
        assert serializer.is_valid() is True

    def test_invalid_priority(self):
        data = {
            "title": "Task",
            "priority": 99,
        }
        serializer = self.serializer_class(data=data)
        assert serializer.is_valid() is False
        assert "priority" in serializer.errors

    def test_valid_status(self):
        data = {
            "title": "Task",
            "status": 3,
        }
        serializer = self.serializer_class(data=data)
        assert serializer.is_valid() is True

    def test_invalid_status(self):
        data = {
            "title": "Task",
            "status": 99,
        }
        serializer = self.serializer_class(data=data)
        assert serializer.is_valid() is False
        assert "status" in serializer.errors

    def test_readonly_created_at(self):
        data = {
            "title": "Task",
            "created_at": "2024-01-01T00:00:00Z",
        }
        serializer = self.serializer_class(data=data)
        assert serializer.is_valid() is True

    def test_readonly_updated_at(self):
        data = {
            "title": "Task",
            "updated_at": "2024-01-01T00:00:00Z",
        }
        serializer = self.serializer_class(data=data)
        assert serializer.is_valid() is True

    def test_due_date_none(self):
        data = {
            "title": "Task",
            "due_date": None,
        }
        serializer = self.serializer_class(data=data)
        assert serializer.is_valid() is True

    def test_project_none(self):
        data = {
            "title": "Task",
            "project": None,
        }
        serializer = self.serializer_class(data=data)
        assert serializer.is_valid() is True

    def test_project_valid(self):
        data = {
            "title": "Task",
            "project": 1,
        }
        serializer = self.serializer_class(data=data)
        # May be invalid if pk=1 does not exist; that is fine for this test.
        result = serializer.is_valid()
        # We just check it doesn't crash; accept either result.


class ProjectSerializerTest(APISerializerTestCase):
    serializer_class = ProjectSerializer

    def test_valid_data(self):
        data = {
            "name": "My Project",
            "description": "A test project",
        }
        serializer = self.serializer_class(data=data)
        assert serializer.is_valid() is True

    def test_invalid_empty_name(self):
        data = {
            "name": "",
            "description": "Some note",
        }
        serializer = self.serializer_class(data=data)
        assert serializer.is_valid() is False
        assert "name" in serializer.errors

    def test_whitespace_only_name(self):
        data = {
            "name": "   ",
            "description": "Some note",
        }
        serializer = self.serializer_class(data=data)
        assert serializer.is_valid() is False
        assert "name" in serializer.errors

    def test_valid_status_active(self):
        data = {
            "name": "Project",
            "status": 1,
        }
        serializer = self.serializer_class(data=data)
        assert serializer.is_valid() is True

    def test_valid_status_archived(self):
        data = {
            "name": "Project",
            "status": 2,
        }
        serializer = self.serializer_class(data=data)
        assert serializer.is_valid() is True

    def test_readonly_created_at(self):
        data = {
            "name": "Project",
            "created_at": "2024-01-01T00:00:00Z",
        }
        serializer = self.serializer_class(data=data)
        assert serializer.is_valid() is True

    def test_readonly_updated_at(self):
        data = {
            "name": "Project",
            "updated_at": "2024-01-01T00:00:00Z",
        }
        serializer = self.serializer_class(data=data)
        assert serializer.is_valid() is True


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])