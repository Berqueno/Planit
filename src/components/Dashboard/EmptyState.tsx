import React from "react";
import { motion } from "framer-motion";
import { Plus, Target, ArrowRight } from "lucide-react";

interface EmptyStateProps {
  onCreateTask: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onCreateTask }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full text-center p-8"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <Target className="w-12 h-12 text-white" />
        </div>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-bold text-gray-900 dark:text-white mb-4"
      >
        Welcome to Planit
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md"
      >
        Start building your task workflow by creating your first task. Connect
        tasks with dependencies to visualize your project flow.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="space-y-4"
      >
        <motion.button
          onClick={onCreateTask}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create First Task
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl"
      >
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Create Tasks
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Add tasks with priorities and descriptions
          </p>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
            <ArrowRight className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Connect Dependencies
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Drag between tasks to create workflows
          </p>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
            <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Track Progress
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Visualize your project completion
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EmptyState;