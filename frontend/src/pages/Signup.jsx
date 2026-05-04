import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify(data));

      // Navigate based on role
      switch (data.role) {
        case "student":
          navigate("/student/dashboard");
          break;
        case "teacher":
          navigate("/teacher/dashboard");
          break;
        case "parent":
          navigate("/parent/dashboard");
          break;
        case "admin":
          navigate("/admin/dashboard");
          break;
        default:
          navigate("/");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={auth.container}>
      <form style={auth.card} onSubmit={handleSubmit}>
                     

        <h2 style={auth.heading}>Create your LexCura account</h2>

        {error && <div style={auth.error}>{error}</div>}

        <input
          type="text"
          name="name"
          placeholder="Name"
          style={auth.input}
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          style={auth.input}
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password (min 6 characters)"
          style={auth.input}
          value={formData.password}
          onChange={handleChange}
          required
          minLength={6}
        />

        <select
          name="role"
          style={auth.select}
          value={formData.role}
          onChange={handleChange}
        >
          <option value="student">Student</option>
          <option value="teacher">Therapist</option>
        </select>

        <button type="submit" style={auth.button} disabled={loading}>
          {loading ? "Creating Account..." : "Sign Up"}
        </button>

        <p style={auth.text}>
          Already have an account?{" "}
          <Link to="/login" style={auth.link}>
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}

const auth = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%)",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
  },
  card: {
    background: "white",
    padding: "48px",
    borderRadius: "16px",
    width: "420px",
    maxWidth: "90%",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.03)",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    border: "1px solid #e2e8f0",
  },
  logo: {
  fontSize: 22,
  fontWeight: 800,
  color: "#1e40af",
  textAlign: "center",
  cursor: "pointer",
  marginBottom: 24,
},

  heading: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#0f172a",
    textAlign: "center",
    marginBottom: "8px",
    letterSpacing: "-0.5px",
  },
  input: {
    padding: "14px 16px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
    outline: "none",
    transition: "border-color 0.2s ease",
  },
  select: {
    padding: "14px 16px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
    outline: "none",
    background: "white",
    cursor: "pointer",
  },
  button: {
    background: "#1e40af",
    color: "white",
    padding: "14px",
    border: "none",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "15px",
    cursor: "pointer",
    transition: "background 0.2s ease",
    marginTop: "8px",
  },
  text: {
    fontSize: "14px",
    textAlign: "center",
    color: "#64748b",
    marginTop: "8px",
  },
  link: {
    color: "#1e40af",
    textDecoration: "none",
    fontWeight: 600,
  },
  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    border: "1px solid #fecaca",
  },
};
