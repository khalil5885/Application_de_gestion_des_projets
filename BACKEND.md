# Backend Architecture

The backend is a Laravel 11 REST API running on PHP 8.3. It is the system of record for authentication, RBAC, project/task data, comments, requests, notifications, activity logs, and AI estimation.

## Stack

| Technology | Role |
| --- | --- |
| PHP `^8.3` | Runtime |
| Laravel `^11.0` | Application framework, routing, middleware, validation, Eloquent ORM |
| Laravel Sanctum `^4.0` | Personal access token authentication |
| Eloquent | Database models and relationships |
| Laravel HTTP client | Groq/OpenAI-compatible AI estimation request |
| Pest/PHPUnit | Test framework scaffold |

Important entry points:

- `backend/routes/api.php`
- `backend/bootstrap/app.php`
- `backend/app/Http/Middleware/EnsureRole.php`
- `backend/app/Models`
- `backend/database/migrations`
- `backend/app/Services`

## Request And Response Architecture

API routes are grouped by authentication and role:

| Route group | Middleware | Purpose |
| --- | --- | --- |
| Public auth | none | Login and setup-password flow |
| Notifications | `auth:sanctum` | Authenticated notification inbox operations |
| Admin | `auth:sanctum`, `role:admin` | Full management surface |
| Employee | `auth:sanctum`, `role:employee` | Assigned work, workspace, requests |
| Client | `auth:sanctum`, `role:client` | Read-oriented project and activity access |

`bootstrap/app.php` registers the `role` middleware alias and normalizes API errors for validation, unauthenticated requests, missing models, and HTTP exceptions. Application controllers use a consistent JSON shape:

```json
{
  "status": "success",
  "message": "Human-readable result.",
  "data": {}
}
```

## Authentication

`AuthController` handles login, logout, and authenticated user retrieval.

| Endpoint | Behavior |
| --- | --- |
| `POST /api/login` | Validates credentials, rejects inactive users, creates Sanctum token, returns token and user |
| `POST /api/logout` | Deletes the current access token |
| `GET /api/user` | Returns the authenticated user resource |
| `POST /api/setup-password/verify` | Verifies invitation/setup token |
| `POST /api/setup-password` | Sets password for invited user |

Sanctum stores tokens in `personal_access_tokens` using Laravel's polymorphic `tokenable` design.

## RBAC Implementation

The platform uses a simple global-role model instead of package-managed permissions. The `users.global_role` enum contains `admin`, `employee`, and `client`.

`EnsureRole` checks the authenticated user's `global_role` against the allowed roles passed to the route middleware. Unauthorized role access returns HTTP `403`.

```text
auth:sanctum -> user resolved from bearer token
role:admin   -> users.global_role must equal admin
role:employee -> users.global_role must equal employee
role:client  -> users.global_role must equal client
```

## Database Design

### `users`

| Field | Type | Constraints / notes |
| --- | --- | --- |
| `id` | bigint | Primary key |
| `name` | string | Required |
| `email` | string | Required, unique |
| `email_verified_at` | timestamp | Nullable |
| `password` | string | Nullable, cast as hashed |
| `remember_token` | string | Nullable Laravel remember token |
| `global_role` | enum | `admin`, `employee`, `client`; default `employee` |
| `phone` | string | Nullable |
| `avatar` | string | Nullable |
| `is_active` | boolean | Default `true` |
| `setup_token` | string | Nullable, unique |
| `setup_token_expires_at` | timestamp | Nullable |
| `created_at`, `updated_at` | timestamps | Laravel timestamps |

### `password_reset_tokens`

| Field | Type | Constraints / notes |
| --- | --- | --- |
| `email` | string | Primary key |
| `token` | string | Required |
| `created_at` | timestamp | Nullable |

### `sessions`

| Field | Type | Constraints / notes |
| --- | --- | --- |
| `id` | string | Primary key |
| `user_id` | foreign id | Nullable, indexed |
| `ip_address` | string(45) | Nullable |
| `user_agent` | text | Nullable |
| `payload` | long text | Required |
| `last_activity` | integer | Indexed |

### `cache` And `cache_locks`

| Table | Fields |
| --- | --- |
| `cache` | `key` primary string, `value` medium text, `expiration` indexed bigint |
| `cache_locks` | `key` primary string, `owner` string, `expiration` indexed bigint |

### Queue Tables

| Table | Fields |
| --- | --- |
| `jobs` | `id`, indexed `queue`, `payload`, `attempts`, `reserved_at`, `available_at`, `created_at` |
| `job_batches` | `id`, `name`, total/pending/failed counts, failed IDs, options, cancel/created/finished timestamps |
| `failed_jobs` | `id`, unique `uuid`, `connection`, `queue`, `payload`, `exception`, `failed_at` |

### `project_types`

| Field | Type | Constraints / notes |
| --- | --- | --- |
| `id` | bigint | Primary key |
| `name` | string | Required |
| `description` | text | Nullable |
| `created_at`, `updated_at` | timestamps | Laravel timestamps |

### `task_templates`

| Field | Type | Constraints / notes |
| --- | --- | --- |
| `id` | bigint | Primary key |
| `project_type_id` | foreign id | References `project_types.id`, cascade delete |
| `name` | string | Required |
| `description` | text | Nullable |
| `default_due_days` | unsigned integer | Default `0` |
| `order` | unsigned integer | Default `0` |
| `is_active` | boolean | Default `true` |
| `created_at`, `updated_at` | timestamps | Laravel timestamps |

### `projects`

| Field | Type | Constraints / notes |
| --- | --- | --- |
| `id` | bigint | Primary key |
| `name` | string | Required |
| `description` | text | Nullable |
| `client_id` | foreign id | References `users.id`, cascade delete |
| `project_type_id` | foreign id | Nullable, references `project_types.id`, null on delete |
| `status` | enum | `todo`, `in_progress`, `ready_for_review`, `done`, `on_hold`; default `todo` |
| `start_date` | date | Nullable |
| `end_date` | date | Nullable |
| `progress` | unsigned tiny integer | Default `0` |
| `estimated_days` | unsigned integer | Nullable, AI/local estimate |
| `risk_level` | string | Nullable, expected `low`, `medium`, or `high` |
| `ai_comment` | text | Nullable |
| `created_at`, `updated_at` | timestamps | Laravel timestamps |

### `project_user`

| Field | Type | Constraints / notes |
| --- | --- | --- |
| `id` | bigint | Primary key |
| `project_id` | foreign id | References `projects.id`, cascade delete |
| `user_id` | foreign id | References `users.id`, cascade delete |
| `role` | string | Default `member` |
| `created_at`, `updated_at` | timestamps | Pivot timestamps |
| unique | composite | Unique `project_id`, `user_id` |

### `tasks`

| Field | Type | Constraints / notes |
| --- | --- | --- |
| `id` | bigint | Primary key |
| `project_id` | foreign id | References `projects.id`, cascade delete |
| `parent_id` | foreign id | Nullable self-reference to `tasks.id`, cascade delete |
| `title` | string | Required |
| `description` | text | Nullable |
| `status` | string / enum on MySQL | Default `todo`; expected `todo`, `in_progress`, `ready_for_review`, `done`, `on_hold` |
| `priority` | string | Default `medium` |
| `order` | integer | Default `0` |
| `progress` | integer | Default `0` |
| `due_date` | date | Nullable |
| `assigned_to` | foreign id | Nullable, references `users.id` |
| `created_at`, `updated_at` | timestamps | Laravel timestamps |

### `comments`

| Field | Type | Constraints / notes |
| --- | --- | --- |
| `id` | bigint | Primary key |
| `commentable_id`, `commentable_type` | morphs | Polymorphic target, indexed |
| `user_id` | foreign id | References `users.id`, cascade delete |
| `content` | text | Required |
| `visibility` | enum | `public`, `internal`, `private`; default `internal` |
| `created_at`, `updated_at` | timestamps | Laravel timestamps |

### `comment_attachments`

| Field | Type | Constraints / notes |
| --- | --- | --- |
| `id` | bigint | Primary key |
| `comment_id` | foreign id | References `comments.id`, cascade delete |
| `file_path` | string | Storage path |
| `file_name` | string | Original file name |
| `mime_type` | string | MIME type |
| `file_size` | unsigned big integer | Bytes |
| `created_at`, `updated_at` | timestamps | Laravel timestamps |

### `activity_logs`

| Field | Type | Constraints / notes |
| --- | --- | --- |
| `id` | bigint | Primary key |
| `user_id` | foreign id | Nullable, references `users.id`, null on delete |
| `action` | string | Required |
| `description` | string | Nullable |
| `loggable_id`, `loggable_type` | morphs | Polymorphic target, indexed |
| `properties` | json | Nullable |
| `visibility` | enum | `internal`, `client`; default `internal` |
| `created_at`, `updated_at` | timestamps | Laravel timestamps |

### `personal_access_tokens`

| Field | Type | Constraints / notes |
| --- | --- | --- |
| `id` | bigint | Primary key |
| `tokenable_id`, `tokenable_type` | morphs | Sanctum token owner |
| `name` | text | Token name |
| `token` | string(64) | Unique hashed token |
| `abilities` | text | Nullable |
| `last_used_at` | timestamp | Nullable |
| `expires_at` | timestamp | Nullable, indexed |
| `created_at`, `updated_at` | timestamps | Laravel timestamps |

### `requests`

| Field | Type | Constraints / notes |
| --- | --- | --- |
| `id` | bigint | Primary key |
| `user_id` | foreign id | Requesting user, cascade delete |
| `requestable_id`, `requestable_type` | morphs | Polymorphic target |
| `type` | string | Examples: `extension`, `task_review`, `project_review` |
| `payload` | json | Request-specific data |
| `status` | enum | `pending`, `approved`, `rejected`; default `pending` |
| `handled_by` | foreign id | Nullable admin user, null on delete |
| `handled_at` | timestamp | Nullable |
| `created_at`, `updated_at` | timestamps | Laravel timestamps |
| index | composite | `type`, `status` |

### `notifications`

| Field | Type | Constraints / notes |
| --- | --- | --- |
| `id` | bigint | Primary key |
| `user_id` | foreign id | References `users.id`, cascade delete |
| `type` | string | Notification type |
| `data` | json | Payload |
| `read_at` | timestamp | Nullable |
| `created_at`, `updated_at` | timestamps | Laravel timestamps |

## Entity Relationships

| Entity | Relationship |
| --- | --- |
| `User` -> `Project` | One client owns many projects through `projects.client_id` |
| `User` <-> `Project` | Many-to-many membership through `project_user` |
| `User` -> `Task` | One employee can have many assigned tasks through `tasks.assigned_to` |
| `User` -> `Comment` | One user writes many comments |
| `User` -> `ActivityLog` | One user can create many logs |
| `User` -> `Notification` | One user receives many notifications |
| `User` -> `Request` | One user creates many requests; one user can handle many requests through `handled_by` |
| `ProjectType` -> `TaskTemplate` | One project type has many ordered task templates |
| `ProjectType` -> `Project` | One project type can classify many projects |
| `Project` -> `Task` | One project has many tasks |
| `Project` -> `Task` | One project has many root tasks where `parent_id` is null |
| `Task` -> `Task` | Self-referential parent/children hierarchy |
| `Project` -> `Comment` | Polymorphic one-to-many comments |
| `Task` -> `Comment` | Polymorphic one-to-many comments |
| `Project` -> `Request` | Polymorphic one-to-many requests |
| `Task` -> `Request` | Polymorphic one-to-many requests |
| `Comment` -> `CommentAttachment` | One comment has many attachments |
| `ActivityLog` -> loggable | Polymorphic log target |
| `PersonalAccessToken` -> tokenable | Polymorphic Sanctum token owner |

## API Route Families

### Public/Auth

| Method | Path |
| --- | --- |
| `POST` | `/api/login` |
| `POST` | `/api/logout` |
| `GET` | `/api/user` |
| `POST` | `/api/setup-password/verify` |
| `POST` | `/api/setup-password` |

### Notifications

| Method | Path |
| --- | --- |
| `GET` | `/api/notifications` |
| `GET` | `/api/notifications/unread-count` |
| `PATCH` | `/api/notifications/read-all` |
| `PATCH` | `/api/notifications/{id}/read` |
| `DELETE` | `/api/notifications/{id}` |
| `DELETE` | `/api/notifications` |

### Admin

Admin APIs include dashboards, activity logs, workload, request handling, user CRUD, project CRUD, AI estimates, project membership, task CRUD, task review approval/rejection, project types, and task templates.

Representative paths:

- `/api/admin/dashboard`
- `/api/admin/activity-logs`
- `/api/admin/workload`
- `/api/admin/users`
- `/api/admin/projects`
- `/api/admin/projects/{project}/estimate`
- `/api/admin/tasks`
- `/api/admin/tasks/{task}/approve`
- `/api/admin/tasks/{task}/reject`
- `/api/admin/tasks-overview`
- `/api/admin/project-types`
- `/api/admin/task-templates`
- `/api/admin/requests/{id}/approve`
- `/api/admin/requests/{id}/reject`

### Employee

Employee APIs include dashboard metrics, calendar/activity/productivity workspace data, assigned projects, assigned tasks, status updates, ready-for-review submission, task ordering suggestions, comments, and request creation.

Representative paths:

- `/api/employee/dashboard`
- `/api/employee/workspace/calendar`
- `/api/employee/workspace/activity`
- `/api/employee/workspace/productivity`
- `/api/employee/projects`
- `/api/employee/tasks`
- `/api/employee/tasks/{task}/status`
- `/api/employee/tasks/{task}/mark-ready`
- `/api/employee/tasks/suggest-order`
- `/api/employee/requests`

### Client

Client APIs provide activity, dashboard, project listing/detail, and project comments.

Representative paths:

- `/api/client/dashboard`
- `/api/client/activity`
- `/api/client/projects`
- `/api/client/projects/{project}`
- `/api/client/projects/{project}/comments`

## Domain Services

### `AiEstimationService`

Loads project tasks and attempts an AI estimation through `https://api.groq.com/openai/v1/chat/completions` with model `llama-3.3-70b-versatile`. The expected response schema is:

```json
{
  "estimated_days": 10,
  "risk_level": "medium",
  "ai_comment": "Comment text"
}
```

If the external AI call fails or returns invalid data, the service falls back to a local heuristic based on task count, high-priority task ratio, and overdue tasks.

### `NotificationService`

Creates notification rows for users or user IDs, with optional role filtering. Convenience methods target employees, admins, staff, or clients.

## Seed Data

`DatabaseSeeder` creates:

- Admin, employee, and client users
- One `Website Redesign` project type
- Two task templates
- One sample project, `Acme Portal`
- Two project tasks
- Project membership linking employee to project
- Sample project and task comments
- One activity log entry

Seeded local credentials:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@example.com` | `password` |
| Employee | `employee@example.com` | `password` |
| Client | `client@example.com` | `password` |
