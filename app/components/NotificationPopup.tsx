"use client";

import { useEffect, useState } from "react";

type PopupNotification = {
  id: string;
  title: string;
  message: string;
  type: "urgent" | "due-soon" | "overdue";
  dueDate?: string;
  dismissable?: boolean;
};

type NotificationPopupProps = {
  notification: PopupNotification | null;
  onDismiss: () => void;
};

export default function NotificationPopup({
  notification,
  onDismiss,
}: NotificationPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [autoClose, setAutoClose] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      // Auto-dismiss after 6 seconds for non-urgent, 8 for urgent
      const delay = notification.type === "overdue" ? 8000 : 6000;
      const timer = setTimeout(() => {
        handleDismiss();
      }, delay);
      setAutoClose(timer);
    }
  }, [notification]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (autoClose) clearTimeout(autoClose);
    setTimeout(() => onDismiss(), 300); // Wait for animation
  };

  if (!notification) return null;

  const typeStyles = {
    overdue: {
      bg: "#fee2e2",
      border: "#fecaca",
      icon: "🔴",
      accentColor: "#dc2626",
    },
    "due-soon": {
      bg: "#fef3c7",
      border: "#fcd34d",
      icon: "⏰",
      accentColor: "#d97706",
    },
    urgent: {
      bg: "#f0e7ff",
      border: "#ddd6fe",
      icon: "⚡",
      accentColor: "#7c3aed",
    },
  };

  const style = typeStyles[notification.type];

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 9999,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateX(0)" : "translateX(400px)",
        transition: "all 0.3s ease-in-out",
        pointerEvents: isVisible ? "auto" : "none",
      }}
    >
      <div
        style={{
          background: style.bg,
          border: `2px solid ${style.border}`,
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
          minWidth: 300,
          maxWidth: 400,
          animation: isVisible ? "slideIn 0.3s ease-out" : "slideOut 0.3s ease-in",
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          {/* Icon */}
          <div
            style={{
              fontSize: 24,
              flexShrink: 0,
              animation: notification.type === "overdue" ? "pulse 1s infinite" : "none",
            }}
          >
            {style.icon}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#1f2937",
                marginBottom: 4,
              }}
            >
              {notification.title}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#4b5563",
                lineHeight: 1.5,
                marginBottom: notification.dueDate ? 8 : 0,
              }}
            >
              {notification.message}
            </div>
            {notification.dueDate && (
              <div
                style={{
                  fontSize: 12,
                  color: style.accentColor,
                  fontWeight: 600,
                }}
              >
                Due: {new Date(notification.dueDate).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            )}
          </div>

          {/* Close button */}
          {notification.dismissable !== false && (
            <button
              onClick={handleDismiss}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 18,
                cursor: "pointer",
                color: "#6b7280",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
              aria-label="Dismiss"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(400px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(400px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}
