import React, { useEffect, useMemo, useState } from "react";
import "./RewardsPage.css";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:5000";

function getBadges(completedGoals) {
  const completedCount = completedGoals.length;
  const categories = completedGoals.map((goal) => goal.goal_category);

  const hasSleepGoal = categories.includes("Sleep habits");
  const hasUsageGoal = categories.includes("Usage habits");
  const hasMoodGoal =
    categories.includes("Mood support") || categories.includes("Emotional wellbeing");
  const hasSafetyGoal = categories.includes("Online safety");
  const hasContentGoal = categories.includes("Content balance");

  const badges = [];

  if (completedCount >= 1) {
    badges.push({
      id: "first-step",
      icon: "🌱",
      title: "First Step",
      description: "Completed your first personalised goal."
    });
  }

  if (completedCount >= 3) {
    badges.push({
      id: "goal-getter",
      icon: "🎯",
      title: "Goal Getter",
      description: "Completed 3 wellbeing goals."
    });
  }

  if (completedCount >= 5) {
    badges.push({
      id: "consistent-climber",
      icon: "📈",
      title: "Consistent Climber",
      description: "Completed 5 wellbeing goals."
    });
  }

  if (completedCount >= 8) {
    badges.push({
      id: "wellbeing-champion",
      icon: "🏆",
      title: "Wellbeing Champion",
      description: "Completed 8 or more goals."
    });
  }

  if (hasSleepGoal) {
    badges.push({
      id: "sleep-guardian",
      icon: "🌙",
      title: "Sleep Guardian",
      description: "Completed at least one sleep-related goal."
    });
  }

  if (hasUsageGoal) {
    badges.push({
      id: "mindful-scroller",
      icon: "⏳",
      title: "Mindful Scroller",
      description: "Completed at least one usage-related goal."
    });
  }

  if (hasMoodGoal) {
    badges.push({
      id: "mood-protector",
      icon: "💚",
      title: "Mood Protector",
      description: "Completed at least one emotional wellbeing goal."
    });
  }

  if (hasContentGoal) {
    badges.push({
      id: "feed-curator",
      icon: "🌈",
      title: "Feed Curator",
      description: "Improved your feed by completing a content-balance goal."
    });
  }

  if (hasSafetyGoal) {
    badges.push({
      id: "safe-space-builder",
      icon: "🛡️",
      title: "Safe Space Builder",
      description: "Completed a goal related to safer online interactions."
    });
  }

  return badges;
}

export default function RewardsPage() {
  const navigate = useNavigate();

  const userId = localStorage.getItem("user_id");
  const userName =
    localStorage.getItem("user_name") ||
    localStorage.getItem("full_name") ||
    "User";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completedGoals, setCompletedGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCompletedGoals() {
      if (!userId) {
        setError("No user found. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/completed-goals/${userId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load rewards.");
        }

        setCompletedGoals(data || []);
      } catch (err) {
        setError(err.message || "Could not load rewards.");
      } finally {
        setLoading(false);
      }
    }

    fetchCompletedGoals();
  }, [userId]);

  const badges = useMemo(() => getBadges(completedGoals), [completedGoals]);

  return (
    <div className="rewards-page">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="rewards-topbar">
        <button className="rewards-menu-button" onClick={() => setSidebarOpen(true)}>
          ☰
        </button>

        <img
          src="/Logo.png"
          alt="SocioPulse Logo"
          className="rewards-topbar-logo"
        />

        <div className="rewards-profile-section">
          <span className="rewards-profile-name">{userName}</span>
          <div
            className="rewards-profile-icon"
            onClick={() => navigate("/profile")}
            title="Open Profile"
          >
            👤
          </div>
        </div>
      </div>

      <div className="rewards-content">
        <div className="rewards-header-card">
          <h2>Rewards for {userName}</h2>
          <p>
            Your badges are based on the goals you have completed so far. The more
            goals you complete, the more rewards you unlock.
          </p>
        </div>

        {loading ? (
          <div className="rewards-info-card">
            <p>Loading your rewards...</p>
          </div>
        ) : error ? (
          <div className="rewards-info-card error-card">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="rewards-summary-grid">
              <div className="rewards-stat-card">
                <h3>Completed Goals</h3>
                <div className="rewards-stat-value">{completedGoals.length}</div>
                <p>Total goals marked as completed</p>
              </div>

              <div className="rewards-stat-card">
                <h3>Badges Earned</h3>
                <div className="rewards-stat-value">{badges.length}</div>
                <p>Rewards unlocked from your progress</p>
              </div>
            </div>

            <div className="badges-section-card">
              <h3>Your Badges</h3>

              {badges.length === 0 ? (
                <p className="empty-rewards-text">
                  Complete some goals on the Goals page to unlock your first badge.
                </p>
              ) : (
                <div className="badges-grid">
                  {badges.map((badge) => (
                    <div key={badge.id} className="badge-card">
                      <div className="badge-icon">{badge.icon}</div>
                      <h4>{badge.title}</h4>
                      <p>{badge.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="completed-goals-card">
              <h3>Completed Goals</h3>

              {completedGoals.length === 0 ? (
                <p className="empty-rewards-text">No completed goals yet.</p>
              ) : (
                <div className="completed-goals-list">
                  {completedGoals.map((goal) => (
                    <div key={goal.completed_goal_id} className="completed-goal-item">
                      <div>
                        <h4>{goal.goal_title}</h4>
                        <p>{goal.goal_category}</p>
                      </div>
                      <span className="completed-badge">Completed</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}