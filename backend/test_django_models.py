"""Quick verification that Django models work."""

import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'

import django
django.setup()

from tasks.models import Task
from projects.models import Project

if __name__ == '__main__':
    # Create a project
    p = Project(name='Test Project', description='A test')
    p.save()
    print(f'Project created: id={p.id}, name={p.name}')

    # Create a task linked to the project
    t = Task(title='Test Task', description='A test task', priority=2, status=1, project=p)
    t.save()
    print(f'Task created: id={t.id}, title={t.title}, project={t.project.name}')

    # Read back
    p2 = Project.objects.get(id=p.id)
    t2 = Task.objects.get(id=t.id)
    print(f'Read back - Project: {p2.name}, Task: {t2.title}, project={t2.project.name}')

    # List all projects
    for proj in Project.objects.all():
        print(f'Project: {proj.name}, status={proj.status}')

    # List all tasks
    for tsk in Task.objects.all():
        print(f'Task: {tsk.title}, priority={tsk.priority}, status={tsk.status}')

    # Create a second project with different name
    p3 = Project(name='Second Project', description='Another test')
    p3.save()
    print(f'Second project created: id={p3.id}, name={p3.name}')

    # Create a task not linked to any project (orphan)
    t3 = Task(title='Orphan Task', description='No project', priority=1, status=1)
    t3.save()
    print(f'Orphan task created: id={t3.id}, title={t3.title}, project={t3.project}')

    # List all tasks including orphan
    for tsk in Task.objects.all():
        print(f'Task: {tsk.title}, priority={tsk.priority}, status={tsk.status}, project={tsk.project}')

    print('All checks passed!')