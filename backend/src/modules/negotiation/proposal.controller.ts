import { Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddleware";
import ProposalService from "./proposal.service";
import SaleService from "./sale.service";
import {
  toCreateProposalDTO,
  toFinalizeSaleDTO,
  toUpdateProposalStatusDTO,
} from "./dtos/proposal.dto";

// Controller do contexto de Negociação: só traduz HTTP <-> service.
// Erros lançados aqui são tratados pelo errorMiddleware (Express 5
// encaminha automaticamente erros de funções async).
export default class ProposalController {
  static async create(req: AuthRequest, res: Response): Promise<Response> {
    const dto = toCreateProposalDTO(req.body);
    const proposal = await ProposalService.create(req.userId as string, dto);

    return res.status(201).json({ message: "Proposta enviada!", proposal });
  }

  static async updateStatus(req: AuthRequest, res: Response): Promise<Response> {
    const dto = toUpdateProposalStatusDTO(req.body);
    const { contact } = await ProposalService.updateStatus(
      req.params.id as string,
      req.userId as string,
      dto,
    );

    return res.status(200).json({
      message: "Status atualizado com sucesso!",
      ...(dto.status === "IN_NEGOTIATION" ? { contact } : {}),
    });
  }

  static async getReceivedVehicles(
    req: AuthRequest,
    res: Response,
  ): Promise<Response> {
    const vehicles = await ProposalService.listVehiclesWithPendingProposals(
      req.userId as string,
    );

    return res.status(200).json(vehicles);
  }

  static async getByVehicle(req: AuthRequest, res: Response): Promise<Response> {
    const proposals = await ProposalService.listByVehicle(
      req.params.vehicleId as string,
      req.userId as string,
    );

    return res.status(200).json(proposals);
  }

  static async getById(req: AuthRequest, res: Response): Promise<Response> {
    const proposal = await ProposalService.getById(
      req.params.id as string,
      req.userId as string,
    );

    return res.status(200).json(proposal);
  }

  static async getNegotiations(
    req: AuthRequest,
    res: Response,
  ): Promise<Response> {
    const proposals = await ProposalService.listNegotiations(
      req.userId as string,
    );

    return res.status(200).json(proposals);
  }

  static async getMine(req: AuthRequest, res: Response): Promise<Response> {
    const proposals = await ProposalService.listSentByBuyer(
      req.userId as string,
    );

    return res.status(200).json(proposals);
  }

  static async finalizeSale(req: AuthRequest, res: Response): Promise<Response> {
    const dto = toFinalizeSaleDTO(req.body);

    await SaleService.finalize(
      req.params.id as string,
      req.userId as string,
      dto,
    );

    return res.status(200).json({ message: "Venda finalizada com sucesso!" });
  }
}
