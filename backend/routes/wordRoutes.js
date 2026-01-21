import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { getNextWord, logWordAttempt } from "../controllers/wordController.js";

const router = express.Router();

router.get("/next", protect, authorizeRoles("student"), getNextWord);
router.post("/attempt", protect, authorizeRoles("student"), logWordAttempt);

export default router;
