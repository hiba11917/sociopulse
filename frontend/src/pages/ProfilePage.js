import React, { useEffect, useState } from "react";
import "./ProfilePage.css";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import API_BASE from "../config/api";

function calculateAge(dobValue) {
  if (!dobValue) return "Not available";

  const dob = new Date(dobValue);
  const today = new Date();

  if (Number.isNaN(dob.getTime())) return "Not available";

  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dob.getDate())
  ) {
    age -= 1;
  }

  return `${age} years`;
}

function ProfilePage() {
  const navigate = useNavigate();

  const userId = localStorage.getItem("user_id");
  const storedUserName =
    localStorage.getItem("user_name") ||
    localStorage.getItem("full_name") ||
    "User";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (!userId) {
        setError("No user found. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/profile/${userId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load profile.");
        }

        setProfile(data);
      } catch (err) {
        setError(err.message || "Could not load profile.");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [userId]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const handleDeleteAccount = async () => {
    if (!userId) {
      setActionError("No user found. Please log in again.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete your account?\n\nThis will permanently remove your profile, assessments, daily check-ins, and completed goals."
    );

    if (!confirmed) return;

    setDeleting(true);
    setActionError("");

    try {
      const response = await fetch(`${API_BASE}/profile/${userId}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete account.");
      }

      localStorage.clear();
      window.location.href = "/";
    } catch (err) {
      setActionError(err.message || "Could not delete account.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="profile-page">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="profile-topbar">
        <button
          className="profile-menu-button"
          onClick={() => setSidebarOpen(true)}
        >
          ☰
        </button>

        <img
          src="/Logo.png"
          alt="SocioPulse Logo"
          className="profile-topbar-logo"
        />

        <div className="profile-topbar-user">
          <span className="profile-topbar-name">
            {profile?.full_name || storedUserName}
          </span>
          <div className="profile-topbar-icon" title="Profile">
            👤
          </div>
        </div>
      </div>

      <div className="profile-content">
        {loading ? (
          <div className="profile-card">
            <p>Loading profile...</p>
          </div>
        ) : error ? (
          <div className="profile-card error-card">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="profile-hero-card">
              <div className="profile-avatar">
                {(profile?.full_name || storedUserName).charAt(0).toUpperCase()}
              </div>

              <div className="profile-hero-text">
                <h2>{profile?.full_name || storedUserName}</h2>
                <p>{profile?.email || "No email available"}</p>
              </div>
            </div>

            <div className="profile-details-grid">
              <div className="profile-info-card">
                <h3>Personal Details</h3>

                <div className="profile-detail-row">
                  <span>Full Name</span>
                  <strong>{profile?.full_name || storedUserName}</strong>
                </div>

                <div className="profile-detail-row">
                  <span>Email</span>
                  <strong>{profile?.email || "Not available"}</strong>
                </div>

                <div className="profile-detail-row">
                  <span>Age</span>
                  <strong>{calculateAge(profile?.dob)}</strong>
                </div>

                <div className="profile-detail-row">
                  <span>Gender</span>
                  <strong>{profile?.gender || "Not available"}</strong>
                </div>

                <div className="profile-detail-row">
                  <span>Occupation</span>
                  <strong>{profile?.occupation || "Not available"}</strong>
                </div>
              </div>

              <div className="profile-info-card">
                <h3>Quick Actions</h3>
                <p className="profile-info-text">
                  You can return to your dashboard, log out, or permanently
                  delete your account and associated data from here.
                </p>

                <button
                  className="profile-action-btn secondary"
                  onClick={() => navigate("/home")}
                  disabled={deleting}
                >
                  Go to Home
                </button>

                <button
                  className="profile-action-btn danger"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  {deleting ? "Deleting Account..." : "Delete Account"}
                </button>

                <button
                  className="profile-action-btn"
                  onClick={handleLogout}
                  disabled={deleting}
                >
                  Logout
                </button>

                {actionError && (
                  <p className="profile-action-error">{actionError}</p>
                )}

                <p className="profile-warning-text">
                  Deleting your account is permanent and cannot be undone.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
