import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: "Home", path: "/home" },
    { name: "Calendar", path: "/calendar" },
    { name: "Goals", path: "/goals" },
    { name: "Rewards", path: "/rewards" },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}

      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <img src="/Logo.png" alt="logo" className="sidebar-logo" />
          <button onClick={onClose}>✕</button>
        </div>

        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={location.pathname === item.path ? "active" : ""}
            onClick={onClose}
          >
            {item.name}
          </Link>
        ))}

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </>
  );
}
