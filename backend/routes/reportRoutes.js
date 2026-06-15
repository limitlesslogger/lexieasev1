// import express from "express";
// import {
//   getDashboardSummary,
//   getWordReport,
//   getSentenceReport,
//   getLetterReport
// } from "../controllers/reportController.js";

// import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
// import {
//   downloadStudentLetterReport,
//   downloadStudentSentenceReport,
//   downloadStudentWordReport,
// } from "../controllers/therapistController.js";

// const router = express.Router();

// router.get("/student", protect, authorizeRoles("student"), getDashboardSummary);
// router.get("/student/words", protect, authorizeRoles("student"), getWordReport);
// router.get("/student/sentences", protect, authorizeRoles("student"), getSentenceReport);
// router.get("/student/letters", protect, authorizeRoles("student"), getLetterReport);

// const useAuthedStudentId = (req, _res, next) => {
//   req.params.studentId = req.user?._id?.toString();
//   return next();
// };

// // Download student reports (same PDF format as therapist downloads)
// router.get(
//   "/student/report/letters/download",
//   protect,
//   authorizeRoles("student"),
//   useAuthedStudentId,
//   downloadStudentLetterReport
// );
// router.get(
//   "/student/report/words/download",
//   protect,
//   authorizeRoles("student"),
//   useAuthedStudentId,
//   downloadStudentWordReport
// );
// router.get(
//   "/student/report/sentences/download",
//   protect,
//   authorizeRoles("student"),
//   useAuthedStudentId,
//   downloadStudentSentenceReport
// );

// export default router;

import express from "express";
import {
  getDashboardSummary,
  getWordReport,
  getSentenceReport,
  getLetterReport,
  downloadLetterReportPDF,
  downloadWordReportPDF,
  downloadSentenceReportPDF,
} from "../controllers/reportController.js";

import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Summary ───────────────────────────────────────────────────────────────────
router.get("/student", protect, authorizeRoles("student"), getDashboardSummary);

// ── PDF downloads — MUST be registered BEFORE the plain data routes ───────────
router.get("/student/letters/pdf",   protect, authorizeRoles("student"), downloadLetterReportPDF);
router.get("/student/words/pdf",     protect, authorizeRoles("student"), downloadWordReportPDF);
router.get("/student/sentences/pdf", protect, authorizeRoles("student"), downloadSentenceReportPDF);

// ── Plain data routes ─────────────────────────────────────────────────────────
router.get("/student/letters",   protect, authorizeRoles("student"), getLetterReport);
router.get("/student/words",     protect, authorizeRoles("student"), getWordReport);
router.get("/student/sentences", protect, authorizeRoles("student"), getSentenceReport);

export default router;