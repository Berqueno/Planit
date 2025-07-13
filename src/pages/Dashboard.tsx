import React, { useState } from "react";
import { motion } from "framer-motion";
import { ReactFlowProvider } from "@reactflow/core";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { Todo } from "../types";
import Navbar from "../components/Dashboard/Navbar";
import TodoGraph from "../components/Dashboard/TodoGraph";
import toast from "react-hot-toast";

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  const handleCreateTodo = async (todoData: Omit<Todo, "id" | "createdAt">) => {
    if (!currentUser) return;

    try {
      await addDoc(collection(db, "users", currentUser.uid, "todos"), {
        ...todoData,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Error creating todo:", error);
      toast.error("Failed to create task");
    }
  };

  const handleUpdateTodo = async (todo: Todo) => {
    if (!currentUser) return;

    try {
      await updateDoc(doc(db, "users", currentUser.uid, "todos", todo.id), {
        title: todo.title,
        description: todo.description,
        priority: todo.priority,
      });
      setEditingTodo(null);
    } catch (error) {
      console.error("Error updating todo:", error);
      toast.error("Failed to update task");
    }
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
  };

  const handleCancelEdit = () => {
    setEditingTodo(null);
  };

  return (
    <ReactFlowProvider>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden"
      >
        <Navbar />
        <div className="h-full">
          <TodoGraph onEditTodo={handleEditTodo} />
        </div>
      </motion.div>
    </ReactFlowProvider>
  );
};

export default Dashboard;