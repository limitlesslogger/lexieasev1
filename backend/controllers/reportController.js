import {
  getDashboardSummaryData,
  getLetterReportData,
  getSentenceReportData,
  getWordReportData,
} from "../services/reportingService.js";

export const getDashboardSummary = async (req, res) => {
  try {
    const data = await getDashboardSummaryData(req.user._id, req.query.timeframe);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load dashboard summary" });
  }
};

export const getWordReport = async (req, res) => {
  try {
    const data = await getWordReportData(req.user._id, req.query.timeframe);
    return res.json({ data });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load word report" });
  }
};

export const getSentenceReport = async (req, res) => {
  try {
    const data = await getSentenceReportData(req.user._id, req.query.timeframe);
    return res.json({ data });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load sentence report" });
  }
};

export const getLetterReport = async (req, res) => {
  try {
    const data = await getLetterReportData(req.user._id, req.query.timeframe);
    return res.json({ data });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load letter report" });
  }
};
