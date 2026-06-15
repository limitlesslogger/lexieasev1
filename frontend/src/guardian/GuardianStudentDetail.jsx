import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import {
  SearchablePaginatedBlocks,
  SearchablePaginatedTable,
} from "../components/SearchablePaginatedList";

/* Helper: Format time ago */
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function GuardianStudentDetail() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [summary, setSummary] = useState(null);
  const [selectedReport, setSelectedReport] = useState("summary");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState(7);

  // colors used by student report pages; guardian will adopt same palette
  const reportColors = {
    summary: "#64748b",
    letters: "#10b981",       // green
    words: "#8b5cf6",         // purple
    sentences: "#3b82f6",     // blue
  };
  const currentColor = reportColors[selectedReport] || "#3b82f6";  // fallback

  useEffect(() => {
    fetchStudentDetail();
  }, [studentId]);

  useEffect(() => {
    if (student) {
      fetchSummary();
    }
  }, [student, timeframe]);

  useEffect(() => {
    if (selectedReport !== "summary") {
      fetchReport(selectedReport);
    }
  }, [selectedReport, timeframe, studentId]);

  const fetchStudentDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch(`/api/guardian/students/${studentId}`);
      setStudent(data.student);
    } catch (err) {
      console.error("Failed to fetch student:", err);
      setError("Failed to load student details");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await apiFetch(
        `/api/guardian/students/${studentId}/summary?timeframe=${timeframe}`
      );
      setSummary(data.summary);
    } catch (err) {
      console.error("Failed to fetch summary:", err);
    }
  };

  const fetchReport = async (reportType) => {
    try {
      setLoading(true);
      let url = "";
      if (reportType === "words") {
        url = `/api/guardian/students/${studentId}/report/words?timeframe=${timeframe}`;
      } else if (reportType === "sentences") {
        url = `/api/guardian/students/${studentId}/report/sentences?timeframe=${timeframe}`;
      } else if (reportType === "letters") {
        url = `/api/guardian/students/${studentId}/report/letters?timeframe=${timeframe}`;
      }

      if (url) {
        const data = await apiFetch(url);
        setReportData(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch report:", err);
      setError(`Failed to load ${reportType} report`);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Helpers for word/sentence visuals ----------
  const computeTrend = (attempts) => {
    if (!attempts || attempts.length < 4) return null;
    const mid = Math.floor(attempts.length / 2);
    const older = attempts.slice(0, mid);
    const recent = attempts.slice(mid);
    const olderAvg = older.filter(a => a.correct).length / older.length;
    const recentAvg = recent.filter(a => a.correct).length / recent.length;
    const change = ((recentAvg - olderAvg) * 100).toFixed(1);
    const direction =
      Math.abs(change) < 2 ? 'stable' : change > 0 ? 'improving' : 'declining';
    return {
      direction,
      change,
      previousAvg: (olderAvg * 100).toFixed(1),
      recentAccuracy: (recentAvg * 100).toFixed(1),
    };
  };

  const deriveWordMetrics = (data) => {
    if (!data) return null;
    const attempts = data.attempts || [];
    const total = attempts.length;
    const correct = attempts.filter(a => a.correct).length;
    const successRate = total ? ((correct / total) * 100).toFixed(1) : 0;
    const avgAccuracy = total
      ? (
          attempts.reduce((sum, a) => sum + (a.accuracy || 0), 0) / total
        ).toFixed(1)
      : 0;
    const avgResponse = total
      ? (
          attempts.reduce((sum, a) => sum + (a.responseTime || 0), 0) / total
        ).toFixed(0)
      : 0;
    const trend = computeTrend(attempts);
    const wordMap = {};
    attempts.forEach(a => {
      const w = a.word || '';
      if (!wordMap[w]) wordMap[w] = { errors: 0, attempts: 0 };
      wordMap[w].attempts++;
      if (!a.correct) wordMap[w].errors++;
    });
    const problemWords = Object.entries(wordMap)
      .map(([word, v]) => ({
        word,
        errorCount: v.errors,
        errorRate: v.attempts ? ((v.errors / v.attempts) * 100).toFixed(1) : 0,
      }))
      .filter(o => o.errorCount > 0);
    // phoneme problems: letters from failed words
    const letterMap = {};
    attempts.filter(a => !a.correct).forEach(a => {
      (a.word || "").split("").forEach(ch => {
        const l = ch.toLowerCase();
        letterMap[l] = (letterMap[l] || 0) + 1;
      });
    });
    const problemLetters = Object.entries(letterMap).map(([letter, count]) => ({
      letter,
      errorCount: count,
      errorRate: null,
    }));
    return { total, successRate, avgAccuracy, avgResponse, trend, problemWords, problemLetters, correctAttempts: correct };
  };

  const deriveSentenceMetrics = (data) => {
    if (!data) return null;
    const attempts = data.attempts || [];
    const total = attempts.length;
    const correct = attempts.filter(a => a.correct).length;
    const successRate = total ? ((correct / total) * 100).toFixed(1) : 0;
    
    // Calculate avg accuracy - safely handle missing values
    const validAccuracies = attempts.filter(a => a.accuracy !== null && a.accuracy !== undefined && !isNaN(a.accuracy));
    const avgAccuracy = validAccuracies.length > 0
      ? (validAccuracies.reduce((sum, a) => sum + parseFloat(a.accuracy || 0), 0) / validAccuracies.length).toFixed(1)
      : 0;
    
    const avgResponse = total
      ? (
          attempts.reduce((sum, a) => sum + (a.responseTime || 0), 0) / total
        ).toFixed(0)
      : 0;
    const trend = computeTrend(attempts);
    
    // letters from incorrect sentences as problem phonemes - with error rate calculation
    const letterMap = {};
    const letterAttempts = {};
    
    attempts.forEach(a => {
      (a.sentence || "").split("").forEach(ch => {
        const l = ch.toLowerCase();
        if (!letterAttempts[l]) letterAttempts[l] = { total: 0, errors: 0 };
        letterAttempts[l].total++;
        if (!a.correct) {
          letterMap[l] = (letterMap[l] || 0) + 1;
          letterAttempts[l].errors++;
        }
      });
    });
    
    const problemLetters = Object.entries(letterMap)
      .map(([letter, errorCount]) => {
        const letterTotal = letterAttempts[letter]?.total || 0;
        const letterErrors = letterAttempts[letter]?.errors || 0;
        const errorRate = letterTotal > 0 
          ? parseFloat(((letterErrors / letterTotal) * 100).toFixed(1))
          : 0;
        
        return {
          letter,
          errorCount,
          errorRate,
        };
      })
      .filter(o => o.errorCount > 0 && !isNaN(o.errorRate) && o.errorRate > 0) // Only show phonemes with actual errors and valid error rates
      .sort((a, b) => b.errorRate - a.errorRate);

    const defaultEyeTracking = {
      tracked: 0,
      avgVisualScore: "0.00",
      hesitationLevel: "Unknown",
      hardSessions: 0,
      hardRate: "0.0",
    };

    return {
      total,
      successRate,
      avgAccuracy,
      avgResponse,
      trend,
      problemWords: [],
      problemLetters,
      eyeTracking: data.eyeTracking || defaultEyeTracking,
    };
  };

  if (loading && !student) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingMessage}>Loading student details...</div>
      </div>
    );
  }

  if (error && !student) {
    return (
      <div style={styles.container}>
        <div style={styles.errorMessage}>{error}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        {student && (
          <div style={styles.studentHeader}>
            <div style={styles.avatarLarge}>
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={styles.studentName}>{student.name}</h1>
              <p style={styles.studentEmail}>{student.email}</p>
              {student.age != null && (
                <p style={styles.studentMeta}>Age: {student.age}</p>
              )}
              {student.lastActive && (
                <p style={styles.studentMeta}>
                  Last active: {new Date(student.lastActive).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Report Navigation */}
      <div style={styles.reportNav}>
        <button
          onClick={() => setSelectedReport("summary")}
          style={{
            ...styles.reportBtn,
            ...(selectedReport === "summary" ? styles.reportBtnActive(reportColors.summary) : {}),
          }}
        >
          Summary
        </button>
        <button
          onClick={() => setSelectedReport("letters")}
          style={{
            ...styles.reportBtn,
            ...(selectedReport === "letters" ? styles.reportBtnActive(reportColors.letters) : {}),
          }}
        >
          Letters Report
        </button>
        <button
          onClick={() => setSelectedReport("words")}
          style={{
            ...styles.reportBtn,
            ...(selectedReport === "words" ? styles.reportBtnActive(reportColors.words) : {}),
          }}
        >
          Words Report
        </button>
        <button
          onClick={() => setSelectedReport("sentences")}
          style={{
            ...styles.reportBtn,
            ...(selectedReport === "sentences" ? styles.reportBtnActive(reportColors.sentences) : {}),
          }}
        >
          Sentences Report
        </button>
      </div>

      {/* Summary Cards */}
      {selectedReport === "summary" && summary && (
        <div style={styles.summarySection}>
          <div style={styles.summaryGrid}>
            {student && (
              <div style={{ ...styles.summaryCard, cursor: "default" }}>
                <div style={{ ...styles.cardIcon, color: "#1e40af" }}>👤</div>
                <h3 style={styles.cardTitle}>Profile</h3>
                <div style={styles.cardStat}>{student.name}</div>
                {student.age != null && <div style={styles.cardSubValue}>Age: {student.age}</div>}
                <div style={styles.cardSubValue}>{student.email}</div>
                {student.createdAt && (
                  <div style={{ ...styles.cardSubValue, fontSize: 12, marginTop: 4, color: "#94a3b8" }}>
                    Member since {new Date(student.createdAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}
            {student && student.lastActive && (
              <div style={{ ...styles.summaryCard, cursor: "default" }}>
                <div style={{ ...styles.cardIcon, color: "#059669" }}>⏱️</div>
                <h3 style={styles.cardTitle}>Activity</h3>
                <div style={styles.cardStat}>{new Date(student.lastActive).toLocaleString()}</div>
                <div style={styles.cardSubValue}>{getTimeAgo(new Date(student.lastActive))}</div>
              </div>
            )}
            {summary.sentences && (
              <div style={{ ...styles.summaryCard, cursor: "default" }}>
                <div style={{ ...styles.cardIcon, color: reportColors.sentences }}>📖</div>
                <h3 style={styles.cardTitle}>Sentences</h3>
                <div style={styles.cardStat}>{summary.sentences.total}</div>
                <div style={styles.cardSubValue}>Success: {summary.sentences.successRate}%</div>
              </div>
            )}
            {summary.words && (
              <div style={{ ...styles.summaryCard, cursor: "default" }}>
                <div style={{ ...styles.cardIcon, color: reportColors.words }}>💬</div>
                <h3 style={styles.cardTitle}>Words</h3>
                <div style={styles.cardStat}>{summary.words.total}</div>
                <div style={styles.cardSubValue}>Success: {summary.words.successRate}%</div>
              </div>
            )}
            {summary.letters && (
              <div style={{ ...styles.summaryCard, cursor: "default" }}>
                <div style={{ ...styles.cardIcon, color: reportColors.letters }}>🔤</div>
                <h3 style={styles.cardTitle}>Letters</h3>
                <div style={styles.cardStat}>{summary.letters.total}</div>
                <div style={styles.cardSubValue}>Strength: {summary.letters.avgStrength}%</div>
              </div>
            )}
            {summary && (
              <div style={{ ...styles.summaryCard, cursor: "default" }}>
                <div style={{ ...styles.cardIcon, color: "#64748b" }}>📊</div>
                <h3 style={styles.cardTitle}>Total Attempts</h3>
                <div style={styles.cardStat}>
                  {(summary.sentences?.total || 0) + (summary.words?.total || 0) + (summary.letters?.total || 0)}
                </div>
              </div>
            )}
          </div>

          <div style={styles.timeframeControl}>
            <label style={styles.timeframeLabel}>Filter by timeframe:</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(Number(e.target.value))}
              style={styles.timeframeSelect}
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>
      )}

      {/* Letter Report */}
      {selectedReport === "letters" && reportData && (
        <div style={styles.reportSection}>
          <h2 style={{...styles.reportTitle, borderBottomColor: currentColor}}>Letters Report</h2>

          {/* strength overview grid + legend */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>🔡 Letter Strength Overview</h3>
            <p style={styles.cardSubtitle}>
              🟢 Strong (≥40) &nbsp;·&nbsp; 🟡 Developing (0–39) &nbsp;·&nbsp;
              🔴 Needs Focus (&lt;0) &nbsp;·&nbsp; ⚪ Not yet practised
            </p>
            {/** simplified inline version of LetterStrengthGrid **/}
            <div style={styles.masteryGrid}>
              {"abcdefghijklmnopqrstuvwxyz".split("").map((char) => {
                const item = (reportData.letters || []).find(l => l.letter.toLowerCase() === char);
                const notPractised = !item || item.attempts === 0;
                const strength = item ? parseFloat(item.strength) : null;
                const bg = notPractised   ? "#f1f5f9"
                  : strength >= 40        ? "#d1fae5"
                  : strength >= 0         ? "#fef3c7"
                  :                         "#fee2e2";
                const textColor = notPractised ? "#94a3b8"
                  : strength >= 40            ? "#065f46"
                  : strength >= 0             ? "#92400e"
                  :                             "#991b1b";
                return (
                  <div
                    key={char}
                    title={
                      notPractised
                        ? `${char.toUpperCase()}: not yet practised`
                        : `${char.toUpperCase()}: ${item.attempts} attempts · strength ${strength.toFixed(1)}`
                    }
                    style={{ ...styles.masteryCell, background: bg, color: textColor }}
                  >
                    <span style={styles.masteryLetter}>{char.toUpperCase()}</span>
                    {!notPractised && (
                      <span style={styles.masteryPct}>
                        {strength >= 0 ? "+" : ""}{strength.toFixed(0)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* problem & strong letters */}
          <div style={styles.twoColumnGrid}>
            {(() => {
              const all = reportData.letters || [];
              const problems = all.filter(l => parseFloat(l.strength) < 0);
              const strong = all.filter(l => parseFloat(l.strength) >= 0)
                                .sort((a,b)=>parseFloat(b.strength)-parseFloat(a.strength));
              return (
                <>
                  {problems.length > 0 && (
                    <div style={styles.card}>
                      <h3 style={styles.cardTitle}>⚠️ Letters Needing Focus</h3>
                      <div style={styles.problemList}>
                        {problems.map((item, idx) => {
                          const strength = parseFloat(item.strength);
                          const barWidth = Math.min(100, Math.abs(strength));
                          return (
                            <div key={idx} style={styles.problemItem}>
                              <div style={{ ...styles.badge, background: "linear-gradient(135deg,#ef4444,#dc2626)" }}>
                                {item.letter.toUpperCase()}
                              </div>
                              <div style={styles.problemInfo}>
                                <span style={styles.problemCount}>
                                  {item.attempts} attempt{item.attempts !== 1 ? "s" : ""} · strength {strength.toFixed(1)}
                                </span>
                                <div style={styles.progressBarBg}>
                                  <div style={{ ...styles.progressBarFill, width: `${barWidth}%`, background: "#ef4444" }} />
                                </div>
                              </div>
                              <span style={styles.strengthLabel}>{strength.toFixed(0)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {strong.length > 0 && (
                    <div style={styles.card}>
                      <h3 style={styles.cardTitle}>✅ Strongest Letters</h3>
                      <div style={styles.problemList}>
                        {strong.slice(0, 6).map((item, idx) => {
                          const strength = parseFloat(item.strength);
                          const barWidth = Math.min(100, strength);
                          return (
                            <div key={idx} style={styles.problemItem}>
                              <div style={{
                                ...styles.badge,
                                background: strength >= 40
                                  ? "linear-gradient(135deg,#10b981,#059669)"
                                  : "linear-gradient(135deg,#f59e0b,#d97706)",
                              }}>
                                {item.letter.toUpperCase()}
                              </div>
                              <div style={styles.problemInfo}>
                                <span style={styles.problemCount}>
                                  {item.attempts} attempt{item.attempts !== 1 ? "s" : ""} · strength {strength.toFixed(1)}
                                </span>
                                <div style={styles.progressBarBg}>
                                  <div style={{
                                    ...styles.progressBarFill,
                                    width: `${barWidth}%`,
                                    background: strength >= 40 ? "#10b981" : "#f59e0b",
                                  }} />
                                </div>
                              </div>
                              <span style={styles.strengthLabel}>{strength.toFixed(0)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

        </div>
      )}

      {/* Words Report (guardian now matches student style) */}
      {selectedReport === "words" && reportData && (() => {
        const twM = reportData.twoLetter;
        const wdM = reportData.words;
        const cmb = reportData.combined;

        const combinedAttempts = cmb?.totalAttempts ?? ((twM?.overview?.totalAttempts ?? 0) + (wdM?.overview?.totalAttempts ?? 0));
        const combinedCorrect = cmb?.correctAttempts ?? ((twM?.overview?.correctAttempts ?? 0) + (wdM?.overview?.correctAttempts ?? 0));
        const combinedRate = cmb?.successRate ?? (combinedAttempts ? +((combinedCorrect / combinedAttempts) * 100).toFixed(1) : 0);
        const avgRT = cmb?.avgResponseTime ?? (() => {
          const rts = [twM?.overview?.avgResponseTime, wdM?.overview?.avgResponseTime].filter(Boolean);
          return rts.length ? rts.reduce((a, b) => a + b, 0) / rts.length : 0;
        })();

        const twoRate = twM?.overview?.successRate || 0;
        const wordRate = wdM?.overview?.successRate || 0;
        const similarTrend = cmb?.trend || twM?.trend || wdM?.trend;

        const allProblemWords = [...(twM?.problemWords || []), ...(wdM?.problemWords || [])].slice(0, 6);
        const allProblemLetters = [...(twM?.problemLetters || []), ...(wdM?.problemLetters || [])].slice(0, 6);

        const allWordsPracticed = [
          ...((twM?.allWords || []).map(w => ({ ...w, level: "Two-Letter" }))),
          ...((wdM?.allWords || []).map(w => ({ ...w, level: "Multi-Letter" }))),
        ].sort((a, b) => parseFloat(b.avgResponseTime) - parseFloat(a.avgResponseTime));

        return (
          <div style={styles.reportSection}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
              <h2 style={styles.reportTitle}>🔡 Word Practice Report</h2>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[7, 30, 90].map(t => (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t)}
                    style={timeframe === t ? styles.reportBtnActive("#10b981") : styles.reportBtn}
                  >
                    {t} Days
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.statsGrid}>
              <StatCard icon="🎯" label="Combined Accuracy" value={`${combinedRate}%`} sub={`${combinedCorrect} of ${combinedAttempts} correct`} color="#6d28d9" />
              <StatCard icon="⚡" label="Avg Response Time" value={avgRT > 0 ? `${(avgRT / 1000).toFixed(1)}s` : "—"} sub={avgRT > 0 ? (avgRT < 2000 ? "Within target ✓" : avgRT < 4000 ? "Mild delay ⚠" : "Significant delay ✗") : "No data"} color={avgRT < 2000 ? "#059669" : avgRT < 4000 ? "#d97706" : "#dc2626"} />
              <StatCard icon="🔡" label="Multi-Letter Rate" value={wordRate ? `${wordRate}%` : "—"} sub={wdM?.overview?.totalAttempts ? `${wdM.overview.totalAttempts} attempts` : "No sessions"} color="#b45309" />
            </div>

            {/* no trend callout in guardian words */}
            <div style={styles.twoColumnGrid}>
              {allProblemWords.length > 0 && (
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>🔡 Problem Words</h3>
                  <div style={styles.problemList}>
                    {allProblemWords.map((item, idx) => (
                      <div key={idx} style={styles.problemItem}>
                        <div style={{ ...styles.badge, background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>
                          {item.word.toUpperCase()}
                        </div>
                        <div style={styles.problemInfo}>
                          <span style={styles.problemCount}>{item.errorCount} errors</span>
                          <div style={styles.progressBarBg}>
                            <div style={{ ...styles.progressBarFill, width: `${item.errorRate}%`, background: "#8b5cf6" }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {allProblemLetters.length > 0 && (
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>🔤 Problem Phonemes</h3>
                  <div style={styles.problemList}>
                    {allProblemLetters.map((item, idx) => (
                      <div key={idx} style={styles.problemItem}>
                        <div style={{ ...styles.badge, background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
                          {item.letter.toUpperCase()}
                        </div>
                        <div style={styles.problemInfo}>
                          <span style={styles.problemCount}>{item.errorCount} errors</span>
                          <div style={styles.progressBarBg}>
                            <div style={{ ...styles.progressBarFill, width: `${item.errorRate || 0}%`, background: "#ef4444" }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <SearchablePaginatedTable
              items={allWordsPracticed}
              headers={["Word", "Level", "Attempts", "Correct", "Accuracy", "Avg Response"]}
              getSearchText={(item) => `${item.word} ${item.level} ${item.totalAttempts} ${item.correctCount} ${item.successRate}`}
              searchPlaceholder="Search practised words..."
              emptyMessage="No practised words found."
              renderRow={(item, idx) => (
                <tr key={`${item.word}-${item.level}-${idx}`} style={styles.tableRow}>
                  <td style={styles.tableCell}>{item.word.toUpperCase()}</td>
                  <td style={styles.tableCell}>{item.level}</td>
                  <td style={styles.tableCell}>{item.totalAttempts}</td>
                  <td style={styles.tableCell}>{item.correctCount}</td>
                  <td style={styles.tableCell}>{item.successRate}%</td>
                  <td style={styles.tableCell}>{(item.avgResponseTime / 1000).toFixed(2)}s</td>
                </tr>
              )}
            />
          </div>
        );
      })()}

      {/* Sentences Report */}
      {selectedReport === "sentences" && reportData && (() => {
        const m = deriveSentenceMetrics(reportData);
        
        // Calculate sentence-level metrics from attempts
        const sentenceMetrics = {};
        (reportData.attempts || []).forEach(attempt => {
          const sent = attempt.sentence || '';
          if (!sentenceMetrics[sent]) {
            sentenceMetrics[sent] = {
              sentence: sent,
              attempts: 0,
              correct: 0,
              totalTime: 0,
              totalAccuracy: 0,
              eyeScores: [],
            };
          }
          sentenceMetrics[sent].attempts++;
          if (attempt.correct) sentenceMetrics[sent].correct++;
          sentenceMetrics[sent].totalTime += attempt.responseTime || 0;
          sentenceMetrics[sent].totalAccuracy += attempt.accuracy || 0;
          if (attempt.eyeScore) sentenceMetrics[sent].eyeScores.push(attempt.eyeScore);
        });

        // Calculate averages and sort by success rate
        const difficultSentences = Object.values(sentenceMetrics)
          .map(s => ({
            ...s,
            successRate: ((s.correct / s.attempts) * 100).toFixed(1),
            avgTime: s.attempts > 0 ? s.totalTime / s.attempts : 0,
            avgVisual: s.eyeScores.length > 0 
              ? (s.eyeScores.reduce((a, b) => a + b, 0) / s.eyeScores.length).toFixed(2)
              : '0.00',
          }))
          .sort((a, b) => parseFloat(a.successRate) - parseFloat(b.successRate))
          .slice(0, 10); // Show top 10 most challenging

        return (
          <div style={styles.reportSection}>
            <h2 style={{...styles.reportTitle, borderBottomColor: currentColor}}>Sentences Report</h2>

            {/* stat cards */}
            <div style={styles.statsGrid}>
              <StatCard icon="🎯" label="Success Rate" value={`${m.successRate}%`} trend={m.trend} color="#8b5cf6" />
              <StatCard icon="⚡" label="Avg Accuracy" value={`${m.avgAccuracy}%`} color="#f59e0b" />
              <StatCard icon="⏱️" label="Avg Response" value={`${(m.avgResponse/1000).toFixed(1)}s`} color="#3b82f6" />
              <StatCard icon="✅" label="Total Attempts" value={m.total} color="#10b981" />
            </div>

            {/* trend card */}
            {m.trend && <TrendCard trend={m.trend} />}

            {/* Eye-Tracking Analysis */}
            {reportData.eyeTracking && (
              <div style={{ ...styles.card, border: "2px solid #bfdbfe" }}>
                <h3 style={styles.cardTitle}>Eye-Tracking Analysis</h3>
                <p style={styles.cardHint}>Visual hesitation and tracking performance during sentence practice.</p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                  <StatCard
                    icon="📷"
                    label="Sessions Tracked"
                    value={reportData.eyeTracking.tracked}
                    subValue={`${((reportData.eyeTracking.tracked / (reportData.attempts?.length || 1)) * 100).toFixed(0)}% of total`}
                    color="#3b82f6"
                  />
                  <StatCard
                    icon="⏸️"
                    label="Avg Visual Hesitation"
                    value={reportData.eyeTracking.avgVisualScore}
                    subValue={`${reportData.eyeTracking.hesitationLevel} level`}
                    color={
                      reportData.eyeTracking.hesitationLevel === "High"
                        ? "#dc2626"
                        : reportData.eyeTracking.hesitationLevel === "Moderate"
                        ? "#d97706"
                        : "#059669"
                    }
                  />
                  <StatCard
                    icon="🚨"
                    label="Hard Sessions"
                    value={reportData.eyeTracking.hardSessions}
                    subValue={`${reportData.eyeTracking.hardRate}% flagged`}
                    color={parseInt(reportData.eyeTracking.hardSessions, 10) > 0 ? "#dc2626" : "#059669"}
                  />
                  <StatCard
                    icon="✅"
                    label="Easy Sessions"
                    value={(reportData.attempts?.length || 0) - (reportData.eyeTracking.hardSessions || 0)}
                    subValue="Visually comfortable"
                    color="#059669"
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                  {[
                    { label: "Low", range: "0.0 – 0.3", desc: "Smooth eye flow", color: "#059669" },
                    { label: "Moderate", range: "0.3 – 0.6", desc: "Some pausing", color: "#d97706" },
                    { label: "High", range: "0.6 – 1.0", desc: "Frequent re-fixation", color: "#dc2626" },
                  ].map((zone) => (
                    <div
                      key={zone.label}
                      style={{
                        background: reportData.eyeTracking.hesitationLevel === zone.label ? `${zone.color}10` : "#f8fafc",
                        border: `1px solid #e2e8f0`,
                        borderTop: `3px solid ${zone.color}`,
                        borderRadius: "10px",
                        padding: "10px",
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: zone.color, textTransform: "uppercase" }}>{zone.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, margin: "4px 0" }}>{zone.range}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{zone.desc}</div>
                      {reportData.eyeTracking.hesitationLevel === zone.label && (
                        <div style={{ marginTop: 4, fontSize: 11, color: zone.color, fontWeight: 700 }}>
                          ← You are here
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {reportData.eyeTracking.tracked === 0 && (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "#64748b" }}>
                    No eye-tracking data available for this period. Enable camera during sessions to see visual hesitation insights.
                  </div>
                )}
              </div>
            )}

            {/* Challenging Sentences */}
            {difficultSentences.length > 0 && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', marginRight: 8 }} /> Challenging Sentences</h3>
                <p style={styles.cardHint}>Sentences with lowest success rate this period — prioritise re-practice</p>
                <SearchablePaginatedBlocks
                  items={difficultSentences}
                  getSearchText={(item) => `${item.sentence} ${item.successRate} ${item.attempts} ${item.avgVisual}`}
                  searchPlaceholder="Search challenging sentences..."
                  emptyMessage="No challenging sentences found."
                  initialPageSize={5}
                  gridStyle={styles.sentenceList}
                  renderItem={(item, idx) => (
                    <div key={idx} style={styles.sentRow}>
                      <div style={{ ...styles.rankBadge, background: idx === 0 ? '#ef4444' : idx === 1 ? '#f59e0b' : '#94a3b8' }}>
                        #{idx + 1}
                      </div>
                      <div style={styles.sentMid}>
                        <div style={styles.sentText}>"{item.sentence}"</div>
                        <div style={styles.sentMeta}>
                          <span style={{ ...styles.metaChip, background: `#f59e0b15`, color: '#b45309' }}>✓ {item.successRate}% success</span>
                          <span style={{ ...styles.metaChip, background: '#f1f5f9', color: '#475569' }}>⏱ {(item.avgTime / 1000).toFixed(1)}s avg</span>
                          <span style={{ ...styles.metaChip, background: '#dbeafe', color: '#1e40af' }}>👁 {item.avgVisual} eye score</span>
                          <span style={{ ...styles.metaChip, background: '#ede9fe', color: '#7c3aed' }}>📋 {item.attempts} attempt{item.attempts !== 1 ? 's' : ''}</span>
                        </div>
                        <div style={styles.sentBar}>
                          <div style={{ ...styles.sentFill, width: `${Math.min(parseFloat(item.successRate), 100)}%`, background: parseFloat(item.successRate) >= 80 ? '#059669' : parseFloat(item.successRate) >= 50 ? '#d97706' : '#dc2626' }} />
                        </div>
                      </div>
                    </div>
                  )}
                />
              </div>
            )}

            {/* Problem Phonemes - Box Grid */}
            {m.problemLetters && m.problemLetters.length > 0 && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#ef4444', marginRight: 8 }} /> Problem Phonemes</h3>
                <p style={styles.cardHint}>Sounds producing most errors across all sentences</p>
                <div style={styles.phonemeGrid}>
                  {m.problemLetters
                    .filter(item => item.errorCount > 0 && !isNaN(item.errorRate) && item.errorRate > 0)
                    .map((item, idx) => {
                    const colors = ["#ef4444", "#f59e0b", "#8b5cf6", "#3b82f6", "#10b981"];
                    const c = colors[idx % colors.length];
                    const errorRateValue = typeof item.errorRate === 'number' ? item.errorRate.toFixed(1) : (parseFloat(item.errorRate) || 0).toFixed(1);
                    return (
                      <div key={idx} style={{ ...styles.phonemeCard, borderTop: `3px solid ${c}` }}>
                        <div style={{ ...styles.phonemeSymbol, color: c }}>{item.letter.toUpperCase()}</div>
                        <div style={styles.phonemeStats}>
                          <span style={styles.phonemeCount}>{item.errorCount} errors</span>
                          <span style={{ ...styles.phonemePct, color: c }}>{errorRateValue}%</span>
                        </div>
                        <div style={styles.phonemeBar}>
                          <div style={{ ...styles.phonemeFill, width: `${Math.min(parseFloat(errorRateValue), 100)}%`, background: c }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {loading && (
        <div style={styles.loadingMessage}>Loading report...</div>
      )}
    </div>
  );
}

// ── shared UI components used by words/sentences ─────────────────
function StatCard({ icon, label, value, subValue, trend, color }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIcon, background: `${color}15` }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
      </div>
      <div style={styles.statContent}>
        <span style={styles.statLabel}>{label}</span>
        <h3 style={{ ...styles.statValue, color }}>{value}</h3>
        {subValue && <span style={styles.statSubValue}>{subValue}</span>}
        {trend && trend.direction && trend.direction !== 'stable' && (
          <TrendBadge direction={trend.direction} change={trend.change} />
        )}
      </div>
    </div>
  );
}

function TrendBadge({ direction, change }) {
  const improving = direction === 'improving';
  return (
    <span style={{ ...styles.trendBadge, background: improving ? '#dcfce7' : '#fee2e2', color: improving ? '#16a34a' : '#dc2626' }}>
      {improving ? '↗' : '↘'} {Math.abs(parseFloat(change))}%
    </span>
  );
}

function TrendCard({ trend }) {
  const improving = trend.direction === 'improving';
  const stable = trend.direction === 'stable';
  return (
    <div style={{
      ...styles.trendCard,
      background: improving
        ? 'linear-gradient(135deg, #10b981, #34d399)'
        : stable
        ? 'linear-gradient(135deg, #3b82f6, #60a5fa)'
        : 'linear-gradient(135deg, #f59e0b, #fbbf24)'
    }}>
      <div style={styles.trendIcon}>{improving ? '🎉' : stable ? '📊' : '💪'}</div>
      <div style={styles.trendContent}>
        <h3 style={styles.trendTitle}>
          {improving ? "You're Improving!" : stable ? "Steady Progress" : "Let's Focus"}
        </h3>
        <p style={styles.trendText}>
          {improving && `Your accuracy increased by ${Math.abs(parseFloat(trend.change))}% recently. Keep it up!`}
          {stable && "Your performance is consistent. Keep practicing!"}
          {!improving && !stable && `Recent accuracy dropped by ${Math.abs(parseFloat(trend.change))}%. Focus on problem areas below.`}
        </p>
        <div style={styles.trendStats}>
          <div>
            <span style={styles.trendStatLabel}>Previous</span>
            <span style={styles.trendStatValue}>{trend.previousAvg}%</span>
          </div>
          <div style={styles.trendArrow}>→</div>
          <div>
            <span style={styles.trendStatLabel}>Recent</span>
            <span style={styles.trendStatValue}>{trend.recentAccuracy}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- styles updated to match student report theme ----
const styles = {
  container: {
    // use student page background/padding
    padding: "32px",
    maxWidth: "1400px",
    margin: "0 auto",
    background: "#f0fdf4",
    fontFamily: "'DM Sans', sans-serif",
    minHeight: "100vh",
  },
  header: {
    marginBottom: 32,
  },
  backBtn: {
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    marginBottom: 16,
    fontSize: 14,
  },
  studentHeader: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "#dbeafe",
    color: "#1e40af",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 24,
  },
  studentName: {
    fontSize: 24,
    fontWeight: 700,
    margin: 0,
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: 14,
    color: "#64748b",
    margin: 0,
  },
  studentMeta: {
    fontSize: 13,
    color: "#475569",
    margin: 0,
  },
  summarySection: {
    marginBottom: 32,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 24,
    marginBottom: 24,
    padding: "0 32px",
  },
  summaryCard: {
    background: "white",
    borderRadius: 20,
    padding: 32,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    cursor: "pointer",
  },
  cardIcon: {
    fontSize: 48,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 800,
    margin: 0,
    color: "#0f172a",
  },
  cardStat: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1,
  },
  cardSubValue: {
    fontSize: 13,
    color: "#64748b",
  },
  profileDetail: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 4,
  },
  statusDetail: {
    fontSize: 13,
    color: "#0f172a",
    fontWeight: 500,
  },
  timeframeControl: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  timeframeLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: "#64748b",
  },
  timeframeSelect: {
    padding: "8px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    fontSize: 14,
    cursor: "pointer",
  },
  reportNav: {
    display: "flex",
    gap: 8,
    marginBottom: 24,
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: 16,
    overflowX: "auto",
  },

  reportBtn: {
    padding: "8px 16px",
    border: "1px solid #bfdbfe",
    background: "transparent",
    color: "#3b82f6",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: 14,
    borderRadius: 6,
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
  },
  reportBtnActive: (color = "#3b82f6") => ({
    color: "white",
    background: color,
    border: `1px solid ${color}`,
  }),
  reportSection: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 24,
  },
  reportTitle: {
    fontSize: 24,
    fontWeight: 700,
    margin: "0 0 20px 0",
    color: "#1e293b",
    padding: "12px 0",
    borderBottom: "3px solid",
    display: "inline-block",
  },
  reportStats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 16,
    marginBottom: 24,
    paddingBottom: 24,
    borderBottom: "1px solid #f1f5f9",
  },
  statItem: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    textTransform: "uppercase",
    fontWeight: 600,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1e293b",
  },
  tableContainer: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeader: {
    background: "#f8fafc",
    borderBottom: "2px solid #e2e8f0",
  },
  tableCell: {
    padding: "12px",
    textAlign: "left",
    borderBottom: "1px solid #f1f5f9",
    fontSize: 14,
  },
  tableRow: {
    "&:hover": {
      background: "#f8fafc",
    },
  },
  progressBar: {
    width: "100%",
    height: 6,
    background: "#f1f5f9",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    transition: "width 0.3s ease",
  },
  loadingMessage: {
    textAlign: "center",
    padding: 40,
    color: "#64748b",
    fontSize: 16,
  },
  errorMessage: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    fontSize: 14,
  },

  /* additional card/grid styles from student letter report */
  card: { background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "24px" },
  cardSubtitle: { fontSize: "13px", color: "#64748b", marginBottom: "16px" },
  twoColumnGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "24px" },
  problemList: { display: "flex", flexDirection: "column", gap: "12px" },
  problemItem: { display: "flex", alignItems: "center", gap: "16px" },
  badge: { minWidth: "48px", height: "48px", borderRadius: "12px", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "700", flexShrink: 0 },
  problemInfo: { flex: 1 },
  problemCount: { fontSize: "14px", color: "#64748b", display: "block", marginBottom: "6px" },
  strengthLabel: { fontSize: "13px", fontWeight: "700", color: "#374151", minWidth: "40px", textAlign: "right" },
  progressBarBg: { height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: "4px", transition: "width 0.3s ease" },
  masteryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(68px, 1fr))", gap: "10px" },
  masteryCell: { borderRadius: "12px", padding: "10px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", cursor: "default", transition: "transform 0.15s" },
  masteryLetter: { fontSize: "20px", fontWeight: "700" },
  masteryPct: { fontSize: "11px", fontWeight: "600" },
  ctaCard: { background: "linear-gradient(135deg, #059669, #10b981)", borderRadius: "20px", padding: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "white", flexWrap: "wrap", gap: "20px" },
  ctaTitle: { fontSize: "24px", fontWeight: "700", marginBottom: "8px", marginTop: 0 },
  ctaText: { fontSize: "15px", opacity: 0.9, margin: 0 },
  ctaButton: { background: "white", color: "#059669", border: "none", padding: "14px 28px", borderRadius: "12px", fontSize: "16px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
  // stats/trend card styles (from student reports)
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "24px" },
  statCard: { background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", gap: "16px", alignItems: "flex-start" },
  statIcon: { width: "56px", height: "56px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  statContent: { flex: 1, display: "flex", flexDirection: "column", gap: "4px" },
  statSubValue: { fontSize: "13px", color: "#64748b" },
  trendBadge: { display: "inline-block", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", marginTop: "4px" },
  trendCard: { borderRadius: "20px", padding: "32px", marginBottom: "24px", color: "white", display: "flex", gap: "24px", alignItems: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" },
  trendIcon: { fontSize: "48px", flexShrink: 0 },
  trendContent: { flex: 1 },
  trendTitle: { fontSize: "24px", fontWeight: "700", marginBottom: "8px" },
  trendText: { fontSize: "15px", opacity: 0.95, marginBottom: "16px", lineHeight: 1.5 },
  trendStats: { display: "flex", alignItems: "center", gap: "16px" },
  trendStatLabel: { display: "block", fontSize: "12px", opacity: 0.8, marginBottom: "4px" },
  trendStatValue: { display: "block", fontSize: "20px", fontWeight: "700" },
  trendArrow: { fontSize: "20px", opacity: 0.8 },
  
  /* Sentence display styles */
  sentenceList: { display: "flex", flexDirection: "column", gap: "12px" },
  sentRow: { display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px 16px", background: "#f8fafc", borderRadius: "12px" },
  rankBadge: { minWidth: "36px", height: "36px", borderRadius: "8px", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "800", flexShrink: 0 },
  sentMid: { flex: 1 },
  sentText: { fontSize: "15px", fontWeight: "600", color: "#0f172a", fontStyle: "italic", marginBottom: "10px", lineHeight: 1.5 },
  sentMeta: { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" },
  metaChip: { fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "999px" },
  sentBar: { height: "4px", background: "#e2e8f0", borderRadius: "2px", overflow: "hidden" },
  sentFill: { height: "100%", borderRadius: "2px", transition: "width .4s ease" },
  cardHint: { fontSize: "12px", color: "#94a3b8", margin: "0 0 16px 0" },
  
  /* Phoneme Grid Styles */
  phonemeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "12px" },
  phonemeCard: { background: "#f8fafc", borderRadius: "12px", padding: "14px 16px", transition: "transform 0.15s" },
  phonemeSymbol: { fontSize: "24px", fontWeight: "800", fontFamily: "'Fira Code', monospace", marginBottom: "8px" },
  phonemeStats: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" },
  phonemeCount: { fontSize: "11px", color: "#64748b" },
  phonemePct: { fontSize: "16px", fontWeight: "700", fontFamily: "'Fira Code', monospace" },
  phonemeBar: { height: "5px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" },
  phonemeFill: { height: "100%", borderRadius: "3px", transition: "width 0.3s ease" },
};
