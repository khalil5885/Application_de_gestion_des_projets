# Frontend Dashboard Architecture

The web dashboard in `frontend/` is a React 19 single-page application built with Vite and CoreUI. It consumes the Laravel API over JSON, uses Sanctum bearer tokens for authentication, and presents role-specific experiences for admins, employees, and clients.

## Stack

| Technology | Version / package | Purpose |
| --- | --- | --- |
| React | `^19.2.3` | Component model |
| React DOM | `^19.2.3` | Browser rendering |
| Vite | `^7.3.0` | Dev server and production build |
| React Router DOM | `^7.11.0` | Hash-router SPA navigation |
| CoreUI React | `^5.9.2` | Dashboard layout and UI components |
| CoreUI / Bootstrap | `^5.5.0` | Styling system |
| Redux | `5.0.1` | Global UI state such as theme/sidebar |
| React Context | local | Auth and notification state |
| Axios | `^1.13.6` | HTTP client with auth interceptors |
| Chart.js / CoreUI Chart.js | `^4.5.1` / `^4.1.0` | Dashboard charts |
| dnd-kit | `@dnd-kit/*` | Drag/drop task and board interactions |
| Framer Motion / Motion | `^12.38.0` | UI motion |
| Lucide React | `^1.8.0` | Iconography in custom feature surfaces |

## Application Layout

```text
src/
|-- App.js                         Root router and theme initialization
|-- api.js                         Axios client and auth interceptors
|-- routes.js                      Lazy route registry and role wrappers
|-- store.js                       Redux UI store
|-- context/
|   |-- AuthContext.jsx            Login/logout/user state
|   `-- NotificationsContext.jsx   Notification state access
|-- layout/DefaultLayout.js        Authenticated shell
|-- components/
|   |-- ProtectedRoute.jsx         Auth gate
|   |-- RoleGuard.jsx              Role renderer
|   |-- AppHeader/AppSidebar/...   CoreUI shell components
|   |-- project/                   Project UI components
|   |-- task/                      Task UI components
|   |-- request/                   Request UI components
|   |-- user/                      User management components
|   `-- workload/                  Workload charts/cards/tables
`-- views/
    |-- admin/
    |-- client/
    |-- dashboard/
    |-- employee/
    |-- pages/
    `-- workspace/
```

The first viewport after authentication is the dashboard, not a marketing page. The application shell is `DefaultLayout`, composed of `AppSidebar`, `AppHeader`, `AppContent`, and `AppFooter`.

## Routing

`App.js` uses `HashRouter`, which makes the app deployable to static hosts without server-side rewrite rules.

Top-level routes:

| Path | Access |
| --- | --- |
| `/login` | Public |
| `/register` | Public/scaffold |
| `/setup-password` | Public invitation flow |
| `/404`, `/500` | Public error pages |
| `*` | Wrapped in `ProtectedRoute` and rendered through `DefaultLayout` |

Feature routes are defined in `src/routes.js` and lazy-loaded with `React.lazy`. Role-specific entries are wrapped by `withRoles(Component, allowedRoles)`, which reads the authenticated user from `AuthContext` or browser storage and renders through `RoleGuard`.

### Admin Routes

| Path | Feature |
| --- | --- |
| `/admin/users` | User management |
| `/admin/requests` | Request approval/rejection |
| `/admin/workload` | Team workload overview |
| `/admin/workload/:employeeId` | Employee workload detail |
| `/admin/projects` | Project management |
| `/admin/projects/:id` | Project detail |
| `/admin/projects/:id/tasks` | Project task management |
| `/admin/project-types` | Project type management |
| `/admin/task-templates` | Task template management |
| `/admin/tasks` | Global task overview |

### Employee Routes

| Path | Feature |
| --- | --- |
| `/employee/tasks` | Employee task dashboard |
| `/workspace/calendar` | Calendar workspace |
| `/workspace/activity` | Activity workspace |

### Client Routes

| Path | Feature |
| --- | --- |
| `/client/dashboard` | Client dashboard |
| `/client/projects` | Read-oriented project list |
| `/client/projects/:id` | Client project detail |
| `/client/timeline` | Client timeline |

Shared notifications are exposed at `/notifications` for all three roles.

## Authentication Flow

`AuthContext` owns the browser auth state:

1. On mount, it reads `token` and `user` from `localStorage`, falling back to `sessionStorage` where needed.
2. `login(email, password)` posts to `/api/login`.
3. The returned Sanctum token is stored as `token`; the returned user resource is stored as `user`.
4. Axios receives `Authorization: Bearer <token>`.
5. `ProtectedRoute` blocks authenticated layout rendering until initialization finishes.
6. If Axios receives a non-login `401`, it clears auth storage and redirects to `/login`.
7. `logout()` posts to `/api/logout`, clears auth storage, removes the Axios auth header, and resets user state.

The user role is read from `user.global_role` or legacy `user.role`.

## API Consumption

`src/api.js` creates a single Axios instance:

```text
baseURL = VITE_API_URL || http://backend.test/
headers = Content-Type: application/json, Accept: application/json
request interceptor = attach Bearer token
response interceptor = clear session on 401
```

Feature views call this shared client directly or through small feature-specific helpers such as the employee task API module. This keeps auth and error behavior centralized.

## State Management

The dashboard uses a hybrid state model:

| State type | Owner | Examples |
| --- | --- | --- |
| UI chrome | Redux store | `sidebarShow`, `sidebarUnfoldable`, `theme` |
| Auth session | `AuthContext` | `user`, `loading`, `error`, `login`, `logout` |
| Notifications | `NotificationsContext` and API views | unread counts, notification lists |
| Server data | Feature components/hooks | projects, users, tasks, workload, requests |
| Local interaction state | Component hooks | filters, modal visibility, form inputs |

This keeps cross-cutting state small and lets each feature page own the lifecycle of its own API data.

## CoreUI Component Structure

The app extends the CoreUI dashboard pattern:

| Area | Components |
| --- | --- |
| Shell | `DefaultLayout`, `AppHeader`, `AppSidebar`, `AppContent`, `AppFooter`, `AppBreadcrumb` |
| Navigation | `_nav/getNav.js`, `_nav_admin.js`, `_nav_employee.js`, `_nav_client.js`, `AppSidebarNav` |
| Dashboard | role-specific dashboard components under `views/dashboard/components` |
| Projects | cards, drawers, tables, task breakdowns, creation modals, AI estimation card |
| Tasks | status badges, filters, recursive subtask tree, task modals, review actions |
| Workload | stats cards, charts, employee cards, task tables, performance cards |
| Requests | request cards and extension forms |
| Users | create user and user list components |

Styling is driven by CoreUI Sass imports in `src/scss/style.scss`, vendor overrides, Bootstrap utility classes, and feature-level component styles.

## Role-Specific Feature Surface

### Admin

Admins manage the operating model:

- User CRUD and activation state
- Project CRUD and project detail
- Project member assignment/removal
- Project type and task template configuration
- Task creation, assignment, approval, rejection, and overview
- AI project estimation through the backend estimate endpoint
- Team workload summaries and employee detail pages
- Request approval/rejection
- Activity log visibility

### Employee

Employees focus on execution:

- Personal dashboard
- Assigned task board/dashboard
- Task status updates
- Marking tasks ready for review
- Nested subtasks and progress visibility
- Project/task comments
- Workspace calendar and activity views
- Request creation for operational changes

### Client

Client views are intentionally read-oriented:

- Client dashboard
- Project list
- Project detail
- Timeline/activity visibility
- Project comments where allowed by the API

The frontend role guard prevents accidental rendering, while backend middleware remains the authoritative access-control boundary.

## Workspace Management

Workspace routes are employee-oriented and backed by `/api/employee/workspace/*` endpoints:

| View | Backend route | Purpose |
| --- | --- | --- |
| Calendar | `/api/employee/workspace/calendar` | Work scheduling and due-date visibility |
| Activity | `/api/employee/workspace/activity` | Recent employee activity |
| Productivity | `/api/employee/workspace/productivity` | Productivity metrics consumed by dashboard/workspace features |

## Build And Development

```bash
cd frontend
npm install
npm start
npm run build
npm run lint
```

Vite serves the app on port `3000`. Production output is written to `build/`.

Environment variables exposed to the frontend must use the `VITE_` prefix. The primary API setting is:

```text
VITE_API_URL=https://your-api-host/
```
