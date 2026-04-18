import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./SignupPage.css";
import API_BASE from "../config/api";

export default function SignupPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    dob: "",
    gender: "",
    occupation: "",
    agreedToPrivacy: false
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.agreedToPrivacy) {
      setError("You must agree to the Privacy Policy before signing up.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("full_name", data.full_name);

      navigate("/assessment");
    } catch (err) {
      setError(err.message || "Signup failed");
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        <img src="/Logo.png" alt="SocioPulse Logo" className="signup-logo" />

        <h2 className="signup-title">Create Your Account</h2>
        <p className="signup-subtitle">
          Start your wellbeing journey with SocioPulse.
        </p>

        <form className="signup-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <input
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            required
          />

          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
          >
            <option value="">Select Gender</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>

          <select
            name="occupation"
            value={formData.occupation}
            onChange={handleChange}
            required
          >
            <option value="">Select Occupation</option>
            <option value="Student">Student</option>
            <option value="Employed (Full-time)">Employed (Full-time)</option>
            <option value="Employed (Part-time)">Employed (Part-time)</option>
            <option value="Unemployed">Unemployed</option>
            <option value="Other">Other</option>
          </select>

          <label className="signup-checkbox">
            <input
              type="checkbox"
              name="agreedToPrivacy"
              checked={formData.agreedToPrivacy}
              onChange={handleChange}
              required
            />
            <span>
              I confirm that I have read and agree to SocioPulse's <Link to="/privacy-policy">Privacy Policy</Link>.
            </span>
          </label>

          {error && <p className="signup-error">{error}</p>}

          <button
            type="submit"
            className="signup-button"
            disabled={!formData.agreedToPrivacy}
          >
            Continue
          </button>
        </form>

        <p className="signup-footer">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </div>
    </div>
  );
}
