import api from '../api/axios.config';

export interface SystemSettings {
  heartbeat_window: number;
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const getSettings = async (): Promise<SystemSettings> => {
  const response = await api.get('/system-settings');
  return response.data;
};

export const updateSettings = async (data: Partial<SystemSettings>): Promise<SystemSettings> => {
  const response = await api.put('/system-settings', data);
  return response.data;
};

