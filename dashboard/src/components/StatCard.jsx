import React from "react";

const StatCard = ({ label, value, unit, trend, valueColor, isLive }) => {
  return (
    <div
      className="stat-card"
      style={{
        border: "1px solid var(--color-border)",
        padding: "var(--spacing-lg)",
        background: "rgba(255, 255, 255, 0.02)",
        flex: 1,
        position: "relative",
      }}
    >
      <div
        className="label text-dim uppercase flex items-center gap-sm"
        style={{
          fontSize: "0.8rem",
          letterSpacing: "1px",
          marginBottom: "var(--spacing-sm)",
        }}
      >
        {isLive && <div className="blink-dot" />}
        {label}
      </div>
      <div className="value flex items-baseline gap-md">
        <span
          style={{
            fontSize: "3rem",
            fontFamily: "'Press Start 2P', cursive",
            lineHeight: 1,
            color: valueColor || "inherit",
          }}
        >
          {value}
        </span>
        {trend && (
          <span className="text-primary" style={{ fontSize: "1rem" }}>
            {trend}
          </span>
        )}
        {unit && (
          <span className="text-dim" style={{ fontSize: "0.8rem" }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
