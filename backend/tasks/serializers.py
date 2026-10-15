"""Django REST Framework serializers for the Task model."""

from rest_framework import serializers as ser

from tasks.models import Task, Priority, Status as TaskStatus
from projects.models import Project


PRIORITY_TO_STR = {
    Priority.LOW: "low",
    Priority.MEDIUM: "med",
    Priority.HIGH: "high",
    Priority.URGENT: "urgent",
    1: "low",
    2: "med",
    3: "high",
    4: "urgent",
}

STR_TO_PRIORITY = {
    "low": Priority.LOW,
    "med": Priority.MEDIUM,
    "medium": Priority.MEDIUM,
    "high": Priority.HIGH,
    "urgent": Priority.URGENT,
    1: Priority.LOW,
    2: Priority.MEDIUM,
    3: Priority.HIGH,
    4: Priority.URGENT,
}

STATUS_TO_STR = {
    TaskStatus.TODO: "todo",
    TaskStatus.IN_PROGRESS: "in_progress",
    TaskStatus.BLOCKED: "blocked",
    TaskStatus.DONE: "done",
    1: "todo",
    2: "in_progress",
    3: "blocked",
    4: "done",
}

STR_TO_STATUS = {
    "todo": TaskStatus.TODO,
    "in_progress": TaskStatus.IN_PROGRESS,
    "in-progress": TaskStatus.IN_PROGRESS,
    "blocked": TaskStatus.BLOCKED,
    "done": TaskStatus.DONE,
    1: TaskStatus.TODO,
    2: TaskStatus.IN_PROGRESS,
    3: TaskStatus.BLOCKED,
    4: TaskStatus.DONE,
}


class TaskSerializer(ser.Serializer):
    """Serializer for Task."""
    id = ser.IntegerField(read_only=True)
    title = ser.CharField(max_length=200, required=True)
    description = ser.CharField(required=False, allow_blank=True, allow_null=True)
    priority = ser.ChoiceField(choices=Priority.choices, default=Priority.MEDIUM)
    status = ser.ChoiceField(choices=TaskStatus.choices, default=TaskStatus.TODO)
    due_date = ser.DateField(required=False, allow_null=True)
    project = ser.PrimaryKeyRelatedField(
        queryset=Project.objects.all(),
        required=False,
        allow_null=True,
    )
    created_at = ser.ReadOnlyField()
    updated_at = ser.ReadOnlyField()
    completed_at = ser.DateTimeField(required=False, allow_null=True)

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, "copy") else dict(data)
        if "priority" in mutable_data:
            val = mutable_data["priority"]
            if isinstance(val, str):
                val_lower = val.lower()
                if val_lower in STR_TO_PRIORITY:
                    mutable_data["priority"] = STR_TO_PRIORITY[val_lower].value
        if "status" in mutable_data:
            val = mutable_data["status"]
            if isinstance(val, str):
                val_lower = val.lower()
                if val_lower in STR_TO_STATUS:
                    mutable_data["status"] = STR_TO_STATUS[val_lower].value
        return super().to_internal_value(mutable_data)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if "priority" in ret and ret["priority"] in PRIORITY_TO_STR:
            ret["priority"] = PRIORITY_TO_STR[ret["priority"]]
        if "status" in ret and ret["status"] in STATUS_TO_STR:
            ret["status"] = STATUS_TO_STR[ret["status"]]
        return ret

    def validate_title(self, value: str) -> str:
        """Title must be non-empty after stripping whitespace."""
        stripped = value.strip()
        if not stripped:
            raise ser.ValidationError("title must be a non-empty string")
        return stripped

    def validate_due_date(self, value) -> None:
        if value is None:
            return None
        return value

    def validate_project(self, value) -> None:
        if value is None:
            return None
        proj = Project.objects.get(pk=value.pk)
        if proj.status != Project.ProjectStatus.ACTIVE:
            raise ser.ValidationError(
                "Cannot assign a task to an archived project. "
                "Reactivate the project first."
            )
        return value

    def create(self, validated_data: dict) -> Task:
        return Task.objects.create(**validated_data)

    def update(self, instance: Task, validated_data: dict) -> Task:
        new_status = validated_data.pop("status", None)
        if new_status is not None:
            instance.status = new_status
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance