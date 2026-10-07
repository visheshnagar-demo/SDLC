import React, { createContext, useContext, useState, useEffect } from "react";
import { login as apiLogin, register as apiRegister } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(
    () => localStorage.getItem("token") || null,
  );
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const loginUser = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiLogin({ email, password });
      const authToken = data.access_token || data.token || "mock-jwt-token";
      const authUser = data.user || {
        id: "user-1",
        email,
        full_name: email.split("@")[0],
        role:
          email.includes("admin") || email.includes("manager")
            ? "farm_manager"
            : "farm_worker",
      };
      setToken(authToken);
      setUser(authUser);
      return { success: true, user: authUser };
    } catch (err) {
      const message =
        err.response?.data?.detail || err.message || "Login failed";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRegister(userData);
      return { success: true, data };
    } catch (err) {
      const message =
        err.response?.data?.detail || err.message || "Registration failed";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // Helper to quick switch roles in UI for demo / test inspection if needed
  const switchRole = (newRole) => {
    if (user) {
      setUser({ ...user, role: newRole });
    }
  };

  const value = {
    token,
    user,
    loading,
    error,
    loginUser,
    registerUser,
    logout,
    switchRole,
    isAuthenticated: Boolean(token),
    isManager: user?.role === "farm_manager",
    isWorker: user?.role === "farm_worker",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
