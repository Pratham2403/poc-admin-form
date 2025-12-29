import api from "../api/axios.config";
import type { DateRange } from "../utils/dateRange.utils";

export const submitResponse = async (data: any) => {
  const response = await api.post("/responses", data);
  return response.data;
};

export const getMyResponses = async (
  page = 1,
  limit = 10,
  options?: { range?: DateRange; formIds?: string[] }
) => {
  const formIds = options?.formIds?.filter(Boolean);
  const response = await api.get(`/responses/my`, {
    params: {
      page,
      limit,
      startDate: options?.range?.startDate,
      endDate: options?.range?.endDate,
      formIds: formIds && formIds.length > 0 ? formIds.join(",") : undefined,
    },
  });
  return response.data;
};

export const getMyRespondedForms = async () => {
  const response = await api.get("/responses/my/forms");
  return response.data;
};

export const updateResponse = async (id: string, answers: any) => {
  const response = await api.put(`/responses/${id}`, { answers });
  return response.data;
};

export const getResponseById = async (id: string) => {
  const response = await api.get(`/responses/${id}`);
  return response.data;
};

export const getMySubmissionCount = async (range?: DateRange) => {
  const response = await api.get("/responses/my/count", {
    params: {
      startDate: range?.startDate,
      endDate: range?.endDate,
    },
  });
  return response.data;
};
