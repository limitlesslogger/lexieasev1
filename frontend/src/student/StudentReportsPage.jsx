import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { apiFetch, downloadMyStudentReport } from "../api/api";
import {
  SearchablePaginatedBlocks,
  SearchablePaginatedTable,
} from "../components/SearchablePaginatedList";

const TABS = ["summary", "letters", "words", "sentences"];

export default function StudentReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [summary, setSummary] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeframe, setTimeframe] = useState(30);

  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "null"),
    []
  );
  const selectedTab = TABS.includes(searchParams.get("tab"))
    ? searchParams.get("tab")
    : "summary";

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const summaryRes = await apiFetch(`/api/reports/student?timeframe=${timeframe}`);
        if (cancelled) return;
        setSummary(summaryRes.summary);

        if (selectedTab !== "summary") {
          const detailRes = await apiFetch(
            `/api/reports/student/${selectedTab}?timeframe=${timeframe}`
          );
          if (cancelled) return;
          setReportData(detailRes.data);
        } else {
          setReportData(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load reports");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedTab, timeframe]);

  const updateTab = (tab) => {
    setSearchParams({ tab });
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Progress Reports</h1>
          <p style={styles.subtitle}>
            Review your reading growth across letters, words, and sentences.
          </p>
        </div>
        <div style={styles.userCard}>
          <div style={styles.userLabel}>Student</div>
          <div style={styles.userName}>{user?.name || "Learner"}</div>
        </div>
      </div>

      <div style={styles.controls}>
        <div style={styles.tabRow}>
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => updateTab(tab)}
              style={{
                ...styles.tab,
                ...(selectedTab === tab ? styles.tabActive : {}),
              }}
            >
              {tab === "summary" ? "Summary" : `${capitalize(tab)} Report`}
            </button>
          ))}
        </div>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(Number(e.target.value))}
          style={styles.select}
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {loading ? <div style={styles.loading}>Loading reports...</div> : null}

      {!loading && selectedTab === "summary" && summary ? (
        <div style={styles.grid}>
          <MetricCard
            title="Letters Practised"
            value={summary.letters?.total ?? 0}
            detail={`Average strength ${summary.letters?.avgStrength ?? 0}%`}
            tone="#0f766e"
          />
          <MetricCard
            title="Word Attempts"
            value={summary.words?.total ?? 0}
            detail={`Success rate ${summary.words?.successRate ?? 0}%`}
            tone="#7c3aed"
          />
          <MetricCard
            title="Sentence Attempts"
            value={summary.sentences?.total ?? 0}
            detail={`Success rate ${summary.sentences?.successRate ?? 0}%`}
            tone="#2563eb"
          />
        </div>
      ) : null}

      
      {!loading && selectedTab === "letters" && reportData ? (
  <div style={styles.section}>
    <div style={styles.downloadRow}>
      <button
        onClick={() => downloadMyStudentReport("letters", timeframe)}
        style={styles.downloadBtn}
      >
        Download Report
      </button>
    </div>

          <SearchablePaginatedBlocks
            items={reportData.letters || []}
            getSearchText={(item) => `${item.letter} ${item.strength} ${item.attempts}`}
            searchPlaceholder="Search letters..."
            emptyMessage="No letters found for this timeframe."
            initialPageSize={10}
            gridStyle={styles.grid}
            renderItem={(item) => (
              <MetricCard
                key={item.letter}
                title={item.letter.toUpperCase()}
                value={`${item.strength}%`}
                detail={`${item.attempts} attempts`}
                tone={item.strength >= 40 ? "#059669" : item.strength >= 0 ? "#d97706" : "#dc2626"}
              />
            )}
          />
        </div>
      ) : null}

      {!loading && selectedTab === "words" && reportData ? (
  <div style={styles.section}>
    <div style={styles.downloadRow}>
      <button
        onClick={() => downloadMyStudentReport("words", timeframe)}
        style={styles.downloadBtn}
      >
        Download Report
      </button>
    </div>
  
          <div style={styles.grid}>
            <MetricCard
              title="Combined Accuracy"
              value={`${reportData.combined?.successRate ?? 0}%`}
              detail={`${reportData.combined?.totalAttempts ?? 0} total attempts`}
              tone="#7c3aed"
            />
            <MetricCard
              title="Word Accuracy"
              value={`${reportData.words?.overview?.successRate ?? 0}%`}
              detail={`${reportData.words?.overview?.totalAttempts ?? 0} attempts`}
              tone="#2563eb"
            />
          </div>
          <SearchablePaginatedTable
            headers={["Word", "Attempts", "Correct", "Accuracy", "Avg Response"]}
            items={reportData.words?.allWords || []}
            getSearchText={(item) => `${item.word} ${item.totalAttempts} ${item.correctCount} ${item.successRate}`}
            searchPlaceholder="Search words..."
            emptyMessage="No word rows match this search."
            renderRow={(item, index) => (
              <tr key={`${item.word}-${index}`}>
                <td style={styles.td}>{item.word}</td>
                <td style={styles.td}>{item.totalAttempts}</td>
                <td style={styles.td}>{item.correctCount}</td>
                <td style={styles.td}>{item.successRate}%</td>
                <td style={styles.td}>{(item.avgResponseTime / 1000).toFixed(1)}s</td>
              </tr>
            )}
          />
        </div>
      ) : null}

      {!loading && selectedTab === "sentences" && reportData ? (
  <div style={styles.section}>
    <div style={styles.downloadRow}>
      <button
        onClick={() => downloadMyStudentReport("sentences", timeframe)}
        style={styles.downloadBtn}
      >
        Download Report
      </button>
    </div>
 
          <div style={styles.grid}>
            <MetricCard
              title="Sentence Accuracy"
              value={`${reportData.successRate ?? 0}%`}
              detail={`${reportData.attempts?.length || 0} sentence targets`}
              tone="#2563eb"
            />
            <MetricCard
              title="Eye Tracking"
              value={reportData.eyeTracking?.hesitationLevel || "Low"}
              detail={`Avg score ${reportData.eyeTracking?.avgVisualScore ?? 0}`}
              tone="#d97706"
            />
          </div>
          <SearchablePaginatedTable
            headers={["Sentence", "Status", "Accuracy", "Response", "Eye Score"]}
            items={reportData.attempts || []}
            getSearchText={(item) =>
              `${item.sentence} ${item.correct ? "correct" : "needs focus"} ${item.accuracy} ${item.eyeScore}`
            }
            searchPlaceholder="Search sentences..."
            emptyMessage="No sentence rows match this search."
            renderRow={(item, index) => (
              <tr key={`${item.sentence}-${index}`}>
                <td style={styles.td}>{item.sentence}</td>
                <td style={styles.td}>{item.correct ? "Correct" : "Needs focus"}</td>
                <td style={styles.td}>{item.accuracy}%</td>
                <td style={styles.td}>
  {item.spokenText && item.spokenText.trim() !== ""
    ? item.spokenText
    : "No response"}
</td>
                <td style={styles.td}>{item.eyeScore}</td>
              </tr>
            )}
          />
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({ title, value, detail, tone }) {
  return (
    <div style={{ ...styles.card, borderTop: `4px solid ${tone}` }}>
      <div style={styles.cardTitle}>{title}</div>
      <div style={{ ...styles.cardValue, color: tone }}>{value}</div>
      <div style={styles.cardDetail}>{detail}</div>
    </div>
  );
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = {
  page: {
    padding: 32,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: 34,
    color: "#0f172a",
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#64748b",
  },
  userCard: {
    background: "white",
    border: "1px solid #dbeafe",
    borderRadius: 16,
    padding: "14px 18px",
  },
  userLabel: {
    color: "#64748b",
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: 700,
  },
  userName: {
    color: "#1e40af",
    fontWeight: 700,
    marginTop: 4,
  },
  controls: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
  },
  tabRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  tab: {
    border: "1px solid #cbd5e1",
    background: "white",
    borderRadius: 999,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 600,
    color: "#334155",
  },
  tabActive: {
    background: "#0f172a",
    color: "white",
    borderColor: "#0f172a",
  },
  select: {
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    padding: "10px 12px",
  },
  error: {
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: 12,
    padding: 14,
  },
  loading: {
    color: "#64748b",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  },
  card: {
    background: "white",
    borderRadius: 18,
    padding: 20,
    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.05)",
  },
  cardTitle: {
    color: "#475569",
    fontWeight: 600,
    fontSize: 14,
  },
  cardValue: {
    marginTop: 10,
    fontWeight: 800,
    fontSize: 28,
  },
  cardDetail: {
    marginTop: 6,
    color: "#64748b",
    fontSize: 13,
  },
  tableWrap: {
    background: "white",
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.05)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: 14,
    background: "#f8fafc",
    color: "#334155",
    fontSize: 13,
  },
  td: {
    padding: 14,
    borderTop: "1px solid #e2e8f0",
    fontSize: 14,
    color: "#0f172a",
  },
  downloadRow: {
  display: "flex",
  justifyContent: "flex-end",
  marginBottom: 12,
},

downloadBtn: {
  background: "#16a34a",
  color: "white",
  border: "none",
  padding: "10px 16px",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 14,
}
};
