import {
  getDashboardSummaryData,
  getLetterReportData,
  getSentenceReportData,
  getStudentDetail,
  getStudentsForTeacher,
  getWordReportData,
} from "../services/reportingService.js";
import PDFDocument from "pdfkit";

export const getTherapistStudents = async (req, res) => {
  try {
    const students = await getStudentsForTeacher(req.user._id);
    return res.json({ students });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load students" });
  }
};

export const getStudentDetailForTherapist = async (req, res) => {
  try {
    const student = await getStudentDetail(req.params.studentId);
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

export const assignStudentToTherapist = async (_req, res) => {
  return res.status(501).json({ message: "Use relationship routes to assign students." });
};

export const removeStudentFromTherapist = async (_req, res) => {
  return res.status(501).json({ message: "Use relationship routes to remove students." });
};

// Helper function to generate student summary
const generateStudentSummary = async (studentId) => {
  const student = await getStudentDetail(studentId);
  const summary = await getDashboardSummaryData(studentId, 30);

  let summaryText = `${student.name} is a ${student.age || 'age not specified'} student `;
  summaryText += `who joined LexiEase on ${new Date(student.createdAt).toLocaleDateString()}. `;

  if (student.lastActive) {
    summaryText += `Their last activity was on ${new Date(student.lastActive).toLocaleDateString()}. `;
  }

  if (summary.letters) {
    summaryText += `In letter recognition, they have attempted ${summary.letters.total} letters with an average strength of ${summary.letters.avgStrength}%. `;
  }

  if (summary.words) {
    summaryText += `For words, they have ${summary.words.total} total attempts with a success rate of ${summary.words.successRate}%. `;
  }

  if (summary.sentences) {
    summaryText += `In sentence reading, they have ${summary.sentences.total} attempts with a success rate of ${summary.sentences.successRate}%. `;
  }

  return summaryText;
};

const getGradeLabel = (percent) => {
  if (percent >= 90) return "A";
  if (percent >= 80) return "B";
  if (percent >= 70) return "C";
  if (percent >= 60) return "D";
  return "F";
};

const renderReportHeader = (doc, student, reportName, overallValue, overallLabel) => {
  const reportDate = new Date().toLocaleDateString();
  doc.fillColor('#0f766e').fontSize(20).text('LexCura Clinical Report', { align: 'center' });
  doc.moveDown(0.25);
  doc.fillColor('#334155').fontSize(14).text(`${reportName}`, { align: 'center' });
  doc.moveDown(0.5);

  doc.fillColor('#1e293b').fontSize(12).text(`Student: ${student.name}`);
  doc.text(`Email: ${student.email || 'N/A'}`);
  doc.text(`Age: ${student.age ?? 'N/A'}`);
  doc.text(`Report Date: ${reportDate}`);
  doc.moveDown(0.25);

  if (overallValue != null) {
    const grade = getGradeLabel(Number(overallValue));
    doc.fillColor('#0f766e').fontSize(12).text(`${overallLabel}: ${overallValue}% (${grade})`, { continued: true });
    doc.fillColor('#1f2937').text(``);
    doc.moveDown(0.5);
  }

  doc.fillColor('#0f172a').fontSize(12).text('Student summary:', { underline: true });
};

// ─── Download Letter Report ──────────────────────────────────────────────────
export const downloadStudentLetterReport = async (req, res) => {
  try {
    const student = await getStudentDetail(req.params.studentId);
    const data = await getLetterReportData(req.params.studentId, req.query.timeframe);

    const letters = data.letters || [];
    const avgStrength = letters.length
      ? letters.reduce((acc, l) => acc + Number(l.strength || 0), 0) / letters.length
      : 0;
    const mastered  = letters.filter((l) => Number(l.strength) >= 85).length;
    const practiced = letters.filter((l) => (l.attempts || 0) > 0).length;
    const focusLetters = letters.filter((l) => Number(l.strength) < 70).map((l) => l.letter?.toUpperCase()).slice(0, 8);
    const focusLettersText = focusLetters.length > 0 ? focusLetters.join(', ') : 'None';

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const filename = `Letter_Report_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    // ── Page margins / constants ──────────────────────────────────────────
    const marginL = 40;
    const pageW   = doc.page.width - marginL - 40; // usable width

    // ── Title block ───────────────────────────────────────────────────────
    doc.fillColor('#0f766e').fontSize(26).font('Helvetica-Bold')
       .text('LexCura Clinical Report', { align: 'center' });
    doc.moveDown(0.15);
    doc.fillColor('#0f766e').fontSize(15).font('Helvetica')
       .text('Letter Recognition Report', { align: 'center' });
    doc.moveDown(0.7);

    // ── Student info (left) + Overall box (right) ─────────────────────────
    const infoTopY  = doc.y;
    const boxW      = 210;
    const boxH      = 72;
    const boxX      = doc.page.width - 40 - boxW;

    // Student details
    doc.fontSize(10).fillColor('#1e293b');
    doc.font('Helvetica-Bold').text('Student: ', marginL, infoTopY, { continued: true });
    doc.font('Helvetica').text(`${student.name || 'N/A'}`);
    doc.font('Helvetica-Bold').text('Email: ', marginL, doc.y, { continued: true });
    doc.font('Helvetica').text(`${student.email || 'N/A'}`);
    doc.font('Helvetica-Bold').text('Report Date: ', marginL, doc.y, { continued: true });
    doc.font('Helvetica').text(`${new Date().toLocaleDateString()}`);

    // Overall performance box (teal)
    doc.save();
    doc.rect(boxX, infoTopY, boxW, boxH).fill('#0f766e');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10)
       .text('Overall Performance Summary', boxX + 8, infoTopY + 7, { width: boxW - 16 });
    doc.font('Helvetica').fontSize(10)
       .text(`Avg Strength: ${avgStrength.toFixed(1)}%`,  boxX + 8, infoTopY + 24)
       .text(`Mastered: ${mastered}/${letters.length || 26}`,    boxX + 8, infoTopY + 38)
       .text(`Practiced: ${practiced}/${letters.length || 26}`,  boxX + 8, infoTopY + 52);
    doc.restore();

    doc.moveDown(0.8);

    // ── Clinical Interpretation ───────────────────────────────────────────
    const sectionY1 = doc.y;
    doc.font('Helvetica-Bold').fillColor('#0f172a').fontSize(13)
       .text('CLINICAL INTERPRETATION', marginL, sectionY1);
    doc.moveDown(0.2);
    doc.font('Helvetica').fillColor('#334155').fontSize(10)
       .text(
         letters.length === 0
           ? 'Has not yet attempted any letter exercises. No phoneme-grapheme data is available for clinical interpretation at this time.'
           : 'Letter performance is being tracked through the student letter inventory. Results provide targeted phoneme-grapheme and rate guidance.',
         marginL, doc.y, { width: pageW, lineGap: 3 }
       );
    doc.moveDown(0.6);

    // ── Assessment in Progress ────────────────────────────────────────────
    doc.font('Helvetica-Bold').fillColor('#0f172a').fontSize(13)
       .text('ASSESSMENT IN PROGRESS', marginL, doc.y);
    doc.moveDown(0.2);
    doc.font('Helvetica').fillColor('#1e293b').fontSize(10)
       .text(`Overall strength: ${avgStrength.toFixed(1)}%`,   marginL, doc.y)
       .text(`Letters mastered: ${mastered}/${letters.length || 26}`,   marginL, doc.y)
       .text(`Letters practised: ${practiced}/${letters.length || 26}`, marginL, doc.y)
       .text(`Focus letters: ${focusLettersText}`,              marginL, doc.y);
    doc.moveDown(0.8);

    // ── Metric cards row ──────────────────────────────────────────────────
    const cardW = 145;
    const cardH = 58;
    const cardY = doc.y;
    const vowels     = ['a','e','i','o','u'];
    const vowelItems = letters.filter((l) => vowels.includes(l.letter?.toLowerCase()));
    const consItems  = letters.filter((l) => !vowels.includes(l.letter?.toLowerCase()));
    const vowelAvg   = vowelItems.length
      ? vowelItems.reduce((a, l) => a + (l.strength || 0), 0) / vowelItems.length : 0;
    const consAvg    = consItems.length
      ? consItems.reduce((a, l) => a + (l.strength || 0), 0) / consItems.length  : 0;

    const drawCard = (x, y, title, value) => {
      doc.save();
      doc.roundedRect(x, y, cardW, cardH, 7).fillAndStroke('#ffffff', '#e2e8f0');
      doc.fillColor('#0f766e').font('Helvetica-Bold').fontSize(10).text(title, x + 8, y + 8, { width: cardW - 16 });
      doc.fillColor('#111827').font('Helvetica-Bold').fontSize(20).text(value, x + 8, y + 26);
      doc.restore();
    };

    drawCard(marginL,         cardY, 'Total Letter Mastery', `${avgStrength.toFixed(0)}%`);
    drawCard(marginL + 155,   cardY, 'Vowel Recognition',    `${vowelAvg.toFixed(0)}%`);
    drawCard(marginL + 310,   cardY, 'Consonant Accuracy',   `${consAvg.toFixed(0)}%`);

    doc.y = cardY + cardH + 16; // tight gap after cards

    // ── Alphabet Performance Matrix table ─────────────────────────────────
    // Title + subtitle on same line
    const tableTitleY = doc.y;
    doc.font('Helvetica-Bold').fillColor('#0f172a').fontSize(12)
       .text('Alphabet Performance Matrix', marginL, tableTitleY);

    // "Ordered by Assessment Priority" right-aligned on same line
    doc.font('Helvetica').fillColor('#64748b').fontSize(9)
       .text('Ordered by Assessment Priority',
             marginL, tableTitleY + 2,
             { width: pageW, align: 'right' });

    doc.moveDown(0.35);

    const tableX   = marginL;
    const tableTopY = doc.y;

    // Column widths: Letter Cluster | Mastery | Attempts | Strength Status
    const colW = [160, 90, 80, 155];
    const rowH = 24;
    const totalTableW = colW.reduce((a, b) => a + b, 0);

    // Header row background
    doc.save();
    doc.rect(tableX, tableTopY, totalTableW, rowH - 4).fill('#f1f5f9');
    doc.restore();

    // Header labels
    const headers = ['Letter Cluster', 'Mastery', 'Attempts', 'Strength Status'];
    let hx = tableX;
    headers.forEach((h, i) => {
      doc.font('Helvetica-Bold').fillColor('#334155').fontSize(9)
         .text(h, hx + 6, tableTopY + 6, { width: colW[i] - 10 });
      hx += colW[i];
    });

    // Header bottom border
    doc.moveTo(tableX, tableTopY + rowH - 4)
       .lineTo(tableX + totalTableW, tableTopY + rowH - 4)
       .strokeColor('#cbd5e1').lineWidth(0.5).stroke();

    // Badge pill helper
    const drawBadge = (text, x, y) => {
      const badgeColors = {
        'Exceeded':           { bg: '#dbeafe', text: '#1d4ed8' },  // blue
        'Mastered':           { bg: '#dcfce7', text: '#15803d' },  // green
        'Progressing':        { bg: '#fef9c3', text: '#92400e' },  // yellow-amber
        'Attention Required': { bg: '#fee2e2', text: '#b91c1c' },  // red
      };
      const c = badgeColors[text] || { bg: '#f1f5f9', text: '#334155' };
      const badgeW = 110;
      const badgeH = 14;
      doc.save();
      doc.roundedRect(x, y, badgeW, badgeH, 6).fill(c.bg);
      doc.fillColor(c.text).font('Helvetica').fontSize(8)
         .text(text, x + 6, y + 3, { width: badgeW - 12, align: 'center' });
      doc.restore();
    };

    // Cluster data — order by weakest first (Assessment Priority)
    const clusters = [
      ['A','B','C','D'],
      ['E','F','G','H'],
      ['I','J','K','L'],
      ['M','N','O','P'],
      ['Q','R','S','T'],
      ['U','V','W','X','Y','Z'],
    ];

    // Derive dynamic thresholds from actual student data
    // If no data yet, fall back to sensible absolute thresholds
    const allStrengths = letters.map((l) => Number(l.strength || 0));
    const maxStrength  = allStrengths.length ? Math.max(...allStrengths) : 100;
    const avgAllStrength = allStrengths.length
      ? allStrengths.reduce((a, b) => a + b, 0) / allStrengths.length
      : 0;

    // Thresholds scale relative to the student's own top performance
    const T_EXCEEDED    = Math.min(maxStrength * 0.95, 95); // top ~5% of their best
    const T_MASTERED    = Math.max(avgAllStrength + 10, 70); // above avg + buffer
    const T_PROGRESSING = Math.max(avgAllStrength - 5, 50);  // near avg

    const getRank = (mastery) => {
      if (mastery >= T_EXCEEDED)    return 'Exceeded';
      if (mastery >= T_MASTERED)    return 'Mastered';
      if (mastery >= T_PROGRESSING) return 'Progressing';
      return 'Attention Required';
    };

    // Build rows with computed mastery then sort ascending (attention first)
    const clusterRows = clusters.map((cluster) => {
      const items   = letters.filter((l) => cluster.includes((l.letter || '').toUpperCase()));
      const mastery = items.length
        ? (items.reduce((s, i) => s + Number(i.strength || 0), 0) / items.length)
        : 0;
      const attempts = items.reduce((s, i) => s + (i.attempts || 0), 0);
      const rank     = getRank(mastery);
      return { cluster, mastery, attempts, rank };
    });

    // Sort: Attention Required → Progressing → Mastered → Exceeded
    const rankOrder = { 'Attention Required': 0, 'Progressing': 1, 'Mastered': 2, 'Exceeded': 3 };
    clusterRows.sort((a, b) => rankOrder[a.rank] - rankOrder[b.rank]);

    let ry = tableTopY + rowH;
    clusterRows.forEach((row, idx) => {
      // Alternating stripe
      if (idx % 2 === 0) {
        doc.save();
        doc.rect(tableX, ry, totalTableW, rowH).fill('#f8fafc');
        doc.restore();
      }

      // Row bottom divider
      doc.moveTo(tableX, ry + rowH)
         .lineTo(tableX + totalTableW, ry + rowH)
         .strokeColor('#e2e8f0').lineWidth(0.4).stroke();

      const cellY = ry + 7;
      let cx = tableX;

      // Letter Cluster cell
      doc.font('Helvetica').fillColor('#0f172a').fontSize(10)
         .text(row.cluster.join(', '), cx + 6, cellY, { width: colW[0] - 10 });
      cx += colW[0];

      // Mastery
      doc.font('Helvetica').fillColor('#0f172a').fontSize(10)
         .text(`${row.mastery.toFixed(1)}%`, cx + 6, cellY, { width: colW[1] - 10 });
      cx += colW[1];

      // Attempts
      doc.font('Helvetica').fillColor('#0f172a').fontSize(10)
         .text(`${row.attempts}`, cx + 6, cellY, { width: colW[2] - 10 });
      cx += colW[2];

      // Strength Status badge
      drawBadge(row.rank, cx + 6, ry + 5);

      ry += rowH;
    });

    // Outer border around the whole table
    doc.rect(tableX, tableTopY, totalTableW, rowH + clusterRows.length * rowH)
       .strokeColor('#cbd5e1').lineWidth(0.7).stroke();

    doc.end();
  } catch (error) {
    console.error('Error generating letter report PDF:', error);
    return res.status(500).json({ message: 'Failed to generate letter report' });
  }
};

// ─── Download Word Report ────────────────────────────────────────────────────
export const downloadStudentWordReport = async (req, res) => {
  try {
    const student = await getStudentDetail(req.params.studentId);
    const data    = await getWordReportData(req.params.studentId, req.query.timeframe);

    const twoLetterWords   = data?.twoLetter?.allWords  || [];
    const multiLetterWords = data?.words?.allWords      || [];
    const combined         = data?.combined             || {};
    const hasData          = twoLetterWords.length > 0 || multiLetterWords.length > 0;

    // ── Metrics derived from real data ────────────────────────────────────
    const combinedAccuracy = Number(
      combined.successRate ??
      data.twoLetter?.overview?.successRate ??
      0
    );
    const avgResponseTime = Number(
      combined.avgResponseTime ??
      data.twoLetter?.overview?.avgResponseTime ??
      0
    );
    const baseline        = Number(combined.baseline ?? 78);

    // ── Dynamic phonological paragraph text from real data ─────────────
    let para1 = '';
    let para2 = '';

    if (!hasData) {
      para1 = `${student.name} has not yet completed any word-level exercises. Phonological processing data will populate as sessions are recorded.`;
      para2 = '';
    } else {
      const twoTotal  = data.twoLetter?.overview?.totalAttempts  ?? twoLetterWords.reduce((s, w) => s + (w.totalAttempts || 0), 0);
      const multiTotal = data.words?.overview?.totalAttempts     ?? multiLetterWords.reduce((s, w) => s + (w.totalAttempts || 0), 0);
      const weakWords  = [...twoLetterWords, ...multiLetterWords]
        .filter(w => Number(w.successRate) < 70)
        .map(w => w.word?.toLowerCase())
        .slice(0, 4)
        .join(', ');

      para1 = `During the word-level assessment, ${student.name} demonstrated ${combinedAccuracy >= 80 ? 'high' : combinedAccuracy >= 60 ? 'moderate' : 'developing'} proficiency in decoding word structures across ${twoTotal + multiTotal} total attempts. ` +
        `Phonemic blending was assessed for both two-letter and multi-letter targets, reflecting foundational grapheme-phoneme correspondence.`;

      if (weakWords) {
        para2 = `multi-syllabic decoding challenges`;
      } else {
        para2 = '';
      }
    }

    // ── Document setup ────────────────────────────────────────────────────
    const doc      = new PDFDocument({ size: 'A4', margin: 40 });
    const filename = `Word_Report_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    const ML  = 40;                                  // margin left
    const MR  = 40;                                  // margin right
    const PW  = doc.page.width - ML - MR;            // usable page width (515)

    // ══════════════════════════════════════════════════════════════════════
    // SECTION 1 — Title
    // ══════════════════════════════════════════════════════════════════════
    doc.font('Helvetica-Bold').fillColor('#0f766e').fontSize(26)
       .text('LexCura Clinical Report', { align: 'center' });
    doc.moveDown(0.2);
    doc.font('Helvetica').fillColor('#0f766e').fontSize(15)
       .text('Word Recognition Report', { align: 'center' });
    doc.moveDown(0.8);

    // ══════════════════════════════════════════════════════════════════════
    // SECTION 2 — Student info (left) | Overall summary box (right)
    // ══════════════════════════════════════════════════════════════════════
    const infoTopY = doc.y;
    const BOX_W    = 220;
    const BOX_H    = 78;
    const BOX_X    = doc.page.width - MR - BOX_W;
    const INFO_W   = BOX_X - ML - 20;               // text stops before box

    const infoLines = [
      { label: 'Student: ',     value: student.name     || 'N/A' },
      { label: 'Email: ',       value: student.email    || 'N/A' },
      { label: 'Report Date: ', value: new Date().toLocaleDateString() },
    ];

    let infoY = infoTopY;
    infoLines.forEach(({ label, value }) => {
      doc.font('Helvetica-Bold').fillColor('#1e293b').fontSize(10)
         .text(label, ML, infoY, { continued: true, width: INFO_W });
      doc.font('Helvetica').fillColor('#1e293b')
         .text(value);
      infoY = doc.y;
    });

    // Teal summary box
    doc.save();
    doc.rect(BOX_X, infoTopY, BOX_W, BOX_H).fill('#0f766e');
    doc.font('Helvetica-Bold').fillColor('#ffffff').fontSize(10)
       .text('Overall Performance Summary', BOX_X + 12, infoTopY + 10, { width: BOX_W - 24 });
    doc.font('Helvetica').fillColor('#cce8e5').fontSize(9.5)
       .text(`Combined Accuracy: ${combinedAccuracy.toFixed(1)}%`,       BOX_X + 12, infoTopY + 28)
       .text(`Avg Response Time: ${avgResponseTime.toFixed(2)}s`,         BOX_X + 12, infoTopY + 43);
    doc.restore();

    // Advance cursor past both columns
    doc.y = Math.max(infoY, infoTopY + BOX_H) + 20;

    // ══════════════════════════════════════════════════════════════════════
    // SECTION 3 — Metric cards (3 equal columns, generous padding)
    // ══════════════════════════════════════════════════════════════════════
    const GAP    = 10;
    const CARD_W = Math.floor((PW - GAP) / 2);
    const CARD_H = 80;
    const CARD_Y = doc.y;

    // Card 1 — outlined (same style as cards 2 & 3)
    const c1x = ML;
    doc.save();
    doc.roundedRect(c1x, CARD_Y, CARD_W, CARD_H, 5).strokeColor('#d1d5db').lineWidth(1).stroke();
    doc.font('Helvetica').fillColor('#6b7280').fontSize(8.5)
       .text('Combined Accuracy (%)', c1x + 14, CARD_Y + 12, { width: CARD_W - 28 });
    doc.font('Helvetica-Bold').fillColor('#111827').fontSize(26)
       .text(`${combinedAccuracy.toFixed(1)}`, c1x + 14, CARD_Y + 28);
    doc.font('Helvetica').fillColor('#9ca3af').fontSize(8.5)
       .text(`Above baseline (${baseline}%)`, c1x + 14, CARD_Y + 62);
    doc.restore();

    // Card 2 — outlined
    const c2x = ML + CARD_W + GAP;
    doc.save();
    doc.roundedRect(c2x, CARD_Y, CARD_W, CARD_H, 5).strokeColor('#d1d5db').lineWidth(1).stroke();
    doc.font('Helvetica').fillColor('#6b7280').fontSize(8.5)
       .text('Avg. Response Time (s)', c2x + 14, CARD_Y + 12, { width: CARD_W - 28 });
    doc.font('Helvetica-Bold').fillColor('#111827').fontSize(26)
       .text(`${(avgResponseTime / 1000).toFixed(2)}`, c2x + 14, CARD_Y + 28);
    doc.font('Helvetica').fillColor('#9ca3af').fontSize(8.5)
       .text('Normative: 1.25s', c2x + 14, CARD_Y + 62);
    doc.restore();



    doc.y = CARD_Y + CARD_H + 22;

    // ══════════════════════════════════════════════════════════════════════
    // SECTION 4 — Phonological Processing Analysis
    // ══════════════════════════════════════════════════════════════════════
    const phHeadY = doc.y;

    // Teal circle badge with "P"
    doc.save();
    doc.circle(ML + 8, phHeadY + 8, 8).fill('#0f766e');
    doc.font('Helvetica-Bold').fillColor('#ffffff').fontSize(9)
       .text('P', ML + 4.5, phHeadY + 4);
    doc.restore();

    doc.font('Helvetica-Bold').fillColor('#0f172a').fontSize(14)
       .text('Phonological Processing Analysis', ML + 22, phHeadY);
    doc.moveDown(0.55);

    // Paragraph 1 — dynamic from data
    doc.font('Helvetica').fillColor('#374151').fontSize(10)
       .text(para1, ML, doc.y, { width: PW, lineGap: 3 });
    doc.moveDown(0.45);

    // Paragraph 2 — only if there's data with weak words (with inline bold)
    if (hasData) {
      const weakWords = [...twoLetterWords, ...multiLetterWords]
        .filter(w => Number(w.successRate) < 70)
        .map(w => w.word?.toLowerCase())
        .slice(0, 4);

      if (weakWords.length > 0) {
        const p2y = doc.y;
        doc.font('Helvetica').fillColor('#374151').fontSize(10)
           .text('However, significant ', ML, p2y, { continued: true, lineGap: 3 });
        doc.font('Helvetica-Bold').fillColor('#0f172a')
           .text('multi-syllabic decoding challenges', { continued: true });
        doc.font('Helvetica').fillColor('#374151')
           .text(
             ` emerged for words including: ${weakWords.join(', ')}. ` +
             `Fluency trends indicate delays in response latency, often resulting in staccato reading patterns or medial phoneme omission.`,
             { lineGap: 3 }
           );
      } else {
        doc.font('Helvetica').fillColor('#374151').fontSize(10)
           .text(
             `${student.name} showed consistent accuracy across practised words. ` +
             `No significant decoding breakdowns were observed in the current session data.`,
             ML, doc.y, { width: PW, lineGap: 3 }
           );
      }
    }

    doc.moveDown(1);

    // ══════════════════════════════════════════════════════════════════════
    // SECTION 5 — Word tables (only rendered if data exists)
    // ══════════════════════════════════════════════════════════════════════

    const drawWordTable = (sectionLabel, wordList) => {
      if (!wordList || wordList.length === 0) return;

      // Section heading label
      doc.font('Helvetica-Bold').fillColor('#475569').fontSize(9)
         .text(sectionLabel.toUpperCase(), ML, doc.y, { characterSpacing: 0.4 });
      doc.moveDown(0.4);

      const TBL_X   = ML;
      const TBL_Y   = doc.y;
      const TBL_W   = PW;
      const ROW_H   = 30;                           // taller rows = more breathing room
      const HDR_H   = 22;

      // Column widths — 3 columns
      const COL = [
        Math.floor(TBL_W * 0.40),  // Target Word
        Math.floor(TBL_W * 0.30),  // Accuracy
        TBL_W - Math.floor(TBL_W * 0.40) - Math.floor(TBL_W * 0.30), // Resp. Time
      ];

      // Header background
      doc.save();
      doc.rect(TBL_X, TBL_Y, TBL_W, HDR_H).fill('#f8fafc');
      doc.restore();

      // Header text
      const HDR_COLS = ['Target Word', 'Accuracy', 'Resp. Time'];
      let hx = TBL_X;
      HDR_COLS.forEach((col, i) => {
        doc.font('Helvetica').fillColor('#64748b').fontSize(9)
           .text(col, hx + 10, TBL_Y + 7, { width: COL[i] - 14 });
        hx += COL[i];
      });

      // Header bottom divider
      doc.moveTo(TBL_X, TBL_Y + HDR_H)
         .lineTo(TBL_X + TBL_W, TBL_Y + HDR_H)
         .strokeColor('#e2e8f0').lineWidth(0.6).stroke();

      let ry = TBL_Y + HDR_H;

      wordList.slice(0, 8).forEach((word) => {
        const accuracy = Number(word.successRate) || 0;
        const accColor = accuracy < 70 ? '#dc2626' : accuracy < 85 ? '#b45309' : '#334155';
        const rtVal    = word.avgResponseTime != null
          ? `${(Number(word.avgResponseTime) / 1000).toFixed(2)}s`
          : 'N/A';
        const cellY    = ry + (ROW_H - 10) / 2;

        let cx = TBL_X;

        // Target Word — teal bold
        doc.font('Helvetica-Bold').fillColor('#0f766e').fontSize(10)
           .text((word.word || '').toLowerCase(), cx + 10, cellY, { width: COL[0] - 14 });
        cx += COL[0];

        // Accuracy
        doc.font('Helvetica').fillColor(accColor).fontSize(10)
           .text(`${accuracy}%`, cx + 10, cellY, { width: COL[1] - 14 });
        cx += COL[1];

        // Response time
        doc.font('Helvetica').fillColor('#334155').fontSize(10)
           .text(rtVal, cx + 10, cellY, { width: COL[2] - 14 });

        ry += ROW_H;

        // Row bottom divider
        doc.moveTo(TBL_X, ry)
           .lineTo(TBL_X + TBL_W, ry)
           .strokeColor('#f1f5f9').lineWidth(0.5).stroke();
      });

      // Outer border — subtle, rounded feel via straight rect
      doc.rect(TBL_X, TBL_Y, TBL_W, HDR_H + wordList.slice(0,8).length * ROW_H)
         .strokeColor('#e2e8f0').lineWidth(0.7).stroke();

      doc.y = TBL_Y + HDR_H + wordList.slice(0, 8).length * ROW_H + 18;
    };

    drawWordTable('Multi-Letter & Complex Words', multiLetterWords);

    doc.end();
  } catch (error) {
    console.error('Error generating word report PDF:', error);
    return res.status(500).json({ message: 'Failed to generate word report' });
  }
};

// ─── Download Sentence Report ────────────────────────────────────────────────
// ─── Download Sentence Report ────────────────────────────────────────────────
export const downloadStudentSentenceReport = async (req, res) => {
  try {
    const student = await getStudentDetail(req.params.studentId);
    const data    = await getSentenceReportData(req.params.studentId, req.query.timeframe);

    const attempts        = data?.attempts || [];
    const hasData         = attempts.length > 0;
    const overallRate     = Number(data?.successRate ?? 0);
    const avgLatencyMs    = hasData
      ? attempts.reduce((s, a) => s + (a.responseTime || 0), 0) / attempts.length : 0;
    const avgLatency      = (avgLatencyMs / 1000).toFixed(1);
    const hesitationScore = Number(data?.eyeTracking?.hesitationScore ?? data?.hesitationScore ?? 0);
    const hesitationLevel = hesitationScore >= 0.7 ? 'High Hesitation' : hesitationScore >= 0.4 ? 'Moderate' : 'Low';
    const hesitationColor = hesitationScore >= 0.7 ? '#dc2626' : hesitationScore >= 0.4 ? '#b45309' : '#16a34a';
    const hardSessions    = attempts.filter(a => (a.responseTime || 0) / 1000 > 3 || !a.correct).length;
    const easySessions    = attempts.length - hardSessions;
    const totalTracked    = attempts.length;

    const doc      = new PDFDocument({ size: 'A4', margin: 40 });
    const filename = `Sentence_Report_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    const ML = 40;
    const MR = 40;
    const PW = doc.page.width - ML - MR; // 515

    // ── TITLE ────────────────────────────────────────────────────────────────
    doc.font('Helvetica-Bold').fillColor('#0f766e').fontSize(26)
       .text('LexCura Clinical Report', { align: 'center' });
    doc.moveDown(0.2);
    doc.font('Helvetica').fillColor('#0f766e').fontSize(15)
       .text('Sentence Reading Report', { align: 'center' });
    doc.moveDown(0.7);

    // ── STUDENT INFO (left) + OVERALL BOX (right) ────────────────────────────
    const infoTopY = doc.y;
    const BOX_W   = 220;
    const BOX_H   = 78;
    const BOX_X   = doc.page.width - MR - BOX_W;
    const INFO_W  = BOX_X - ML - 20;

    let infoY = infoTopY;
    [
      { label: 'Student: ',     value: student.name     || 'N/A' },
      { label: 'Email: ',       value: student.email    || 'N/A' },
      { label: 'Report Date: ', value: new Date().toLocaleDateString() },
    ].forEach(({ label, value }) => {
      doc.font('Helvetica-Bold').fillColor('#1e293b').fontSize(10)
         .text(label, ML, infoY, { continued: true, width: INFO_W });
      doc.font('Helvetica').fillColor('#1e293b').text(value);
      infoY = doc.y;
    });

    doc.save();
    doc.rect(BOX_X, infoTopY, BOX_W, BOX_H).fill('#0f766e');
    doc.font('Helvetica-Bold').fillColor('#ffffff').fontSize(10)
       .text('Overall Performance Summary', BOX_X + 12, infoTopY + 10, { width: BOX_W - 24 });
    doc.font('Helvetica').fillColor('#cce8e5').fontSize(9.5)
       .text(`Narrative Accuracy: ${overallRate}%`, BOX_X + 12, infoTopY + 28)
       .text(`Avg Response Time: ${avgLatency}s`,   BOX_X + 12, infoTopY + 43)
       .text(`Sessions Tracked: ${totalTracked}`,   BOX_X + 12, infoTopY + 58);
    doc.restore();

    doc.y = Math.max(infoY, infoTopY + BOX_H) + 18;

    // ── TWO METRIC CARDS ─────────────────────────────────────────────────────
    const CARD_GAP = 14;
    const CARD_W   = Math.floor((PW - CARD_GAP) / 2);
    const CARD_H   = 72;
    const CARD_Y   = doc.y;

    const drawMetricCard = (x, y, w, h, iconColor, label, bigVal) => {
      doc.save();
      doc.roundedRect(x, y, w, h, 6).fillAndStroke('#ffffff', '#e5e7eb');
      doc.roundedRect(x + 12, y + 14, 28, 28, 5).fill(iconColor);
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11).text('■', x + 19, y + 20);
      doc.font('Helvetica').fillColor('#6b7280').fontSize(8)
         .text(label.toUpperCase(), x + 50, y + 14, { width: w - 62, characterSpacing: 0.3 });
      doc.font('Helvetica-Bold').fillColor('#111827').fontSize(26)
         .text(bigVal, x + 50, y + 28);
      doc.restore();
    };

    drawMetricCard(ML,                     CARD_Y, CARD_W, CARD_H, '#3b82f6', 'Combined Accuracy', `${overallRate}%`);
    drawMetricCard(ML + CARD_W + CARD_GAP, CARD_Y, CARD_W, CARD_H, '#6366f1', 'Avg Response Time', `${avgLatency}s`);

    doc.y = CARD_Y + CARD_H + 16;

    // ── CLINICAL NARRATIVE ────────────────────────────────────────────────────
    const NARR_Y = doc.y;

    // Clinical Narrative header
    doc.save();
    doc.roundedRect(ML, NARR_Y, 16, 16, 3).fill('#3b82f6');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8).text('N', ML + 5, NARR_Y + 4);
    doc.restore();
    doc.font('Helvetica-Bold').fillColor('#0f172a').fontSize(11)
       .text('Clinical Narrative Analysis', ML + 22, NARR_Y + 1);

    const narr_box_y = NARR_Y + 22;
    const below75 = attempts.filter(a => Number(a.accuracy ?? 0) < 75).length;
    const narrativeText = hasData
      ? `${student.name} shows ${overallRate >= 75 ? 'strong' : 'emerging'} sentence accuracy (${overallRate}%) across ${attempts.length} attempt${attempts.length !== 1 ? 's' : ''} with ${overallRate >= 75 ? 'good' : 'slow'} retrieval latency (${avgLatency}s). Focus on 3+ syllable targets and clause boundary planning; ${below75} sentence${below75 !== 1 ? 's are' : ' is'} below 75% accuracy.`
      : `${student.name} has not yet completed any sentence-level exercises. Clinical narrative data will populate as sessions are recorded.`;

    doc.save();
    doc.roundedRect(ML, narr_box_y, PW, 76, 5).fillAndStroke('#f8fafc', '#e2e8f0');
    doc.font('Helvetica').fillColor('#374151').fontSize(9.5)
       .text(narrativeText, ML + 10, narr_box_y + 10, { width: PW - 20, lineGap: 3 });
    doc.restore();

    doc.y = NARR_Y + 110;

    // ── SENTENCE PERFORMANCE TABLE ────────────────────────────────────────────
    doc.font('Helvetica-Bold').fillColor('#0f172a').fontSize(13)
       .text('Sentence Performance Table', ML, doc.y);
    doc.moveDown(0.5);

    const TBL_X = ML;
    const TBL_Y = doc.y;
    const TBL_W = PW;
    const HDR_H = 22;
    const ROW_H = 28;

    // Cols: TARGET SENTENCE | ACCURACY | LATENCY | STATUS
    const COL = [
      Math.floor(TBL_W * 0.46),
      Math.floor(TBL_W * 0.18),
      Math.floor(TBL_W * 0.18),
      TBL_W - Math.floor(TBL_W * 0.46) - Math.floor(TBL_W * 0.18) * 2,
    ];

    doc.save();
    doc.rect(TBL_X, TBL_Y, TBL_W, HDR_H).fill('#f1f5f9');
    doc.restore();

    ['TARGET SENTENCE', 'ACCURACY', 'LATENCY', 'STATUS'].forEach((lbl, i) => {
      const hx2 = TBL_X + COL.slice(0, i).reduce((a, b) => a + b, 0);
      doc.font('Helvetica').fillColor('#64748b').fontSize(8)
         .text(lbl, hx2 + 10, TBL_Y + 7, { width: COL[i] - 14, characterSpacing: 0.2 });
    });

    doc.moveTo(TBL_X, TBL_Y + HDR_H)
       .lineTo(TBL_X + TBL_W, TBL_Y + HDR_H)
       .strokeColor('#e2e8f0').lineWidth(0.5).stroke();

    if (!hasData) {
      doc.font('Helvetica').fillColor('#94a3b8').fontSize(9.5)
         .text('No sentence data available yet.', TBL_X + 10, TBL_Y + HDR_H + 10);
    } else {
      let ry2 = TBL_Y + HDR_H;

      attempts.slice(0, 10).forEach((attempt, idx) => {
        const accuracy = Number(attempt.accuracy ?? (attempt.correct ? 100 : 0));
        const latency  = ((attempt.responseTime || 0) / 1000).toFixed(1);
        const passed   = accuracy >= 75;
        const cellY2   = ry2 + (ROW_H - 10) / 2;

        let cx2 = TBL_X;

        // Target sentence
        doc.font('Helvetica').fillColor('#1e293b').fontSize(9.5)
           .text(`${idx + 1}. ${(attempt.sentence || '').slice(0, 48)}`,
                 cx2 + 10, cellY2, { width: COL[0] - 16 });
        cx2 += COL[0];

        // Accuracy
        const accColor2 = accuracy >= 75 ? '#16a34a' : accuracy >= 50 ? '#b45309' : '#dc2626';
        doc.font('Helvetica').fillColor(accColor2).fontSize(9.5)
           .text(`${accuracy}%`, cx2 + 10, cellY2, { width: COL[1] - 14 });
        cx2 += COL[1];

        // Latency
        doc.font('Helvetica').fillColor('#374151').fontSize(9.5)
           .text(`${latency}s`, cx2 + 10, cellY2, { width: COL[2] - 14 });
        cx2 += COL[2];

        // Status pill
        const pill_w = 38;
        const pill_x = cx2 + 10;
        const pill_y = ry2 + (ROW_H - 14) / 2;
        doc.save();
        doc.roundedRect(pill_x, pill_y, pill_w, 14, 7).fill(passed ? '#dcfce7' : '#fee2e2');
        doc.font('Helvetica-Bold').fillColor(passed ? '#15803d' : '#b91c1c').fontSize(7.5)
           .text(passed ? 'PASS' : 'FAIL', pill_x, pill_y + 3, { width: pill_w, align: 'center' });
        doc.restore();

        ry2 += ROW_H;

        doc.moveTo(TBL_X, ry2)
           .lineTo(TBL_X + TBL_W, ry2)
           .strokeColor('#f1f5f9').lineWidth(0.4).stroke();
      });

      doc.rect(TBL_X, TBL_Y, TBL_W, HDR_H + attempts.slice(0, 10).length * ROW_H)
         .strokeColor('#e2e8f0').lineWidth(0.7).stroke();
    }

    doc.end();
  } catch (error) {
    console.error('Error generating sentence report PDF:', error);
    return res.status(500).json({ message: 'Failed to generate sentence report' });
  }
};