import React, { createContext, useContext, useState, useEffect } from "react";
import { loginUser, registerUser, getCurrentUser } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("garba_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("garba_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("garba_token");
      if (storedToken) {
        try {
          const profile = await getCurrentUser();
          setUser(profile);
          localStorage.setItem("garba_user", JSON.stringify(profile));
        } catch {
          // Token invalid or expired
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (credentials) => {
    const data = await loginUser(credentials);
    const jwtToken = data.access_token;
    const userData = data.user;
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem("garba_token", jwtToken);
    localStorage.setItem("garba_user", JSON.stringify(userData));
    return userData;
  };

  const register = async (userData) => {
    const data = await registerUser(userData);
    const jwtToken = data.access_token;
    const userProfile = data.user;
    setToken(jwtToken);
    setUser(userProfile);
    localStorage.setItem("garba_token", jwtToken);
    localStorage.setItem("garba_user", JSON.stringify(userProfile));
    return userProfile;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("garba_token");
    localStorage.removeItem("garba_user");
  };

  const isAuthenticated = !!token;
  const isAdmin = user?.role === "ADMIN" || user?.role === "ORGANIZER";
  const isSecurity =
    user?.role === "SECURITY" || user?.role === "STAFF" || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        isAdmin,
        isSecurity,
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
