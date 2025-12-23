import React from "react";
import "./Toast.css";

export type ToastVariant = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  variant: ToastVariant;
  title?: string;
  message: string;
  durationMs: number;
  createdAt: number;
};

type Props = {
  toasts: ToastItem[];
  onClose: (id: string) => void;
};

const ToastViewport: React.FC<Props> = ({ toasts, onClose }) => {
  return (
    <div className="toast-viewport" role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.variant}`} role="status" aria-live="polite">
          <div className="toast__body">
            {t.title && <div className="toast__title">{t.title}</div>}
            <div className="toast__message">{t.message}</div>
          </div>

          <button
            type="button"
            className="toast__close"
            onClick={() => onClose(t.id)}
            aria-label="Close notification"
            title="Close"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastViewport;