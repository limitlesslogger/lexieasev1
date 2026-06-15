import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function TherapistLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "null");
    setUser(userData);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <header style={styles.header}>
        <div style={styles.left}>
          <div
            style={styles.logo}
            onClick={() => navigate("/teacher/dashboard")}
          >
            LexCura
          </div>

          <button
            onClick={() => navigate("/teacher/dashboard")}
            style={styles.dashboardBtn}
          >
            Dashboard
          </button>
        </div>

        <div style={styles.userInfo}>
          <div style={styles.roleBadge}>
            <div style={styles.avatar}>
              {user?.name ? user.name.charAt(0).toUpperCase() : "T"}
            </div>
            <div style={styles.roleText}>
              <div style={styles.roleLabel}>THERAPIST</div>
              <div style={styles.userName}>{user?.name || "Therapist"}</div>
            </div>
          </div>
        </div>

        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </header>

      {/* Page Content */}
      <main style={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}

/* =========================
   Styles
========================== */
const styles = {
  container: {
    minHeight: "100vh",
    background: "#f8fafc",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 28px",
    background: "white",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logo: {
    fontSize: 22,
    fontWeight: 800,
    color: "#1e40af",
    cursor: "pointer",
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  dashboardBtn: {
    background: "transparent",
    border: "1px solid #c7d2fe",
    color: "#1e40af",
    padding: "6px 14px",
    borderRadius: 999,
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 13,
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  roleBadge: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#3b82f6",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 14,
  },
  roleText: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  roleLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.5px",
  },
  userName: {
    color: "#1e293b",
    fontWeight: 600,
    fontSize: 14,
  },
  logoutBtn: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "none",
    padding: "8px 16px",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
  },
  content: {
    padding: 32,
    maxWidth: 1200,
    margin: "0 auto",
  },
};
