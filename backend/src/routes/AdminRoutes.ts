import { Router } from "express";
import AdminController from "../controllers/AdminController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { adminMiddleware } from "../middlewares/adminMiddleware";

const router = Router();

router.get("/users", authMiddleware, adminMiddleware, AdminController.getUsers);
router.patch(
  "/users/:id/role",
  authMiddleware,
  adminMiddleware,
  AdminController.updateUserRole,
);

export default router;
