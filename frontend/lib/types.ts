export type UserRole = "admin" | "agent";

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active?: boolean;
}

export interface AgentLifecycleSummary extends User {
  assigned_fields_count: number;
  active_fields_count: number;
  at_risk_fields_count: number;
  completed_fields_count: number;
  updates_count: number;
}

export interface AgentProvisionPayload {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
}

export interface Field {
  id: number;
  name: string;
  crop_type: string;
  planting_date: string;
  current_stage: "Planted" | "Growing" | "Ready" | "Harvested";
  assigned_agent: number;
  assigned_agent_name: string;
  status: "Completed" | "At Risk" | "Active";
  last_update_at: string;
}

export interface FieldUpdate {
  id: number;
  field: number;
  agent: number;
  agent_name: string;
  stage: "Planted" | "Growing" | "Ready" | "Harvested";
  notes: string;
  created_at: string;
}

export interface DashboardResponse {
  total_fields: number;
  status_breakdown: {
    Completed: number;
    "At Risk": number;
    Active: number;
  };
  fields: Field[];
  recent_updates: FieldUpdate[];
}
