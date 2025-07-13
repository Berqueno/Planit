import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Settings,
  LogOut,
  User,
  ChevronDown,
  HelpCircle,
  Calendar,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useProject } from "../../contexts/ProjectContext";
import { useNotification } from "../../contexts/NotificationContext";
import ThemeSwitcher from "../ThemeSwitcher";
import ProjectSwitcher from "./ProjectSwitcher";
import NotificationPanel from "./NotificationPanel";
import HelpModal from "./HelpModal";
import toast from "react-hot-toast";

const Navbar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { currentProject } = useProject();
  const { notifications, unreadCount } = useNotification();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const formatDateTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Istanbul", // UTC+3
    };
    return date.toLocaleDateString("en-US", options);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50"
      >
        <div className="max-w-full px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left Section - Logo & Date-Time */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center space-x-4"
            >
              <div className="flex items-center">
                <img
                  src="./512W.png"
                  alt="Planit Logo"
                  className="w-12 h-12 object-contain dark:block hidden"
                />
                <img
                  src="./512B.png"
                  alt="Planit Logo"
                  className="w-12 h-12 object-contain dark:hidden block"
                />
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Planit
                  </h1>
                  <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDateTime(currentTime)}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Center Section - Project Switcher */}
            <div className="flex-1 flex justify-center max-w-md mx-8">
              <ProjectSwitcher />
            </div>

            {/* Right Section - User Controls */}
            <div className="flex items-center space-x-3">
              {/* Theme Switcher */}
              <ThemeSwitcher />

              {/* Notifications */}
              <motion.button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </motion.span>
                )}
              </motion.button>

              {/* User Menu */}
              <div className="relative">
                <motion.button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center space-x-2 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </motion.button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Signed in as
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {currentUser?.email}
                        </p>
                      </div>

                      <div className="p-2">
                        <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                          <Settings className="w-4 h-4 mr-3" />
                          Account Settings
                        </button>

                        <button
                          onClick={() => {
                            setIsHelpOpen(true);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <HelpCircle className="w-4 h-4 mr-3" />
                          Help / Quick Tips
                        </button>

                        <motion.button
                          onClick={handleLogout}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Panel */}
        <NotificationPanel
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
          notifications={notifications}
        />
      </motion.nav>

      {/* Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
};

export default Navbar;