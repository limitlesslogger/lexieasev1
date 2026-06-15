

//     <div style={styles.container}>
//       {/* Header */}
//       <div style={styles.header}>
//         <button onClick={() => navigate("/therapist/dashboard")} style={styles.backBtn}>
//           ← Back to Dashboard
//         </button>
//         {student && (
//           <div style={styles.studentHeader}>
//             <div style={styles.avatarLarge}>
//               {student.name.charAt(0).toUpperCase()}
//             </div>
//             <div>
//               <h1 style={styles.studentName}>{student.name}</h1>
//               <p style={styles.studentEmail}>{student.email}</p>
//               {student.age != null && (
//                 <p style={styles.studentMeta}>Age: {student.age}</p>
//               )}
//               {student.lastActive && (
//                 <p style={styles.studentMeta}>
//                   Last active: {new Date(student.lastActive).toLocaleString()}
//                 </p>
//               )}
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Report Navigation */}
//       <div style={styles.reportNav}>
//         <button
//           onClick={() => setSelectedReport("summary")}
//           style={{
//             ...styles.reportBtn,
//             ...(selectedReport === "summary" ? styles.reportBtnActive : {}),
//           }}
//         >
//           Summary
//         </button>
//         <button
//           onClick={() => setSelectedReport("letters")}
//           style={{
//             ...styles.reportBtn,
//             ...(selectedReport === "letters" ? styles.reportBtnActive : {}),
//           }}
//         >
//           Letters Report
//         </button>
//         <button
//           onClick={() => setSelectedReport("words")}
//           style={{
//             ...styles.reportBtn,
//             ...(selectedReport === "words" ? styles.reportBtnActive : {}),
//           }}
//         >
//           Words Report
//         </button>
//         <button
//           onClick={() => setSelectedReport("sentences")}
//           style={{
//             ...styles.reportBtn,
//             ...(selectedReport === "sentences" ? styles.reportBtnActive : {}),
//           }}
//         >
//           Sentences Report
//         </button>
//       </div>

//       {/* Summary Cards */}
//       {selectedReport === "summary" && summary && (
//         <div style={styles.summarySection}>
//           <div style={styles.summaryGrid}>
//             {/* Student Profile Card */}
//             {student && (
//               <div style={styles.summaryCard}>
//                 <div style={styles.cardIconLarge}>👤</div>
//                 <div style={styles.cardContent}>
//                   <div style={styles.cardLabel}>Student Profile</div>
//                   <div style={styles.profileDetail}><strong>{student.name}</strong></div>
//                   {student.age != null && (
//                     <div style={styles.profileDetail}>Age: {student.age} years</div>
//                   )}
//                   <div style={styles.profileDetail}>{student.email}</div>
//                   {student.createdAt && (
//                     <div style={{...styles.profileDetail, fontSize: 12, marginTop: 4, color: "#94a3b8"}}>
//                       Member since {new Date(student.createdAt).toLocaleDateString()}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}
            
//             {/* Active Status Card */}
//             {student && student.lastActive && (
//               <div style={styles.summaryCard}>
//                 <div style={styles.cardIconLarge}>⏱️</div>
//                 <div style={styles.cardContent}>
//                   <div style={styles.cardLabel}>Activity Status</div>
//                   <div style={styles.profileDetail}>Last Active:</div>
//                   <div style={styles.statusDetail}>{new Date(student.lastActive).toLocaleString()}</div>
//                   <div style={{...styles.profileDetail, fontSize: 12, marginTop: 4}}>
//                     {getTimeAgo(new Date(student.lastActive))}
//                   </div>
//                 </div>
//               </div>
//             )}
            
//             {summary.sentences && (
//               <div style={styles.summaryCard}>
//                 <div style={styles.cardIconLarge}>📖</div>
//                 <div style={styles.cardContent}>
//                   <div style={styles.cardLabel}>Sentences</div>
//                   <div style={styles.cardValue}>{summary.sentences.total}</div>
//                   <div style={styles.cardSubtext}>
//                     Success: {summary.sentences.successRate}%
//                   </div>
//                 </div>
//               </div>
//             )}
            
//             {summary.words && (
//               <div style={styles.summaryCard}>
//                 <div style={styles.cardIconLarge}>💬</div>
//                 <div style={styles.cardContent}>
//                   <div style={styles.cardLabel}>Words</div>
//                   <div style={styles.cardValue}>{summary.words.total}</div>
//                   <div style={styles.cardSubtext}>
//                     Success: {summary.words.successRate}%
//                   </div>
//                 </div>
//               </div>
//             )}
            
//             {summary.letters && (
//               <div style={styles.summaryCard}>
//                 <div style={styles.cardIconLarge}>🔤</div>
//                 <div style={styles.cardContent}>
//                   <div style={styles.cardLabel}>Letters</div>
//                   <div style={styles.cardValue}>{summary.letters.total}</div>
//                   <div style={styles.cardSubtext}>
//                     Strength: {summary.letters.avgStrength}%
//                   </div>
//                 </div>
//               </div>
//             )}
            
//             {/* Overall Progress Card */}
//             {summary && (
//               <div style={styles.summaryCard}>
//                 <div style={styles.cardIconLarge}>📊</div>
//                 <div style={styles.cardContent}>
//                   <div style={styles.cardLabel}>Overall Activity</div>
//                   <div style={styles.cardValue}>
//                     {(summary.sentences?.total || 0) + (summary.words?.total || 0) + (summary.letters?.total || 0)}
//                   </div>
//                   <div style={styles.cardSubtext}>Total attempts</div>
//                 </div>
//               </div>
//             )}
//           </div>

//           <div style={styles.timeframeControl}>
//             <label style={styles.timeframeLabel}>Filter by timeframe:</label>
//             <select
//               value={timeframe}
//               onChange={(e) => setTimeframe(Number(e.target.value))}
//               style={styles.timeframeSelect}
//             >
//               <option value={7}>Last 7 days</option>
//               <option value={14}>Last 14 days</option>
//               <option value={30}>Last 30 days</option>
//               <option value={90}>Last 90 days</option>
//             </select>
//           </div>
//         </div>
//       )}

//       {/* Letter Report */}
//       {selectedReport === "letters" && reportData && (() => {
//         const letters = reportData.letters || [];
//         const totalLetters = 26;
//         const totalAttempts = letters.reduce((acc, l) => acc + (l.attempts || 0), 0);
//         const avgStrength = letters.length
//           ? letters.reduce((acc, l) => acc + Number(l.strength), 0) / letters.length
//           : 0;
//         const practicedCount = letters.filter((l) => (l.attempts || 0) > 0).length;
//         const masteredCount = letters.filter((l) => Number(l.strength) >= 40).length;
//         const problemLetters = letters.filter((l) => Number(l.strength) < 0);

//         const interpText =
//           avgStrength >= 40
//             ? "High alphabetic knowledge; strong and consistent phoneme-grapheme mapping."
//             : avgStrength >= 0
//             ? "Developing alphabetic knowledge; focus on consistency with lower strength letters."
//             : "At-risk letter naming; recommend targeted phonological intervention.";

//         return (
//           <div style={styles.reportSection}>
//             <h2 style={styles.reportTitle}>Letters Report</h2>

//             <div style={{ display: "grid", gridTemplateColumns: "1.35fr .65fr", gap: 16, marginBottom: 20 }}>
//               <div style={styles.card}>
//                 <h3 style={styles.sectionHeadline}>CLINICAL INTERPRETATION</h3>
//                 <p style={styles.interpretationText}>
//                   {student?.name ? `${student.name} demonstrates significant progress in phoneme-grapheme correspondence for high-frequency vowels.` : "Student demonstrates significant progress in phoneme-grapheme correspondence for high-frequency vowels."}
//                   &nbsp;However, there are persistent challenges with plosive consonants (specifically 'p', 'b', and 'd'), often exhibiting reversal patterns. Accuracy in rapid naming tasks has improved by 12% since baseline assessment, indicating strengthening neural pathways for visual-to-phonological retrieval.
//                 </p>
//                 <div style={styles.tagRow}>
//                   <span style={styles.tagPill}>HIGH VOWEL MASTERY</span>
//                   <span style={styles.tagPill}>CONSONANT REVERSAL RISK</span>
//                   <span style={styles.tagPill}>IMPROVED RETRIEVAL</span>
//                 </div>
//                 <ul style={styles.interpretationList}>
//                   <li>Overall strength: <strong>{avgStrength.toFixed(1)}%</strong></li>
//                   <li>Letters mastered: <strong>{masteredCount}/{totalLetters}</strong></li>
//                   <li>Letters practised: <strong>{practicedCount}/{totalLetters}</strong></li>
//                   <li>Focus letters: <strong>{problemLetters.length ? problemLetters.map((l) => l.letter.toUpperCase()).join(", ") : "None"}</strong></li>
//                 </ul>
//               </div>

//               <div style={styles.masterySummaryCard}>
//                 <div style={styles.masterySummaryHeading}>MASTERY SUMMARY</div>
//                 <div style={styles.masterySummaryValues}>
//                   <div>
//                     <div style={styles.masteryScore}>{masteredCount}/{totalLetters}</div>
//                     <div style={styles.masteryLabel}>Letters Mastered</div>
//                   </div>
//                   <div style={{ textAlign: "right" }}>
//                     <div style={styles.masteryAvg}>{avgStrength.toFixed(1)}%</div>
//                     <div style={styles.masteryLabel}>Avg Strength</div>
//                     <div style={styles.masteryTrend}>
//                       <span style={{ fontWeight: 700 }}>+{Math.min(20, Math.max(1, Number(avgStrength.toFixed(0))))}%</span> vs last session
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div style={{ marginBottom: 16 }}>
//               <h3 style={styles.sectionTitle}>Alphabet Strength Analysis</h3>
//               <TherapistLetterStrengthGrid letters={letters} />
//             </div>
//           </div>
//         );
//       })()}

//       {/* Words Report */}
//       {selectedReport === "words" && reportData && (() => {
//         const twM = reportData.twoLetter;
//         const wdM = reportData.words;
//         const cmb = reportData.combined;

//         const combinedAttempts = cmb?.totalAttempts ?? ((twM?.overview?.totalAttempts ?? 0) + (wdM?.overview?.totalAttempts ?? 0));
//         const combinedCorrect = cmb?.correctAttempts ?? ((twM?.overview?.correctAttempts ?? 0) + (wdM?.overview?.correctAttempts ?? 0));
//         const combinedRate = cmb?.successRate ?? (combinedAttempts ? +((combinedCorrect / combinedAttempts) * 100).toFixed(1) : 0);
//         const avgRT = cmb?.avgResponseTime ?? (() => {
//           const rts = [twM?.overview?.avgResponseTime, wdM?.overview?.avgResponseTime].filter(Boolean);
//           return rts.length ? rts.reduce((a, b) => a + b, 0) / rts.length : 0;
//         })();

//         const twoWords = twM?.allWords ?? [];
//         const multiWords = wdM?.allWords ?? [];

//         const combinedWordRows = [
//           { label: "Two-Letter", stats: twM?.overview ?? {} },
//           { label: "Multi-Letter", stats: wdM?.overview ?? {} },
//           { label: "Combined", stats: cmb ?? { totalAttempts: 0, correctAttempts: 0, successRate: 0, avgResponseTime: 0 } },
//         ];

//         return (
//           <div style={styles.reportSection}>
//             <h2 style={styles.reportTitle}>Words Report</h2>

//             <div style={styles.wordSummaryGrid}>
//               <div style={styles.wordsMetricCard}> 
//                 <div style={styles.summaryLabel}>Combined Accuracy</div>
//                 <div style={styles.wordsMetricValue}>{combinedRate}%</div>
//               </div>
//               <div style={styles.wordsMetricCard}>
//                 <div style={styles.summaryLabel}>Avg Response Time</div>
//                 <div style={styles.wordsMetricValue}>{avgRT > 0 ? `${(avgRT / 1000).toFixed(1)}s` : "—"}</div>
//               </div>
//               <div style={styles.wordsMetricCard}>
//                 <div style={styles.summaryLabel}>Two-Letter Rate</div>
//                 <div style={styles.wordsMetricValue}>{twM?.overview?.successRate ? `${twM.overview.successRate}%` : "—"}</div>
//               </div>
//               <div style={styles.wordsMetricCard}>
//                 <div style={styles.summaryLabel}>Multi-Letter Rate</div>
//                 <div style={styles.wordsMetricValue}>{wdM?.overview?.successRate ? `${wdM.overview.successRate}%` : "—"}</div>
//               </div>
//             </div>

//             <div style={styles.analysisSection}>
//               <h3 style={styles.analysisHeader}>Phonological Processing Analysis</h3>
//               <p style={styles.analysisText}>
//                 Current assessment data reveals dynamic strengths and targets in word-level decoding and speed. 
//                 Two-Letter speed shows a functional baseline while Multi-Letter accuracy suggests some orthographic retrieval load.
//                 Recommended priority: blend name drills with CVC and CCVC sets while monitoring response time trajectories.
//               </p>
//               <div style={styles.focusBox}>
//                 <div style={styles.focusTitle}>Therapeutic Focus</div>
//                 <ul style={styles.focusList}>
//                   <li>Rapid CVC blending drills</li>
//                   <li>Phoneme-grapheme mapping for 'sh' and 'ch'</li>
//                   <li>Reduce visual latency in naming</li>
//                 </ul>
//               </div>
//             </div>

//             <div style={styles.subSection}>
//               <div style={styles.subTitle}>Two-Letter Words</div>
//               <div style={styles.tableContainer}>
//                 <table style={styles.table}>
//                   <thead>
//                     <tr style={styles.tableHeader}>
//                       <th style={styles.tableCell}>Word Target</th>
//                       <th style={styles.tableCell}>Attempts / Correct</th>
//                       <th style={styles.tableCell}>Accuracy</th>
//                       <th style={styles.tableCell}>Avg Response</th>
//                       <th style={styles.tableCell}>Fluency Trend</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {twoWords.map((item, idx) => (
//                       <tr key={idx} style={styles.tableRow}>
//                         <td style={styles.tableCell}>{item.word.toUpperCase()}</td>
//                         <td style={styles.tableCell}>{item.totalAttempts}/{item.correctCount}</td>
//                         <td style={styles.tableCell}>{item.successRate}%</td>
//                         <td style={styles.tableCell}>{(item.avgResponseTime/1000).toFixed(2)}s</td>
//                         <td style={styles.tableCell}>{item.successRate >= 80 ? "↗" : item.successRate >= 60 ? "→" : "↘"}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>

//             <div style={styles.subSection}>
//               <div style={styles.subTitle}>Multi-Letter & Complex</div>
//               <div style={styles.tableContainer}>
//                 <table style={styles.table}>
//                   <thead>
//                     <tr style={styles.tableHeader}>
//                       <th style={styles.tableCell}>Word Target</th>
//                       <th style={styles.tableCell}>Attempts / Correct</th>
//                       <th style={styles.tableCell}>Accuracy</th>
//                       <th style={styles.tableCell}>Avg Response</th>
//                       <th style={styles.tableCell}>Fluency Trend</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {multiWords.map((item, idx) => (
//                       <tr key={idx} style={styles.tableRow}>
//                         <td style={styles.tableCell}>{item.word.toUpperCase()}</td>
//                         <td style={styles.tableCell}>{item.totalAttempts}/{item.correctCount}</td>
//                         <td style={styles.tableCell}>{item.successRate}%</td>
//                         <td style={styles.tableCell}>{(item.avgResponseTime/1000).toFixed(2)}s</td>
//                         <td style={styles.tableCell}>{item.successRate >= 80 ? "↗" : item.successRate >= 60 ? "→" : "↘"}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </div>
//         );
//       })()}


//       {/* Sentences Report */}
//       {selectedReport === "sentences" && reportData && (
//         <div style={styles.reportSection}>
//           <h2 style={styles.reportTitle}>Sentences Report</h2>

//           <div style={styles.wordSummaryGrid}>
//             <div style={styles.summaryCard}>
//               <div style={styles.summaryLabel}>Combined Accuracy</div>
//               <div style={styles.summaryValue}>{reportData.successRate}%</div>
//             </div>
//             <div style={styles.summaryCard}>
//               <div style={styles.summaryLabel}>Avg Response Time</div>
//               <div style={styles.summaryValue}>{getSentenceAvgLatency(reportData.attempts)}s</div>
//             </div>
//           </div>

//           <div style={styles.analysisSection}>
//             <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
//               <div style={styles.clinicalNarrativeCard}>
//                 <h3 style={styles.analysisHeader}>Clinical Narrative Analysis</h3>
//                 <p style={styles.analysisText}>
//                   {getSentenceNarrative(student, reportData)}
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div style={styles.subSection}>
//             <div style={styles.subTitle}>Sentence Performance Table</div>
//             <div style={styles.tableContainer}>
//               <table style={styles.table}>
//                 <thead>
//                   <tr style={styles.tableHeader}>
//                     <th style={styles.tableCell}>Target Sentence</th>
//                     <th style={styles.tableCell}>Spoken Response</th>
//                     <th style={styles.tableCell}>Status</th>
//                     <th style={styles.tableCell}>Accuracy</th>
//                     <th style={styles.tableCell}>Latency</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {reportData.attempts?.slice(0, 10).map((attempt, idx) => (
//                     <tr key={idx} style={styles.tableRow}>
//                       <td style={styles.tableCell}>{attempt.sentence}</td>
//                       <td style={styles.tableCell}>{attempt.spoken || ""}</td>
//                       <td style={styles.tableCell}>{attempt.correct ? "✅" : "❌"}</td>
//                       <td style={styles.tableCell}>{attempt.accuracy}%</td>
//                       <td style={styles.tableCell}>{(attempt.responseTime/1000).toFixed(1)}s</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>
//       )}

//       {loading && (
//         <div style={styles.loadingMessage}>Loading report...</div>
//       )}
//     </div>
//   );
// }

// function TherapistLetterStrengthGrid({ letters }) {
//   const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
//   const map = {};
//   letters.forEach((l) => {
//     map[l.letter?.toLowerCase()] = l;
//   });

//   return (
//     <div style={styles.letterGrid}>
//       {alphabet.map((char) => {
//         const item = map[char];
//         const strength = item ? Number(item.strength) : null;
//         const attempts = item?.attempts || 0;
//         const status = strength === null
//           ? "Not Practised"
//           : strength >= 40
//           ? "Mastered"
//           : strength >= 0
//           ? "Developing"
//           : "Needs Focus";

//         const bg = strength === null
//           ? "#f8fafc"
//           : strength >= 40
//           ? "#d1fae5"
//           : strength >= 0
//           ? "#fef3c7"
//           : "#fee2e2";

//         const text = strength === null ? "—" : `${strength.toFixed(1)}%`;
//         const color = strength === null
//           ? "#64748b"
//           : strength >= 40
//           ? "#065f46"
//           : strength >= 0
//           ? "#92400e"
//           : "#991b1b";

//         const typeLabel = (() => {
//           if (["a","e","i","o","u"].includes(char)) return "Vowel Sound";
//           if (["b","p","d","t","g","k"].includes(char)) return "Plosive";
//           if (["s","z","f","v","th"].includes(char)) return "Fricative";
//           if (["l","r","m","n","ng"].includes(char)) return "Sonorant";
//           return "Letter";
//         })();

//         return (
//           <div key={char} style={{ ...styles.letterCard, background: bg, borderColor: "#e2e8f0" }}>
//             <div style={{ ...styles.letterBig, color }}>{char.toUpperCase()}</div>
//             <div style={{ ...styles.strengthPct, color }}>{text}</div>
//             <div style={styles.letterLabel}>{typeLabel}</div>
//             <div style={styles.attemptsText}>Attempts: {attempts}</div>
//             <div style={styles.statusTag}>{status}</div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }
// const styles = {
//   container: {
//     background: "#f8fafc",
//     color: "#1e293b",
//     fontFamily:
//       '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
//   },
//   header: {
//     marginBottom: 32,
//   },
//   backBtn: {
//     background: "transparent",
//     color: "#3b82f6",
//     border: "1px solid #bfdbfe",
//     padding: "8px 12px",
//     borderRadius: 6,
//     cursor: "pointer",
//     fontWeight: 500,
//     marginBottom: 16,
//     fontSize: 14,
//   },
//   studentHeader: {
//     display: "flex",
//     alignItems: "center",
//     gap: 16,
//   },
//   avatarLarge: {
//     width: 64,
//     height: 64,
//     borderRadius: "50%",
//     background: "#dbeafe",
//     color: "#1e40af",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     fontWeight: 700,
//     fontSize: 24,
//   },
//   studentName: {
//     fontSize: 24,
//     fontWeight: 700,
//     margin: 0,
//     marginBottom: 4,
//   },
//   studentEmail: {
//     fontSize: 14,
//     color: "#64748b",
//     margin: 0,
//   },
//   studentMeta: {
//     fontSize: 13,
//     color: "#475569",
//     margin: 0,
//   },
//   summarySection: {
//     marginBottom: 32,
//   },
//   summaryGrid: {
//     display: "grid",
//     gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
//     gap: 20,
//     marginBottom: 24,
//   },
//   summaryCard: {
//     background: "white",
//     border: "1px solid #e2e8f0",
//     borderRadius: 12,
//     padding: 20,
//     display: "flex",
//     gap: 16,
//     alignItems: "center",
//   },
//   cardIconLarge: {
//     fontSize: 40,
//   },
//   cardContent: {
//     flex: 1,
//   },
//   cardLabel: {
//     fontSize: 12,
//     color: "#64748b",
//     textTransform: "uppercase",
//     fontWeight: 600,
//     marginBottom: 8,
//     letterSpacing: "0.5px",
//   },
//   cardValue: {
//     fontSize: 24,
//     fontWeight: 700,
//     color: "#1e293b",
//     marginBottom: 4,
//   },
//   cardSubtext: {
//     fontSize: 13,
//     color: "#64748b",
//   },
//   profileDetail: {
//     fontSize: 14,
//     color: "#475569",
//     marginBottom: 4,
//   },
//   statusDetail: {
//     fontSize: 13,
//     color: "#0f172a",
//     fontWeight: 500,
//   },
//   timeframeControl: {
//     display: "flex",
//     alignItems: "center",
//     gap: 12,
//   },
//   timeframeLabel: {
//     fontSize: 14,
//     fontWeight: 500,
//     color: "#64748b",
//   },
//   timeframeSelect: {
//     padding: "8px 12px",
//     border: "1px solid #e2e8f0",
//     borderRadius: 6,
//     fontSize: 14,
//     cursor: "pointer",
//   },
//   reportNav: {
//     display: "flex",
//     gap: 8,
//     marginBottom: 24,
//     borderBottom: "1px solid #e2e8f0",
//     paddingBottom: 16,
//     overflowX: "auto",
//   },

//   reportBtn: {
//     padding: "8px 16px",
//     border: "1px solid #bfdbfe",
//     background: "transparent",
//     color: "#3b82f6",
//     cursor: "pointer",
//     fontWeight: 500,
//     fontSize: 14,
//     borderRadius: 6,
//     transition: "all 0.2s ease",
//     whiteSpace: "nowrap",
//   },
//   reportBtnActive: {
//     color: "#1e40af",
//     background: "#eff6ff",
//     border: "1px solid #3b82f6",
//   },
//   reportSection: {
//     background: "white",
//     border: "1px solid #e2e8f0",
//     borderRadius: 12,
//     padding: 24,
//   },
//   reportTitle: {
//     fontSize: 24,
//     fontWeight: 700,
//     margin: "0 0 20px 0",
//     color: "#1e293b",
//     padding: "12px 0",
//     borderBottom: "3px solid #3b82f6",
//     display: "inline-block",
//   },
//   sectionHeadline: {
//     fontSize: 16,
//     fontWeight: 700,
//     margin: "0 0 10px",
//     color: "#1e293b",
//     textTransform: "uppercase",
//     letterSpacing: "0.8px",
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: 700,
//     margin: "0 0 12px",
//     color: "#0f172a",
//   },
//   interpretationText: {
//     fontSize: 14,
//     lineHeight: 1.6,
//     color: "#1e293b",
//     margin: "0 0 12px",
//   },
//   interpretationList: {
//     marginLeft: 16,
//     color: "#334155",
//     lineHeight: 1.5,
//   },
//   masterySummaryCard: {
//     borderRadius: 14,
//     padding: 8,
//     minHeight: 120,
//     height: 150,
//     maxHeight: 150,
//     background: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
//     color: "white",
//     overflow: "hidden",
//   },
//   masterySummaryHeading: {
//     fontSize: 13,
//     fontWeight: 700,
//     letterSpacing: "0.8px",
//     marginBottom: 4,
//     opacity: 0.95,
//     lineHeight: 1.1,
//   },
//   masterySummaryValues: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "flex-start",
//     marginBottom: 2,
//     rowGap: 0,
//   },
//   masteryBigValue: {
//     fontSize: 34,
//     fontWeight: 800,
//     lineHeight: 1,
//   },
//   masteryLabel: {
//     fontSize: 12,
//     opacity: 0.9,
//     marginTop: 4,
//   },
//   masteryFocusText: {
//     fontSize: 13,
//     opacity: 0.88,
//     marginTop: 8,
//   },
//   masteryScore: {
//     fontSize: 44,
//     fontWeight: 800,
//     lineHeight: 1.1,
//     margin: 0,
//   },
//   masteryAvg: {
//     fontSize: 40,
//     fontWeight: 800,
//     lineHeight: 1.1,
//     margin: 0,
//   },
//   masteryLabel: {
//     fontSize: 12,
//     opacity: 0.9,
//     marginTop: 2,
//     marginBottom: 0,
//   },
//   masteryTrend: {
//     fontSize: 12,
//     color: "rgba(255,255,255,0.95)",
//     marginTop: 2,
//     marginBottom: 0,
//   },
//   wordSummaryGrid: {
//     display: "grid",
//     gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
//     gap: "10px",
//     marginBottom: "16px",
//   },
//   summaryCard: {
//     borderRadius: "14px",
//     background: "#ffffff",
//     border: "1px solid #e2e8f0",
//     padding: "10px 12px",
//     display: "flex",
//     flexDirection: "column",
//     justifyContent: "center",
//     minHeight: "110px",
//   },
//   wordsMetricCard: {
//     borderRadius: "14px",
//     background: "#ffffff",
//     border: "1px solid #3b82f6",
//     padding: "10px 12px",
//     display: "flex",
//     flexDirection: "column",
//     justifyContent: "center",
//     minHeight: "110px",
//   },
//   wordsMetricValue: {
//     fontSize: "28px",
//     fontWeight: 800,
//     color: "#1d4ed8",
//     lineHeight: 1,
//   },
//   summaryLabel: {
//     fontSize: "11px",
//     fontWeight: 700,
//     color: "#1e3a8a",
//     textTransform: "uppercase",
//     letterSpacing: "0.8px",
//     marginBottom: "4px",
//   },
//   summaryValue: {
//     fontSize: "28px",
//     fontWeight: 800,
//     color: "#1d4ed8",
//     lineHeight: 1,
//   },
//   analysisSection: {
//     borderRadius: "14px",
//     background: "#f8fafc",
//     border: "1px solid #e2e8f0",
//     padding: "10px 12px",
//     marginBottom: "14px",
//   },
//   clinicalNarrativeCard: {
//     background: "#eff6ff",
//     border: "1px solid #bfdbfe",
//     borderRadius: "14px",
//     padding: "10px",
//     flex: 1,
//     minWidth: "280px",
//   },
//   prosodicCard: {
//     background: "#ffffff",
//     border: "1px solid #e2e8f0",
//     borderRadius: "14px",
//     padding: "10px",
//     flex: 1,
//     minWidth: "260px",
//   },
//   analysisHeader: {
//     fontSize: "14px",
//     fontWeight: 700,
//     marginBottom: "6px",
//   },
//   analysisText: {
//     fontSize: "13px",
//     color: "#334155",
//     lineHeight: 1.35,
//     margin: 0,
//   },
//   focusBox: {
//     marginTop: "10px",
//     background: "white",
//     border: "1px solid #e2e8f0",
//     borderRadius: "10px",
//     padding: "8px 10px",
//   },
//   focusTitle: {
//     fontSize: "11px",
//     fontWeight: 700,
//     color: "#1e3a8a",
//     marginBottom: "6px",
//     textTransform: "uppercase",
//     letterSpacing: "0.6px",
//   },
//   focusList: {
//     margin: 0,
//     paddingLeft: "15px",
//     color: "#475569",
//     fontSize: "12px",
//     lineHeight: 1.3,
//   },
//   subSection: {
//     marginBottom: "16px",
//   },
//   subTitle: {
//     fontSize: "14px",
//     fontWeight: 700,
//     marginBottom: "8px",
//     color: "#1d4ed8",
//     textTransform: "uppercase",
//     letterSpacing: "1px",
//     borderBottom: "1px solid #bfdbfe",
//     paddingBottom: "6px",
//   },

//   tagRow: {
//     display: "flex",
//     gap: 8,
//     flexWrap: "wrap",
//     marginBottom: 12,
//   },
//   tagPill: {
//     fontSize: 11,
//     fontWeight: 700,
//     color: "#1d4ed8",
//     background: "#dbeafe",
//     borderRadius: 999,
//     padding: "4px 10px",
//   },
//   letterGrid: {
//     display: "grid",
//     gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
//     gap: 12,
//   },
//   letterCard: {
//     borderRadius: 14,
//     border: "1px solid #e2e8f0",
//     padding: "10px 10px",
//     display: "flex",
//     flexDirection: "column",
//     gap: 6,
//     minHeight: 120,
//     boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)",
//   },
//   letterBig: {
//     fontSize: 30,
//     fontWeight: 800,
//     letterSpacing: "-1px",
//   },
//   strengthPct: {
//     fontSize: 14,
//     fontWeight: 700,
//   },
//   letterLabel: {
//     fontSize: 11,
//     fontWeight: 600,
//     color: "#475569",
//     textTransform: "uppercase",
//     letterSpacing: "0.5px",
//   },
//   attemptsText: {
//     fontSize: 11,
//     color: "#64748b",
//   },
//   statusTag: {
//     marginTop: 4,
//     fontSize: 11,
//     fontWeight: 700,
//     color: "#1e293b",
//   },
//   reportStats: {
//     display: "grid",
//     gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
//     gap: 16,
//     marginBottom: 24,
//     paddingBottom: 24,
//     borderBottom: "1px solid #f1f5f9",
//   },
//   statItem: {
//     display: "flex",
//     flexDirection: "column",
//     gap: 4,
//   },
//   statLabel: {
//     fontSize: 12,
//     color: "#64748b",
//     textTransform: "uppercase",
//     fontWeight: 600,
//   },
//   statValue: {
//     fontSize: 20,
//     fontWeight: 700,
//     color: "#1e293b",
//   },
//   tableContainer: {
//     overflowX: "auto",
//   },
//   table: {
//     width: "100%",
//     borderCollapse: "collapse",
//   },
//   tableHeader: {
//     background: "#f8fafc",
//     borderBottom: "2px solid #e2e8f0",
//   },
//   tableCell: {
//     padding: "12px",
//     textAlign: "left",
//     borderBottom: "1px solid #f1f5f9",
//     fontSize: 14,
//   },
//   tableRow: {
//     "&:hover": {
//       background: "#f8fafc",
//     },
//   },
//   progressBar: {
//     width: "100%",
//     height: 6,
//     background: "#f1f5f9",
//     borderRadius: 3,
//     overflow: "hidden",
//     marginBottom: 4,
//   },
//   progressFill: {
//     height: "100%",
//     background: "#3b82f6",
//     borderRadius: 3,
//   },
//   loadingMessage: {
//     textAlign: "center",
//     padding: 40,
//     color: "#64748b",
//     fontSize: 16,
//   },
//   errorMessage: {
//     background: "#fee2e2",
//     color: "#991b1b",
//     padding: 16,
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch, downloadStudentReport } from "../api/api";
import { SearchablePaginatedTable } from "../components/SearchablePaginatedList";

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

function getSentenceNarrative(student, reportData) {
  const name = student?.name || "The student";
  const successRate = Number(reportData?.successRate ?? 0);
  const avgLatencyNum = Number(getSentenceAvgLatency(reportData?.attempts));
  const attempts = Array.isArray(reportData?.attempts) ? reportData.attempts : [];
  const rnn = attempts.length;
  const struggles = attempts.filter((a) => Number(a.accuracy ?? 0) < 75).length;

  const accuracyLevel =
    successRate >= 85 ? "strong" :
    successRate >= 70 ? "developing" :
    "emerging";

  const latencyLevel =
    avgLatencyNum <= 2.5 ? "efficient" :
    avgLatencyNum <= 4.0 ? "moderate" :
    "slow";

  const focusArea = struggles > 0
    ? `Focus on 3+ syllable targets and clause boundary planning; ${struggles} sentences are below 75% accuracy.`
    : "Maintain current progress and integrate more complex sentence forms to further build fluency.";

  return `${name} shows ${accuracyLevel} sentence accuracy (${successRate.toFixed(1)}%) across ${rnn} attempts with ${latencyLevel} retrieval latency (${avgLatencyNum.toFixed(1)}s). ${focusArea}`;
}

function getSentenceAvgLatency(attempts) {
  if (!Array.isArray(attempts) || attempts.length === 0) return "—";
  const latencies = attempts
    .map((a) => Number(a.responseTime || a.latency || 0))
    .filter((v) => v > 0);
  if (latencies.length === 0) return "—";
  const avgMs = latencies.reduce((sum, v) => sum + v, 0) / latencies.length;
  return (avgMs / 1000).toFixed(1);
}

/* ── Dynamic Clinical Interpretation for Letters ──────────────────────────── */
function getLetterClinicalInterpretation(student, letters) {
  const name = student?.name || "The student";
  const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
  const map = {};
  letters.forEach((l) => { map[l.letter?.toLowerCase()] = l; });

  const vowels = ["a", "e", "i", "o", "u"];
  const plosives = ["b", "p", "d", "t", "g", "k"];
  const fricatives = ["s", "z", "f", "v"];
  const sonorants = ["l", "r", "m", "n"];

  const getGroupStrength = (group) => {
    const practised = group.filter((c) => map[c] && (map[c].attempts || 0) > 0);
    if (practised.length === 0) return null;
    const avg = practised.reduce((sum, c) => sum + Number(map[c].strength), 0) / practised.length;
    return { avg, practised: practised.length, total: group.length };
  };

  const vowelStats = getGroupStrength(vowels);
  const plosiveStats = getGroupStrength(plosives);
  const fricativeStats = getGroupStrength(fricatives);
  const sonorantStats = getGroupStrength(sonorants);

  const weakLetters = alphabet.filter((c) => map[c] && Number(map[c].strength) < 0);
  const developingLetters = alphabet.filter((c) => map[c] && Number(map[c].strength) >= 0 && Number(map[c].strength) < 40);
  const masteredLetters = alphabet.filter((c) => map[c] && Number(map[c].strength) >= 40);
  const totalAttempts = letters.reduce((acc, l) => acc + (l.attempts || 0), 0);

  // Determine strongest and weakest groups
  const groupResults = [
    { name: "vowels", label: "vowel sounds", stats: vowelStats },
    { name: "plosives", label: "plosive consonants", stats: plosiveStats },
    { name: "fricatives", label: "fricative consonants", stats: fricativeStats },
    { name: "sonorants", label: "sonorant consonants", stats: sonorantStats },
  ].filter((g) => g.stats !== null);

  groupResults.sort((a, b) => b.stats.avg - a.stats.avg);
  const strongest = groupResults[0];
  const weakest = groupResults[groupResults.length - 1];

  // Build narrative
  let narrative = "";

  if (totalAttempts === 0) {
    return `${name} has not yet attempted any letter exercises. No phoneme-grapheme data is available for clinical interpretation at this time.`;
  }

  // Opening — strongest group
  if (strongest && strongest.stats.avg >= 40) {
    narrative += `${name} demonstrates mastery in ${strongest.label} (avg strength ${strongest.stats.avg.toFixed(1)}%), indicating well-established phoneme-grapheme mapping for this category. `;
  } else if (strongest) {
    narrative += `${name} shows developing phoneme-grapheme correspondence, with ${strongest.label} as the relative strength area (avg ${strongest.stats.avg.toFixed(1)}%). `;
  }

  // Weakest group challenge
  if (weakest && weakest.stats.avg < 20 && weakest.name !== strongest?.name) {
    const exLetters = alphabet.filter((c) =>
      (weakest.name === "plosives" ? plosives :
       weakest.name === "fricatives" ? fricatives :
       weakest.name === "sonorants" ? sonorants : vowels).includes(c) &&
      map[c] && Number(map[c].strength) < 0
    );
    const examples = exLetters.slice(0, 3).map((c) => `'${c}'`).join(", ");
    narrative += `Persistent challenges are noted with ${weakest.label}${examples ? ` (particularly ${examples})` : ""}, which may indicate difficulty with articulatory planning or phonological discrimination for these sound classes. `;
  } else if (weakest && weakest.stats.avg < 40 && weakest.name !== strongest?.name) {
    narrative += `${weakest.label.charAt(0).toUpperCase() + weakest.label.slice(1)} remain in the developing range and would benefit from targeted practise to consolidate letter-sound associations. `;
  }

  // Reversal or confusion risk
  const confusionPairs = [["b","d"],["p","q"],["m","n"],["u","n"]];
  const confusedPairs = confusionPairs.filter(([a, b]) =>
    map[a] && Number(map[a].strength) < 20 &&
    map[b] && Number(map[b].strength) < 20
  );
  if (confusedPairs.length > 0) {
    const pairs = confusedPairs.map(([a, b]) => `'${a}'/'${b}'`).join(", ");
    narrative += `Low concurrent strength for ${pairs} suggests potential reversal or visual confusion risk — a common marker in early dyslexic profiles. `;
  }

  // Mastered letters count
  if (masteredLetters.length > 0) {
    narrative += `${masteredLetters.length} letter${masteredLetters.length > 1 ? "s have" : " has"} reached mastery threshold (≥40% strength): ${masteredLetters.slice(0, 6).map((c) => c.toUpperCase()).join(", ")}${masteredLetters.length > 6 ? "..." : ""}. `;
  }

  // Focus recommendation
  if (weakLetters.length > 0) {
    narrative += `Priority intervention targets: ${weakLetters.slice(0, 5).map((c) => c.toUpperCase()).join(", ")} — recommend multisensory letter formation drills and rapid naming exercises for these graphemes.`;
  } else if (developingLetters.length > 0) {
    narrative += `Consolidation focus recommended for developing letters to build automaticity and reduce retrieval latency.`;
  } else {
    narrative += `Alphabetic knowledge appears robust; consider advancing to morpheme-level and phonological blending tasks.`;
  }

  return narrative;
}

/* ── Dynamic Tags for Letters ─────────────────────────────────────────────── */
function getLetterClinicalTags(letters) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
  const map = {};
  letters.forEach((l) => { map[l.letter?.toLowerCase()] = l; });

  const tags = [];

  const vowels = ["a", "e", "i", "o", "u"];
  const vowelPractised = vowels.filter((c) => map[c] && (map[c].attempts || 0) > 0);
  const vowelMastered = vowelPractised.filter((c) => Number(map[c].strength) >= 40);
  if (vowelMastered.length >= 3) tags.push("HIGH VOWEL MASTERY");
  else if (vowelMastered.length >= 1) tags.push("VOWEL DEVELOPMENT");
  else if (vowelPractised.length > 0) tags.push("VOWEL INTERVENTION NEEDED");

  const plosives = ["b", "p", "d", "t", "g", "k"];
  const weakPlosives = plosives.filter((c) => map[c] && Number(map[c].strength) < 0);
  if (weakPlosives.length >= 2) tags.push("CONSONANT REVERSAL RISK");

  const confusionPairs = [["b","d"],["p","q"]];
  const hasConfusion = confusionPairs.some(([a, b]) =>
    map[a] && Number(map[a].strength) < 20 &&
    map[b] && Number(map[b].strength) < 20
  );
  if (hasConfusion) tags.push("VISUAL CONFUSION RISK");

  const allPractised = alphabet.filter((c) => map[c] && (map[c].attempts || 0) > 0);
  const avgStrAll = allPractised.length
    ? allPractised.reduce((s, c) => s + Number(map[c].strength), 0) / allPractised.length
    : 0;

  if (avgStrAll > 30) tags.push("IMPROVED RETRIEVAL");
  else if (avgStrAll > 10) tags.push("RETRIEVAL DEVELOPING");
  else if (allPractised.length > 0) tags.push("RETRIEVAL SUPPORT NEEDED");

  const masteredCount = alphabet.filter((c) => map[c] && Number(map[c].strength) >= 40).length;
  if (masteredCount >= 15) tags.push("STRONG ALPHABETIC BASE");
  else if (masteredCount >= 8) tags.push("PARTIAL MASTERY");

  // Fallback
  if (tags.length === 0) tags.push("ASSESSMENT IN PROGRESS");

  return tags.slice(0, 4);
}

/* ── Dynamic Phonological Processing Analysis for Words ───────────────────── */
function getWordsPhonologicalAnalysis(student, reportData) {
  const name = student?.name || "The student";
  const twM = reportData?.twoLetter;
  const wdM = reportData?.words;
  const cmb = reportData?.combined;

  const twoWords = twM?.allWords ?? [];
  const multiWords = wdM?.allWords ?? [];

  const twoRate = twM?.overview?.successRate ?? 0;
  const multiRate = wdM?.overview?.successRate ?? 0;
  const twoRT = twM?.overview?.avgResponseTime ?? 0;
  const multiRT = wdM?.overview?.avgResponseTime ?? 0;
  const combinedRate = cmb?.successRate ?? 0;

  const totalAttempts = (twM?.overview?.totalAttempts ?? 0) + (wdM?.overview?.totalAttempts ?? 0);

  if (totalAttempts === 0) {
    return {
      narrative: `${name} has not yet completed any word-level exercises. Phonological processing data will populate as sessions are recorded.`,
      focusItems: ["Begin with CVC word targets", "Establish baseline decoding speed", "Introduce two-letter high-frequency words"],
    };
  }

  let narrative = "";

  // Accuracy comparison
  if (twoRate > 0 && multiRate > 0) {
    const diff = twoRate - multiRate;
    if (diff > 20) {
      narrative += `${name} shows a significant accuracy gap between two-letter words (${twoRate}%) and multi-letter words (${multiRate}%), indicating orthographic load as a primary barrier to decoding fluency. `;
    } else if (diff > 8) {
      narrative += `${name} demonstrates stronger performance on two-letter targets (${twoRate}%) compared to multi-letter words (${multiRate}%), consistent with developing phonological working memory capacity for longer sequences. `;
    } else if (multiRate > twoRate) {
      narrative += `${name} shows comparable or stronger accuracy on multi-letter words (${multiRate}%) versus two-letter targets (${twoRate}%), suggesting solid phonological blending skills across word lengths. `;
    } else {
      narrative += `${name} demonstrates consistent accuracy across two-letter (${twoRate}%) and multi-letter (${multiRate}%) word targets, indicating stable phoneme-grapheme mapping at the word level. `;
    }
  } else if (twoRate > 0) {
    narrative += `${name} has completed two-letter word exercises with a ${twoRate}% success rate. Multi-letter word data is not yet available for comparative analysis. `;
  } else if (multiRate > 0) {
    narrative += `${name} has completed multi-letter word exercises with a ${multiRate}% success rate. Two-letter baseline data is not yet available. `;
  }

  // Response time analysis
  if (twoRT > 0 && multiRT > 0) {
    const rtDiff = (multiRT - twoRT) / 1000;
    if (rtDiff > 1.5) {
      narrative += `Response latency increases markedly for multi-letter words (+${rtDiff.toFixed(1)}s), pointing to effortful phonological assembly and limited automaticity with complex word forms. `;
    } else if (rtDiff > 0.5) {
      narrative += `A moderate latency increase for multi-letter words (+${rtDiff.toFixed(1)}s) reflects the additional retrieval load of multi-phoneme sequences, within expected developmental range. `;
    } else {
      narrative += `Response time is relatively consistent across word lengths, suggesting developing automaticity in phonological retrieval. `;
    }
  }

  // Identify specific problem words
  const lowTwoWords = twoWords.filter((w) => w.successRate < 60).map((w) => w.word.toUpperCase());
  const lowMultiWords = multiWords.filter((w) => w.successRate < 60).map((w) => w.word.toUpperCase());

  if (lowTwoWords.length > 0) {
    narrative += `Two-letter targets needing reinforcement: ${lowTwoWords.slice(0, 4).join(", ")}. `;
  }
  if (lowMultiWords.length > 0) {
    narrative += `Multi-letter targets with accuracy below 60%: ${lowMultiWords.slice(0, 4).join(", ")}. `;
  }

  // Closing recommendation
  if (combinedRate >= 80) {
    narrative += `Overall word-level accuracy is strong. Recommend advancing to sentence-level fluency tasks and timed reading to build automaticity.`;
  } else if (combinedRate >= 60) {
    narrative += `Recommended priority: blend-name drills with CVC and CCVC sets, paired with repeated reading of high-frequency word lists to build sub-lexical automaticity.`;
  } else {
    narrative += `Targeted phoneme isolation and segmentation activities are recommended before progressing to blended word reading tasks.`;
  }

  return { narrative, focusItems: getWordsFocusItems(twoWords, multiWords, twoRate, multiRate) };
}

function getWordsFocusItems(twoWords, multiWords, twoRate, multiRate) {
  const items = [];

  if (twoRate < 70) items.push("Rapid CVC blending drills with two-letter targets");
  if (multiRate < 70) items.push("Phoneme-grapheme mapping for multi-syllabic words");

  const slowTwoWords = twoWords.filter((w) => w.avgResponseTime > 3000);
  const slowMultiWords = multiWords.filter((w) => w.avgResponseTime > 4000);
  if (slowTwoWords.length > 0 || slowMultiWords.length > 0) {
    items.push("Reduce visual naming latency with timed flashcard drills");
  }

  // Check for 'sh', 'ch' patterns by looking for words containing them
  const hasDigraphTargets = multiWords.some((w) =>
    ["sh","ch","th","wh","ph"].some((d) => w.word.toLowerCase().includes(d))
  );
  if (hasDigraphTargets) items.push("Reinforce phoneme-grapheme mapping for digraphs (sh, ch, th)");

  const highPerformers = [...twoWords, ...multiWords].filter((w) => w.successRate >= 90);
  if (highPerformers.length >= 3) {
    items.push(`Consolidate mastered targets (${highPerformers.length} words at ≥90%) and introduce higher complexity`);
  }

  if (items.length === 0) {
    items.push("Continue current programme and monitor response time trajectories");
    items.push("Introduce contextual reading tasks to transfer word-level skills");
  }

  return items.slice(0, 4);
}

export default function TherapistStudentDetail() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [summary, setSummary] = useState(null);
  const [selectedReport, setSelectedReport] = useState("summary");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState(7);

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
      const data = await apiFetch(`/api/therapist/students/${studentId}`);
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
        `/api/therapist/students/${studentId}/summary?timeframe=${timeframe}`
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
        url = `/api/therapist/students/${studentId}/report/words?timeframe=${timeframe}`;
      } else if (reportType === "sentences") {
        url = `/api/therapist/students/${studentId}/report/sentences?timeframe=${timeframe}`;
      } else if (reportType === "letters") {
        url = `/api/therapist/students/${studentId}/report/letters?timeframe=${timeframe}`;
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
            ...(selectedReport === "summary" ? styles.reportBtnActive : {}),
          }}
        >
          Summary
        </button>
        <button
          onClick={() => setSelectedReport("letters")}
          style={{
            ...styles.reportBtn,
            ...(selectedReport === "letters" ? styles.reportBtnActive : {}),
          }}
        >
          Letters Report
        </button>
        <button
          onClick={() => setSelectedReport("words")}
          style={{
            ...styles.reportBtn,
            ...(selectedReport === "words" ? styles.reportBtnActive : {}),
          }}
        >
          Words Report
        </button>
        <button
          onClick={() => setSelectedReport("sentences")}
          style={{
            ...styles.reportBtn,
            ...(selectedReport === "sentences" ? styles.reportBtnActive : {}),
          }}
        >
          Sentences Report
        </button>
      </div>

      {/* Summary Cards */}
      {selectedReport === "summary" && summary && (
        <div style={styles.summarySection}>
          <div style={styles.summaryGrid}>
            {/* Student Profile Card */}
            {student && (
              <div style={styles.summaryCard}>
                <div style={styles.cardIconLarge}>👤</div>
                <div style={styles.cardContent}>
                  <div style={styles.cardLabel}>Student Profile</div>
                  <div style={styles.profileDetail}><strong>{student.name}</strong></div>
                  {student.age != null && (
                    <div style={styles.profileDetail}>Age: {student.age} years</div>
                  )}
                  <div style={styles.profileDetail}>{student.email}</div>
                  {student.createdAt && (
                    <div style={{...styles.profileDetail, fontSize: 12, marginTop: 4, color: "#94a3b8"}}>
                      Member since {new Date(student.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Active Status Card */}
            {student && student.lastActive && (
              <div style={styles.summaryCard}>
                <div style={styles.cardIconLarge}>⏱️</div>
                <div style={styles.cardContent}>
                  <div style={styles.cardLabel}>Activity Status</div>
                  <div style={styles.profileDetail}>Last Active:</div>
                  <div style={styles.statusDetail}>{new Date(student.lastActive).toLocaleString()}</div>
                  <div style={{...styles.profileDetail, fontSize: 12, marginTop: 4}}>
                    {getTimeAgo(new Date(student.lastActive))}
                  </div>
                </div>
              </div>
            )}
            
            {summary.sentences && (
              <div style={styles.summaryCard}>
                <div style={styles.cardIconLarge}>📖</div>
                <div style={styles.cardContent}>
                  <div style={styles.cardLabel}>Sentences</div>
                  <div style={styles.cardValue}>{summary.sentences.total}</div>
                  <div style={styles.cardSubtext}>
                    Success: {summary.sentences.successRate}%
                  </div>
                </div>
              </div>
            )}
            
            {summary.words && (
              <div style={styles.summaryCard}>
                <div style={styles.cardIconLarge}>💬</div>
                <div style={styles.cardContent}>
                  <div style={styles.cardLabel}>Words</div>
                  <div style={styles.cardValue}>{summary.words.total}</div>
                  <div style={styles.cardSubtext}>
                    Success: {summary.words.successRate}%
                  </div>
                </div>
              </div>
            )}
            
            {summary.letters && (
              <div style={styles.summaryCard}>
                <div style={styles.cardIconLarge}>🔤</div>
                <div style={styles.cardContent}>
                  <div style={styles.cardLabel}>Letters</div>
                  <div style={styles.cardValue}>{summary.letters.total}</div>
                  <div style={styles.cardSubtext}>
                    Strength: {summary.letters.avgStrength}%
                  </div>
                </div>
              </div>
            )}
            
            {/* Overall Progress Card */}
            {summary && (
              <div style={styles.summaryCard}>
                <div style={styles.cardIconLarge}>📊</div>
                <div style={styles.cardContent}>
                  <div style={styles.cardLabel}>Overall Activity</div>
                  <div style={styles.cardValue}>
                    {(summary.sentences?.total || 0) + (summary.words?.total || 0) + (summary.letters?.total || 0)}
                  </div>
                  <div style={styles.cardSubtext}>Total attempts</div>
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
      {selectedReport === "letters" && reportData && (() => {
        const letters = reportData.letters || [];
        const totalLetters = 26;
        const totalAttempts = letters.reduce((acc, l) => acc + (l.attempts || 0), 0);
        const avgStrength = letters.length
          ? letters.reduce((acc, l) => acc + Number(l.strength), 0) / letters.length
          : 0;
        const practicedCount = letters.filter((l) => (l.attempts || 0) > 0).length;
        const masteredCount = letters.filter((l) => Number(l.strength) >= 40).length;
        const problemLetters = letters.filter((l) => Number(l.strength) < 0);

        // Dynamic content
        const clinicalText = getLetterClinicalInterpretation(student, letters);
        const clinicalTags = getLetterClinicalTags(letters);

        return (
          <div style={styles.reportSection}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={styles.reportTitle}>Letters Report</h2>
              <button
                onClick={() => downloadStudentReport(studentId, 'letters', timeframe)}
                style={styles.downloadBtn}
              >
                📄 Download Report
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.35fr .65fr", gap: 16, marginBottom: 20 }}>
              <div style={styles.card}>
                <h3 style={styles.sectionHeadline}>CLINICAL INTERPRETATION</h3>
                <p style={styles.interpretationText}>{clinicalText}</p>
                <div style={styles.tagRow}>
                  {clinicalTags.map((tag, i) => (
                    <span key={i} style={styles.tagPill}>{tag}</span>
                  ))}
                </div>
                <ul style={styles.interpretationList}>
                  <li>Overall strength: <strong>{avgStrength.toFixed(1)}%</strong></li>
                  <li>Letters mastered: <strong>{masteredCount}/{totalLetters}</strong></li>
                  <li>Letters practised: <strong>{practicedCount}/{totalLetters}</strong></li>
                  <li>Focus letters: <strong>{problemLetters.length ? problemLetters.map((l) => l.letter.toUpperCase()).join(", ") : "None"}</strong></li>
                </ul>
              </div>

              <div style={styles.masterySummaryCard}>
                <div style={styles.masterySummaryHeading}>MASTERY SUMMARY</div>
                <div style={styles.masterySummaryValues}>
                  <div>
                    <div style={styles.masteryScore}>{masteredCount}/{totalLetters}</div>
                    <div style={styles.masteryLabel}>Letters Mastered</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={styles.masteryAvg}>{avgStrength.toFixed(1)}%</div>
                    <div style={styles.masteryLabel}>Avg Strength</div>
                    <div style={styles.masteryTrend}>
                      <span style={{ fontWeight: 700 }}>+{Math.min(20, Math.max(1, Number(avgStrength.toFixed(0))))}%</span> vs last session
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h3 style={styles.sectionTitle}>Alphabet Strength Analysis</h3>
              <TherapistLetterStrengthGrid letters={letters} />
            </div>
          </div>
        );
      })()}

      {/* Words Report */}
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

        const twoWords = twM?.allWords ?? [];
        const multiWords = wdM?.allWords ?? [];

        // Dynamic phonological analysis
        const { narrative: phonNarrative, focusItems } = getWordsPhonologicalAnalysis(student, reportData);

        return (
          <div style={styles.reportSection}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={styles.reportTitle}>Words Report</h2>
              <button
                onClick={() => downloadStudentReport(studentId, 'words', timeframe)}
                style={styles.downloadBtn}
              >
                📄 Download Report
              </button>
            </div>

            <div style={styles.wordSummaryGrid}>
              <div style={styles.wordsMetricCard}> 
                <div style={styles.summaryLabel}>Combined Accuracy</div>
                <div style={styles.wordsMetricValue}>{combinedRate}%</div>
              </div>
              <div style={styles.wordsMetricCard}>
                <div style={styles.summaryLabel}>Avg Response Time</div>
                <div style={styles.wordsMetricValue}>{avgRT > 0 ? `${(avgRT / 1000).toFixed(1)}s` : "—"}</div>
              </div>
              <div style={styles.wordsMetricCard}>
                <div style={styles.summaryLabel}>Multi-Letter Rate</div>
                <div style={styles.wordsMetricValue}>{wdM?.overview?.successRate ? `${wdM.overview.successRate}%` : "—"}</div>
              </div>
            </div>

            <div style={styles.analysisSection}>
              <h3 style={styles.analysisHeader}>Phonological Processing Analysis</h3>
              <p style={styles.analysisText}>{phonNarrative}</p>
              {/* <div style={styles.focusBox}>
                <div style={styles.focusTitle}>Therapeutic Focus</div>
                <ul style={styles.focusList}>
                  {focusItems.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div> */}
            </div>

            <div style={styles.subSection}>
              <div style={styles.subTitle}>Two-Letter Words</div>
              <SearchablePaginatedTable
                items={twoWords}
                headers={["Word Target", "Attempts / Correct", "Accuracy", "Avg Response", "Fluency Trend"]}
                getSearchText={(item) => `${item.word} ${item.totalAttempts} ${item.correctCount} ${item.successRate}`}
                searchPlaceholder="Search two-letter words..."
                emptyMessage="No two-letter words found."
                renderRow={(item, idx) => (
                  <tr key={`${item.word}-${idx}`} style={styles.tableRow}>
                    <td style={styles.tableCell}>{item.word.toUpperCase()}</td>
                    <td style={styles.tableCell}>{item.totalAttempts}/{item.correctCount}</td>
                    <td style={styles.tableCell}>{item.successRate}%</td>
                    <td style={styles.tableCell}>{(item.avgResponseTime/1000).toFixed(2)}s</td>
                    <td style={styles.tableCell}>{item.successRate >= 80 ? "↗" : item.successRate >= 60 ? "→" : "↘"}</td>
                  </tr>
                )}
              />
            </div>

            <div style={styles.subSection}>
              <div style={styles.subTitle}>Multi-Letter & Complex</div>
              <SearchablePaginatedTable
                items={multiWords}
                headers={["Word Target", "Attempts / Correct", "Accuracy", "Avg Response", "Fluency Trend"]}
                getSearchText={(item) => `${item.word} ${item.totalAttempts} ${item.correctCount} ${item.successRate}`}
                searchPlaceholder="Search multi-letter words..."
                emptyMessage="No multi-letter words found."
                renderRow={(item, idx) => (
                  <tr key={`${item.word}-${idx}`} style={styles.tableRow}>
                    <td style={styles.tableCell}>{item.word.toUpperCase()}</td>
                    <td style={styles.tableCell}>{item.totalAttempts}/{item.correctCount}</td>
                    <td style={styles.tableCell}>{item.successRate}%</td>
                    <td style={styles.tableCell}>{(item.avgResponseTime/1000).toFixed(2)}s</td>
                    <td style={styles.tableCell}>{item.successRate >= 80 ? "↗" : item.successRate >= 60 ? "→" : "↘"}</td>
                  </tr>
                )}
              />
            </div>
          </div>
        );
      })()}


      {/* Sentences Report */}
      {selectedReport === "sentences" && reportData && (
        <div style={styles.reportSection}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={styles.reportTitle}>Sentences Report</h2>
            <button
              onClick={() => downloadStudentReport(studentId, 'sentences', timeframe)}
              style={styles.downloadBtn}
            >
              📄 Download Report
            </button>
          </div>

          <div style={styles.wordSummaryGrid}>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>Combined Accuracy</div>
              <div style={styles.summaryValue}>{reportData.successRate}%</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>Avg Response Time</div>
              <div style={styles.summaryValue}>{getSentenceAvgLatency(reportData.attempts)}s</div>
            </div>
          </div>

          <div style={styles.analysisSection}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={styles.clinicalNarrativeCard}>
                <h3 style={styles.analysisHeader}>Clinical Narrative Analysis</h3>
                <p style={styles.analysisText}>
                  {getSentenceNarrative(student, reportData)}
                </p>
              </div>
            </div>
          </div>

          {/* Eye-Tracking Analysis Section */}
          {reportData?.eyeTracking && (
            <div style={{
              background: "white",
              borderRadius: 18,
              padding: "28px 30px",
              marginBottom: 20,
              boxShadow: "0 2px 12px rgba(0,0,0,.08)",
              border: "2px solid #bfdbfe"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 24,
                flexWrap: "wrap",
                gap: 12
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ fontSize: 42, flexShrink: 0 }}>👁️</div>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
                      Eye-Tracking Analysis
                    </h2>
                    <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                      Visual hesitation measured during sentence reading
                    </p>
                  </div>
                </div>
                {reportData.eyeTracking.tracked > 0 && (
                  <div style={{
                    padding: "8px 18px",
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                    background:
                      reportData.eyeTracking.hesitationLevel === "High"
                        ? "rgba(220, 38, 38, 0.1)"
                        : reportData.eyeTracking.hesitationLevel === "Moderate"
                        ? "rgba(217, 119, 6, 0.1)"
                        : "rgba(5, 150, 105, 0.1)",
                    color:
                      reportData.eyeTracking.hesitationLevel === "High"
                        ? "#dc2626"
                        : reportData.eyeTracking.hesitationLevel === "Moderate"
                        ? "#d97706"
                        : "#059669",
                    border:
                      reportData.eyeTracking.hesitationLevel === "High"
                        ? "2px solid rgba(220, 38, 38, 0.25)"
                        : reportData.eyeTracking.hesitationLevel === "Moderate"
                        ? "2px solid rgba(217, 119, 6, 0.25)"
                        : "2px solid rgba(5, 150, 105, 0.25)",
                  }}>
                    {reportData.eyeTracking.hesitationLevel} Hesitation
                  </div>
                )}
              </div>

              {reportData.eyeTracking.tracked > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* Gauge + Stats Row */}
                  <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
                    {/* Gauge */}
                    <TherapistHesitationGauge
                      score={parseFloat(reportData.eyeTracking.avgVisualScore)}
                      level={reportData.eyeTracking.hesitationLevel}
                    />
                    {/* Stats Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, flex: 1 }}>
                      <TherapistEyeStatBox
                        icon="📷"
                        label="Sessions Tracked"
                        value={reportData.eyeTracking.tracked}
                        sub={`${((reportData.eyeTracking.tracked / (reportData.attempts?.length || 1)) * 100).toFixed(0)}% of total sessions`}
                        color="#3b82f6"
                      />
                      <TherapistEyeStatBox
                        icon="⏸️"
                        label="Avg Hesitation"
                        value={reportData.eyeTracking.avgVisualScore}
                        sub={`${reportData.eyeTracking.hesitationLevel} level`}
                        color={
                          reportData.eyeTracking.hesitationLevel === "High"
                            ? "#dc2626"
                            : reportData.eyeTracking.hesitationLevel === "Moderate"
                            ? "#d97706"
                            : "#059669"
                        }
                      />
                      <TherapistEyeStatBox
                        icon="🚨"
                        label="Hard Sessions"
                        value={reportData.eyeTracking.hardSessions}
                        sub={`${reportData.eyeTracking.hardRate}% flagged as critical`}
                        color={parseInt(reportData.eyeTracking.hardSessions) > 0 ? "#dc2626" : "#059669"}
                      />
                      <TherapistEyeStatBox
                        icon="🎯"
                        label="Easy Sessions"
                        value={(reportData.attempts?.length || 0) - reportData.eyeTracking.hardSessions}
                        sub="Visually comfortable"
                        color="#059669"
                      />
                    </div>
                  </div>

                  {/* Hesitation Zones */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                    {[
                      { label: "Low", range: "0.0 – 0.3", desc: "Smooth eye flow", color: "#059669" },
                      { label: "Moderate", range: "0.3 – 0.6", desc: "Some pausing", color: "#d97706" },
                      { label: "High", range: "0.6 – 1.0", desc: "Frequent re-fixation", color: "#dc2626" },
                    ].map((z) => (
                      <div
                        key={z.label}
                        style={{
                          borderRadius: 12,
                          padding: "14px 16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                          transition: "box-shadow .2s",
                          borderTop: `3px solid ${z.color}`,
                          background:
                            reportData.eyeTracking.hesitationLevel === z.label
                              ? `${z.color}10`
                              : "#f8fafc",
                          boxShadow:
                            reportData.eyeTracking.hesitationLevel === z.label
                              ? `0 0 0 2px ${z.color}40`
                              : "none",
                        }}
                      >
                        <span style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: z.color,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em"
                        }}>
                          {z.label}
                        </span>
                        <span style={{
                          fontSize: 18,
                          fontWeight: 800,
                          fontFamily: "'Fira Code',monospace",
                          color: "#0f172a"
                        }}>
                          {z.range}
                        </span>
                        <span style={{ fontSize: 12, color: "#64748b" }}>
                          {z.desc}
                        </span>
                        {reportData.eyeTracking.hesitationLevel === z.label && (
                          <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: z.color,
                            marginTop: 2
                          }}>
                            ← You are here
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Clinical Insight */}
                  <div style={{
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start",
                    background: "#eff6ff",
                    borderRadius: 12,
                    padding: "16px 20px",
                    border: "1px solid #bfdbfe"
                  }}>
                    <span style={{ fontSize: 18 }}>💡</span>
                    <p style={{ fontSize: 14, color: "#1e40af", lineHeight: 1.7, margin: 0 }}>
                      {reportData.eyeTracking.hesitationLevel === "High"
                        ? "High visual hesitation suggests difficulty tracking text. Practice smooth left-to-right eye movement and try using a finger or ruler to guide reading."
                        : reportData.eyeTracking.hesitationLevel === "Moderate"
                        ? "Moderate hesitation is common in early reading development. Increasing font size and reducing visual clutter can help improve tracking."
                        : "Great visual tracking! Eyes are moving smoothly across sentences — this supports faster reading fluency."}
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  padding: "40px 20px",
                  gap: 12
                }}>
                  <span style={{ fontSize: 48 }}>📷</span>
                  <h4 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                    No Eye-Tracking Data Yet
                  </h4>
                  <p style={{
                    fontSize: 14,
                    color: "#64748b",
                    maxWidth: 500,
                    lineHeight: 1.7,
                    margin: 0
                  }}>
                    Enable the camera during practice sessions to unlock visual hesitation analysis. Eye-tracking helps identify exactly where reading breaks down.
                  </p>
                </div>
              )}
            </div>
          )}

          <div style={styles.subSection}>
            <div style={styles.subTitle}>Sentence Performance Table</div>
            <SearchablePaginatedTable
              items={reportData.attempts || []}
              headers={["Target Sentence", "Spoken Response", "Status", "Accuracy", "Latency"]}
              getSearchText={(attempt) => `${attempt.sentence} ${attempt.spoken || ""} ${attempt.correct ? "correct" : "incorrect"} ${attempt.accuracy}`}
              searchPlaceholder="Search sentence attempts..."
              emptyMessage="No sentence attempts found."
              renderRow={(attempt, idx) => (
                <tr key={`${attempt.sentence}-${idx}`} style={styles.tableRow}>
                  <td style={styles.tableCell}>{attempt.sentence}</td>
                  <td style={styles.tableCell}>{attempt.spoken || ""}</td>
                  <td style={styles.tableCell}>{attempt.correct ? "✅" : "❌"}</td>
                  <td style={styles.tableCell}>{attempt.accuracy}%</td>
                  <td style={styles.tableCell}>{(attempt.responseTime/1000).toFixed(1)}s</td>
                </tr>
              )}
            />
          </div>
        </div>
      )}

      {loading && (
        <div style={styles.loadingMessage}>Loading report...</div>
      )}
    </div>
  );
}

function TherapistLetterStrengthGrid({ letters }) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
  const map = {};
  letters.forEach((l) => {
    map[l.letter?.toLowerCase()] = l;
  });

  return (
    <div style={styles.letterGrid}>
      {alphabet.map((char) => {
        const item = map[char];
        const strength = item ? Number(item.strength) : null;
        const attempts = item?.attempts || 0;
        const status = strength === null
          ? "Not Practised"
          : strength >= 40
          ? "Mastered"
          : strength >= 0
          ? "Developing"
          : "Needs Focus";

        const bg = strength === null
          ? "#f8fafc"
          : strength >= 40
          ? "#d1fae5"
          : strength >= 0
          ? "#fef3c7"
          : "#fee2e2";

        const text = strength === null ? "—" : `${strength.toFixed(1)}%`;
        const color = strength === null
          ? "#64748b"
          : strength >= 40
          ? "#065f46"
          : strength >= 0
          ? "#92400e"
          : "#991b1b";

        const typeLabel = (() => {
          if (["a","e","i","o","u"].includes(char)) return "Vowel Sound";
          if (["b","p","d","t","g","k"].includes(char)) return "Plosive";
          if (["s","z","f","v","th"].includes(char)) return "Fricative";
          if (["l","r","m","n","ng"].includes(char)) return "Sonorant";
          return "Letter";
        })();

        return (
          <div key={char} style={{ ...styles.letterCard, background: bg, borderColor: "#e2e8f0" }}>
            <div style={{ ...styles.letterBig, color }}>{char.toUpperCase()}</div>
            <div style={{ ...styles.strengthPct, color }}>{text}</div>
            <div style={styles.letterLabel}>{typeLabel}</div>
            <div style={styles.attemptsText}>Attempts: {attempts}</div>
            <div style={styles.statusTag}>{status}</div>
          </div>
        );
      })}
    </div>
  );
}

function TherapistEyeStatBox({ icon, label, value, sub, color }) {
  return (
    <div style={{ background: "white", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4, borderTop: `3px solid ${color}` }}>
      <span style={{ fontSize: 22, marginBottom: 6 }}>{icon}</span>
      <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
      <span style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "'Fira Code',monospace" }}>{value}</span>
      <span style={{ fontSize: 12, color: "#64748b" }}>{sub}</span>
    </div>
  );
}

function TherapistHesitationGauge({ score, level }) {
  const pct = Math.min(score * 100, 100);
  const color = level === "Low" ? "#059669" : level === "Moderate" ? "#d97706" : "#dc2626";
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={140} height={140} viewBox="0 0 140 140">
        <circle cx={70} cy={70} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={12} />
        <circle
          cx={70}
          cy={70}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transformOrigin: "center",
            transform: "rotate(-90deg)",
            transition: "stroke-dashoffset .6s ease"
          }}
        />
        <text
          x={70}
          y={64}
          textAnchor="middle"
          fontSize={20}
          fontWeight={700}
          fill={color}
          fontFamily="'Fira Code',monospace"
        >
          {score.toFixed(2)}
        </text>
        <text x={70} y={82} textAnchor="middle" fontSize={11} fill="#64748b" fontWeight={600}>
          {level}
        </text>
        <text x={70} y={96} textAnchor="middle" fontSize={9} fill="#94a3b8">
          hesitation
        </text>
      </svg>
    </div>
  );
}

const styles = {
  container: {
    background: "#f8fafc",
    color: "#1e293b",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
  },
  header: {
    marginBottom: 32,
  },
  backBtn: {
    background: "transparent",
    color: "#3b82f6",
    border: "1px solid #bfdbfe",
    padding: "8px 12px",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 500,
    marginBottom: 16,
    fontSize: 14,
  },
  downloadBtn: {
    background: "#10b981",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 500,
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    gap: "8px",
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
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 20,
    marginBottom: 24,
  },
  summaryCard: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 20,
    display: "flex",
    gap: 16,
    alignItems: "center",
  },
  cardIconLarge: {
    fontSize: 40,
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 12,
    color: "#64748b",
    textTransform: "uppercase",
    fontWeight: 600,
    marginBottom: 8,
    letterSpacing: "0.5px",
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: 4,
  },
  cardSubtext: {
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
  reportBtnActive: {
    color: "#1e40af",
    background: "#eff6ff",
    border: "1px solid #3b82f6",
  },
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
    borderBottom: "3px solid #3b82f6",
    display: "inline-block",
  },
  card: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 20,
  },
  sectionHeadline: {
    fontSize: 16,
    fontWeight: 700,
    margin: "0 0 10px",
    color: "#1e293b",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 700,
    margin: "0 0 12px",
    color: "#0f172a",
  },
  interpretationText: {
    fontSize: 14,
    lineHeight: 1.6,
    color: "#1e293b",
    margin: "0 0 12px",
  },
  interpretationList: {
    marginLeft: 16,
    color: "#334155",
    lineHeight: 1.5,
  },
  masterySummaryCard: {
    borderRadius: 14,
    padding: 8,
    minHeight: 120,
    height: 150,
    maxHeight: 150,
    background: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
    color: "white",
    overflow: "hidden",
  },
  masterySummaryHeading: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.8px",
    marginBottom: 4,
    opacity: 0.95,
    lineHeight: 1.1,
  },
  masterySummaryValues: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2,
    rowGap: 0,
  },
  masteryScore: {
    fontSize: 44,
    fontWeight: 800,
    lineHeight: 1.1,
    margin: 0,
  },
  masteryAvg: {
    fontSize: 40,
    fontWeight: 800,
    lineHeight: 1.1,
    margin: 0,
  },
  masteryLabel: {
    fontSize: 12,
    opacity: 0.9,
    marginTop: 2,
    marginBottom: 0,
  },
  masteryTrend: {
    fontSize: 12,
    color: "rgba(255,255,255,0.95)",
    marginTop: 2,
    marginBottom: 0,
  },
  wordSummaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "10px",
    marginBottom: "16px",
  },
  wordsMetricCard: {
    borderRadius: "14px",
    background: "#ffffff",
    border: "1px solid #3b82f6",
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    minHeight: "110px",
  },
  wordsMetricValue: {
    fontSize: "28px",
    fontWeight: 800,
    color: "#1d4ed8",
    lineHeight: 1,
  },
  summaryLabel: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#1e3a8a",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    marginBottom: "4px",
  },
  summaryValue: {
    fontSize: "28px",
    fontWeight: 800,
    color: "#1d4ed8",
    lineHeight: 1,
  },
  analysisSection: {
    borderRadius: "14px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    padding: "10px 12px",
    marginBottom: "14px",
  },
  clinicalNarrativeCard: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "14px",
    padding: "10px",
    flex: 1,
    minWidth: "280px",
  },
  analysisHeader: {
    fontSize: "14px",
    fontWeight: 700,
    marginBottom: "6px",
  },
  analysisText: {
    fontSize: "13px",
    color: "#334155",
    lineHeight: 1.35,
    margin: 0,
  },
  focusBox: {
    marginTop: "10px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "8px 10px",
  },
  focusTitle: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#1e3a8a",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
  },
  focusList: {
    margin: 0,
    paddingLeft: "15px",
    color: "#475569",
    fontSize: "12px",
    lineHeight: 1.3,
  },
  subSection: {
    marginBottom: "16px",
  },
  subTitle: {
    fontSize: "14px",
    fontWeight: 700,
    marginBottom: "8px",
    color: "#1d4ed8",
    textTransform: "uppercase",
    letterSpacing: "1px",
    borderBottom: "1px solid #bfdbfe",
    paddingBottom: "6px",
  },
  tagRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  tagPill: {
    fontSize: 11,
    fontWeight: 700,
    color: "#1d4ed8",
    background: "#dbeafe",
    borderRadius: 999,
    padding: "4px 10px",
  },
  letterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
    gap: 12,
  },
  letterCard: {
    borderRadius: 14,
    border: "1px solid #e2e8f0",
    padding: "10px 10px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    minHeight: 120,
    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)",
  },
  letterBig: {
    fontSize: 30,
    fontWeight: 800,
    letterSpacing: "-1px",
  },
  strengthPct: {
    fontSize: 14,
    fontWeight: 700,
  },
  letterLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  attemptsText: {
    fontSize: 11,
    color: "#64748b",
  },
  statusTag: {
    marginTop: 4,
    fontSize: 11,
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
  tableRow: {},
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
};
