import api from "../api/axios.config";
import { type IForm } from "@poc-admin-form/shared";

export const createForm = async (data: Partial<IForm>) => {
  const response = await api.post("/forms", data);
  return response.data;
};

export const getForms = async (page = 1, limit = 9, search = "") => {
  const response = await api.get("/forms", { params: { page, limit, search } });
  return response.data;
};

export const getFormById = async (id: string) => {
  const response = await api.get(`/forms/${id}`);
  return response.data;
};

export const updateForm = async (id: string, data: Partial<IForm>) => {
  const response = await api.put(`/forms/${id}`, data);
  return response.data;
};

export const deleteForm = async (id: string) => {
  const response = await api.delete(`/forms/${id}`);
  return response.data;
};

export type TimeFilter = "today" | "month" | "all";

export interface FormStats {
  totalForms: number;
  publishedForms: number;
  totalResponses: number;
  timeFilter: string;
}

export const getFormStats = async (
  timeFilter: TimeFilter = "all"
): Promise<FormStats> => {
  const response = await api.get("/forms/stats", { params: { timeFilter } });
  return response.data;
};
