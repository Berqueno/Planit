import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './pages/Dashboard';
import '@reactflow/core/dist/style.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <ProjectProvider>
            <Router>
              <div className="App">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: 'var(--toast-bg)',
                      color: 'var(--toast-color)',
                    },
                    className: 'dark:bg-gray-800 dark:text-white',
                  }}
                />
              </div>
            </Router>
          </ProjectProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;