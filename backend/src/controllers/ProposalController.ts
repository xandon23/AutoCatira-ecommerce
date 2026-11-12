import { Response } from "express";
import { sendError } from "../utils/httpError";
import { AuthRequest } from "../middlewares/authMiddleware";
import Proposal from "../models/Proposal";
import User from "../models/User";
import Vehicle from "../models/Vehicle";
import VehicleImage from "../models/VehicleImage";
import { IProposal, IVehicle } from "../types";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

export default class ProposalController {
  static async create(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.userId as string;
      const data = req.body as IProposal;

      const vModel = await ProposalController.fetchVehicle(
        data.targetVehicleId as string,
      );

      const vehicle = vModel.get({ plain: true }) as IVehicle;

      // Proposta só com veículo na troca: valor em dinheiro vira 0.
      const cashOffer =
        data.cashOffer === undefined || data.cashOffer === null || (data.cashOffer as unknown) === ""
          ? 0
          : Number(data.cashOffer);

      if (Number.isNaN(cashOffer)) {
        throw new AppError("Valor da proposta inválido.", 400);
      }

      data.cashOffer = cashOffer;

      ProposalController.validateProposalRules(vehicle, userId, data);
      if (data.offeredVehicleId) {
        await ProposalController.validateTradeIn(
          data.offeredVehicleId as string,
          userId,
        );
      }

      const activeProposal = await Proposal.findOne({
        where: {
          targetVehicleId: data.targetVehicleId,
          buyerId: userId,
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
        targetVehicleId: data.targetVehicleId,
        buyerId: userId,
        cashOffer,
        offeredVehicleId: data.offeredVehicleId || null,
        status: "PENDING",
        message: data.message || null,
      });

      logger.info("proposta.criada", {
        proposalId: proposal.id,
        vehicleId: data.targetVehicleId,
        buyerId: userId,
        comTroca: !!data.offeredVehicleId,
      });

      return res.status(201).json({ message: "Proposta enviada!", proposal });
    } catch (error) {
      const err = error as Error;
      return sendError(res, err, 400);
    }
  }

  static async updateStatus(
    req: AuthRequest,
    res: Response,
  ): Promise<Response> {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      const userId = req.userId as string;

      if (!id) {
        throw new Error("ID da proposta não informado.|400");
      }

      const proposal = await ProposalController.authorizeStatusUpdate(
        id,
        userId,
        status,
      );

      const validTransition =
        (proposal.status === "PENDING" &&
          ["IN_NEGOTIATION", "REJECTED"].includes(status)) ||
        (proposal.status === "IN_NEGOTIATION" && status === "REJECTED");

      if (!validTransition) {
        throw new Error("Transição de status inválida.|400");
      }

      const previousStatus = proposal.status;

      await proposal.update({ status });

      logger.info("proposta.status_alterado", {
        proposalId: proposal.id,
        de: previousStatus,
        para: status,
      });

      if (status === "IN_NEGOTIATION") {
        const buyer = await User.findByPk(proposal.buyerId, {
          attributes: ["name", "phone"],
        });

        return res.status(200).json({
          message: "Status atualizado com sucesso!",
          contact: buyer
            ? {
                name: buyer.name,
                phone: buyer.phone,
              }
            : null,
        });
      }

      return res
        .status(200)
        .json({ message: "Status atualizado com sucesso!" });
    } catch (error) {
      return sendError(res, error, 500);
    }
  }

  static async getReceivedVehicles(
    req: AuthRequest,
    res: Response,
  ): Promise<Response> {
    try {
      const userId = req.userId as string;

      const vehicles = await Vehicle.findAll({
        where: {
          userId,
        },
        include: [
          {
            model: Proposal,
            as: "receivedProposals",
            where: {
              status: "PENDING",
            },
            attributes: ["id"],
            required: true,
          },
          {
            model: VehicleImage,
            as: "images",
            attributes: ["id", "url"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      const result = vehicles.map((vehicle) => {
        const data = vehicle.get({
          plain: true,
        }) as any;

        return {
          ...data,

          pendingProposalCount: data.receivedProposals?.length ?? 0,

          receivedProposals: undefined,
        };
      });

      return res.status(200).json(result);
    } catch (error) {
      return sendError(res, error, 500);
    }
  }

  static async getByVehicle(
    req: AuthRequest,
    res: Response,
  ): Promise<Response> {
    try {
      const vehicleId = req.params.vehicleId as string;

      const vehicle = await Vehicle.findByPk(vehicleId);

      if (!vehicle) {
        throw new Error("Veículo não encontrado.|404");
      }

      if (String(vehicle.userId) !== String(req.userId)) {
        throw new Error("Acesso negado.|403");
      }

      const proposals = await Proposal.findAll({
        where: {
          targetVehicleId: vehicleId,
        },
        include: [
          {
            model: User,
            as: "buyer",
            attributes: ["name"],
          },
          {
            model: Vehicle,
            as: "offeredVehicle",
            include: [
              {
                model: VehicleImage,
                as: "images",
                attributes: ["id", "url"],
              },
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      return res.status(200).json(proposals);
    } catch (error) {
      return sendError(res, error, 500);
    }
  }

  static async getById(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const proposal = await Proposal.findByPk(req.params.id as string, {
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
      if (!proposal) throw new Error("Proposta não encontrada.|404");

      const isBuyer = String(proposal.buyerId) === String(req.userId);
      const isSeller =
        String(proposal.targetVehicle?.userId) === String(req.userId);

      if (!isBuyer && !isSeller) {
        throw new Error("Acesso negado.|403");
      }

      return res.status(200).json(proposal);
    } catch (error) {
      return sendError(res, error, 500);
    }
  }

  static async getNegotiations(
    req: AuthRequest,
    res: Response,
  ): Promise<Response> {
    try {
      const userId = req.userId as string;

      const proposals = await Proposal.findAll({
        where: {
          status: "IN_NEGOTIATION",
        },
        include: [
          {
            model: Vehicle,
            as: "targetVehicle",
            where: {
              userId,
            },
            include: [
              {
                model: VehicleImage,
                as: "images",
                attributes: ["id", "url"],
              },
            ],
          },
          {
            model: User,
            as: "buyer",
            attributes: ["name", "phone", "email"],
          },
          {
            model: Vehicle,
            as: "offeredVehicle",
            include: [
              {
                model: VehicleImage,
                as: "images",
                attributes: ["id", "url"],
              },
            ],
          },
        ],
        order: [["updatedAt", "DESC"]],
      });

      return res.status(200).json(proposals);
    } catch (error) {
      return sendError(res, error, 500);
    }
  }

  static async getMine(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.userId as string;

      const proposals = await Proposal.findAll({
        where: {
          buyerId: userId,
        },

        include: [
          {
            model: Vehicle,
            as: "targetVehicle",
            include: [
              {
                model: User,
                as: "user",
                attributes: ["name", "phone"],
              },
              {
                model: VehicleImage,
                as: "images",
                attributes: ["id", "url"],
              },
            ],
          },

          {
            model: Vehicle,
            as: "offeredVehicle",
            include: [
              {
                model: VehicleImage,
                as: "images",
                attributes: ["id", "url"],
              },
            ],
          },
        ],

        order: [["createdAt", "DESC"]],
      });

      const result = proposals.map((proposal) => {
        const data = proposal.get({
          plain: true,
        }) as any;

        const canSeeContact =
          data.status === "IN_NEGOTIATION" || data.status === "ACCEPTED";

        if (!canSeeContact && data.targetVehicle?.user) {
          delete data.targetVehicle.user.phone;
        }

        return data;
      });

      return res.status(200).json(result);
    } catch (error) {
      return sendError(res, error, 500);
    }
  }

  private static async fetchVehicle(id: string): Promise<Vehicle> {
    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) throw new Error("Veículo não encontrado.|404");
    return vehicle;
  }

  private static validateProposalRules(
    v: IVehicle,
    uid: string,
    data: IProposal,
  ): void {
    const cash = data.cashOffer as number;
    const hasTrade = !!data.offeredVehicleId;
    if (!hasTrade && cash <= 0)
      throw new Error("Valor deve ser maior que zero.|400");
    if (hasTrade && cash < 0)
      throw new Error("Valor não pode ser negativo.|400");
    if (v.userId === uid)
      throw new Error("Não pode propor no seu veículo.|400");
    if (v.status !== "available") throw new Error("Veículo indisponível.|400");
  }

  private static async validateTradeIn(
    oid: string,
    uid: string,
  ): Promise<void> {
    const offered = await Vehicle.findByPk(oid);
    if (!offered || offered.userId !== uid)
      throw new Error("O veículo deve ser seu.|403");
    if (offered.status !== "available")
      throw new Error("Veículo indisponível.|400");
  }

  private static async authorizeStatusUpdate(
    id: string,
    uid: string,
    st: string,
  ): Promise<Proposal> {
    if (!["IN_NEGOTIATION", "REJECTED"].includes(st)) {
      throw new Error("Status inválido.|400");
    }

    const p = await Proposal.findByPk(id, {
      include: [{ model: Vehicle, as: "targetVehicle" }],
    });

    if (!p) throw new Error("Proposta não encontrada.|404");

    if ((p as any).targetVehicle?.userId !== uid) {
      throw new Error("Acesso negado.|403");
    }

    return p;
  }

}
