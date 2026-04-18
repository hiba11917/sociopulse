import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./LoginPage.css";
import API_BASE from "../config/api";

export default function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("user_id", String(data.user_id));
      localStorage.setItem("user_name", data.full_name);
      localStorage.setItem("user", JSON.stringify(data));

      console.log("Logged in user:", data);

      navigate("/home");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <img src="/Logo.png" alt="SocioPulse Logo" className="login-logo" />

        <h2 className="login-title">Welcome Back</h2>

        <p className="login-subtitle">
          Log in to continue your wellbeing journey.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
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

          {error && <p className="error">{error}</p>}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="login-footer">
          Don’t have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
