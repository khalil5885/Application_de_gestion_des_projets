import axios from 'axios';

const api = axios.create({
    baseURL: 'http://project_manager.test', // Use the full Herd URL
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});

// Auto-attach Bearer token from localStorage on every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

export default api;