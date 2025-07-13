import React, { createContext, useContext, useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./AuthContext";
import { useNotification } from "./NotificationContext";
import { Project } from "../types";

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  switchProject: (projectId: string) => void;
  createProject: (name: string) => Promise<void>;
  updateProjectName: (projectId: string, name: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  reorderProjects: (projectIds: string[]) => Promise<void>;
  loading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
};

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setProjects([]);
      setCurrentProject(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, "users", currentUser.uid, "projects"),
      (snapshot) => {
        const projectsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Project[];

        setProjects(projectsData);
        if (!currentProject && projectsData.length > 0) {
          setCurrentProject(projectsData[0]);
        }

        setLoading(false);
      },
      (error) => {
        console.error("Error fetching projects:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser, currentProject]);

  const switchProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      setCurrentProject(project);
    }
  };

  const createProject = async (name: string) => {
    if (!currentUser) return;

    try {
      const docRef = await addDoc(
        collection(db, "users", currentUser.uid, "projects"),
        {
          name,
          createdAt: new Date(),
        }
      );

      const newProject: Project = {
        id: docRef.id,
        name,
        createdAt: new Date(),
      };

      setCurrentProject(newProject);

      addNotification({
        title: "Proje Oluşturuldu",
        message: `Yeni proje "${name}" başarıyla oluşturuldu.`,
        type: "success",
        visibility: "both",
      });
    } catch (error) {
      console.error("Error creating project:", error);

      addNotification({
        title: "Hata",
        message: "Proje oluşturulamadı.",
        type: "error",
        visibility: "both",
      });

      throw error;
    }
  };

  const updateProjectName = async (projectId: string, name: string) => {
    if (!currentUser) return;

    try {
      await updateDoc(
        doc(db, "users", currentUser.uid, "projects", projectId),
        {
          name,
        }
      );

      if (currentProject?.id === projectId) {
        setCurrentProject({ ...currentProject, name });
      }

      addNotification({
        title: "Proje Güncellendi",
        message: `Proje adı "${name}" olarak güncellendi.`,
        type: "success",
        visibility: "both",
      });
    } catch (error) {
      console.error("Error updating project:", error);

      addNotification({
        title: "Hata",
        message: "Proje güncellenemedi.",
        type: "error",
        visibility: "both",
      });

      throw error;
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!currentUser) return;

    try {
      const projectToDelete = projects.find((p) => p.id === projectId);

      await deleteDoc(doc(db, "users", currentUser.uid, "projects", projectId));

      if (currentProject?.id === projectId) {
        const remainingProjects = projects.filter((p) => p.id !== projectId);
        if (remainingProjects.length > 0) {
          setCurrentProject(remainingProjects[0]);
        } else {
          setCurrentProject(null);
        }
      }

      addNotification({
        title: "Proje Silindi",
        message: `Proje "${projectToDelete?.name}" silindi.`,
        type: "warning",
        visibility: "both",
      });
    } catch (error) {
      console.error("Error deleting project:", error);

      addNotification({
        title: "Hata",
        message: "Proje silinemedi.",
        type: "error",
        visibility: "both",
      });

      throw error;
    }
  };

  const reorderProjects = async (projectIds: string[]) => {
    if (!currentUser) return;

    try {
      const updatePromises = projectIds.map((projectId, index) =>
        updateDoc(doc(db, "users", currentUser.uid, "projects", projectId), {
          order: index,
        })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error reordering projects:", error);
      throw error;
    }
  };

  const value: ProjectContextType = {
    currentProject,
    projects,
    switchProject,
    createProject,
    updateProjectName,
    deleteProject,
    reorderProjects,
    loading,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};