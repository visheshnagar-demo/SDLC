import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    try {
      return typeof window !== "undefined" && window.localStorage
        ? window.localStorage.getItem("token")
        : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const profile = await authApi.getProfile();
        setUser(profile);
      } catch (err) {
        console.error("Failed to restore session", err);
        if (err.response?.status === 401) {
          logout();
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = async (credentials) => {
    setError(null);
    try {
      const response = await authApi.login(credentials);
      const authToken = response.access_token || response.token;
      if (authToken) {
        try {
          if (typeof window !== "undefined" && window.localStorage) {
            window.localStorage.setItem("token", authToken);
          }
        } catch (storageErr) {
          console.warn("Storage write failed", storageErr);
        }
        setToken(authToken);
      }
      if (response.user) {
        setUser(response.user);
      } else {
        try {
          const profile = await authApi.getProfile();
          setUser(profile);
        } catch {
          setUser({
            email: credentials.email || credentials.username,
            full_name: "Customer",
          });
        }
      }
      return response;
    } catch (err) {
      const msg = err.response?.data?.detail || "Invalid email or password.";
      setError(msg);
      throw err;
    }
  };

  const register = async (data) => {
    setError(null);
    try {
      const res = await authApi.register(data);
      if (res.access_token || res.token) {
        const authToken = res.access_token || res.token;
        try {
          if (typeof window !== "undefined" && window.localStorage) {
            window.localStorage.setItem("token", authToken);
          }
        } catch (storageErr) {
          console.warn("Storage write failed", storageErr);
        }
        setToken(authToken);
        if (res.user) setUser(res.user);
      } else {
        await login({ email: data.email, password: data.password });
      }
      return res;
    } catch (err) {
      const msg =
        err.response?.data?.detail || "Registration failed. Please try again.";
      setError(msg);
      throw err;
    }
  };

  const logout = () => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem("token");
      }
    } catch (storageErr) {
      console.warn("Storage clear failed", storageErr);
    }
    setToken(null);
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        error,
        login,
        register,
        logout,
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

export default AuthContext;
