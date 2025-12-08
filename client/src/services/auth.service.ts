import api from '../api/axios.config';


export const login = async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
};

export const register = async (data: any) => {
    const response = await api.post('/auth/register', data);
    return response.data;
};

export const logout = async () => {
    await api.post('/auth/logout');
};

/**
 * Validate session by calling refresh endpoint
 * This fetches user data from the server, ensuring UI reflects actual session state
 */
export const validateSession = async () => {
    const response = await api.post('/auth/refresh');
    return response.data.user;
};
