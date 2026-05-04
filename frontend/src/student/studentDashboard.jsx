import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [timeframe, setTimeframe] = useState(7);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [user, data] = await Promise.all([
          apiFetch("/api/auth/me"),
          apiFetch(`/api/reports/student?timeframe=${timeframe}`),
        ]);
        setUserInfo(user);
        setSummary(data.summary);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [timeframe]);

  if (loading) return (
    <div style={s.loadingContainer}>
      <div style={s.spinner} />
      <p style={s.loadingText}>Loading your progress...</p>
    </div>
  );

  const cards = [
    {
      key: "letters",
      icon: "🔤",
      title: "Letter Practice",
      desc: "Track how well you pronounce individual letters and sounds",
      color: "#f59e0b",
      grad: "linear-gradient(135deg, #fef3c7, #ffffff)",
      border: "#fcd34d",
      route: "/student/report/letters",
     
    },
    {
      key: "words",
      icon: "🔡",
      title: "Word Practice",
      desc: "Review your two-letter word accuracy and problem words",
      color: "#8b5cf6",
      grad: "linear-gradient(135deg, #ede9fe, #f3f2f7)",
      border: "#c4b5fd",
      route: "/student/report/words",
     
    },
    {
      key: "sentences",
      icon: "📝",
      title: "Sentence Practice",
      desc: "Full sentence accuracy, problem phonemes and daily progress",
      color: "#3b82f6",
      grad: "linear-gradient(135deg, #dbeafe, #ebeff4)",
      border: "#93c5fd",
      route: "/student/report/sentences",
      
    },
  ];

  return (
    <div style={s.page}>
     

      {/* HERO */}
      <div style={s.hero}>
        <h1 style={s.heroTitle}>Welcome back, {userInfo?.name || "Student"}! 👋</h1>
        <p style={s.heroSub}>Select a practice area to view your detailed report</p>
        
      </div>

      {/* REPORT CARDS */}
      <div style={s.grid}>
        {cards.map(card => (
          <div
            key={card.key}
            style={{ ...s.card, background: card.grad, border: `2px solid ${card.border}`, opacity: card.hasData ? 1 : 0.65 }}
            onClick={() => navigate(card.route)}
          >
            <div style={{ ...s.cardIcon, color: card.color }}>{card.icon}</div>
            <h2 style={{ ...s.cardTitle, color: card.color }}>{card.title}</h2>
            <p style={s.cardDesc}>{card.desc}</p>
            <div style={{ ...s.cardStat, color: card.color }}>{card.stat}</div>
            
          </div>
        ))}
      </div>

      {/* QUICK TIP */}
      <div style={s.tip}>
        <span style={s.tipIcon}>💡</span>
        <p style={s.tipText}>Tip: Practice all three levels regularly for the best results. Start with letters, then words, then sentences!</p>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" },
  nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: 60, background: "white", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 100 },
  logo: { fontSize: 22, fontWeight: 800, color: "#1e40af", cursor: "pointer", letterSpacing: "-0.5px" },
  navLink: { fontSize: 14, fontWeight: 600, color: "#3b82f6", cursor: "pointer", padding: "6px 14px", borderRadius: 8, background: "#eff6ff" },
  loadingContainer: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 16 },
  spinner: { width: 48, height: 48, border: "4px solid #e2e8f0", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite" },
  loadingText: { fontSize: 16, color: "#64748b" },
  hero: { padding: "48px 32px 32px", textAlign: "center" },
  heroTitle: { fontSize: 36, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" },
  heroSub: { fontSize: 18, color: "#64748b", margin: "0 0 24px" },
  filterContainer: { display: "inline-flex", gap: 8, background: "white", padding: 4, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  filterBtn: { padding: "8px 20px", border: "none", background: "transparent", color: "#64748b", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500 },
  filterBtnActive: { padding: "8px 20px", border: "none", background: "#3b82f6", color: "white", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, padding: "0 32px", maxWidth: 1100, margin: "0 auto" },
  card: { borderRadius: 20, padding: 32, cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", display: "flex", flexDirection: "column", gap: 12 },
  cardIcon: { fontSize: 48 },
  cardTitle: { fontSize: 24, fontWeight: 800, margin: 0 },
  cardDesc: { fontSize: 15, color: "#475569", margin: 0, lineHeight: 1.6 },
  cardStat: { fontSize: 13, fontWeight: 600, margin: 0 },
  cardArrow: { alignSelf: "flex-start", marginTop: 8, color: "white", padding: "8px 18px", borderRadius: 8, fontSize: 14, fontWeight: 600 },
  tip: { display: "flex", alignItems: "center", gap: 16, background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 28px", margin: "32px auto", maxWidth: 700 },
  tipIcon: { fontSize: 28, flexShrink: 0 },
  tipText: { fontSize: 15, color: "#475569", margin: 0, lineHeight: 1.6 },
};

// inject CSS
const ss = document.createElement("style");
ss.textContent = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); @keyframes spin { to { transform: rotate(360deg); } } [style*='cursor: pointer']:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.12) !important; }`;
document.head.appendChild(ss);