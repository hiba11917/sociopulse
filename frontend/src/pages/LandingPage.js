import React from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="landing-glow landing-glow-1"></div>
      <div className="landing-glow landing-glow-2"></div>

      <div className="landing-card">
        <div className="logo-section">
       <img src="/Logo.png" alt="SocioPulse Logo" className="landing-logo"/>
        </div>

        <p className="byline">"Understand how your online world shapes your wellbeing."</p>

        <p className="tagline">
          A social media wellbeing app designed to help you track digital habits,
          recognise emotional patterns, and build healthier online behaviour.
        </p>

        <p className="description">
          SocioPulse transforms your social media behaviour into meaningful
          wellbeing insights by analysing screen time, exposure to negative
          content, emotional impact, and daily digital habits.
        </p>

        <div className="buttons">
          <button className="signup" onClick={() => navigate("/signup")}>
            Sign Up
          </button>

          <button className="login" onClick={() => navigate("/login")}>
            Log In
          </button>
        </div>
      </div>
    </div>
  );
}