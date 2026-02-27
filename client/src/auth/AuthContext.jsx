import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authFetch } from "../api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

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

  // useCallback gives each function a stable identity across renders.
  // Without this, the functions would be recreated on every render and
  // the useMemo context value would change needlessly, triggering
  // re-renders in every consumer of useAuth().
  const login = useCallback(async (username, password) => {
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
  }, []);

  const logout = useCallback(async () => {
    await authFetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const fetchTechnicians = useCallback(async () => {
    const res = await authFetch("/api/auth/users");
    if (!res.ok) throw new Error("Failed to load technicians");
    return res.json();
  }, []);

  // Now all deps are truly stable — context object only changes when
  // user or loadingSession changes, not on every render.
  const value = useMemo(
    () => ({ user, login, logout, loadingSession, fetchTechnicians }),
    [user, loadingSession, login, logout, fetchTechnicians]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
