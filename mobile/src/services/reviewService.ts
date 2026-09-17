import api from "./api";

export interface IPendingReview {
  proposalId: string;

  role: "BUYER" | "SELLER";

  reviewedUser: {
    id: string;
    name: string;
  };

  targetVehicle: {
    id: string;
    brand: string;
    model: string;
    modelYear: number;

    images?: {
      id: string;
      url: string;
    }[];
  };

  completedAt: string;
}

export interface IReceivedReview {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;

  reviewer: {
    id: string;
    name: string;
  };

  proposal?: {
    id: string;

    targetVehicle?: {
      id: string;
      brand: string;
      model: string;
      modelYear: number;
    };
  };
}

interface CreateReviewInput {
  proposalId: string;
  rating: number;
  comment?: string;
}

export async function getPendingReviews(): Promise<IPendingReview[]> {
  const response = await api.get<IPendingReview[]>("/reviews/pending");

  return response.data;
}

export async function getReceivedReviews(): Promise<IReceivedReview[]> {
  const response = await api.get<IReceivedReview[]>("/reviews/me");

  return response.data;
}

export async function createReview(
  data: CreateReviewInput,
): Promise<{ message: string }> {
  const response = await api.post<{
    message: string;
  }>("/reviews", data);

  return response.data;
}
