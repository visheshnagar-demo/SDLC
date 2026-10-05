import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Books API
export const getBooks = async (params = {}) => {
  const response = await apiClient.get("/books", { params });
  return response.data;
};

export const getBook = async (bookId) => {
  const response = await apiClient.get(`/books/${bookId}`);
  return response.data;
};

export const createBook = async (bookData) => {
  const response = await apiClient.post("/books", bookData);
  return response.data;
};

export const updateBook = async (bookId, bookData) => {
  const response = await apiClient.put(`/books/${bookId}`, bookData);
  return response.data;
};

export const deleteBook = async (bookId) => {
  const response = await apiClient.delete(`/books/${bookId}`);
  return response.data;
};

// Patrons API
export const getPatrons = async (params = {}) => {
  const response = await apiClient.get("/patrons", { params });
  return response.data;
};

export const getPatron = async (patronId) => {
  const response = await apiClient.get(`/patrons/${patronId}`);
  return response.data;
};

export const createPatron = async (patronData) => {
  const response = await apiClient.post("/patrons", patronData);
  return response.data;
};

export const updatePatron = async (patronId, patronData) => {
  const response = await apiClient.put(`/patrons/${patronId}`, patronData);
  return response.data;
};

export const getPatronLoans = async (patronId) => {
  const response = await apiClient.get(`/patrons/${patronId}/loans`);
  return response.data;
};

// Loans & Circulation API
export const getLoans = async (params = {}) => {
  const response = await apiClient.get("/loans", { params });
  return response.data;
};

export const getOverdueLoans = async () => {
  const response = await apiClient.get("/loans/overdue");
  return response.data;
};

export const checkoutBook = async (checkoutData) => {
  const response = await apiClient.post("/loans/checkout", checkoutData);
  return response.data;
};

export const returnBook = async (loanId) => {
  const response = await apiClient.post(`/loans/${loanId}/return`);
  return response.data;
};

// Health Check API
export const checkHealth = async () => {
  const response = await apiClient.get("/health");
  return response.data;
};

export default {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  getPatrons,
  getPatron,
  createPatron,
  updatePatron,
  getPatronLoans,
  getLoans,
  getOverdueLoans,
  checkoutBook,
  returnBook,
  checkHealth,
};
