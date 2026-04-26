import React, { useEffect, useState } from 'react'
import { CSpinner } from '@coreui/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import AdminDashboard from './components/AdminDashboard'
import EmployeeDashboard from './components/EmployeeDashboard'
import ClientDashboard from './components/ClientDashboard'
import Charts from '../charts/Charts'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let currentRole = user?.global_role
    if (!currentRole) {
      const saved = localStorage.getItem('user')
      if (saved) currentRole = JSON.parse(saved).global_role
    }

    if (!currentRole) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      setLoading(true)
      try {
        const endpoints = {
          admin: '/api/admin/dashboard',
          employee: '/api/employee/dashboard',
          client: '/api/client/dashboard',
        }
        const res = await api.get(endpoints[currentRole])
        setData(res.data.data)
      } catch (err) {
        setError('Failed to load dashboard.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <CSpinner color="primary" />
      </div>
    )
  }

  if (error) return <p className="text-danger p-4">{error}</p>

  const activeUser = user || JSON.parse(localStorage.getItem('user'))
  const role = activeUser?.global_role

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Welcome back, {activeUser?.name || 'User'} 👋</h4>
          <p className="text-body-secondary mb-0">Workspace: {role?.toUpperCase()}</p>
        </div>
      </div>
      <Charts />
      
      {data && role === 'admin' && <AdminDashboard data={data} navigate={navigate} />}
      {data && role === 'employee' && <EmployeeDashboard data={data} navigate={navigate} />}
      {data && role === 'client' && <ClientDashboard data={data} />}

      {!data && !loading && <p>No data available for your role.</p>}
    </div>
  )
}

export default Dashboard
