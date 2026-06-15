"use client";

import { useEffect, useState, useCallback, useRef } from "react";

type PopupNotification = {
  id: string;
  title: string;
  message: string;
  type: "urgent" | "due-soon" | "overdue";
  dueDate?: string;
  dismissable?: boolean;
};

type Task = {
  task_id: string;
  title: string;
  due_date?: string | null;
  status: string;
  priority: string;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const CHECK_INTERVAL = 30000; // Check every 30 seconds

export function useNotifications() {
  const [currentNotification, setCurrentNotification] = useState<PopupNotification | null>(null);
  const [notificationQueue, setNotificationQueue] = useState<PopupNotification[]>([]);
  const shownNotificationIds = useRef<Set<string>>(new Set());

  // Fetch tasks and check for urgent matters
  const checkForUrgentTasks = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/tasks", {
        credentials: "include",
      });

      if (!response.ok) {
        console.warn("[NOTIFICATION] Failed to fetch tasks:", response.status);
        return;
      }

      const data = await response.json();
      console.log("[NOTIFICATION] Raw API response:", data);
      
      // Handle both response formats - safely extract tasks array
      let tasks: Task[] = [];
      if (Array.isArray(data)) {
        tasks = data;
      } else if (Array.isArray(data.tasks)) {
        tasks = data.tasks;
      } else if (data.data && Array.isArray(data.data.tasks)) {
        tasks = data.data.tasks;
      } else if (data.data && Array.isArray(data.data)) {
        tasks = data.data;
      }
      
      console.log("[NOTIFICATION] Fetched tasks:", tasks, "Count:", tasks.length);
      const now = Date.now();

      const newNotifications: PopupNotification[] = [];

      if (!Array.isArray(tasks)) {
        console.warn("[NOTIFICATION] Tasks is not an array:", tasks);
        return;
      }

      tasks.forEach((task) => {
        console.log(`[NOTIFICATION] Checking task: ${task.title}`, {
          due_date: task.due_date,
          status: task.status,
          priority: task.priority,
          alreadyShown: shownNotificationIds.current.has(task.task_id),
        });

        if (!task?.due_date || task.status === "COMPLETED") {
          console.log(`[NOTIFICATION] Skipping ${task.title}: no due_date or completed`);
          return;
        }

        const taskId = task.task_id;
        if (shownNotificationIds.current.has(taskId)) {
          console.log(`[NOTIFICATION] Skipping ${task.title}: already shown`);
          return;
        }

        const due = Date.parse(task.due_date);
        const timeDiff = due - now;
        const dayMs = ONE_DAY_MS;

        console.log(`[NOTIFICATION] Task ${task.title} - time diff: ${timeDiff}ms`, {
          isOverdue: timeDiff < 0,
          isDueSoon: timeDiff > 0 && timeDiff <= dayMs,
          hoursLeft: Math.floor(timeDiff / (60 * 60 * 1000)),
        });

        // Check for overdue tasks
        if (task.status === "OVERDUE" && timeDiff < 0) {
          console.log(`[NOTIFICATION] Creating OVERDUE notification for ${task.title}`);
          newNotifications.push({
            id: `${taskId}-overdue`,
            title: "Overdue Task",
            message: task.title,
            type: "overdue",
            dueDate: task.due_date,
          });
        }
        // Check for tasks due in 1 day or less
        else if (timeDiff > 0 && timeDiff <= dayMs) {
          const hoursLeft = Math.floor(timeDiff / (60 * 60 * 1000));
          console.log(`[NOTIFICATION] Creating DUE_SOON notification for ${task.title}`);
          newNotifications.push({
            id: `${taskId}-due-soon`,
            title: "Assignment Due Soon",
            message: `${task.title} is due in ${hoursLeft} ${hoursLeft === 1 ? "hour" : "hours"}`,
            type: "due-soon",
            dueDate: task.due_date,
          });
        }
        // Check for urgent tasks
        else if (task.priority === "URGENT") {
          console.log(`[NOTIFICATION] Creating URGENT notification for ${task.title}`);
          newNotifications.push({
            id: `${taskId}-urgent`,
            title: "Urgent Task",
            message: task.title,
            type: "urgent",
            dueDate: task.due_date,
          });
        }
      });

      // Add new notifications to queue
      if (newNotifications.length > 0) {
        console.log("[NOTIFICATION] Found urgent tasks:", newNotifications);
        const newIds = newNotifications.map((n) => n.id);
        setNotificationQueue((prev) => [...prev, ...newNotifications]);
        // Update ref to track shown notifications
        newIds.forEach((id) => shownNotificationIds.current.add(id));
      } else {
        console.log("[NOTIFICATION] No new notifications to show");
      }
    } catch (error) {
      console.error("[NOTIFICATION] Error checking for urgent tasks:", error);
    }
  }, []);

  // Process notification queue
  useEffect(() => {
    if (notificationQueue.length > 0 && !currentNotification) {
      const next = notificationQueue[0];
      setCurrentNotification(next);
      setNotificationQueue((prev) => prev.slice(1));
    }
  }, [notificationQueue, currentNotification]);

  // Check for urgent tasks on interval
  useEffect(() => {
    console.log("[NOTIFICATION] Initializing notification system");
    checkForUrgentTasks();
    const interval = setInterval(() => {
      console.log("[NOTIFICATION] Running periodic check...");
      checkForUrgentTasks();
    }, CHECK_INTERVAL);
    return () => {
      clearInterval(interval);
      console.log("[NOTIFICATION] Cleaning up notification system");
    };
  }, [checkForUrgentTasks]);

  const dismissNotification = useCallback(() => {
    setCurrentNotification(null);
  }, []);

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
