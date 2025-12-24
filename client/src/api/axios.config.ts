import axios from 'axios';


const userStorageKey = import.meta.env.VITE_USER_STORAGE_KEY || 'user';

const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

// Store CSRF token
let csrfToken: string | null = null;

const api = axios.create({
    baseURL: baseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add CSRF token
api.interceptors.request.use(
    async (config) => {
        // Get CSRF token if we don't have it
        if (!csrfToken) {
            try {
                const response = await axios.get(`${baseURL}/auth/csrf-token`, {
                    withCredentials: true,
                });
                csrfToken = response.data.csrfToken;
            } catch (error) {
                console.error('Failed to get CSRF token:', error);
            }
        }

        // Add CSRF token to headers for state-changing requests
        if (csrfToken && config.method && !['get', 'head', 'options'].includes(config.method.toLowerCase())) {
            config.headers['X-CSRF-Token'] = csrfToken;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle CSRF token errors
        if (error.response?.status === 403 && error.response?.data?.message?.includes('CSRF')) {
            // Clear CSRF token and retry
            csrfToken = null;
            if (!originalRequest._retryCSRF) {
                originalRequest._retryCSRF = true;
                return api(originalRequest);
            }
        }

        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
            originalRequest._retry = true;
            try {
                await api.post('/auth/refresh');
                return api(originalRequest);
            } catch (refreshError) {
                // If refresh fails, redirect to login or clear auth state if needed
                localStorage.removeItem(userStorageKey);
                csrfToken = null; // Clear CSRF token on logout
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
