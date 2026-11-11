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

  static async updateUserRole(
    req: AuthRequest,
    res: Response,
  ): Promise<Response> {
    try {
      const id = req.params.id as string;
      const { role } = req.body;

      if (!["USER", "ADMIN"].includes(role)) {
        return res.status(400).json({
          error: "Perfil inválido. Utilize USER ou ADMIN.",
        });
      }

      if (String(req.userId) === String(id)) {
        return res.status(400).json({
          error: "Não é permitido alterar o próprio perfil.",
        });
      }

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          error: "Usuário não encontrado.",
        });
      }

      await user.update({ role });

      return res.status(200).json({
        message: "Perfil do usuário atualizado com sucesso.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      return res.status(500).json({
        error: "Erro ao atualizar perfil do usuário.",
      });
    }
  }
}
