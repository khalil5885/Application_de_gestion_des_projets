/**
 * Dynamic Navigation Loader
 * Loads the correct navigation based on user role
 */

import _nav_admin from './_nav_admin'
import _nav_employee from './_nav_employee'
import _nav_client from './_nav_client'

const getNav = (role) => {
  switch (role) {
    case 'admin':
      return _nav_admin
    case 'employee':
      return _nav_employee
    case 'client':
      return _nav_client
    default:
      return _nav_admin  // fallback
  }
}

export default getNav
