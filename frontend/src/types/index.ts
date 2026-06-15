export interface IUser {
  id?: string;
  name?: string;
  email?: string;
  password?: string;
  cpf?: string;
  phone?: string;
  birthDate?: string | Date;
}

export interface IVehicle {
  id?: string;
  brand: string;
  model: string;
  engine?: string;
  transmission?: string;
  manufactureYear?: number | string;
  modelYear?: number | string;
  price: number;
  mileage?: number;
  location?: string;
  description?: string;
  features?: string[];
  userId?: string;
  status?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  images?: { id?: string; url: string }[];
  user?: { name: string; email?: string };
  Buyer?: { name: string };
}

export interface IProposal {
  id?: string;
  targetVehicleId: string;
  cashOffer: number | string;
  offeredVehicleId?: string;
  status?: string;
  message?: string;
  buyerId?: string;
  buyer?: { name: string; email?: string };
  targetVehicle?: IVehicle;
}

export interface IReview {
  id?: string;
  reviewerId?: string;
  reviewedId: string;
  rating: number;
  comment?: string;
  createdAt?: string;
  reviewer?: { name: string };
}

export interface IVehicleImage {
  id?: string;
  url: string;
  vehicleId?: string;
}
