import { Request, Response } from "express";
import { sendError } from "../utils/httpError";
import User from "../models/User";
import {
  validarCPF,
  validarEmail,
  validarSenhaForte,
  isMaiorDeIdade,
} from "../utils/validators";
import { AuthRequest } from "../middlewares/authMiddleware";
import { IUser } from "../types";

export default class UserController {
  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const { name, email, password, cpf, birthDate, phone } = req.body;

      UserController.validateRegisterData(req.body);
      await UserController.checkDuplicity(email, cpf);

      const user = await User.create({
        name,
        email,
        password,
        phone,
        birthDate,
        cpf: cpf.replace(/\D/g, ""),
      });

      return res.status(201).json({
        message: "Usuário criado com sucesso",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          birthDate: user.birthDate,
          cpf: user.cpf,
          role: user.role,
        },
      });
    } catch (error) {
      return sendError(res, error, 400);
    }
  }

  static async getAll(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { page = 1, limit = 10 } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const users = await User.findAll({
        attributes: ["id", "name"],
        limit: Number(limit),
        offset,
      });

      return res.status(200).json(users);
    } catch (error) {
      return sendError(res, error, 500);
    }
  }

  static async getById(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const id = req.params.id as string;

      const canViewPrivateData =
        String(req.userId) === String(id) || req.userRole === "ADMIN";

      const user = await User.findByPk(id, {
        attributes: canViewPrivateData
          ? {
              exclude: ["password"],
            }
          : ["id", "name"],
      });

      if (!user) {
        throw new Error("Utilizador não encontrado|404");
      }

      return res.status(200).json(user);
    } catch (error) {
      return sendError(res, error, 500);
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const user = await UserController.validateOwnership(req);
      const { name, phone, email } = req.body;

      UserController.validateUpdateData(name, phone, email, user.email);

      await user.update({ name, phone });
      return res.status(200).json({
        message: "Dados atualizados com sucesso!",
        user: { name, phone, email: user.email },
      });
    } catch (error) {
      return sendError(res, error, 400);
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const user = await UserController.validateOwnership(req);

      await user.destroy();

      return res.status(204).send();
    } catch (error) {
      return sendError(res, error, 500);
    }
  }

  private static validateRegisterData(data: IUser): void {
    const email = data.email as string;
    const password = data.password as string;
    const cpf = data.cpf as string;
    const birthDate = data.birthDate as string;

    if (!validarEmail(email)) throw new Error("E-mail inválido|400");
    if (!validarSenhaForte(password)) throw new Error("Senha fraca|400");
    if (!validarCPF(cpf)) throw new Error("CPF inválido|400");
    if (!isMaiorDeIdade(birthDate)) throw new Error("Menor de idade|403");
  }

  private static async checkDuplicity(
    email: string,
    cpf: string,
  ): Promise<void> {
    const cleanCpf = cpf.replace(/\D/g, "");
    const exists = await User.findOne({ where: { email } });
    const cpfExists = await User.findOne({ where: { cpf: cleanCpf } });
    if (exists || cpfExists)
      throw new Error("E-mail ou CPF já cadastrados|409");
  }

  private static async validateOwnership(req: AuthRequest): Promise<User> {
    if (req.userId !== req.params.id) throw new Error("Acesso negado|403");
    const user = await User.findByPk(req.params.id);
    if (!user) throw new Error("Utilizador não encontrado|404");
    return user;
  }

  private static validateUpdateData(
    name: string,
    phone: string,
    email: string,
    dbEmail: string,
  ): void {
    if (!name || !phone) throw new Error("Nome e telefone obrigatórios");
    if (email && email !== dbEmail)
      throw new Error("Alteração de e-mail proibida|403");
  }

}
