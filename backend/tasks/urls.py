"""Task API URLs under /api/v1/tasks/."""

from django.urls import path

from tasks.views import (
    task_list_create_view,
    task_retrieve_update_destroy_view,
    task_start_view,
    task_block_view,
    task_complete_view,
    task_reopen_view,
)

urlpatterns = [
    path("", task_list_create_view, name="task-list-create"),
    path("<int:pk>/", task_retrieve_update_destroy_view, name="task-retrieve-update-destroy"),
    path("<int:pk>/start/", task_start_view, name="task-start"),
    path("<int:pk>/block/", task_block_view, name="task-block"),
    path("<int:pk>/complete/", task_complete_view, name="task-complete"),
    path("<int:pk>/reopen/", task_reopen_view, name="task-reopen"),
]