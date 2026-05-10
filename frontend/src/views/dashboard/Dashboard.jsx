import React, { useEffect, useState } from 'react'
import { CSpinner } from '@coreui/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import AdminDashboard from './components/AdminDashboard'
import EmployeeDashboard from './components/EmployeeDashboard'
import ClientDashboard from './components/ClientDashboard'

// Safe localStorage parser
const getStoredUser = () => {
  try {
    const saved = localStorage.getItem('user')
    if (!saved || saved === 'undefined' || saved === 'null') return null
    return JSON.parse(saved)
  } catch {
    return null
  }
}

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth()  // Get isAuthenticated from context
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Get user from context or localStorage
  const activeUser = user || getStoredUser()
  const role = activeUser?.global_role || activeUser?.role  // Support both global_role and role for backward compatibility

  useEffect(() => {
    // If not authenticated at all, redirect to login
    if (!isAuthenticated && !getStoredUser()) {
      navigate('/login')
      return
    }

    if (!role) {
      setLoading(false)
      setError('No role found. Please log in again.')
      return
    }

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const endpoints = {
          admin: '/api/admin/dashboard',
          employee: '/api/employee/dashboard',
          client: '/api/client/dashboard',
        }

        console.log('Fetching dashboard for role:', role)  // Debug
        console.log('Endpoint:', endpoints[role])           // Debug

        const res = await api.get(endpoints[role])
        
        console.log('API Response:', res.data)  // Debug

        const responseData = res.data.data || res.data
        
        // Handle paginated recent_activity
        const dashboardData = {
          ...responseData,
          recent_activity: responseData.recent_activity?.data || responseData.recent_activity || []
        }

        setData(dashboardData)
      } catch (err) {
        console.error('Dashboard fetch error:', err)
        console.error('Error response:', err.response?.data)
        setError(err.response?.data?.message || 'Failed to load dashboard.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, isAuthenticated, role, navigate])

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <CSpinner color="primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="alert alert-danger">
          <h5>Error loading dashboard</h5>
          <p>{error}</p>
          <button className="btn btn-sm btn-outline-danger" onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">
            Welcome back, {activeUser?.name || 'User'} 👋
          </h4>
          <p className="text-body-secondary mb-0">
            Workspace: {role ? role.toUpperCase() : 'UNKNOWN'}
          </p>
        </div>
      </div>

      {data && role === 'admin' && <AdminDashboard data={data} navigate={navigate} />}
      {data && role === 'employee' && <EmployeeDashboard data={data} navigate={navigate} />}
      {data && role === 'client' && <ClientDashboard data={data} />}

      {!data && !loading && (
        <div className="alert alert-warning">
          No dashboard data available for role: <strong>{role || 'none'}</strong>
        </div>
      )}
    </div>
  )
}

export default Dashboard