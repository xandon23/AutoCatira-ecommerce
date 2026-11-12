import { Router } from "express";
import ProposalController from "./proposal.controller";
import { authMiddleware } from "../../middlewares/authMiddleware";

const router = Router();

router.post("/", authMiddleware, ProposalController.create);

router.get(
  "/received/vehicles",
  authMiddleware,
  ProposalController.getReceivedVehicles,
);

router.get("/negotiations", authMiddleware, ProposalController.getNegotiations);

router.get(
  "/vehicle/:vehicleId",
  authMiddleware,
  ProposalController.getByVehicle,
);

router.get("/mine", authMiddleware, ProposalController.getMine);

router.get("/:id", authMiddleware, ProposalController.getById);

router.put("/:id/status", authMiddleware, ProposalController.updateStatus);
router.patch("/:id/status", authMiddleware, ProposalController.updateStatus);

export default router;
