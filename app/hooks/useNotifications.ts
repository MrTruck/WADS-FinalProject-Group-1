"use client";

import { useEffect, useState, useCallback, useRef } from "react";

type PopupNotification = {
  id: string;
  title: string;
  message: string;
  type: "urgent" | "due-soon" | "overdue";
  dueDate?: string;
  dismissable?: boolean;
  savedNotificationId?: string;
};

type ApiNotification = {
  notification_id: string;
  type: "DEADLINE_ALERT" | "AI_REMINDER" | "SYSTEM" | "STREAK_UPDATE" | "BURNOUT_ALERT" | "PUSH_TEST";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

const CHECK_INTERVAL = 30000; // Check every 30 seconds

function getCsrfToken() {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrf-token="))
    ?.split("=")[1];
}

function mapApiNotification(notification: ApiNotification): PopupNotification {
  const typeMap: Record<ApiNotification["type"], PopupNotification["type"]> = {
    DEADLINE_ALERT: "due-soon",
    AI_REMINDER: "urgent",
    SYSTEM: "urgent",
    STREAK_UPDATE: "urgent",
    BURNOUT_ALERT: "urgent",
    PUSH_TEST: "urgent",
  };

  return {
    id: notification.notification_id,
    savedNotificationId: notification.notification_id,
    title: notification.title,
    message: notification.message,
    type: typeMap[notification.type],
  };
}

export function useNotifications() {
  const [currentNotification, setCurrentNotification] = useState<PopupNotification | null>(null);
  const [notificationQueue, setNotificationQueue] = useState<PopupNotification[]>([]);
  const shownNotificationIds = useRef<Set<string>>(new Set());

  const syncSavedNotifications = useCallback(async () => {
    try {
      const csrfToken = getCsrfToken();
      if (!csrfToken) return;

      const response = await fetch("/api/v1/notifications/sync", {
        method: "POST",
        headers: {
          "x-csrf-token": decodeURIComponent(csrfToken),
        },
        credentials: "include",
      });

      if (!response.ok) {
        console.warn("[NOTIFICATION] Failed to sync saved notifications:", response.status);
      }
    } catch (error) {
      console.error("[NOTIFICATION] Error syncing saved notifications:", error);
    }
  }, []);

  const checkSavedNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/notifications?unread=true", {
        credentials: "include",
      });

      if (!response.ok) {
        console.warn("[NOTIFICATION] Failed to fetch saved notifications:", response.status);
        return;
      }

      const data = await response.json();
      const notifications: ApiNotification[] = data.data?.notifications ?? [];

      const unreadPopups = notifications
        .filter((notification) => !notification.is_read)
        .filter((notification) => !shownNotificationIds.current.has(notification.notification_id))
        .map(mapApiNotification);

      if (unreadPopups.length > 0) {
        setNotificationQueue((prev) => [...prev, ...unreadPopups]);
        unreadPopups.forEach((notification) => shownNotificationIds.current.add(notification.id));
      }
    } catch (error) {
      console.error("[NOTIFICATION] Error checking saved notifications:", error);
    }
  }, []);

  // Process notification queue
  useEffect(() => {
    if (notificationQueue.length > 0 && !currentNotification) {
      const timer = window.setTimeout(() => {
        const next = notificationQueue[0];
        setCurrentNotification(next);
        setNotificationQueue((prev) => prev.slice(1));
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [notificationQueue, currentNotification]);

  // Sync and display database-backed notifications on an interval.
  useEffect(() => {
    console.log("[NOTIFICATION] Initializing notification system");

    const runChecks = async () => {
      console.log("[NOTIFICATION] Running periodic check...");
      await syncSavedNotifications();
      await checkSavedNotifications();
    };

    const initialCheck = window.setTimeout(() => void runChecks(), 0);
    const interval = window.setInterval(() => void runChecks(), CHECK_INTERVAL);

    return () => {
      window.clearTimeout(initialCheck);
      window.clearInterval(interval);
      console.log("[NOTIFICATION] Cleaning up notification system");
    };
  }, [syncSavedNotifications, checkSavedNotifications]);

  const dismissNotification = useCallback(() => {
    const savedNotificationId = currentNotification?.savedNotificationId;
    setCurrentNotification(null);

    if (!savedNotificationId) return;

    const csrfToken = getCsrfToken();
    if (!csrfToken) return;

    fetch(`/api/v1/notifications/${savedNotificationId}/read`, {
      method: "PATCH",
      headers: {
        "x-csrf-token": decodeURIComponent(csrfToken),
      },
      credentials: "include",
    }).catch((error) => {
      console.error("[NOTIFICATION] Failed to mark notification as read:", error);
    });
  }, [currentNotification]);

  const clearShownNotifications = useCallback(() => {
    shownNotificationIds.current = new Set();
  }, []);

  // Manual trigger for testing
  const triggerTestNotification = useCallback((type: "overdue" | "due-soon" | "urgent") => {
    const testNotifications: Record<string, PopupNotification> = {
      overdue: {
        id: "test-overdue",
        title: "Overdue Task",
        message: "Math Assignment - This is a test notification",
        type: "overdue",
        dueDate: new Date(Date.now() - 86400000).toISOString(),
      },
      "due-soon": {
        id: "test-due-soon",
        title: "Assignment Due Soon",
        message: "Physics Project is due in 2 hours",
        type: "due-soon",
        dueDate: new Date(Date.now() + 7200000).toISOString(),
      },
      urgent: {
        id: "test-urgent",
        title: "Urgent Task",
        message: "Chemistry Exam - High Priority",
        type: "urgent",
        dueDate: new Date(Date.now() + 3600000).toISOString(),
      },
    };

    const notification = testNotifications[type];
    console.log("[NOTIFICATION] Triggering test notification:", notification);
    setCurrentNotification(notification);
  }, []);

  return {
    currentNotification,
    dismissNotification,
    clearShownNotifications,
    triggerTestNotification,
  };
}
