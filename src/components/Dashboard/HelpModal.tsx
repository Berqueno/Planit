import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MousePointer,
  Move,
  Link,
  Calendar,
  Folder,
  ExternalLink,
} from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const tips = [
    {
      icon: <MousePointer className="w-5 h-5 text-blue-500" />,
      title: "Create Tasks",
      description:
        "Double-click anywhere on the canvas to create a new task at that position",
    },
    {
      icon: <Move className="w-5 h-5 text-green-500" />,
      title: "Move Tasks",
      description:
        "Drag tasks around the canvas to organize your workflow layout",
    },
    {
      icon: <Link className="w-5 h-5 text-purple-500" />,
      title: "Connect Dependencies",
      description:
        "Drag from one task to another to create dependency connections",
    },
    {
      icon: <Calendar className="w-5 h-5 text-orange-500" />,
      title: "Calendar Navigation",
      description:
        "Use the bottom-left calendar to switch between different days and view day-specific tasks",
    },
    {
      icon: <Folder className="w-5 h-5 text-indigo-500" />,
      title: "Project Management",
      description:
        "Switch between projects using the center dropdown - each project has independent calendars and tasks",
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Quick Tips & Help
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="space-y-6">
                {tips.map((tip, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex-shrink-0 p-2 bg-white dark:bg-gray-600 rounded-lg">
                      {tip.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {tip.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {tip.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  Need More Help?
                </h3>
                <p className="text-blue-700 dark:text-blue-400 text-sm mb-3">
                  Visit our comprehensive documentation for detailed guides and
                  tutorials.
                </p>
                <motion.a
                  href="#"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Documentation
                </motion.a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HelpModal;