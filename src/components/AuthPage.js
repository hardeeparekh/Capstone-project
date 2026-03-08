import { useEffect, useMemo, useState } from 'react';

function getPasswordChecks(password) {
  return [
    { key: 'minLength', label: 'At least 8 characters', met: password.length >= 8 },
    { key: 'number', label: 'At least 1 number', met: /\d/.test(password) },
    { key: 'uppercase', label: 'At least 1 uppercase letter', met: /[A-Z]/.test(password) },
    { key: 'lowercase', label: 'At least 1 lowercase letter', met: /[a-z]/.test(password) },
  ];
}

function buildPayload(mode, form) {
  if (mode === 'login') {
    return {
      email: form.email.trim(),
      password: form.password,
    };
  }

  return {
    fullName: form.fullName.trim(),
    email: form.email.trim(),
    password: form.password,
  };
}

export default function AuthPage({ onClose, onAuthSubmit }) {
  const passwordRuleMessage =
    'Password must be at least 8 characters and include at least 1 number, 1 uppercase letter, and 1 lowercase letter.';
  const [mode, setMode] = useState('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const passwordChecks = useMemo(() => getPasswordChecks(form.password), [form.password]);

  const submitLabel = useMemo(() => (mode === 'login' ? 'Log In' : 'Create Account'), [mode]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleField = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    if (mode === 'signup') {
      if (!passwordChecks.every((check) => check.met)) {
        setMessage(passwordRuleMessage);
        return;
      }

      if (form.password !== form.confirmPassword) {
        setMessage('Passwords do not match.');
        return;
      }
    }

    setIsSubmitting(true);
    const payload = buildPayload(mode, form);

    try {
      if (onAuthSubmit) {
        await onAuthSubmit(mode, payload);
      } else {
        await new Promise((resolve) => {
          window.setTimeout(resolve, 600);
        });
      }

      setMessage(
        mode === 'login'
          ? 'Login successful!'
          : 'Signup successful! Please check your email to verify your account if required.'
      );
    } catch (error) {
      if (mode === 'login') {
        setMessage('Invalid login credentials.');
      } else {
        setMessage(error?.message || 'Authentication failed. Please try again.');
      }
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
      <section className="auth-page" onClick={(event) => event.stopPropagation()}>
        <button className="auth-close" onClick={onClose} aria-label="Close authentication page">
          Close
        </button>

        <div className="auth-grid">
          <aside className="auth-side">
            <p className="eyebrow">FutureForge Access</p>
            <h2 className="auth-title">Sign in and start your financial simulation journey.</h2>
            <p className="auth-copy">
              Track your decisions, unlock level progression, and store your simulation history in
              one account.
            </p>
            <div className="auth-chips">
              <span>Rs Goal Tracking</span>
              <span>Shock Event Replay</span>
              <span>Decision Reflection</span>
            </div>
          </aside>

          <div className="auth-card">
            <div className="auth-tabs" role="tablist" aria-label="Authentication modes">
              <button
                className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => handleModeChange('login')}
                role="tab"
                aria-selected={mode === 'login'}
              >
                Login
              </button>
              <button
                className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => handleModeChange('signup')}
                role="tab"
                aria-selected={mode === 'signup'}
              >
                Sign Up
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              {mode === 'signup' && (
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

              <label className="auth-label">
                Password
                <input
                  className="auth-input"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleField}
                  placeholder="Enter password"
                  minLength={mode === 'signup' ? 8 : undefined}
                  title={mode === 'signup' ? passwordRuleMessage : undefined}
                  required
                />
              </label>

              {mode === 'signup' && (
                <ul className="password-checklist" aria-live="polite">
                  {passwordChecks.map((check) => (
                    <li
                      key={check.key}
                      className={`password-check ${check.met ? 'met' : 'unmet'}`}
                    >
                      <span className="password-check-icon" aria-hidden="true" />
                      <span>{check.label}</span>
                    </li>
                  ))}
                </ul>
              )}

              {mode === 'signup' && (
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

              <button className="auth-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Please wait...' : submitLabel}
              </button>
            </form>

            <p className="auth-note">
              Secure authentication powered by Supabase.
            </p>
            {message ? <p className="auth-message">{message}</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
