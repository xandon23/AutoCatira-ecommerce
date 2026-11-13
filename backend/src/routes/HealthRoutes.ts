import { Router } from "express";
import sequelize from "../config/database";
import { isRedisReady, redisClient } from "../config/redis";

const router = Router();

const TIMEOUT_MS = 1000;

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS),
    ),
  ]);
}

// Verifica a saúde da API e das dependências.
// MySQL é essencial (503 se cair); Redis é opcional (status "degradado").
router.get("/", async (req, res) => {
  const started = Date.now();

  const mysql = await withTimeout(sequelize.authenticate())
    .then(() => "up")
    .catch(() => "down");

  const redis = isRedisReady()
    ? await withTimeout(redisClient.ping())
        .then(() => "up")
        .catch(() => "down")
    : "down";

  const status =
    mysql === "down" ? "down" : redis === "down" ? "degraded" : "up";

  return res.status(mysql === "up" ? 200 : 503).json({
    status,
    uptimeSeconds: Math.round(process.uptime()),
    checks: { api: "up", mysql, redis },
    durationMs: Date.now() - started,
  });
});

export default router;
