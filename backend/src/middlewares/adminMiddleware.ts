import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";

export function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  if (req.userRole !== "ADMIN") {
    return res.status(403).json({
      error: "Acesso restrito a administradores.",
    });
  }

  return next();
}
