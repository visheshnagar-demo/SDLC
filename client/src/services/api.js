import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getTodos = async ({
  status = "all",
  search = "",
  skip = 0,
  limit = 50,
} = {}) => {
  const params = { status, skip, limit };
  if (search && search.trim() !== "") {
    params.search = search.trim();
  }
  const response = await apiClient.get("/api/v1/todos", { params });
  return response.data;
};

export const createTodo = async ({ title, description }) => {
  const payload = {
    title: title.trim(),
    description:
      description && description.trim() !== "" ? description.trim() : null,
  };
  const response = await apiClient.post("/api/v1/todos", payload);
  return response.data;
};

export const getTodoById = async (id) => {
  const response = await apiClient.get(`/api/v1/todos/${id}`);
  return response.data;
};

export const updateTodo = async (id, { title, description, is_completed }) => {
  const payload = {};
  if (title !== undefined) {
    payload.title = title.trim();
  }
  if (description !== undefined) {
    payload.description =
      description && description.trim() !== "" ? description.trim() : null;
  }
  if (is_completed !== undefined) {
    payload.is_completed = Boolean(is_completed);
  }
  const response = await apiClient.put(`/api/v1/todos/${id}`, payload);
  return response.data;
};

export const deleteTodo = async (id) => {
  const response = await apiClient.delete(`/api/v1/todos/${id}`);
  return response.data;
};

export default {
  getTodos,
  createTodo,
  getTodoById,
  updateTodo,
  deleteTodo,
};
