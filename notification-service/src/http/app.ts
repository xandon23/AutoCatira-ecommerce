import express, { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { sequelize } from "../config/database";
import { redisClient } from "../config/redis";
import { isMainApiUp } from "../clients/userClient";
import { notificationService } from "../services/notificationService";
import { logger, requestContext, errorMessage } from "../utils/logger";

interface AuthRequest extends Request {
  userId?: string;
}

export const app = express();
app.use(express.json());

// Log de cada requisição com requestId (mesmo padrão da API principal).
app.use((req, res, next) => {
  const requestId = (req.headers["x-request-id"] as string) || randomUUID();
  res.setHeader("X-Request-Id", requestId);
  const start = Date.now();
  requestContext.run({ requestId }, () => {
    res.on("finish", () =>
      requestContext.run({ requestId }, () =>
        logger.info("http.requisicao", { method: req.method, path: req.originalUrl, status: res.statusCode, durationMs: Date.now() - start }),
      ),
    );
    next();
  });
});

// Mesmo JWT emitido pela API principal (segredo compartilhado).
function auth(req: AuthRequest, res: Response, next: NextFunction) {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (!/^Bearer$/i.test(scheme || "") || !token) {
    return res.status(401).json({ error: "Token não fornecido." });
  }
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as { id: string };
    req.userId = decoded.id;
    return next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
}

app.get("/health", async (req, res) => {
  const mysql = await sequelize.authenticate().then(() => "up").catch(() => "down");
  const redis = redisClient.isReady ? "up" : "down";
  const apiPrincipal = (await isMainApiUp()) ? "up" : "down";
  const status = mysql === "down" ? "down" : redis === "down" || apiPrincipal === "down" ? "degraded" : "up";
  res.status(mysql === "up" ? 200 : 503).json({
    service: "notification-service",
    status,
    checks: { mysql, redis, apiPrincipal },
    notificacoes: mysql === "up" ? await notificationService.stats() : undefined,
  });
});

// Notificações do usuário logado.
app.get("/me", auth, async (req: AuthRequest, res) => {
  const items = await notificationService.listForUser(req.userId as string);
  res.json(items);
});

app.patch("/:id/read", auth, async (req: AuthRequest, res) => {
  const ok = await notificationService.markAsRead(req.params.id as string, req.userId as string);
  if (!ok) return res.status(404).json({ error: "Notificação não encontrada." });
  return res.json({ message: "Notificação marcada como lida." });
});

app.use((req, res) => res.status(404).json({ error: "Rota não encontrada." }));

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  logger.error("http.erro_interno", { error: errorMessage(err) });
  res.status(500).json({ error: "Erro interno do servidor." });
});
