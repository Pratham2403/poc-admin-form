import api from '../api/axios.config';

export const submitResponse = async (data: any) => {
    const response = await api.post('/responses', data);
    return response.data;
};

export const getMyResponses = async () => {
    const response = await api.get('/responses/my');
    return response.data;
};

export const getFormResponses = async (formId: string) => {
    const response = await api.get(`/responses/form/${formId}`);
    return response.data;
};

export const updateResponse = async (id: string, answers: any) => {
    const response = await api.put(`/responses/${id}`, { answers });
    return response.data;
};
