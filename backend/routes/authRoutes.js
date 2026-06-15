import express from "express";
import { register, login, logout, changePassword } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", protect, logout);
router.patch("/change-password", protect, changePassword);

export default router;
