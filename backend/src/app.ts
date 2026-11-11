import cors from "cors";
import express from "express";
import UserRoutes from "./routes/UserRoutes";
import VehicleRoutes from "./routes/VehicleRoutes";
import ProposalRoutes from "./routes/ProposalRoutes";
import ReviewRoutes from "./routes/ReviewRoutes";
import AuthRoutes from "./routes/AuthRoutes";
import AdminRoutes from "./routes/AdminRoutes";
import { uploadErrorMiddleware } from "./middlewares/uploadErrorMiddleware";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));
app.use("/auth", AuthRoutes);
app.use("/users", UserRoutes);
app.use("/vehicles", VehicleRoutes);
app.use("/proposals", ProposalRoutes);
app.use("/reviews", ReviewRoutes);
app.use("/admin", AdminRoutes);
app.use(uploadErrorMiddleware);

export default app;
