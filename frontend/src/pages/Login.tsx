import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient, ShelfLifeApiError } from '../api/api';

/**
 * Librarian Login Page
 *
 * Implements Question Q2 Authentication requirement:
 * - Submits { username, password } to POST /api/auth/login
 * - Receives signed JWT token
 * - Stores JWT in localStorage via apiClient.login()
 * - Redirects authenticated librarian to the requested page or /books
 */
export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // State management using standard React useState
  const [username, setUsername] = useState('librarian');
  const [password, setPassword] = useState('librarian123');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Retrieve destination path if redirected by ProtectedRoute
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/books';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side input validation
    if (!username.trim() || !password) {
      setErrorMessage('Please provide both username and password.');
      return;
    }

    try {
      setLoading(true);
      await apiClient.login({ username: username.trim(), password });
      // Redirect on successful authentication
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (err instanceof ShelfLifeApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to connect to the library authentication server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">📚</div>
          <h2>ShelfLife Library Portal</h2>
          <p className="login-subtitle">Librarian Access & Administration</p>
        </div>

        {errorMessage && (
          <div className="alert alert-danger" role="alert">
            <span>⚠️ {errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Librarian Username</label>
            <input
              id="username"
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. librarian"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              disabled={loading}
            />
          </div>

          <div className="demo-credentials-note">
            <small>
              ℹ️ <strong>Demo Credentials:</strong> Username: <code>librarian</code> | Password: <code>librarian123</code>
            </small>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In as Librarian'}
          </button>
        </form>
      </div>
    </div>
  );
};
