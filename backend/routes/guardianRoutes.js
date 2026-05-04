import express from "express";
import {
  getGuardianStudents,
  getStudentDetail,
  getStudentDashboardSummary,
  getStudentWordReport,
  getStudentSentenceReport,
  getStudentLetterReport,
} from "../controllers/guardianController.js";
import { protect, authorizeRoles, canAccessStudent } from "../middleware/authMiddleware.js";

const router = express.Router();

// all routes require parent role
router.use(protect, authorizeRoles("parent"));

// list of assigned students (could be more than one)
router.get("/students", getGuardianStudents);

// detail and reports for a specific student
router.get("/students/:studentId", canAccessStudent, getStudentDetail);
router.get("/students/:studentId/summary", canAccessStudent, getStudentDashboardSummary);
router.get("/students/:studentId/report/words", canAccessStudent, getStudentWordReport);
router.get("/students/:studentId/report/sentences", canAccessStudent, getStudentSentenceReport);
router.get("/students/:studentId/report/letters", canAccessStudent, getStudentLetterReport);

export default router;
