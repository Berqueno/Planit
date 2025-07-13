import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  Trash2,
} from "lucide-react";
import { Notification } from "../../types";
import { useNotification } from "../../contexts/NotificationContext";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  notifications,
}) => {
  const { removeNotification, markAsRead } = useNotification();

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "error":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const formatTime = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const handleDeleteNotification = (
    e: React.MouseEvent<HTMLButtonElement>,
    notificationId: string
  ) => {
    e.stopPropagation();
    removeNotification(notificationId);
  };

  const recentToastNotifications = (notifications || [])
    .filter((n) => n.visibility === "toast" || n.visibility === "both")
    .slice(0, 3)
    .reverse();

  useEffect(() => {
    const timers = recentToastNotifications.map((notification) =>
      setTimeout(() => {
        removeNotification(notification.id);
      }, 5000)
    );
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [recentToastNotifications, removeNotification]);

  return (
    <>
      {/* Toast Notifications */}
      <AnimatePresence>
        {recentToastNotifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed right-6 z-[9999]"
            style={{ top: 84 + index * 72 }}
          >
            {/* Toast Box*/}
            <motion.div
              className="relative overflow-hidden bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white px-4 pt-3 pb-5 rounded-xl shadow-md flex flex-col space-y-2 w-80 hover:opacity-90 transition-all"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-start space-x-3">
                {getNotificationIcon(notification.type)}
                <div className="flex-1">
                  <p className="font-semibold">{notification.title}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {notification.message}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 5, ease: "linear" }}
                className="h-1 w-full bg-green-500 rounded-b-xl origin-left absolute left-0 bottom-0"
              />
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Full Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 right-6 w-80 max-h-[400px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notifications
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {notifications.length} total
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                aria-label="Close notifications panel"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Notification List */}
            <div
              className="overflow-y-auto h-full pb-16 pr-1.5 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800"
              style={{ scrollbarGutter: "stable" }}
            >
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-6">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                    <Info className="w-6 h-6 opacity-50" />
                  </div>
                  <p className="font-medium">No notifications</p>
                  <p className="text-xs text-center mt-1">
                    You're all caught up!
                  </p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {notifications
                    .filter(
                      (n) => n.visibility === "panel" || n.visibility === "both"
                    )
                    .slice(0, 10)
                    .map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`group relative p-3 rounded-lg border transition-all cursor-pointer ${
                          notification.read
                            ? "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                            : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"
                        } hover:shadow-sm`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start space-x-2">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs font-semibold leading-tight ${
                                notification.read
                                  ? "text-gray-700 dark:text-gray-300"
                                  : "text-gray-900 dark:text-white"
                              }`}
                            >
                              {notification.title}
                            </p>
                            <p
                              className={`text-xs mt-1 leading-tight line-clamp-2 ${
                                notification.read
                                  ? "text-gray-500 dark:text-gray-400"
                                  : "text-gray-600 dark:text-gray-300"
                              }`}
                            >
                              {notification.message}
                            </p>
                            <div className="flex items-center space-x-1 text-xs text-gray-400 dark:text-gray-500 mt-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(notification.createdAt)}</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) =>
                              handleDeleteNotification(e, notification.id)
                            }
                            className="flex-shrink-0 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                            aria-label="Delete notification"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </button>
                        </div>
                        {!notification.read && (
                          <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        )}
                      </motion.div>
                    ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NotificationPanel;