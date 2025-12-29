import api from "../api/axios.config";

export interface CreateUserData {
  email: string;
  password?: string;
  name: string;
  role?: string;
  address?: string;
  city?: string;
  employeeId?: string;
  vendorId?: string;
  modulePermissions?: {
    users: boolean;
    forms: boolean;
  };
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: string;
  address?: string;
  city?: string;
  employeeId?: string;
  vendorId?: string;
  modulePermissions?: {
    users: boolean;
    forms: boolean;
  };
}

export interface UpdateProfileData {
  address?: string;
  city?: string;
}

export interface UserAnalytics {
  responseCount: number;
  formsRespondedTo: number;
  totalSubmissions: number;
  timeFilter: string;
}

export interface AdminAnalytics {
  activeUsersCount: number;
  draftFormsCount: number;
  peakActivityHours: string;
  heartbeatWindowHours: number;
}

export interface FormSubmissionItem {
  formId: string;
  formTitle: string;
  count: number;
}

export interface SubmissionsBreakdown {
  data: FormSubmissionItem[];
  total: number;
}

export const getUsers = async (page = 1, limit = 10, search = "") => {
  const response = await api.get("/users", {
    params: { page, limit, search },
  });
  return response.data;
};

export const getUserById = async (id: string) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (data: CreateUserData) => {
  const response = await api.post("/users", data);
  return response.data;
};

export const updateUser = async (id: string, data: UpdateUserData) => {
  const response = await api.put(`/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id: string) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

export const updateUserProfile = async (data: UpdateProfileData) => {
  console.log(data);
  const response = await api.put("/users/profile", data);
  return response.data;
};

export const getUserSubmissionCount = async (
  userId: string,
  timeFilter?: "today" | "month" | "all"
) => {
  const response = await api.get(`/users/${userId}/activity`, {
    params: { timeFilter: timeFilter || "all" },
  });
  return response.data;
};

export const getUserAnalytics = async (
  id: string,
  timeFilter?: "today" | "month" | "all"
): Promise<UserAnalytics> => {
  const response = await api.get(`/users/analytics/${id}`, {
    params: { timeFilter: timeFilter || "all" },
  });
  return response.data;
};

export const getAdminAnalytics = async (): Promise<AdminAnalytics> => {
  const response = await api.get("/users/analytics/admin");
  return response.data;
};

export const getUserSubmissionsBreakdown = async (
  id: string
): Promise<SubmissionsBreakdown> => {
  const response = await api.get(`/users/submissions/${id}`);
  return response.data;
};
