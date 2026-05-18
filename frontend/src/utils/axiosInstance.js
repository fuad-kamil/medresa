import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000/api',     // ← Pointing to your backend
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to every request
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default axiosInstance;