import { afterAll, beforeAll } from "vitest";
import sequelize from "../src/config/database";
import Review from "../src/models/Review";
import Proposal from "../src/models/Proposal";
import VehicleImage from "../src/models/VehicleImage";
import Vehicle from "../src/models/Vehicle";
import User from "../src/models/User";

// Antes de cada arquivo de teste: cria as tabelas (se não existirem) e
// limpa os dados na ordem certa por causa das chaves estrangeiras.
beforeAll(async () => {
  await sequelize.sync();
  await Review.destroy({ where: {} });
  await Proposal.destroy({ where: {} });
  await VehicleImage.destroy({ where: {} });
  await Vehicle.destroy({ where: {} });
  await User.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});
