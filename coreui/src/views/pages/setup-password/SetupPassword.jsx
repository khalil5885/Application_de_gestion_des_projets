import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  CButton, CCard, CCardBody, CCol, CContainer,
  CForm, CFormInput, CFormLabel, CRow, CAlert, CSpinner
} from '@coreui/react'
import api from '../../../api'

const SetupPassword = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const token = searchParams.get('token')
  const email = searchParams.get('email')
  
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setConfirmation] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault() // Prevent form reload
      console.log('token:', token)
  console.log('email:', email)
    setError(null)
    setLoading(true)

    try {
      const res = await api.post('/api/setup-password', {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      })

      setSuccess(true)
      
      // If your API returns a login token immediately:
      if (res.data.token) {
        localStorage.setItem('auth_token', res.data.token)
        setTimeout(() => navigate('/dashboard'), 2000)
      } else {
        // Otherwise, send them to login
        setTimeout(() => navigate('/login'), 2000)
      }
    } catch (err) {
      const serverMessage = err.response?.data?.message;
  setError(serverMessage || 'Something went wrong.');
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={5}>
            <CCard className="p-4 shadow-sm border-0">
              <CCardBody>
                <h4 className="fw-bold mb-1">Set your password</h4>
                <p className="text-body-secondary small mb-4">
                  Welcome! Choose a password to activate your account.
                </p>

                {success && (
                  <CAlert color="success">
                    Password set successfully! Redirecting...
                  </CAlert>
                )}

                {error && <CAlert color="danger">{error}</CAlert>}

                {!success && (
                  <CForm onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <CFormLabel className="small fw-semibold">Email Address</CFormLabel>
                      <CFormInput value={email || ''} disabled />
                    </div>
                    <div className="mb-3">
                      <CFormLabel className="small fw-semibold">New Password</CFormLabel>
                      <CFormInput
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <CFormLabel className="small fw-semibold">Confirm Password</CFormLabel>
                      <CFormInput
                        type="password"
                        value={passwordConfirmation}
                        onChange={e => setConfirmation(e.target.value)}
                        required
                      />
                    </div>
                    <CButton
                      color="primary"
                      className="w-100 py-2 fw-bold"
                      type="submit"
                      disabled={loading || !token}
                    >
                      {loading ? <CSpinner size="sm" /> : 'Activate Account'}
                    </CButton>
                  </CForm>
                )}
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default SetupPassword