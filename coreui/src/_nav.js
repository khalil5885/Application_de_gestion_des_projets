/**
 * Sidebar Navigation — Project Manager SaaS
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
  cilLayers,
} from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  // ── Main ────────────────────────────────────────────────
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },

  // ── Management ──────────────────────────────────────────
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
    ],
  },
  {
    component: CNavItem,
    name: 'User Management',
    to: '/admin/users',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
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
  {
    component: CNavItem,
    name: 'Activity',
    to: '/workspace/activity',
    icon: <CIcon icon={cilHistory} customClassName="nav-icon" />,
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
