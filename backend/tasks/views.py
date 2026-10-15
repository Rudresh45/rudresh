import json
from django.http import JsonResponse
from django.urls import reverse_lazy

from tasks.models import Task, Priority, Status as TaskStatus
from tasks.serializers import TaskSerializer, STR_TO_PRIORITY, STR_TO_STATUS


def _get_request_data(request):
    if request.body:
        try:
            return json.loads(request.body)
        except (json.JSONDecodeError, UnicodeDecodeError):
            pass
    return request.POST


def task_list_create_view(request):
    """GET /api/v1/tasks/ and POST /api/v1/tasks/"""
    if request.method == "GET":
        tasks = Task.objects.all()
        status_param = request.GET.get("status")
        if status_param:
            val_lower = status_param.lower()
            if val_lower in STR_TO_STATUS:
                tasks = tasks.filter(status=STR_TO_STATUS[val_lower].value)

        priority_param = request.GET.get("priority")
        if priority_param:
            val_lower = priority_param.lower()
            if val_lower in STR_TO_PRIORITY:
                tasks = tasks.filter(priority=STR_TO_PRIORITY[val_lower].value)

        due_date_param = request.GET.get("due_date")
        if due_date_param:
            tasks = tasks.filter(due_date=due_date_param)

        serializer = TaskSerializer(tasks, many=True)
        return JsonResponse(serializer.data, safe=False)
    elif request.method == "POST":
        data = _get_request_data(request)
        serializer = TaskSerializer(data=data)
        if serializer.is_valid():
            task = serializer.save()
            return JsonResponse(TaskSerializer(task).data, status=201)
        return JsonResponse(serializer.errors, status=400)


def task_retrieve_update_destroy_view(request, pk):
    """GET /api/v1/tasks/{id}/, PATCH /api/v1/tasks/{id}/, DELETE /api/v1/tasks/{id}/"""
    try:
        task = Task.objects.get(pk=pk)
    except Task.DoesNotExist:
        return JsonResponse({"detail": "Not found"}, status=404)
    
    if request.method == "GET":
        serializer = TaskSerializer(task)
        return JsonResponse(serializer.data)
    elif request.method == "PATCH":
        data = _get_request_data(request)
        serializer = TaskSerializer(task, data=data, partial=True)
        if serializer.is_valid():
            task = serializer.save()
            return JsonResponse(TaskSerializer(task).data)
        return JsonResponse(serializer.errors, status=400)
    elif request.method == "DELETE":
        task.delete()
        return JsonResponse({"detail": "Deleted"}, status=204)


def task_start_view(request, pk):
    """POST /api/v1/tasks/{id}/start/"""
    try:
        task = Task.objects.get(pk=pk)
    except Task.DoesNotExist:
        return JsonResponse({"detail": "Not found"}, status=404)
    task.start()
    serializer = TaskSerializer(task)
    return JsonResponse(serializer.data)


def task_block_view(request, pk):
    """POST /api/v1/tasks/{id}/block/"""
    try:
        task = Task.objects.get(pk=pk)
    except Task.DoesNotExist:
        return JsonResponse({"detail": "Not found"}, status=404)
    task.block()
    serializer = TaskSerializer(task)
    return JsonResponse(serializer.data)


def task_complete_view(request, pk):
    """POST /api/v1/tasks/{id}/complete/"""
    try:
        task = Task.objects.get(pk=pk)
    except Task.DoesNotExist:
        return JsonResponse({"detail": "Not found"}, status=404)
    task.mark_complete()
    serializer = TaskSerializer(task)
    return JsonResponse(serializer.data)


def task_reopen_view(request, pk):
    """POST /api/v1/tasks/{id}/reopen/"""
    try:
        task = Task.objects.get(pk=pk)
    except Task.DoesNotExist:
        return JsonResponse({"detail": "Not found"}, status=404)
    task.reopen()
    serializer = TaskSerializer(task)
    return JsonResponse(serializer.data)