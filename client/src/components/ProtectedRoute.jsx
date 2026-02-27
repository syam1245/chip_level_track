import React from "react";
import { Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../auth/AuthContext";

/**
 * Wraps routes that require authentication.
 * - adminOnly: also requires user.role === "admin"; redirects to /items otherwise.
 */
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loadingSession } = useAuth();

  if (loadingSession) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Non-admin trying to reach an admin-only route → send to the job list
  if (adminOnly && user.role !== "admin") return <Navigate to="/items" replace />;

  return children;
};

export default ProtectedRoute;
