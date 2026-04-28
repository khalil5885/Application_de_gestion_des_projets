import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => {
  return (
    <CFooter className="px-4">
      <div>
        <span className="fw-semibold">WebMedia</span>
        <span className="ms-2 text-body-secondary">&copy; {new Date().getFullYear()} All rights reserved.</span>
      </div>
      <div className="ms-auto text-body-secondary small">
        Project Management Platform
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)

