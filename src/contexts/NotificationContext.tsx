import React, { createContext, useContext, useState, useEffect } from "react";
import { Notification, NotificationVisibility } from "../types";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (
    notification: Omit<
      Notification,
      "id" | "createdAt" | "read" | "visibility"
    > & {
      visibility?: NotificationVisibility;
    }
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  removeToastOnly: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const stored = localStorage.getItem("notifications");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    const toastTimeouts = notifications
      .filter((n) => n.visibility === "toast")
      .map((n) =>
        setTimeout(() => {
          setNotifications((prev) => prev.filter((x) => x.id !== n.id));
        }, 5000)
      );

    const toastToPanelTimeouts = notifications
      .filter((n) => n.visibility === "both")
      .map((n) =>
        setTimeout(() => {
          setNotifications((prev) =>
            prev.map((x) => (x.id === n.id ? { ...x, visibility: "panel" } : x))
          );
        }, 5000)
      );

    return () => {
      toastTimeouts.forEach(clearTimeout);
      toastToPanelTimeouts.forEach(clearTimeout);
    };
  }, [notifications]);

  const addNotification = (
    notificationData: Omit<
      Notification,
      "id" | "createdAt" | "read" | "visibility"
    > & {
      visibility?: NotificationVisibility;
    }
  ) => {
    const visibility = notificationData.visibility ?? "toast";
    const id = Date.now().toString();

    const newNotification: Notification = {
      id,
      ...notificationData,
      visibility,
      createdAt: new Date(),
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev]);
  };

  const removeToastOnly = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id && n.visibility === "both"
          ? { ...n, visibility: "panel" }
          : n
      )
    );
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  const unreadCount = notifications.filter(
    (n) => (n.visibility === "panel" || n.visibility === "both") && !n.read
  ).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    removeToastOnly,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};