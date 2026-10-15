"""Django REST Framework serializers for the Project model."""

from rest_framework import serializers as ser

from projects.models import Project, ProjectStatus


class ProjectSerializer(ser.Serializer):
    """Serializer for Project."""
    name = ser.CharField(max_length=200, required=True)
    description = ser.CharField(required=False, allow_blank=True, allow_null=True)
    status = ser.ChoiceField(choices=ProjectStatus.choices, default=ProjectStatus.ACTIVE)
    created_at = ser.ReadOnlyField()
    updated_at = ser.ReadOnlyField()

    def validate_name(self, value: str) -> str:
        """Name must be non-empty after stripping whitespace."""
        stripped = value.strip()
        if not stripped:
            raise ser.ValidationError("name must be a non-empty string")
        return stripped

    def create(self, validated_data: dict) -> Project:
        return Project.objects.create(**validated_data)

    def update(self, instance: Project, validated_data: dict) -> Project:
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save(using=self._db)
        return instance