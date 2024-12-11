import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./css/LoginScreen.css";

const LoginScreen = () => {
  const [user_name, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/login", {
        user_name,
        password,
      });

      const { role, user_id } = response.data;

      // Store user ID and role in localStorage
      localStorage.setItem("user_id", user_id);
      localStorage.setItem("role", role);

      if (role === "admin") {
        navigate("/admin-dashboard");
      } else if (role === "client") {
        navigate("/client-dashboard", { state: { user_id: response.data.user_id } });
      } else {
        setMessage("Invalid role. Please contact support.");
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="split-page-container">
      <div className="image-section">
        <img src={require("./assets/pentagan.png")} alt="Laptop" />
      </div>
      <div className="form-section">
        <div className="login-form">
          <h2>Login</h2>
          <p>Login as Admin or Client</p>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <input
                type="text"
                className="form-control"
                placeholder="User Name"
                value={user_name}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                className="form-control"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block">
              Sign In
            </button>
          </form>
          {message && <p className="text-danger mt-3">{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
