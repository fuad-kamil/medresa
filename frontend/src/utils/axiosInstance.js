import axios from 'axios';

let apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Defensively append /api if missing
if (apiURL && !apiURL.endsWith('/api') && !apiURL.endsWith('/api/')) {
    apiURL = apiURL.replace(/\/$/, '') + '/api';
}

// Warn in console if using fallback (helps catch missing env var on Vercel)
if (!import.meta.env.VITE_API_URL) {
    console.warn('⚠️ VITE_API_URL is not set. Falling back to:', apiURL, '— Set this in Vercel Environment Variables.');
}

const axiosInstance = axios.create({
    baseURL: apiURL,
    timeout: 30000,
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