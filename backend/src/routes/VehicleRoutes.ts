import { Router } from "express";
import multer from "multer";
import { multerConfig } from "../config/multer";
import VehicleController from "../controllers/VehicleController";
import VehicleImageController from "../controllers/VehicleImageController";
import ProposalController from "../modules/negotiation/proposal.controller";
import { authMiddleware } from "../middlewares/authMiddleware";
import { vehicleOwnershipMiddleware } from "../middlewares/vehicleOwnershipMiddleware";

const router = Router();
const upload = multer(multerConfig);

router.get("/", VehicleController.getAll);

router.get("/mine", authMiddleware, VehicleController.getMine);
router.get("/sold", authMiddleware, VehicleController.getSold);
router.get("/sold/:id", authMiddleware, VehicleController.getSoldById);

router.get("/:id", VehicleController.getById);

router.post("/", authMiddleware, VehicleController.create);
router.put("/:id", authMiddleware, VehicleController.update);
router.delete("/:id", authMiddleware, VehicleController.delete);
// Finalização da venda pertence ao contexto de Negociação.
router.patch("/:id/sell", authMiddleware, ProposalController.finalizeSale);

router.post(
  "/:vehicleId/images",
  authMiddleware,
  vehicleOwnershipMiddleware,
  upload.single("image"),
  VehicleImageController.upload,
);
router.delete(
  "/images/:imageId",
  authMiddleware,
  VehicleImageController.delete,
);

export default router;
