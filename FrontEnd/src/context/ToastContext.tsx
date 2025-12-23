import React, { createContext, useCallback, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { ToastItem, ToastVariant } from "../Components/common/Toast/ToastViewport";
import ToastViewport from "../Components/common/Toast/ToastViewport";

type ToastInput = {
  variant: ToastVariant;
  title?: string;
  message: string;
  durationMs?: number;
};

type ToastContextValue = {
  push: (toast: ToastInput) => string;
  success: (message: string, title?: string, durationMs?: number) => string;
  error: (message: string, title?: string, durationMs?: number) => string;
  info: (message: string, title?: string, durationMs?: number) => string;
  remove: (id: string) => void;
  clear: () => void;
};

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  const push = useCallback(
    (input: ToastInput) => {
      const id = crypto.randomUUID();
      const durationMs = input.durationMs ?? (input.variant === "error" ? 4500 : 2800);

      const item: ToastItem = {
        id,
        variant: input.variant,
        title: input.title,
        message: input.message,
        durationMs,
        createdAt: Date.now(),
      };

      setToasts((prev) => [...prev, item]);

      window.setTimeout(() => remove(id), durationMs);
      return id;
    },
    [remove]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (message, title, durationMs) => push({ variant: "success", message, title, durationMs }),
      error: (message, title, durationMs) => push({ variant: "error", message, title, durationMs }),
      info: (message, title, durationMs) => push({ variant: "info", message, title, durationMs }),
      remove,
      clear,
    }),
    [push, remove, clear]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      {createPortal(
        <ToastViewport toasts={toasts} onClose={remove} />,
        document.body
      )}
    </ToastContext.Provider>
  );
};