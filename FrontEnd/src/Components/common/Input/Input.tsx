import React from "react";
import "./Input.css";
import ErrorMessage from "../ErrorMessage/ErrorMessage";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  wrapperClassName?: string;
  endAdornment?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  id,
  label,
  error,
  wrapperClassName = "",
  className = "",
  endAdornment,
  ...rest
}) => {
  const wrapperClasses = ["input-field", wrapperClassName]
    .filter(Boolean)
    .join(" ");

  const inputClasses = [
    "input-field__input",
    error ? "input-field__input--error" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClasses}>
      {label && id && (
        <label className="input-field__label" htmlFor={id}>
          {label}
        </label>
      )}

      <div className="input-field__control">
        <input id={id} className={inputClasses} {...rest} />

        {endAdornment && (
          <div className="input-field__end-adornment">
            {endAdornment}
          </div>
        )}
      </div>

      {error && (
        <ErrorMessage
          className="input-field__error"
          message={error}
        />
      )}
    </div>
  );
};

export default Input;