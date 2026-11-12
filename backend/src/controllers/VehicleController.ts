import { Request, Response } from "express";
import { sendError } from "../utils/httpError";
import { AuthRequest } from "../middlewares/authMiddleware";
import Vehicle from "../models/Vehicle";
import User from "../models/User";
import VehicleImage from "../models/VehicleImage";
import sequelize from "../config/database";
import Proposal from "../models/Proposal";
import { Op } from "sequelize";
import { IVehicle } from "../types";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";
import {
  CACHE_TTL,
  cacheKeys,
  getOrSet,
  invalidateVehicle,
} from "../cache/cacheService";

export default class VehicleController {
  static async create(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const data = req.body as IVehicle;
      VehicleController.validateVehicleData(data);

      const vehicle = await Vehicle.create({
        ...VehicleController.whitelist(data),
        status: "available",
        userId: req.userId,
      });

      logger.info("anuncio.criado", { vehicleId: vehicle.id, userId: req.userId });

      await invalidateVehicle();

      return res
        .status(201)
        .json({ message: "Anunciado com sucesso!", vehicle });
    } catch (error) {
      return sendError(res, error, 400);
    }
  }

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      // Paginação saneada: página >= 1 e no máximo 50 itens por página.
      const page = Math.max(1, Math.floor(Number(req.query.page)) || 1);
      const limit = Math.min(
        50,
        Math.max(1, Math.floor(Number(req.query.limit)) || 10),
      );
      const includeSold = req.query.includeSold === "true";
      const offset = (page - 1) * limit;
      const where = includeSold ? {} : { status: { [Op.ne]: "sold" } };

      const { data, cache } = await getOrSet(
        cacheKeys.vehicleList(page, limit, includeSold),
        CACHE_TTL.vehicleList,
        async () => {
          const { count, rows } = await Vehicle.findAndCountAll({
            where,
            limit,
            offset,
            order: [["createdAt", "DESC"]],
            include: [
              {
                model: User,
                as: "user",
                attributes: ["name"],
              },
              {
                model: VehicleImage,
                as: "images",
                attributes: ["id", "url"],
              },
            ],
          });

          return {
            total: count,
            totalPages: Math.ceil(count / limit),
            vehicles: rows.map((row) => row.toJSON()),
          };
        },
      );

      res.setHeader("X-Cache", cache);
      return res.status(200).json(data);
    } catch (error) {
      return sendError(res, error, 500);
    }
  }

  static async getMine(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const vehicles = await Vehicle.findAll({
        where: {
          userId: req.userId,
          status: "available",
        },
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: User,
            as: "user",
            attributes: ["name", "email"],
          },
          {
            model: VehicleImage,
            as: "images",
            attributes: ["id", "url"],
          },
        ],
      });

      return res.status(200).json(vehicles);
    } catch (error) {
      return sendError(res, error, 500);
    }
  }

  static async getSold(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const vehicles = await Vehicle.findAll({
        where: {
          userId: req.userId,
          status: "sold",
        },

        order: [["updatedAt", "DESC"]],

        include: [
          {
            model: User,
            as: "Buyer",
            attributes: ["id", "name"],
          },
          {
            model: VehicleImage,
            as: "images",
            attributes: ["id", "url"],
          },
        ],
      });

      return res.status(200).json(vehicles);
    } catch (error) {
      return sendError(res, error, 500);
    }
  }

  static async getSoldById(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const id = req.params.id as string;

      const vehicle = await Vehicle.findOne({
        where: {
          id,
          userId: req.userId,
          status: "sold",
        },

        include: [
          {
            model: User,
            as: "Buyer",
            attributes: ["id", "name", "phone", "email"],
          },
          {
            model: VehicleImage,
            as: "images",
            attributes: ["id", "url"],
          },
        ],
      });

      if (!vehicle) {
        throw new Error("Veículo vendido não encontrado|404");
      }

      const proposal = await Proposal.findOne({
        where: {
          status: "ACCEPTED",

          [Op.or]: [
            {
              targetVehicleId: id,
            },
            {
              offeredVehicleId: id,
            },
          ],
        },

        include: [
          {
            model: User,
            as: "buyer",
            attributes: ["id", "name"],
          },

          {
            model: Vehicle,
            as: "targetVehicle",
            attributes: [
              "id",
              "brand",
              "model",
              "manufactureYear",
              "modelYear",
              "userId",
            ],
          },

          {
            model: Vehicle,
            as: "offeredVehicle",
            attributes: [
              "id",
              "brand",
              "model",
              "manufactureYear",
              "modelYear",
            ],
          },
        ],
      });

      let saleType: "SALE" | "TRADE" | null = null;

      if (proposal) {
        saleType =
          String(proposal.targetVehicleId) === String(id) ? "SALE" : "TRADE";
      }

      return res.status(200).json({
        vehicle,
        proposal,
        saleType,
      });
    } catch (error) {
      return sendError(res, error, 500);
    }
  }

  static async getById(req: Request, res: Response): Promise<Response> {
    try {
      const id = req.params.id as string;

      const { data, cache } = await getOrSet(
        cacheKeys.vehicleDetail(id),
        CACHE_TTL.vehicleDetail,
        async () => {
          const vehicle = await Vehicle.findByPk(id, {
            include: VehicleController.getIncludes(false),
          });

          if (!vehicle) throw new AppError("Veículo não encontrado", 404);

          return vehicle.toJSON();
        },
      );

      res.setHeader("X-Cache", cache);
      return res.status(200).json(data);
    } catch (error) {
      return sendError(res, error, 500);
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const id = req.params.id as string;

      const vehicle = await VehicleController.authorize(id, req.userId);

      if (vehicle.status === "sold") {
        throw new Error("Veículos vendidos não podem ser alterados|400");
      }

      const data = req.body as IVehicle;

      VehicleController.validateVehicleData(data);

      await vehicle.update(VehicleController.whitelist(data));

      logger.info("anuncio.atualizado", { vehicleId: id, userId: req.userId });

      await invalidateVehicle(id);

      return res
        .status(200)
        .json({ message: "Anúncio atualizado com sucesso!" });
    } catch (error) {
      return sendError(res, error, 400);
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<Response> {
    const t = await sequelize.transaction();
    try {
      const id = req.params.id as string;
      const vehicle = await VehicleController.authorize(id, req.userId);
      if (vehicle.status === "sold") {
        throw new AppError("Veículos vendidos não podem ser excluídos", 400);
      }

      const relatedToVehicle = {
        [Op.or]: [{ targetVehicleId: id }, { offeredVehicleId: id }],
      };

      // Não exclui anúncio com negociação em andamento (como alvo ou troca).
      const activeNegotiation = await Proposal.count({
        where: { ...relatedToVehicle, status: ["IN_NEGOTIATION", "ACCEPTED"] },
        transaction: t,
      });

      if (activeNegotiation > 0) {
        throw new AppError(
          "Não é possível excluir um anúncio com negociação em andamento.",
          400,
        );
      }

      // Propostas pendentes ou recusadas ligadas ao veículo saem junto.
      const removedProposals = await Proposal.destroy({
        where: { ...relatedToVehicle, status: ["PENDING", "REJECTED"] },
        transaction: t,
      });

      await vehicle.destroy({ transaction: t });
      await t.commit();

      await invalidateVehicle(id);

      logger.info("anuncio.excluido", {
        vehicleId: id,
        userId: req.userId,
        propostasRemovidas: removedProposals,
      });

      return res.status(204).send();
    } catch (error) {
      await t.rollback();
      return sendError(res, error, 500);
    }
  }


  private static validateVehicleData(d: IVehicle): void {
    const currentYear = new Date().getFullYear();
    const price = d.price as number;
    const mYear = d.modelYear as number;
    const fYear = d.manufactureYear as number;
    if (price <= 0) throw new Error("O preço deve ser maior que zero");
    if (mYear < fYear) throw new Error("Ano modelo inválido");
    if (mYear > fYear + 1)
      throw new Error("Modelo não pode ser superior a 1 ano");
    if (fYear > currentYear)
      throw new Error(`Ano não pode ser maior que ${currentYear}`);
  }

  private static whitelist(body: IVehicle) {
    const {
      brand,
      model,
      engine,
      transmission,
      location,
      mileage,
      price,
      description,
      features,
      manufactureYear,
      modelYear,
    } = body;
    return {
      brand,
      model,
      engine,
      transmission,
      location,
      mileage,
      price,
      description,
      features,
      manufactureYear,
      modelYear,
    };
  }

  private static async authorize(vId: string, uId?: string): Promise<Vehicle> {
    const v = await Vehicle.findByPk(vId);
    if (!v) throw new Error("Veículo não encontrado|404");
    if (String(v.userId) !== String(uId))
      throw new Error("Operação negada: Proprietário inválido|403");
    return v;
  }


  private static getIncludes(withPhone = false) {
    const userAttrs = withPhone ? ["name", "phone"] : ["name"];
    return [
      { model: User, as: "user", attributes: userAttrs },
      { model: User, as: "Buyer", attributes: ["name"] },
      { model: VehicleImage, as: "images", attributes: ["id", "url"] },
    ];
  }

}
