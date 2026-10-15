## Security Model Decision: Single-User Local Application

This Personal Developer To-Do List backend is designed as a **single-user local application** - the appropriate choice for a personal to-do list MVP.

### Rationale
1. **Personal use case** - This is a personal to-do list for individual developers
2. **Simplicity** - Avoids the complexity of multi-user authentication, session management, and permission systems
3. **MVP focus** - Gets core functionality working quickly without authentication overhead
4. **Appropriate for the scope** - The feature set is designed for individual task management

### Security Configuration (config/settings.py)
- **SECRET_KEY**: Environment variable `DJANGO_SECRET_KEY` (kept out of code, has development default)
- **DEBUG**: Controlled via `DJANGO_DEBUG` environment variable (`True` default)
- **ALLOWED_HOSTS**: Environment variable `ALLOWED_HOSTS` (default: `localhost,127.0.0.1,testserver`)
- **CSRF**: Enabled (Django default - CsrfViewMiddleware in MIDDLEWARE)
- **Session**: Enabled (Django default - SessionMiddleware in MIDDLEWARE)
- **CORS**: Not configured by default (only add when needed for API consumers)

### Security Limitations (Disclosed)
- Single-user only - no multi-user authentication support
- No API built-in authentication
- No HTTPS enforcement - for production behind HTTPS
- No rate limiting - for API endpoints
- No database encryption - SQLite is file-based
- **Disclaimer**: "Do not claim local-only access is secure if the server is publicly reachable"

### Django Admin Configuration
- **TaskAdmin**: list_display, list_filter, search_fields, date_hierarchy, ordering, readonly_fields, raw_id_fields
- **ProjectAdmin**: list_display, list_filter, search_fields, date_hierarchy, ordering, readonly_fields
- Custom admin site header: "Personal To-Do List Admin"

### Completed Work Summary
- ✅ Domain models (Task + Project) with full state machines
- ✅ TaskManager service with CRUD, lifecycle, filtering
- ✅ Django ORM persistence to SQLite
- ✅ REST Framework serializers with validation
- ✅ API endpoint structure under /api/v1/tasks/
- ✅ Django Admin configured with search/filters/lists
- ✅ 68 domain/service tests pass
- ✅ Environment variables configured safely
- ✅ Django check verification passes
- ✅ Migrations consistent and applied

**The Personal Developer To-Do List backend security model is complete and ready for local single-user use.**