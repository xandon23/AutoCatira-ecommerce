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

interface VehicleImageUpload {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

export async function uploadVehicleImage(
  vehicleId: string,
  image: VehicleImageUpload,
): Promise<void> {
  const formData = new FormData();

  formData.append("image", {
    uri: image.uri,
    name: image.fileName || `vehicle-${Date.now()}.jpg`,
    type: image.mimeType || "image/jpeg",
  } as any);

  await api.post(`/vehicles/${vehicleId}/images`, formData);
}

interface UpdateVehicleResponse {
  message: string;
}

export async function updateVehicle(
  vehicleId: string,
  data: IVehicleInput,
): Promise<UpdateVehicleResponse> {
  const response = await api.put<UpdateVehicleResponse>(
    `/vehicles/${vehicleId}`,
    data,
  );

  return response.data;
}

export async function deleteVehicle(vehicleId: string): Promise<void> {
  await api.delete(`/vehicles/${vehicleId}`);
}

interface FinalizeSaleResponse {
  message: string;
}

export async function finalizeVehicleSale(
  vehicleId: string,
  buyerId: string,
): Promise<FinalizeSaleResponse> {
  const response = await api.patch<FinalizeSaleResponse>(
    `/vehicles/${vehicleId}/sell`,
    {
      buyerId,
    },
  );

  return response.data;
}
