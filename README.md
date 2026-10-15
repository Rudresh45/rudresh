# Personal Developer Task Manager

A minimalist, high-productivity developer task manager frontend built from scratch using **Next.js 14 (App Router)**, **React 18**, **TypeScript (Strict Mode)**, and **Tailwind CSS**.

Designed specifically for software engineers, freelancers, and full-stack developers who need high information density, rapid keyboard capture, and direct integration with their local Django task backend.

---

## 1. Verified Architecture & Tech Stack

- **Framework**: Next.js 14.2.35 (App Router with Server & Client Component separation)
- **Language**: TypeScript 5 (Strict Mode enabled, 0 type errors)
- **Styling**: Tailwind CSS 3.4 with custom design tokens (Deep Indigo `#3949AB` & Muted Teal `#0F766E`)
- **Icons**: Lucide React
- **Backend**: Django REST Framework + SQLite (running on `http://127.0.0.1:8000`)
- **API Proxy**: Next.js Server Route Handler (`app/api/v1/[...path]/route.ts`) providing zero-CORS reverse proxying and automated Django CSRF session token negotiation.

---

## 2. Implemented Routes

All 7 required product routes are fully implemented and navigable:

| Route | File Path | Purpose & Functionality |
|---|---|---|
| **Today** | `app/page.tsx` (`/`) | Displays current date, concise heading, quick single-line task capture, Overdue tasks requiring immediate attention, Active/In-Progress tasks, Today's scheduled tasks, and collapsible Completed Today summary. |
| **All Tasks** | `app/tasks/page.tsx` (`/tasks`) | Comprehensive workspace task list with search query filtering, status filtering (`todo`, `in_progress`, `blocked`, `done`), priority filtering (`low`, `med`, `high`, `urgent`), project filtering, due date filtering, and multi-field sorting. |
| **Upcoming** | `app/upcoming/page.tsx` (`/upcoming`) | Chronological timeline grouping tasks into Today, Tomorrow, Next 7 Days, Future, and Backlog / No Due Date, with one-click rescheduling shortcuts. |
| **Projects** | `app/projects/page.tsx` (`/projects`) | Project grid displaying active and archived projects with dynamically calculated task completion percentage and status breakdowns (`doneCount / totalCount`). |
| **Project Details** | `app/projects/[id]/page.tsx` (`/projects/[id]`) | Detailed view for a specific project displaying metadata, lifecycle controls (edit, archive, reactivate, delete), and project-specific task list with scoped quick-add. |
| **Completed** | `app/completed/page.tsx` (`/completed`) | Archive of all finished tasks (`status = 'done'`) showing completion timestamps (`completed_at`), search/filtering, and one-click reopen action. |
| **Settings** | `app/settings/page.tsx` (`/settings`) | Developer workspace preferences (default priority, start of week, date formatting) that save persistently to storage, live API connection latency testing, and API capabilities audit. |

---

## 3. Design System & Design Tokens

### Color Palette
- **Primary Brand**: Deep Indigo `#3949AB` (`brand-indigo`)
- **Secondary Brand**: Muted Teal `#0F766E` (`brand-teal`)
- **Page Background**: `#F7F8FA` (`page`)
- **Card & Modal Surface**: `#FFFFFF` (`surface`)
- **Subtle Surface / Hover**: `#F1F3F6` (`subtle`)
- **Main Text**: `#20242C` (`main`)
- **Secondary Text**: `#687180` (`secondary`)
- **Borders**: `#E5E7EB` (`border`)

### Restrained Priority Tokens
- **Urgent**: `#DC2626` (Red 600)
- **High**: `#D97706` (Amber 600)
- **Medium**: `#0F766E` (Muted Teal)
- **Low**: `#687180` (Secondary Neutral)

---

## 4. Backend Endpoints & Capabilities Audit

The existing Django backend was inspected thoroughly:

### Verified Live Backend Endpoints (`/api/v1/tasks/`)
- `GET /api/v1/tasks/` — Returns list of tasks (supports `status`, `priority`, `due_date` query filters).
- `POST /api/v1/tasks/` — Creates a task (`title`, `description`, `priority`, `status`, `due_date`, `project`).
- `GET /api/v1/tasks/<pk>/` — Retrieves single task.
- `PATCH /api/v1/tasks/<pk>/` — Partially updates task fields.
- `DELETE /api/v1/tasks/<pk>/` — Deletes task (returns `204 No Content`).
- `POST /api/v1/tasks/<pk>/start/` — Lifecycle transition to `in_progress`.
- `POST /api/v1/tasks/<pk>/block/` — Lifecycle transition to `blocked`.
- `POST /api/v1/tasks/<pk>/complete/` — Lifecycle transition to `done` and stamps `completed_at`.
- `POST /api/v1/tasks/<pk>/reopen/` — Lifecycle transition to `todo` and clears `completed_at`.

### Identified Backend Limitation & Separation Notice
- **Projects API Missing in Backend**:
  In `backend/projects/models.py` and `backend/projects/serializers.py`, the `Project` model and serializer exist. However, `backend/projects/views.py` is empty, `projects/urls.py` does not exist, and `backend/config/urls.py` only mounts `path("api/v1/tasks/", include("tasks.urls"))`.
  - **Handling**: In accordance with the prompt's instruction ("If an endpoint required by the UI is missing, keep the frontend architecture ready for it, display an appropriate unavailable state or implement a clearly separated local prototype adapter, document the missing endpoint, and do not modify backend code"), the frontend maintains a dedicated `lib/projects-api.ts` workspace adapter pre-seeded with existing Django DB projects (`Test Project` ID 1, `Second Project` ID 2) and surfaces a clear status banner informing the developer.

---

## 5. Exact Windows Setup & Execution Commands

Run these exact commands in Windows PowerShell:

### Step 1: Start Django Backend Server

```powershell
# Open terminal in project root
cd E:\TODO

# Start the Django backend server with the existing virtual environment
.\backend\.venv\Scripts\python.exe backend\manage.py runserver 127.0.0.1:8000
```

The backend server will run on `http://127.0.0.1:8000`.

### Step 2: Start Next.js Frontend Dev Server

```powershell
# Open a second PowerShell terminal in project root
cd E:\TODO

# Launch the development server
npm run dev
```

Open your browser to `http://localhost:3000` (or `http://localhost:3001` if port 3000 is occupied).

---

## 6. Verification & Quality Gates Passed

1. **TypeScript Check**:
   ```powershell
   npx tsc --noEmit
   # Exit code: 0 (No type errors)
   ```

2. **Lint Check**:
   ```powershell
   npm run lint
   # Exit code: 0 (✔ No ESLint warnings or errors)
   ```

3. **Production Build**:
   ```powershell
   npm run build
   # Compiled successfully (All 9 static & dynamic routes compiled)
   ```

4. **Live Browser Test**:
   - Automated end-to-end browser walkthrough verified all pages, task creation, editing, searching, filtering, project navigation, and live API connection testing.
   - Recording saved to artifacts directory.