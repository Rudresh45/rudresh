"""Admin site registration for the projects app."""

from django.contrib import admin
from .models import Project, ProjectStatus

class ProjectAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "status", "created_at", "updated_at")
    list_filter = ("status",)
    search_fields = ["name"]
    date_hierarchy = "created_at"
    ordering = ["-created_at"]
    readonly_fields = ("created_at", "updated_at")

admin.site.register(Project, ProjectAdmin)

admin.site.site_header = "Personal To-Do List Admin"
admin.site.site_title = "Personal To-Do List Admin"
admin.site.index_title = "Personal To-Do List Administration"