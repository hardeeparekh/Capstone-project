import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY,
);

export default function ResetPasswordPage({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("idle"); 
  const [message, setMessage] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
        setSessionError(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    const timer = setTimeout(() => {
      setSessionReady((ready) => {
        if (!ready) setSessionError(true);
        return ready;
      });
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      setStatus("error");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(
        error.message ||
          "Could not update password. The link may have expired — please request a new one.",
      );
      setStatus("error");
    } else {
      await supabase.auth.signOut();
      setStatus("success");
      setMessage("Password updated successfully! Redirecting to login...");
      setTimeout(() => onDone(), 2500);
    }
  };

  return (
    <div className="auth-overlay" role="dialog" aria-modal="true">
      <section className="auth-page" style={{ maxWidth: 420 }}>
        <div className="auth-card" style={{ padding: "2rem" }}>
          <h2 className="auth-forgot-title" style={{ marginBottom: "0.4rem" }}>
            Set New Password
          </h2>

          {sessionError ? (
            <div>
              <p
                className="auth-forgot-hint"
                style={{ marginBottom: "1rem", color: "var(--danger)" }}
              >
                This reset link is invalid or has expired. Please request a new
                password reset from the login page.
              </p>
              <button className="auth-submit" onClick={() => onDone()}>
                Back to Login
              </button>
            </div>
          ) : !sessionReady ? (
            <>
              <p
                className="auth-forgot-hint"
                style={{ marginBottom: "1.5rem" }}
              >
                Verifying your reset link…
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "var(--muted)",
                  fontSize: "0.85rem",
                }}
              >
                <span className="spin" /> Please wait…
              </div>
            </>
          ) : (
            <>
              <p
                className="auth-forgot-hint"
                style={{ marginBottom: "1.5rem" }}
              >
                Choose a strong new password for your account.
              </p>

              <form className="auth-form" onSubmit={handleSubmit}>
                <label className="auth-label">
                  New Password
                  <input
                    className="auth-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    minLength={8}
                    required
                    autoFocus
                  />
                </label>

                <label className="auth-label">
                  Confirm Password
                  <input
                    className="auth-input"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat new password"
                    required
                  />
                </label>

                {confirm.length > 0 && (
                  <p
                    style={{
                      fontSize: "0.78rem",
                      marginTop: "-0.5rem",
                      marginBottom: "0.25rem",
                      color:
                        password === confirm
                          ? "var(--accent-2, #0e9f6e)"
                          : "var(--danger, #e63946)",
                    }}
                  >
                    {password === confirm
                      ? "✓ Passwords match"
                      : "✗ Passwords don't match"}
                  </p>
                )}

                <button
                  className="auth-submit"
                  type="submit"
                  disabled={status === "loading" || status === "success"}
                >
                  {status === "loading" ? "Updating…" : "Update Password"}
                </button>
              </form>
            </>
          )}

          {message && (
            <p
              className={`auth-message auth-message--${
                status === "success" ? "success" : "error"
              }`}
              style={{ marginTop: "1rem" }}
            >
              {message}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
