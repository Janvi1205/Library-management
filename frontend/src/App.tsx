import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Books } from './pages/Books';
import { IssueBook } from './pages/IssueBook';
import { MemberHistory } from './pages/MemberHistory';
import { isAuthenticated } from './api/api';

/**
 * Main Application Component
 *
 * Configures React Router routing and client-side route protection:
 * - Public Route: /login
 * - Protected Routes: /books, /issue, /members/:id/history
 * - Root Route (/): Redirects to /books if authenticated, else /login
 */
export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Navbar />

        <main className="main-content">
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes requiring Librarian JWT */}
            <Route
              path="/books"
              element={
                <ProtectedRoute>
                  <Books />
                </ProtectedRoute>
              }
            />

            <Route
              path="/issue"
              element={
                <ProtectedRoute>
                  <IssueBook />
                </ProtectedRoute>
              }
            />

            <Route
              path="/members/:id/history"
              element={
                <ProtectedRoute>
                  <MemberHistory />
                </ProtectedRoute>
              }
            />

            {/* Root Route Navigation Guard */}
            <Route
              path="/"
              element={
                <Navigate to={isAuthenticated() ? '/books' : '/login'} replace />
              }
            />

            {/* Catch-all Wildcard Route */}
            <Route
              path="*"
              element={
                <Navigate to={isAuthenticated() ? '/books' : '/login'} replace />
              }
            />
          </Routes>
        </main>

        <footer className="footer-bar">
          <p>
            ShelfLife — Campus Library Management System | Built with React, TypeScript & Express
          </p>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
