import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import LandingPage from "./pages/LandingPage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import AssessmentPage from "./pages/AssessmentPage";
import HomePage from "./pages/HomePage";
import CalendarPage from "./pages/CalendarPage";
import GoalsPage from "./pages/GoalsPage";
import RewardsPage from "./pages/RewardsPage";
import ProfilePage from "./pages/ProfilePage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import API_BASE from "./config/api";

function AssessmentRequiredRoute({ children }) {
  const location = useLocation();
  const userId = localStorage.getItem("user_id");
  const [status, setStatus] = useState(
    userId && localStorage.getItem("assessment_completed") === "true"
      ? "allowed"
      : userId
      ? "checking"
      : "missing-user"
  );

  useEffect(() => {
    let ignore = false;

    if (!userId) {
      setStatus("missing-user");
      return undefined;
    }

    if (localStorage.getItem("assessment_completed") === "true") {
      setStatus("allowed");
      return undefined;
    }

    const checkAssessment = async () => {
      try {
        const response = await fetch(`${API_BASE}/latest-assessment/${userId}`);

        if (ignore) return;

        if (response.ok) {
          localStorage.setItem("assessment_completed", "true");
          setStatus("allowed");
          return;
        }

        if (response.status === 404) {
          localStorage.removeItem("assessment_completed");
          localStorage.removeItem("wellbeing_result");
          setStatus("needs-assessment");
          return;
        }

        setStatus("needs-assessment");
      } catch (error) {
        if (!ignore) {
          setStatus("needs-assessment");
        }
      }
    };

    checkAssessment();

    return () => {
      ignore = true;
    };
  }, [userId]);

  if (status === "checking") {
    return <div style={{ padding: "40px", textAlign: "center" }}>Checking assessment...</div>;
  }

  if (status === "missing-user") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (status === "needs-assessment") {
    return (
      <Navigate
        to="/assessment"
        replace
        state={{
          from: location,
          message: "Please complete your wellbeing assessment before using the calendar.",
        }}
      />
    );
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/assessment" element={<AssessmentPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route
          path="/calendar"
          element={
            <AssessmentRequiredRoute>
              <CalendarPage />
            </AssessmentRequiredRoute>
          }
        />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/rewards" element={<RewardsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      </Routes>
    </Router>
  );
}

export default App;
