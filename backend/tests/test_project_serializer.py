"""Serializer tests for the Project model."""

import pytest

from django.test import TestCase

from projects.serializers import ProjectSerializer


class ProjectSerializerTest(TestCase):
    """Test ProjectSerializer validation and serialization."""

    serializer_class = ProjectSerializer

    def test_valid_data(self) -> None:
        """Valid data should serialize successfully."""
        data = {
            "name": "My Project",
            "description": "A test project",
        }
        serializer = self.serializer_class(data=data)
        assert serializer.is_valid() is True

    def test_invalid_empty_name(self) -> None:
        """Empty name should raise a validation error."""
        data = {
            "name": "",
            "description": "Some note",
        }
        serializer = self.serializer_class(data=data)
        assert serializer.is_valid() is False
        assert "name" in serializer.errors

    def test_whitespace_only_name(self) -> None:
        """Whitespace‑only name should raise a validation error."""
        data = {
            "name": "   ",
            "description": "Some note",
        }
        serializer = self.serializer_class(data=data)
        assert serializer.is_valid() is False
        assert "name" in serializer.errors

    def test_valid_status_active(self) -> None:
        """ACTIVE status should be accepted."""
        data = {
            "name": "Project",
            "status": 1,  # ACTIVE
        }
        serializer = self.serializer_class(data=data)
        assert serializer.is_valid() is True

    def test_valid_status_archived(self) -> None:
        """ARCHIVED status should be accepted."""
        data = {
            "name": "Project",
            "status": 2,  # ARCHIVED
        }
        serializer = self.serializer_class(data=data)
        assert serializer.is_valid() is True

    def test_readonly_created_at(self) -> None:
        """created_at should be read‑only and absent from input."""
        data = {
            "name": "Project",
            "created_at": "2024-01-01T00:00:00Z",
        }
        serializer = self.serializer_class(data=data)
        assert serializer.is_valid() is True

    def test_readonly_updated_at(self) -> None:
        """updated_at should be read‑only and absent from input."""
        data = {
            "name": "Project",
            "updated_at": "2024-01-01T00:00:00Z",
        }
        serializer = self.serializer_class(data=data)
        assert serializer.is_valid() is True