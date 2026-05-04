import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";

export default function GuardianDashboard() {
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
      const data = await apiFetch("/api/relationships/my-children");
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setError("Failed to load student information");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStudentClick = (studentId) => {
    navigate(`/parent/student/${studentId}`);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingMessage}>Loading student...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Student</h1>
        <p style={styles.subtitle}>Use the tools below to manage linked learners and training documents.</p>
      </div>

      <div style={styles.actionRow}>
        <button style={styles.primaryAction} onClick={() => navigate("/parent/manage-children")}>
          Manage Children
        </button>
        <button style={styles.secondaryAction} onClick={() => navigate("/parent/training-docs")}>
          Training Documents
        </button>
        <button style={styles.secondaryAction} onClick={() => navigate("/parent/change-password")}>
          Change Password
        </button>
      </div>

      {error && (
        <div style={styles.errorMessage}>
          {error}
        </div>
      )}

      {students.length > 1 && (
        <div style={styles.searchBox}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      )}

      {filteredStudents.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>👨‍🎓</div>
          <h2 style={styles.emptyTitle}>
            {students.length === 0 ? "No student assigned" : "No results found"}
          </h2>
          <p style={styles.emptyText}>
            {students.length === 0
              ? "You don't have any student linked to your account yet. Ask the student to select you during sign-up or contact support."
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
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div style={styles.studentInfo}>
                  <h3 style={styles.studentName}>{student.name}</h3>
                  <p style={styles.studentEmail}>{student.email}</p>
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
                <span style={styles.assignedDate}>Linked learner</span>
                <span style={styles.viewArrow}>→</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* reuse the same styles from therapist dashboard */
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
  primaryAction: {
    background: "#059669",
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "10px 16px",
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryAction: {
    background: "white",
    color: "#047857",
    border: "1px solid #a7f3d0",
    borderRadius: 10,
    padding: "10px 16px",
    fontWeight: 600,
    cursor: "pointer",
  },
};
