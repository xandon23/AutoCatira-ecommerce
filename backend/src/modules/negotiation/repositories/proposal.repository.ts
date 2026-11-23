import { Op, Transaction } from "sequelize";
import Proposal from "../../../models/Proposal";
import User from "../../../models/User";
import Vehicle from "../../../models/Vehicle";
import VehicleImage from "../../../models/VehicleImage";
import { ProposalStatus } from "../../../types";

const imagesInclude = () => ({
  model: VehicleImage,
  as: "images",
  attributes: ["id", "url"],
});

const ACTIVE_STATUSES: ProposalStatus[] = ["PENDING", "IN_NEGOTIATION"];

export interface NewProposal {
  targetVehicleId: string;
  buyerId: string;
  cashOffer: number;
  offeredVehicleId: string | null;
  message: string | null;
}

export const proposalRepository = {
  create(data: NewProposal) {
    return Proposal.create({ ...data, status: "PENDING" });
  },

  findActiveByBuyerAndVehicle(buyerId: string, targetVehicleId: string) {
    return Proposal.findOne({
      where: { buyerId, targetVehicleId, status: ACTIVE_STATUSES },
    });
  },

  findByIdWithTargetVehicle(id: string) {
    return Proposal.findByPk(id, {
      include: [{ model: Vehicle, as: "targetVehicle" }],
    });
  },

  findDetailedById(id: string) {
    return Proposal.findByPk(id, {
      include: [
        { model: User, as: "buyer", attributes: ["name", "phone", "email"] },
        { model: Vehicle, as: "targetVehicle", attributes: ["id", "userId"] },
        { model: Vehicle, as: "offeredVehicle", include: [{ model: VehicleImage, as: "images" }] },
      ],
    });
  },

  updateStatus(proposal: Proposal, status: ProposalStatus, t?: Transaction) {
    return proposal.update({ status }, { transaction: t });
  },

  findByTargetVehicle(vehicleId: string) {
    return Proposal.findAll({
      where: { targetVehicleId: vehicleId },
      include: [
        { model: User, as: "buyer", attributes: ["name"] },
        { model: Vehicle, as: "offeredVehicle", include: [imagesInclude()] },
      ],
      order: [["createdAt", "DESC"]],
    });
  },

  findNegotiationsBySeller(sellerId: string) {
    return Proposal.findAll({
      where: { status: "IN_NEGOTIATION" },
      include: [
        { model: Vehicle, as: "targetVehicle", where: { userId: sellerId }, include: [imagesInclude()] },
        { model: User, as: "buyer", attributes: ["name", "phone", "email"] },
        { model: Vehicle, as: "offeredVehicle", include: [imagesInclude()] },
      ],
      order: [["updatedAt", "DESC"]],
    });
  },

  findSentByBuyer(buyerId: string) {
    return Proposal.findAll({
      where: { buyerId },
      include: [
        {
          model: Vehicle,
          as: "targetVehicle",
          include: [{ model: User, as: "user", attributes: ["name", "phone"] }, imagesInclude()],
        },
        { model: Vehicle, as: "offeredVehicle", include: [imagesInclude()] },
      ],
      order: [["createdAt", "DESC"]],
    });
  },

  findNegotiationWithBuyer(vehicleId: string, buyerId: string, t?: Transaction) {
    return Proposal.findOne({
      where: { targetVehicleId: vehicleId, buyerId, status: "IN_NEGOTIATION" },
      transaction: t,
    });
  },

  async rejectActiveInvolvingVehicles(vehicleIds: string[], exceptProposalId: string, t?: Transaction) {
    const [affected] = await Proposal.update(
      { status: "REJECTED" },
      {
        where: {
          id: { [Op.ne]: exceptProposalId },
          status: ACTIVE_STATUSES,
          [Op.or]: [{ targetVehicleId: vehicleIds }, { offeredVehicleId: vehicleIds }],
        },
        transaction: t,
      },
    );
    return affected;
  },
};
