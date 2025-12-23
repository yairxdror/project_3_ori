import React from "react";
import "./ErrorMessage.css";

interface ErrorMessageProps {
  message?: string | null;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  className = "",
}) => {
  if (!message) return null;

  const classes = ["error-message", className].filter(Boolean).join(" ");

  return <div className={classes}>{message}</div>;
};

export default ErrorMessage;