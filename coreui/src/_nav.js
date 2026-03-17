/**
 * Sidebar Navigation — WebMedia SaaS Platform
 */

import React from 'react'
import CIcon from '@coreui/icons-react'
import { cilPeople, cilSpeedometer } from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Administration',
  },
  {
    component: CNavGroup,
    name: 'Admin',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'User Management',
        to: '/admin/users',
      },
      {
        component: CNavItem,
        name: 'Projects Management',
        to: '/admin/projects',
      },
    ],
  },
]

export default _nav
