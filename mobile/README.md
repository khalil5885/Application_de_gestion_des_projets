# ProjectManager Mobile

Expo SDK 54 React Native app with TypeScript, Expo Router, Zustand, secure token persistence, and live Laravel API integration.

## Quick Start

```bash
npm install
cp .env.example .env
npx expo start
```

Set `EXPO_PUBLIC_API_URL` to a backend URL reachable from the device. A physical phone or web browser cannot use `localhost` for the Laravel server running on your computer unless Laravel is also listening on that same host, so use the machine LAN IP or a tunnel.

## Backend Integration

The app uses `services/api.ts` for all backend calls and `services/apiConfig.ts` to choose the backend host. The development web and physical-device default API base URL is:

```text
http://192.168.1.120:8000
```

Auth uses Laravel Sanctum bearer tokens. Tokens are stored with `expo-secure-store`, restored on launch through `hydrateAuth()`, and cleared on logout or global `401` responses.

Covered API areas:

- Auth: login, logout, current user, setup password verify/setup
- Admin: dashboard, users, projects, project comments, tasks, task comments, requests, workload
- Employee: dashboard, projects, tasks, task/project comments, requests
- Client: dashboard, activity, projects, project comments
- Notifications: list, unread count, mark read, mark all read, clear/delete

`constants/mockData.ts` remains available for development reference only. Production app paths no longer import it.

## Navigation

The mobile route tree mirrors the web role areas:

- `/(tabs)` dashboard, projects, tasks, team, profile
- `/project/[id]` and `/task/[id]` universal role-aware details
- `/admin/users`, `/admin/user/[id]`, `/admin/requests`, `/admin/workload`, `/admin/workload/[userId]`
- `/admin/project/create`, `/admin/project/[id]/edit`
- `/admin/task/create`, `/admin/task/[id]/edit`
- `/employee/requests`, `/employee/task/[id]`
- `/client/project/[id]`
- `/profile/edit`, `/settings`, `/search`, `/notifications`

Admin, employee, and client route groups include role guards and redirect unauthorized users back to the authenticated tabs.

## Quality Checks

```bash
npx tsc --noEmit
```

The project is kept in TypeScript strict mode. Pull-to-refresh and background refresh call the same Zustand fetch actions, while mutations use optimistic UI updates and roll back on API failure.
