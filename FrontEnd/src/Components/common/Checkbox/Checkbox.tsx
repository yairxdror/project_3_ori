import React from "react";
import "./Checkbox.css";

export interface CheckboxProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type"
  > {
  label?: string;
  wrapperClassName?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  id,
  label,
  wrapperClassName = "",
  className = "",
  ...rest
}) => {
  const wrapperClasses = ["checkbox-field", wrapperClassName]
    .filter(Boolean)
    .join(" ");

  const inputClasses = ["checkbox-field__input", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClasses}>
      <label className="checkbox-field__label">
        <input
          id={id}
          type="checkbox"
          className={inputClasses}
          {...rest}
        />
        {label && (
          <span className="checkbox-field__text">{label}</span>
        )}
      </label>
    </div>
  );
};

export default Checkbox;