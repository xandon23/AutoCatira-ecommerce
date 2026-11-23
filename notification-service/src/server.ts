import { env } from "./config/env";
import { connectDatabase, sequelize } from "./config/database";
import { redisClient, redisSubscriber } from "./config/redis";
import { startEventConsumer } from "./consumers/eventConsumer";
import { notificationService } from "./services/notificationService";
import { app } from "./http/app";
import { logger, errorMessage } from "./utils/logger";

async function start() {
  try {
    await connectDatabase();
  } catch (error) {
    logger.error("banco.erro_conexao", { error: errorMessage(error) });
    process.exit(1);
  }

  redisClient.connect().catch((error) => logger.warn("redis.indisponivel", { error: errorMessage(error) }));
  startEventConsumer().catch((error) => logger.warn("evento.assinante_indisponivel", { error: errorMessage(error) }));

  // Reconciliação periódica das notificações pendentes (consistência eventual).
  const timer = setInterval(() => notificationService.reconcilePending(), env.reconcileIntervalMs);

  const server = app.listen(env.port, () => logger.info("servidor.iniciado", { port: env.port }));

  const shutdown = (signal: string) => {
    logger.info("servidor.encerrando", { signal });
    clearInterval(timer);
    server.close(async () => {
      await Promise.allSettled([
        sequelize.close(),
        redisClient.isOpen ? redisClient.quit() : Promise.resolve(),
        redisSubscriber.isOpen ? redisSubscriber.quit() : Promise.resolve(),
      ]);
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start();
