import React from "react";

const StatCard = ({ label, value, unit, trend, valueColor, isLive }) => {
  return (
    <div className="stat-card">
      <div className="label text-dim uppercase flex items-center gap-sm">
        {isLive && <div className="blink-dot" />}
        {label}
      </div>
      <div className="stat-value">
        <span style={{ color: valueColor || "inherit" }}>{value}</span>
        {trend && <span className="text-primary">{trend}</span>}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
    </div>
  );
};

export default StatCard;
