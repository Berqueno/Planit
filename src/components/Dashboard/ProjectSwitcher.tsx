import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  Plus,
  Folder,
  Check,
  Pencil,
  Trash2,
  GripVertical,
  X,
  Save,
} from "lucide-react";
import { useProject } from "../../contexts/ProjectContext";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const RenameModal = ({ project, onRename, onClose }) => {
  const [editedName, setEditedName] = useState(project.name);

  const handleSubmit = () => {
    if (editedName.trim() && editedName !== project.name) {
      onRename(project.id, editedName.trim());
    }
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-24 bg-white/10 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 10 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-xl border dark:border-gray-700"
      >
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
          Rename Project
        </h2>
        <input
          type="text"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white mb-4"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

const SortableProjectItem = ({
  project,
  currentProject,
  onClick,
  onRenameStart,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const restrictedTransform = transform
    ? {
        ...transform,
        x: 0,
      }
    : null;

  const style = {
    transform: CSS.Transform.toString(restrictedTransform),
    transition,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      onClick={() => onClick(project.id)}
      className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
    >
      <div className="flex items-center space-x-2 flex-1">
        <span
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="cursor-grab text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="w-4 h-4" />
        </span>
        <Folder className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span className="truncate">{project.name}</span>
      </div>
      <div className="flex items-center space-x-2">
        {currentProject?.id === project.id && (
          <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
        )}
        <Pencil
          onClick={(e) => {
            e.stopPropagation();
            onRenameStart(project);
          }}
          className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
        />
        <Trash2
          onClick={(e) => {
            e.stopPropagation();
            if (
              confirm(
                `Are you sure you want to delete project "${project.name}"?`
              )
            ) {
              onDelete(project.id);
            }
          }}
          className="w-4 h-4 text-red-500 hover:text-red-700 cursor-pointer"
        />
      </div>
    </motion.div>
  );
};

const ProjectSwitcher: React.FC = () => {
  const {
    currentProject,
    projects,
    switchProject,
    createProject,
    updateProjectName,
    deleteProject,
  } = useProject();

  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [orderedProjects, setOrderedProjects] = useState(projects);
  const [renameTarget, setRenameTarget] = useState(null);

  const containerRef = useRef(null);
  const scrollableRef = useRef<HTMLDivElement>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    setOrderedProjects(projects);
  }, [projects]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      await createProject(newProjectName.trim());
      setNewProjectName("");
      setIsCreating(false);
      setIsOpen(false);
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = orderedProjects.findIndex((p) => p.id === active.id);
      const newIndex = orderedProjects.findIndex((p) => p.id === over?.id);
      const newOrder = arrayMove(orderedProjects, oldIndex, newIndex);
      setOrderedProjects(newOrder);
    }
  };

  const resetScroll = () => {
    if (scrollableRef.current) {
      scrollableRef.current.scrollTop = 0;
      scrollableRef.current.scrollLeft = 0;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <div className="flex items-center space-x-2 min-w-0">
          <Folder className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {currentProject?.name || "Select Project"}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
          >
            <div
              ref={scrollableRef}
              onMouseLeave={resetScroll}
              onPointerLeave={resetScroll}
              onScrollCapture={() => {
                if (scrollableRef.current) {
                  clearTimeout(
                    (scrollableRef.current as any)._scrollResetTimer
                  );
                  (scrollableRef.current as any)._scrollResetTimer = setTimeout(
                    () => {
                      if (!scrollableRef.current?.matches(":hover")) {
                        resetScroll();
                      }
                    },
                    1000
                  );
                }
              }}
              className="max-h-72 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600"
            >
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={orderedProjects}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="p-2">
                    {orderedProjects.map((project) => (
                      <SortableProjectItem
                        key={project.id}
                        project={project}
                        currentProject={currentProject}
                        onClick={(id) => {
                          switchProject(id);
                          setIsOpen(false);
                        }}
                        onRenameStart={(project) => setRenameTarget(project)}
                        onDelete={(id) => deleteProject(id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                {isCreating ? (
                  <form onSubmit={handleCreateProject} className="space-y-2">
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Project name"
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="flex-1 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreating(false);
                          setNewProjectName("");
                        }}
                        className="flex-1 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <motion.button
                    onClick={() => setIsCreating(true)}
                    whileHover={{ scale: 1.02 }}
                    className="w-full flex items-center px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Project
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {renameTarget && (
          <RenameModal
            project={renameTarget}
            onRename={(id, name) => updateProjectName(id, name)}
            onClose={() => setRenameTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectSwitcher;