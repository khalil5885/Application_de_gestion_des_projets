import React from 'react'
import {
  CAvatar,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react'
import {
  cilUser,
  cilSettings,
  cilHistory,
  cilLockLocked,
  cilPeople,
  cilBriefcase,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

import avatar8 from './../../assets/images/avatars/8.jpg'

const AppHeaderDropdown = () => {
  const navigate = useNavigate()
  const { logout, user } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isAdmin = user?.global_role === 'admin'

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        <CAvatar src={avatar8} size="md" />
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end" style={{ minWidth: 210 }}>
        <CDropdownHeader className="bg-body-secondary fw-semibold mb-2">
          {user?.name || 'My Account'}
          {isAdmin && (
            <span className="ms-2 badge bg-primary" style={{ fontSize: 9 }}>Admin</span>
          )}
        </CDropdownHeader>

        {/* Profile / Settings */}
        <CDropdownItem
          onClick={() => navigate('/settings')}
          style={{ cursor: 'pointer' }}
          className="d-flex align-items-center gap-2"
        >
          <CIcon icon={cilSettings} />
          Profile & Settings
        </CDropdownItem>

        {/* Activity */}
        <CDropdownItem
          onClick={() => navigate('/workspace/activity')}
          style={{ cursor: 'pointer' }}
          className="d-flex align-items-center gap-2"
        >
          <CIcon icon={cilHistory} />
          Activity Log
        </CDropdownItem>

        {/* Admin-only shortcuts */}
        {isAdmin && (
          <>
            <CDropdownDivider />
            <CDropdownHeader className="bg-body-secondary fw-semibold text-uppercase" style={{ fontSize: 10 }}>
              Admin
            </CDropdownHeader>
            <CDropdownItem
              onClick={() => navigate('/admin/projects')}
              style={{ cursor: 'pointer' }}
              className="d-flex align-items-center gap-2"
            >
              <CIcon icon={cilBriefcase} />
              Projects
            </CDropdownItem>
            <CDropdownItem
              onClick={() => navigate('/admin/users')}
              style={{ cursor: 'pointer' }}
              className="d-flex align-items-center gap-2"
            >
              <CIcon icon={cilPeople} />
              User Management
            </CDropdownItem>
          </>
        )}

        <CDropdownDivider />

        <CDropdownItem
          onClick={handleLogout}
          style={{ cursor: 'pointer' }}
          className="d-flex align-items-center gap-2 text-danger"
        >
          <CIcon icon={cilLockLocked} className="text-danger" />
          Logout
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown
