import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import ErrorMessage from "../../Components/common/ErrorMessage/ErrorMessage";
import Button from "../../Components/common/Button/Button";
import "./AuthPage.css";
import Input from "../../Components/common/Input/Input";
import PasswordInput from "../../Components/common/PasswordInput/PasswordInput";

const RegisterPage: React.FC = () => {
  const { register, authError, isLoading, user } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate("/vacations");
    }
  }, [user, navigate]);

  function validateForm(): boolean {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setFormError("Please fill in all fields");
      return false;
    }

    if (firstName.trim().length < 2) {
      setFormError("First name must be at least 2 characters long");
      return false;
    }

    if (lastName.trim().length < 2) {
      setFormError("Last name must be at least 2 characters long");
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
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      });
      // Navigation to /vacations will occur via useEffect when `user` updates
    } catch {
      // Server error is already available in `authError`
    }
  }

  return (
    <div className="auth-layout auth-layout--register">
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

      <div className="auth-page auth-page--register">
        <div className="auth-page__header">
          <h1>Register</h1>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <Input
            id="firstName"
            placeholder="First name"
            type="text"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={isLoading}
          />

          <Input
            id="lastName"
            placeholder="Last name"
            type="text"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={isLoading}
          />

          <Input
            id="email"
            placeholder="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />

          <PasswordInput
            id="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />

          {formError && (
            <ErrorMessage
              message={formError}
              className="auth-form__error"
            />
          )}

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
            {isLoading ? "Signing up..." : "Register"}
          </Button>
        </form>

        <div className="auth-page__footer">
          <span>Already have an account?</span>{" "}
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;