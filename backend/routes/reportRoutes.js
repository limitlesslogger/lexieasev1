import express from "express";
import {
  getDashboardSummary,
  getWordReport,
  getSentenceReport,
  getLetterReport
} from "../controllers/reportController.js";

import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/student", protect, authorizeRoles("student"), getDashboardSummary);
router.get("/student/words", protect, authorizeRoles("student"), getWordReport);
router.get("/student/sentences", protect, authorizeRoles("student"), getSentenceReport);
router.get("/student/letters", protect, authorizeRoles("student"), getLetterReport);

export default router;