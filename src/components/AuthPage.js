import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "../App.css";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY,
);

function getPasswordChecks(password) {
  return [
    {
      key: "minLength",
      label: "At least 8 characters",
      met: password.length >= 8,
    },
    { key: "number", label: "At least 1 number", met: /\d/.test(password) },
    {
      key: "uppercase",
      label: "At least 1 uppercase letter",
      met: /[A-Z]/.test(password),
    },
    {
      key: "lowercase",
      label: "At least 1 lowercase letter",
      met: /[a-z]/.test(password),
    },
  ];
}

function buildPayload(mode, form) {
  if (mode === "login") {
    return { email: form.email.trim(), password: form.password };
  }
  return {
    fullName: form.fullName.trim(),
    email: form.email.trim(),
    password: form.password,
  };
}

export default function AuthPage({ onClose, onAuthSubmit }) {
  const passwordRuleMessage =
    "Password must be at least 8 characters and include at least 1 number, 1 uppercase letter, and 1 lowercase letter.";
  const [mode, setMode] = useState("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const passwordChecks = useMemo(
    () => getPasswordChecks(form.password),
    [form.password],
  );
  const submitLabel = useMemo(() => {
    if (mode === "login") return "Log In";
    if (mode === "signup") return "Create Account";
    return "Send Reset Link";
  }, [mode]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleField = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setMessage({ text: "", type: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (mode === "forgot") {
      setIsSubmitting(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(
          form.email.trim().toLowerCase(),
          {
            redirectTo: `${window.location.origin}/reset-password`,
          },
        );
        if (error) throw new Error(error.message);
        setMessage({
          text: "If an account with that email exists, a reset link has been sent. Check your inbox (and spam folder).",
          type: "success",
        });
      } catch (err) {
        setMessage({
          text: err?.message || "Could not send reset email. Please try again.",
          type: "error",
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (mode === "signup") {
      if (!passwordChecks.every((c) => c.met)) {
        setMessage({ text: passwordRuleMessage, type: "error" });
        return;
      }
      if (form.password !== form.confirmPassword) {
        setMessage({ text: "Passwords do not match.", type: "error" });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (onAuthSubmit) await onAuthSubmit(mode, buildPayload(mode, form));
      setMessage({
        text:
          mode === "login"
            ? "Login successful!"
            : "Signup successful! Please check your email to verify your account if required.",
        type: "success",
      });
    } catch (err) {
      setMessage({
        text:
          mode === "login"
            ? "Invalid login credentials."
            : err?.message || "Authentication failed. Please try again.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="auth-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Authentication"
      onClick={onClose}
    >
      <section className="auth-page" onClick={(e) => e.stopPropagation()}>
        <button
          className="auth-close"
          onClick={onClose}
          aria-label="Close authentication page"
        >
          Close
        </button>

        <div className="auth-grid">
          <aside className="auth-side">
            <p className="eyebrow">FutureForge Access</p>
            <h2 className="auth-title">
              Sign in and start your financial simulation journey.
            </h2>
            <p className="auth-copy">
              Track your decisions, unlock level progression, and store your
              simulation history in one account.
            </p>
            <div className="auth-chips">
              <span>Rs Goal Tracking</span>
              <span>Shock Event Replay</span>
              <span>Decision Reflection</span>
            </div>
          </aside>

          <div className="auth-card">
            {mode !== "forgot" && (
              <div
                className="auth-tabs"
                role="tablist"
                aria-label="Authentication modes"
              >
                <button
                  className={`auth-tab ${mode === "login" ? "active" : ""}`}
                  onClick={() => handleModeChange("login")}
                  role="tab"
                  aria-selected={mode === "login"}
                >
                  Login
                </button>
                <button
                  className={`auth-tab ${mode === "signup" ? "active" : ""}`}
                  onClick={() => handleModeChange("signup")}
                  role="tab"
                  aria-selected={mode === "signup"}
                >
                  Sign Up
                </button>
              </div>
            )}

            {mode === "forgot" && (
              <div className="auth-forgot-header">
                <button
                  className="auth-back-btn"
                  onClick={() => handleModeChange("login")}
                >
                  ← Back
                </button>
                <h3 className="auth-forgot-title">Reset Password</h3>
                <p className="auth-forgot-hint">
                  Enter your email and we'll send you a link to reset your
                  password.
                </p>
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              {mode === "signup" && (
                <label className="auth-label">
                  Full Name
                  <input
                    className="auth-input"
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleField}
                    placeholder="Your name"
                    required
                  />
                </label>
              )}

              <label className="auth-label">
                Email
                <input
                  className="auth-input"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleField}
                  placeholder="you@example.com"
                  required
                />
              </label>

              {mode !== "forgot" && (
                <label className="auth-label">
                  Password
                  <input
                    className="auth-input"
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleField}
                    placeholder="Enter password"
                    minLength={mode === "signup" ? 8 : undefined}
                    title={mode === "signup" ? passwordRuleMessage : undefined}
                    required
                  />
                </label>
              )}

              {mode === "signup" && (
                <ul className="password-checklist" aria-live="polite">
                  {passwordChecks.map((check) => (
                    <li
                      key={check.key}
                      className={`password-check ${check.met ? "met" : "unmet"}`}
                    >
                      <span
                        className="password-check-icon"
                        aria-hidden="true"
                      />
                      <span>{check.label}</span>
                    </li>
                  ))}
                </ul>
              )}

              {mode === "signup" && (
                <label className="auth-label">
                  Confirm Password
                  <input
                    className="auth-input"
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleField}
                    placeholder="Confirm password"
                    minLength={8}
                    required
                  />
                </label>
              )}

              {mode === "login" && (
                <button
                  type="button"
                  className="auth-forgot-link"
                  onClick={() => handleModeChange("forgot")}
                >
                  Forgot password?
                </button>
              )}

              <button
                className="auth-submit"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Please wait..." : submitLabel}
              </button>
            </form>

            <p className="auth-note">
              Secure authentication powered by Supabase.
            </p>
            {message.text && (
              <p className={`auth-message auth-message--${message.type}`}>
                {message.text}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}