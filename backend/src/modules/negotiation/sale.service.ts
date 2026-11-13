import { Op, Transaction } from "sequelize";
import sequelize from "../../config/database";
import Proposal from "../../models/Proposal";
import Vehicle from "../../models/Vehicle";
import { AppError } from "../../utils/AppError";
import { logger } from "../../utils/logger";
import { FinalizeSaleDTO } from "./dtos/proposal.dto";
import { invalidate, cacheKeys } from "../../cache/cacheService";
import { publishEvent } from "../../events/eventPublisher";

// Finalização da venda: encerra a negociação vencedora, marca os
// veículos envolvidos como vendidos e rejeita as demais propostas.
// Tudo em uma única transação.
export default class SaleService {
  static async finalize(
    vehicleId: string,
    sellerId: string,
    dto: FinalizeSaleDTO,
  ): Promise<void> {
    const soldVehicleIds: string[] = [vehicleId];
    let rejectedCount = 0;

    await sequelize.transaction(async (t) => {
      const vehicle = await Vehicle.findByPk(vehicleId, { transaction: t });

      if (!vehicle) throw new AppError("Veículo não encontrado.", 404);

      if (String(vehicle.userId) !== String(sellerId)) {
        throw new AppError("Operação negada: proprietário inválido.", 403);
      }

      if (vehicle.status === "sold") {
        throw new AppError("Este veículo já consta como vendido.", 400);
      }

      const winningProposal = await Proposal.findOne({
        where: {
          targetVehicleId: vehicleId,
          buyerId: dto.buyerId,
          status: "IN_NEGOTIATION",
        },
        transaction: t,
      });

      if (!winningProposal) {
        throw new AppError(
          "Não existe negociação ativa com este comprador.",
          400,
        );
      }

      await vehicle.update(
        { status: "sold", buyerId: dto.buyerId },
        { transaction: t },
      );

      await winningProposal.update({ status: "ACCEPTED" }, { transaction: t });

      // Veículos que saem do mercado com esta venda: o anunciado e,
      // se houver troca, o veículo oferecido pelo comprador.
      if (winningProposal.offeredVehicleId) {
        soldVehicleIds.push(winningProposal.offeredVehicleId);

        await Vehicle.update(
          { status: "sold", buyerId: sellerId },
          { where: { id: winningProposal.offeredVehicleId }, transaction: t },
        );
      }

      rejectedCount = await SaleService.rejectRelatedProposals(
        soldVehicleIds,
        winningProposal.id,
        t,
      );

      logger.info("veiculo.vendido", {
        vehicleId,
        sellerId,
        buyerId: dto.buyerId,
        comTroca: !!winningProposal.offeredVehicleId,
        propostasRejeitadas: rejectedCount,
      });
    });

    // Após a venda confirmada, os dados em cache ficam desatualizados.
    await invalidate(soldVehicleIds.map(cacheKeys.vehicleDetail), [
      cacheKeys.vehicleListPrefix,
    ]);

    // Evento publicado só depois da transação confirmada.
    await publishEvent("veiculo.vendido", {
      vehicleId,
      sellerId,
      buyerId: dto.buyerId,
      comTroca: soldVehicleIds.length > 1,
      propostasRejeitadas: rejectedCount,
    });
  }

  // Rejeita qualquer outra proposta ativa que tenha um dos veículos
  // vendidos como alvo ou como veículo oferecido na troca.
  private static async rejectRelatedProposals(
    vehicleIds: string[],
    winningProposalId: string,
    t: Transaction,
  ): Promise<number> {
    const [affected] = await Proposal.update(
      { status: "REJECTED" },
      {
        where: {
          id: { [Op.ne]: winningProposalId },
          status: ["PENDING", "IN_NEGOTIATION"],
          [Op.or]: [
            { targetVehicleId: vehicleIds },
            { offeredVehicleId: vehicleIds },
          ],
        },
        transaction: t,
      },
    );

    return affected;
  }
}
