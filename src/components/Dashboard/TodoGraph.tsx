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

  const handleNodeDragStop = async (_: any, node: any) => {
    if (!currentUser || !currentProject) return;

    const todoRef = doc(
      db,
      "users",
      currentUser.uid,
      "projects",
      currentProject.id,
      "todos",
      node.id
    );

    try {
      await updateDoc(todoRef, {
        position: node.position,
      });
      console.log(`Pozisyon güncellendi: ${node.id}`, node.position);
    } catch (error) {
      console.error("Pozisyon güncellenirken hata:", error);
    }
  };

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

          // Pozisyon verisi varsa ve geçerliyse al, yoksa default ver
          let position = { x: 400, y: 300 };
          if (
            data.position &&
            typeof data.position.x === "number" &&
            typeof data.position.y === "number"
          ) {
            position = data.position;
          }

          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            position,
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

    // Burada sadece Firestore’dan gelen pozisyonları kullanıyoruz.
    const newNodes: Node[] = todos.map((todo) => {
      const position = todo.position || { x: 400, y: 300 };
      currentPositionsRef.current.set(todo.id, position);

      return {
        id: todo.id,
        type: "todoNode",
        position,
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
        onNodeDragStop={handleNodeDragStop}
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
        // fitView kaldırıldı, pozisyon sabit kalması için
        // defaultViewport kaldırıldı, sayfa yenilemede karışıklık olmaması için
        className="bg-gray-50 dark:bg-gray-900"
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
        nodesDraggable={true}
        nodesConnectable={true}
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
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
    </motion.div>
  );
};

export default TodoGraph;