import React, { useState, useEffect } from "react";
import { FaCode, FaShapes, FaFolder, FaHistory } from "react-icons/fa";
import axios from "axios";
import config from "../config";
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

  // Removed Live Timer Effect as per user request to only update every minute

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        `${config.API_BASE_URL}/api/productivity/stats/me?days=365`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setStats(response.data);

      // Find today's data specifically (fallback to first record if dates match)
      const todayStr = new Date().toISOString().split("T")[0];
      const todayData = response.data.recentData?.find(
        (d) => d.date === todayStr,
      );

      if (todayData) {
        setSessionSeconds(todayData.activity?.timeSpent || 0);
      } else {
        setSessionSeconds(0); // No data for today yet
      }

      console.log(
        "[Dashboard] Stats fetched:",
        todayData ? "Today found" : "Today not found",
      );
    } catch (err) {
      console.error("Failed to fetch stats", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        `${config.API_BASE_URL}/api/system/logs`,
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
      <div className="logo-section">
        <h1 className="logo">DO IT DAILY</h1>
      </div>

      <Header
        setIsAuthenticated={setIsAuthenticated}
        username={username}
        isCurrentlyActive={stats?.isCurrentlyActive}
      />

      <main className="container">
        <div className="stats-cards mb-xl">
          <StatCard
            label="Total Contributions"
            value={stats?.totalContributions?.toLocaleString() || "0"}
            trend="↗"
          />
          <StatCard
            label="Active Session"
            value={formatTimer(sessionSeconds)}
            unit="HH:MM"
            valueColor="var(--color-primary)"
            isLive={stats?.isCurrentlyActive}
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
          <h3 className="section-title uppercase flex items-center gap-sm mb-lg">
            <span className="text-primary">☘</span> Download Extensions
          </h3>
          <div className="extensions-grid">
            <div className="extension-card">
              <div className="flex items-center gap-lg">
                <div className="ext-icon vscode">
                  <FaCode size={24} />
                </div>
                <div>
                  <div className="uppercase bold text-sm">VS CODE</div>
                  <div className="ext-desc">
                    PIXEL-LOG SYSTEM INTEGRATION V1.2
                  </div>
                </div>
              </div>
              <div className="mt-sm">
                <span className="badge">COMING SOON</span>
              </div>
            </div>

            <div className="extension-card">
              <div className="flex items-center gap-lg">
                <div className="ext-icon figma">
                  <FaShapes size={24} />
                </div>
                <div>
                  <div className="uppercase bold text-sm">FIGMA</div>
                  <div className="ext-desc">VECTOR PIXEL ASSETS BRIDGE</div>
                </div>
              </div>
              <div className="mt-sm">
                <span className="badge">COMING SOON</span>
              </div>
            </div>
          </div>
        </div>

        <div className="graph-scroll-container">
          <ContributionGraph
            data={stats?.recentData || []}
            dailyGoalHours={stats?.dailyGoalHours || 3}
          />
        </div>

        <div className="active-repos flex mt-xl">
          <div className="repos-section">
            <h3 className="section-title uppercase flex items-center gap-sm mb-lg">
              <span className="text-secondary">◈</span> Top Repositories
            </h3>
            <div className="repos-list">
              {(stats?.topRepos || []).length > 0 ? (
                stats.topRepos.map((repo, i) => (
                  <div key={repo.name} className="repo-item">
                    <div className="flex items-center gap-md">
                      <span className="repo-num">0{i + 1}</span>
                      <div className="repo-info">
                        <h4 className="name uppercase bold">{repo.name}</h4>
                        <p className="meta text-dim text-xs uppercase">
                          {Math.floor(repo.timeSpent / 3600)}H{" "}
                          {Math.floor((repo.timeSpent % 3600) / 60)}M SPENT /{" "}
                          {repo.filesEdited} FILES
                        </p>
                      </div>
                    </div>
                    <div className="repo-arrow">→</div>
                  </div>
                ))
              ) : (
                <div className="text-dim uppercase text-xs p-lg border border-dashed border-dim text-center">
                  NO ACTIVE REPOSITORIES DETECTED
                </div>
              )}
            </div>
          </div>

          <div className="system-logs">
            <h3 className="section-title uppercase flex items-center gap-sm mb-lg">
              <FaHistory color="#ef4444" /> SYSTEM_LOGS
            </h3>
            <div className="logs-list">
              {logs.length > 0 ? (
                logs.slice(0, 3).map((log) => (
                  <div key={log.id} className={`log-item ${log.type}`}>
                    <div className="flex items-center justify-between mb-xs">
                      <div className={`log-dot ${log.type}`} />
                      <span className="text-dim text-2xs">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="message uppercase text-xs">
                      {log.message}
                    </div>
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
