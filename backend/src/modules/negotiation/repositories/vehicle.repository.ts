import { Transaction } from "sequelize";
import Proposal from "../../../models/Proposal";
import User from "../../../models/User";
import Vehicle from "../../../models/Vehicle";
import VehicleImage from "../../../models/VehicleImage";

export const negotiationVehicleRepository = {
  findById(id: string, t?: Transaction) {
    return Vehicle.findByPk(id, { transaction: t });
  },

  markAsSold(vehicle: Vehicle, buyerId: string, t?: Transaction) {
    return vehicle.update({ status: "sold", buyerId }, { transaction: t });
  },

  markAsSoldById(id: string, buyerId: string, t?: Transaction) {
    return Vehicle.update({ status: "sold", buyerId }, { where: { id }, transaction: t });
  },

  findSellerVehiclesWithPendingProposals(sellerId: string) {
    return Vehicle.findAll({
      where: { userId: sellerId },
      include: [
        {
          model: Proposal,
          as: "receivedProposals",
          where: { status: "PENDING" },
          attributes: ["id"],
          required: true,
        },
        { model: VehicleImage, as: "images", attributes: ["id", "url"] },
      ],
      order: [["createdAt", "DESC"]],
    });
  },

  findBuyerContact(userId: string) {
    return User.findByPk(userId, { attributes: ["name", "phone"] });
  },
};
