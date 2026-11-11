import { Response, NextFunction } from "express";
import Vehicle from "../models/Vehicle";
import { AuthRequest } from "./authMiddleware";

export async function vehicleOwnershipMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { vehicleId } = req.params;

    const vehicle = await Vehicle.findByPk(vehicleId as string);

    if (!vehicle) {
      return res.status(404).json({
        error: "Veículo não encontrado.",
      });
    }

    if (String(vehicle.userId) !== String(req.userId)) {
      return res.status(403).json({
        error: "Você não possui permissão para alterar este veículo.",
      });
    }

    return next();
  } catch (error) {
    return res.status(500).json({
      error: "Erro ao validar proprietário do veículo.",
    });
  }
}
