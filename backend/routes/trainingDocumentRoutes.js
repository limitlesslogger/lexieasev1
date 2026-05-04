import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { uploadTrainingDocumentFile } from "../middleware/trainingDocumentUpload.js";
import {
  uploadTrainingDocument,
  getMyTrainingDocuments,
  getVisibleTrainingDocuments,
  updateTrainingSelection,
  updateTrainingDocumentSharing,
} from "../controllers/trainingDocumentController.js";

const router = express.Router();

router.post(
  "/upload",
  protect,
  authorizeRoles("student", "teacher", "parent"),
  uploadTrainingDocumentFile,
  uploadTrainingDocument
);

router.get(
  "/mine",
  protect,
  authorizeRoles("student", "teacher", "parent"),
  getMyTrainingDocuments
);

router.get(
  "/available",
  protect,
  authorizeRoles("student"),
  getVisibleTrainingDocuments
);

router.post(
  "/selection",
  protect,
  authorizeRoles("student"),
  updateTrainingSelection
);

router.patch(
  "/:id/sharing",
  protect,
  authorizeRoles("student", "teacher", "parent"),
  updateTrainingDocumentSharing
);

export default router;
