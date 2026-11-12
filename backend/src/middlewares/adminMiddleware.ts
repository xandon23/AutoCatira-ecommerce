import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";
import User from "../models/User";
import { logger } from "../utils/logger";

// O perfil é conferido no banco a cada requisição: se um administrador
// for rebaixado, perde o acesso na hora, sem esperar o token expirar.
export async function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const user = await User.findByPk(req.userId, { attributes: ["id", "role"] });

  if (!user || user.role !== "ADMIN") {
    logger.warn("auth.acesso_admin_negado", { userId: req.userId });

    return res.status(403).json({
      error: "Acesso restrito a administradores.",
    });
  }

  req.userRole = user.role;

  return next();
}
