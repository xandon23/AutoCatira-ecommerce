import { Server } from "http";
import sequelize from "./config/database";
import { logger } from "./utils/logger";
import app from "./app";
import { connectRedis, redisClient } from "./config/redis";

const port = 3333;
const MAX_DB_ATTEMPTS = 10;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function connectDatabase(): Promise<void> {
  for (let attempt = 1; attempt <= MAX_DB_ATTEMPTS; attempt++) {
    try {
      await sequelize.authenticate();
      await sequelize.sync();
      logger.info("banco.sincronizado", { tentativa: attempt });
      return;
    } catch (error) {
      const delay = Math.min(1000 * 2 ** (attempt - 1), 15000);
      logger.warn("banco.falha_conexao", {
        tentativa: attempt,
        proximaTentativaMs: delay,
        error: error instanceof Error ? error.message : String(error),
      });
      if (attempt === MAX_DB_ATTEMPTS) throw error;
      await wait(delay);
    }
  }
}

function setupGracefulShutdown(server: Server): void {
  const shutdown = (signal: string) => {
    logger.info("servidor.encerrando", { signal });

    server.close(async () => {
      await Promise.allSettled([
        sequelize.close(),
        redisClient.isOpen ? redisClient.quit() : Promise.resolve(),
      ]);
      logger.info("servidor.encerrado");
      process.exit(0);
    });

    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

async function start(): Promise<void> {
  connectRedis();

  try {
    await connectDatabase();
  } catch (error) {
    logger.error("banco.erro_conexao", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }

  const server = app.listen(port, () => {
    logger.info("servidor.iniciado", { port });
  });

  setupGracefulShutdown(server);
}

start();
