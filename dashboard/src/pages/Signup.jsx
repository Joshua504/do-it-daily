import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./Auth.css";

export default function Signup({ setIsAuthenticated, setUsername }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
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
      const username = formData.username.trim();
      const email = formData.email.trim().toLowerCase();
      const password = formData.password.trim();

      const response = await axios.post(
        "http://localhost:3000/api/auth/signup",
        { username, email, password },
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
        err.response?.data?.error ||
          "Signup failed. Please check your details.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGitHub = () => {
    window.location.href = "http://localhost:3000/api/auth/github";
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
          <p>NEW USER REGISTRATION INTERFACE</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2>INITIALIZE ACCOUNT</h2>

          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>USERNAME</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="NEW_USER_01"
              required
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>EMAIL ADDRESS</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="user@system.net"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>CHOOSE ACCESS KEY</label>
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
            {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
          </button>

          <div className="divider">INTEGRATION</div>

          <button
            type="button"
            className="btn-github"
            onClick={handleGitHub}
            disabled={loading}
          >
            ◆ CONTINUE WITH GITHUB
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login">&lt; BACK TO LOGIN</Link>
        </div>
      </div>

      <div className="system-info">
        SYSTEM_ARCHIVE_{new Date().getFullYear()} - SECTOR_07 - DATA_ENCRYPTED
      </div>
    </div>
  );
}
