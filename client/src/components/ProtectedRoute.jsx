import React from "react";
import { Navigate } from "react-router-dom";
import { authService } from "../services/api";

export default function ProtectedRoute({ children, roleRequired }) {
  const token = authService.getStoredToken();
  const user = authService.getStoredUser();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (roleRequired && user?.role !== roleRequired && user?.role !== "parent") {
    return <Navigate to="/child-dashboard" replace />;
  }

  return children;
}
