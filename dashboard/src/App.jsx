import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Settings from "./pages/Settings";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("authToken"),
  );
  const [username, setUsername] = useState(
    localStorage.getItem("username") || "",
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists and is valid (simple check for now)
    const token = localStorage.getItem("authToken");
    const storedUsername = localStorage.getItem("username");
    if (token) {
      setIsAuthenticated(true);
      if (storedUsername) setUsername(storedUsername);
    } else {
      setIsAuthenticated(false);
      setUsername("");
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div
        style={{
          background: "#0d0d0d",
          color: "#4ade80",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "monospace",
        }}
      >
        INITIALIZING SYSTEM...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Dashboard
                setIsAuthenticated={setIsAuthenticated}
                username={username}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" />
            ) : (
              <Login
                setIsAuthenticated={setIsAuthenticated}
                setUsername={setUsername}
              />
            )
          }
        />
        <Route
          path="/signup"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" />
            ) : (
              <Signup
                setIsAuthenticated={setIsAuthenticated}
                setUsername={setUsername}
              />
            )
          }
        />
        <Route
          path="/settings"
          element={
            isAuthenticated ? (
              <Settings
                setIsAuthenticated={setIsAuthenticated}
                username={username}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
