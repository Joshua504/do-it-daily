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
      <div className="nav-pill uppercase bold">
        <Link to="/dashboard" className="nav-item">
          <FaUser size={14} />
          <span>{username || "ANONYMOUS"}</span>
        </Link>
        <div className="nav-divider"></div>
        <div className="nav-item">
          <FaCalendarDay size={14} />
          <span>{dateString}</span>
        </div>
        <div className="nav-divider"></div>
        <div className="nav-item">
          <FaCode size={16} />
          <span>FULLSTACK</span>
        </div>
        <div className="nav-divider"></div>
        <div className="nav-item">
          <FaCircle
            size={10}
            style={{ color: isCurrentlyActive ? "#16a34a" : "#ef4444" }}
          />
          <span>{isCurrentlyActive ? "ACTIVE" : "IDLE"}</span>
        </div>
        <div className="nav-divider"></div>
        <Link to="/settings" className="nav-item">
          <FaCog size={16} />
          <span>SETTINGS</span>
        </Link>
        <div className="nav-divider"></div>
        <div onClick={handleLogout} className="nav-item">
          <span>LOGOUT</span>
          <FaSignOutAlt size={14} />
        </div>
      </div>
    </header>
  );
};

export default Header;
