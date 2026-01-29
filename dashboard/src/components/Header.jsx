import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaCalendarDay,
  FaCode,
  FaCog,
  FaSignOutAlt,
  FaCircle,
} from "react-icons/fa";
// GoPrimitiveDot removed
import "../styles/theme.css";

const Header = ({ setIsAuthenticated, username, isCurrentlyActive }) => {
  const navigate = useNavigate();
  const currentDate = new Date();
  const month = currentDate
    .toLocaleString("default", { month: "short" })
    .toUpperCase();
  const year = currentDate.getFullYear().toString().substr(-2);
  const dateString = `${month}/${year}`;

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    if (setIsAuthenticated) {
      setIsAuthenticated(false);
    }
    navigate("/login");
  };

  return (
    <header
      className="header container flex justify-center"
      style={{
        padding: "var(--spacing-xl) 0",
        marginBottom: "var(--spacing-md)",
      }}
    >
      <div
        className="nav-pill flex items-center uppercase bold"
        style={{
          background: "var(--color-secondary)",
          color: "var(--color-bg)",
          borderRadius: "50px",
          padding: "12px 10px",
          width: "100%",
          maxWidth: "900px",
          fontSize: "0.85rem",
          letterSpacing: "1px",
          boxShadow: "0 4px 0 rgba(0,0,0,0.5)",
        }}
      >
        <Link
          to="/dashboard"
          className="nav-item flex items-center justify-center gap-sm cursor-pointer hover:opacity-75"
          style={{ flex: 1, textDecoration: "none", color: "inherit" }}
        >
          <FaUser size={14} />
          <span>{username || "ANONYMOUS"}</span>
        </Link>
        <div
          className="divider"
          style={{
            width: "1px",
            height: "15px",
            background: "rgba(0,0,0,0.2)",
            flexShrink: 0,
          }}
        ></div>
        <div
          className="nav-item flex items-center justify-center gap-sm"
          style={{ flex: 1 }}
        >
          <FaCalendarDay size={14} />
          <span>{dateString}</span>
        </div>
        <div
          className="divider"
          style={{
            width: "1px",
            height: "15px",
            background: "rgba(0,0,0,0.2)",
            flexShrink: 0,
          }}
        ></div>
        <div
          className="nav-item flex items-center justify-center gap-sm"
          style={{ flex: 1 }}
        >
          <FaCode size={16} />
          <span>FULLSTACK</span>
        </div>
        <div
          className="divider"
          style={{
            width: "1px",
            height: "15px",
            background: "rgba(0,0,0,0.2)",
            flexShrink: 0,
          }}
        ></div>
        <div
          className="nav-item flex items-center justify-center gap-sm"
          style={{ flex: 1 }}
        >
          <FaCircle
            size={10}
            style={{ color: isCurrentlyActive ? "#16a34a" : "#ef4444" }}
          />
          <span>{isCurrentlyActive ? "ACTIVE" : "IDLE"}</span>
        </div>
        <div
          className="divider"
          style={{
            width: "1px",
            height: "15px",
            background: "rgba(0,0,0,0.2)",
            flexShrink: 0,
          }}
        ></div>
        <Link
          to="/settings"
          className="nav-item flex items-center justify-center gap-sm cursor-pointer hover:opacity-75"
          style={{ flex: 1, textDecoration: "none", color: "inherit" }}
        >
          <FaCog size={16} />
          <span>SETTINGS</span>
        </Link>
        <div
          className="divider"
          style={{
            width: "1px",
            height: "15px",
            background: "rgba(0,0,0,0.2)",
            flexShrink: 0,
          }}
        ></div>
        <div
          onClick={handleLogout}
          className="nav-item flex items-center justify-center gap-sm cursor-pointer hover:opacity-75"
          style={{ flex: 1 }}
        >
          <span>LOGOUT</span>
          <FaSignOutAlt size={14} />
        </div>
      </div>
    </header>
  );
};

export default Header;
