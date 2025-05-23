import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/common/Header.js';
import AdminDashboard from './components/admin/AdminDashboard.js';
import Login from './components/auth/Login.js';
import { useAuth } from './context/AuthContext.js';
import './App.css';

// Simple Protected Route Component
function ProtectedRoute({ children, isAuthenticated }) {
  let location = useLocation();

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function App() {
  // Get auth state and functions from context
  const { currentUser, loading, logout } = useAuth();
  const isAuthenticated = !!currentUser; // Determine auth status from currentUser

  // Show loading state from context
  if (loading) {
    return <div>Loading authentication status...</div>; // Or a proper spinner component
  }

  return (
    <div className="app">
      <Header isAuthenticated={isAuthenticated} user={currentUser} onLogout={logout} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<div>Map View (Coming Soon)</div>} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/admin/items" /> : <Login />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App; 