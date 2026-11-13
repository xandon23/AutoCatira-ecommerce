import cors from "cors";
import express from "express";
import UserRoutes from "./routes/UserRoutes";
import VehicleRoutes from "./routes/VehicleRoutes";
import ProposalRoutes from "./modules/negotiation/proposal.routes";
import ReviewRoutes from "./routes/ReviewRoutes";
import AuthRoutes from "./routes/AuthRoutes";
import AdminRoutes from "./routes/AdminRoutes";
import HealthRoutes from "./routes/HealthRoutes";
import { uploadErrorMiddleware } from "./middlewares/uploadErrorMiddleware";
import { requestLogger } from "./middlewares/requestLogger";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "./middlewares/errorMiddleware";

const app = express();

app.use(requestLogger);
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));
app.use("/health", HealthRoutes);
app.use("/auth", AuthRoutes);
app.use("/users", UserRoutes);
app.use("/vehicles", VehicleRoutes);
app.use("/proposals", ProposalRoutes);
app.use("/reviews", ReviewRoutes);
app.use("/admin", AdminRoutes);
app.use(uploadErrorMiddleware);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
