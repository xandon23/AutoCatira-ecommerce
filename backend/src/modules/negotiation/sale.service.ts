import sequelize from "../../config/database";
import { AppError } from "../../utils/AppError";
import { logger } from "../../utils/logger";
import { FinalizeSaleDTO } from "./dtos/proposal.dto";
import { invalidate, cacheKeys } from "../../cache/cacheService";
import { publishEvent } from "../../events/eventPublisher";
import { proposalRepository } from "./repositories/proposal.repository";
import { negotiationVehicleRepository } from "./repositories/vehicle.repository";

// Serviço de domínio "Finalizar Venda": encerra a negociação vencedora,
// marca os veículos envolvidos como vendidos e rejeita as demais
// propostas. Tudo em uma única transação.
export default class SaleService {
  static async finalize(
    vehicleId: string,
    sellerId: string,
    dto: FinalizeSaleDTO,
  ): Promise<void> {
    const soldVehicleIds: string[] = [vehicleId];
    let rejectedCount = 0;
    let vehicleTitle = "";

    await sequelize.transaction(async (t) => {
      const vehicle = await negotiationVehicleRepository.findById(vehicleId, t);

      if (!vehicle) throw new AppError("Veículo não encontrado.", 404);

      if (String(vehicle.userId) !== String(sellerId)) {
        throw new AppError("Operação negada: proprietário inválido.", 403);
      }

      if (vehicle.status === "sold") {
        throw new AppError("Este veículo já consta como vendido.", 400);
      }

      vehicleTitle = `${vehicle.brand} ${vehicle.model}`;

      const winningProposal = await proposalRepository.findNegotiationWithBuyer(
        vehicleId,
        dto.buyerId,
        t,
      );

      if (!winningProposal) {
        throw new AppError(
          "Não existe negociação ativa com este comprador.",
          400,
        );
      }

      await negotiationVehicleRepository.markAsSold(vehicle, dto.buyerId, t);
      await proposalRepository.updateStatus(winningProposal, "ACCEPTED", t);

      // Veículos que saem do mercado com esta venda: o anunciado e,
      // se houver troca, o veículo oferecido pelo comprador.
      if (winningProposal.offeredVehicleId) {
        soldVehicleIds.push(winningProposal.offeredVehicleId);
        await negotiationVehicleRepository.markAsSoldById(
          winningProposal.offeredVehicleId,
          sellerId,
          t,
        );
      }

      rejectedCount = await proposalRepository.rejectActiveInvolvingVehicles(
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
      vehicleTitle,
      sellerId,
      buyerId: dto.buyerId,
      comTroca: soldVehicleIds.length > 1,
      propostasRejeitadas: rejectedCount,
    });
  }
}
