# CoreUI Project Management Frontend

A modern React 19 admin dashboard for project management with multi-role support (admin, employee, client). Built with Vite, Redux, and React Context API.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Key Design Patterns](#key-design-patterns)
- [State Management Approach](#state-management-approach)
- [Getting Started](#getting-started)
- [Backend Integration](#backend-integration)
- [Available Scripts](#available-scripts)

## Tech Stack

### Framework & Build
- **React** 19.2.3 — Latest React with hooks and modern features
- **Vite** 7.3.0 — Lightning-fast build tool with dev server on port 3000
- **JavaScript/JSX** — Main language with SCSS for styling
- **React Router DOM** 7.11.0 — Client-side routing with lazy-loaded code splitting
- **Axios** 1.7.9 — HTTP client with built-in auth interceptors

### State Management
- **Redux** (via @reduxjs/toolkit) — Global UI state (sidebar visibility, theme preference)
- **React Context API** — Authentication state and user data
- **Local Storage** — Token persistence and auth recovery

### UI & Components
- **@coreui/react** 5.9.2 — Professional admin template components (sidebar, forms, cards, modals)
- **@coreui/icons-react** 2.3.0 — Icon library with 600+ icons
- **lucide-react** 1.8.0 — Additional icon library
- **Chart.js** 4.4.0 + **@coreui/react-chartjs** — Data visualization for dashboards
- **framer-motion** 11.3.28 — Smooth animations and transitions
- **@dnd-kit** — Modern drag-and-drop library for sortable lists

### Code Quality & Styling
- **ESLint** 9.39.2 — Code linting for consistency
- **Prettier** 3.7.4 — Code formatting
- **SCSS** — Preprocessor for styling with autoprefixer support

### Development
- **@vitejs/plugin-react** — Fast React refresh during development
- **@vitejs/plugin-basic-ssl** — Local HTTPS support if needed

## Folder Structure

```
coreui/src/
├── api.js                    # Axios HTTP client with auth interceptors & error handling
├── store.js                  # Redux store for UI state (sidebar, theme)
├── routes.js                 # Route configuration with lazy loading for code splitting
├── App.js                    # Root component that sets up routing, Redux, and layouts
├── index.js                  # Application entry point
│
├── context/
│   └── AuthContext.jsx       # Auth provider for login, logout, and user session
│
├── components/               # Reusable UI components
│   ├── ProtectedRoute.jsx    # Route wrapper that guards protected pages (requires auth)
│   ├── RoleGuard.jsx         # Role-based access control wrapper (admin/employee/client)
│   ├── App*.jsx              # Layout components (AppSidebar, AppHeader, AppFooter, AppBreadcrumb)
│   ├── header/
│   │   └── AppHeaderDropdown.jsx  # User menu dropdown in header
│   ├── project/              # Project-specific reusable components
│   │   ├── ProjectForm.jsx
│   │   ├── ProjectCard.jsx
│   │   ├── ProjectModal.jsx
│   │   └── TaskList.jsx
│   ├── dashboard/            # Dashboard visualization components
│   │   ├── RiskMatrix.jsx
│   │   ├── ProjectChart.jsx
│   │   └── StatsCard.jsx
│   └── user/                 # User management components
│       ├── UserForm.jsx
│       └── UserTable.jsx
│
├── layout/
│   └── DefaultLayout.js      # Main app layout wrapper (sidebar + header + footer + page content)
│
├── views/                    # Page-level components (one per route)
│   ├── pages/
│   │   ├── Login.jsx         # Authentication page
│   │   ├── SetupPassword.jsx # Initial password setup flow
│   │   ├── NotFound.jsx      # 404 error page
│   │   └── ServerError.jsx   # 500 error page
│   │
│   ├── admin/                # Admin-only pages
│   │   ├── Dashboard.jsx     # Main admin dashboard with stats and charts
│   │   ├── UserManagement.jsx # User CRUD interface
│   │   └── project/
│   │       ├── ProjectList.jsx    # View all projects
│   │       ├── ProjectDetail.jsx  # Edit project, manage members
│   │       └── TaskManagement.jsx # Manage project tasks
│   │
│   ├── employee/             # Employee-only pages
│   │   ├── Dashboard.jsx     # Employee task dashboard
│   │   ├── AssignedTasks.jsx # List of assigned tasks
│   │   └── TaskDetail.jsx    # View/update task status
│   │
│   ├── dashboard/
│   │   ├── RiskMatrix.jsx    # Risk assessment visualization
│   │   └── ActivityLog.jsx   # Recent activities
│   │
│   ├── workspace/
│   │   ├── Calendar.jsx      # Project timeline calendar
│   │   └── ActivityLog.jsx   # System activity log
│   │
│   └── settings/
│       └── UserSettings.jsx  # Profile and preference settings
│
├── assets/
│   ├── brand/
│   │   └── logo.svg          # Application logo
│   └── images/               # Static images
│
└── scss/
    ├── _variables.scss       # Color and spacing variables
    ├── _components.scss      # Component-specific styling
    ├── _utilities.scss       # Utility classes
    └── style.scss            # Main stylesheet
```

## Key Design Patterns

### 1. Component Architecture (Atomic-like Pattern)

Components are organized by abstraction level:
- **Leaf Components** — Simple, reusable UI elements (buttons, cards, inputs)
- **Feature Components** — Domain-specific (ProjectForm, TaskList, UserTable)
- **Page Components** — Full-page views that fetch data and compose feature components
- **Layout Components** — Wrapper layouts that define page structure

This separation ensures components are testable, reusable, and maintainable.

### 2. Code Splitting & Lazy Loading

Routes are lazy-loaded using React.lazy() and Suspense:

```javascript
// routes.js example pattern
const Dashboard = lazy(() => import('./views/admin/Dashboard'))
const ProjectList = lazy(() => import('./views/admin/project/ProjectList'))
```

This dramatically reduces initial bundle size. Each route is code-split into its own chunk and loaded on-demand.

### 3. Centralized API Client

All HTTP requests go through a single Axios instance in [api.js](src/api.js):
- **Request interceptors** — Automatically inject Bearer token from localStorage
- **Response interceptors** — Handle 401 auth errors by logging out the user
- **Error normalization** — All errors follow a consistent format

This pattern eliminates token management boilerplate and ensures consistent error handling across the app.

### 4. Authentication & Authorization Pattern

**AuthContext** provides:
- Login/logout functionality
- User state (email, role, permissions)
- Auto-recovery of session from localStorage

**ProtectedRoute** — Wraps routes that require authentication
**RoleGuard** — Wraps routes that require specific roles (admin, employee, client)

Example route protection:
```javascript
<Route element={<ProtectedRoute><RoleGuard roles={['admin']}><UserManagement /></RoleGuard></ProtectedRoute>} path="/admin/users" />
```

### 5. Form Handling

Forms use controlled React components with local `useState` for validation and state:
- Input changes update component state
- Submit handlers send data to backend via API client
- Error messages displayed inline or in toast notifications
- No external form library dependency (lightweight and flexible)

### 6. Routing Strategy

Uses React Router v7 with:
- **Route-based code splitting** — Each page is its own chunk
- **Nested routes** — `/admin/*` routes are grouped under admin layout
- **Protected routes** — Auth checks before rendering
- **Fallback UI** — Loading spinner shown while chunks load
- **404 handling** — Catch-all route at end of route list

## State Management Approach

### Why Hybrid Architecture?

The app uses **three complementary state management tools** instead of one:

| State Type | Tool | Reason |
|-----------|------|--------|
| **UI State** (sidebar, theme) | Redux | Needs to persist and be accessed by many components |
| **Auth State** (user, token, roles) | React Context | Simpler than Redux; used only by auth-protected routes |
| **Component State** (forms, dropdowns) | useState | Local component state for UI that doesn't need to be global |
| **Persistence** | localStorage | Recover auth session on page refresh |

### Redux for UI State

Store at [store.js](src/store.js):
- `sidebar.collapsed` — Toggle sidebar visibility
- `theme.dark` — Dark/light theme preference

Minimal and focused. Most logic lives in components using hooks.

### Context API for Authentication

[AuthContext.jsx](src/context/AuthContext.jsx) provides:
- `user` — Current user object (email, role, permissions)
- `token` — Bearer token for API calls
- `login(email, password)` — Authenticate
- `logout()` — Clear session and redirect
- `isLoading` — Loading state during auth operations

Usage in components:
```javascript
const { user, isLoading, login } = useContext(AuthContext)
if (user?.role === 'admin') { /* show admin features */ }
```

### localStorage for Persistence

On app startup, AuthContext checks localStorage for:
- `auth_token` — Restore previous session
- `user_data` — Restore user info without re-fetching

If token exists and is still valid, user is automatically logged in.

### When to Use Each

| Scenario | Use | Reason |
|----------|-----|--------|
| Toggle sidebar on/off | Redux | Needs to survive navigation; accessed by layout |
| User logged in? | Context | Only needed by protected route wrappers |
| Form input values | useState | Only the form component needs this data |
| Save user preferences | localStorage | Should persist across sessions |

## Getting Started

### Installation

```bash
npm install
```

or

```bash
yarn install
```

### Development Server

```bash
npm run dev
```

The app runs on [http://localhost:3000](http://localhost:3000) with hot reload enabled.

### Build for Production

```bash
npm run build
```

Build artifacts are output to `dist/` for deployment.

## Backend Integration

The frontend connects to a Laravel API at `http://application_de_gestion_des_projets.test`.

**Vite Proxy Configuration** (vite.config.mjs):
```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://application_de_gestion_des_projets.test',
      changeOrigin: true
    }
  }
}
```

This proxies all `/api/*` requests to the backend during development. See [Backend Integration](#backend-integration) in the main [README_backend_overview.md](../README_backend_overview.md) for API endpoints and authentication flow.

### Test Credentials

Default seed users (from backend seeder):

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | password |
| Employee | employee@example.com | password |
| Client | client@example.com | password |

## Available Scripts

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Lint code with ESLint
npm run lint

# Format code with Prettier
npm run format

# Run type checking (if TypeScript)
npm run type-check
```

## Project Dependencies Overview

### Core Dependencies
- `react` — UI library
- `react-dom` — React rendering
- `react-router-dom` — Client-side routing
- `axios` — HTTP client
- `@reduxjs/toolkit` — Redux state management
- `react-redux` — React bindings for Redux
- `@coreui/react` — Admin template components

### UI & UX Libraries
- `@coreui/icons-react` — Icon library
- `lucide-react` — Additional icons
- `chart.js` — Charts
- `@coreui/react-chartjs` — React chart integration
- `framer-motion` — Animations
- `@dnd-kit/` — Drag-and-drop

### Dev Dependencies
- `vite` — Build tool
- `eslint` — Code linting
- `prettier` — Code formatting
- `@vitejs/plugin-react` — React plugin for Vite

## Architecture Decision Records

### Why Vite over Create React App?
- **Performance** — Instant HMR (hot module replacement) even with large apps
- **Build Speed** — 10x faster builds
- **Modern Tooling** — Leverages native ES modules, esbuild
- **Less Configuration** — Works out-of-the-box for most cases

### Why Hybrid State Management?
- **Redux** — Overkill for just auth state; we use it only for persistent UI state (sidebar, theme)
- **Context + localStorage** — Simpler for auth, avoids Redux boilerplate
- **Result** — Best of both worlds: lean auth, persistent UI state

### Why CoreUI Components?
- **Comprehensive** — 600+ components out-of-the-box
- **Admin-Focused** — Designed for dashboards and data management
- **Consistent** — Bootstrap-based, familiar design patterns
- **Accessibility** — Built-in ARIA support

## Resources

- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [React Router Docs](https://reactrouter.com)
- [CoreUI React Components](https://coreui.io/react/docs/components/)
- [Redux Toolkit Docs](https://redux-toolkit.js.org)
- [Axios Docs](https://axios-http.com)

## License

MIT
