import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";

export default function ChangePassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError("Fill in all password fields.");
      return;
    }

    if (form.newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    try {
      setSaving(true);
      const res = await apiFetch("/api/auth/change-password", {
        method: "PATCH",
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      setMessage(res.message || "Password updated successfully.");
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(err.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.page}>
      <section style={styles.card}>
        <h1 style={styles.title}>Change Password</h1>
        <p style={styles.copy}>
          Change the password that was initially set for your account. Use your current
          password once, then set the new one you want to keep.
        </p>

        <form style={styles.form} onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Current password"
            value={form.currentPassword}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, currentPassword: event.target.value }))
            }
            style={styles.input}
          />
          <input
            type="password"
            placeholder="New password"
            value={form.newPassword}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, newPassword: event.target.value }))
            }
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={form.confirmPassword}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
            }
            style={styles.input}
          />

          <button type="submit" style={styles.button} disabled={saving}>
            {saving ? "Updating..." : "Update Password"}
          </button>
        </form>

        {message && <p style={styles.success}>{message}</p>}
        {error && <p style={styles.error}>{error}</p>}
      </section>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: 28,
    background: "#f8fafc",
  },
  card: {
    maxWidth: 640,
    margin: "0 auto",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 24,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
  },
  title: {
    margin: 0,
    fontSize: 30,
    color: "#0f172a",
  },
  copy: {
    marginTop: 10,
    color: "#64748b",
    lineHeight: 1.6,
  },
  form: {
    marginTop: 18,
    display: "grid",
    gap: 12,
  },
  input: {
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "12px 14px",
    fontSize: 14,
    background: "#fff",
  },
  button: {
    border: "none",
    borderRadius: 10,
    background: "#1d4ed8",
    color: "#fff",
    padding: "12px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  success: {
    marginTop: 14,
    color: "#166534",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 10,
    padding: "10px 12px",
  },
  error: {
    marginTop: 14,
    color: "#991b1b",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 10,
    padding: "10px 12px",
  },
};
