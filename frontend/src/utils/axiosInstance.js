import axios from 'axios';

let apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Defensively append /api if missing
if (apiURL && !apiURL.endsWith('/api') && !apiURL.endsWith('/api/')) {
    apiURL = apiURL.replace(/\/$/, '') + '/api';
}

// Warn in console if using fallback (helps catch missing env var on Vercel)
if (!import.meta.env.VITE_API_URL) {
    console.warn('⚠️ VITE_API_URL is not set. Falling back to:', apiURL);
}

const axiosInstance = axios.create({
    baseURL: apiURL,
    // 60s timeout — Render free-tier cold starts can take up to 50 seconds
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ── Auth token interceptor ────────────────────────────────────────────────────
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── Auto-retry on network errors (Render cold-start) ─────────────────────────
// Retries up to 4 times: 5s, 10s, 15s, 20s delays.
// Render free-tier cold starts take 30-50 seconds — we need longer waits than typical.
// Only retries on network-level failures, NOT on 4xx/5xx HTTP errors.
axiosInstance.interceptors.response.use(
    // Success — pass through unchanged
    (response) => response,

    async (error) => {
        const config = error.config;

        // Don't retry if:
        // 1. We already retried the max number of times
        // 2. The server returned an actual HTTP error (4xx/5xx) — only retry true network failures
        // 3. No config (shouldn't happen, but guard anyway)
        const isNetworkError = !error.response && (
            error.code === 'ERR_NETWORK' ||
            error.code === 'ERR_CONNECTION_CLOSED' ||
            error.code === 'ECONNABORTED' ||
            error.code === 'ECONNRESET' ||
            error.message === 'Network Error'
        );

        if (!config || !isNetworkError) {
            return Promise.reject(error);
        }

        config._retryCount = config._retryCount || 0;
        const MAX_RETRIES = 4;

        if (config._retryCount >= MAX_RETRIES) {
            return Promise.reject(error);
        }

        config._retryCount += 1;
        const delayMs = 5000 * config._retryCount; // 5s, 10s, 15s, 20s
        console.warn(`🔄 Network error — retrying (${config._retryCount}/${MAX_RETRIES}) in ${delayMs / 1000}s…`, config.url);

        await new Promise(resolve => setTimeout(resolve, delayMs));
        return axiosInstance(config);
    }
);

export default axiosInstance;