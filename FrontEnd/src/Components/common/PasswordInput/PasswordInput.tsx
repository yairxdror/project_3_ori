import React from "react";
import Input, { type InputProps } from "../Input/Input";
import "./PasswordInput.css";

type PasswordInputProps = Omit<InputProps, "type" | "endAdornment"> & {
  scrambleDurationMs?: number;
};

const SCRAMBLE_CHARS =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`~,.<>?/;":][}{+_)(*&^%$#@!±=-§';
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function randomChar() {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
}

function mapRange(inMin: number, inMax: number, outMin: number, outMax: number, v: number) {
  const t = (v - inMin) / (inMax - inMin);
  return outMin + (outMax - outMin) * t;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  value = "",
  disabled,
  style,
  scrambleDurationMs = 750,
  ...rest
}) => {
  const [revealed, setRevealed] = React.useState(false);
  const [animating, setAnimating] = React.useState(false);
  const [blink, setBlink] = React.useState(false);
  const [lidClosed, setLidClosed] = React.useState(false);
  const [displayValue, setDisplayValue] = React.useState(String(value));

  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const eyeTranslateRef = React.useRef<SVGGElement | null>(null);
  const eyeMoveRafRef = React.useRef<number | null>(null);
  const scrambleRafRef = React.useRef<number | null>(null);

  const effectiveDisabled = Boolean(disabled) || animating;

  // Sync display with the real value when animation is not running
  React.useEffect(() => {
    if (!animating) setDisplayValue(String(value ?? ""));
  }, [value, animating]);

  // Random blink when the eye is open (while the password is hidden)
  React.useEffect(() => {
    if (revealed || effectiveDisabled) return;

    let timer: number | null = null;
    let cancel = false;

    const schedule = () => {
      if (cancel) return;
      const delay = Math.floor(Math.random() * (8000 - 2000 + 1)) + 2000; // 2-8 seconds
      timer = window.setTimeout(() => {
        setBlink(true);
        window.setTimeout(() => setBlink(false), 120);
        schedule();
      }, delay);
    };

    schedule();

    return () => {
      cancel = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [revealed, effectiveDisabled]);

  // Pupil movement follows the mouse
  React.useEffect(() => {
    let resetTimer: number | null = null;

    const onPointerMove = (e: PointerEvent) => {
      if (!buttonRef.current || !eyeTranslateRef.current) return;

      const eyeRect = buttonRef.current.getBoundingClientRect();

      // Similar to the original logic: map ranges to percent movement
      const xPercent = clamp(
        mapRange(-100, 100, 30, -30, eyeRect.x - e.clientX),
        -30,
        30
      );
      const yPercent = clamp(
        mapRange(-100, 100, 30, -30, eyeRect.y - e.clientY),
        -30,
        30
      );

      if (eyeMoveRafRef.current) cancelAnimationFrame(eyeMoveRafRef.current);
      eyeMoveRafRef.current = requestAnimationFrame(() => {
        const el = eyeTranslateRef.current;
        if (!el) return;
        el.style.setProperty("--eye-x", `${xPercent}%`);
        el.style.setProperty("--eye-y", `${yPercent}%`);
      });

      if (resetTimer) window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        const el = eyeTranslateRef.current;
        if (!el) return;
        el.style.setProperty("--eye-x", `0%`);
        el.style.setProperty("--eye-y", `0%`);
      }, 2000);
    };

    window.addEventListener("pointermove", onPointerMove);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      if (resetTimer) window.clearTimeout(resetTimer);
      if (eyeMoveRafRef.current) cancelAnimationFrame(eyeMoveRafRef.current);
      if (scrambleRafRef.current) cancelAnimationFrame(scrambleRafRef.current);
    };
  }, []);

  const runToggleAnimation = React.useCallback(
    (nextReveal: boolean) => {
      const snapshot = String(value ?? "");
      const len = snapshot.length;

      // Close/open eye immediately at the start of the toggle, as in the original code
      setLidClosed(nextReveal);

      // When closing (revealing the password) stop blinking
      if (nextReveal) setBlink(false);

      setAnimating(true);

      const start = performance.now();

      const step = (now: number) => {
        const p = clamp((now - start) / scrambleDurationMs, 0, 1);
        const n = Math.floor(len * p);

        if (nextReveal) {
          // reveal: random prefix, suffix dots
          const prefix = Array.from({ length: n }, () => randomChar()).join("");
          const suffix = "•".repeat(Math.max(0, len - n));
          setDisplayValue(prefix + suffix);
        } else {
          // show original text
          const prefix = "•".repeat(n);
          const suffix = snapshot.slice(n);
          setDisplayValue(prefix + suffix);
        }

        if (p < 1) {
          scrambleRafRef.current = requestAnimationFrame(step);
          return;
        }

        // Finish
        if (nextReveal) {
          setRevealed(true);
          setDisplayValue(snapshot);
        } else {
          setRevealed(false);
          setDisplayValue(snapshot);
        }
        setAnimating(false);
      };

      // If a previous RAF is running, cancel it before starting a new one
      if (scrambleRafRef.current) cancelAnimationFrame(scrambleRafRef.current);
      scrambleRafRef.current = requestAnimationFrame(step);
    },
    [scrambleDurationMs, value]
  );

  const handleToggle = () => {
    if (effectiveDisabled) return;
    runToggleAnimation(!revealed);
  };

  const inputType = revealed || animating ? "text" : "password";

  const toggleButton = (
    <button
      ref={buttonRef}
      type="button"
      className="password-toggle"
      onClick={handleToggle}
      aria-pressed={revealed}
      aria-label={revealed ? "Hide password" : "Show password"}
      title={revealed ? "Hide password" : "Reveal password"}
      disabled={effectiveDisabled}
      data-state={lidClosed ? "closed" : "open"}
      data-blink={blink ? "true" : "false"}
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          className="lid lid--upper"
          d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="lid lid--lower"
          d="M1 12C1 12 5 20 12 20C19 20 23 12 23 12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* עין (אישון) */}
        <g className="eye-translate" ref={eyeTranslateRef}>
          <g className="eye-scale">
            <circle cy="12" cx="12" r="4" fill="currentColor" opacity="0.95" />
          </g>
        </g>
      </svg>

      <span className="sr-only">{revealed ? "Hide" : "Reveal"}</span>
    </button>
  );

  return (
    <Input
      {...rest}
      value={displayValue}
      type={inputType}
      disabled={effectiveDisabled}
      endAdornment={toggleButton}
      style={{
        ...style,
        paddingRight: "3.4rem",
      }}
    />
  );
};

export default PasswordInput;