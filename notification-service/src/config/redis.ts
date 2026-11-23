import { createClient } from "redis";
import { env } from "./env";
import { logger } from "../utils/logger";

const socket = {
  connectTimeout: 3000,
  reconnectStrategy: (retries: number) => Math.min(retries * 200, 5000),
};

// Cliente para cache (validação de usuários).
export const redisClient = createClient({ url: env.redisUrl, socket });

// Conexão exclusiva para assinar os canais de eventos (exigência do Pub/Sub).
export const redisSubscriber = createClient({ url: env.redisUrl, socket });

let lastError = 0;
for (const [name, client] of [["cache", redisClient], ["assinante", redisSubscriber]] as const) {
  client.on("ready", () => logger.info("redis.conectado", { conexao: name }));
  client.on("error", (error: Error) => {
    if (Date.now() - lastError > 10000) {
      lastError = Date.now();
      logger.error("redis.erro", { conexao: name, error: error.message });
    }
  });
}
