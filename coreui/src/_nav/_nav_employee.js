/**
 * Sidebar Navigation — Employee Role
 */

import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilBriefcase,
  cilTask,
  cilCalendar,
  cilCommentSquare,
  cilSettings,
  cilCheckCircle,
  cilClock,
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

  // ── My Work ─────────────────────────────────────────────
  {
    component: CNavTitle,
    name: 'My Work',
  },
  {
    component: CNavGroup,
    name: 'My Projects',
    to: '/employee/projects',
    icon: <CIcon icon={cilBriefcase} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Active Projects',
        to: '/employee/projects',
      },
      {
        component: CNavItem,
        name: 'Completed',
        to: '/employee/projects/completed',
      },
    ],
  },
  {
    component: CNavGroup,
    name: 'My Tasks',
    to: '/employee/tasks',
    icon: <CIcon icon={cilTask} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'All Tasks',
        to: '/employee/tasks',
      },
      {
        component: CNavItem,
        name: 'In Progress',
        to: '/employee/tasks?status=in_progress',
      },
      {
        component: CNavItem,
        name: 'Completed',
        to: '/employee/tasks?status=completed',
      },
    ],
  },
  {
    component: CNavItem,
    name: 'Comments',
    to: '/employee/comments',
    icon: <CIcon icon={cilCommentSquare} customClassName="nav-icon" />,
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
