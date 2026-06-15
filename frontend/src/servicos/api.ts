import axios from "axios";
import { IUser, IVehicle, IProposal, IReview, IVehicleImage } from "../types";

export const API_BASE_URL = "http://localhost:3333";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token.trim()}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const login = async (
  email: string,
  password: string,
): Promise<{ user: IUser; token: string }> => {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
};

// ─── USERS ────────────────────────────────────────────────────────────────────
export const createUser = async (data: IUser): Promise<IUser> => {
  const res = await api.post("/users", data);
  return res.data;
};

export const getAllUsers = async (
  page = 1,
  limit = 10,
): Promise<{ users: IUser[]; total: number }> => {
  const res = await api.get(`/users?page=${page}&limit=${limit}`);
  return res.data;
};

export const getUserById = async (id: string): Promise<IUser> => {
  const res = await api.get(`/users/${id}`);
  return res.data;
};

export const updateUser = async (id: string, data: IUser): Promise<IUser> => {
  const res = await api.put(`/users/${id}`, data);
  return res.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}`);
};

// ─── VEHICLES ─────────────────────────────────────────────────────────────────
export const getVehicles = async (
  page = 1,
  limit = 10,
): Promise<{ vehicles: IVehicle[]; total: number }> => {
  const res = await api.get(`/vehicles?page=${page}&limit=${limit}`);
  return res.data;
};

export const getVehicleById = async (id: string): Promise<IVehicle> => {
  const res = await api.get(`/vehicles/${id}`);
  return res.data;
};

export const createVehicle = async (data: IVehicle): Promise<IVehicle> => {
  const res = await api.post("/vehicles", data);
  return res.data;
};

export const updateVehicle = async (
  id: string,
  data: IVehicle,
): Promise<IVehicle> => {
  const res = await api.put(`/vehicles/${id}`, data);
  return res.data;
};

export const deleteVehicle = async (id: string): Promise<void> => {
  await api.delete(`/vehicles/${id}`);
};

// ─── VEHICLE IMAGES ───────────────────────────────────────────────────────────
export const addVehicleImage = async (
  vehicleId: string,
  data: FormData,
): Promise<IVehicleImage> => {
  const res = await api.post(`/vehicles/${vehicleId}/images`, data);
  return res.data;
};

export const deleteVehicleImage = async (id: string): Promise<void> => {
  await api.delete(`/images/${id}`);
};

// ─── PROPOSALS ────────────────────────────────────────────────────────────────
export const createProposal = async (data: IProposal): Promise<IProposal> => {
  const res = await api.post("/proposals", data);
  return res.data;
};

export const getProposalsByVehicle = async (
  vehicleId: string,
): Promise<IProposal[]> => {
  const res = await api.get(`/proposals/vehicle/${vehicleId}`);
  return res.data;
};

export const updateProposalStatus = async (
  id: string,
  status: string,
): Promise<IProposal> => {
  const res = await api.put(`/proposals/${id}/status`, { status });
  return res.data;
};

// ─── REVIEWS ──────────────────────────────────────────────────────────────────
export const createReview = async (data: IReview): Promise<IReview> => {
  const res = await api.post("/reviews", data);
  return res.data;
};

export const getReviewsByUser = async (userId: string): Promise<IReview[]> => {
  const res = await api.get(`/reviews/user/${userId}`);
  return res.data;
};

// ─── HELPER ───────────────────────────────────────────────────────────────────
export const getImageUrl = (filename: string | undefined): string | null => {
  if (!filename) return null;
  const cleanFilename = filename.startsWith("/")
    ? filename.substring(1)
    : filename;
  return `${API_BASE_URL}/${cleanFilename}`;
};

export default api;
