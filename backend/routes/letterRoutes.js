import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  getNextLetter,
  logLetterAttempt,
} from "../controllers/letterController.js";

const router = express.Router();

router.get("/next", protect, authorizeRoles("student"), getNextLetter);

router.post("/attempt", protect, authorizeRoles("student"), logLetterAttempt);

export default router;
