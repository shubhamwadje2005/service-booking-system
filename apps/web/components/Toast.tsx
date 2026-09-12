"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, Info, X } from "./Icons";

export interface ToastItem {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

type ToastListener = (toast: ToastItem) => void;
const listeners = new Set<ToastListener>();

export const toast = {
  success: (message: string) => {
    const item: ToastItem = { id: Math.random().toString(36).slice(2), type: "success", message };
    listeners.forEach((fn) => fn(item));
  },
  error: (message: string) => {
    const item: ToastItem = { id: Math.random().toString(36).slice(2), type: "error", message };
    listeners.forEach((fn) => fn(item));
  },
  info: (message: string) => {
    const item: ToastItem = { id: Math.random().toString(36).slice(2), type: "info", message };
    listeners.forEach((fn) => fn(item));
  },
};

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleToast: ToastListener = (newToast) => {
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4000);
    };

    listeners.add(handleToast);
    return () => {
      listeners.delete(handleToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "1.25rem",
        right: "1.25rem",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        maxWidth: "420px",
        width: "calc(100% - 2.5rem)",
        pointerEvents: "none",
      }}
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((item) => {
        const isSuccess = item.type === "success";
        const isError = item.type === "error";

        const bg = isSuccess ? "#ffffff" : isError ? "#ffffff" : "#ffffff";
        const border = isSuccess ? "#059669" : isError ? "#dc2626" : "#2563eb";
        const iconColor = isSuccess ? "#059669" : isError ? "#dc2626" : "#2563eb";

        return (
          <div
            key={item.id}
            style={{
              pointerEvents: "auto",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              background: bg,
              color: "#0f172a",
              padding: "0.85rem 1rem",
              borderRadius: "8px",
              border: `1px solid #e2e8f0`,
              borderLeft: `4px solid ${border}`,
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
              fontSize: "0.92rem",
              fontWeight: 500,
              lineHeight: 1.4,
              animation: "toastSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div style={{ color: iconColor, flexShrink: 0, display: "flex" }}>
              {isSuccess && <CheckCircle size={20} />}
              {isError && <AlertCircle size={20} />}
              {!isSuccess && !isError && <Info size={20} />}
            </div>
            <span style={{ flex: 1 }}>{item.message}</span>
            <button
              onClick={() => removeToast(item.id)}
              style={{
                background: "none",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: "0.2rem",
                display: "flex",
                borderRadius: "4px",
              }}
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
