import { createClient } from "redis";
import { logger } from "../utils/logger";

const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";

// Cliente Redis compartilhado (cache e, depois, Pub/Sub).
// Reconexão com backoff: tenta de novo com espera crescente até 5s.
export const redisClient = createClient({
  url: REDIS_URL,
  socket: {
    connectTimeout: 3000,
    reconnectStrategy: (retries) => Math.min(retries * 200, 5000),
  },
});

let lastErrorLog = 0;

redisClient.on("ready", () => logger.info("redis.conectado"));
redisClient.on("end", () => logger.warn("redis.desconectado"));
redisClient.on("error", (error: Error) => {
  // Evita inundar o log enquanto o Redis estiver fora do ar.
  const now = Date.now();
  if (now - lastErrorLog > 10000) {
    lastErrorLog = now;
    logger.error("redis.erro", { error: error.message });
  }
});

// Conecta sem bloquear a API: se o Redis não subir, o sistema
// continua funcionando direto no MySQL (fallback do cache).
export async function connectRedis(): Promise<void> {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.warn("redis.indisponivel_na_inicializacao", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export function isRedisReady(): boolean {
  return redisClient.isReady;
}
