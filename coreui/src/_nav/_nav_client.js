/**
 * Sidebar Navigation — Client Role
 */

import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilBriefcase,
  cilCommentSquare,
  cilCalendar,
  cilSettings,
  cilFile,
  cilChart,
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  // ── Dashboard ─────────────────────────────────────────
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },

  // ── My Projects ───────────────────────────────────────
  {
    component: CNavTitle,
    name: 'My Projects',
  },
  {
    component: CNavItem,
    name: 'All Projects',
    to: '/client/projects',
    icon: <CIcon icon={cilBriefcase} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Project Progress',
    to: '/client/progress',
    icon: <CIcon icon={cilChart} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Comments',
    to: '/client/comments',
    icon: <CIcon icon={cilCommentSquare} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Documents',
    to: '/client/documents',
    icon: <CIcon icon={cilFile} customClassName="nav-icon" />,
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
