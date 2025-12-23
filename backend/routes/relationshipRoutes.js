import express from "express";
import {
  linkTeacherStudent,
  linkParentChild,
  getMyStudents,
  getMyChildren,
} from "../controllers/relationshipController.js";

import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ADMIN routes */
router.post(
  "/teacher-student",
  protect,
  authorizeRoles("admin"),
  linkTeacherStudent
);

router.post("/parent-child", protect, authorizeRoles("admin"), linkParentChild);

/* TEACHER routes */
router.get("/my-students", protect, authorizeRoles("teacher"), getMyStudents);

/* PARENT routes */
router.get("/my-children", protect, authorizeRoles("parent"), getMyChildren);

export default router;
