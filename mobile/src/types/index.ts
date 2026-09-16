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
    phone?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface IReceivedProposalVehicle extends IVehicle {
  pendingProposalCount: number;
}

export interface VehiclesResponse {
  total: number;
  totalPages: number;
  vehicles: IVehicle[];
}

export interface IVehicleInput {
  brand: string;
  model: string;
  engine: string;
  transmission: string;
  location: string;
  mileage: number;
  price: number;
  description: string;
  features: string[];
  manufactureYear: number;
  modelYear: number;
}

export interface CreateVehicleResponse {
  message: string;
  vehicle: IVehicle;
}

export type ProposalStatus =
  | "PENDING"
  | "IN_NEGOTIATION"
  | "ACCEPTED"
  | "REJECTED";

export interface IProposal {
  id: string;
  cashOffer: number;
  status: ProposalStatus;
  message?: string | null;

  buyerId: string;
  targetVehicleId: string;
  offeredVehicleId?: string | null;

  buyer?: {
    name?: string;
    phone?: string;
    email?: string;
  };

  targetVehicle?: IVehicle;
  offeredVehicle?: IVehicle;
}

export interface CreateProposalInput {
  targetVehicleId: string;
  cashOffer: number;
  message?: string;
  offeredVehicleId?: string;
}

export interface CreateProposalResponse {
  message: string;
  proposal: IProposal;
}
