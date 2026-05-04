import express from "express";
import {
  linkTeacherStudent,
  linkParentChild,
  getMyStudents,
  getMyChildren,
  getAvailableStudentsForLinking,
  linkStudentToCurrentUser,
  linkStudentWithCredentials,
  createStudentAndLink,
  unlinkStudentFromCurrentUser,
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

router.get(
  "/available-students",
  protect,
  authorizeRoles("teacher", "parent"),
  getAvailableStudentsForLinking
);

router.post(
  "/link-student",
  protect,
  authorizeRoles("teacher", "parent"),
  linkStudentToCurrentUser
);

router.post(
  "/link-student-with-credentials",
  protect,
  authorizeRoles("teacher", "parent"),
  linkStudentWithCredentials
);

router.post(
  "/create-student",
  protect,
  authorizeRoles("teacher", "parent"),
  createStudentAndLink
);

router.delete(
  "/link-student",
  protect,
  authorizeRoles("teacher", "parent"),
  unlinkStudentFromCurrentUser
);

export default router;
