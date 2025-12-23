import React from "react";
import "./Button.css";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "md" | "sm" | "icon";

export interface ButtonProps extends React.HTMLAttributes<HTMLElement> {
    variant?: ButtonVariant;
    fullWidth?: boolean;
    size?: ButtonSize;

    as?: React.ElementType;

    type?: React.ButtonHTMLAttributes<HTMLButtonElement>["type"];

    disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
    variant = "primary",
    fullWidth = false,
    size = "md",
    className = "",
    children,
    as: Component = "button",
    disabled = false,
    type = "button",
    ...rest
}) => {
    const classes = [
        "btn",
        `btn--${variant}`,
        `btn--${size}`,
        fullWidth ? "btn--full-width" : "",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    const commonProps: any = {
        className: classes,
        ...rest,
    };

    if (Component === "button") {
        commonProps.disabled = disabled;
        commonProps.type = type;
    } else {
        commonProps["aria-disabled"] = disabled ? "true" : undefined;
    }

    return <Component {...commonProps}>{children}</Component>;
};

export default Button;