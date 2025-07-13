export interface Todo {
  id: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  completed: boolean;
  createdAt: Date;
  dependencies: string[];
  position: { x: number; y: number };
  dateKey: string;
}

export interface User {
  id: string;
  email: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: Date;
}

export type NotificationVisibility = 'toast' | 'panel' | 'both';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  createdAt: Date;
  read: boolean;
  visibility: NotificationVisibility;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (...): void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  removeToastOnly: (id: string) => void;
}
