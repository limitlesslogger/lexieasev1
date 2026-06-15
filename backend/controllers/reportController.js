

// import PDFDocument from "pdfkit";
// import {
//   getDashboardSummaryData,
//   getLetterReportData,
//   getSentenceReportData,
//   getWordReportData,
// } from "../services/reportingService.js";

// // ─── Existing controllers (unchanged) ────────────────────────────────────────

// export const getDashboardSummary = async (req, res) => {
//   try {
//     const data = await getDashboardSummaryData(req.user._id, req.query.timeframe);
//     return res.json(data);
//   } catch (error) {
//     return res.status(500).json({ message: "Failed to load dashboard summary" });
//   }
// };

// export const getWordReport = async (req, res) => {
//   try {
//     const data = await getWordReportData(req.user._id, req.query.timeframe);
//     return res.json({ data });
//   } catch (error) {
//     return res.status(500).json({ message: "Failed to load word report" });
//   }
// };

// export const getSentenceReport = async (req, res) => {
//   try {
//     const data = await getSentenceReportData(req.user._id, req.query.timeframe);
//     return res.json({ data });
//   } catch (error) {
//     return res.status(500).json({ message: "Failed to load sentence report" });
//   }
// };

// export const getLetterReport = async (req, res) => {
//   try {
//     const data = await getLetterReportData(req.user._id, req.query.timeframe);
//     return res.json({ data });
//   } catch (error) {
//     return res.status(500).json({ message: "Failed to load letter report" });
//   }
// };

// // ─── PDF Helpers ──────────────────────────────────────────────────────────────

// const COLORS = {
//   primary: "#1e40af",     // dark blue
//   accent: "#2563eb",      // mid blue
//   green: "#059669",
//   amber: "#d97706",
//   red: "#dc2626",
//   muted: "#64748b",
//   border: "#e2e8f0",
//   rowAlt: "#f8fafc",
//   white: "#ffffff",
//   dark: "#0f172a",
// };

// const PAGE_MARGIN = 48;
// const PAGE_WIDTH = 595.28;   // A4
// const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

// /** Draw the report header band */
// function drawHeader(doc, title, studentName, timeframe) {
//   // Blue header bar
//   doc.rect(0, 0, PAGE_WIDTH, 72).fill(COLORS.primary);

//   doc
//     .fillColor(COLORS.white)
//     .fontSize(20)
//     .font("Helvetica-Bold")
//     .text(title, PAGE_MARGIN, 22, { width: CONTENT_WIDTH - 120 });

//   doc
//     .fillColor("rgba(255,255,255,0.75)")
//     .fontSize(9)
//     .font("Helvetica")
//     .text(`Student: ${studentName}   |   Timeframe: Last ${timeframe} days   |   Generated: ${new Date().toLocaleDateString()}`,
//       PAGE_MARGIN, 50, { width: CONTENT_WIDTH });

//   doc.moveDown(0.5).y = 92;
// }

// /** Draw a metric summary box */
// function drawMetricBox(doc, x, y, w, h, label, value, subtext, accentColor) {
//   doc.roundedRect(x, y, w, h, 8).strokeColor(accentColor).lineWidth(1.5).stroke();

//   doc
//     .fillColor(COLORS.muted)
//     .fontSize(8)
//     .font("Helvetica-Bold")
//     .text(label.toUpperCase(), x + 10, y + 10, { width: w - 20 });

//   doc
//     .fillColor(accentColor)
//     .fontSize(22)
//     .font("Helvetica-Bold")
//     .text(value, x + 10, y + 22, { width: w - 20 });

//   if (subtext) {
//     doc
//       .fillColor(COLORS.muted)
//       .fontSize(8)
//       .font("Helvetica")
//       .text(subtext, x + 10, y + 48, { width: w - 20 });
//   }
// }

// /** Draw a section heading */
// function drawSectionHeading(doc, text, y) {
//   const useY = y ?? doc.y;
//   doc
//     .moveTo(PAGE_MARGIN, useY)
//     .lineTo(PAGE_MARGIN + CONTENT_WIDTH, useY)
//     .strokeColor(COLORS.border)
//     .lineWidth(1)
//     .stroke();

//   doc
//     .fillColor(COLORS.primary)
//     .fontSize(11)
//     .font("Helvetica-Bold")
//     .text(text.toUpperCase(), PAGE_MARGIN, useY + 6);

//   doc.moveDown(0.8);
// }

// /** Draw a full-width table */
// function drawTable(doc, headers, rows, colWidths) {
//   const startX = PAGE_MARGIN;
//   const rowH = 22;
//   const headerH = 26;
//   let y = doc.y;

//   // Header row
//   doc.rect(startX, y, CONTENT_WIDTH, headerH).fill("#dbeafe");

//   let cx = startX;
//   headers.forEach((h, i) => {
//     doc
//       .fillColor(COLORS.primary)
//       .fontSize(8.5)
//       .font("Helvetica-Bold")
//       .text(h, cx + 6, y + 8, { width: colWidths[i] - 8, ellipsis: true });
//     cx += colWidths[i];
//   });

//   y += headerH;

//   // Data rows
//   rows.forEach((row, rowIdx) => {
//     // Page overflow guard
//     if (y + rowH > doc.page.height - 60) {
//       doc.addPage();
//       y = PAGE_MARGIN;
//     }

//     if (rowIdx % 2 === 1) {
//       doc.rect(startX, y, CONTENT_WIDTH, rowH).fill(COLORS.rowAlt);
//     }

//     cx = startX;
//     row.forEach((cell, i) => {
//       doc
//         .fillColor(COLORS.dark)
//         .fontSize(8.5)
//         .font("Helvetica")
//         .text(String(cell ?? "—"), cx + 6, y + 6, { width: colWidths[i] - 8, ellipsis: true });
//       cx += colWidths[i];
//     });

//     // Bottom border
//     doc
//       .moveTo(startX, y + rowH)
//       .lineTo(startX + CONTENT_WIDTH, y + rowH)
//       .strokeColor(COLORS.border)
//       .lineWidth(0.5)
//       .stroke();

//     y += rowH;
//   });

//   doc.y = y + 8;
// }

// /** Draw page footer */
// function drawFooter(doc, studentName) {
//   const range = doc.bufferedPageRange();
//   for (let i = 0; i < range.count; i++) {
//     doc.switchToPage(range.start + i);
//     doc
//       .fillColor(COLORS.muted)
//       .fontSize(8)
//       .font("Helvetica")
//       .text(
//         `${studentName}  |  Page ${i + 1} of ${range.count}  |  Lexcura Reading Progress Report`,
//         PAGE_MARGIN,
//         doc.page.height - 30,
//         { width: CONTENT_WIDTH, align: "center" }
//       );
//   }
// }

// export const downloadLetterReportPDF = async (req, res) => {
//   try {
//     const data = await getLetterReportData(req.user._id, req.query.timeframe);

//     const doc = new PDFDocument();
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", "attachment; filename=letter-report.pdf");

//     doc.pipe(res);

//     doc.fontSize(18).text("Letter Report", { align: "center" });
//     doc.moveDown();

//     const letters = data.letters || [];

//     letters.forEach((l) => {
//       doc.text(
//         `${l.letter.toUpperCase()} | Attempts: ${l.attempts} | Strength: ${l.strength}%`
//       );
//     });

//     doc.end();
//   } catch (err) {
//     res.status(500).json({ message: "Failed to generate letter report" });
//   }
// };

// // ─── Word Report PDF ──────────────────────────────────────────────────────────

// export const downloadWordReportPDF = async (req, res) => {
//   try {
//     const data = await getWordReportData(req.user._id, req.query.timeframe);

//     const doc = new PDFDocument();
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", "attachment; filename=word-report.pdf");

//     doc.pipe(res);

//     doc.fontSize(18).text("Word Report", { align: "center" });
//     doc.moveDown();

//     const words = data.words?.allWords || [];

//     words.forEach((w) => {
//       doc.text(
//         `${w.word} | ${w.correctCount}/${w.totalAttempts} | ${w.successRate}%`
//       );
//     });

//     doc.end();
//   } catch (err) {
//     res.status(500).json({ message: "Failed to generate word report" });
//   }
// };
// // ─── Sentence Report PDF ──────────────────────────────────────────────────────

// export const downloadSentenceReportPDF = async (req, res) => {
//   try {
//     const data = await getSentenceReportData(req.user._id, req.query.timeframe);
//     const timeframe = req.query.timeframe || 30;
//     const studentName = req.user.name || "Student";

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", `attachment; filename="sentence-report.pdf"`);

//     const doc = new PDFDocument({ autoFirstPage: true, margin: PAGE_MARGIN, bufferPages: true, size: "A4" });
//     doc.pipe(res);

//     const attempts = data.attempts || [];
//     const successRate = data.successRate ?? 0;
//     const eyeTracking = data.eyeTracking;

//     // Avg latency
//     const latencies = attempts.map((a) => Number(a.responseTime || 0)).filter((v) => v > 0);
//     const avgLatency = latencies.length
//       ? (latencies.reduce((s, v) => s + v, 0) / latencies.length / 1000).toFixed(1)
//       : "—";

//     drawHeader(doc, "Sentence Performance Report", studentName, timeframe);

//     // Metric boxes
//     const boxW = (CONTENT_WIDTH - 4) / 2;
//     const boxH = 68;
//     const boxY = 98;
//     drawMetricBox(doc, PAGE_MARGIN, boxY, boxW, boxH, "Sentence Accuracy", `${successRate}%`, `${attempts.length} sentence attempts`, COLORS.accent);
//     drawMetricBox(doc, PAGE_MARGIN + boxW + 4, boxY, boxW, boxH, "Avg Response Latency", `${avgLatency}s`, "average across all attempts", COLORS.green);

//     doc.y = boxY + boxH + 18;

//     // Eye tracking summary (if available)
//     if (eyeTracking && eyeTracking.tracked > 0) {
//       const hesColor =
//         eyeTracking.hesitationLevel === "High" ? COLORS.red :
//         eyeTracking.hesitationLevel === "Moderate" ? COLORS.amber : COLORS.green;

//       doc.roundedRect(PAGE_MARGIN, doc.y, CONTENT_WIDTH, 54, 6).fill("#eff6ff");
//       const etY = doc.y;

//       doc
//         .fillColor(COLORS.primary)
//         .fontSize(8.5)
//         .font("Helvetica-Bold")
//         .text("EYE-TRACKING SUMMARY", PAGE_MARGIN + 10, etY + 8);

//       doc
//         .fillColor(COLORS.dark)
//         .fontSize(9)
//         .font("Helvetica")
//         .text(
//           `Sessions tracked: ${eyeTracking.tracked}   |   Avg hesitation score: ${eyeTracking.avgVisualScore}   |   Hard sessions: ${eyeTracking.hardSessions} (${eyeTracking.hardRate}%)`,
//           PAGE_MARGIN + 10, etY + 22, { width: CONTENT_WIDTH - 20 }
//         );

//       doc
//         .fillColor(hesColor)
//         .fontSize(9)
//         .font("Helvetica-Bold")
//         .text(`Hesitation level: ${eyeTracking.hesitationLevel}`, PAGE_MARGIN + 10, etY + 38);

//       doc.y = etY + 62;
//     }

//     doc.moveDown(0.5);
//     drawSectionHeading(doc, "Sentence Attempt Details");

//     const rows = attempts.map((a) => [
//       a.sentence,
      
//       a.correct ? "Correct" : "Incorrect",
//       `${a.accuracy ?? 0}%`,
//       `${((a.responseTime || 0) / 1000).toFixed(1)}s`,
//     ]);

//     if (rows.length > 0) {
//       drawTable(
//         doc,
//         ["Target Sentence", "Status", "Accuracy", "Latency"],
//         rows,
//         [170,  70, 65, 44]
//       );
//     } else {
//       doc.fillColor(COLORS.muted).fontSize(9).font("Helvetica").text("No sentence attempts recorded for this timeframe.", PAGE_MARGIN, doc.y);
//     }

//     drawFooter(doc, studentName);
//     doc.end();
//   } catch (err) {
//     console.error("Sentence PDF error:", err);
//     if (!res.headersSent) {
//       res.status(500).json({ message: "Failed to generate sentence report" });
//     }
//   }
// };

import PDFDocument from "pdfkit";
import {
  getDashboardSummaryData,
  getLetterReportData,
  getSentenceReportData,
  getWordReportData,
} from "../services/reportingService.js";

// ─── Existing controllers (unchanged) ────────────────────────────────────────

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

// ─── PDF Helpers ──────────────────────────────────────────────────────────────

const COLORS = {
  primary: "#1e40af",
  accent: "#2563eb",
  green: "#059669",
  amber: "#d97706",
  red: "#dc2626",
  muted: "#64748b",
  border: "#e2e8f0",
  rowAlt: "#f8fafc",
  white: "#ffffff",
  dark: "#0f172a",
  purple: "#7c3aed",
};

const PAGE_MARGIN = 48;
const PAGE_WIDTH = 595.28; // A4
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

/** Draw the report header band */
function drawHeader(doc, title, studentName, timeframe) {
  doc.rect(0, 0, PAGE_WIDTH, 72).fill(COLORS.primary);

  doc
    .fillColor(COLORS.white)
    .fontSize(20)
    .font("Helvetica-Bold")
    .text(title, PAGE_MARGIN, 22, { width: CONTENT_WIDTH - 120 });

  doc
    .fillColor("rgba(255,255,255,0.75)")
    .fontSize(9)
    .font("Helvetica")
    .text(
      `Student: ${studentName}   |   Timeframe: Last ${timeframe} days   |   Generated: ${new Date().toLocaleDateString()}`,
      PAGE_MARGIN,
      50,
      { width: CONTENT_WIDTH }
    );

  doc.y = 92;
}

/** Draw a metric summary box */
function drawMetricBox(doc, x, y, w, h, label, value, subtext, accentColor) {
  doc.roundedRect(x, y, w, h, 8).strokeColor(accentColor).lineWidth(1.5).stroke();

  doc
    .fillColor(COLORS.muted)
    .fontSize(8)
    .font("Helvetica-Bold")
    .text(label.toUpperCase(), x + 10, y + 10, { width: w - 20 });

  doc
    .fillColor(accentColor)
    .fontSize(22)
    .font("Helvetica-Bold")
    .text(value, x + 10, y + 22, { width: w - 20 });

  if (subtext) {
    doc
      .fillColor(COLORS.muted)
      .fontSize(8)
      .font("Helvetica")
      .text(subtext, x + 10, y + 48, { width: w - 20 });
  }
}

/** Draw a section heading with a ruled line */
function drawSectionHeading(doc, text, y) {
  const useY = y ?? doc.y;
  doc
    .moveTo(PAGE_MARGIN, useY)
    .lineTo(PAGE_MARGIN + CONTENT_WIDTH, useY)
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .stroke();

  doc
    .fillColor(COLORS.primary)
    .fontSize(11)
    .font("Helvetica-Bold")
    .text(text.toUpperCase(), PAGE_MARGIN, useY + 6);

  doc.moveDown(0.8);
}

/** Draw a full-width table with header row + alternating row shading */
function drawTable(doc, headers, rows, colWidths) {
  const startX = PAGE_MARGIN;
  const rowH = 22;
  const headerH = 26;
  let y = doc.y;

  // Header row background
  doc.rect(startX, y, CONTENT_WIDTH, headerH).fill("#dbeafe");

  let cx = startX;
  headers.forEach((h, i) => {
    doc
      .fillColor(COLORS.primary)
      .fontSize(8.5)
      .font("Helvetica-Bold")
      .text(h, cx + 6, y + 8, { width: colWidths[i] - 8, ellipsis: true });
    cx += colWidths[i];
  });

  y += headerH;

  rows.forEach((row, rowIdx) => {
    // Page overflow guard
    if (y + rowH > doc.page.height - 60) {
      doc.addPage();
      y = PAGE_MARGIN;
    }

    if (rowIdx % 2 === 1) {
      doc.rect(startX, y, CONTENT_WIDTH, rowH).fill(COLORS.rowAlt);
    }

    cx = startX;
    row.forEach((cell, i) => {
      doc
        .fillColor(COLORS.dark)
        .fontSize(8.5)
        .font("Helvetica")
        .text(String(cell ?? "—"), cx + 6, y + 6, {
          width: colWidths[i] - 8,
          ellipsis: true,
        });
      cx += colWidths[i];
    });

    doc
      .moveTo(startX, y + rowH)
      .lineTo(startX + CONTENT_WIDTH, y + rowH)
      .strokeColor(COLORS.border)
      .lineWidth(0.5)
      .stroke();

    y += rowH;
  });

  doc.y = y + 8;
}

/** Draw page footer on every buffered page */
function drawFooter(doc, studentName) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    doc
      .fillColor(COLORS.muted)
      .fontSize(8)
      .font("Helvetica")
      .text(
        `${studentName}  |  Page ${i + 1} of ${range.count}  |  Lexcura Reading Progress Report`,
        PAGE_MARGIN,
        doc.page.height - 30,
        { width: CONTENT_WIDTH, align: "center" }
      );
  }
}

// ─── Letter Report PDF ────────────────────────────────────────────────────────

export const downloadLetterReportPDF = async (req, res) => {
  try {
    const data = await getLetterReportData(req.user._id, req.query.timeframe);
    const timeframe = req.query.timeframe || 30;
    const studentName = req.user.name || "Student";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="letter-report.pdf"`
    );

    const doc = new PDFDocument({
      autoFirstPage: true,
      margin: PAGE_MARGIN,
      bufferPages: true,
      size: "A4",
    });
    doc.pipe(res);

    const letters = data.letters || [];

    // ── Summary metrics ──────────────────────────────────────────────────────
    const totalAttempts = letters.reduce((s, l) => s + (l.attempts || 0), 0);
    const avgStrength =
      letters.length > 0
        ? Math.round(
            letters.reduce((s, l) => s + (l.strength || 0), 0) / letters.length
          )
        : 0;
    const mastered = letters.filter((l) => l.strength >= 40).length; // green threshold

    drawHeader(doc, "Letter Performance Report", studentName, timeframe);

    const boxW = (CONTENT_WIDTH - 8) / 3;
    const boxH = 68;
    const boxY = 98;

    drawMetricBox(
      doc, PAGE_MARGIN, boxY, boxW, boxH,
      "Letters Practised", String(letters.length),
      "distinct letters", COLORS.accent
    );
    drawMetricBox(
      doc, PAGE_MARGIN + boxW + 4, boxY, boxW, boxH,
      "Avg Strength", `${avgStrength}%`,
      "across all letters", COLORS.green
    );
    drawMetricBox(
      doc, PAGE_MARGIN + (boxW + 4) * 2, boxY, boxW, boxH,
      "Total Attempts", String(totalAttempts),
      `${mastered} letters mastered (≥40%)`, COLORS.purple
    );

    doc.y = boxY + boxH + 20;

    // ── Strength colour legend ───────────────────────────────────────────────
    const legendY = doc.y;
    doc
      .rect(PAGE_MARGIN, legendY, CONTENT_WIDTH, 28)
      .fill("#f1f5f9");

    const legendItems = [
      { color: COLORS.green,  label: "Strong (≥ 40%)" },
      { color: COLORS.amber,  label: "Developing (0–39%)" },
      { color: COLORS.red,    label: "Needs focus (< 0%)" },
    ];
    let lx = PAGE_MARGIN + 12;
    legendItems.forEach(({ color, label }) => {
      doc.circle(lx + 4, legendY + 14, 4).fill(color);
      doc
        .fillColor(COLORS.dark)
        .fontSize(8.5)
        .font("Helvetica")
        .text(label, lx + 12, legendY + 10);
      lx += 140;
    });

    doc.y = legendY + 36;

    // ── Letter detail table ──────────────────────────────────────────────────
    drawSectionHeading(doc, "Letter Breakdown");

    if (letters.length === 0) {
      doc
        .fillColor(COLORS.muted)
        .fontSize(9)
        .font("Helvetica")
        .text("No letter data recorded for this timeframe.", PAGE_MARGIN, doc.y);
    } else {
      const rows = letters.map((l) => {
        const strengthLabel =
          l.strength >= 40 ? "Strong" :
          l.strength >= 0  ? "Developing" : "Needs focus";
        return [
          l.letter.toUpperCase(),
          String(l.attempts),
          `${l.strength}%`,
          strengthLabel,
        ];
      });

      // Col widths must sum to CONTENT_WIDTH (499)
      drawTable(
        doc,
        ["Letter", "Attempts", "Strength", "Status"],
        rows,
        [120, 120, 120, 139]
      );
    }

    drawFooter(doc, studentName);
    doc.end();
  } catch (err) {
    console.error("Letter PDF error:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to generate letter report" });
    }
  }
};

// ─── Word Report PDF ──────────────────────────────────────────────────────────

export const downloadWordReportPDF = async (req, res) => {
  try {
    const data = await getWordReportData(req.user._id, req.query.timeframe);
    const timeframe = req.query.timeframe || 30;
    const studentName = req.user.name || "Student";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="word-report.pdf"`
    );

    const doc = new PDFDocument({
      autoFirstPage: true,
      margin: PAGE_MARGIN,
      bufferPages: true,
      size: "A4",
    });
    doc.pipe(res);

    // Use ONLY words.allWords — no separate 2-letter section
    const allWords = data.words?.allWords || [];
    const overview = data.words?.overview || {};
    const combined = data.combined || {};

    drawHeader(doc, "Word Performance Report", studentName, timeframe);

    // ── Metric boxes ─────────────────────────────────────────────────────────
    const boxW = (CONTENT_WIDTH - 4) / 2;
    const boxH = 68;
    const boxY = 98;

    drawMetricBox(
      doc, PAGE_MARGIN, boxY, boxW, boxH,
      "Word Accuracy", `${overview.successRate ?? 0}%`,
      `${overview.totalAttempts ?? 0} total attempts`, COLORS.accent
    );
    drawMetricBox(
      doc, PAGE_MARGIN + boxW + 4, boxY, boxW, boxH,
      "Combined Accuracy", `${combined.successRate ?? 0}%`,
      `${combined.totalAttempts ?? 0} combined attempts`, COLORS.purple
    );

    doc.y = boxY + boxH + 20;

    // ── Word detail table ─────────────────────────────────────────────────────
    drawSectionHeading(doc, "Word Breakdown");

    if (allWords.length === 0) {
      doc
        .fillColor(COLORS.muted)
        .fontSize(9)
        .font("Helvetica")
        .text("No word data recorded for this timeframe.", PAGE_MARGIN, doc.y);
    } else {
      const rows = allWords.map((w) => [
        w.word,
        String(w.totalAttempts),
        String(w.correctCount),
        `${w.successRate}%`,
        `${((w.avgResponseTime || 0) / 1000).toFixed(1)}s`,
      ]);

      // Col widths must sum to CONTENT_WIDTH (499)
      drawTable(
        doc,
        ["Word", "Attempts", "Correct", "Accuracy", "Avg Response"],
        rows,
        [160, 80, 80, 89, 90]
      );
    }

    drawFooter(doc, studentName);
    doc.end();
  } catch (err) {
    console.error("Word PDF error:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to generate word report" });
    }
  }
};

// ─── Sentence Report PDF (unchanged) ─────────────────────────────────────────

export const downloadSentenceReportPDF = async (req, res) => {
  try {
    const data = await getSentenceReportData(req.user._id, req.query.timeframe);
    const timeframe = req.query.timeframe || 30;
    const studentName = req.user.name || "Student";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="sentence-report.pdf"`
    );

    const doc = new PDFDocument({
      autoFirstPage: true,
      margin: PAGE_MARGIN,
      bufferPages: true,
      size: "A4",
    });
    doc.pipe(res);

    const attempts = data.attempts || [];
    const successRate = data.successRate ?? 0;
    const eyeTracking = data.eyeTracking;

    const latencies = attempts
      .map((a) => Number(a.responseTime || 0))
      .filter((v) => v > 0);
    const avgLatency = latencies.length
      ? (latencies.reduce((s, v) => s + v, 0) / latencies.length / 1000).toFixed(1)
      : "—";

    drawHeader(doc, "Sentence Performance Report", studentName, timeframe);

    const boxW = (CONTENT_WIDTH - 4) / 2;
    const boxH = 68;
    const boxY = 98;

    drawMetricBox(
      doc, PAGE_MARGIN, boxY, boxW, boxH,
      "Sentence Accuracy", `${successRate}%`,
      `${attempts.length} sentence attempts`, COLORS.accent
    );
    drawMetricBox(
      doc, PAGE_MARGIN + boxW + 4, boxY, boxW, boxH,
      "Avg Response Latency", `${avgLatency}s`,
      "average across all attempts", COLORS.green
    );

    doc.y = boxY + boxH + 18;

    // if (eyeTracking && eyeTracking.tracked > 0) {
    //   const hesColor =
    //     eyeTracking.hesitationLevel === "High"
    //       ? COLORS.red
    //       : eyeTracking.hesitationLevel === "Moderate"
    //       ? COLORS.amber
    //       : COLORS.green;

    //   doc.roundedRect(PAGE_MARGIN, doc.y, CONTENT_WIDTH, 54, 6).fill("#eff6ff");
    //   const etY = doc.y;

    //   doc
    //     .fillColor(COLORS.primary)
    //     .fontSize(8.5)
    //     .font("Helvetica-Bold")
    //     .text("EYE-TRACKING SUMMARY", PAGE_MARGIN + 10, etY + 8);

    //   doc
    //     .fillColor(COLORS.dark)
    //     .fontSize(9)
    //     .font("Helvetica")
    //     .text(
    //       `Sessions tracked: ${eyeTracking.tracked}   |   Avg hesitation score: ${eyeTracking.avgVisualScore}   |   Hard sessions: ${eyeTracking.hardSessions} (${eyeTracking.hardRate}%)`,
    //       PAGE_MARGIN + 10,
    //       etY + 22,
    //       { width: CONTENT_WIDTH - 20 }
    //     );

    //   doc
    //     .fillColor(hesColor)
    //     .fontSize(9)
    //     .font("Helvetica-Bold")
    //     .text(
    //       `Hesitation level: ${eyeTracking.hesitationLevel}`,
    //       PAGE_MARGIN + 10,
    //       etY + 38
    //     );

    //   doc.y = etY + 62;
    // }

    doc.moveDown(0.5);
    drawSectionHeading(doc, "Sentence Attempt Details");

    const rows = attempts.map((a) => [
      a.sentence,
      a.correct ? "Correct" : "Incorrect",
      `${a.accuracy ?? 0}%`,
      `${((a.responseTime || 0) / 1000).toFixed(1)}s`,
    ]);

    if (rows.length > 0) {
      drawTable(
        doc,
        ["Target Sentence", "Status", "Accuracy", "Latency"],
        rows,
        [170, 70, 65, 44]
      );
    } else {
      doc
        .fillColor(COLORS.muted)
        .fontSize(9)
        .font("Helvetica")
        .text(
          "No sentence attempts recorded for this timeframe.",
          PAGE_MARGIN,
          doc.y
        );
    }

    drawFooter(doc, studentName);
    doc.end();
  } catch (err) {
    console.error("Sentence PDF error:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to generate sentence report" });
    }
  }
};