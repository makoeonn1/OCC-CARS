import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured, idToEmail } from "../lib/supabase.js";
import "../styles/login.css";

export default function Login() {
  const navigate = useNavigate();
  const [idNumber, setIdNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!idNumber.trim() || !password) {
      setMessage({ type: "error", text: "Please enter your ID number and password." });
      return;
    }
    if (!isSupabaseConfigured) {
      setMessage({
        type: "error",
        text: "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: idToEmail(idNumber),
      password,
    });
    setLoading(false);

    if (error) {
      setMessage({ type: "error", text: "Invalid ID number or password." });
      return;
    }
    setMessage({ type: "success", text: "Login successful!" });
    // Students land on the dashboard after logging in.
    setTimeout(() => navigate("/dashboard", { replace: true }), 500);
  };

  return (
    <div className="login">
      {/* Left: school image panel */}
      <aside className="login__image">
        <img src="occ-backgroundimg.png" alt="One Cainta College building" />
        <div className="login__image-overlay" />
        <Link to="/" className="login__back">
          <span aria-hidden="true">&#10094;</span> Back
        </Link>
      </aside>

      {/* Right: form panel */}
      <main className="login__panel">
        <div className="login__tab">
          <span>Log In</span>
        </div>

        <form className="login__form" onSubmit={handleSubmit} noValidate>
          <h1>Welcome to OCC!!</h1>
          <p className="login__hint">Log-In with your ID Number and Password</p>

          <label htmlFor="idNumber">ID Number</label>
          <input
            id="idNumber"
            type="text"
            autoComplete="username"
            placeholder="Type your ID number here (e.g. 2024-08372)"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Type your password here"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {message.text && (
            <p className={`login__msg login__msg--${message.type}`} role="alert">
              {message.text}
            </p>
          )}

          <button type="submit" className="login__submit" disabled={loading}>
            {loading ? "LOGGING IN..." : "LOG IN"}
          </button>
        </form>

        <hr className="login__rule" />
      </main>
    </div>
  );
}
