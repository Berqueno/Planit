import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  useReactFlow,
  NodeChange,
  EdgeChange,
} from "@reactflow/core";
import { Controls } from "@reactflow/controls";
import { MiniMap } from "@reactflow/minimap";
import { Background, BackgroundVariant } from "@reactflow/background";
import { motion } from "framer-motion";
import { Todo } from "../../types";
import TodoNode from "./TodoNode";
import EmptyState from "./EmptyState";
import TaskModal from "./TaskModal";
import Calendar from "./Calendar";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../contexts/AuthContext";
import { useProject } from "../../contexts/ProjectContext";
import { useNotification } from "../../contexts/NotificationContext";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";

const nodeTypes = {
  todoNode: TodoNode,
};

interface TodoGraphProps {
  onEditTodo: (todo: Todo) => void;
}

const TodoGraph: React.FC<TodoGraphProps> = ({ onEditTodo }) => {
  const { currentUser } = useAuth();
  const { currentProject, createProject } = useProject();
  const { addNotification } = useNotification();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Todo | null>(null);
  const [clickPosition, setClickPosition] = useState<
    { x: number; y: number } | undefined
  >();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { screenToFlowPosition } = useReactFlow();

  const currentPositionsRef = useRef<Map<string, { x: number; y: number }>>(
    new Map()
  );

  const updatePositionInFirestore = useCallback(
    async (nodeId: string, position: { x: number; y: number }) => {
      if (!currentUser || !currentProject) return;

      try {
        const todoRef = doc(
          db,
          "users",
          currentUser.uid,
          "projects",
          currentProject.id,
          "todos",
          nodeId
        );
        await updateDoc(todoRef, {
          position: position,
        });
        console.log(`Position updated for task ${nodeId}:`, position);
      } catch (error) {
        console.error("Error updating position:", error);
        setTimeout(async () => {
          try {
            const todoRef = doc(
              db,
              "users",
              currentUser.uid,
              "projects",
              currentProject.id,
              "todos",
              nodeId
            );
            await updateDoc(todoRef, {
              position: position,
            });
          } catch (retryError) {
            console.error("Retry failed for position update:", retryError);
          }
        }, 1000);
      }
    },
    [currentUser, currentProject]
  );

  useEffect(() => {
    if (!currentUser || !currentProject) return;

    const dateKey = selectedDate.toISOString().split("T")[0];

    const unsubscribe = onSnapshot(
      query(
        collection(
          db,
          "users",
          currentUser.uid,
          "projects",
          currentProject.id,
          "todos"
        ),
        where("dateKey", "==", dateKey)
      ),
      (snapshot) => {
        const todosData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            position: data.position || { x: 400, y: 300 },
          };
        }) as Todo[];

        console.log(
          "Loaded todos with positions:",
          todosData.map((t) => ({
            id: t.id,
            title: t.title,
            position: t.position,
          }))
        );
        setTodos(todosData);
      },
      (error) => {
        console.error("Error fetching todos:", error);
        toast.error("Failed to load todos");
      }
    );

    return unsubscribe;
  }, [currentUser, currentProject, selectedDate]);

  const generateNonOverlappingPosition = useCallback(
    (existingTodos: Todo[], preferredPosition?: { x: number; y: number }) => {
      const nodeWidth = 320;
      const nodeHeight = 200;
      const gridSize = 50;

      let x = preferredPosition?.x || 400;
      let y = preferredPosition?.y || 300;

      x = Math.round(x / gridSize) * gridSize;
      y = Math.round(y / gridSize) * gridSize;

      const isPositionOccupied = (checkX: number, checkY: number) => {
        return existingTodos.some((todo) => {
          if (!todo.position) return false;
          const dx = Math.abs(todo.position.x - checkX);
          const dy = Math.abs(todo.position.y - checkY);
          return dx < nodeWidth && dy < nodeHeight;
        });
      };

      if (isPositionOccupied(x, y)) {
        let radius = gridSize;
        let found = false;

        while (!found && radius < 1000) {
          for (let angle = 0; angle < 360; angle += 45) {
            const radians = (angle * Math.PI) / 180;
            const testX =
              Math.round((x + Math.cos(radians) * radius) / gridSize) *
              gridSize;
            const testY =
              Math.round((y + Math.sin(radians) * radius) / gridSize) *
              gridSize;

            if (!isPositionOccupied(testX, testY)) {
              x = testX;
              y = testY;
              found = true;
              break;
            }
          }
          radius += gridSize;
        }
      }

      return { x, y };
    },
    []
  );

  useEffect(() => {
    if (todos.length === 0) {
      setNodes([]);
      setEdges([]);
      currentPositionsRef.current.clear();
      return;
    }

    const newNodes: Node[] = todos.map((todo) => {
      const currentPosition = currentPositionsRef.current.get(todo.id);
      const existingNode = nodes.find((n) => n.id === todo.id);

      let position: { x: number; y: number };

      if (currentPosition) {
        position = currentPosition;
      } else if (existingNode?.position) {
        position = existingNode.position;
        currentPositionsRef.current.set(todo.id, existingNode.position);
      } else if (todo.position) {
        position = todo.position;
        currentPositionsRef.current.set(todo.id, todo.position);
      } else {
        position = generateNonOverlappingPosition(todos, { x: 400, y: 300 });
        currentPositionsRef.current.set(todo.id, position);
      }

      return {
        id: todo.id,
        type: "todoNode",
        position: position,
        data: {
          ...todo,
          onToggleComplete: handleToggleComplete,
          onEdit: handleEditTask,
          onDelete: handleDeleteTodo,
        },
        draggable: true,
        selectable: true,
        connectable: true,
      };
    });

    const newEdges: Edge[] = [];
    todos.forEach((todo) => {
      todo.dependencies.forEach((depId) => {
        if (todos.some((t) => t.id === depId)) {
          newEdges.push({
            id: `${depId}-${todo.id}`,
            source: depId,
            target: todo.id,
            sourceHandle: "right",
            targetHandle: "left",
            type: "smoothstep",
            animated: true,
            style: {
              stroke: "#3B82F6",
              strokeWidth: 2,
            },
            markerEnd: {
              type: "arrowclosed",
              color: "#3B82F6",
            },
          });
        }
      });
    });

    console.log(
      "Setting nodes with positions:",
      newNodes.map((n) => ({ id: n.id, position: n.position }))
    );
    setNodes(newNodes);
    setEdges(newEdges);
  }, [todos, generateNonOverlappingPosition]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);

      changes.forEach((change) => {
        if (change.type === "position" && change.position) {
          currentPositionsRef.current.set(change.id, change.position);

          if (change.dragging === false) {
            console.log(`Saving position for ${change.id}:`, change.position);
            updatePositionInFirestore(change.id, change.position);
          }
        }
      });
    },
    [onNodesChange, updatePositionInFirestore]
  );

  const handleEdgesChange = useCallback(
    async (changes: EdgeChange[]) => {
      onEdgesChange(changes);

      for (const change of changes) {
        if (change.type === "remove" && currentUser && currentProject) {
          const [sourceId, targetId] = change.id.split("-");
          try {
            const targetTodo = todos.find((t) => t.id === targetId);
            if (targetTodo) {
              const newDependencies = targetTodo.dependencies.filter(
                (dep) => dep !== sourceId
              );
              await updateDoc(
                doc(
                  db,
                  "users",
                  currentUser.uid,
                  "projects",
                  currentProject.id,
                  "todos",
                  targetId
                ),
                {
                  dependencies: newDependencies,
                  position: targetTodo.position,
                }
              );
              addNotification({
                type: "info",
                title: "Dependency Removed",
                message: "Task dependency has been removed successfully",
                visibility: "toast",
              });
            }
          } catch (error) {
            console.error("Error removing dependency:", error);
            toast.error("Failed to remove dependency");
          }
        }
      }
    },
    [onEdgesChange, currentUser, currentProject, todos, addNotification]
  );

  const handleToggleComplete = async (id: string) => {
    if (!currentUser || !currentProject) return;

    try {
      const todo = todos.find((t) => t.id === id);
      if (todo) {
        const currentPosition =
          currentPositionsRef.current.get(id) || todo.position;

        await updateDoc(
          doc(
            db,
            "users",
            currentUser.uid,
            "projects",
            currentProject.id,
            "todos",
            id
          ),
          {
            completed: !todo.completed,
            position: currentPosition,
          }
        );

        addNotification({
          type: "success",
          title: todo.completed ? "Task Reopened" : "Task Completed",
          message: `${todo.title} has been ${
            todo.completed ? "marked as incomplete" : "completed"
          }`,
          visibility: "toast",
        });
      }
    } catch (error) {
      console.error("Error updating todo:", error);
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTodo = async (id: string) => {
    if (!currentUser || !currentProject) return;

    try {
      const todo = todos.find((t) => t.id === id);
      await deleteDoc(
        doc(
          db,
          "users",
          currentUser.uid,
          "projects",
          currentProject.id,
          "todos",
          id
        )
      );

      currentPositionsRef.current.delete(id);

      const todosWithDeps = todos.filter((t) => t.dependencies.includes(id));
      for (const todo of todosWithDeps) {
        const currentPosition =
          currentPositionsRef.current.get(todo.id) || todo.position;
        await updateDoc(
          doc(
            db,
            "users",
            currentUser.uid,
            "projects",
            currentProject.id,
            "todos",
            todo.id
          ),
          {
            dependencies: todo.dependencies.filter((dep) => dep !== id),
            position: currentPosition,
          }
        );
      }

      addNotification({
        type: "info",
        title: "Task Deleted",
        message: `${todo?.title} has been deleted successfully`,
        visibility: "toast",
      });
    } catch (error) {
      console.error("Error deleting todo:", error);
      toast.error("Failed to delete task");
    }
  };

  const handleEditTask = (todo: Todo) => {
    setEditingTask(todo);
    setIsModalOpen(true);
    onEditTodo(todo);
  };

  const handleCreateTask = async (position?: { x: number; y: number }) => {
    if (!currentProject) {
      try {
        await createProject("Planit Project");
      } catch (error) {
        console.error("Proje oluşturulamadı:", error);
        return;
      }
    }

    setEditingTask(null);
    setClickPosition(position);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (taskData: Omit<Todo, "id" | "createdAt">) => {
    if (!currentUser || !currentProject) return;

    try {
      const dateKey = selectedDate.toISOString().split("T")[0];

      const position = generateNonOverlappingPosition(todos, taskData.position);

      const docRef = await addDoc(
        collection(
          db,
          "users",
          currentUser.uid,
          "projects",
          currentProject.id,
          "todos"
        ),
        {
          ...taskData,
          position,
          dateKey,
          createdAt: new Date(),
        }
      );

      currentPositionsRef.current.set(docRef.id, position);

      addNotification({
        type: "success",
        title: "Task Created",
        message: `${taskData.title} has been created successfully`,
        visibility: "toast",
      });
    } catch (error) {
      console.error("Error creating todo:", error);
      toast.error("Failed to create task");
    }
  };

  const handleUpdateTask = async (todo: Todo) => {
    if (!currentUser || !currentProject) return;

    try {
      const currentPosition =
        currentPositionsRef.current.get(todo.id) || todo.position;

      const updateData = {
        title: todo.title,
        description: todo.description,
        priority: todo.priority,
        position: currentPosition,
      };

      console.log(
        `Updating task ${todo.id} while preserving position:`,
        updateData.position
      );

      await updateDoc(
        doc(
          db,
          "users",
          currentUser.uid,
          "projects",
          currentProject.id,
          "todos",
          todo.id
        ),
        updateData
      );
      setEditingTask(null);

      addNotification({
        type: "success",
        title: "Task Updated",
        message: `${todo.title} has been updated successfully`,
        visibility: "toast",
      });
    } catch (error) {
      console.error("Error updating todo:", error);
      toast.error("Failed to update task");
    }
  };

  const onConnect = useCallback(
    async (params: Connection) => {
      if (!currentUser || !currentProject || !params.source || !params.target)
        return;
      if (params.source === params.target) {
        toast.error("Cannot connect a task to itself");
        return;
      }

      try {
        const targetTodo = todos.find((t) => t.id === params.target);
        if (targetTodo) {
          const newDependencies = [...targetTodo.dependencies];
          if (!newDependencies.includes(params.source)) {
            newDependencies.push(params.source);

            const currentPosition =
              currentPositionsRef.current.get(params.target) ||
              targetTodo.position;

            await updateDoc(
              doc(
                db,
                "users",
                currentUser.uid,
                "projects",
                currentProject.id,
                "todos",
                params.target
              ),
              {
                dependencies: newDependencies,
                position: currentPosition,
              }
            );

            addNotification({
              type: "success",
              title: "Dependency Added",
              message: "Task dependency has been created successfully",
              visibility: "toast",
            });
          } else {
            toast.info("Dependency already exists");
          }
        }
      } catch (error) {
        console.error("Error adding dependency:", error);
        toast.error("Failed to add dependency");
      }
    },
    [todos, currentUser, currentProject, addNotification]
  );

  const onPaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      console.log("Double-click detected at position:", position);
      handleCreateTask(position);
    },
    [screenToFlowPosition]
  );

  if (todos.length === 0) {
    return (
      <div className="h-full w-full relative pt-20">
        <EmptyState onCreateTask={handleCreateTask} />
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveTask}
          onUpdate={handleUpdateTask}
          editingTask={editingTask}
          position={clickPosition}
        />
        <Calendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full w-full relative pt-20"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onPaneClick={(event) => {
          const now = Date.now();
          const timeSinceLastClick =
            now - (onPaneDoubleClick as any).lastClickTime;
          (onPaneDoubleClick as any).lastClickTime = now;

          if (timeSinceLastClick < 300) {
            console.log("Manual double-click detected on pane");
            const position = screenToFlowPosition({
              x: event.clientX,
              y: event.clientY,
            });
            handleCreateTask(position);
          }
        }}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        className="bg-gray-50 dark:bg-gray-900"
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={false}
        preventScrolling={true}
        connectionLineType="smoothstep"
        connectionLineStyle={{ stroke: "#3B82F6", strokeWidth: 2 }}
      >
        <Controls
          className="bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 shadow-lg backdrop-blur-sm"
          showInteractive={false}
        />
        <MiniMap
          className="bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 shadow-lg backdrop-blur-sm"
          nodeColor="#3B82F6"
          maskColor="rgba(0, 0, 0, 0.1)"
          pannable
          zoomable
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="#9CA3AF"
          className="opacity-30 dark:opacity-20"
        />
      </ReactFlow>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        onUpdate={handleUpdateTask}
        editingTask={editingTask}
        position={clickPosition}
      />

      <Calendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />

      {/* Create Task Button */}
      <motion.button
        onClick={() => handleCreateTask()}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-60 w-14 h-14 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center z-10 backdrop-blur-sm transition-all duration-200"
      >
        <Plus className="w-6 h-6" />
      </motion.button>
    </motion.div>
  );
};

export default TodoGraph;