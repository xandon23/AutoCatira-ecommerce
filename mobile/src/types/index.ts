export type UserRole = "USER" | "ADMIN";

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: IUser;
}

export interface IVehicleImage {
  id: string;
  vehicleId?: string;
  url: string;
}

export interface IVehicle {
  id: string;
  brand: string;
  model: string;
  manufactureYear: number;
  modelYear: number;
  engine: string;
  transmission: string;
  location: string;
  mileage: number;
  price: number;
  description: string;
  features: string[];
  status: "available" | "sold";
  userId: string;
  buyerId?: string | null;
  images?: IVehicleImage[];
  user?: {
    name?: string;
    email?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface VehiclesResponse {
  total: number;
  totalPages: number;
  vehicles: IVehicle[];
}
