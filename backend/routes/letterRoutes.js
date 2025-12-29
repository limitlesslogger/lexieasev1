import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  getNextLetter,
  logLetterAttempt,
} from "../controllers/letterController.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get(
  "/next", //chooses next letter for student
  protect, //checks whether user is logged in 
  authorizeRoles("student"), 
  getNextLetter
);

//router.post("/attempt", protect, authorizeRoles("student"), logLetterAttempt);
//Both post reqs with same path - Express DOES NOT allow that
router.post(
  "/attempt", //evaluates performance, updates student model, adapts future content
  protect,
  authorizeRoles("student"),
  upload.single("audio"), //optional middleware
  logLetterAttempt
);
export default router;
