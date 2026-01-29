import React from "react";

const ContributionGraph = ({ data = [], dailyGoalHours = 3 }) => {
  // Mock data generation removed, using real data
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const weeks = 53;
  const days = 7;

  // Create a map of date -> timeSpent for quick lookup
  const dataMap = (data || []).reduce((acc, item) => {
    acc[item.date] = item.activity?.timeSpent || 0;
    return acc;
  }, {});

  // Timezone-safe local date formatter (YYYY-MM-DD)
  const localDateFormat = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const now = new Date();
  const currentYear = now.getFullYear();
  const startDate = new Date(currentYear, 0, 1);

  // Find the first Sunday of the year's first week
  const firstDay = new Date(startDate);
  firstDay.setDate(startDate.getDate() - startDate.getDay());

  const grid = [];
  const monthMarkers = [];
  let lastMonth = -1;
  let runningDay = new Date(firstDay);

  for (let w = 0; w < weeks; w++) {
    const week = [];
    for (let d = 0; d < days; d++) {
      const dateStr = localDateFormat(runningDay);

      // Track month labels
      if (
        runningDay.getFullYear() === currentYear &&
        runningDay.getMonth() !== lastMonth &&
        runningDay.getDate() <= 7
      ) {
        // Simple heuristic: if we see a new month in the first week of a column, mark it
        monthMarkers.push({
          name: months[runningDay.getMonth()],
          index: w,
        });
        lastMonth = runningDay.getMonth();
      }

      const isCurrentYear = runningDay.getFullYear() === currentYear;
      const timeSpentMinutes = isCurrentYear ? dataMap[dateStr] || 0 : 0;
      const timeSpentHours = timeSpentMinutes / 60;

      let level = 0;
      if (!isCurrentYear)
        level = -1; // Outside current year range
      else if (timeSpentHours >= dailyGoalHours) level = 1;
      else if (timeSpentHours >= dailyGoalHours / 2) level = 2;
      else if (timeSpentHours > 0) level = 3;

      week.push(level);
      runningDay.setDate(runningDay.getDate() + 1);
    }
    grid.push(week);
  }

  const getColor = (level) => {
    if (level === -1) return "transparent";
    switch (level) {
      case 1:
        return "#16a34a"; // Green (GOAL_MET)
      case 2:
        return "#facc15"; // Yellow (PARTIAL)
      case 3:
        return "#ef4444"; // Red (MINIMAL)
      default:
        return "#1f1f1f"; // Empty
    }
  };

  return (
    <div
      className="contribution-graph w-full"
      style={{
        border: "1px solid var(--color-border)",
        padding: "30px",
        marginTop: "var(--spacing-xl)",
        background: "#0a0a0a",
        position: "relative",
      }}
    >
      <div
        className="header flex justify-between items-center"
        style={{ marginBottom: "30px" }}
      >
        <div>
          <h3
            className="uppercase"
            style={{
              fontSize: "1.2rem",
              letterSpacing: "2px",
              fontFamily: "'Press Start 2P', cursive",
              marginBottom: "10px",
            }}
          >
            Yearly Activity Log
          </h3>
          <p
            className="text-dim uppercase text-xs"
            style={{ letterSpacing: "1px" }}
          >
            MATRIX ANALYSIS OF SYSTEM UPDATES / {currentYear}
          </p>
        </div>
        <div
          className="year text-primary text-xs uppercase"
          style={{ letterSpacing: "1px" }}
        >
          SESSION_SYNC [GOAL: {dailyGoalHours}H]
        </div>
      </div>

      <div
        className="graph-outer-container"
        style={{
          overflowX: "auto",
          position: "relative",
          paddingBottom: "10px",
        }}
      >
        <div className="flex" style={{ gap: "15px" }}>
          {/* Day Labels */}
          <div
            className="day-labels flex-col text-dim font-mono"
            style={{
              paddingTop: "35px", // Match Month Row (25px) + its margin (10px)
              gap: "3px",
              width: "45px",
              paddingRight: "10px",
            }}
          >
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
              <span
                key={day}
                style={{
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                  height: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  marginBottom: "3px",
                  color: "#ffffff",
                }}
              >
                {day}
              </span>
            ))}
          </div>

          <div className="grid-content-wrapper">
            {/* Month Row */}
            <div
              className="months-row flex"
              style={{
                height: "25px",
                position: "relative",
                marginBottom: "10px",
              }}
            >
              {monthMarkers.map((m, i) => (
                <span
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${m.index * 19}px`, // (16px width + 3px gap)
                    fontSize: "1rem",
                    fontWeight: "bold",
                    color: "var(--color-primary)",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                  }}
                >
                  {m.name}
                </span>
              ))}
            </div>

            {/* The Grid */}
            <div className="grid flex" style={{ gap: "3px" }}>
              {grid.map((week, i) => (
                <div key={i} className="week-col flex-col" style={{ gap: "0" }}>
                  {week.map((level, j) => (
                    <div
                      key={`${i}-${j}`}
                      style={{
                        width: "16px",
                        height: "16px",
                        backgroundColor: getColor(level),
                        borderRadius: "1px",
                        marginBottom: "3px",
                        transition: "transform 0.1s ease",
                      }}
                      title={`Activity level: ${level}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className="footer flex justify-between items-center text-dim uppercase"
        style={{ marginTop: "30px", fontSize: "0.7rem", letterSpacing: "1px" }}
      >
        <div className="legend flex items-center gap-xs">
          SCALE:
          <div
            className="flex gap-xs"
            style={{ marginLeft: "10px", gap: "4px" }}
          >
            {[0, 3, 2, 1].map((l) => (
              <div
                key={l}
                style={{
                  width: "12px",
                  height: "12px",
                  background: getColor(l),
                  borderRadius: "1px",
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: "0.6rem", marginLeft: "5px" }}>
            EMPTY &gt; RED (MIN) &gt; YELLOW (PART) &gt; GREEN (GOAL)
          </span>
        </div>
        <div className="actions flex gap-md">
          <span>SYNC</span>
          <span>REPORT</span>
          <span>TERMINAL</span>
        </div>
      </div>
    </div>
  );
};

export default ContributionGraph;
