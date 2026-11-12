import fs from "fs";
import { sendError } from "../utils/httpError";
import path from "path";
import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import VehicleImage from "../models/VehicleImage";
import Vehicle from "../models/Vehicle";
import { IVehicleImage } from "../types";

export default class VehicleImageController {
  static async upload(req: Request, res: Response): Promise<Response> {
    try {
      const { vehicleId } = req.params;
      if (!req.file) throw new Error("Nenhuma imagem foi enviada.|400");

      await VehicleImageController.checkVehicleExists(vehicleId as string);
      const url = `/uploads/${req.file.filename}`;
      const image = await VehicleImage.create({ vehicleId, url });

      return res.status(201).json(image as IVehicleImage);
    } catch (error) {
      return sendError(res, error, 500);
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { imageId } = req.params;

      const image = await VehicleImageController.fetchImage(imageId as string);

      const vehicle = await Vehicle.findByPk(image.vehicleId);

      if (!vehicle) {
        throw new Error("Veículo não encontrado.|404");
      }

      if (String(vehicle.userId) !== String(req.userId)) {
        throw new Error(
          "Você não possui permissão para excluir esta imagem.|403",
        );
      }

      VehicleImageController.removePhysicalFile(image.url as string);

      await image.destroy();

      return res.status(200).json({
        message: "Imagem deletada com sucesso.",
      });
    } catch (error) {
      return sendError(res, error, 500);
    }
  }

  private static async checkVehicleExists(id: string): Promise<void> {
    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) throw new Error("Veículo não encontrado.|404");
  }

  private static async fetchImage(id: string): Promise<VehicleImage> {
    const image = await VehicleImage.findByPk(id);
    if (!image) throw new Error("Imagem não encontrada.|404");
    return image;
  }

  private static removePhysicalFile(url: string): void {
    const filename = url.split("/").pop();
    if (!filename) return;
    const filePath = path.resolve(__dirname, "..", "..", "uploads", filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

}
