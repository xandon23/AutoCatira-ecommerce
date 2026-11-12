import sequelize from "./config/database";
import { logger } from "./utils/logger";
import app from "./app";

const port = 3333;

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
