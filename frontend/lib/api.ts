import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { clearSession, tokenStorage } from "@/lib/auth";
import type {
  AgentLifecycleSummary,
  AgentProvisionPayload,
  DashboardResponse,
  Field,
  FieldUpdate,
  User,
} from "@/lib/types";

const runtimeEnv = globalThis as {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

const api = axios.create({
  baseURL:
    runtimeEnv.process?.env?.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8000/api",
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearSession();
    }
    return Promise.reject(error);
  }
);

export async function login(username: string, password: string): Promise<string> {
  const response = await api.post("/auth/token/", { username, password });
  return response.data.access as string;
}

export async function getMe(): Promise<User> {
  const response = await api.get("/auth/me/");
  return response.data;
}

export async function getDashboardOverview(): Promise<DashboardResponse> {
  const response = await api.get("/dashboard/overview/");
  return response.data;
}

export async function createFieldUpdate(payload: {
  field: number;
  stage: "Planted" | "Growing" | "Ready" | "Harvested";
  notes: string;
}) {
  const response = await api.post("/field-updates/", payload);
  return response.data;
}

export async function listFieldUpdates() {
  const response = await api.get("/field-updates/");
  return response.data as FieldUpdate[];
}

// Field Management APIs
export async function listFields() {
  const response = await api.get("/fields/");
  return response.data as Field[];
}

export async function getField(id: number) {
  const response = await api.get(`/fields/${id}/`);
  return response.data as Field;
}

export async function createField(payload: {
  name: string;
  crop_type: string;
  planting_date: string;
  assigned_agent: number;
}) {
  const response = await api.post("/fields/", payload);
  return response.data as Field;
}

export async function updateField(
  id: number,
  payload: {
    name?: string;
    crop_type?: string;
    planting_date?: string;
    assigned_agent?: number;
  }
) {
  const response = await api.patch(`/fields/${id}/`, payload);
  return response.data as Field;
}

export async function deleteField(id: number) {
  await api.delete(`/fields/${id}/`);
}

export async function listFieldAgents() {
  const response = await api.get("/agents/");
  return response.data as User[];
}

export async function listAdminAgents() {
  const response = await api.get("/admin/agents/");
  return response.data as AgentLifecycleSummary[];
}

export async function createAgentAccount(payload: AgentProvisionPayload) {
  const response = await api.post("/admin/agents/", payload);
  return response.data as AgentLifecycleSummary;
}

export async function setAgentStatus(agentId: number, isActive: boolean) {
  const response = await api.patch(`/admin/agents/${agentId}/status/`, {
    is_active: isActive,
  });
  return response.data as { id: number; is_active: boolean };
}

export async function getAgentAuditFeed(agentId: number) {
  const response = await api.get(`/admin/agents/${agentId}/updates/`);
  return response.data as FieldUpdate[];
}

export default api;
