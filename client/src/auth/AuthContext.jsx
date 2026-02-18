import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authFetch } from "../api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdminView, setIsAdminView] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Initialize view mode based on role
  useEffect(() => {
    if (user) {
      if (user.role !== "admin") {
        setIsAdminView(false);
      } else {
        const saved = localStorage.getItem("preferred_view");
        if (saved !== null) {
          setIsAdminView(saved === "admin");
        } else {
          setIsAdminView(null);
        }
      }
    } else {
      setIsAdminView(null);
    }
  }, [user]);

  const selectView = (isAdmin) => {
    setIsAdminView(isAdmin);
    localStorage.setItem("preferred_view", isAdmin ? "admin" : "tech");
  };

  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await authFetch("/api/auth/session", { method: "GET" });
        if (!res.ok) {
          setUser(null);
          return;
        }

        const session = await res.json();
        setUser(session);
      } catch (_err) {
        setUser(null);
      } finally {
        setLoadingSession(false);
      }
    };

    loadSession();
  }, []);

  const login = async (username, password) => {
    const res = await authFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Login failed");
    }

    setUser(data);
    return data;
  };

  const logout = async () => {
    await authFetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setIsAdminView(null);
    localStorage.removeItem("preferred_view");
  };

  const toggleAdminView = () => {
    if (user?.role === "admin") {
      const newVal = !isAdminView;
      setIsAdminView(newVal);
      localStorage.setItem("preferred_view", newVal ? "admin" : "tech");
    }
  };

  const fetchTechnicians = async () => {
    const res = await authFetch("/api/auth/users");
    if (!res.ok) throw new Error("Failed to load technicians");
    return res.json();
  };

  const value = useMemo(
    () => ({ user, login, logout, loadingSession, isAdminView, toggleAdminView, selectView, fetchTechnicians }),
    [user, loadingSession, isAdminView]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
