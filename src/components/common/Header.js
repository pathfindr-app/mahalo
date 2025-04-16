import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

// Accept props for auth state and logout function
function Header({ isAuthenticated, user, onLogout }) {
  return (
    <header className="app-header">
      <nav className="nav-container">
        <Link to="/" className="nav-logo">
          MAHALO
        </Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">Map</Link>
          {/* Only show Manage Items link if authenticated */}
          {isAuthenticated && (
            <Link to="/admin/items" className="nav-link">Manage Items</Link>
          )}
        </div>
        <div className="auth-section">
          {isAuthenticated ? (
            <>
              <span className="user-email">{user?.email}</span>
              <button onClick={onLogout} className="logout-button">Logout</button>
            </>
          ) : (
            // Optionally add a Login link if needed, or leave empty
            <Link to="/login" className="nav-link login-link">Login</Link>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Header; 