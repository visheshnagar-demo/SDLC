import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          const profile = await authApi.getMe();
          setUser(profile);
        } catch {
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    fetchCurrentUser();
  }, [token]);

  const login = async (email, password) => {
    const data = await authApi.login({ email, password });
    const receivedToken = data.access_token || data.token;
    if (receivedToken) {
      localStorage.setItem("token", receivedToken);
      setToken(receivedToken);
      if (data.user) {
        setUser(data.user);
      } else {
        const profile = await authApi.getMe().catch(() => null);
        if (profile) setUser(profile);
      }
    }
    return data;
  };

  const register = async (userData) => {
    const data = await authApi.register(userData);
    const receivedToken = data.access_token || data.token;
    if (receivedToken) {
      localStorage.setItem("token", receivedToken);
      setToken(receivedToken);
      if (data.user) {
        setUser(data.user);
      }
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: Boolean(token),
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
