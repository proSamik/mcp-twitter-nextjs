"use client";

import { useNotifications } from "../app/store";
import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Notification manager component that handles displaying notifications from the store
 * This component should be placed in the root layout to handle all notifications
 */
export function NotificationManager() {
  const { notifications, remove } = useNotifications();

  /**
   * Display notifications using Sonner toast
   */
  useEffect(() => {
    notifications.forEach((notification) => {
      // Check if we've already shown this notification
      const hasBeenShown = localStorage.getItem(
        `notification-${notification.id}`,
      );

      if (!hasBeenShown) {
        // Show the toast based on notification type
        toast[notification.type](notification.message, {
          duration: 5000,
          onDismiss: () => {
            remove(notification.id);
          },
        });

        // Mark as shown
        localStorage.setItem(`notification-${notification.id}`, "true");

        // Clean up localStorage entry after removal
        setTimeout(() => {
          localStorage.removeItem(`notification-${notification.id}`);
        }, 6000);
      }
    });
  }, [notifications, remove]);

  // This component doesn't render anything visible
  return null;
}

/**
 * Hook to trigger common notification types
 */
export function useToastNotifications() {
  const { add } = useNotifications();

  return {
    success: (message: string) => add({ type: "success", message }),
    error: (message: string) => add({ type: "error", message }),
    warning: (message: string) => add({ type: "warning", message }),
    info: (message: string) => add({ type: "info", message }),
  };
}
