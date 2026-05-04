import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { getNextSentence, logSentenceAttempt } from "../controllers/sentenceController.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/next", protect, authorizeRoles("student"), getNextSentence);
router.post("/attempt", protect, authorizeRoles("student"), upload.single("audio"), logSentenceAttempt);

export default router;
