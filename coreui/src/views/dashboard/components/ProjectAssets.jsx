import React, { useState } from 'react'
import {
  CCard,
  CCardBody,
  CButton,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudUpload, cilFile, cilCloudDownload } from '@coreui/icons'

const initialAssets = [
  {
    name: 'Design_v2.pdf',
    color: 'danger',
    icon: cilFile,
  },
  {
    name: 'Logo_Assets.zip',
    color: 'primary',
    icon: cilCloudDownload,
  },
]

const ProjectAssets = () => {
  const [assets, setAssets] = useState(initialAssets)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    // Handle file drop logic here
  }

  return (
    <CCard className="border-0 shadow-sm h-100" style={{ borderRadius: '1rem' }}>
      <CCardBody className="p-4">
        <h5 className="fw-bold text-dark mb-4">Project Assets</h5>

        {/* Upload Area */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border border-2 border-dashed rounded p-5 d-flex flex-column align-items-center justify-content-center text-center mb-4 cursor-pointer transition-all ${
            isDragging 
              ? 'border-primary bg-primary-subtle' 
              : 'border-secondary-subtle hover-border-primary'
          }`}
          style={{ borderRadius: '0.75rem' }}
        >
          <div className={`p-3 rounded mb-3 ${
            isDragging ? 'bg-primary text-white' : 'bg-light text-secondary'
          }`}>
            <CIcon icon={cilCloudUpload} size="xl" />
          </div>
          <p className="text-muted fw-medium small mb-0">Drop files here to upload</p>
        </div>

        {/* Asset List */}
        <div className="d-flex flex-column gap-3">
          {assets.map((asset, index) => (
            <div key={index} className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <div className={`p-2 rounded me-3 bg-${asset.color}-subtle text-${asset.color}`}>
                  <CIcon icon={asset.icon} size="lg" />
                </div>
                <span className="fw-semibold text-secondary small">{asset.name}</span>
              </div>
              <CButton 
                color="light" 
                variant="ghost" 
                size="sm"
                className="text-secondary p-1"
              >
                <svg className="icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </CButton>
            </div>
          ))}
        </div>
      </CCardBody>
    </CCard>
  )
}

export default ProjectAssets
