import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";

export default function TherapistDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch("/api/relationships/my-students");
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setError("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    (student.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (student.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleStudentClick = (studentId) => {
    navigate(`/teacher/student/${studentId}`);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingMessage}>Loading students...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Students</h1>
        <p style={styles.subtitle}>Use the tools below to manage student access and training content.</p>
      </div>

      <div style={styles.actionRow}>
        <button style={styles.primaryAction} onClick={() => navigate("/teacher/manage-students")}>
          Manage Students
        </button>
        <button style={styles.secondaryAction} onClick={() => navigate("/teacher/training-docs")}>
          Training Documents
        </button>
        <button style={styles.secondaryAction} onClick={() => navigate("/teacher/change-password")}>
          Change Password
        </button>
      </div>

      {error && (
        <div style={styles.errorMessage}>
          {error}
        </div>
      )}

      <div style={styles.searchBox}>
        <input
          type="text"
          placeholder="Search students by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {filteredStudents.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>👨‍🎓</div>
          <h2 style={styles.emptyTitle}>
            {students.length === 0 ? "No students yet" : "No results found"}
          </h2>
          <p style={styles.emptyText}>
            {students.length === 0
              ? "You don't have any students assigned yet. New students will appear automatically if they select you during sign‑up or if you assign them manually via the API."
              : "Try adjusting your search terms"}
          </p>
        </div>
      ) : (
        <div style={styles.studentGrid}>
          {filteredStudents.map((student) => (
            <div
              key={student._id}
              style={styles.studentCard}
              onClick={() => handleStudentClick(student._id)}
            >
              <div style={styles.cardHeader}>
                <div style={styles.studentAvatar}>
                  {(student.name?.charAt(0) || '?').toUpperCase()}
                </div>
                <div style={styles.studentInfo}>
                  <h3 style={styles.studentName}>{student.name || 'Unknown Student'}</h3>
                  <p style={styles.studentEmail}>{student.email || 'No email'}</p>
                  {student.age != null && (
                    <p style={styles.studentMeta}>Age: {student.age}</p>
                  )}
                  {student.lastActive && (
                    <p style={styles.studentMeta}>
                      Last active: {new Date(student.lastActive).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div style={styles.cardFooter}>
                <span style={styles.assignedDate}>Linked student</span>
                <span style={styles.viewArrow}>→</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================
   Styles
========================== */
const styles = {
  container: {
    minHeight: "calc(100vh - 200px)",
    background: "#f8fafc",
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    color: "#1e293b",
    margin: 0,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    margin: 0,
  },
  searchBox: {
    marginBottom: 32,
  },
  actionRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 24,
  },
  searchInput: {
    width: "100%",
    maxWidth: 600,
    padding: "12px 16px",
    fontSize: 14,
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
    outlineColor: "#3b82f6",
  },
  errorMessage: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    fontSize: 14,
  },
  loadingMessage: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    padding: 40,
  },
  emptyState: {
    textAlign: "center",
    padding: 60,
    background: "white",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: "#1e293b",
    margin: "0 0 8px 0",
  },
  emptyText: {
    color: "#64748b",
    margin: 0,
    fontSize: 14,
  },
  studentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: 20,
  },
  primaryAction: {
    background: "#1d4ed8",
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "10px 16px",
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryAction: {
    background: "white",
    color: "#1e40af",
    border: "1px solid #bfdbfe",
    borderRadius: 10,
    padding: "10px 16px",
    fontWeight: 600,
    cursor: "pointer",
  },
  studentCard: {
    background: "white",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    cursor: "pointer",
    transition: "all 0.3s ease",
    border: "1px solid #e2e8f0",
    ":hover": {
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      transform: "translateY(-2px)",
    },
  },
  cardHeader: {
    display: "flex",
    gap: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "#dbeafe",
    color: "#1e40af",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 18,
    flexShrink: 0,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 600,
    color: "#1e293b",
    margin: 0,
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: 12,
    color: "#64748b",
    margin: 0,
  },
  studentMeta: {
    fontSize: 11,
    color: "#94a3b8",
    margin: "2px 0 0 0",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTop: "1px solid #f1f5f9",
  },
  assignedDate: {
    fontSize: 12,
    color: "#94a3b8",
  },
  viewArrow: {
    fontSize: 18,
    color: "#3b82f6",
    fontWeight: 600,
  },
};
