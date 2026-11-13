import Proposal from "../../models/Proposal";
import User from "../../models/User";
import Vehicle from "../../models/Vehicle";
import VehicleImage from "../../models/VehicleImage";
import { AppError } from "../../utils/AppError";
import { logger } from "../../utils/logger";
import { publishEvent } from "../../events/eventPublisher";
import {
  BuyerContactDTO,
  CreateProposalDTO,
  UpdateProposalStatusDTO,
} from "./dtos/proposal.dto";

// Função (e não objeto fixo): o Sequelize altera o objeto de include
// ao montar a consulta, então cada uso precisa de uma cópia nova.
const imagesInclude = () => ({
  model: VehicleImage,
  as: "images",
  attributes: ["id", "url"],
});

// Regras de negócio das propostas (Aggregate "Proposta").
export default class ProposalService {
  static async create(buyerId: string, dto: CreateProposalDTO) {
    const vehicle = await Vehicle.findByPk(dto.targetVehicleId);

    if (!vehicle) throw new AppError("Veículo não encontrado.", 404);

    if (String(vehicle.userId) === String(buyerId)) {
      throw new AppError("Não pode propor no seu veículo.", 400);
    }

    if (vehicle.status !== "available") {
      throw new AppError("Veículo indisponível.", 400);
    }

    const hasTrade = !!dto.offeredVehicleId;

    if (!hasTrade && dto.cashOffer <= 0) {
      throw new AppError("Valor deve ser maior que zero.", 400);
    }

    if (hasTrade && dto.cashOffer < 0) {
      throw new AppError("Valor não pode ser negativo.", 400);
    }

    if (dto.offeredVehicleId) {
      await ProposalService.validateTradeIn(dto.offeredVehicleId, buyerId);
    }

    const activeProposal = await Proposal.findOne({
      where: {
        targetVehicleId: dto.targetVehicleId,
        buyerId,
        status: ["PENDING", "IN_NEGOTIATION"],
      },
    });

    if (activeProposal) {
      throw new AppError(
        "Você já possui uma proposta ativa para este veículo.",
        409,
      );
    }

    const proposal = await Proposal.create({
      targetVehicleId: dto.targetVehicleId,
      buyerId,
      cashOffer: dto.cashOffer,
      offeredVehicleId: dto.offeredVehicleId,
      status: "PENDING",
      message: dto.message,
    });

    logger.info("proposta.criada", {
      proposalId: proposal.id,
      vehicleId: dto.targetVehicleId,
      buyerId,
      comTroca: hasTrade,
    });

    await publishEvent("proposta.criada", {
      proposalId: proposal.id,
      vehicleId: dto.targetVehicleId,
      buyerId,
      sellerId: vehicle.userId,
      comTroca: hasTrade,
    });

    return proposal;
  }

  // Vendedor aceita (abre negociação) ou recusa a proposta.
  static async updateStatus(
    proposalId: string,
    sellerId: string,
    dto: UpdateProposalStatusDTO,
  ): Promise<{ contact: BuyerContactDTO | null }> {
    const proposal = await Proposal.findByPk(proposalId, {
      include: [{ model: Vehicle, as: "targetVehicle" }],
    });

    if (!proposal) throw new AppError("Proposta não encontrada.", 404);

    if (String(proposal.targetVehicle?.userId) !== String(sellerId)) {
      throw new AppError("Acesso negado.", 403);
    }

    const validTransition =
      (proposal.status === "PENDING" &&
        ["IN_NEGOTIATION", "REJECTED"].includes(dto.status)) ||
      (proposal.status === "IN_NEGOTIATION" && dto.status === "REJECTED");

    if (!validTransition) {
      throw new AppError("Transição de status inválida.", 400);
    }

    const previousStatus = proposal.status;

    await proposal.update({ status: dto.status });

    logger.info("proposta.status_alterado", {
      proposalId: proposal.id,
      de: previousStatus,
      para: dto.status,
    });

    await publishEvent("proposta.status_alterado", {
      proposalId: proposal.id,
      vehicleId: proposal.targetVehicleId,
      buyerId: proposal.buyerId,
      de: previousStatus,
      para: dto.status,
    });

    if (dto.status !== "IN_NEGOTIATION") {
      return { contact: null };
    }

    // Dados de contato só são liberados quando a negociação começa.
    const buyer = await User.findByPk(proposal.buyerId, {
      attributes: ["name", "phone"],
    });

    return {
      contact: buyer ? { name: buyer.name, phone: buyer.phone } : null,
    };
  }

  // Anúncios do vendedor que têm propostas pendentes.
  static async listVehiclesWithPendingProposals(sellerId: string) {
    const vehicles = await Vehicle.findAll({
      where: { userId: sellerId },
      include: [
        {
          model: Proposal,
          as: "receivedProposals",
          where: { status: "PENDING" },
          attributes: ["id"],
          required: true,
        },
        imagesInclude(),
      ],
      order: [["createdAt", "DESC"]],
    });

    return vehicles.map((vehicle) => {
      const data = vehicle.get({ plain: true }) as any;

      return {
        ...data,
        pendingProposalCount: data.receivedProposals?.length ?? 0,
        receivedProposals: undefined,
      };
    });
  }

  static async listByVehicle(vehicleId: string, sellerId: string) {
    const vehicle = await Vehicle.findByPk(vehicleId);

    if (!vehicle) throw new AppError("Veículo não encontrado.", 404);

    if (String(vehicle.userId) !== String(sellerId)) {
      throw new AppError("Acesso negado.", 403);
    }

    return Proposal.findAll({
      where: { targetVehicleId: vehicleId },
      include: [
        { model: User, as: "buyer", attributes: ["name"] },
        { model: Vehicle, as: "offeredVehicle", include: [imagesInclude()] },
      ],
      order: [["createdAt", "DESC"]],
    });
  }

  // Só comprador e vendedor da proposta podem vê-la.
  static async getById(proposalId: string, userId: string) {
    const proposal = await Proposal.findByPk(proposalId, {
      include: [
        { model: User, as: "buyer", attributes: ["name", "phone", "email"] },
        { model: Vehicle, as: "targetVehicle", attributes: ["id", "userId"] },
        {
          model: Vehicle,
          as: "offeredVehicle",
          include: [{ model: VehicleImage, as: "images" }],
        },
      ],
    });

    if (!proposal) throw new AppError("Proposta não encontrada.", 404);

    const isBuyer = String(proposal.buyerId) === String(userId);
    const isSeller = String(proposal.targetVehicle?.userId) === String(userId);

    if (!isBuyer && !isSeller) {
      throw new AppError("Acesso negado.", 403);
    }

    return proposal;
  }

  // Negociações em andamento em que o usuário é o vendedor.
  static async listNegotiations(sellerId: string) {
    return Proposal.findAll({
      where: { status: "IN_NEGOTIATION" },
      include: [
        {
          model: Vehicle,
          as: "targetVehicle",
          where: { userId: sellerId },
          include: [imagesInclude()],
        },
        { model: User, as: "buyer", attributes: ["name", "phone", "email"] },
        { model: Vehicle, as: "offeredVehicle", include: [imagesInclude()] },
      ],
      order: [["updatedAt", "DESC"]],
    });
  }

  // Propostas enviadas pelo comprador; telefone do vendedor só aparece
  // depois que a negociação começa.
  static async listSentByBuyer(buyerId: string) {
    const proposals = await Proposal.findAll({
      where: { buyerId },
      include: [
        {
          model: Vehicle,
          as: "targetVehicle",
          include: [
            { model: User, as: "user", attributes: ["name", "phone"] },
            imagesInclude(),
          ],
        },
        { model: Vehicle, as: "offeredVehicle", include: [imagesInclude()] },
      ],
      order: [["createdAt", "DESC"]],
    });

    return proposals.map((proposal) => {
      const data = proposal.get({ plain: true }) as any;

      const canSeeContact =
        data.status === "IN_NEGOTIATION" || data.status === "ACCEPTED";

      if (!canSeeContact && data.targetVehicle?.user) {
        delete data.targetVehicle.user.phone;
      }

      return data;
    });
  }

  private static async validateTradeIn(
    offeredVehicleId: string,
    buyerId: string,
  ): Promise<void> {
    const offered = await Vehicle.findByPk(offeredVehicleId);

    if (!offered || String(offered.userId) !== String(buyerId)) {
      throw new AppError("O veículo deve ser seu.", 403);
    }

    if (offered.status !== "available") {
      throw new AppError("Veículo indisponível.", 400);
    }
  }
}
