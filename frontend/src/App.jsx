import { Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "./components/PublicLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import TrainingDocsPage from "./pages/TrainingDocsPage";
import ManageStudentsPage from "./pages/ManageStudentsPage";

import StudentLayout from "./student/StudentLayout";
import Toggle from "./student/Toggle";
import Dashboard from "./student/Dashboard";
import StudentReportsPage from "./student/StudentReportsPage";
import TherapistLayout from "./therapist/TherapistLayout";
import TherapistDashboard from "./therapist/TherapistDashboard";
import TherapistStudentDetail from "./therapist/TherapistStudentDetail";
import GuardianLayout from "./guardian/GuardianLayout";
import GuardianDashboard from "./guardian/GuardianDashboard";
import GuardianStudentDetail from "./guardian/GuardianStudentDetail";

import LetterLevel from "./student/LetterLevel";
import TwoLetterLevel from "./student/TwoLetterLevel";
import WordLevel from "./student/WordLevel";
import SentenceLevel from "./student/SentenceLevel.jsx";
import ChangePassword from "./student/ChangePassword";

/* ================= Protected Route ================= */
function ProtectedRoute({ children, allowedRoles }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/* ================= App ================= */
function App() {
  return (
    <>
      <Routes>
        {/* -------- Public Routes -------- */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* -------- Student Routes -------- */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          {/* student home */}
          <Route index element={<Navigate to="dashboard" replace />} />

          {/* dashboard */}
          <Route path="dashboard" element={<Dashboard />} />

          {/* learning levels (same logic as upstream, just routed) */}
          <Route path="letter-level" element={<LetterLevel />} />
          <Route path="word-level" element={<WordLevel />} />
          <Route path="sentence-level" element={<SentenceLevel />} />
          <Route path="reports" element={<StudentReportsPage />} />
          <Route path="training-docs" element={<TrainingDocsPage role="student" />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>

        {/* -------- Teacher -------- */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TherapistLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TherapistDashboard />} />
          <Route path="student/:studentId" element={<TherapistStudentDetail />} />
          <Route path="training-docs" element={<TrainingDocsPage role="teacher" />} />
          <Route path="manage-students" element={<ManageStudentsPage role="teacher" />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>

        {/* -------- Parent -------- */}
        <Route
          path="/parent"
          element={
            <ProtectedRoute allowedRoles={["parent"]}>
              <GuardianLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<GuardianDashboard />} />
          <Route path="student/:studentId" element={<GuardianStudentDetail />} />
          <Route path="training-docs" element={<TrainingDocsPage role="parent" />} />
          <Route path="manage-children" element={<ManageStudentsPage role="parent" />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>

        {/* -------- Admin -------- */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <div style={placeholderStyle}>
                <h1>Admin Dashboard</h1>
                <p>Coming Soon</p>
              </div>
            </ProtectedRoute>
          }
        />

        {/* -------- Catch All -------- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

const placeholderStyle = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
};

export default App;
