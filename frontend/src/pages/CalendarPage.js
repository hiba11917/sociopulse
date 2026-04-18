import React, { useEffect, useMemo, useState } from "react";
import "./CalendarPage.css";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import API_BASE from "../config/api";

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

function formatDateForDisplay(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function calculatePreviewWellbeing({
  mood,
  sleep_quality,
  before_bed,
  anxiety_level,
  overwhelm_level,
}) {
  let strainScore = 0;

  const moodValue = Number(mood);
  const sleepValue = Number(sleep_quality);
  const beforeBedValue = String(before_bed || "").trim().toLowerCase();

  if (moodValue <= 2) {
    strainScore += 3;
  } else if (moodValue === 3) {
    strainScore += 1;
  }

  if (sleepValue <= 2) {
    strainScore += 3;
  } else if (sleepValue === 3) {
    strainScore += 1;
  }

  if (beforeBedValue === "yes") {
    strainScore += 1;
  }

  if (anxiety_level !== "" && anxiety_level !== null && anxiety_level !== undefined) {
    const anxiety = Number(anxiety_level);
    if (anxiety >= 4) {
      strainScore += 2;
    } else if (anxiety === 3) {
      strainScore += 1;
    }
  }

  if (overwhelm_level !== "" && overwhelm_level !== null && overwhelm_level !== undefined) {
    const overwhelm = Number(overwhelm_level);
    if (overwhelm >= 4) {
      strainScore += 2;
    } else if (overwhelm === 3) {
      strainScore += 1;
    }
  }

  if (strainScore >= 6) return "Poor";
  if (strainScore >= 3) return "Moderate";
  return "Good";
}

export default function CalendarPage() {
  const [date, setDate] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checkins, setCheckins] = useState([]);
  const [saveMessage, setSaveMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    screen_time: "",
    mood: "",
    before_bed: "",
    sleep_quality: "",
    anxiety_level: "",
    overwhelm_level: "",
  });

  const navigate = useNavigate();

  const userId = localStorage.getItem("user_id");
  const userName = localStorage.getItem("user_name") || "User";
  const selectedDateIso = normalizeDateOnly(date);

  useEffect(() => {
    const fetchCheckins = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/daily-checkins/${userId}`);
        const data = await response.json();

        if (response.ok) {
          const normalized = (data || []).map((item) => ({
            ...item,
            checkin_date: normalizeDateOnly(item.checkin_date),
          }));
          setCheckins(normalized);
        } else {
          setSaveMessage(data.error || "Failed to load check-ins.");
        }
      } catch (error) {
        setSaveMessage("Failed to connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    fetchCheckins();
  }, [userId]);

  const selectedCheckin = useMemo(() => {
    return checkins.find((item) => item.checkin_date === selectedDateIso) || null;
  }, [checkins, selectedDateIso]);

  const previewWellbeing = useMemo(() => {
    if (!formData.mood || !formData.sleep_quality || !formData.before_bed) {
      return null;
    }

    return calculatePreviewWellbeing(formData);
  }, [formData]);

  useEffect(() => {
    if (selectedCheckin) {
      setFormData({
        screen_time: selectedCheckin.screen_time || "",
        mood: selectedCheckin.mood || "",
        before_bed: selectedCheckin.before_bed || "",
        sleep_quality: selectedCheckin.sleep_quality || "",
        anxiety_level: selectedCheckin.anxiety_level || "",
        overwhelm_level: selectedCheckin.overwhelm_level || "",
      });
      setSaveMessage("A check-in already exists for this selected day.");
    } else {
      setFormData({
        screen_time: "",
        mood: "",
        before_bed: "",
        sleep_quality: "",
        anxiety_level: "",
        overwhelm_level: "",
      });
      setSaveMessage("");
    }
  }, [selectedCheckin]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveCheckin = async (event) => {
    event.preventDefault();

    if (!userId) {
      setSaveMessage("User not logged in.");
      return;
    }

    if (selectedCheckin) {
      setSaveMessage("You already checked in for this date.");
      return;
    }

    const payload = {
      user_id: Number(userId),
      checkin_date: selectedDateIso,
      screen_time: formData.screen_time,
      mood: formData.mood,
      before_bed: formData.before_bed,
      sleep_quality: formData.sleep_quality,
      anxiety_level: formData.anxiety_level,
      overwhelm_level: formData.overwhelm_level,
    };

    try {
      const response = await fetch(`${API_BASE}/daily-checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setSaveMessage(data.error || "Failed to save check-in.");
        return;
      }

      const newCheckin = {
        ...payload,
        daily_wellbeing_result: data.daily_wellbeing_result,
      };

      setCheckins((prev) =>
        [...prev, newCheckin].sort(
          (a, b) => new Date(a.checkin_date) - new Date(b.checkin_date)
        )
      );

      setSaveMessage("Check-in saved successfully.");
    } catch (error) {
      setSaveMessage("Failed to connect to the server.");
    }
  };

  const tileClassName = ({ date: tileDate, view }) => {
    if (view !== "month") return "";

    const iso = normalizeDateOnly(tileDate);
    const checkin = checkins.find((item) => item.checkin_date === iso);

    if (!checkin) return "";

    const wellbeing = checkin.daily_wellbeing_result;

    if (wellbeing === "Good") return "wellbeing-positive";
    if (wellbeing === "Moderate") return "wellbeing-moderate";
    return "wellbeing-attention";
  };


  if (loading) {
    return (
      <div className="calendar-page">
        <div className="calendar-topbar">
          <button
            className="calendar-menu-button"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>

          <img src="/Logo.png" alt="SocioPulse Logo" className="calendar-topbar-logo-img" />

          <div className="calendar-profile-section">
            <span className="calendar-profile-name">{userName}</span>
            <div
              className="calendar-profile-icon"
              onClick={() => navigate("/profile")}
              style={{ cursor: "pointer" }}
              title="Open Profile"
            >
              👤
            </div>
          </div>
        </div>

        <p style={{ padding: "40px", textAlign: "center" }}>Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="calendar-page">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="calendar-topbar">
        <button
          className="calendar-menu-button"
          onClick={() => setSidebarOpen(true)}
        >
          ☰
        </button>

        <img src="/Logo.png" alt="SocioPulse Logo" className="calendar-topbar-logo-img" />

        <div className="calendar-profile-section">
          <span className="calendar-profile-name">{userName}</span>
          <div
            className="calendar-profile-icon"
            onClick={() => navigate("/profile")}
            style={{ cursor: "pointer" }}
            title="Open Profile"
          >
            👤
          </div>
        </div>
      </div>

      <div className="calendar-main">
        <div className="calendar-left-card">
          <div className="calendar-header-block">
            <h2>Daily Check-in Calendar</h2>
            <p>Select a day to add or review your wellbeing check-in.</p>
          </div>

          <Calendar
            onChange={setDate}
            value={date}
            tileClassName={tileClassName}
          />
        </div>

        <div className="calendar-right-card">
          <h3>Selected Day</h3>
          <p className="selected-date">{formatDateForDisplay(date)}</p>

          {selectedCheckin && (
            <>
              <div className="existing-entry">
                <p><strong>Screen Time:</strong> {selectedCheckin.screen_time}</p>
                <p><strong>Mood:</strong> {selectedCheckin.mood}</p>
                <p><strong>Before Bed:</strong> {selectedCheckin.before_bed}</p>
                <p><strong>Sleep Quality:</strong> {selectedCheckin.sleep_quality}</p>
                {selectedCheckin.anxiety_level && (
                  <p><strong>Anxiety Level:</strong> {selectedCheckin.anxiety_level}</p>
                )}
                {selectedCheckin.overwhelm_level && (
                  <p><strong>Overwhelm Level:</strong> {selectedCheckin.overwhelm_level}</p>
                )}
                <p><strong>Wellbeing:</strong> {selectedCheckin.daily_wellbeing_result}</p>
              </div>

              <p className="save-message">You have already completed a check-in for this day.</p>
            </>
          )}

      

          {!selectedCheckin && (
            <form className="checkin-form" onSubmit={handleSaveCheckin}>
              <label>Screen Time</label>
              <select
                name="screen_time"
                value={formData.screen_time}
                onChange={handleInputChange}
                required
              >
                <option value="">Select screen time</option>
                <option value="Less than 1 hour">Less than 1 hour</option>
                <option value="1–2 hours">1–2 hours</option>
                <option value="2–4 hours">2–4 hours</option>
                <option value="4–6 hours">4–6 hours</option>
                <option value="More than 6 hours">More than 6 hours</option>
              </select>

              <label>Mood</label>
              <select
                name="mood"
                value={formData.mood}
                onChange={handleInputChange}
                required
              >
                <option value="">Select mood</option>
                <option value="1">Very low</option>
                <option value="2">Low</option>
                <option value="3">Neutral</option>
                <option value="4">Good</option>
                <option value="5">Very good</option>
              </select>

              <label>Used Social Media Before Bed?</label>
              <select
                name="before_bed"
                value={formData.before_bed}
                onChange={handleInputChange}
                required
              >
                <option value="">Select option</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>

              <label>Sleep Quality</label>
              <select
                name="sleep_quality"
                value={formData.sleep_quality}
                onChange={handleInputChange}
                required
              >
                <option value="">Select sleep quality</option>
                <option value="1">Very poor</option>
                <option value="2">Poor</option>
                <option value="3">Average</option>
                <option value="4">Good</option>
                <option value="5">Very good</option>
              </select>

              <div className="mini-assessment-block">
                <h4>Mini Wellbeing Check</h4>
                <p>Add a little more context for a better daily wellbeing result.</p>

                <label>Anxiety Level</label>
                <select
                  name="anxiety_level"
                  value={formData.anxiety_level}
                  onChange={handleInputChange}
                >
                  <option value="">Optional</option>
                  <option value="1">Very low</option>
                  <option value="2">Low</option>
                  <option value="3">Moderate</option>
                  <option value="4">High</option>
                  <option value="5">Very high</option>
                </select>

                <label>Overwhelm Level</label>
                <select
                  name="overwhelm_level"
                  value={formData.overwhelm_level}
                  onChange={handleInputChange}
                >
                  <option value="">Optional</option>
                  <option value="1">Very low</option>
                  <option value="2">Low</option>
                  <option value="3">Moderate</option>
                  <option value="4">High</option>
                  <option value="5">Very high</option>
                </select>
              </div>

              <button type="submit" className="save-checkin-btn">
                Save Check-in
              </button>

              {saveMessage && <p className="save-message">{saveMessage}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
