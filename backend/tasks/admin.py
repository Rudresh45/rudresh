"""Admin site registration for the tasks app."""

from django.contrib import admin
from .models import Task, Priority, Status as TaskStatus


class TaskAdmin(admin.ModelAdmin):
    """Admin interface for Task model."""
    list_display = ('id', 'title', 'status', 'priority', 'created_at', 'completed_at', 'project')
    list_filter = ('status', 'priority', 'due_date', 'project')
    search_fields = ['title', 'description']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    readonly_fields = ('created_at', 'updated_at', 'completed_at')
    raw_id_fields = ('project',)
    filter_horizontal = []


class PriorityAdmin(admin.ModelAdmin):
    """Admin interface for Priority enum."""
    list_display = ('id', 'name')
    readonly_fields = ('name',)


# Register your models here.
admin.site.register(Task, TaskAdmin)

# TaskStatus is an enum, not a model, so we don't register it
# The status choices are displayed in the Task admin list_filter

# Customize the admin site header and title
admin.site.site_header = 'Personal To-Do List Admin'
admin.site.site_title = 'Personal To-Do List Admin'
admin.site.index_title = 'Personal To-Do List Administration'