import api from "./api";
import { IVehicle, VehiclesResponse } from "../types";

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
