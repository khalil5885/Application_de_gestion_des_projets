/**
 * Sidebar Navigation — Admin Role
 */

import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilBriefcase,
  cilPeople,
  cilCalendar,
  cilHistory,
  cilSettings,
  cilChartPie,
  cilFolderOpen,
  cilTask,
  cilUserFollow,
} from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  // ── Dashboard ─────────────────────────────────────────
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },

  // ── Management ────────────────────────────────────────
  {
    component: CNavTitle,
    name: 'Management',
  },
  {
    component: CNavGroup,
    name: 'Projects',
    to: '/admin/projects',
    icon: <CIcon icon={cilBriefcase} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'All Projects',
        to: '/admin/projects',
      },
      {
        component: CNavItem,
        name: 'Project Types',
        to: '/admin/project-types',
      },
      {
        component: CNavItem,
        name: 'Task Templates',
        to: '/admin/task-templates',
      },
    ],
  },
  {
    component: CNavGroup,
    name: 'Tasks',
    to: '/admin/tasks',
    icon: <CIcon icon={cilTask} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'All Tasks',
        to: '/admin/tasks',
      },
      {
        component: CNavItem,
        name: 'Assignments',
        to: '/admin/task-assignments',
      },
    ],
  },
  {
    component: CNavGroup,
    name: 'Users',
    to: '/admin/users',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'All Users',
        to: '/admin/users',
      },
      {
        component: CNavItem,
        name: 'Clients',
        to: '/admin/clients',
      },
      {
        component: CNavItem,
        name: 'Employees',
        to: '/admin/employees',
      },
    ],
  },
  {
    component: CNavItem,
    name: 'Activity Logs',
    to: '/workspace/activity',
    icon: <CIcon icon={cilHistory} customClassName="nav-icon" />,
  },

  // ── Reports ─────────────────────────────────────────────
  {
    component: CNavTitle,
    name: 'Reports',
  },
  {
    component: CNavItem,
    name: 'Analytics',
    to: '/admin/analytics',
    icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />,
  },

  // ── Workspace ───────────────────────────────────────────
  {
    component: CNavTitle,
    name: 'Workspace',
  },
  {
    component: CNavItem,
    name: 'Calendar',
    to: '/workspace/calendar',
    icon: <CIcon icon={cilCalendar} customClassName="nav-icon" />,
  },

  // ── Account ─────────────────────────────────────────────
  {
    component: CNavTitle,
    name: 'Account',
  },
  {
    component: CNavItem,
    name: 'Settings',
    to: '/settings',
    icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
  },
]

export default _nav
