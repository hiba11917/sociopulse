import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/assessment" element={<AssessmentPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/rewards" element={<RewardsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      </Routes>
    </Router>
  );
}

export default App;