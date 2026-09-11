import api from "./api";
import {
  CreateVehicleResponse,
  IVehicle,
  IVehicleInput,
  VehiclesResponse,
} from "../types";

export async function getVehicles(
  page = 1,
  limit = 20,
): Promise<VehiclesResponse> {
  const response = await api.get<VehiclesResponse>(
    `/vehicles?page=${page}&limit=${limit}`,
  );

  return response.data;
}

export async function getVehicleById(id: string): Promise<IVehicle> {
  const response = await api.get<IVehicle>(`/vehicles/${id}`);

  return response.data;
}

export async function getMyVehicles(): Promise<IVehicle[]> {
  const response = await api.get<IVehicle[]>("/vehicles/mine");

  return response.data;
}

export async function createVehicle(
  data: IVehicleInput,
): Promise<CreateVehicleResponse> {
  const response = await api.post<CreateVehicleResponse>("/vehicles", data);

  return response.data;
}
