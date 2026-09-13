import api from "./api";

import {
  CreateProposalInput,
  CreateProposalResponse,
  IProposal,
  ProposalStatus,
} from "../types";

export async function createProposal(
  data: CreateProposalInput,
): Promise<CreateProposalResponse> {
  const response = await api.post<CreateProposalResponse>("/proposals", data);

  return response.data;
}

export async function getProposalsByVehicle(
  vehicleId: string,
): Promise<IProposal[]> {
  const response = await api.get<IProposal[]>(
    `/proposals/vehicle/${vehicleId}`,
  );

  return response.data;
}

export async function updateProposalStatus(
  proposalId: string,
  status: ProposalStatus,
): Promise<{ message: string }> {
  const response = await api.patch<{
    message: string;
  }>(`/proposals/${proposalId}/status`, { status });

  return response.data;
}
