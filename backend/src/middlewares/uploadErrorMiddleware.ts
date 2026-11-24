import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { logger } from "../utils/logger";

export function uploadErrorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof multer.MulterError) {
    logger.warn("upload.rejeitado", { motivo: err.code });

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: "A imagem excede o tamanho máximo permitido de 5 MB.",
      });
    }

    return res.status(400).json({
      error: err.message,
    });
  }

  if (err instanceof Error && err.message.startsWith("Arquivo inválido")) {
    logger.warn("upload.rejeitado", { motivo: "formato_invalido" });

    return res.status(400).json({
      error: err.message,
    });
  }

  return next(err);
}
