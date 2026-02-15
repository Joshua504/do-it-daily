import React from "react";

const StatCard = ({ label, value, unit, trend, valueColor, isLive }) => {
  return (
    <div className="stat-card">
      <h3 className="stat-label text-dim uppercase flex items-center gap-sm">
        {isLive && <div className="blink-dot" />}
        <span>{label}</span>
      </h3>
      <div className="stat-value">
        <span className="number" style={{ color: valueColor || "inherit" }}>
          {value}
        </span>
        {trend && <span className="trend-icon text-primary">{trend}</span>}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
    </div>
  );
};

export default StatCard;
