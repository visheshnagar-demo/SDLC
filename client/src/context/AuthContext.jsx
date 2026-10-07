import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authApi } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("hms_user");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return null;
      }
    }
    // Default mock user for testing/QA instant access
    return {
      id: "usr-patient-001",
      email: "test@example.com",
      full_name: "John Doe",
      role: "PATIENT",
      is_active: true,
    };
  });

  const [token, setToken] = useState(
    () => localStorage.getItem("token") || "mock-jwt-token-hms",
  );
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const fetchCurrentUser = useCallback(async () => {
    if (!localStorage.getItem("token")) return;
    try {
      setLoading(true);
      const data = await authApi.getCurrentUser();
      setUser(data);
      localStorage.setItem("hms_user", JSON.stringify(data));
      setAuthError(null);
    } catch (err) {
      // If endpoint fails or offline, keep current user
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      fetchCurrentUser();
    }
  }, [fetchCurrentUser]);

  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const data = await authApi.login({ email, password });
      const authToken = data.access_token || data.token || "jwt-token";
      const authUser = data.user || {
        email,
        role: "PATIENT",
        full_name: email.split("@")[0],
      };
      setToken(authToken);
      setUser(authUser);
      localStorage.setItem("token", authToken);
      localStorage.setItem("hms_user", JSON.stringify(authUser));
      return { success: true, user: authUser };
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail || err.message || "Login failed";
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setAuthError(null);
    try {
      const data = await authApi.register(userData);
      const authToken = data.access_token || data.token || "jwt-token";
      const authUser = data.user || {
        email: userData.email,
        role: userData.role || "PATIENT",
        full_name: userData.full_name,
      };
      setToken(authToken);
      setUser(authUser);
      localStorage.setItem("token", authToken);
      localStorage.setItem("hms_user", JSON.stringify(authUser));
      return { success: true, user: authUser };
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail || err.message || "Registration failed";
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("hms_user");
  };

  const switchRole = (newRole) => {
    const updatedUser = {
      ...(user || {}),
      id: user?.id || `usr-${newRole.toLowerCase()}-001`,
      email: `${newRole.toLowerCase()}@example.com`,
      full_name:
        newRole === "DOCTOR"
          ? "Dr. Sarah Smith, MD"
          : newRole === "ADMIN"
            ? "Hospital Administrator"
            : newRole === "NURSE"
              ? "Nurse Jackie, RN"
              : "John Doe",
      role: newRole,
      is_active: true,
    };
    setUser(updatedUser);
    localStorage.setItem("hms_user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        authError,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
