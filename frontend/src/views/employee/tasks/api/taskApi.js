// src/features/employee/tasks/api/taskApi.js
import api from '../../../../api'

export const taskApi = {
  getTasks: (params = {}) => {
    return api.get('/api/employee/tasks', { params })
  },
  
  getTask: (id) => {
    return api.get(`/api/employee/tasks/${id}`)
  },
  
 updateStatus: (id, status) => {
  return api.patch(`/api/employee/tasks/${id}/status`, { status })
},
  
  addComment: (id, content) => {
    return api.post(`/api/employee/tasks/${id}/comments`, { content })
  }
}