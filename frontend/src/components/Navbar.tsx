import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clearAuthSession, getLibrarianProfile, isAuthenticated } from '../api/api';

/**
 * Top Navigation Bar
 *
 * Provides links to:
 * - Books (/books)
 * - Issue Book (/issue)
 * - Member History (/members/:id/history with default member selection)
 * - Logout button that clears JWT and redirects to /login
 */
export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();
  const librarian = getLibrarianProfile();

  const handleLogout = () => {
    clearAuthSession();
    navigate('/login');
  };

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        <div className="navbar-brand">
          <span className="brand-logo">📚</span>
          <span className="brand-name">ShelfLife</span>
          <span className="brand-badge">Campus Library</span>
        </div>

        {authenticated && (
          <nav className="navbar-links">
            <NavLink
              to="/books"
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            >
              Catalog (Books)
            </NavLink>
            <NavLink
              to="/issue"
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            >
              Issue Book
            </NavLink>
            <NavLink
              to="/members/670119e83df4c1d763a8d102/history"
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            >
              Member History
            </NavLink>
          </nav>
        )}

        <div className="navbar-actions">
          {authenticated ? (
            <div className="user-profile-section">
              <span className="librarian-tag">
                👤 {librarian?.username || 'Librarian'}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-outline-danger btn-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <NavLink to="/login" className="btn btn-primary btn-sm">
              Librarian Login
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
};
