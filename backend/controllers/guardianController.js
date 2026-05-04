import {
  getDashboardSummaryData,
  getLetterReportData,
  getSentenceReportData,
  getStudentDetail as getStudentDetailData,
  getStudentsForParent,
  getWordReportData,
} from "../services/reportingService.js";

export const getGuardianStudents = async (req, res) => {
  try {
    const students = await getStudentsForParent(req.user._id);
    return res.json({ students });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load students" });
  }
};

export const getStudentDetail = async (req, res) => {
  try {
    const student = await getStudentDetailData(req.params.studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    return res.json({ student });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load student details" });
  }
};

export const getStudentDashboardSummary = async (req, res) => {
  try {
    const data = await getDashboardSummaryData(req.params.studentId, req.query.timeframe);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load student summary" });
  }
};

export const getStudentWordReport = async (req, res) => {
  try {
    const data = await getWordReportData(req.params.studentId, req.query.timeframe);
    return res.json({ data });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load word report" });
  }
};

export const getStudentSentenceReport = async (req, res) => {
  try {
    const data = await getSentenceReportData(req.params.studentId, req.query.timeframe);
    return res.json({ data });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load sentence report" });
  }
};

export const getStudentLetterReport = async (req, res) => {
  try {
    const data = await getLetterReportData(req.params.studentId, req.query.timeframe);
    return res.json({ data });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load letter report" });
  }
};
