import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://prodforge-backend.onrender.com",
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.params = { ...config.params, token };
  }
  return config;
});

export default API;

// ── Auth ──────────────────────────────────────────────────
export const demoLogin = () => API.get("/api/users/demo-login");
export const loginWithGoogle = (data: {
  google_id: string;
  email: string;
  name?: string;
  picture?: string;
}) => API.post("/api/users/login", data);
export const getMe = () => API.get("/api/users/me");

// ── Tasks ─────────────────────────────────────────────────
export const forgeTask = (data: {
  title: string;
  deadline_days: number;
  description?: string;
}) => API.post("/api/tasks/forge", data);

export const getTasks = () => API.get("/api/tasks/");
export const getTask = (id: string) => API.get(`/api/tasks/${id}`);
export const updateTaskStatus = (id: string, status: string) =>
  API.patch(`/api/tasks/${id}/status`, null, { params: { status } });
export const updateSubtaskStatus = (id: string, status: string) =>
  API.patch(`/api/tasks/subtasks/${id}/status`, { status });
export const deleteTask = (id: string) => API.delete(`/api/tasks/${id}`);
export const getRescuePlan = (id: string, deadline_hours: number) =>
  API.post(`/api/tasks/${id}/rescue`, { deadline_hours });

// ── Analytics ─────────────────────────────────────────────
export const getDashboard = () => API.get("/api/analytics/dashboard");
export const getWeekly = () => API.get("/api/analytics/weekly");

// ── Coach ─────────────────────────────────────────────────
export const getInsight = () => API.get("/api/coach/insight");