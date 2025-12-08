import axios from 'axios';


const userStorageKey = import.meta.env.VITE_USER_STORAGE_KEY || 'user';
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
            originalRequest._retry = true;
            try {
                await api.post('/auth/refresh');
                return api(originalRequest);
            } catch (refreshError) {
                // If refresh fails, redirect to login or clear auth state if needed
                localStorage.removeItem(userStorageKey);
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
