import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, AlertTriangle, Clock, Flag, Smile } from "lucide-react";
import { Todo } from "../../types";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Todo, "id" | "createdAt">) => void;
  onUpdate: (task: Todo) => void;
  editingTask?: Todo | null;
  position?: { x: number; y: number };
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  editingTask,
  position,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium" as "Low" | "Medium" | "High",
  });
  const [selectedEmoji, setSelectedEmoji] = useState<string>("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const commonEmojis = [
    "📝",
    "✅",
    "🎯",
    "🚀",
    "💡",
    "🔥",
    "⭐",
    "📊",
    "💼",
    "🏆",
    "🎨",
    "🔧",
    "📱",
    "💻",
    "📚",
    "🎵",
    "🍕",
    "☕",
    "🏃",
    "💪",
    "🌟",
    "🎉",
    "🔔",
    "📅",
    "🌈",
    "🎪",
    "🎭",
    "🎲",
    "🎸",
    "🎤",
    "🎬",
    "📷",
  ];

  useEffect(() => {
    if (editingTask) {
      const emojiMatch = editingTask.title.match(/^(\p{Emoji})\s*/u);
      const emoji = emojiMatch ? emojiMatch[1] : "";
      const titleWithoutEmoji = editingTask.title.replace(
        /^(\p{Emoji})\s*/u,
        ""
      );

      setFormData({
        title: titleWithoutEmoji,
        description: editingTask.description,
        priority: editingTask.priority,
      });
      setSelectedEmoji(emoji);
    } else {
      setFormData({
        title: "",
        description: "",
        priority: "Medium",
      });
      setSelectedEmoji("");
    }
  }, [editingTask, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) return;

    const finalTitle = selectedEmoji
      ? `${selectedEmoji} ${formData.title}`
      : formData.title;

    if (editingTask) {
      onUpdate({
        ...editingTask,
        ...formData,
        title: finalTitle,
      });
    } else {
      onSave({
        ...formData,
        title: finalTitle,
        completed: false,
        dependencies: [],
        position: position || {
          x: Math.random() * 400 + 100,
          y: Math.random() * 300 + 100,
        },
      });
    }

    onClose();
  };

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    setShowEmojiPicker(false);
  };

  const priorityIcons = {
    High: <Flag className="w-4 h-4 text-red-500" />,
    Medium: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
    Low: <Clock className="w-4 h-4 text-green-500" />,
  };

  const priorityColors = {
    High: "border-red-200 bg-red-50 dark:bg-red-900/20",
    Medium: "border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20",
    Low: "border-green-200 bg-green-50 dark:bg-green-900/20",
  };

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
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingTask ? "Edit Task" : "Create New Task"}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Task Title *
                </label>
                <div className="flex space-x-3">
                  {/* Emoji Picker Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="w-12 h-12 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 flex items-center justify-center text-xl bg-white dark:bg-gray-700 transition-colors"
                    >
                      {selectedEmoji || (
                        <Smile className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {/* Emoji Picker Dropdown */}
                    <AnimatePresence>
                      {showEmojiPicker && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -10 }}
                          className="absolute top-full mt-2 left-0 w-64 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl z-50 p-3"
                        >
                          <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
                            {/* Clear emoji option */}
                            <button
                              type="button"
                              onClick={() => handleEmojiSelect("")}
                              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                              title="No emoji"
                            >
                              <X className="w-4 h-4 text-gray-400" />
                            </button>
                            {commonEmojis.map((emoji, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => handleEmojiSelect(emoji)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors text-lg"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Title Input */}
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter task title"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  rows={3}
                  placeholder="Enter task description (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Priority
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["Low", "Medium", "High"] as const).map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority })}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        formData.priority === priority
                          ? priorityColors[priority] + " border-current"
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        {priorityIcons[priority]}
                        <span className="text-sm font-medium">{priority}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <motion.button
                  type="button"
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingTask ? "Update" : "Create"} Task
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TaskModal;