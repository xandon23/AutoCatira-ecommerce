import { randomUUID } from "crypto";
import { Request, Response, NextFunction } from "express";
import { requestContext } from "../utils/requestContext";
import { logger } from "../utils/logger";

// Gera um ID por requisição, devolve no header X-Request-Id e registra
// método, rota, status e tempo de resposta ao final.
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const headerId = req.headers["x-request-id"];
  const requestId =
    typeof headerId === "string" && headerId ? headerId : randomUUID();

  const start = process.hrtime.bigint();

  res.setHeader("X-Request-Id", requestId);

  requestContext.run({ requestId }, () => {
    res.on("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;

      requestContext.run({ requestId }, () => {
        logger.info("http.requisicao", {
          method: req.method,
          path: req.originalUrl,
          status: res.statusCode,
          durationMs: Math.round(durationMs * 10) / 10,
        });
      });
    });

    next();
  });
}
