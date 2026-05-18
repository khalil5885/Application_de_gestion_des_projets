# Mobile Application Architecture

The mobile application in `mobile/` is an Expo React Native TypeScript app. It mirrors the Laravel domain model and exposes role-based workflows for admins, employees, and clients on mobile devices.

## Stack

| Technology | Version / package | Purpose |
| --- | --- | --- |
| Expo | `~54.0.0` | App runtime and development workflow |
| React | `19.1.0` | Component model |
| React Native | `0.81.5` | Native UI runtime |
| TypeScript | `~5.9.2` | Static typing |
| Expo Router | `~6.0.0` | File-based navigation |
| Zustand | `^5.0.2` | Global app state |
| React Native Reanimated | `~4.1.1` | Animated UI interactions |
| Gesture Handler | `~2.28.0` | Gesture infrastructure |
| Safe Area Context | `~5.6.0` | Safe-area layout |
| Expo Linear Gradient | `~15.0.0` | Gradient buttons/surfaces |
| Expo Status Bar / Splash Screen / Font | SDK 54 packages | Native app polish |
| Expo Vector Icons | `^15.0.2` | Iconography |

## Directory Structure

```text
mobile/
|-- app/
|   |-- _layout.tsx                Root stack layout
|   |-- index.tsx                  Entry/redirect screen
|   |-- login.tsx                  Login screen
|   |-- setup-password.tsx         Invitation password setup
|   |-- notifications.tsx          Notification inbox
|   |-- (tabs)/
|   |   |-- _layout.tsx            Bottom tab navigator
|   |   |-- index.tsx              Role-based dashboard
|   |   |-- projects.tsx           Project list
|   |   |-- tasks.tsx              Task board/list
|   |   |-- team.tsx               Team/workload
|   |   `-- profile.tsx            Profile and role links
|   |-- project/[id].tsx           Project detail
|   |-- task/[id].tsx              Task detail
|   |-- admin/
|   |   |-- create-user.tsx
|   |   |-- users.tsx
|   |   |-- requests.tsx
|   |   |-- workload.tsx
|   |   `-- workload/[userId].tsx
|   `-- employee/requests.tsx
|-- components/
|   |-- ui/                        Shared UI primitives
|   `-- project/ProjectCard.tsx
|-- constants/
|   |-- mockData.ts                Local fallback/demo data
|   `-- theme.ts                   Light/dark design tokens
|-- hooks/useTheme.ts
|-- services/api.ts                Laravel API service layer
|-- store/useAppStore.ts           Zustand state/actions
`-- types/index.ts                 Domain types aligned to Laravel
```

## Navigation Architecture

Expo Router maps files in `app/` directly to screens. The root layout wraps the app with:

- `GestureHandlerRootView`
- `SafeAreaProvider`
- `StatusBar`
- `Stack` from `expo-router`

The root stack registers public screens, the tab group, notifications, admin screens, employee request screens, and dynamic detail screens. The primary authenticated experience is the `(tabs)` group:

| Tab | Purpose |
| --- | --- |
| Dashboard | Role-based landing screen |
| Projects | Project list and project creation entry points |
| Tasks | Task board with status workflows |
| Team | Team/workload information |
| Profile | User settings and role-specific links |

Dynamic screens:

| Path | Purpose |
| --- | --- |
| `/project/[id]` | Project detail with tasks, team, comments, and AI/project insights |
| `/task/[id]` | Task detail with subtasks, comments, and workflow actions |
| `/admin/workload/[userId]` | Employee workload detail |

Modal-style screens include admin user creation and employee request creation.

## Authentication

Mobile auth is coordinated through `useAppStore` and `services/api.ts`.

1. `login(email, password)` calls `authApi.login`.
2. `authApi.login` posts to `/login` on the Laravel API base URL.
3. The returned token is passed to `setAuthToken`.
4. Future API calls include `Authorization: Bearer <token>`.
5. Zustand state updates `isLoggedIn` and `currentUser`.
6. `logout()` clears the in-memory token and user state.

The current implementation keeps the token in module memory via `_token`. It does not yet persist the token to secure device storage. For production, add `expo-secure-store` or an equivalent secure persistence layer and hydrate auth state on app launch.

## API Service Layer

`mobile/services/api.ts` defines:

```text
API_BASE_URL = http://192.168.1.119:8000/api
USE_MOCK = false
setAuthToken(token)
apiCall(method, path, body)
```

The generic `apiCall` wrapper:

- Builds the full Laravel API URL
- Adds JSON headers
- Adds bearer auth if `_token` is set
- Parses JSON
- Throws on non-2xx responses
- Unwraps Laravel responses from `data.data` when present

API namespaces:

| Namespace | Backing routes |
| --- | --- |
| `authApi` | `/login`, `/logout`, `/setup-password/verify`, `/setup-password` |
| `adminUserApi` | `/admin/users` |
| `adminProjectApi` | `/admin/projects` |
| `adminTaskApi` | `/admin/projects/{id}/tasks`, `/admin/tasks/{id}/approve`, `/admin/tasks/{id}/reject`, `/admin/tasks-overview` |
| `adminRequestApi` | `/admin/requests`, approve/reject routes |
| `adminWorkloadApi` | `/admin/workload`, `/admin/workload/{userId}` |
| `employeeApi` | `/employee/dashboard`, `/employee/tasks`, status updates, comments, requests |
| `clientApi` | `/client/dashboard`, `/client/projects` |
| `notificationApi` | `/notifications`, unread count, mark read, mark all read |

## State Management

`store/useAppStore.ts` is a Zustand store. It contains:

| State area | Examples |
| --- | --- |
| Theme | `isDarkMode`, `toggleTheme` |
| Auth | `isLoggedIn`, `currentUser`, `login`, `logout` |
| Projects | project list, add/update/delete project actions |
| Tasks | task list, selected task, status updates, ready-for-review, approval/rejection, subtasks, comments |
| Notifications | notification list, mark one/all read |
| Requests | create, approve, reject |
| Users | admin user list and local user creation/deletion |
| Workload | employee workload list |

The store initializes much of its data from `constants/mockData.ts`, while the login path already calls the real Laravel auth endpoint. The API service layer is ready for replacing local CRUD mutations with server calls feature by feature.

## Domain Model Alignment

`types/index.ts` mirrors backend concepts:

- `User` with Laravel-compatible `global_role`
- `Project`
- `Task`
- `TaskStatus`: `todo`, `in_progress`, `ready_for_review`, `done`, `on_hold`
- `Notification`
- `Request`
- `EmployeeWorkload`
- comments, subtasks, priorities, and dashboard objects

This type layer lets screens remain close to the Laravel resource shape while still supporting mobile-friendly derived fields.

## Role-Based Features

### Admin

- KPI dashboard
- Create users and invitation flow
- Manage users
- Review requests
- Team workload overview and employee workload detail
- Create/manage projects
- Create/manage tasks
- Approve or reject ready-for-review tasks

### Employee

- Productivity dashboard
- View assigned tasks
- Start tasks and update status
- Mark tasks ready for review
- Toggle subtasks
- Add comments
- Create tasks where allowed by the current UI state
- Submit and view operational requests

### Client

- Read-oriented dashboard
- View project list and project detail
- Track project progress
- Access client-safe project information

## Notification Handling

The mobile app has a dedicated `notifications.tsx` screen and a `notificationApi` namespace for Laravel notification routes:

- List notifications
- Fetch unread count
- Mark one notification as read
- Mark all notifications as read

Local notification state also exists in Zustand for immediate UI updates. Push notifications are not currently implemented in the inspected codebase; the current pipeline is API-backed in-app notification handling.

## Offline Synchronization

There is no durable offline synchronization implementation in the current mobile codebase. The app includes local mock data and local Zustand mutations, but it does not include:

- persistent local database storage
- mutation queueing
- retry/reconciliation logic
- conflict resolution
- background sync

Current behavior should be treated as online-first when `USE_MOCK = false`. A production offline strategy would likely add secure token persistence, durable cache storage, queued writes, server revision timestamps, and reconciliation per entity type.

## Theming And UI

Theme values live in `constants/theme.ts`, with `useTheme.ts` and Zustand's `isDarkMode` controlling light/dark behavior. Shared UI primitives live under `components/ui`, including cards, buttons, badges, avatars, progress indicators, skeletons, and date picker modal support.

The root status bar follows the active theme:

```text
isDarkMode ? light status bar : dark status bar
```

## Development

```bash
cd mobile
npm install
npx expo start
npx expo start --android
npx expo start --ios
npx expo start --web
```

Before connecting a physical device, update `API_BASE_URL` in `services/api.ts` to a network-reachable backend URL. `localhost` from a phone points to the phone itself, so use the machine LAN IP or a tunnel.
