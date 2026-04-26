import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { CSidebar, CSidebarBrand, CSidebarNav, CSidebarToggler } from '@coreui/react'
import CIcon from '@coreui/icons-react'

import { AppSidebarNav } from './AppSidebarNav'


import { sygnet } from "../assets/brand/sygnet";
import SimpleBar from 'simplebar-react'
import 'simplebar/dist/simplebar.min.css'

import getNav from '../_nav/getNav'

// ─── Custom hook to get role ─────────────────────────────
const useUserRole = () => {
  const user = useSelector((state) => state.auth?.user)
  if (user?.global_role) return user.global_role

  const saved = localStorage.getItem('user')
  if (saved) {
    try {
      return JSON.parse(saved).global_role
    } catch {
      return 'admin'
    }
  }
  return 'admin'
}

const AppSidebar = () => {
  const dispatch = useDispatch()
  const unfoldable = useSelector((state) => state.sidebarUnfoldable)
  const sidebarShow = useSelector((state) => state.sidebarShow)
  const role = useUserRole()
  const navigation = getNav(role)

  return (
    <CSidebar
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch({ type: 'set', sidebarShow: visible })
      }}
    >
      <CSidebarBrand className="d-none d-md-flex" to="/">
        <CIcon className="sidebar-brand-full"  height={35} />
        <CIcon className="sidebar-brand-narrow" icon={sygnet} height={35} />
      </CSidebarBrand>
      <CSidebarNav>
        <SimpleBar>
          <AppSidebarNav items={navigation} />
        </SimpleBar>
      </CSidebarNav>
      <CSidebarToggler
        className="d-none d-lg-flex"
        onClick={() => dispatch({ type: 'set', sidebarUnfoldable: !unfoldable })}
      />
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
