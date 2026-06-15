import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import ReadingSupportPanel from "./ReadingSupportPanel";
import FloatingBrushTool from "./FloatingBrushTool";
import { getReadingStyle, useReadingPreferences } from "./useReadingPreferences";

const levels = [
  { label: "Letter", path: "/student/letter-level" },
  { label: "Word", path: "/student/word-level" },
  { label: "Sentence", path: "/student/sentence-level" },
];

const utilityLevels = [
  { label: "Reports", path: "/student/reports" },
  { label: "Docs", path: "/student/training-docs" },
];

export default function StudentLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showSupport, setShowSupport] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isBrushDown, setIsBrushDown] = useState(false);
  const [brushPointer, setBrushPointer] = useState({ x: 0, y: 0 });
  const [clearHighlightsVersion, setClearHighlightsVersion] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const {
    preferences,
    draftPreferences,
    setDraftPreference,
    setLivePreference,
    applyPreferences,
    resetPreferences,
  } = useReadingPreferences();
  const readingStyle = getReadingStyle(preferences);

  useEffect(() => {
    const stopInteractions = () => {
      setIsBrushDown(false);
    };

    window.addEventListener("pointerup", stopInteractions);
    return () => window.removeEventListener("pointerup", stopInteractions);
  }, []);

  useEffect(() => {
    const movePointer = (event) => {
      setBrushPointer({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("pointermove", movePointer);
    return () => window.removeEventListener("pointermove", movePointer);
  }, []);

  useEffect(() => {
    const closeMenu = () => setShowMenu(false);

    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const showToggle = location.pathname !== "/student/dashboard";
  const brushVisible = Boolean(readingStyle.paintbrushEnabled);

  return (
    <div
      style={{
        ...styles.container,
        background: readingStyle.colors.page,
        color: readingStyle.colors.ink,
        fontFamily: readingStyle.fontFamily,
      }}
    >
      {/* Top Header */}
      <header
        style={{
          ...styles.header,
          background: readingStyle.colors.card,
          borderBottom: `1px solid ${readingStyle.colors.border}`,
        }}
      >
        <div style={styles.headerTopRow}>
          <div style={styles.left}>
            <div
              style={styles.logo}
              onClick={() => navigate("/student/dashboard")}
            >
              LexCura
            </div>

            <button
              onClick={() => navigate("/student/dashboard")}
              style={styles.dashboardBtn}
            >
              Dashboard
            </button>
          </div>

          <div style={styles.rightActions}>
            <button
              type="button"
              onClick={() => setShowSupport((prev) => !prev)}
              style={styles.supportBtn}
            >
              Reading Tools
            </button>
            <div style={styles.menuWrap} onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                onClick={() => setShowMenu((prev) => !prev)}
                style={styles.menuButton}
                aria-label="Open account menu"
              >
                <span style={styles.menuBar} />
                <span style={styles.menuBar} />
                <span style={styles.menuBar} />
              </button>
              {showMenu && (
                <div style={styles.menuPanel}>
                  <button
                    type="button"
                    style={styles.menuItem}
                    onClick={() => {
                      setShowMenu(false);
                      navigate("/student/change-password");
                    }}
                  >
                    Change Password
                  </button>
                  <button
                    type="button"
                    style={{ ...styles.menuItem, ...styles.menuItemDanger }}
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {showToggle && (
          <div style={styles.navWrap}>
            <div style={styles.navGroup}>
              <div style={styles.navLabel}>Practice</div>
              <div style={styles.toggleBar}>
                {levels.map((level) => {
                  const active = location.pathname === level.path;
                  return (
                    <button
                      key={level.path}
                      onClick={() => navigate(level.path)}
                      style={{
                        ...styles.toggleBtn,
                        ...(active ? styles.active : {}),
                      }}
                    >
                      {level.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={styles.navDivider} />

            <div style={styles.navGroupRight}>
              <div style={styles.navLabel}>Progress & Materials</div>
              <div style={styles.toggleBar}>
                {utilityLevels.map((level) => {
                  const active = location.pathname === level.path;
                  return (
                    <button
                      key={level.path}
                      onClick={() => navigate(level.path)}
                      style={{
                        ...styles.toggleBtn,
                        ...(active ? styles.active : {}),
                      }}
                    >
                      {level.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Page Content */}
      <main style={styles.content}>
        {showSupport && (
          <div style={styles.panelWrap}>
            <ReadingSupportPanel
              isCollapsed={isPanelCollapsed}
              onToggleCollapse={() =>
                setIsPanelCollapsed((prev) => !prev)
              }
              draftPreferences={draftPreferences}
              setDraftPreference={setDraftPreference}
              applyPreferences={applyPreferences}
              resetPreferences={resetPreferences}
            />
          </div>
        )}
        <Outlet
          context={{
            preferences,
            draftPreferences,
            readingStyle,
            setLivePreference,
            isBrushDown,
            setIsBrushDown,
            brushState: {
              color: readingStyle.brushColor,
              opacity: readingStyle.brushOpacity,
              size: readingStyle.brushSize,
              mode: readingStyle.brushMode,
            },
            clearHighlightsVersion,
          }}
        />
      </main>
      {brushVisible && (
        <FloatingBrushTool
          visible={brushVisible}
          brushState={{
            color: readingStyle.brushColor,
            opacity: readingStyle.brushOpacity,
            size: readingStyle.brushSize,
            mode: readingStyle.brushMode,
          }}
          onUpdate={setLivePreference}
          onClear={() => setClearHighlightsVersion((prev) => prev + 1)}
          onClose={() => setLivePreference("paintbrushEnabled", false)}
        />
      )}
      {brushVisible && isBrushDown && (
        <div
          style={{
            ...styles.brushCursor,
            width: readingStyle.brushSize,
            height: readingStyle.brushSize,
            left: brushPointer.x,
            top: brushPointer.y,
            borderColor: readingStyle.brushColor,
            background: `${readingStyle.brushColor}${Math.round(
              readingStyle.brushOpacity * 255
            )
              .toString(16)
              .padStart(2, "0")}`,
            transform: "translate(-50%, -50%) scale(1.08)",
          }}
        >
          <span style={styles.cursorCore} />
        </div>
      )}
    </div>
  );
}

/* =========================
   Styles (THIS WAS MISSING)
========================== */
const styles = {
  container: {
    minHeight: "100vh",
    background: "#f8fafc",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
  },
  header: {
    display: "grid",
    gap: 14,
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
  headerTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  navWrap: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
    padding: 12,
    borderRadius: 18,
    background: "rgba(37, 99, 235, 0.05)",
    border: "1px solid rgba(37, 99, 235, 0.12)",
  },
  navLabel: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#475569",
    minWidth: 62,
  },
  navGroup: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
    flex: "1 1 auto",
  },
  navGroupRight: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
    marginLeft: "auto",
  },
  navDivider: {
    width: 1,
    alignSelf: "stretch",
    background: "rgba(100, 116, 139, 0.18)",
  },
  toggleBar: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  rightActions: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  menuWrap: {
    position: "relative",
  },
  dashboardBtn: {
    background: "transparent",
    border: "1px solid #c7d2fe",
    color: "#1e40af",
    padding: "8px 14px",
    borderRadius: 999,
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 13,
  },
  supportBtn: {
    background: "#e8f0ff",
    color: "#173a73",
    border: "1px solid #bfd1ff",
    padding: "9px 14px",
    borderRadius: 999,
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 13,
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    background: "white",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    cursor: "pointer",
  },
  menuBar: {
    width: 18,
    height: 2,
    borderRadius: 999,
    background: "#0f172a",
  },
  menuPanel: {
    position: "absolute",
    right: 0,
    top: 50,
    minWidth: 180,
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    boxShadow: "0 16px 32px rgba(15, 23, 42, 0.14)",
    padding: 8,
    display: "grid",
    gap: 4,
    zIndex: 150,
  },
  menuItem: {
    border: "none",
    background: "transparent",
    borderRadius: 10,
    padding: "10px 12px",
    textAlign: "left",
    fontWeight: 600,
    color: "#0f172a",
    cursor: "pointer",
  },
  menuItemDanger: {
    color: "#b91c1c",
    background: "#fef2f2",
  },

  toggleBtn: {
    padding: "9px 15px",
    borderRadius: 999,
    border: "1px solid #c7d2fe",
    background: "white",
    color: "#1e40af",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
  },
  active: {
    background: "#1e40af",
    color: "white",
  },
  content: {
    padding: 32,
    maxWidth: 1200,
    margin: "0 auto",
  },
  panelWrap: {
    marginBottom: 20,
  },
  brushCursor: {
    position: "fixed",
    zIndex: 1190,
    pointerEvents: "none",
    borderRadius: "50%",
    border: "2px solid rgba(15,23,42,0.18)",
    boxShadow: "0 8px 20px rgba(15,23,42,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.08s linear",
  },
  cursorCore: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "rgba(15,23,42,0.72)",
  },
};
