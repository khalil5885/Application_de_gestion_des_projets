import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  CSidebar,
  CSidebarBrand,
  CSidebarNav,
  CNavTitle,
  CNavItem,
  CNavGroup,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilFolder,
  cilUser,
  cilCalendar,
  cilClock,
  cilSettings,
  cilChevronBottom,
  cilChevronRight,
  cilMenu,
} from '@coreui/icons'

const Sidebar = () => {
  return (
    <CSidebar className="border-end" style={{ width: '264px' }}>
      <CSidebarBrand className="d-flex align-items-center px-4 py-3">
        <span className="fs-5 fw-bold text-dark tracking-wide">WebMedia</span>
      </CSidebarBrand>

      <CSidebarNav className="px-3">
        {/* DASHBOARD */}
        <CNavItem className="mb-2">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => 
              `nav-link d-flex align-items-center rounded px-3 py-2 ${
                isActive 
                  ? 'text-success bg-success-subtle fw-medium' 
                  : 'text-secondary hover-bg-light'
              }`
            }
          >
            <CIcon icon={cilSpeedometer} className="me-3" size="lg" />
            Dashboard
          </NavLink>
        </CNavItem>

        {/* MANAGEMENT */}
        <CNavTitle className="text-uppercase text-muted fs-6 fw-semibold mt-3 mb-2 px-3">
          Management
        </CNavTitle>

        <CNavGroup 
          toggler={
            <div className="d-flex align-items-center text-secondary px-3 py-2">
              <CIcon icon={cilFolder} className="me-3" size="lg" />
              <span>Projects</span>
            </div>
          }
          className="mb-1"
        >
          <CNavItem className="ps-5">
            <NavLink to="/projects" className="nav-link py-1 text-secondary">
              All Projects
            </NavLink>
          </CNavItem>
          <CNavItem className="ps-5">
            <NavLink to="/project-types" className="nav-link py-1 text-secondary">
              Project Types
            </NavLink>
          </CNavItem>
        </CNavGroup>

        <CNavItem className="mb-2">
          <NavLink 
            to="/users" 
            className={({ isActive }) => 
              `nav-link d-flex align-items-center rounded px-3 py-2 ${
                isActive 
                  ? 'text-success bg-success-subtle fw-medium' 
                  : 'text-secondary hover-bg-light'
              }`
            }
          >
            <CIcon icon={cilUser} className="me-3" size="lg" />
            User Management
          </NavLink>
        </CNavItem>

        {/* WORKSPACE */}
        <CNavTitle className="text-uppercase text-muted fs-6 fw-semibold mt-3 mb-2 px-3">
          Workspace
        </CNavTitle>

        <CNavItem className="mb-1">
          <NavLink 
            to="/calendar" 
            className={({ isActive }) => 
              `nav-link d-flex align-items-center rounded px-3 py-2 ${
                isActive 
                  ? 'text-success bg-success-subtle fw-medium' 
                  : 'text-secondary hover-bg-light'
              }`
            }
          >
            <CIcon icon={cilCalendar} className="me-3" size="lg" />
            Calendar
          </NavLink>
        </CNavItem>

        <CNavItem className="mb-2">
          <NavLink 
            to="/activity" 
            className={({ isActive }) => 
              `nav-link d-flex align-items-center rounded px-3 py-2 ${
                isActive 
                  ? 'text-success bg-success-subtle fw-medium' 
                  : 'text-secondary hover-bg-light'
              }`
            }
          >
            <CIcon icon={cilClock} className="me-3" size="lg" />
            Activity
          </NavLink>
        </CNavItem>

        {/* ACCOUNT */}
        <CNavTitle className="text-uppercase text-muted fs-6 fw-semibold mt-3 mb-2 px-3">
          Account
        </CNavTitle>

        <CNavItem>
          <NavLink 
            to="/settings" 
            className={({ isActive }) => 
              `nav-link d-flex align-items-center rounded px-3 py-2 ${
                isActive 
                  ? 'text-success bg-success-subtle fw-medium' 
                  : 'text-secondary hover-bg-light'
              }`
            }
          >
            <CIcon icon={cilSettings} className="me-3" size="lg" />
            Settings
          </NavLink>
        </CNavItem>
      </CSidebarNav>
    </CSidebar>
  )
}

export default Sidebar
