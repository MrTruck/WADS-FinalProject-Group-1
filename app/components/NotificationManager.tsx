"use client";

import { useNotifications } from "@/app/hooks/useNotifications";
import NotificationPopup from "./NotificationPopup";

export default function NotificationManager() {
  const { currentNotification, dismissNotification } = useNotifications();

  return (
    <NotificationPopup
      notification={currentNotification}
      onDismiss={dismissNotification}
    />
  );
}
