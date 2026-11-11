import { UserRole } from "../types";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: UserRole;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido." });
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2) {
    return res.status(401).json({ error: "Erro no formato do token." });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: "Token malformatado." });
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({
      error: "JWT_SECRET não configurado.",
    });
  }

  jwt.verify(token, secret, (err, decoded: any) => {
    if (err) {
      return res.status(401).json({
        error: "Token inválido ou expirado.",
      });
    }

    req.userId = decoded.id;
    req.userRole = decoded.role;

    return next();
  });
};
