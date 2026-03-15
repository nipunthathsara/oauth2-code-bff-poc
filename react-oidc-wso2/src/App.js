import React, { useEffect } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { useAuthContext } from "@asgardeo/auth-react";
import LandingPage from "./components/LandingPage";
import HomePage from "./components/HomePage";
import LoadingSpinner from "./components/LoadingSpinner";

// Handles the /callback route — the SDK processes the OIDC code here
function CallbackHandler() {
  const { handleSignIn, state } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    handleSignIn().then(() => {
      navigate("/home", { replace: true });
    }).catch((err) => {
      console.error("Sign-in error:", err);
      navigate("/", { replace: true });
    });
  }, []); // eslint-disable-line

  return <LoadingSpinner message="Completing login..." />;
}

// Protects routes that require authentication
function PrivateRoute({ children }) {
  const { state } = useAuthContext();

  if (state.isLoading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }
  if (!state.isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  const { state } = useAuthContext();

  // If the user is already authenticated and lands on "/", send them to /home
  if (state.isAuthenticated && window.location.pathname === "/") {
    return <Navigate to="/home" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/callback" element={<CallbackHandler />} />
      <Route
        path="/home"
        element={
          <PrivateRoute>
            <HomePage />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
