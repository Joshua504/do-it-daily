import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaKey, FaCopy, FaCheck, FaTrash } from "react-icons/fa";
import axios from "axios";
import config from "../config";
import Layout from "../components/Layout";
import Header from "../components/Header";

const Settings = ({ setIsAuthenticated, username }) => {
  const [keys, setKeys] = useState([]);
  const [profile, setProfile] = useState({ dailyGoalHours: 3 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [updatingGoal, setUpdatingGoal] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchKeys();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        `${config.API_BASE_URL}/api/user/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.data.success) {
        setProfile(response.data.profile);
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };

  const handleUpdateGoal = async () => {
    setUpdatingGoal(true);
    try {
      const token = localStorage.getItem("authToken");
      await axios.patch(
        `${config.API_BASE_URL}/api/user/profile`,
        { dailyGoalHours: profile.dailyGoalHours },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Daily goal updated successfully!");
    } catch (err) {
      console.error("Failed to update goal", err);
    } finally {
      setUpdatingGoal(false);
    }
  };

  const fetchKeys = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(`${config.API_BASE_URL}/api/keys`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setKeys(response.data.keys);
      }
    } catch (err) {
      console.error("Failed to fetch keys", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async (name) => {
    setGenerating(true);
    setNewKey(null);
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.post(
        `${config.API_BASE_URL}/api/keys/generate`,
        { displayName: name },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.data.success) {
        setNewKey(response.data.key);
        fetchKeys();
      }
    } catch (err) {
      console.error("Failed to generate key", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleRevokeKey = async (id) => {
    if (!window.confirm("Are you sure you want to revoke this token?")) return;
    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(`${config.API_BASE_URL}/api/keys/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchKeys();
    } catch (err) {
      console.error("Failed to revoke key", err);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const vscodeKey = keys.find((k) => k.displayName === "VS Code Extension");

  return (
    <Layout>
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

      <Header setIsAuthenticated={setIsAuthenticated} username={username} />

      <main className="container" style={{ maxWidth: "900px" }}>
        <div
          className="section-title flex items-center gap-sm mb-lg text-primary"
          style={{ marginTop: "var(--spacing-xl)" }}
        >
          <FaKey />
          <span className="uppercase bold" style={{ letterSpacing: "2px" }}>
            EXTENSION TOKEN SETTINGS
          </span>
        </div>

        <div
          className="settings-card"
          style={{
            border: "1px solid var(--color-border)",
            padding: "40px",
            background: "#0a0a0a",
            position: "relative",
          }}
        >
          <div
            className="accent-bar"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "4px",
              background: "var(--color-primary)",
            }}
          ></div>

          <h2
            className="uppercase text-primary mb-sm"
            style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: "1.2rem",
            }}
          >
            Access Tokens
          </h2>
          <p
            className="text-dim uppercase text-xs mb-xl"
            style={{ letterSpacing: "1px" }}
          >
            GENERATE UNIQUE KEYS TO SYNC YOUR ACTIVITY ACROSS YOUR DEVELOPMENT
            TOOLS.
          </p>

          {/* Daily Goal Setting */}
          <div className="token-section mb-xl">
            <div className="flex justify-between items-center mb-sm">
              <div className="flex items-center gap-sm">
                <div
                  style={{
                    background: "var(--color-primary)",
                    padding: "4px",
                    color: "black",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                  }}
                >
                  GOAL
                </div>
                <h3
                  className="uppercase bold"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "1rem" }}
                >
                  Personal Activity Target
                </h3>
              </div>
              <button
                onClick={handleUpdateGoal}
                disabled={updatingGoal}
                className="uppercase text-xs bold"
                style={{
                  border: "1px solid var(--color-primary)",
                  padding: "8px 16px",
                  color: "var(--color-primary)",
                  letterSpacing: "1px",
                  opacity: updatingGoal ? 0.5 : 1,
                }}
              >
                {updatingGoal ? "Updating..." : "Update Goal"}
              </button>
            </div>
            <p
              className="text-dim text-xs uppercase mb-md"
              style={{ maxWidth: "500px" }}
            >
              SET YOUR DAILY WORKING HOURS TARGET. THE DASHBOARD WILL COLOR-CODE
              YOUR PROGRESS BASED ON THIS VALUE.
            </p>

            <div
              className="input-field flex items-center gap-md"
              style={{
                background: "#111",
                border: "1px solid #333",
                padding: "12px",
                fontFamily: "monospace",
              }}
            >
              <input
                type="number"
                min="1"
                max="24"
                value={profile.dailyGoalHours}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    dailyGoalHours: parseInt(e.target.value) || 1,
                  })
                }
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-primary)",
                  fontSize: "1.2rem",
                  width: "60px",
                  textAlign: "center",
                  outline: "none",
                }}
              />
              <span className="uppercase text-dim text-xs">Hours Per Day</span>
            </div>
          </div>

          {/* VS Code Token */}
          <div className="token-section mb-xl">
            <div className="flex justify-between items-center mb-sm">
              <div className="flex items-center gap-sm">
                <div
                  style={{
                    background: "#007ACC",
                    padding: "4px",
                    color: "white",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                  }}
                >
                  &lt;/&gt;
                </div>
                <h3
                  className="uppercase bold"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "1rem" }}
                >
                  VS Code Extension Token
                </h3>
              </div>
              <button
                onClick={() => handleGenerateKey("VS Code Extension")}
                disabled={generating}
                className="uppercase text-xs bold"
                style={{
                  border: "1px solid white",
                  padding: "8px 16px",
                  color: "white",
                  letterSpacing: "1px",
                  opacity: generating ? 0.5 : 1,
                }}
              >
                {generating ? "Generating..." : "Generate Token"}
              </button>
            </div>
            <p
              className="text-dim text-xs uppercase mb-md"
              style={{ maxWidth: "400px" }}
            >
              PERMITS SECURE CONNECTION BETWEEN THE LOCAL EDITOR AND YOUR
              PIXEL-LOG DASHBOARD.
            </p>

            {newKey && (
              <div
                className="new-key-display mb-md"
                style={{
                  background: "#16a34a22",
                  border: "1px solid #16a34a",
                  padding: "15px",
                }}
              >
                <div
                  className="text-xs uppercase bold mb-xs"
                  style={{ color: "#16a34a" }}
                >
                  New Key Generated (Save it now!):
                </div>
                <div className="flex items-center justify-between font-mono text-sm">
                  <span style={{ color: "#4ade80" }}>{newKey}</span>
                  <FaCopy
                    className="cursor-pointer hover:text-white"
                    onClick={() => copyToClipboard(newKey)}
                  />
                </div>
              </div>
            )}

            <div
              className="input-field flex items-center justify-between"
              style={{
                background: "#111",
                border: "1px solid #333",
                padding: "12px",
                color: vscodeKey ? "#4ade80" : "#555",
                fontFamily: "monospace",
              }}
            >
              <span>
                {vscodeKey ? "ACTIVE_TOKEN_SECURED" : "................."}
              </span>
              {vscodeKey ? (
                <div className="flex gap-md items-center">
                  <span className="text-xs text-dim">
                    LAST USED:{" "}
                    {vscodeKey.lastUsed
                      ? new Date(vscodeKey.lastUsed).toLocaleDateString()
                      : "NEVER"}
                  </span>
                  <FaTrash
                    className="cursor-pointer text-dim hover:text-red-500"
                    onClick={() => handleRevokeKey(vscodeKey.id)}
                  />
                  <FaCheck className="text-primary" />
                </div>
              ) : (
                <FaCopy className="text-dim opacity-50" />
              )}
            </div>
          </div>

          <div
            className="warning-box text-center"
            style={{
              border: "1px dashed var(--color-accent)",
              color: "var(--color-accent)",
              fontSize: "0.9rem",
              letterSpacing: "1px",
              padding: "20px",
            }}
          >
            <span style={{ fontWeight: "900" }}>
              ⚠ KEEP THIS TOKEN SECRET! ANYONE WITH ACCESS CAN MOD_LOG YOUR
              DATA.
            </span>
          </div>
        </div>

        <div
          className="footer-links flex justify-between uppercase text-dim text-xs mt-lg"
          style={{ letterSpacing: "1px" }}
        >
          <Link
            to="/"
            className="cursor-pointer hover:text-white"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            ← RETURN TO DASHBOARD
          </Link>
          <div className="flex gap-lg">
            <span className="cursor-pointer hover:text-white">HELP</span>
          </div>
        </div>
      </main>
      {copied && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: "#16a34a",
            color: "white",
            padding: "10px 20px",
            fontFamily: "var(--font-mono)",
            fontSize: "0.8rem",
            boxShadow: "0 0 20px rgba(0,0,0,0.5)",
            zIndex: 1000,
          }}
        >
          COPIED TO CLIPBOARD
        </div>
      )}
    </Layout>
  );
};

export default Settings;
