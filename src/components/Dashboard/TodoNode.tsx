import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@reactflow/core";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
  Flag,
  Edit3,
  Trash2,
} from "lucide-react";
import { Todo } from "../../types";
import clsx from "clsx";

interface TodoNodeData extends Todo {
  onToggleComplete: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
}

const TodoNode: React.FC<NodeProps<TodoNodeData>> = memo(
  ({ data, selected }) => {
    const {
      id,
      title,
      description,
      priority,
      completed,
      onToggleComplete,
      onEdit,
      onDelete,
    } = data;

    const handleDoubleClick = (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("button[data-checkbox]")) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      onEdit(data);
    };

    const priorityColors = {
      High: "border-red-400 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20",
      Medium:
        "border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20",
      Low: "border-green-400 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
    };

    const priorityIcons = {
      High: <Flag className="w-4 h-4 text-red-500" />,
      Medium: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
      Low: <Clock className="w-4 h-4 text-green-500" />,
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        onDoubleClick={handleDoubleClick}
        className={clsx(
          "w-[300px] rounded-xl border-2 shadow-lg backdrop-blur-sm relative cursor-move",
          completed
            ? "border-green-400 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 opacity-75"
            : priorityColors[priority],
          "hover:shadow-xl transition-all duration-200",
          selected &&
            "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900"
        )}
      >
        {/* Left Handle - Input */}
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="w-4 h-4 bg-blue-500 border-2 border-white shadow-md !cursor-crosshair !left-[-8px] !top-[50%] !transform !-translate-y-1/2"
        />

        {/* Right Handle - Output */}
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="w-4 h-4 bg-blue-500 border-2 border-white shadow-md !cursor-crosshair !right-[-8px] !top-[50%] !transform !-translate-y-1/2"
        />

        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete(id);
              }}
              data-checkbox
              className="flex-shrink-0 mr-3 mt-1"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {completed ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <Circle className="w-6 h-6 text-gray-400 hover:text-gray-600 transition-colors" />
              )}
            </motion.button>

            <div className="flex items-center space-x-2">
              {priorityIcons[priority]}
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                {priority}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <h3
              className={clsx(
                "font-bold text-gray-900 dark:text-white mb-2 text-lg leading-tight",
                completed && "line-through text-gray-500"
              )}
            >
              {title}
            </h3>
            {description && (
              <p
                className={clsx(
                  "text-sm text-gray-600 dark:text-gray-400 leading-relaxed",
                  completed && "line-through"
                )}
              >
                {description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(data);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <Edit3 className="w-3 h-3 mr-1" />
              Edit
            </motion.button>
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }
);

TodoNode.displayName = "TodoNode";

export default TodoNode;