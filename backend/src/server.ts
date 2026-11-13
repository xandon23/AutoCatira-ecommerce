import sequelize from "./config/database";
import { logger } from "./utils/logger";
import app from "./app";
import { connectRedis } from "./config/redis";
import { startEventSubscriber } from "./events/eventSubscriber";

const port = 3333;

// Redis conecta em paralelo e não impede a API de subir.
connectRedis();
startEventSubscriber();

sequelize
  .sync()
  .then(() => {
    app.listen(port, () => {
      logger.info("servidor.iniciado", { port });
      logger.info("banco.sincronizado");
    });
  })
  .catch((error) => {
    logger.error("banco.erro_conexao", { error: error.message });
  });
