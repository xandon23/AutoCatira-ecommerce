import { Request, Response } from "express";
import { sendError } from "../utils/httpError";
import User from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { IUser } from "../types";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

export default class AuthController {
  static async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body ?? {};

      if (!email || !password) {
        throw new AppError("Informe e-mail e senha.", 400);
      }

      const user = await AuthController.getUser(email);

      await AuthController.checkPassword(password, user.password as string);
      const token = AuthController.issueToken(user);

      logger.info("auth.login_sucesso", { userId: user.id, role: user.role });

      return res.status(200).json({
        message: "Login realizado com sucesso!",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      });
    } catch (error) {
      if (error instanceof Error && error.message.endsWith("|401")) {
        logger.warn("auth.login_falhou");
      }
      return sendError(res, error);
    }
  }

  private static async getUser(email: string): Promise<User> {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new Error("E-mail ou senha inválidos.|401");
    return user;
  }

  private static async checkPassword(
    plain: string,
    hashed: string,
  ): Promise<void> {
    const isValid = await bcrypt.compare(plain, hashed);
    if (!isValid) throw new Error("E-mail ou senha inválidos.|401");
  }

  private static issueToken(user: IUser): string {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET não configurado|500");
    }

    const payload = {
      id: user.id as string,
      name: user.name,
      role: user.role,
    };

    return jwt.sign(payload, secret, { expiresIn: "1d" });
  }

}
