# Technical Report: B2B Project Management SaaS

## 1. Project Overview

### Project title

**B2B Project Management SaaS** / **Application de Gestion des Projets**.

### Purpose of the application

The application is a multi-role project management platform designed to help an organization manage clients, employees, projects, tasks, deadlines, comments, activity tracking, and administrative supervision from a centralized system.

### Problem it solves

The system addresses the difficulty of coordinating project delivery between administrators, employees, and clients. It centralizes project creation, task assignment, deadline tracking, progress monitoring, review workflows, comments, and extension requests. This reduces fragmented communication, improves traceability, and gives each user role a dedicated workspace.

### Target users

- **Admin users**: Manage users, projects, project types, task templates, assignments, requests, activity logs, and dashboard statistics.
- **Employee users**: View assigned projects and tasks, update task status, submit tasks for review, add comments, and request deadline extensions.
- **Client users**: View their own projects, monitor progress, and add comments on their projects.
- **Mobile users**: Use a simplified mobile interface for login, dashboard, projects, and users. The current mobile implementation is mainly admin-oriented.

### Main high-level features

- Token-based authentication using Laravel Sanctum.
- Role-based API access for admin, employee, and client users.
- User management with account setup token support.
- Project CRUD operations.
- Project type and task template management.
- Automatic task creation from project type templates.
- Task assignment and nested subtasks.
- Task status workflow including review and approval/rejection.
- Project progress calculation based on completed tasks.
- Polymorphic comments on projects and tasks.
- Employee deadline extension requests.
- Activity logging.
- Dashboard statistics for each role.
- Experimental AI-based project estimation.
- React admin frontend using CoreUI.
- Expo React Native mobile app skeleton with backend integration.

## 2. Technology Stack

### Backend

- **Framework**: Laravel 11.
- **Language**: PHP 8.3+.
- **Architecture style**: REST API with controllers, Form Requests, Resources, Eloquent models, middleware, and migrations.
- **Authentication**: Laravel Sanctum personal access tokens.

### Frontend

- **Framework**: React 19.
- **Build tool**: Vite 7.
- **Admin template**: CoreUI Free React Admin Template.
- **UI libraries**: `@coreui/react`, `@coreui/icons-react`, CoreUI chart components, Chart.js, lucide-react.
- **HTTP client**: Axios.
- **Routing**: React Router DOM 7.
- **State management**: React Context for authentication, Redux for global UI state, and local component state for forms and filters.
- **Styling**: SCSS, CoreUI styles, Bootstrap-based component classes.

### Mobile application

- **Technology**: Expo with React Native.
- **Navigation**: React Navigation native stack and bottom tabs.
- **Storage**: AsyncStorage for token and user persistence.
- **HTTP client**: Axios with Bearer token interceptor.

### Database

- **Database layer**: Laravel Eloquent ORM and migrations.
- **Configured databases**: Laravel configuration supports SQLite, MySQL, MariaDB, PostgreSQL, and SQL Server.
- **Observed project direction**: The application is intended for a relational database such as MySQL. The migration `2026_05_04_000002_update_project_and_task_statuses_add_ai_estimates.php` includes MySQL-specific enum alteration logic.
- **Important note**: `config/database.php` defaults to SQLite unless the `.env` file sets `DB_CONNECTION=mysql` or another driver.

### API type

- **API style**: REST API.
- **Response format**: JSON.
- **Route grouping**: Public auth routes plus role-prefixed groups: `/api/admin/*`, `/api/employee/*`, and `/api/client/*`.

### Important packages

- Backend: `laravel/framework`, `laravel/sanctum`, `laravel/tinker`, Pest, Laravel Pint, Faker.
- Frontend: React, Vite, Axios, CoreUI, React Router, Redux, Chart.js, Framer Motion, dnd-kit.
- Mobile: Expo, React Native, React Navigation, Axios, AsyncStorage, Expo vector icons.

## 3. System Architecture

### Global architecture

The project follows a three-client architecture:

- **Laravel backend API**: Provides authentication, business logic, database access, validation, and JSON resources.
- **React admin frontend**: Provides the main web dashboard and management interface.
- **React Native mobile app**: Provides a simplified mobile client that consumes the same backend API.

### Frontend-to-backend communication

The React frontend uses a centralized Axios instance located in `coreui/src/api.js`. This client:

- Defines a backend base URL from `VITE_API_URL` or a default local domain.
- Sends `Accept: application/json` and `Content-Type: application/json`.
- Reads the authentication token from browser storage.
- Injects the token as `Authorization: Bearer <token>`.
- Redirects to `/login` when a non-login request receives HTTP 401.

### Mobile-to-backend communication

The mobile app uses `application_de_gestion_des_projets/mobile_app/src/api.js`. It:

- Uses Axios with a static `BASE_URL`.
- Reads `auth_token` from AsyncStorage.
- Adds `Authorization: Bearer <token>` to API requests.
- Calls `/api/login`, `/api/logout`, and currently several admin endpoints.

### API route organization

- **Public authentication**:
  - `POST /api/login`
  - `POST /api/logout`
  - `GET /api/user`
  - `POST /api/setup-password/verify`
  - `POST /api/setup-password`
- **Admin routes**: Protected by `auth:sanctum` and `role:admin`.
- **Employee routes**: Protected by `auth:sanctum` and `role:employee`.
- **Client routes**: Protected by `auth:sanctum` and `role:client`.

### Role-based system

The user role is stored in the `users.global_role` field. Accepted roles are:

- `admin`
- `employee`
- `client`

The middleware `EnsureRole` checks the authenticated user's `global_role` and rejects unauthorized access with HTTP 403.

### Textual architecture explanation

Users authenticate through the Laravel API. After a successful login, the backend creates a Sanctum personal access token and returns it with the user profile. The web frontend stores the token in browser storage, while the mobile app stores it in AsyncStorage. All subsequent requests include the token in the Authorization header. Laravel validates the token with `auth:sanctum`, then applies role middleware to restrict access to admin, employee, or client modules. Controllers validate input through Form Request classes, execute business logic through Eloquent models and services, and return standardized JSON responses.

## 4. Database Design

### Tables defined by migrations

#### `users`

- **Primary key**: `id`.
- **Fields**: `id` big integer, `name` string, `email` string unique, `email_verified_at` timestamp nullable, `password` string nullable, `remember_token` string nullable, `global_role` enum, `phone` string nullable, `avatar` string nullable, `is_active` boolean, `setup_token` string nullable unique, `setup_token_expires_at` timestamp nullable, `created_at`, `updated_at`.
- **Role values**: `admin`, `employee`, `client`.

#### `password_reset_tokens`

- **Primary key**: `email`.
- **Fields**: `email` string, `token` string, `created_at` timestamp nullable.
- **Foreign keys**: None.

#### `sessions`

- **Primary key**: `id`.
- **Fields**: `id` string, `user_id` foreign id nullable indexed, `ip_address` string nullable, `user_agent` text nullable, `payload` long text, `last_activity` integer indexed.
- **Foreign keys**: No explicit foreign key constraint is defined for `user_id`.

#### `cache`

- **Primary key**: `key`.
- **Fields**: `key` string, `value` medium text, `expiration` big integer indexed.

#### `cache_locks`

- **Primary key**: `key`.
- **Fields**: `key` string, `owner` string, `expiration` big integer indexed.

#### `jobs`

- **Primary key**: `id`.
- **Fields**: `id` big integer, `queue` string indexed, `payload` long text, `attempts` unsigned small integer, `reserved_at` unsigned integer nullable, `available_at` unsigned integer, `created_at` unsigned integer.

#### `job_batches`

- **Primary key**: `id`.
- **Fields**: `id` string, `name` string, `total_jobs` integer, `pending_jobs` integer, `failed_jobs` integer, `failed_job_ids` long text, `options` medium text nullable, `cancelled_at` integer nullable, `created_at` integer, `finished_at` integer nullable.

#### `failed_jobs`

- **Primary key**: `id`.
- **Fields**: `id` big integer, `uuid` string unique, `connection` text, `queue` text, `payload` long text, `exception` long text, `failed_at` timestamp.

#### `project_types`

- **Primary key**: `id`.
- **Fields**: `id` big integer, `name` string, `description` text nullable, `created_at`, `updated_at`.

#### `task_templates`

- **Primary key**: `id`.
- **Fields**: `id` big integer, `project_type_id` foreign id, `name` string, `description` text nullable, `default_due_days` unsigned integer, `order` unsigned integer, `is_active` boolean, `created_at`, `updated_at`.
- **Foreign key**: `project_type_id` references `project_types.id` with cascade delete.

#### `projects`

- **Primary key**: `id`.
- **Fields**: `id` big integer, `name` string, `description` text nullable, `client_id` foreign id, `project_type_id` foreign id nullable, `status` enum, `start_date` date nullable, `end_date` date nullable, `progress` unsigned tiny integer, `estimated_days` unsigned integer nullable, `risk_level` string nullable, `ai_comment` text nullable, `created_at`, `updated_at`.
- **Foreign keys**: `client_id` references `users.id` with cascade delete; `project_type_id` references `project_types.id` with null on delete.
- **Status values after update migration**: `pending`, `in_progress`, `ready_for_review`, `completed`, `on_hold`.

#### `project_user`

- **Primary key**: `id`.
- **Fields**: `id` big integer, `project_id` foreign id, `user_id` foreign id, `role` string, `created_at`, `updated_at`.
- **Foreign keys**: `project_id` references `projects.id` with cascade delete; `user_id` references `users.id` with cascade delete.
- **Constraint**: Unique pair `project_id`, `user_id`.
- **Purpose**: Pivot table for project members.

#### `tasks`

- **Primary key**: `id`.
- **Fields**: `id` big integer, `project_id` foreign id, `parent_id` foreign id nullable, `title` string, `description` text nullable, `status` enum, `priority` enum, `due_date` date nullable, `assigned_to` foreign id nullable, `order` unsigned integer, `created_at`, `updated_at`.
- **Foreign keys**: `project_id` references `projects.id` with cascade delete; `parent_id` references `tasks.id` with null on delete; `assigned_to` references `users.id` with null on delete.
- **Status values after update migration**: `pending`, `todo`, `in_progress`, `ready_for_review`, `review`, `completed`, `done`, `blocked`.
- **Priority values**: `low`, `medium`, `high`, `urgent`.

#### `comments`

- **Primary key**: `id`.
- **Fields**: `id` big integer, `commentable_id` big integer, `commentable_type` string, `user_id` foreign id, `content` text, `created_at`, `updated_at`.
- **Foreign key**: `user_id` references `users.id` with cascade delete.
- **Relationship type**: Polymorphic. Comments can be attached to projects or tasks.

#### `activity_logs`

- **Primary key**: `id`.
- **Fields**: `id` big integer, `user_id` foreign id nullable, `action` string, `description` string nullable, `loggable_id` big integer, `loggable_type` string, `properties` JSON nullable, `created_at`, `updated_at`.
- **Foreign key**: `user_id` references `users.id` with null on delete.
- **Relationship type**: Polymorphic. Logs can be attached to projects, tasks, users, requests, and other models.

#### `personal_access_tokens`

- **Primary key**: `id`.
- **Fields**: `id` big integer, `tokenable_id` big integer, `tokenable_type` string, `name` text, `token` string unique, `abilities` text nullable, `last_used_at` timestamp nullable, `expires_at` timestamp nullable indexed, `created_at`, `updated_at`.
- **Purpose**: Laravel Sanctum token storage.

#### `requests`

- **Primary key**: `id`.
- **Fields**: `id` big integer, `user_id` foreign id, `requestable_id` big integer, `requestable_type` string, `type` string, `payload` JSON, `status` enum, `handled_by` foreign id nullable, `handled_at` timestamp nullable, `created_at`, `updated_at`.
- **Foreign keys**: `user_id` references `users.id` with cascade delete; `handled_by` references `users.id` with null on delete.
- **Relationship type**: Polymorphic. Requests can target projects or tasks.
- **Status values**: `pending`, `approved`, `rejected`.
- **Index**: Composite index on `type`, `status`.

### Important database relationships

- A user with role `client` owns many projects through `projects.client_id`.
- A project belongs to one client and optionally one project type.
- A project type has many task templates.
- A project has many tasks.
- A task belongs to one project and may have a parent task.
- A task may have many subtasks.
- A task may be assigned to one user.
- A project has many members through `project_user`.
- A project and a task can both have comments through a polymorphic relationship.
- A project and a task can both have extension requests through a polymorphic relationship.
- Activity logs use a polymorphic relationship to record operations on multiple entity types.

### Missing or inconsistent database elements

- The `Notification` model is used by controllers, but no `notifications` table migration exists in the inspected migrations.
- The `ClientAccessToken` model and `Client\TokenAccessController` reference client access tokens, but no `client_access_tokens` table migration exists.
- `ProjectMember` model uses `member_id`, while the real pivot table is `project_user` with `user_id`. The application mainly uses the many-to-many relationship on `Project`, so this model appears inconsistent or unused.

## 5. Backend Implementation (Laravel)

### Main modules

- **Authentication**: login, logout, authenticated user retrieval, password setup.
- **Users**: admin user CRUD, roles, activation, setup email.
- **Projects**: CRUD, project type association, client association, member assignment, AI estimation.
- **Project types**: CRUD for reusable project categories.
- **Task templates**: templates used to auto-generate project tasks.
- **Tasks**: CRUD, hierarchy, assignment, status updates, review workflow.
- **Comments**: project and task comments.
- **Extension requests**: employee deadline extension requests and admin handling.
- **Dashboards**: role-specific statistics.
- **Activity logs**: traceability for important actions.

### Controllers and roles

- `AuthController`: Handles login, logout, and authenticated user profile.
- `Auth\SetupPasswordController`: Verifies setup token and creates the initial password.
- `Admin\UserController`: Manages user creation, update, deletion, and welcome email with setup token.
- `Admin\ProjectController`: Manages projects, member assignment/removal, automatic task generation, and AI estimation.
- `Admin\TaskController`: Manages tasks, subtasks, task assignment, review approval, and rejection.
- `Admin\ProjectTypeController`: Manages project types.
- `Admin\TaskTemplateController`: Manages task templates, active/inactive template assignment, and deletion.
- `Admin\RequestController`: Approves or rejects employee extension requests.
- `Admin\DashboardController`: Returns admin dashboard metrics, recent activity, and upcoming deadlines.
- `Admin\ActivityLogController`: Returns paginated activity logs.
- `Employee\DashboardController`: Returns employee-specific task and project metrics.
- `Employee\ProjectController`: Returns projects assigned to the employee.
- `Employee\TaskController`: Returns assigned tasks and allows status updates.
- `Employee\RequestController`: Creates deadline extension requests.
- `Employee\CommentController`: Allows employees to comment on assigned tasks and projects.
- `Client\DashboardController`: Returns client-specific project metrics.
- `Client\ProjectController`: Allows clients to view and comment on their own projects.
- `Client\TokenAccessController`: Intended to generate and validate shareable project access links, but its routes and migration are not present in the inspected API setup.

### Key API endpoints

#### Authentication

- `POST /api/login`
- `POST /api/logout`
- `GET /api/user`
- `POST /api/setup-password/verify`
- `POST /api/setup-password`

#### Admin

- `GET /api/admin/dashboard`
- `GET /api/admin/activity-logs`
- `GET /api/admin/requests`
- `PATCH /api/admin/requests/{id}/approve`
- `PATCH /api/admin/requests/{id}/reject`
- `GET|POST /api/admin/users`
- `GET|PUT|PATCH|DELETE /api/admin/users/{user}`
- `GET|POST /api/admin/projects`
- `GET|PUT|PATCH|DELETE /api/admin/projects/{project}`
- `POST /api/admin/projects/{project}/estimate`
- `POST /api/admin/projects/{project}/assignEmployee`
- `DELETE /api/admin/projects/{project}/members`
- `GET|POST /api/admin/tasks`
- `GET|PUT|PATCH|DELETE /api/admin/tasks/{task}`
- `PATCH /api/admin/tasks/{task}/approve`
- `PATCH /api/admin/tasks/{task}/reject`
- `PATCH /api/admin/tasks/{task}/assignEmployee`
- `PATCH /api/admin/tasks/{task}/unassignEmployee`
- `GET|POST /api/admin/project-types`
- `GET|PUT|PATCH|DELETE /api/admin/project-types/{projectType}`
- `GET /api/admin/task-templates/all`
- `GET|POST /api/admin/task-templates`
- Nested task template routes under `/api/admin/project-types/{projectType}/task-templates`

#### Employee

- `GET /api/employee/dashboard`
- `GET /api/employee/projects`
- `GET /api/employee/projects/{project}`
- `GET /api/employee/tasks`
- `PATCH /api/employee/tasks/{task}/status`
- `PATCH /api/employee/tasks/{task}/mark-ready`
- `POST /api/employee/tasks/{task}/comments`
- `POST /api/employee/projects/{project}/comments`
- `POST /api/employee/requests`

#### Client

- `GET /api/client/dashboard`
- `GET /api/client/projects`
- `GET /api/client/projects/{project}`
- `POST /api/client/projects/{project}/comments`

### Business logic

#### Project management

- Admins create, update, view, and delete projects.
- A project belongs to a client and may belong to a project type.
- When a project is created with a project type, task templates for that project type are converted into actual project tasks.
- Project progress is recalculated by counting completed tasks.
- Employees can be assigned to a project through the `project_user` pivot table.

#### Task management

- Tasks belong to projects.
- Tasks support parent-child hierarchy for subtasks.
- Subtasks inherit the parent task's project and assignee during creation.
- A task can be assigned or unassigned by an admin.
- Employees can update their own assigned task statuses.
- Employees can mark a task as `ready_for_review`.
- Admins can approve reviewed tasks, which changes the task status to `completed`.
- Admins can reject reviewed tasks, which returns the task to `in_progress` and creates a feedback comment.

#### Role management

- The system uses a simple role field: `global_role`.
- Role authorization is enforced through route middleware.
- The code contains checks for `syncRoles`, but the Spatie permission package is not present in `composer.json`; therefore, role management is currently implemented primarily through `global_role`.

#### Validation logic

- Laravel Form Request classes validate user, project, task, project type, task template, login, password setup, comments, assignment, review, and extension request inputs.
- Examples include email uniqueness, role constraints, task status constraints, date validation, priority constraints, and existence checks for foreign keys.

#### Advanced logic

- **Automatic progress refresh**: The `Task` model refreshes project progress after task save/delete.
- **Extension requests**: Employees can request a new deadline for a project or task; admins approve or reject it.
- **Activity logging**: Key operations are recorded in `activity_logs`.
- **AI estimation**: An OpenAI-compatible service estimates `estimated_days`, `risk_level`, and `ai_comment` for a project.

## 6. Frontend (React Admin)

### Pages implemented

- Login page.
- Password setup page.
- Role-aware dashboard.
- Admin user management.
- Admin request management page.
- Admin project management page.
- Admin project details.
- Admin task management.
- Admin project types page.
- Admin task templates page.
- Employee task dashboard.
- Workspace calendar.
- Workspace activity log.
- Settings page.
- Standard CoreUI example pages still exist in the project.

### Features available

- Authentication through the backend API.
- Token persistence in browser storage.
- Role-aware dashboard rendering.
- Dynamic navigation by role.
- User CRUD interface.
- Project CRUD and project detail views.
- Project type and task template management.
- Task assignment and status update screens.
- Activity log display.
- Request management UI.
- Employee task list and detail workflow.

### State management approach

- **React Context**: Authentication state and login/logout operations.
- **Redux**: Global UI state such as sidebar visibility and theme state.
- **Local state**: Forms, filters, loading states, modal states, and local UI interactions.
- **Local/session storage**: Token and user session recovery.

### API integration method

The frontend uses a centralized Axios client. It automatically attaches a Bearer token and handles unauthorized responses.

### UI framework/template used

The frontend is based on **CoreUI Free React Admin Template**, with CoreUI React components, CoreUI icons, SCSS styling, charts, and dashboard cards.

### What is not yet finished or inconsistent

- Several sidebar links do not have matching registered React routes, including `/admin/tasks`, `/admin/task-assignments`, `/admin/clients`, `/admin/employees`, `/admin/analytics`, `/employee/projects`, `/employee/comments`, `/client/projects`, `/client/progress`, `/client/comments`, and `/client/documents`.
- Several frontend API calls do not match the current backend route prefixes:
  - Some request components call `/api/requests`, but backend request routes are under `/api/admin/requests` and `/api/employee/requests`.
  - Some task review components call `/api/tasks/...`, but backend task review routes are under `/api/admin/tasks/...` or `/api/employee/tasks/...`.
  - `AiEstimationCard` calls an estimation recalculation URL that does not match the backend route `POST /api/admin/projects/{project}/estimate`.
  - Some employee task detail logic expects `GET /api/employee/tasks/{id}`, but only `GET /api/employee/tasks` is defined in `routes/api.php`.
- Some dashboard components use fields that do not perfectly match backend response fields.
- Some older/static CoreUI sample components remain in the source tree and are not part of the final application.

## 7. Employee and Client Interfaces

### Employee interface implemented

- Employee dashboard endpoint and dashboard UI.
- Assigned projects API.
- Assigned tasks API.
- Task status update.
- Mark task ready for review.
- Add task comments.
- Add project comments.
- Submit deadline extension requests.

### Employee interface partially implemented

- Employee navigation includes project and comment sections, but not all corresponding React pages are registered.
- Employee task detail frontend expects an endpoint that is not currently defined.

### Employee interface missing

- Complete employee project pages in the React route configuration.
- Dedicated employee comments page.
- Full notification interface.
- Complete extension request history for employees.

### Client interface implemented

- Client dashboard endpoint.
- Client project list endpoint.
- Client project details endpoint.
- Client project comments endpoint.
- Role-specific client dashboard component.

### Client interface partially implemented

- Client navigation exists, but most client-specific pages are not registered in React routes.
- Client dashboard displays project progress summary, but detailed client project workspace is incomplete.

### Client interface missing

- Dedicated client project list page in React route configuration.
- Client progress page.
- Client comments page.
- Client documents page.
- Shareable client access flow is present as a controller/model idea but lacks routes and database migration.

## 8. Mobile Application

### Technology used

The mobile application is built with **Expo React Native**. It uses React Navigation for navigation, AsyncStorage for token persistence, Axios for API calls, and Expo vector icons for UI icons.

### Features implemented

- Login screen.
- Authentication context.
- Token and user persistence in AsyncStorage.
- Authenticated stack/tab navigation.
- Dashboard tab.
- Projects tab.
- Users tab.
- Pull-to-refresh and loading states.
- Basic project filtering and search.
- Basic user search.

### Backend connection

The mobile app sends API requests to a configured `BASE_URL` and includes the Sanctum token as a Bearer token.

### What is incomplete

- The mobile app currently calls admin endpoints such as `/api/admin/projects` and `/api/admin/users`; it is therefore not fully role-aware.
- The mobile authentication response parsing expects `token` and `user` directly on `response.data`, while the Laravel `AuthController` returns them inside `data`. This may break login unless adjusted.
- The mobile app does not currently implement employee-specific task actions, client project views, comments, request handling, or notification screens.
- The mobile base URL is hard-coded and must be changed for real device testing or production deployment.
- No mobile build/deployment configuration beyond standard Expo scripts is documented.

## 9. Current Project Status

### Completed features

- Laravel backend API structure.
- Sanctum authentication.
- Role middleware.
- User CRUD.
- Project CRUD.
- Project type CRUD.
- Task template CRUD.
- Automatic task generation from templates.
- Task CRUD and subtasks.
- Task assignment.
- Employee task status updates.
- Task review approval/rejection.
- Comments on projects and tasks.
- Employee extension requests.
- Admin extension request approval/rejection.
- Activity logging.
- Role-aware React dashboard.
- Core admin management screens.
- Expo mobile app foundation.

### Features in progress

- Mobile app integration.
- Client-facing React workspace.
- Employee project/comment pages.
- Notification system.
- Shareable client project access.
- AI project estimation frontend/backend alignment.

### Missing features

- Notifications database migration.
- Client access token database migration and API routes.
- Complete client frontend pages.
- Complete employee frontend pages beyond tasks/dashboard.
- Consistent frontend/backend endpoint mapping.
- Comprehensive automated tests.
- Production deployment documentation.
- File/document management despite documents appearing in client navigation.

### Known limitations

- Dashboard code uses `active` as a project status in places, while the database status enum uses `pending`, `in_progress`, `ready_for_review`, `completed`, and `on_hold`.
- Some resources and UI components expect field names that do not match the database schema exactly.
- Several frontend routes are visible in navigation but not registered.
- The backend has minimal policy-based authorization; authorization is mostly route role checks plus manual controller checks.
- The OpenAI estimation feature requires `OPENAI_API_KEY` and matching service configuration.

## 10. Technical Choices Justification

### Laravel

Laravel is appropriate because it provides a structured MVC architecture, routing, middleware, Eloquent ORM, migrations, validation, authentication integration, queue support, and clear conventions. These features reduce development complexity for a role-based business application.

### React

React is suitable for the admin interface because it supports reusable components, dynamic dashboards, client-side routing, stateful forms, and scalable UI composition. It also integrates well with admin templates such as CoreUI.

### MySQL / relational database

A relational database is justified because the application has structured entities and strong relationships: users, projects, tasks, comments, requests, and activity logs. Foreign keys and relational joins are appropriate for maintaining consistency across project management data.

### REST API

REST is suitable because the system exposes clear resources such as users, projects, tasks, project types, task templates, comments, and requests. It also allows multiple clients, including web and mobile, to consume the same backend.

### Laravel Sanctum

Sanctum is appropriate for SPA and mobile token authentication. It provides personal access tokens, integrates directly with Laravel authentication, and is simpler than a full OAuth2 server for this type of project.

### CoreUI

CoreUI accelerates admin dashboard development by providing ready-made layout, navigation, forms, cards, modals, icons, and chart components. This is suitable for a management platform where consistency and speed are important.

### Expo React Native

Expo simplifies mobile development by providing a managed React Native environment, fast testing, cross-platform support, and easier access to common native features.

## 11. Security and Performance

### Authentication

- Login validates email and password.
- Laravel Sanctum creates personal access tokens.
- Logout deletes the current token.
- Frontend and mobile clients use Bearer token authentication.

### Role-based access control

- Routes are protected by `auth:sanctum`.
- Admin, employee, and client routes are separated by role prefixes.
- `EnsureRole` blocks users whose `global_role` is not authorized.
- Controllers also perform ownership checks for employee and client access.

### Data validation

- Form Request classes validate incoming data.
- Validation includes required fields, email format, unique email, foreign key existence, allowed statuses, allowed priorities, valid dates, and string length constraints.

### API protection

- Protected endpoints require a valid Sanctum token.
- Role-scoped routes restrict access by user type.
- Client endpoints verify project ownership.
- Employee endpoints verify task assignment or project membership.

### Security gaps

- Some frontend/mobile endpoints call admin routes directly, so client-side role separation needs review.
- Notification and share-token features are incomplete at the database level.
- There is no evidence of fine-grained Laravel Policies or Gates.
- Token expiration is not configured; Sanctum expiration is `null`.
- The mobile base URL is hard-coded.
- The OpenAI API key must be protected through environment variables and never committed.

### Performance considerations

- Backend queries use eager loading in many places to reduce N+1 query problems.
- Pagination is used for users, projects, tasks, task templates, requests, and activity logs.
- React routes are lazy-loaded for better frontend performance.
- Project progress is recalculated automatically on task save/delete; this is simple but may become expensive for very large projects.
- Dashboard statistics are calculated directly from database queries and may need caching for production-scale usage.

## 12. Technical Conclusion

### Strengths

- Clear separation between backend, web frontend, and mobile client.
- Well-organized Laravel route groups by role.
- Strong use of Eloquent relationships.
- Good use of Form Requests for validation.
- Useful business workflows: project creation, task assignment, progress tracking, comments, review, and extension requests.
- CoreUI provides a professional admin interface foundation.
- Mobile app foundation already exists and uses the same REST API concept.

### Weaknesses and incomplete parts

- Some frontend API calls do not match backend routes.
- Several navigation links lead to pages that are not registered.
- Notification and client access token models are present without migrations.
- Mobile app is not yet fully role-aware.
- Some dashboard logic references status values that are not part of the current database enum.
- Automated testing is minimal and mostly limited to default example tests.

### Future improvements

- Align every frontend and mobile API call with the Laravel route file.
- Add missing migrations for notifications and client access tokens or remove unused code.
- Complete employee and client web interfaces.
- Implement a full notification UI.
- Add Laravel Policies for fine-grained authorization.
- Add feature tests for authentication, role access, project CRUD, task workflow, comments, and extension requests.
- Add production deployment documentation.
- Add file/document management if the client documents module is required.
- Add caching or precomputed metrics for dashboards when the dataset grows.
- Improve mobile app role handling so admin, employee, and client users receive different screens.

