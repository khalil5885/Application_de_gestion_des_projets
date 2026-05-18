# B2B Project Management SaaS Ecosystem

This repository contains a three-tier B2B project management platform for agencies, internal teams, and clients. The system is split into a Laravel REST API, a React/CoreUI web dashboard, and an Expo React Native mobile application.

## System Architecture

```text
React Web Dashboard        Expo React Native App
frontend/                  mobile/
    |                           |
    | HTTPS JSON API             | HTTPS JSON API
    | Bearer Sanctum token       | Bearer Sanctum token
    v                           v
Laravel 11 REST API
backend/
    |
    | Eloquent ORM
    v
Relational database
users, projects, tasks, comments, requests, notifications, activity_logs
```

The Laravel API is the authoritative application layer. It owns authentication, authorization, validation, persistence, AI estimation, notification records, and role-specific business workflows. The web and mobile clients consume the same route families and both model the same core roles: `admin`, `employee`, and `client`.

## Applications

| Layer | Location | Primary stack | Responsibility |
| --- | --- | --- | --- |
| Backend API | `backend/` | Laravel 11, PHP 8.3, Sanctum, Eloquent | REST API, authentication, RBAC, persistence, workflow services |
| Web dashboard | `frontend/` | React 19, Vite 7, CoreUI 5, Axios, React Router 7 | Role-based admin/employee/client browser experience |
| Mobile app | `mobile/` | Expo SDK 54, React Native 0.81, TypeScript, Expo Router, Zustand | Cross-platform role-based mobile project workspace |

Historical documentation and scaffold notes exist in `README_backend_overview.md`, `backend/README.md`, `frontend/README.md`, `frontend/ARCHITECTURE.md`, `frontend/DEVELOPMENT.md`, and `mobile/README.md`. This root documentation set consolidates the useful system-specific content into four definitive files:

- `README.md`: whole-project overview
- `BACKEND.md`: Laravel API, database, relationships, routes, middleware
- `FRONTEND.md`: React dashboard architecture
- `MOBILE.md`: Expo mobile architecture

## Authentication And Authorization

Authentication is handled by Laravel Sanctum personal access tokens.

1. A client sends credentials to `POST /api/login`.
2. Laravel validates credentials through `AuthController` and checks `users.is_active`.
3. The authenticated user receives a Sanctum bearer token plus a normalized user resource.
4. The web dashboard stores `token` and `user` in browser storage and attaches `Authorization: Bearer <token>` through the Axios interceptor.
5. The mobile app stores the active token in its API service layer and attaches the same bearer header through `authHeaders()`.
6. Protected API routes use `auth:sanctum`.
7. Role-protected API groups use custom `role:*` middleware backed by `users.global_role`.

Route protection is layered:

| Layer | Protection |
| --- | --- |
| API | `auth:sanctum` and `role:admin`, `role:employee`, or `role:client` middleware |
| Web dashboard | `ProtectedRoute` checks `AuthContext`; `RoleGuard` hides unauthorized role views |
| Mobile app | Expo Router screens read `useAppStore` auth state and route users into role-appropriate screens |

The password invitation flow is exposed through `POST /api/setup-password/verify` and `POST /api/setup-password`, using `setup_token` and `setup_token_expires_at` columns on `users`.

## System-Wide Features

| Feature | Description |
| --- | --- |
| Role-based access control | Admins manage users, projects, project types, templates, task review, workload, requests, and logs. Employees work on assigned projects/tasks and submit requests. Clients have project visibility and comment access. |
| Project management | Projects belong to clients, may use project types, can have employees as members, and track status, dates, progress, AI estimates, risk, and comments. |
| Task management | Tasks belong to projects, can be nested through parent/child relationships, can be assigned to employees, and follow the status flow `todo -> in_progress -> ready_for_review -> done` with `on_hold` support. |
| Project templates | Project types contain ordered task templates used to standardize repeatable delivery work. |
| AI estimation | `AiEstimationService` estimates project duration, risk level, and comments through Groq/OpenAI-compatible chat completions, with a local heuristic fallback. |
| Notification pipeline | `NotificationService` writes role-filtered notification rows. API consumers can list, filter, count unread, mark read, mark all read, delete, or clear notifications. |
| Requests workflow | Employees create polymorphic requests against tasks or projects. Admins approve or reject and record handler metadata. |
| Comments and attachments | Projects and tasks support polymorphic comments; comments can have uploaded attachment metadata. |
| Activity logging | Important model actions can be recorded in polymorphic `activity_logs` with visibility and JSON properties. |
| Workload reporting | Admin routes expose team workload summaries and employee detail views. |

## Repository Structure

```text
.
|-- backend/      Laravel 11 REST API
|-- frontend/     React 19 CoreUI web dashboard
|-- mobile/       Expo React Native TypeScript app
|-- coreui/       Legacy/template frontend material retained in the workspace
|-- README.md
|-- BACKEND.md
|-- FRONTEND.md
`-- MOBILE.md
```

## Local Development

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### Frontend

```bash
cd frontend
npm install
npm start
```

The Vite dev server runs on port `3000`. API calls use `VITE_API_URL` or fall back to `http://backend.test/`.

### Mobile

```bash
cd mobile
npm install
npx expo start
```

The mobile API base URL is currently defined in `mobile/services/api.ts`.

## Seeded Accounts

The backend seeder creates these local users:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@example.com` | `password` |
| Employee | `employee@example.com` | `password` |
| Client | `client@example.com` | `password` |

## Documentation Map

- See `BACKEND.md` for database tables, relationships, controllers, middleware, Sanctum, RBAC, services, and route families.
- See `FRONTEND.md` for dashboard state, routing, CoreUI layout, API consumption, and role-specific screens.
- See `MOBILE.md` for Expo Router navigation, Zustand state, API services, notification handling, and offline-sync status.
