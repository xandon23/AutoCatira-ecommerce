import "dotenv/config";
import { Sequelize } from "sequelize-typescript";
import VehicleImage from "../../models/VehicleImage";
import Vehicle from "../../models/Vehicle";
import User from "../../models/User";
import Proposal from "../../models/Proposal";
import Review from "../../models/Review";

// Aceita tanto DB_* (docker-compose) quanto MYSQL_* (arquivo .env).
const sequelize = new Sequelize(
  (process.env.DB_NAME || process.env.MYSQL_DATABASE) as string,
  (process.env.DB_USER || process.env.MYSQL_USER) as string,
  (process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD) as string,
  {
    host: process.env.DB_HOST || "db",
    port: Number(process.env.DB_PORT) || 3306,
    dialect: "mysql",
    logging: false,
    models: [User, Vehicle, VehicleImage, Proposal, Review],
  },
);

export default sequelize;
