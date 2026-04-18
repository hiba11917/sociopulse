import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./AssessmentPage.css";
import API_BASE from "../config/api";

export default function AssessmentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = localStorage.getItem("user_id");

  const [formData, setFormData] = useState({
    daily_usage: "",
    before_bed: "",
    negative_news: "",
    stressful_content: "",
    excluded_content: "",
    anxious_after_use: "",
    tired_after_use: "",
    mood_worsens: "",
    sleep_affected: "",
    adverse_interaction: ""
  });

  const [error, setError] = useState("");

  useEffect(() => {
    if (location.state?.message) {
      setError(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_BASE}/assessment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: userId,
          ...formData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Assessment failed");
      }

      localStorage.setItem("wellbeing_result", data.wellbeing_result);
      localStorage.setItem("assessment_completed", "true");
      navigate("/calendar");
    } catch (err) {
      setError(err.message || "Assessment failed");
    }
  };

  return (
    <div className="assessment-page">
      <div className="assessment-card">
        <img src="/Logo.png" alt="SocioPulse Logo" className="assessment-logo" />

        <h2 className="assessment-title">Wellbeing Assessment</h2>
        <p className="assessment-subtitle">
          Help SocioPulse understand your digital habits.
        </p>

        <form className="assessment-form" onSubmit={handleSubmit}>
          <select name="daily_usage" value={formData.daily_usage} onChange={handleChange} required>
            <option value="">Average daily social media usage</option>
            <option value="Less than 1 hour">Less than 1 hour</option>
            <option value="1–2 hours">1–2 hours</option>
            <option value="2–4 hours">2–4 hours</option>
            <option value="4–6 hours">4–6 hours</option>
            <option value="More than 6 hours">More than 6 hours</option>
          </select>

          <select name="before_bed" value={formData.before_bed} onChange={handleChange} required>
            <option value="">I check social media right before bed</option>
            <option value="1">1 - Never</option>
            <option value="2">2 - Rarely</option>
            <option value="3">3 - Sometimes</option>
            <option value="4">4 - Often</option>
            <option value="5">5 - Very Often</option>
          </select>

          <select name="negative_news" value={formData.negative_news} onChange={handleChange} required>
            <option value="">I often see negative news on social media</option>
            <option value="1">1 - Strongly Disagree</option>
            <option value="2">2 - Disagree</option>
            <option value="3">3 - Neutral</option>
            <option value="4">4 - Agree</option>
            <option value="5">5 - Strongly Agree</option>
          </select>

          <select name="stressful_content" value={formData.stressful_content} onChange={handleChange} required>
            <option value="">I see a lot of argumentative or stressful content</option>
            <option value="1">1 - Strongly Disagree</option>
            <option value="2">2 - Disagree</option>
            <option value="3">3 - Neutral</option>
            <option value="4">4 - Agree</option>
            <option value="5">5 - Strongly Agree</option>
          </select>

          <select name="excluded_content" value={formData.excluded_content} onChange={handleChange} required>
            <option value="">I see content that makes me feel excluded</option>
            <option value="1">1 - Strongly Disagree</option>
            <option value="2">2 - Disagree</option>
            <option value="3">3 - Neutral</option>
            <option value="4">4 - Agree</option>
            <option value="5">5 - Strongly Agree</option>
          </select>

          <select name="anxious_after_use" value={formData.anxious_after_use} onChange={handleChange} required>
            <option value="">I feel anxious after using social media</option>
            <option value="1">1 - Very Low</option>
            <option value="2">2 - Low</option>
            <option value="3">3 - Moderate</option>
            <option value="4">4 - High</option>
            <option value="5">5 - Very High</option>
          </select>

          <select name="tired_after_use" value={formData.tired_after_use} onChange={handleChange} required>
            <option value="">I feel drained after long social media sessions</option>
            <option value="1">1 - Very Low</option>
            <option value="2">2 - Low</option>
            <option value="3">3 - Moderate</option>
            <option value="4">4 - High</option>
            <option value="5">5 - Very High</option>
          </select>

          <select name="mood_worsens" value={formData.mood_worsens} onChange={handleChange} required>
            <option value="">My mood worsens on high usage days</option>
            <option value="1">1 - Very Low</option>
            <option value="2">2 - Low</option>
            <option value="3">3 - Moderate</option>
            <option value="4">4 - High</option>
            <option value="5">5 - Very High</option>
          </select>

          <select name="sleep_affected" value={formData.sleep_affected} onChange={handleChange} required>
            <option value="">Social media affects my sleep quality</option>
            <option value="1">1 - Very Low</option>
            <option value="2">2 - Low</option>
            <option value="3">3 - Moderate</option>
            <option value="4">4 - High</option>
            <option value="5">5 - Very High</option>
          </select>

          <select name="adverse_interaction" value={formData.adverse_interaction} onChange={handleChange} required>
            <option value="">Experienced adverse online interaction?</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>

          {error && <p style={{ color: "red", margin: "0" }}>{error}</p>}

          <button type="submit" className="assessment-button">
            Submit Assessment
          </button>
        </form>
      </div>
    </div>
  );
}
