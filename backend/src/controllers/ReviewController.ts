import { Request, Response } from "express";
import { sendError } from "../utils/httpError";

import { AuthRequest } from "../middlewares/authMiddleware";

import Proposal from "../models/Proposal";
import Review from "../models/Review";
import User from "../models/User";
import Vehicle from "../models/Vehicle";
import VehicleImage from "../models/VehicleImage";

import { ICreateReview } from "../types";
import { logger } from "../utils/logger";

export default class ReviewController {
  static async create(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const reviewerId = req.userId as string;

      const { proposalId, rating, comment } = req.body as ICreateReview;

      ReviewController.validateData(reviewerId, proposalId, rating, comment);

      const proposal = await ReviewController.getAcceptedProposal(proposalId);

      const sellerId = proposal.targetVehicle?.userId;

      const buyerId = proposal.buyerId;

      if (
        String(reviewerId) !== String(buyerId) &&
        String(reviewerId) !== String(sellerId)
      ) {
        throw new Error("Você não participou desta negociação|403");
      }

      const reviewedId =
        String(reviewerId) === String(buyerId) ? sellerId : buyerId;

      if (!reviewedId) {
        throw new Error("Não foi possível identificar o usuário avaliado|400");
      }

      if (String(reviewedId) === String(reviewerId)) {
        throw new Error("Não é possível avaliar a si mesmo|403");
      }

      const existingReview = await Review.findOne({
        where: {
          reviewerId,
          proposalId,
        },
      });

      if (existingReview) {
        throw new Error("Você já avaliou esta negociação|409");
      }

      const review = await Review.create({
        reviewerId,
        reviewedId,
        proposalId,

        rating: Number(rating),

        comment: comment?.trim() || null,
      });

      logger.info("avaliacao.criada", {
        reviewId: review.id,
        proposalId,
        rating: review.rating,
      });

      return res.status(201).json({
        message: "Avaliação registrada com sucesso!",
        review,
      });
    } catch (error) {
      return sendError(res, error, 400);
    }
  }

  static async getPending(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.userId as string;

      const proposals = await Proposal.findAll({
        where: {
          status: "ACCEPTED",
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

            include: [
              {
                model: User,
                as: "user",

                attributes: ["id", "name"],
              },

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

      const existingReviews = await Review.findAll({
        where: {
          reviewerId: userId,
        },

        attributes: ["proposalId"],
      });

      const reviewedProposalIds = new Set(
        existingReviews.map((review) => String(review.proposalId)),
      );

      const pending = proposals
        .filter((proposal) => {
          const sellerId = proposal.targetVehicle?.userId;

          const buyerId = proposal.buyerId;

          const participated =
            String(buyerId) === String(userId) ||
            String(sellerId) === String(userId);

          return participated && !reviewedProposalIds.has(String(proposal.id));
        })
        .map((proposal) => {
          const seller = proposal.targetVehicle?.user;

          const buyer = proposal.buyer;

          const isBuyer = String(proposal.buyerId) === String(userId);

          const reviewedUser = isBuyer ? seller : buyer;

          return {
            proposalId: proposal.id,

            role: isBuyer ? "BUYER" : "SELLER",

            reviewedUser: {
              id: reviewedUser?.id,
              name: reviewedUser?.name,
            },

            targetVehicle: {
              id: proposal.targetVehicle?.id,

              brand: proposal.targetVehicle?.brand,

              model: proposal.targetVehicle?.model,

              modelYear: proposal.targetVehicle?.modelYear,

              images: proposal.targetVehicle?.images || [],
            },

            completedAt: proposal.updatedAt,
          };
        });

      return res.status(200).json(pending);
    } catch (error) {
      return sendError(res, error, 500);
    }
  }

  static async getMine(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.userId as string;

      const reviews = await Review.findAll({
        where: {
          reviewedId: userId,
        },

        include: [
          {
            model: User,
            as: "reviewer",

            attributes: ["id", "name"],
          },

          {
            model: Proposal,
            as: "proposal",

            attributes: ["id", "targetVehicleId"],

            include: [
              {
                model: Vehicle,
                as: "targetVehicle",

                attributes: ["id", "brand", "model", "modelYear"],
              },
            ],
          },
        ],

        order: [["createdAt", "DESC"]],
      });

      return res.status(200).json(reviews);
    } catch (error) {
      return sendError(res, error, 500);
    }
  }

  static async getByReviewedUser(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const userId = req.params.userId as string;

      const reviews = await Review.findAll({
        where: {
          reviewedId: userId,
        },

        include: [
          {
            model: User,
            as: "reviewer",

            attributes: ["id", "name"],
          },
        ],

        order: [["createdAt", "DESC"]],
      });

      return res.status(200).json(reviews);
    } catch (error) {
      return sendError(res, error, 500);
    }
  }

  private static async getAcceptedProposal(
    proposalId: string,
  ): Promise<Proposal> {
    const proposal = await Proposal.findOne({
      where: {
        id: proposalId,
        status: "ACCEPTED",
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

          include: [
            {
              model: User,
              as: "user",

              attributes: ["id", "name"],
            },
          ],
        },
      ],
    });

    if (!proposal) {
      throw new Error("Negociação finalizada não encontrada|404");
    }

    return proposal;
  }

  private static validateData(
    reviewerId: string,
    proposalId: string,
    rating: number,
    comment?: string,
  ): void {
    if (!reviewerId) {
      throw new Error("Usuário não autenticado|401");
    }

    if (!proposalId) {
      throw new Error("Negociação não informada|400");
    }

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      throw new Error("A nota deve ser um número inteiro entre 1 e 5|400");
    }

    if (comment && comment.trim().length > 500) {
      throw new Error("O comentário deve possuir no máximo 500 caracteres|400");
    }
  }

}
