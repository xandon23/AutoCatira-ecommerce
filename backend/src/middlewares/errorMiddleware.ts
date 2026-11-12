import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/httpError";

// Último middleware da aplicação: captura qualquer erro não tratado
// (inclusive de funções async, no Express 5) e responde de forma padronizada.
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

// Rotas inexistentes.
export function notFoundMiddleware(req: Request, res: Response) {
  return res.status(404).json({ error: "Rota não encontrada." });
}
