import { Response } from "express";
import User from "../models/User";
import { AuthRequest } from "../middlewares/authMiddleware";

export default class AdminController {
  static async getUsers(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const users = await User.findAll({
        attributes: {
          exclude: ["password"],
        },
        order: [["createdAt", "DESC"]],
      });

      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).json({
        error: "Erro ao buscar usuários.",
      });
    }
  }
}
