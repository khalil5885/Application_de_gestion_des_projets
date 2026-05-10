import React from 'react'
import {
  CHeader,
  CContainer,
  CHeaderToggler,
  CHeaderNav,
  CNavItem,
  CButton,
  CBadge,
  CAvatar,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilMenu,
  cilBell,
  cilSun,
  cilMoon,
  cilUser,
  cilSettings,
  cilAccountLogout,
} from '@coreui/icons'

const TopBar = () => {
  return (
    <CHeader className="bg-body-tertiary border-bottom" style={{ height: '64px' }}>
      <CContainer fluid className="d-flex align-items-center justify-content-between px-4">
        {/* Left side - Menu toggle */}
        <CHeaderToggler className="d-lg-none">
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>

        {/* Right side */}
        <CHeaderNav className="d-flex align-items-center gap-3">
          {/* Notifications */}
          <CNavItem>
            <CButton color="light" variant="ghost" className="position-relative p-2">
              <CIcon icon={cilBell} size="lg" className="text-secondary" />
              <CBadge color="danger" position="top-end" shape="rounded-pill" className="p-1">
                3
              </CBadge>
            </CButton>
          </CNavItem>

          {/* Theme Toggle */}
          <CNavItem>
            <CButton color="light" variant="ghost" className="p-2">
              <CIcon icon={cilSun} size="lg" className="text-secondary" />
            </CButton>
          </CNavItem>

          {/* User Dropdown */}
          <CDropdown variant="nav-item" alignment="end">
            <CDropdownToggle caret={false} className="p-0">
              <CAvatar color="secondary" textColor="white" size="md">
                <CIcon icon={cilUser} size="lg" />
              </CAvatar>
            </CDropdownToggle>
            <CDropdownMenu className="pt-0">
              <CDropdownItem>
                <CIcon icon={cilUser} className="me-2" />
                Profile
              </CDropdownItem>
              <CDropdownItem>
                <CIcon icon={cilSettings} className="me-2" />
                Settings
              </CDropdownItem>
              <CDropdownItem divider />
              <CDropdownItem>
                <CIcon icon={cilAccountLogout} className="me-2" />
                Logout
              </CDropdownItem>
            </CDropdownMenu>
          </CDropdown>
        </CHeaderNav>
      </CContainer>
    </CHeader>
  )
}

export default TopBar
