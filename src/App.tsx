import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import SignIn from './components/auth/SignIn';
import SignUp from './components/auth/SignUp';
import ChatWindow from './components/ChatWindow';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatWindow />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/chat" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;