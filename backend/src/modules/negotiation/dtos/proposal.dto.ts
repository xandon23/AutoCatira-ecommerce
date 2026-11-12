import { AppError } from "../../../utils/AppError";

// DTOs (Data Transfer Objects) do contexto de Negociação: definem e
// validam o formato dos dados que entram pela API antes de chegar
// às regras de negócio.

export type ProposalDecision = "IN_NEGOTIATION" | "REJECTED";

export interface CreateProposalDTO {
  targetVehicleId: string;
  cashOffer: number;
  offeredVehicleId: string | null;
  message: string | null;
}

export interface UpdateProposalStatusDTO {
  status: ProposalDecision;
}

export interface FinalizeSaleDTO {
  buyerId: string;
}

export interface BuyerContactDTO {
  name: string;
  phone: string;
}

const MAX_MESSAGE_LENGTH = 500;

function isFilledString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function toCreateProposalDTO(body: unknown): CreateProposalDTO {
  const data = (body ?? {}) as Record<string, unknown>;

  if (!isFilledString(data.targetVehicleId)) {
    throw new AppError("Veículo da proposta não informado.", 400);
  }

  // Proposta só com veículo na troca: valor em dinheiro vira 0.
  const rawCash = data.cashOffer;
  const cashOffer =
    rawCash === undefined || rawCash === null || rawCash === ""
      ? 0
      : Number(rawCash);

  if (Number.isNaN(cashOffer)) {
    throw new AppError("Valor da proposta inválido.", 400);
  }

  const offeredVehicleId = isFilledString(data.offeredVehicleId)
    ? data.offeredVehicleId
    : null;

  const message = isFilledString(data.message) ? data.message.trim() : null;

  if (message && message.length > MAX_MESSAGE_LENGTH) {
    throw new AppError(
      `A mensagem deve ter no máximo ${MAX_MESSAGE_LENGTH} caracteres.`,
      400,
    );
  }

  return {
    targetVehicleId: data.targetVehicleId,
    cashOffer,
    offeredVehicleId,
    message,
  };
}

export function toUpdateProposalStatusDTO(
  body: unknown,
): UpdateProposalStatusDTO {
  const status = (body as Record<string, unknown> | undefined)?.status;

  if (status !== "IN_NEGOTIATION" && status !== "REJECTED") {
    throw new AppError("Status inválido.", 400);
  }

  return { status };
}

export function toFinalizeSaleDTO(body: unknown): FinalizeSaleDTO {
  const buyerId = (body as Record<string, unknown> | undefined)?.buyerId;

  if (!isFilledString(buyerId)) {
    throw new AppError("Comprador não informado.", 400);
  }

  return { buyerId };
}
