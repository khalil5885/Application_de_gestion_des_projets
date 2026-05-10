# Laravel Backend Overview

This document explains how the recreated backend in `application_de_gestion_des_projets` works, what was used to build it, and how to run it.

## Project Summary

The backend was rebuilt from the API contract defined in the route file. The goal was to restore a Laravel API that matches the frontend's expected endpoints and response format.

The application is a project management backend with three user roles:

- `admin`
- `employee`
- `client`

It supports:

- authentication with API tokens
- project management
- task management
- task templates by project type
- project membership
- project and task comments
- dashboard summaries
- activity logging
- setup-password flow

## System Overview

This Laravel backend serves a **React 19 admin dashboard frontend** (located in `coreui/` folder). The two systems communicate over HTTP using a REST API with Bearer token authentication.

### Frontend-Backend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   React Frontend (coreui/)                      │
│  • React Router for navigation                                  │
│  • Redux + Context API for state management                     │
│  • Axios HTTP client with auth interceptors                     │
│  • Three role-based views (admin, employee, client)             │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTP Requests
                      │ Vite proxy: /api → backend
                      │ Bearer Token in Authorization header
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│              Laravel Backend API (application_de_gestion...)    │
│  • Route: application_de_gestion_des_projets.test               │
│  • Sanctum API authentication (personal access tokens)          │
│  • Eloquent ORM with normalized database schema                 │
│  • Three role-based API route groups                            │
│  • Normalized JSON response format                              │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTP Responses
                      │ JSON with { status, message, data }
                      ↓
         Frontend updates UI with response data
```

### Authentication Flow

1. **Login** — Frontend POSTs email/password to `/api/login`
2. **Token Received** — Backend returns Sanctum personal access token in response
3. **Token Storage** — Frontend stores token in `localStorage` (key: `auth_token`)
4. **Request Injection** — Axios interceptor adds `Authorization: Bearer {token}` to all requests
5. **Session Recovery** — On app refresh, frontend restores token from localStorage and validates via `/api/user` endpoint
6. **Logout** — Frontend calls `/api/logout` (clears backend token) and removes localStorage token

### API Response Format

All responses follow this normalized structure:

```json
{
  "status": "success|error",
  "message": "optional descriptive message",
  "data": { /* payload varies by endpoint */ }
}
```

**Successful request (200 OK):**
```json
{
  "status": "success",
  "message": "Projects retrieved",
  "data": {
    "projects": [
      { "id": 1, "name": "Website Redesign", ... }
    ]
  }
}
```

**Error response (400/401/422):**
```json
{
  "status": "error",
  "message": "Validation failed",
  "data": {
    "errors": { "email": ["Email is required"] }
  }
}
```

### Key Endpoint Mappings

| Frontend Feature | HTTP Method | API Endpoint | Auth Required | Roles |
|------------------|-------------|--------------|---------------|-------|
| User Login | POST | `/api/login` | No | All |
| Get Current User | GET | `/api/user` | Yes | All |
| User Logout | POST | `/api/logout` | Yes | All |
| List Users | GET | `/api/admin/users` | Yes | admin |
| Create User | POST | `/api/admin/users` | Yes | admin |
| List Projects | GET | `/api/admin/projects` or `/api/employee/projects` | Yes | admin, employee |
| Create Project | POST | `/api/admin/projects` | Yes | admin |
| Update Task Status | PATCH | `/api/employee/tasks/{id}` | Yes | employee |
| Add Comment | POST | `/api/projects/{id}/comments` or `/api/tasks/{id}/comments` | Yes | all |
| Get Dashboard Stats | GET | `/api/admin/dashboard` or `/api/employee/dashboard` | Yes | admin, employee |

### Data Flow Example: Creating a Project (Admin)

1. **Frontend** — Admin fills project form and clicks "Create"
2. **Frontend** — Axios POST to `/api/admin/projects` with form data + Bearer token
3. **Backend** — Middleware checks token validity and admin role
4. **Backend** — Form Request validates incoming data
5. **Backend** — ProjectController stores project in database
6. **Backend** — If project_type_id provided, auto-generates starter tasks from templates
7. **Backend** — ActivityLog records "Project created"
8. **Backend** — ProjectResource formats response
9. **Backend** — Returns `{ status: 'success', data: { project: {...} } }`
10. **Frontend** — Intercepts response, updates Redux state
11. **Frontend** — Navigates to project detail page
12. **Frontend** — User sees newly created project

### Session Persistence

- **Backend** — Sanctum stores API tokens in `personal_access_tokens` table with expiration
- **Frontend** — Stores token in localStorage and automatically appends to all API requests
- **Recovery** — On page refresh, frontend checks localStorage and validates token via `/api/user` endpoint
- **Invalidation** — On logout or token expiration (401 response), frontend clears localStorage and redirects to login

### Role-Based Access Control

The frontend receives user role from backend in login response:

```json
{
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "global_role": "admin"  // This determines available features
  }
}
```

Backend enforces roles via:
- **Route Middleware** — `/api/admin/*` routes require `role:admin`
- **Controller Logic** — Can gate specific actions (e.g., only admins can create users)
- **Model Relationships** — Database prevents access across role boundaries

Frontend enforces roles via:
- **RoleGuard** — Wraps routes to hide unauthorized UI
- **ProtectedRoute** — Prevents loading pages without authentication
- **Conditional Rendering** — Shows/hides features based on user role

## Tech Stack

The backend uses:

- `Laravel 11`
- `Laravel Sanctum` for API authentication
- `Spatie Laravel Permission` for role management
- `SQLite` for the local development database in the current setup
- `Eloquent ORM`
- `Form Requests` for validation
- `API Resources` for response shaping

## Response Format

All API responses were structured to follow this format:

```json
{
  "status": "success|error",
  "message": "optional message",
  "data": {}
}
```

Validation, auth errors, not found responses, and general API failures were also normalized to JSON in `bootstrap/app.php`.

## Main API Areas

The API is defined in:

- [api.php](C:/Users/asus/Herd/application_de_gestion_des_projets/routes/api.php)

Main route groups:

- public auth routes
- admin routes
- employee routes
- client routes

### Public Auth

- `POST /api/login`
- `POST /api/logout`
- `GET /api/user`
- `POST /api/setup-password/verify`
- `POST /api/setup-password`

### Admin

Admins can manage:

- users
- projects
- tasks
- project types
- task templates
- project member assignment
- activity logs
- dashboard stats

### Employee

Employees can:

- view assigned projects
- view assigned tasks
- update task status
- comment on tasks
- comment on projects they belong to
- view dashboard stats

### Client

Clients can:

- view their own projects
- view project details
- comment on their projects
- view dashboard stats

## Authentication and Roles

Authentication is handled with Sanctum personal access tokens.

The login flow is implemented in:

- [AuthController.php](C:/Users/asus/Herd/application_de_gestion_des_projets/app/Http/Controllers/AuthController.php)

Role handling uses Spatie Permission. Users also store a `global_role` value in the `users` table so the frontend has a simple role field to read.

Current role middleware alias:

- `role` => `Spatie\Permission\Middleware\RoleMiddleware`

User model:

- [User.php](C:/Users/asus/Herd/application_de_gestion_des_projets/app/Models/User.php)

## Database Structure

The rebuilt schema includes these main tables:

- `users`
- `project_types`
- `task_templates`
- `projects`
- `project_user`
- `tasks`
- `comments`
- `activity_logs`
- Sanctum token table
- Spatie permission tables

Migrations live in:

- [database/migrations](C:/Users/asus/Herd/application_de_gestion_des_projets/database/migrations)

## Validation Layer

Request validation is handled with Laravel Form Requests.

Examples:

- [LoginRequest.php](C:/Users/asus/Herd/application_de_gestion_des_projets/app/Http/Requests/Auth/LoginRequest.php)
- [StoreProjectRequest.php](C:/Users/asus/Herd/application_de_gestion_des_projets/app/Http/Requests/Admin/StoreProjectRequest.php)
- [UpdateTaskStatusRequest.php](C:/Users/asus/Herd/application_de_gestion_des_projets/app/Http/Requests/Employee/UpdateTaskStatusRequest.php)

## Resource Layer

API output is shaped with Laravel API Resources.

Examples:

- [UserResource.php](C:/Users/asus/Herd/application_de_gestion_des_projets/app/Http/Resources/UserResource.php)
- [ProjectResource.php](C:/Users/asus/Herd/application_de_gestion_des_projets/app/Http/Resources/ProjectResource.php)
- [TaskResource.php](C:/Users/asus/Herd/application_de_gestion_des_projets/app/Http/Resources/TaskResource.php)

## Seed Data

Seed logic is in:

- [DatabaseSeeder.php](C:/Users/asus/Herd/application_de_gestion_des_projets/database/seeders/DatabaseSeeder.php)

Default seeded users:

- admin: `admin@example.com` / `password`
- employee: `employee@example.com` / `password`
- client: `client@example.com` / `password`

The seeder also creates:

- one project type
- two task templates
- one sample project
- sample tasks
- sample comments
- one activity log entry

## How It Works Internally

### Projects

Projects belong to:

- one client
- one optional project type

Projects can have:

- many members through `project_user`
- many tasks
- many comments through a polymorphic relationship

When a project is created with a `project_type_id`, task templates are used to generate starter tasks automatically.

### Tasks

Tasks belong to:

- one project
- one optional parent task
- one optional assigned employee

Tasks also support:

- nested subtasks
- comments through a polymorphic relationship

When tasks are created, updated, or deleted, project progress is recalculated from the number of completed tasks.

### Comments

Comments are polymorphic, so they can be attached to:

- projects
- tasks

### Activity Logs

Activity logs track notable actions like:

- user creation
- project creation
- task updates
- comments
- setup-password completion

## Important Files

Useful entry points:

- [api.php](C:/Users/asus/Herd/application_de_gestion_des_projets/routes/api.php)
- [AuthController.php](C:/Users/asus/Herd/application_de_gestion_des_projets/app/Http/Controllers/AuthController.php)
- [ProjectController.php](C:/Users/asus/Herd/application_de_gestion_des_projets/app/Http/Controllers/Admin/ProjectController.php)
- [TaskController.php](C:/Users/asus/Herd/application_de_gestion_des_projets/app/Http/Controllers/Admin/TaskController.php)
- [DatabaseSeeder.php](C:/Users/asus/Herd/application_de_gestion_des_projets/database/seeders/DatabaseSeeder.php)
- [app.php](C:/Users/asus/Herd/application_de_gestion_des_projets/bootstrap/app.php)
- [composer.json](C:/Users/asus/Herd/application_de_gestion_des_projets/composer.json)

## Commands Used During Rebuild

Main verification commands used:

```powershell
php artisan route:list
php artisan migrate:fresh --seed --force
```

Dependency alignment included:

```powershell
composer update laravel/framework laravel/sanctum spatie/laravel-permission --with-all-dependencies
```

## Current Local Environment Note

The codebase passed:

- route registration
- migration
- seeding
- internal login execution through Laravel

The only unresolved local issue was serving the app over `http://localhost:8000` from this Codex shell environment. The backend code itself worked, but the environment failed to bind the local server socket.

Observed errors:

```text
Failed to listen on 127.0.0.1:8000 (reason: ?)
Failed to listen on localhost:8000 (reason: php_network_getaddresses: getaddrinfo for localhost failed: No such host is known)
curl: (7) Failed to connect to 127.0.0.1 port 8000 after 2029 ms: Could not connect to server
```

## Recommended Next Steps

1. Open the backend in Herd or your usual PHP runtime manager.
2. Confirm `.env` values match your preferred database and app URL.
3. Run `php artisan migrate:fresh --seed --force`.
4. Start the backend using your normal local server flow.
5. Connect the React frontend to the API base URL.

## Final Notes

This rebuild was centered on the route contract you provided, so the backend structure was shaped to match what the frontend expects. If you want, the next natural pass would be adding feature tests for login, role access, project CRUD, and task status updates.
