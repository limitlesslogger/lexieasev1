import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";

export default function ManageStudentsPage({ role }) {
  const navigate = useNavigate();
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [linkCredentials, setLinkCredentials] = useState({
    email: "",
    password: "",
  });
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isTeacher = role === "teacher";
  const mentorLabel = isTeacher ? "Therapist" : "Guardian";
  const learnerLabel = isTeacher ? "Student" : "Child";
  const heading = isTeacher ? "Manage Students" : "Manage Children";
  const linkedLabel = isTeacher ? "Linked Students" : "Linked Children";
  const chooseLabel = isTeacher ? "Choose a student account to link" : "Choose a student account to link";
  const privateLinkLabel = isTeacher ? "Link With Student Credentials" : "Link With Student Credentials";
  const createLabel = isTeacher ? "Add New Student" : "Add New Child";

  const loadData = async () => {
    setError("");
    try {
      const [linked, available] = await Promise.all([
        apiFetch(isTeacher ? "/api/relationships/my-students" : "/api/relationships/my-children"),
        apiFetch("/api/relationships/available-students"),
      ]);
      setLinkedStudents(linked || []);
      setAvailableStudents(available || []);
      setSelectedStudentId((available || [])[0]?._id || "");
    } catch (err) {
      setError(err.message || "Failed to load student links");
    }
  };

  useEffect(() => {
    loadData();
  }, [role]);

  const handleLinkExisting = async () => {
    if (!selectedStudentId) {
      setError("Choose a student to link.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setCreatedCredentials(null);
      const res = await apiFetch("/api/relationships/link-student", {
        method: "POST",
        body: JSON.stringify({ studentId: selectedStudentId }),
      });
      setMessage(res.message || `${learnerLabel} linked.`);
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to link student");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (event) => {
    event.preventDefault();
    if (!newStudent.name || !newStudent.email || !newStudent.password) {
      setError("Enter name, email, and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const passwordUsed = newStudent.password;
      const res = await apiFetch("/api/relationships/create-student", {
        method: "POST",
        body: JSON.stringify(newStudent),
      });
      setMessage(res.message || `${learnerLabel} created.`);
      setCreatedCredentials({
        name: res.student?.name || newStudent.name,
        email: res.student?.email || newStudent.email,
        password: passwordUsed,
      });
      setNewStudent({ name: "", email: "", password: "" });
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to create student");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkWithCredentials = async (event) => {
    event.preventDefault();
    if (!linkCredentials.email || !linkCredentials.password) {
      setError("Enter the student's email and temporary password.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setCreatedCredentials(null);
      const res = await apiFetch("/api/relationships/link-student-with-credentials", {
        method: "POST",
        body: JSON.stringify(linkCredentials),
      });
      setMessage(res.message || `${learnerLabel} linked.`);
      setLinkCredentials({ email: "", password: "" });
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to link student");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkStudent = async (studentId) => {
    try {
      setLoading(true);
      setError("");
      setCreatedCredentials(null);
      const res = await apiFetch("/api/relationships/link-student", {
        method: "DELETE",
        body: JSON.stringify({ studentId }),
      });
      setMessage(res.message || `${learnerLabel} unlinked.`);
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to unlink student");
    } finally {
      setLoading(false);
    }
  };

  const canLinkExisting = useMemo(() => availableStudents.length > 0, [availableStudents]);

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div>
          <h1 style={styles.title}>{heading}</h1>
          <p style={styles.subtitle}>
            Link an existing student account or create a new student account so the learner can log in with an initial password and later change it from their own account.
          </p>
        </div>
        <div style={styles.heroActions}>
          <button
            type="button"
            style={styles.backBtn}
            onClick={() =>
              navigate(isTeacher ? "/teacher/change-password" : "/parent/change-password")
            }
          >
            Change My Password
          </button>
          <button type="button" style={styles.backBtn} onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
      </div>

      {message && <p style={styles.success}>{message}</p>}
      {error && <p style={styles.error}>{error}</p>}
      {createdCredentials && (
        <div style={styles.credentialsCard}>
          <strong style={styles.credentialsTitle}>{learnerLabel} Login Details</strong>
          <p style={styles.credentialsHelp}>
            Use these details for the student's next login. After signing in, the student can change this password from the student password page.
          </p>
          <div style={styles.credentialsRow}>
            <span style={styles.credentialsLabel}>Name</span>
            <code style={styles.credentialsValue}>{createdCredentials.name}</code>
          </div>
          <div style={styles.credentialsRow}>
            <span style={styles.credentialsLabel}>Email ID</span>
            <code style={styles.credentialsValue}>{createdCredentials.email}</code>
          </div>
          <div style={styles.credentialsRow}>
            <span style={styles.credentialsLabel}>Password</span>
            <code style={styles.credentialsValue}>{createdCredentials.password}</code>
          </div>
        </div>
      )}

      <div style={styles.grid}>
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>{privateLinkLabel}</h2>
          <p style={styles.helperText}>
            To protect privacy, existing student accounts are not listed globally. Link a learner by entering the student email and the temporary password shared with you. A learner may have a therapist, a guardian, both, or neither.
          </p>
          <form style={styles.form} onSubmit={handleLinkWithCredentials}>
            <input
              style={styles.input}
              placeholder="Student email"
              type="email"
              value={linkCredentials.email}
              onChange={(event) =>
                setLinkCredentials((prev) => ({ ...prev, email: event.target.value }))
              }
            />
            <input
              style={styles.input}
              placeholder="Temporary password"
              type="password"
              value={linkCredentials.password}
              onChange={(event) =>
                setLinkCredentials((prev) => ({ ...prev, password: event.target.value }))
              }
            />
            <button type="submit" style={styles.button} disabled={loading}>
              {`Link ${learnerLabel} Privately`}
            </button>
          </form>
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>{chooseLabel}</h2>
          <p style={styles.helperText}>
            This chooser still works for student accounts created directly under your own {mentorLabel.toLowerCase()} account.
          </p>
          {canLinkExisting ? (
            <>
              <select
                style={styles.input}
                value={selectedStudentId}
                onChange={(event) => setSelectedStudentId(event.target.value)}
              >
                {availableStudents.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.name} ({student.email})
                  </option>
                ))}
              </select>
              <button
                type="button"
                style={styles.button}
                onClick={handleLinkExisting}
                disabled={loading}
              >
                {`Link Selected ${learnerLabel}`}
              </button>
            </>
          ) : (
            <p style={styles.empty}>No unlinked students created under your account are available right now.</p>
          )}
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>{createLabel}</h2>
          <p style={styles.helperText}>
            Set the student email ID and an initial password here. The student can later change that password from their own student account. After creation, the learner can still be linked independently to a therapist, a guardian, both, or neither.
          </p>
          <form style={styles.form} onSubmit={handleCreateStudent}>
            <input
              style={styles.input}
              placeholder="Student name"
              value={newStudent.name}
              onChange={(event) =>
                setNewStudent((prev) => ({ ...prev, name: event.target.value }))
              }
            />
            <input
              style={styles.input}
              placeholder="Student email"
              type="email"
              value={newStudent.email}
              onChange={(event) =>
                setNewStudent((prev) => ({ ...prev, email: event.target.value }))
              }
            />
            <input
              style={styles.input}
              placeholder="Initial password"
              type="password"
              minLength={6}
              value={newStudent.password}
              onChange={(event) =>
                setNewStudent((prev) => ({ ...prev, password: event.target.value }))
              }
            />
            <button type="submit" style={styles.button} disabled={loading}>
              {`Create ${learnerLabel}`}
            </button>
          </form>
        </section>
      </div>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>{linkedLabel}</h2>
        {linkedStudents.length === 0 ? (
          <p style={styles.empty}>No linked students yet.</p>
        ) : (
          <div style={styles.list}>
            {linkedStudents.map((student) => (
              <div key={student._id} style={styles.listItem}>
                <div style={styles.studentInfo}>
                  <strong>{student.name}</strong>
                  <span style={styles.meta}>Email ID: {student.email}</span>
                </div>
                <div style={styles.linkedActions}>
                  <button
                    type="button"
                    style={styles.unlinkBtn}
                    disabled={loading}
                    onClick={() => handleUnlinkStudent(student._id)}
                  >
                    {`Unlink ${learnerLabel}`}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: 28,
    background: "#f8fafc",
    display: "grid",
    gap: 20,
  },
  hero: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
  },
  heroActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  title: {
    margin: 0,
    fontSize: 30,
    color: "#0f172a",
  },
  subtitle: {
    marginTop: 8,
    color: "#64748b",
    maxWidth: 680,
  },
  backBtn: {
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    borderRadius: 999,
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  logoutBtn: {
    border: "none",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: 999,
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 20,
  },
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 22,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
  },
  sectionTitle: {
    margin: 0,
    fontSize: 20,
    color: "#0f172a",
  },
  helperText: {
    marginTop: 10,
    color: "#64748b",
    fontSize: 14,
    lineHeight: 1.5,
  },
  form: {
    marginTop: 14,
    display: "grid",
    gap: 12,
  },
  input: {
    marginTop: 14,
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    background: "#fff",
  },
  button: {
    marginTop: 14,
    border: "none",
    borderRadius: 10,
    background: "#1d4ed8",
    color: "#fff",
    padding: "11px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  list: {
    marginTop: 14,
    display: "grid",
    gap: 10,
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },
  studentInfo: {
    display: "grid",
    gap: 4,
  },
  linkedActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  meta: {
    color: "#64748b",
    fontSize: 14,
  },
  empty: {
    marginTop: 14,
    color: "#64748b",
  },
  success: {
    color: "#166534",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    padding: "10px 12px",
    borderRadius: 10,
  },
  error: {
    color: "#991b1b",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    padding: "10px 12px",
    borderRadius: 10,
  },
  credentialsCard: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: 12,
    padding: 14,
    display: "grid",
    gap: 8,
  },
  credentialsTitle: {
    color: "#1e3a8a",
  },
  credentialsRow: {
    display: "grid",
    gridTemplateColumns: "92px 1fr",
    gap: 10,
    alignItems: "center",
  },
  credentialsHelp: {
    margin: 0,
    color: "#475569",
    fontSize: 13,
    lineHeight: 1.5,
  },
  credentialsLabel: {
    color: "#475569",
    fontSize: 13,
    fontWeight: 700,
  },
  credentialsValue: {
    background: "#fff",
    border: "1px solid #dbeafe",
    borderRadius: 8,
    padding: "6px 8px",
    color: "#0f172a",
    fontSize: 13,
    overflowWrap: "anywhere",
  },
  unlinkBtn: {
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#be123c",
    borderRadius: 10,
    padding: "8px 12px",
    fontWeight: 700,
    cursor: "pointer",
    alignSelf: "center",
  },
};
