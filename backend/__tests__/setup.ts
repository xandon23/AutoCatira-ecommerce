import { afterAll, beforeAll } from "vitest";
import sequelize from "../src/config/database";
import Review from "../src/models/Review";
import Proposal from "../src/models/Proposal";
import VehicleImage from "../src/models/VehicleImage";
import Vehicle from "../src/models/Vehicle";
import User from "../src/models/User";

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
