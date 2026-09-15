import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

export const getKPIs = async (clusterName = "Small Town Value Cluster") => {
  const response = await apiClient.get("/api/v1/kpis", {
    params: { cluster_name: clusterName },
  });
  return response.data;
};

export const getSKUs = async (params = {}) => {
  const response = await apiClient.get("/api/v1/skus", { params });
  return response.data;
};

export const getScenarios = async () => {
  const response = await apiClient.get("/api/v1/scenarios");
  return response.data;
};

export const getScenarioByCode = async (code) => {
  const response = await apiClient.get(
    `/api/v1/scenarios/${encodeURIComponent(code)}`,
  );
  return response.data;
};

export const evaluateScenario = async (
  scenarioCode,
  clusterName = "Small Town Value Cluster",
) => {
  const response = await apiClient.post("/api/v1/scenarios/evaluate", {
    scenario_code: scenarioCode,
    cluster_name: clusterName,
  });
  return response.data;
};

export const submitApproval = async (payload) => {
  const response = await apiClient.post("/api/v1/approvals/submit", {
    scenario_code: payload.scenario_code,
    cluster_name: payload.cluster_name || "Small Town Value Cluster",
    manager_id: payload.manager_id || "MGR-8842",
    override_comments: payload.override_comments || null,
  });
  return response.data;
};

export const getApprovalHistory = async (skip = 0, limit = 20) => {
  const response = await apiClient.get("/api/v1/approvals/history", {
    params: { skip, limit },
  });
  return response.data;
};
