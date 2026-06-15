import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const timeframe = 30;

  useEffect(() => {
    let cancelled = false;

    const loadSummary = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await apiFetch(`/api/reports/student?timeframe=${timeframe}`);
        if (!cancelled) {
          setSummary(data.summary || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load dashboard progress");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSummary();
    return () => {
      cancelled = true;
    };
  }, []);

  const progressCards = useMemo(
    () => [
      {
        title: "Letter Level",
        primaryLabel: "Practised",
        primaryValue: summary?.letters?.total ?? 0,
        secondaryLabel: "Avg Strength",
        secondaryValue: `${summary?.letters?.avgStrength ?? 0}%`,
        accent: "#2563eb",
        actionLabel: "Open Letter Practice",
        onClick: () => navigate("/student/letter-level"),
      },
      {
        title: "Word Level",
        primaryLabel: "Attempts",
        primaryValue: summary?.words?.total ?? 0,
        secondaryLabel: "Accuracy",
        secondaryValue: `${summary?.words?.successRate ?? 0}%`,
        accent: "#7c3aed",
        actionLabel: "Open Word Practice",
        onClick: () => navigate("/student/word-level"),
      },
      {
        title: "Sentence Level",
        primaryLabel: "Attempts",
        primaryValue: summary?.sentences?.total ?? 0,
        secondaryLabel: "Accuracy",
        secondaryValue: `${summary?.sentences?.successRate ?? 0}%`,
        accent: "#0891b2",
        actionLabel: "Open Sentence Practice",
        onClick: () => navigate("/student/sentence-level"),
      },
    ],
    [navigate, summary]
  );

  const totalActivity =
    (summary?.letters?.total ?? 0) +
    (summary?.words?.total ?? 0) +
    (summary?.sentences?.total ?? 0);

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div>
          <h1 style={styles.title}>Welcome back</h1>
          <p style={styles.subtitle}>
            Choose what you want to work on today, then jump straight into practice or review.
          </p>
        </div>
        <div style={styles.streakCard}>
          <span style={styles.streakLabel}>Last 30 days</span>
          <strong style={styles.streakValue}>{totalActivity} activities</strong>
        </div>
      </div>

      {error ? <div style={styles.error}>{error}</div> : null}

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Reading Practice</h2>
          <p style={styles.sectionText}>Move through the learning levels in the order that feels right for today.</p>
        </div>
        <div style={styles.grid}>
          {progressCards.map((card) => (
            <ProgressCard
              key={card.title}
              title={card.title}
              primaryLabel={card.primaryLabel}
              primaryValue={loading ? "..." : card.primaryValue}
              secondaryLabel={card.secondaryLabel}
              secondaryValue={loading ? "..." : card.secondaryValue}
              accent={card.accent}
              actionLabel={card.actionLabel}
              onClick={card.onClick}
            />
          ))}
        </div>
      </div>

      <div style={styles.toolsGrid}>
        <ActionPanel
          eyebrow="Reports"
          title="See your progress"
          description="Review your letters, words, and sentence performance in one place."
          primaryLabel="Open Reports"
          secondaryLabel="Open Docs"
          onPrimary={() => navigate("/student/reports")}
          onSecondary={() => navigate("/student/training-docs")}
          tone="blue"
        />

        <ActionPanel
          eyebrow="Reading Tools"
          title="Adjust how reading feels"
          description="Open reading tools from the header whenever you want to change support settings."
          primaryLabel="Continue Practice"
          secondaryLabel="Change Password"
          onPrimary={() => navigate("/student/letter-level")}
          onSecondary={() => navigate("/student/change-password")}
          tone="slate"
        />
      </div>

      <div style={styles.summary}>
        <div style={styles.summaryCopy}>
          <span style={styles.statLabel}>Quick start</span>
          <h2 style={styles.statValue}>Pick a level and keep momentum going.</h2>
          <p style={styles.summaryText}>
            Your reports and documents are now grouped above so this area stays focused on getting you back into practice.
          </p>
        </div>

        <div style={styles.summaryActions}>
          <button
            style={styles.cta}
            onClick={() => navigate("/student/letter-level")}
          >
            Continue Practice
          </button>
          <button
            style={styles.ghostCta}
            onClick={() => navigate("/student/reports")}
          >
            View Reports
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Components
========================== */
function ProgressCard({
  title,
  primaryLabel,
  primaryValue,
  secondaryLabel,
  secondaryValue,
  accent,
  actionLabel,
  onClick,
}) {
  return (
    <div style={{ ...styles.card, borderTop: `4px solid ${accent}` }} onClick={onClick}>
      <h3 style={styles.cardTitle}>{title}</h3>

      <div style={styles.cardStats}>
        <div>
          <span style={styles.smallLabel}>{primaryLabel}</span>
          <p style={styles.value}>{primaryValue}</p>
        </div>

        <div>
          <span style={styles.smallLabel}>{secondaryLabel}</span>
          <p style={styles.value}>{secondaryValue}</p>
        </div>
      </div>

      <span style={{ ...styles.cardAction, color: accent }}>{actionLabel} →</span>
    </div>
  );
}

function ActionPanel({
  eyebrow,
  title,
  description,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  tone,
}) {
  const palette = tone === "blue"
    ? {
        bg: "linear-gradient(135deg,#dbeafe,#eff6ff)",
        border: "#bfdbfe",
        title: "#1d4ed8",
      }
    : {
        bg: "linear-gradient(135deg,#e2e8f0,#f8fafc)",
        border: "#cbd5e1",
        title: "#0f172a",
      };

  return (
    <div style={{ ...styles.actionPanel, background: palette.bg, borderColor: palette.border }}>
      <span style={styles.panelEyebrow}>{eyebrow}</span>
      <h3 style={{ ...styles.panelTitle, color: palette.title }}>{title}</h3>
      <p style={styles.panelDescription}>{description}</p>
      <div style={styles.panelActions}>
        <button style={styles.panelPrimaryBtn} onClick={onPrimary}>
          {primaryLabel}
        </button>
        <button style={styles.panelSecondaryBtn} onClick={onSecondary}>
          {secondaryLabel}
        </button>
      </div>
    </div>
  );
}

/* =========================
   Styles
========================== */
const styles = {
  page: {
    padding: "40px",
  },
  hero: {
    marginBottom: 36,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
    flexWrap: "wrap",
  },
  title: {
    fontSize: 34,
    fontWeight: 800,
    color: "#0f172a",
    margin: 0,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 8,
  },
  error: {
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: 14,
    padding: "12px 16px",
    marginBottom: 20,
  },
  streakCard: {
    minWidth: 180,
    background: "white",
    border: "1px solid #dbeafe",
    borderRadius: 18,
    padding: "18px 20px",
    boxShadow: "0 12px 30px rgba(30, 64, 175, 0.08)",
  },
  streakLabel: {
    display: "block",
    fontSize: 13,
    color: "#64748b",
    marginBottom: 8,
  },
  streakValue: {
    fontSize: 28,
    color: "#1e40af",
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: 22,
  },
  sectionText: {
    margin: "6px 0 0",
    color: "#64748b",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 24,
  },
  card: {
    background: "white",
    borderRadius: 20,
    padding: 28,
    boxShadow: "0 15px 30px rgba(0,0,0,0.08)",
    cursor: "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 20,
    marginTop: 0,
  },
  cardStats: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  smallLabel: {
    fontSize: 13,
    color: "#64748b",
  },
  value: {
    fontSize: 22,
    fontWeight: 700,
    color: "#1e40af",
  },
  cardAction: {
    fontSize: 14,
    fontWeight: 600,
  },
  toolsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20,
    marginBottom: 32,
  },
  actionPanel: {
    borderRadius: 22,
    padding: 24,
    border: "1px solid",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  panelEyebrow: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#64748b",
  },
  panelTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 800,
  },
  panelDescription: {
    margin: 0,
    color: "#475569",
    lineHeight: 1.6,
  },
  panelActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 6,
  },
  panelPrimaryBtn: {
    background: "#0f172a",
    color: "white",
    border: "none",
    borderRadius: 12,
    padding: "12px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  panelSecondaryBtn: {
    background: "white",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    padding: "12px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  summary: {
    background: "linear-gradient(135deg,#1e40af,#3b82f6)",
    color: "white",
    borderRadius: 24,
    padding: 32,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    flexWrap: "wrap",
  },
  summaryCopy: {
    maxWidth: 560,
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.9,
  },
  statValue: {
    fontSize: 26,
    fontWeight: 800,
    marginTop: 6,
    marginBottom: 8,
  },
  summaryText: {
    margin: 0,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 1.6,
  },
  cta: {
    background: "white",
    color: "#1e40af",
    border: "none",
    padding: "14px 24px",
    borderRadius: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryCta: {
    background: "white",
    color: "#1e40af",
    border: "none",
    padding: "14px 24px",
    borderRadius: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  ghostCta: {
    background: "transparent",
    color: "white",
    border: "1px solid rgba(255,255,255,0.75)",
    padding: "14px 24px",
    borderRadius: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  summaryActions: {
    display: "flex",
    gap: 12,
  },
};
