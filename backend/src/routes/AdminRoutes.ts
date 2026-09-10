import { Router } from "express";
import AdminController from "../controllers/AdminController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { adminMiddleware } from "../middlewares/adminMiddleware";

const router = Router();

router.get("/users", authMiddleware, adminMiddleware, AdminController.getUsers);

export default router;
