import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/httpError";

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.headersSent) {
    return next(err);
  }

  return sendError(res, err);
}

export function notFoundMiddleware(req: Request, res: Response) {
  return res.status(404).json({ error: "Rota não encontrada." });
}
