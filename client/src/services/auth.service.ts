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
