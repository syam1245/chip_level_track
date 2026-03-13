import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../services/auth.api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const { ok, data } = await authApi.getSession();
        if (!ok || !data) {
          setUser(null);
          return;
        }

        // Robust extraction: handle { user: { ... } } or { ... }
        const profile = data.user || (data.username ? data : null);
        setUser(profile);
      } catch (_err) {
        setUser(null);
      } finally {
        setLoadingSession(false);
      }
    };

    loadSession();
  }, []);

  // Global session expiration handler (triggered by api.js on 401 responses)
  useEffect(() => {
    const handleSessionExpired = () => setUser(null);
    window.addEventListener("session:expired", handleSessionExpired);
    return () => window.removeEventListener("session:expired", handleSessionExpired);
  }, []);

  // useCallback gives each function a stable identity across renders.
  const login = useCallback(async (username, password) => {
    const data = await authApi.login(username, password);
    // Robust extraction for login too
    const profile = data.user || (data.username ? data : null);
    setUser(profile);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const fetchTechnicians = useCallback(async () => {
    return authApi.fetchUsers();
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
