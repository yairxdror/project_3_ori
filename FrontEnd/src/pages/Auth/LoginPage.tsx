import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import ErrorMessage from "../../Components/common/ErrorMessage/ErrorMessage";
import Button from "../../Components/common/Button/Button";
import Input from "../../Components/common/Input/Input";
import "./AuthPage.css";
import PasswordInput from "../../Components/common/PasswordInput/PasswordInput";

const LoginPage: React.FC = () => {
  const { login, authError, isLoading, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [formError, setFormError] = useState<string | null>(null);

  // If the user is already logged in, redirect from the login page
  useEffect(() => {
    if (user) {
      navigate("/vacations");
    }
  }, [user, navigate]);

  function validateForm(): boolean {
    if (!email || !password) {
      setFormError("Please provide email and password");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Invalid email address");
      return false;
    }

    if (password.length < 5) {
      setFormError("Password must be at least 5 characters long");
      return false;
    }

    setFormError(null);
    return true;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await login({ email, password });
    } catch {
    }
  }

  return (
    <div className="auth-layout auth-layout--login">
      <h1 className="Main-title">VACATIONLAND</h1>

      {/* decorative planes in background */}
      <div className="auth-plane auth-plane--left">
        <span className="auth-plane__icon">✈</span>
        <span className="auth-plane__cloud" />
      </div>

      <div className="auth-plane auth-plane--right">
        <span className="auth-plane__icon">✈</span>
        <span className="auth-plane__cloud" />
      </div>

      <div className="auth-page auth-page--login">
        <div className="auth-page__header">
          <h1>Login</h1>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* email field */}
          <Input
            id="email"
            placeholder="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />

          {/* password field */}
          <PasswordInput
            id="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />

          {/* local validation error */}
          {formError && (
            <ErrorMessage
              message={formError}
              className="auth-form__error"
            />
          )}

          {/* server-side error from AuthContext */}
          {authError && !formError && (
            <ErrorMessage
              message={authError}
              className="auth-form__error"
            />
          )}

          <Button
            type="submit"
            variant="primary"
            className="auth-form__submit"
            disabled={isLoading}
            fullWidth
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="auth-page__footer">
          <span>Don't have an account yet?</span>{" "}
          <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;