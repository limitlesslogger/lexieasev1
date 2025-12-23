import express from "express";
import {
  protect,
  authorizeRoles,
  canAccessStudent,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, (req, res) => {
  res.json(req.user);
});

router.get("/admin", protect, authorizeRoles("admin"), (req, res) => {
  res.send("Admin access granted");
});

router.get("/student/:studentId", protect, canAccessStudent, (req, res) => {
  res.send("Student data access granted");
});

export default router;
