# CoreUI Project Management Frontend

React 19 + Vite frontend for the project management platform. The app uses CoreUI for the admin-dashboard interface, Axios for API access, React Context for authentication, Redux for global UI preferences, and role-aware navigation for admin, employee, and client workspaces.

## Current Status

- Frontend folder: `coreui/`
- Main entry: `src/index.js`
- App shell: `src/App.js`
- Authenticated layout: `src/layout/DefaultLayout.js`
- Routes: `src/routes.js`
- API client: `src/api.js`
- Auth provider: `src/context/AuthContext.jsx`
- Latest scanned build log: `build_vite.txt` shows a successful Vite production build.
- `build_output.txt` is an older Create React App style output and is no longer the source of truth for this Vite app.

## Tech Stack

### Framework and Build

- React `19.2.3`
- Vite `7.3.x`
- JavaScript and JSX
- React Router DOM `7.11.0`
- Axios `1.13.6`

### UI and Experience

- `@coreui/react` for cards, forms, modals, layout, badges, sidebars, and tables
- `@coreui/icons-react` and `@coreui/icons`
- `lucide-react`
- Chart.js with `@coreui/react-chartjs`
- Framer Motion and Motion
- `@dnd-kit` for drag-and-drop task workflows

### State and Styling

- React Context for authentication and user session state
- Redux for global UI state such as sidebar/theme preferences
- Local storage for token and user persistence
- SCSS via `src/scss/style.scss`
- ESLint and Prettier configuration files are present

## Project Structure

```text
coreui/
+-- .github/                         # Project community docs
+-- public/                          # Public static assets
+-- src/
|   +-- _nav/
|   |   +-- _nav_admin.js            # Admin sidebar navigation
|   |   +-- _nav_client.js           # Client sidebar navigation
|   |   +-- _nav_employee.js         # Employee sidebar navigation
|   |   +-- getNav.js                # Role-based nav selector
|   +-- assets/
|   |   +-- brand/                   # Logo and brand modules
|   |   +-- images/                  # Static image assets
|   +-- components/
|   |   +-- AppBreadcrumb.js
|   |   +-- AppContent.jsx
|   |   +-- AppFooter.jsx
|   |   +-- AppHeader.jsx
|   |   +-- AppSidebar.jsx
|   |   +-- AppSidebarNav.jsx
|   |   +-- ProtectedRoute.jsx       # Auth guard wrapper
|   |   +-- RoleGuard.jsx            # Role visibility helper
|   |   +-- dashboard/               # Shared dashboard widgets
|   |   +-- header/                  # Header dropdown components
|   |   +-- project/
|   |   |   +-- AiEstimationCard.jsx
|   |   |   +-- CreateProjectModal.jsx
|   |   |   +-- CreateProjectTypeModal.jsx
|   |   |   +-- ProgressBar.jsx
|   |   |   +-- ProjectCard.jsx
|   |   |   +-- ProjectDrawer.jsx
|   |   |   +-- TaskBreakdown.jsx
|   |   +-- request/
|   |   |   +-- RequestCard.jsx
|   |   |   +-- RequestExtensionForm.jsx
|   |   +-- task/
|   |   |   +-- TaskReviewActions.jsx
|   |   +-- user/
|   |       +-- CreateUser.jsx
|   |       +-- UserList.jsx
|   +-- context/
|   |   +-- AuthContext.jsx
|   +-- layout/
|   |   +-- DefaultLayout.js
|   +-- scss/
|   |   +-- examples.scss
|   |   +-- style.scss
|   |   +-- vendors/simplebar.scss
|   +-- views/
|   |   +-- admin/
|   |   |   +-- RequestManagement.jsx
|   |   |   +-- UserManagement.jsx
|   |   |   +-- project/
|   |   |       +-- ProjectDetail.jsx
|   |   |       +-- ProjectManagement.jsx
|   |   |       +-- ProjectTypeManagement.jsx
|   |   |       +-- ProjectTypesPage.jsx
|   |   |       +-- TaskManagement.jsx
|   |   |       +-- TaskTemplatesPage.jsx
|   |   +-- dashboard/
|   |   |   +-- Dashboard.jsx
|   |   |   +-- components/          # Admin, employee, and client dashboard panels
|   |   +-- employee/
|   |   |   +-- tasks/               # Employee task board, filters, modal, hooks, API helpers
|   |   +-- pages/
|   |   |   +-- login/
|   |   |   +-- page404/
|   |   |   +-- page500/
|   |   |   +-- register/
|   |   |   +-- setup-password/
|   |   +-- settings/
|   |   |   +-- Settings.jsx
|   |   +-- workspace/
|   |       +-- activity/Activity.jsx
|   |       +-- calendar/Calendar.jsx
|   +-- api.js
|   +-- App.js
|   +-- index.js
|   +-- routes.js
|   +-- store.js
+-- build_output.txt                 # Legacy/stale build output
+-- build_vite.txt                   # Vite build output
+-- DEVELOPMENT.md
+-- ARCHITECTURE.md
+-- package.json
+-- vite.config.mjs
+-- README.md
```

## Routes

Routes are lazy-loaded in `src/routes.js`.

| Path | View | Actor |
| --- | --- | --- |
| `/login` | Login | Public |
| `/setup-password` | Setup password | Public |
| `/dashboard` | Role-aware dashboard | Admin, employee, client |
| `/admin/users` | User management | Admin |
| `/admin/requests` | Request management | Admin |
| `/workspace/ai-estimation` | AI estimation component route | Admin/workspace |
| `/admin/projects` | Project management | Admin |
| `/admin/projects/:id` | Project detail, team, tasks, AI estimation | Admin |
| `/admin/projects/:id/tasks` | Task kanban and review management | Admin |
| `/admin/project-types` | Project type management | Admin |
| `/admin/task-templates` | Task template management | Admin |
| `/employee/tasks` | Employee task dashboard | Employee |
| `/workspace/calendar` | Calendar | Shared workspace |
| `/workspace/activity` | Activity log | Shared workspace |
| `/settings` | Settings | Authenticated users |

## Actor Features

### Admin

Admin users have the broadest management surface:

- Dashboard stats for active projects, completed tasks, pending tasks, and team members
- Recent activity and upcoming deadline overview
- Project CRUD workflow through `ProjectManagement`
- Project detail view with team assignment, task distribution, and an AI estimation card
- Project type and task template management
- Task kanban board with drag-and-drop status updates
- Ready-for-review task workflow with approve and reject actions
- Reject task flow with feedback comment submission
- Employee deadline extension request review
- Request approve/reject actions with handled-state button disabling
- User management for admins, employees, and clients
- Calendar and activity-log access

### Employee

Employee users focus on assigned work:

- Role-aware dashboard with task totals, completed count, in-progress count, and to-do count
- Project progress summary through dashboard widgets
- Upcoming tasks panel
- My Tasks page with list mode, filters, priorities, due dates, subtasks, comments, and task details modal
- Task status updates using the employee task API helper
- Task detail modal with description, subtasks, progress, comments, and status badge
- Mark task as ready for review
- Submit deadline extension requests with requested deadline and reason
- Calendar access and account settings

### Client

Client users see project-facing progress:

- Role-aware dashboard with total projects, active projects, completed projects, and average progress
- Client project list component for project progress visibility
- Sidebar entries for all projects, progress, comments, documents, calendar, and settings
- Shared calendar access
- Account settings

Some client sidebar destinations are present in navigation before dedicated route entries are defined. Add route entries in `src/routes.js` when those pages are implemented.

## Core Workflows

### Authentication

`AuthContext.jsx` owns login, logout, local-storage recovery, and authenticated user state. The Axios client reads the stored token and attaches it to requests.

Local storage keys currently used:

- `token`
- `user`

### API Access

All HTTP calls should use `src/api.js`.

The Axios instance:

- Sets `Content-Type: application/json`
- Sets `Accept: application/json`
- Adds `Authorization: Bearer <token>` when a token exists
- Handles `401` responses by clearing auth storage and redirecting to `/login`

### Role-Based UI

Navigation is selected through `src/_nav/getNav.js`.

Dashboard content is selected in `src/views/dashboard/Dashboard.jsx` using the active user's `global_role` or `role`.

### Request System

Employee request creation:

- Component: `src/components/request/RequestExtensionForm.jsx`
- Payload type: `extension`
- Includes `requestable_id`, `requestable_type`, `current_deadline`, `requested_deadline`, and `reason`

Admin request review:

- Page: `src/views/admin/RequestManagement.jsx`
- Card: `src/components/request/RequestCard.jsx`
- Supports approve and reject actions

### Task Review System

Employee side:

- `TaskDetailModal.jsx` exposes "Mark as Ready for Review"
- Status badge supports `pending`, `todo`, `in_progress`, `ready_for_review`, `done`, and `on_hold`

Admin side:

- `TaskManagement.jsx` includes a `ready_for_review` column
- `TaskReviewActions.jsx` handles approve and reject controls
- Reject flow opens a feedback modal and submits feedback as a comment

### AI Estimation

`AiEstimationCard.jsx` displays:

- Estimated days
- Risk level badge: low, medium, high
- AI comment
- Recalculate action

It is embedded in the admin project detail page.

## Backend Integration

The frontend uses:

```js
baseURL: import.meta.env.VITE_API_URL || 'http://application_de_gestion_des_projets.test'
```

Configure `VITE_API_URL` in a local `.env` file when using a different API host. The current Vite development proxy sends `/api` requests to `http://project_manager.test` and preserves the `/api` prefix.

Expected API groups include:

- `/api/login`
- `/api/logout`
- `/api/admin/dashboard`
- `/api/employee/dashboard`
- `/api/client/dashboard`
- `/api/admin/projects`
- `/api/admin/users`
- `/api/admin/requests`
- `/api/employee/tasks`
- `/api/tasks/:id/mark-ready`
- `/api/tasks/:id/approve`
- `/api/tasks/:id/reject`
- `/api/comments`

## Test Credentials

Default seed users from the Laravel backend:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@example.com` | `password` |
| Employee | `employee@example.com` | `password` |
| Client | `client@example.com` | `password` |

## Available Scripts

The scripts currently defined in `package.json` are:

```bash
npm run start
npm run build
npm run serve
npm run lint
```

Notes:

- `npm run start` starts the Vite dev server.
- `npm run build` creates the production build in `build/`.
- `npm run serve` runs Vite preview.
- `npm run lint` runs ESLint.

## Development Notes

- Keep page-level components in `src/views/`.
- Keep reusable components in `src/components/`.
- Use CoreUI components for dashboard UI: cards, buttons, badges, forms, modals, layout, and tables.
- Use `src/api.js` for all backend calls.
- Use `AuthContext` for auth state and role-aware rendering.
- Prefer local component state with `useState` for forms and modals.
- Avoid adding new state libraries unless a feature truly needs one.

## Known Notes From Scan

- `build_vite.txt` records a successful Vite build, but it is a generated output file and should not be treated as source.
- `build_output.txt` appears stale and references a different machine path from an older build attempt.
- Some navigation entries point to routes that are not yet implemented, especially several client pages and admin task/report placeholders.

## Related Docs

- `ARCHITECTURE.md`
- `DEVELOPMENT.md`
- `../README_backend_overview.md`
