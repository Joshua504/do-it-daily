import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import config from "../config";
import "./Auth.css";

export default function Login({ setIsAuthenticated, setUsername }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const email = formData.email.trim().toLowerCase();
      const password = formData.password.trim();

      const response = await axios.post(
        `${config.API_BASE_URL}/api/auth/login`,
        { email, password },
      );

      if (response.data.success && response.data.token) {
        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("userId", response.data.userId);
        localStorage.setItem("username", response.data.user.username);
        setUsername(response.data.user.username);
        setIsAuthenticated(true);
        navigate("/dashboard");
      }
    } catch (err) {
      setError(
        err.response?.data?.error || "Login failed. Invalid credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGitHub = () => {
    window.location.href = `${config.API_BASE_URL}/api/auth/github`;
  };

  return (
    <div className="auth-container">
      <div className="auth-background"></div>

      <div className="auth-card">
        <div className="corner corner-tl">+</div>
        <div className="corner corner-tr">◎</div>
        <div className="corner corner-bl">::</div>
        <div className="corner corner-br">⬢</div>

        <div className="auth-header">
          <h1>DO IT DAILY</h1>
          <p>SYSTEM PROTOCOL V3.0.4</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2>LOGIN TO SYSTEM</h2>

          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>EMAIL ADDRESS</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="user@system.net"
              required
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>ACCESS KEY</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "AUTHENTICATING..." : "AUTHENTICATE"}
          </button>

          <div className="divider">OR</div>

          <button
            type="button"
            className="btn-github"
            onClick={handleGitHub}
            disabled={loading}
          >
            ◆ CONTINUE WITH GITHUB
          </button>
        </form>

        <div className="status-bar">
          <span>RECOVERY</span>
          <span>TERMINAL_ACCESS</span>
          <span>STATUS: ONLINE</span>
        </div>

        <div className="auth-footer">
          <Link to="/signup">REGISTER NEW USER</Link>
        </div>
      </div>

      <div className="system-info">
        0X_BISHOP ARCHIVE * {new Date().getFullYear()} * NODE_CONNECTED
      </div>
    </div>
  );
}fwefwefwgwegwergtehsg