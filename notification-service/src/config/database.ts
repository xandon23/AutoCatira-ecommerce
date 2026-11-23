import { Sequelize } from "sequelize";
import { env } from "./env";
import { logger, errorMessage } from "../utils/logger";

// Banco de dados PRÓPRIO do microsserviço (database per service).
export const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: "mysql",
  logging: false,
});

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Retry com backoff exponencial até o banco ficar disponível.
export async function connectDatabase(maxAttempts = 10): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await sequelize.authenticate();
      // alter: adiciona colunas novas na tabela já existente sem apagar dados.
      await sequelize.sync({ alter: true });
      logger.info("banco.sincronizado", { tentativa: attempt });
      return;
    } catch (error) {
      const delay = Math.min(1000 * 2 ** (attempt - 1), 15000);
      logger.warn("banco.falha_conexao", { tentativa: attempt, proximaTentativaMs: delay, error: errorMessage(error) });
      if (attempt === maxAttempts) throw error;
      await wait(delay);
    }
  }
}
