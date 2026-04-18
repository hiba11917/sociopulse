import React, { useEffect, useMemo, useState } from "react";
import "./GoalsPage.css";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import API_BASE from "../config/api";

function toNumber(value) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getUsageHoursBand(value) {
  const text = String(value || "").toLowerCase();

  if (text.includes("more than 6")) return 5;
  if (text.includes("4–6") || text.includes("4-6")) return 4;
  if (text.includes("2–4") || text.includes("2-4")) return 3;
  if (text.includes("1–2") || text.includes("1-2")) return 2;
  if (text.includes("less than 1")) return 1;

  return 0;
}

function buildGoalsFromAssessment(data) {
  if (!data) return [];

  const goals = [];

  const dailyUsageBand = getUsageHoursBand(data.daily_usage);
  const beforeBed = toNumber(data.before_bed);
  const negativeNews = toNumber(data.negative_news);
  const stressfulContent = toNumber(data.stressful_content);
  const excludedContent = toNumber(data.excluded_content);
  const anxiousAfterUse = toNumber(data.anxious_after_use);
  const tiredAfterUse = toNumber(data.tired_after_use);
  const moodWorsens = toNumber(data.mood_worsens);
  const sleepAffected = toNumber(data.sleep_affected);
  const adverseInteraction =
    String(data.adverse_interaction || "").trim().toLowerCase() === "yes";
  const wellbeingResult = String(data.wellbeing_result || "").trim();

  if (dailyUsageBand >= 4) {
    goals.push({
      id: "reduce-screen-time",
      icon: "📉",
      category: "Usage habits",
      priority: "High priority",
      title: "Reduce daily social media time",
      description:
        "Your assessment suggests higher daily usage. A realistic goal is to cut one session or reduce total scrolling time each day.",
      target: "Try to stay at least one usage band lower than your current pattern.",
      action: "Take one 30-minute screen-free block each evening."
    });
  }

  if (beforeBed >= 4) {
    goals.push({
      id: "avoid-before-bed",
      icon: "🌙",
      category: "Sleep habits",
      priority: "High priority",
      title: "Avoid social media before bed",
      description:
        "You reported frequent before-bed social media use. This goal can help protect sleep quality and reduce late-night overstimulation.",
      target: "Avoid social media in the last 30–60 minutes before sleep.",
      action: "Replace night scrolling with calming music, reading, or a screen-free routine."
    });
  }

  if (negativeNews >= 4) {
    goals.push({
      id: "view-positive-content",
      icon: "🌤️",
      category: "Content balance",
      priority: "Recommended",
      title: "View more positive and uplifting content",
      description:
        "You reported seeing a lot of negative news. A healthier feed balance can reduce emotional strain and make your online experience feel lighter.",
      target: "Follow or engage with at least 3 more positive accounts this week.",
      action: "Search for educational, motivational, humour, hobby, or calming content."
    });
  }

  if (stressfulContent >= 4) {
    goals.push({
      id: "reduce-stressful-content",
      icon: "🧘",
      category: "Content balance",
      priority: "High priority",
      title: "Reduce exposure to stressful or argumentative content",
      description:
        "Your assessment suggests that stressful content appears often in your feed. Reducing this can support a calmer online environment.",
      target: "Mute, unfollow, or skip stressful accounts and topics.",
      action: "Use platform tools to hide posts, keywords, or pages that raise stress."
    });
  }

  if (excludedContent >= 4) {
    goals.push({
      id: "reduce-comparison-content",
      icon: "💛",
      category: "Emotional wellbeing",
      priority: "Recommended",
      title: "Reduce comparison-based or exclusion-triggering content",
      description:
        "You indicated that some content makes you feel left out. Curating your feed can reduce comparison and protect your mood.",
      target: "Remove or limit accounts that make you feel excluded.",
      action: "Choose content that supports belonging, inspiration, and realistic lifestyles."
    });
  }

  if (anxiousAfterUse >= 4) {
    goals.push({
      id: "post-use-reset",
      icon: "🌿",
      category: "Emotional wellbeing",
      priority: "High priority",
      title: "Add a calming reset after social media use",
      description:
        "You reported feeling anxious after using social media. A short reset routine can help break the emotional carryover after scrolling.",
      target: "Take a 5–10 minute reset after heavy use.",
      action: "Step away, breathe deeply, stretch, or listen to something calming."
    });
  }

  if (tiredAfterUse >= 4) {
    goals.push({
      id: "shorter-sessions",
      icon: "⏱️",
      category: "Usage habits",
      priority: "Recommended",
      title: "Use shorter social media sessions",
      description:
        "Feeling drained after long sessions suggests your scrolling may be lasting too long. Shorter sessions can reduce fatigue.",
      target: "Limit at least one daily session to 15–20 minutes.",
      action: "Set a timer before opening social media."
    });
  }

  if (moodWorsens >= 4) {
    goals.push({
      id: "protect-mood",
      icon: "🙂",
      category: "Mood support",
      priority: "High priority",
      title: "Protect your mood on high-usage days",
      description:
        "You reported that your mood worsens when usage increases. This goal helps connect awareness with action.",
      target: "Notice mood changes and stop scrolling earlier on difficult days.",
      action: "Check in with yourself before and after using social media."
    });
  }

  if (sleepAffected >= 4) {
    goals.push({
      id: "improve-sleep-habits",
      icon: "😴",
      category: "Sleep habits",
      priority: "High priority",
      title: "Improve sleep-supportive digital habits",
      description:
        "Your assessment suggests social media may be affecting your sleep. Small changes can make your night routine healthier.",
      target: "Aim for calmer digital use in the evening.",
      action: "Lower screen brightness, stop doomscrolling, and avoid stimulating content at night."
    });
  }

  if (adverseInteraction) {
    goals.push({
      id: "create-safer-space",
      icon: "🛡️",
      category: "Online safety",
      priority: "High priority",
      title: "Create a safer online space",
      description:
        "You reported experiencing adverse interactions online. A good goal is to make your digital environment feel more protected and manageable.",
      target: "Block, mute, report, or restrict harmful accounts when needed.",
      action: "Review privacy settings and limit interaction with harmful users."
    });
  }

  if (wellbeingResult === "Poor") {
    goals.push({
      id: "daily-checkin-streak",
      icon: "📅",
      category: "Consistency",
      priority: "Start here",
      title: "Build a 7-day wellbeing check-in streak",
      description:
        "Your overall result suggests that regular reflection could help you notice patterns and respond earlier.",
      target: "Complete daily check-ins for 7 days.",
      action: "Use the calendar page every day to track how you feel."
    });

    goals.push({
      id: "digital-recovery-goal",
      icon: "💚",
      category: "Recovery",
      priority: "Start here",
      title: "Choose one recovery-focused digital habit",
      description:
        "When wellbeing is lower, smaller focused goals are often more realistic than changing everything at once.",
      target: "Pick one habit to improve this week and stay consistent with it.",
      action: "Start with either sleep, screen time, or content quality."
    });
  }

  if (wellbeingResult === "Moderate") {
    goals.push({
      id: "maintain-balance",
      icon: "⚖️",
      category: "Balance",
      priority: "Recommended",
      title: "Strengthen your healthier digital habits",
      description:
        "Your assessment suggests mixed patterns. A good next step is to improve one or two habits before they become more difficult.",
      target: "Choose 2 focus goals and follow them this week.",
      action: "Prioritise the goals with the strongest impact on mood or sleep."
    });
  }

  if (wellbeingResult === "Good") {
    goals.push({
      id: "maintain-positive-routine",
      icon: "✨",
      category: "Maintenance",
      priority: "Keep going",
      title: "Maintain your positive digital routine",
      description:
        "Your current wellbeing result looks positive. This goal helps you keep healthy habits consistent.",
      target: "Keep following the habits that already support your wellbeing.",
      action: "Stay aware of any new patterns that could affect your mood or sleep."
    });
  }

  return goals;
}

async function parseResponseSafely(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return {
      nonJson: true,
      rawText: text
    };
  }
}

async function fetchLatestAssessment(userId) {
  try {
    const response = await fetch(`${API_BASE}/latest-assessment/${userId}`);
    const data = await parseResponseSafely(response);

    if (!response.ok) {
      throw new Error(data?.error || "Could not load assessment data.");
    }

    if (data?.nonJson) {
      throw new Error("Assessment endpoint is returning HTML, not JSON.");
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Could not load assessment data.");
  }
}

export default function GoalsPage() {
  const navigate = useNavigate();

  const userId = localStorage.getItem("user_id");
  const userName =
    localStorage.getItem("user_name") ||
    localStorage.getItem("full_name") ||
    "User";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [completedGoals, setCompletedGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingGoalId, setSavingGoalId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function fetchPageData() {
      if (!userId) {
        if (isActive) {
          setError("No user found. Please log in again.");
          setLoading(false);
        }
        return;
      }

      if (isActive) {
        setLoading(true);
        setError("");
      }

      try {
        const [assessmentData, completedResponse] = await Promise.all([
          fetchLatestAssessment(userId),
          fetch(`${API_BASE}/completed-goals/${userId}`)
        ]);

        const completedData = await parseResponseSafely(completedResponse);

        if (!completedResponse.ok) {
          throw new Error(
            completedData?.error || "Could not load completed goals."
          );
        }

        if (completedData?.nonJson) {
          throw new Error("Completed goals endpoint is returning HTML, not JSON.");
        }

        if (!isActive) return;

        setAssessment(assessmentData);
        setCompletedGoals((completedData || []).map((item) => item.goal_id));
      } catch (err) {
        if (isActive) {
          setError(err.message || "Could not load goals.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    fetchPageData();

    return () => {
      isActive = false;
    };
  }, [userId]);

  const goals = useMemo(() => buildGoalsFromAssessment(assessment), [assessment]);

  const completedCount = useMemo(
    () => goals.filter((goal) => completedGoals.includes(goal.id)).length,
    [goals, completedGoals]
  );

  const completionPercentage = goals.length
    ? Math.round((completedCount / goals.length) * 100)
    : 0;

  const toggleGoalComplete = async (goal) => {
    if (!userId || savingGoalId) return;

    setSavingGoalId(goal.id);

    try {
      const alreadyCompleted = completedGoals.includes(goal.id);

      if (alreadyCompleted) {
        const response = await fetch(
          `${API_BASE}/completed-goals/${Number(userId)}/${goal.id}`,
          { method: "DELETE" }
        );

        const data = await parseResponseSafely(response);

        if (!response.ok) {
          throw new Error(data?.error || "Could not unmark goal.");
        }

        setCompletedGoals((prev) => prev.filter((id) => id !== goal.id));
      } else {
        const response = await fetch(`${API_BASE}/completed-goals`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: Number(userId),
            goal_id: goal.id,
            goal_title: goal.title,
            goal_category: goal.category
          })
        });

        const data = await parseResponseSafely(response);

        if (!response.ok && response.status !== 409) {
          throw new Error(data?.error || "Could not save goal.");
        }

        if (!completedGoals.includes(goal.id)) {
          setCompletedGoals((prev) => [...prev, goal.id]);
        }
      }
    } catch (err) {
      alert(err.message || "Something went wrong.");
    } finally {
      setSavingGoalId("");
    }
  };

  return (
    <div className="goals-page">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="goals-topbar">
        <button className="goals-menu-button" onClick={() => setSidebarOpen(true)}>
          ☰
        </button>

        <img
          src="/Logo.png"
          alt="SocioPulse Logo"
          className="goals-topbar-logo"
        />

        <div className="goals-profile-section">
          <span className="goals-profile-name">{userName}</span>
          <div
            className="goals-profile-icon"
            onClick={() => navigate("/profile")}
            title="Open Profile"
          >
            👤
          </div>
        </div>
      </div>

      <div className="goals-content">
        <div className="goals-header-card">
          <h2>Goals for {userName}</h2>
          <p>
            These goals are generated from your latest wellbeing assessment, so they
            reflect the habits and content patterns you reported.
          </p>
        </div>

        {loading ? (
          <div className="goals-info-card">
            <p>Loading your personalised goals...</p>
          </div>
        ) : error ? (
          <div className="goals-info-card error-card">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="goals-summary-grid">
              <div className="goals-stat-card">
                <h3>Total Goals</h3>
                <div className="goals-stat-value">{goals.length}</div>
                <p>Personalised from your assessment</p>
              </div>

              <div className="goals-stat-card">
                <h3>Completed</h3>
                <div className="goals-stat-value">{completedCount}</div>
                <p>Goals completed so far</p>
              </div>

              <div className="goals-stat-card">
                <h3>Progress</h3>
                <div className="goals-stat-value">{completionPercentage}%</div>
                <p>Based on your completed goals</p>
              </div>
            </div>

            <div className="progress-strip-card">
              <div className="progress-strip-top">
                <span>Your goals progress</span>
                <span>
                  {completedCount}/{goals.length} completed
                </span>
              </div>

              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            <div className="goals-list">
              {goals.map((goal) => {
                const isCompleted = completedGoals.includes(goal.id);

                return (
                  <div
                    key={goal.id}
                    className={`goal-card ${isCompleted ? "goal-completed" : ""}`}
                  >
                    <div className="goal-card-top">
                      <div className="goal-icon">{goal.icon}</div>

                      <div className="goal-heading-block">
                        <div className="goal-meta-row">
                          <span className="goal-category">{goal.category}</span>
                          <span className="goal-priority">{goal.priority}</span>
                        </div>
                        <h3>{goal.title}</h3>
                      </div>
                    </div>

                    <p className="goal-description">{goal.description}</p>

                    <div className="goal-detail-box">
                      <p>
                        <strong>Goal target:</strong> {goal.target}
                      </p>
                      <p>
                        <strong>Suggested action:</strong> {goal.action}
                      </p>
                    </div>

                    <button
                      className={`goal-action-btn ${isCompleted ? "done" : ""}`}
                      onClick={() => toggleGoalComplete(goal)}
                      disabled={savingGoalId === goal.id}
                    >
                      {savingGoalId === goal.id
                        ? "Saving..."
                        : isCompleted
                        ? "Completed"
                        : "Mark as completed"}
                    </button>
                  </div>
                );
              })}
            </div>

            {!goals.length && (
              <div className="goals-info-card" style={{ marginTop: "24px" }}>
                <p>No goals could be generated yet.</p>
                <p className="small-note">
                  Complete your wellbeing assessment first so personalised goals can
                  appear here.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
