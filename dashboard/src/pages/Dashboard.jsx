import React, { useState, useEffect } from "react";
import { FaCode, FaShapes, FaFolder, FaHistory } from "react-icons/fa";
import axios from "axios";
import Layout from "../components/Layout";
import Header from "../components/Header";
import StatCard from "../components/StatCard";
import ContributionGraph from "../components/ContributionGraph";
import "./Dashboard.css";

const Dashboard = ({ setIsAuthenticated, username }) => {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  useEffect(() => {
    fetchStats();
    fetchLogs();
    // Poll every minute for updates
    const interval = setInterval(() => {
      fetchStats();
      fetchLogs();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Live Timer Effect
  useEffect(() => {
    const timer = setInterval(() => {
      if (stats?.isCurrentlyActive) {
        setSessionSeconds((prev) => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [stats?.isCurrentlyActive]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        "http://localhost:3000/api/productivity/stats/me?days=365",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setStats(response.data);

      // Update local baseline from today's actual data
      const today = response.data.recentData?.[0];
      if (today) {
        setSessionSeconds((today.activity?.timeSpent || 0) * 60);
      }
    } catch (err) {
      console.error("Failed to fetch stats", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        "http://localhost:3000/api/system/logs",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.data.success) {
        setLogs(response.data.logs);
      }
    } catch (err) {
      console.error("Failed to fetch logs", err);
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case "sync":
        return "#16a34a";
      case "auth":
        return "#facc15";
      case "error":
        return "#ef4444";
      default:
        return "#3b82f6";
    }
  };

  return (
    <Layout>
      {/* DO IT DAILY Logo centered above header */}
      <div
        className="logo-section text-center mb-md"
        style={{ paddingTop: "var(--spacing-lg)" }}
      >
        <h1
          style={{
            fontFamily: "var(--font-logo)",
            fontSize: "3.5rem",
            letterSpacing: "-2px",
          }}
        >
          DO IT DAILY
        </h1>
      </div>

      <Header
        setIsAuthenticated={setIsAuthenticated}
        username={username}
        isCurrentlyActive={stats?.isCurrentlyActive}
      />

      <main className="container">
        <div
          className="flex gap-md mb-xl"
          style={{
            borderTop: "1px solid var(--color-border)",
            paddingTop: "var(--spacing-xl)",
          }}
        >
          <StatCard
            label="Total Contributions"
            value={stats?.totalContributions?.toLocaleString() || "0"}
            trend="↗"
          />
          <StatCard
            label="Active Session"
            value={formatTimer(sessionSeconds)}
            unit="HH:MM:SS"
            valueColor="var(--color-primary)"
            isLive
          />
          <StatCard
            label="Longest Streak"
            value={stats?.longestStreak || "0"}
            unit="DAYS"
            valueColor="#facc15"
          />
          <StatCard
            label="Current Streak"
            value={stats?.currentStreak || "0"}
            unit="DAYS"
            valueColor="#ef4444"
          />
        </div>

        <div className="section mb-xl">
          <h3
            className="section-title uppercase flex items-center gap-sm mb-lg"
            style={{ fontSize: "1.2rem" }}
          >
            <span className="text-primary">☘</span> Download Extensions
          </h3>
          <div className="flex gap-lg">
            <div
              className="card flex justify-between items-center w-full"
              style={{
                border: "1px solid var(--color-border)",
                padding: "30px",
                background: "#0a0a0a",
              }}
            >
              <div className="flex items-center gap-lg">
                <div
                  className="icon-box flex justify-center items-center"
                  style={{
                    width: "60px",
                    height: "60px",
                    background: "#1e1e1e",
                  }}
                >
                  <FaCode size={30} color="#3b82f6" />
                </div>
                <div>
                  <div
                    className="uppercase bold"
                    style={{
                      fontSize: "1.2rem",
                      letterSpacing: "2px",
                      marginBottom: "5px",
                    }}
                  >
                    VS CODE
                  </div>
                  <div
                    className="text-dim text-xs uppercase"
                    style={{ letterSpacing: "1px" }}
                  >
                    PIXEL-LOG SYSTEM INTEGRATION V1.2
                  </div>
                </div>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--color-primary)",
                    fontWeight: "bold",
                    fontFamily: "var(--font-mono)",
                    border: "1px solid var(--color-primary)",
                    padding: "4px 8px",
                    borderRadius: "4px",
                  }}
                >
                  COMING SOON
                </span>
              </div>
            </div>

            <div
              className="card flex justify-between items-center w-full"
              style={{
                border: "1px solid var(--color-border)",
                padding: "30px",
                background: "#0a0a0a",
              }}
            >
              <div className="flex items-center gap-lg">
                <div
                  className="icon-box flex justify-center items-center"
                  style={{
                    width: "60px",
                    height: "60px",
                    background: "#1e1e1e",
                  }}
                >
                  <FaShapes size={30} color="#a855f7" />
                </div>
                <div>
                  <div
                    className="uppercase bold"
                    style={{
                      fontSize: "1.2rem",
                      letterSpacing: "2px",
                      marginBottom: "5px",
                    }}
                  >
                    FIGMA
                  </div>
                  <div
                    className="text-dim text-xs uppercase"
                    style={{ letterSpacing: "1px" }}
                  >
                    VECTOR PIXEL ASSETS BRIDGE
                  </div>
                </div>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--color-primary)",
                    fontWeight: "bold",
                    fontFamily: "var(--font-mono)",
                    border: "1px solid var(--color-primary)",
                    padding: "4px 8px",
                    borderRadius: "4px",
                  }}
                >
                  COMING SOON
                </span>
              </div>
            </div>
          </div>
        </div>

        <ContributionGraph
          data={stats?.recentData || []}
          dailyGoalHours={stats?.dailyGoalHours || 3}
        />

        <div
          className="active-repos flex mt-xl"
          style={{ marginTop: "var(--spacing-xl)", gap: "80px" }}
        >
          <div className="repos w-full" style={{ flex: 1 }}>
            <h3
              className="uppercase flex items-center gap-sm mb-lg"
              style={{
                fontSize: "1.2rem",
                fontFamily: "'Press Start 2P', cursive",
              }}
            >
              <FaFolder color="#facc15" /> ACTIVE_REPOS
            </h3>
            <div className="repo-list flex-col gap-md">
              {(stats?.topRepos || []).length > 0 ? (
                stats.topRepos.map((repo, i) => (
                  <div
                    key={repo.name}
                    className="repo-item flex justify-between items-center"
                    style={{
                      border: "1px solid var(--color-border)",
                      padding: "20px",
                      background: "#0a0a0a",
                    }}
                  >
                    <div className="flex items-center gap-md">
                      <span
                        className="text-dim font-mono"
                        style={{ fontSize: "0.8rem" }}
                      >
                        0{i + 1}
                      </span>
                      <div>
                        <div
                          className="name uppercase bold"
                          style={{ letterSpacing: "1px", marginBottom: "4px" }}
                        >
                          {repo.name}
                        </div>
                        <div className="meta text-dim text-xs uppercase">
                          {Math.floor(repo.timeSpent / 60)}H{" "}
                          {repo.timeSpent % 60}M SPENT / {repo.filesEdited}{" "}
                          FILES
                        </div>
                      </div>
                    </div>
                    <div className="text-dim">→</div>
                  </div>
                ))
              ) : (
                <div className="text-dim uppercase text-xs p-lg border border-dashed border-dim text-center">
                  NO ACTIVE REPOSITORIES DETECTED
                </div>
              )}
            </div>
          </div>

          <div className="system-logs w-full" style={{ flex: 1 }}>
            <h3
              className="uppercase flex items-center gap-sm mb-lg"
              style={{
                fontSize: "1.2rem",
                fontFamily: "'Press Start 2P', cursive",
              }}
            >
              <FaHistory color="#ef4444" /> SYSTEM_LOGS
            </h3>
            <div className="logs text-xs font-mono">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="log-item mb-md p-sm"
                    style={{
                      borderLeft: `2px solid ${getLogColor(log.type)}`,
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-xs">
                      <span style={{ color: getLogColor(log.type) }}>
                        [{log.type.toUpperCase()}]
                      </span>
                      <span className="text-dim" style={{ fontSize: "0.9rem" }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="message uppercase">{log.message}</div>
                  </div>
                ))
              ) : (
                <div className="text-dim uppercase text-center p-lg border border-dashed border-dim">
                  AWAITING SYSTEM UPDATES...
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default Dashboard;
