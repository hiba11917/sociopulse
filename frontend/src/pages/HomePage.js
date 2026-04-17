import React, { useEffect, useMemo, useState } from "react";
import "./HomePage.css";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE = "http://127.0.0.1:5000";

function normalizeDateOnly(value) {
  if (!value) return "";

  if (typeof value === "string") {
    const trimmed = value.trim();

    const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) return isoMatch[1];

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return "";
}

function normaliseBeforeBed(value) {
  return String(value || "").trim().toLowerCase() === "yes";
}

function parseScreenTimeToHours(value) {
  if (!value) return null;

  const text = String(value).trim().toLowerCase();

  if (text.includes("less than 1")) return 0.5;
  if (text.includes("less than 2")) return 1.5;
  if (text.includes("more than 6")) return 6.5;

  const rangeMatch = text.match(/(\d+(\.\d+)?)\s*[-–]\s*(\d+(\.\d+)?)/);
  if (rangeMatch) {
    const start = Number(rangeMatch[1]);
    const end = Number(rangeMatch[3]);
    return (start + end) / 2;
  }

  const singleMatch = text.match(/(\d+(\.\d+)?)/);
  if (singleMatch) return Number(singleMatch[1]);

  return null;
}

function normalizeMoodValue(value) {
  if (value === null || value === undefined) return null;

  const text = String(value).trim().toLowerCase();

  if (text !== "" && !Number.isNaN(Number(text))) {
    return Number(text);
  }

  if (text.includes("very happy")) return 5;
  if (text === "happy" || text.includes("good mood") || text.includes("positive")) return 4;
  if (text.includes("neutral") || text.includes("okay") || text.includes("ok")) return 3;
  if (text === "sad" || text.includes("low") || text.includes("down") || text.includes("bad mood")) return 2;
  if (text.includes("very sad") || text.includes("very low") || text.includes("awful")) return 1;

  return null;
}

function normalizeSleepValue(value) {
  if (value === null || value === undefined) return null;

  const text = String(value).trim().toLowerCase();

  if (text !== "" && !Number.isNaN(Number(text))) {
    return Number(text);
  }

  if (text.includes("very good")) return 5;
  if (text === "good") return 4;
  if (text.includes("average") || text.includes("moderate")) return 3;
  if (text === "poor") return 2;
  if (text.includes("very poor")) return 1;

  return null;
}

function getMoodBand(value) {
  const mood = normalizeMoodValue(value);
  if (mood === null) return 2;
  if (mood >= 4) return 3;
  if (mood === 3) return 2;
  return 1;
}

function getMoodBandColor(value) {
  const band = getMoodBand(value);
  if (band === 1) return "rgba(239, 68, 68, 1)";
  if (band === 2) return "rgba(245, 158, 11, 1)";
  return "rgba(34, 197, 94, 1)";
}

function getLevelFromRatio(ratio) {
  if (ratio >= 0.6) return "High";
  if (ratio >= 0.3) return "Moderate";
  return "Low";
}

function formatAverageScreenTime(checkins) {
  if (!checkins.length) return "No data";

  const values = checkins
    .map((item) => parseScreenTimeToHours(item.screen_time))
    .filter((value) => value !== null && !Number.isNaN(value));

  if (!values.length) return "No data";

  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  return `${avg.toFixed(1)} hrs/day`;
}

function getBeforeBedLevel(checkins) {
  if (!checkins.length) return "No data";
  const beforeBedDays = checkins.filter((item) => normaliseBeforeBed(item.before_bed)).length;
  return getLevelFromRatio(beforeBedDays / checkins.length);
}

function getSleepImpactLevel(checkins) {
  if (!checkins.length) return "No data";

  const poorSleepDays = checkins.filter(
    (item) => normalizeSleepValue(item.sleep_quality) <= 2
  ).length;

  const moderateSleepDays = checkins.filter(
    (item) => normalizeSleepValue(item.sleep_quality) === 3
  ).length;

  const ratio = (poorSleepDays + moderateSleepDays * 0.5) / checkins.length;
  return getLevelFromRatio(ratio);
}

function getSleepCategory(value) {
  const sleep = normalizeSleepValue(value);
  if (sleep === null) return "Moderate";
  if (sleep >= 4) return "Good";
  if (sleep === 3) return "Moderate";
  return "Bad";
}

function getLast7DaysSeries(checkins) {
  const today = new Date();
  const normalizedCheckinDates = checkins.map((item) => normalizeDateOnly(item.checkin_date));
  const days = [];

  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setHours(12, 0, 0, 0);
    d.setDate(today.getDate() - i);

    const iso = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });

    const count = normalizedCheckinDates.filter((date) => date === iso).length;

    days.push({
      iso,
      label,
      count,
    });
  }

  return days;
}

function getWeeklyInsights(checkins) {
  if (!checkins.length) {
    return ["Start adding daily calendar check-ins to see personalised insights here."];
  }

  const insights = [];
  const total = checkins.length;

  const lowMoodDays = checkins.filter(
    (item) => normalizeMoodValue(item.mood) <= 2
  ).length;

  const positiveMoodDays = checkins.filter(
    (item) => normalizeMoodValue(item.mood) >= 4
  ).length;

  const poorSleepDays = checkins.filter(
    (item) => normalizeSleepValue(item.sleep_quality) <= 2
  ).length;

  const strongSleepDays = checkins.filter(
    (item) => normalizeSleepValue(item.sleep_quality) >= 4
  ).length;

  const beforeBedDays = checkins.filter((item) =>
    normaliseBeforeBed(item.before_bed)
  ).length;

  const anxietyDays = checkins.filter(
    (item) =>
      item.anxiety_level !== undefined &&
      item.anxiety_level !== null &&
      Number(item.anxiety_level) >= 4
  ).length;

  const overwhelmDays = checkins.filter(
    (item) =>
      item.overwhelm_level !== undefined &&
      item.overwhelm_level !== null &&
      Number(item.overwhelm_level) >= 4
  ).length;

  const wellbeingCounts = checkins.reduce(
    (acc, item) => {
      const result = item.daily_wellbeing_result || "Moderate";
      acc[result] = (acc[result] || 0) + 1;
      return acc;
    },
    { Good: 0, Moderate: 0, Poor: 0 }
  );

  if (lowMoodDays >= 1) {
    insights.push(
      lowMoodDays === 1
        ? "Your social media wellbeing was very low on one day this week."
        : `Your social media wellbeing was very low on ${lowMoodDays} days this week.`
    );
  }

  if (positiveMoodDays >= Math.ceil(total * 0.6)) {
    insights.push("Your mood was positive on most check-in days this week.");
  }

  if (poorSleepDays >= 1) {
    insights.push(
      `Sleep quality dropped on ${poorSleepDays} day${poorSleepDays > 1 ? "s" : ""}, which may be affecting your overall wellbeing.`
    );
  }

  if (strongSleepDays >= Math.ceil(total * 0.6)) {
    insights.push("Your sleep quality was strong on most check-in days this week.");
  }

  if (beforeBedDays >= Math.ceil(total * 0.6)) {
    insights.push(
      "Using social media before bed was a frequent pattern this week and may be contributing to lower rest quality."
    );
  } else if (beforeBedDays >= 2) {
    insights.push("Social media use before bed appeared several times this week.");
  }

  if (anxietyDays >= 2) {
    insights.push("Higher anxiety appeared on multiple check-in days this week.");
  }

  if (overwhelmDays >= 2) {
    insights.push("You showed signs of overwhelm on multiple days this week.");
  }

  if (wellbeingCounts.Poor >= 2) {
    insights.push("Your weekly wellbeing pattern shows repeated low points that may need attention.");
  } else if (wellbeingCounts.Good >= Math.ceil(total * 0.6)) {
    insights.push("Overall, your weekly pattern suggests mostly healthy wellbeing habits.");
  } else if (wellbeingCounts.Moderate >= Math.ceil(total * 0.6)) {
    insights.push("Your week looked fairly mixed overall, with room to improve daily habits.");
  }

  if (!insights.length) {
    insights.push("Your weekly pattern looks balanced overall.");
  }

  return insights;
}

export default function HomePage() {
  const [checkins, setCheckins] = useState([]);
  const [communityInsights, setCommunityInsights] = useState([]);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const userId = localStorage.getItem("user_id");
  const userName = localStorage.getItem("user_name") || "User";

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        setError("User not logged in.");
        setLoading(false);
        return;
      }

      try {
        const [checkinsRes, communityRes] = await Promise.all([
          fetch(`${API_BASE}/daily-checkins/${userId}`),
          fetch(`${API_BASE}/community-insights`),
        ]);

        const checkinsData = await checkinsRes.json();
        const communityData = await communityRes.json();

        if (!checkinsRes.ok) {
          throw new Error(checkinsData.error || "Failed to load daily check-ins.");
        }

        if (!communityRes.ok) {
          throw new Error(communityData.error || "Failed to load community insights.");
        }

        const normalizedCheckins = (checkinsData || []).map((item) => ({
          ...item,
          checkin_date: normalizeDateOnly(item.checkin_date),
          mood: normalizeMoodValue(item.mood),
          sleep_quality: normalizeSleepValue(item.sleep_quality),
        }));

        const sorted = [...normalizedCheckins].sort(
          (a, b) => new Date(a.checkin_date) - new Date(b.checkin_date)
        );

        const last7Checkins = sorted.slice(-7);

        setCheckins(last7Checkins);
        setCommunityInsights(communityData.insights || []);
      } catch (err) {
        setError(err.message || "Failed to load homepage.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const weeklyStats = useMemo(() => {
    const total = checkins.length;

    const wellbeingCounts = checkins.reduce(
      (acc, item) => {
        const result = item.daily_wellbeing_result || "Moderate";
        acc[result] = (acc[result] || 0) + 1;
        return acc;
      },
      { Good: 0, Moderate: 0, Poor: 0 }
    );

    const weeklyWellbeing =
      wellbeingCounts.Poor >= 3
        ? "Poor"
        : wellbeingCounts.Good >= Math.max(1, Math.ceil(total * 0.6))
        ? "Good"
        : total
        ? "Moderate"
        : "No data";

    return {
      weeklyWellbeing,
      averageScreenTime: formatAverageScreenTime(checkins),
      beforeBedUse: getBeforeBedLevel(checkins),
      sleepImpact: getSleepImpactLevel(checkins),
      insights: getWeeklyInsights(checkins),
    };
  }, [checkins]);

  const sleepCounts = useMemo(() => {
    return checkins.reduce(
      (acc, item) => {
        const category = getSleepCategory(item.sleep_quality);
        acc[category] += 1;
        return acc;
      },
      { Good: 0, Moderate: 0, Bad: 0 }
    );
  }, [checkins]);

  const moodLineData = {
    labels: checkins.map((item) =>
      new Date(item.checkin_date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      })
    ),
    datasets: [
      {
        label: "Mood",
        data: checkins.map((item) => getMoodBand(item.mood)),
        borderColor: "rgba(156, 163, 175, 0.9)",
        backgroundColor: "rgba(156, 163, 175, 0.15)",
        pointBackgroundColor: checkins.map((item) => getMoodBandColor(item.mood)),
        pointBorderColor: checkins.map((item) => getMoodBandColor(item.mood)),
        pointRadius: 6,
        pointHoverRadius: 7,
        borderWidth: 3,
        tension: 0.35,
        fill: false,
      },
    ],
  };

  const sleepChartData = {
    labels: ["Good", "Moderate", "Bad"],
    datasets: [
      {
        label: "Sleep Count",
        data: [sleepCounts.Good, sleepCounts.Moderate, sleepCounts.Bad],
        backgroundColor: [
          "rgba(183, 228, 199, 0.9)",
          "rgba(255, 243, 201, 0.95)",
          "rgba(255, 216, 216, 0.95)",
        ],
        borderRadius: 10,
      },
    ],
  };

  const wellbeingBreakdownData = {
    labels: ["Good", "Moderate", "Poor"],
    datasets: [
      {
        data: [
          checkins.filter((item) => item.daily_wellbeing_result === "Good").length,
          checkins.filter((item) => item.daily_wellbeing_result === "Moderate").length,
          checkins.filter((item) => item.daily_wellbeing_result === "Poor").length,
        ],
        backgroundColor: [
          "rgba(183, 228, 199, 0.9)",
          "rgba(255, 243, 201, 0.95)",
          "rgba(255, 216, 216, 0.95)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const frequencySeries = getLast7DaysSeries(checkins);

  const checkinFrequencyData = {
    labels: frequencySeries.map((item) => item.label),
    datasets: [
      {
        label: "Check-ins",
        data: frequencySeries.map((item) => item.count),
        borderColor: "rgba(143, 122, 192, 1)",
        backgroundColor: "rgba(143, 122, 192, 0.2)",
        pointBackgroundColor: "rgba(143, 122, 192, 1)",
        pointRadius: 4,
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
      },
    },
  };

  const moodLineOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw;
            if (value === 1) return "Mood: Low";
            if (value === 2) return "Mood: Moderate";
            return "Mood: Good";
          },
        },
      },
    },
    scales: {
      y: {
        min: 1,
        max: 3,
        ticks: {
          stepSize: 1,
          callback: function (value) {
            if (value === 1) return "Low";
            if (value === 2) return "Moderate";
            if (value === 3) return "Good";
            return value;
          },
        },
      },
    },
  };

  const lineOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
    },
  };

  if (loading) {
    return (
      <div className="home-page">
        <p style={{ padding: "40px", textAlign: "center" }}>Loading homepage...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-page">
        <p style={{ padding: "40px", textAlign: "center" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="topbar">
        <button className="menu-button" onClick={() => setSidebarOpen(true)}>
          ☰
        </button>

        <div className="topbar-logo">
          <img src="/Logo.png" alt="SocioPulse Logo" className="topbar-logo-img" />
        </div>

        <div className="profile-section">
          <span className="profile-name">{userName}</span>
          <div
            className="profile-icon"
            onClick={() => navigate("/profile")}
            style={{ cursor: "pointer" }}
            title="Open Profile"
          >
            👤
          </div>
        </div>
      </div>

      <div className="dashboard-container">
        <div className="welcome-card">
          <h2>Welcome back, {userName}</h2>
          <p>Your dashboard reflects your recent digital habits and overall wellbeing trends.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Weekly Wellbeing</h3>
            <p className="stat-value">{weeklyStats.weeklyWellbeing}</p>
          </div>

          <div className="stat-card">
            <h3>Average Screen Time</h3>
            <p className="stat-value">{weeklyStats.averageScreenTime}</p>
          </div>

          <div className="stat-card">
            <h3>Before Bed Use</h3>
            <p className="stat-value">{weeklyStats.beforeBedUse}</p>
          </div>

          <div className="stat-card">
            <h3>Sleep Impact</h3>
            <p className="stat-value">{weeklyStats.sleepImpact}</p>
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-card">
            <h3>Weekly Mood Overview</h3>
            {checkins.length ? (
              <Line data={moodLineData} options={moodLineOptions} />
            ) : (
              <p className="empty-chart-text">No check-in data yet.</p>
            )}
          </div>

          <div className="chart-card">
            <h3>Weekly Sleep Overview</h3>
            {checkins.length ? (
              <Bar data={sleepChartData} options={barOptions} />
            ) : (
              <p className="empty-chart-text">No check-in data yet.</p>
            )}
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-card chart-card-wide">
            <h3>Weekly Wellbeing Breakdown</h3>
            {checkins.length ? (
              <div className="doughnut-wrapper">
                <Doughnut data={wellbeingBreakdownData} options={doughnutOptions} />
              </div>
            ) : (
              <p className="empty-chart-text">No check-in data yet.</p>
            )}
          </div>

          <div className="chart-card">
            <h3>Check-in Frequency (Last 7 Days)</h3>
            {checkins.length ? (
              <Line data={checkinFrequencyData} options={lineOptions} />
            ) : (
              <p className="empty-chart-text">No check-in data yet.</p>
            )}
          </div>
        </div>

        <div className="insights-card">
          <h3>Your Weekly Insights</h3>
          <p className="insight-subtitle">
            Based on your recent daily check-ins and track record
          </p>
          <ul>
            {weeklyStats.insights.map((insight, index) => (
              <li key={index}>{insight}</li>
            ))}
          </ul>
        </div>

        <div className="community-card">
          <h3>Community Insights</h3>
          <p className="community-subtitle">Based on analysed survey and app user data</p>
          <ul>
            {communityInsights.length ? (
              communityInsights.map((insight, index) => <li key={index}>{insight}</li>)
            ) : (
              <li>No community insights available yet.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}