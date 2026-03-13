import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../services/auth.api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const { ok, user: response } = await authApi.getSession();
        if (!ok || !response?.user) {
          setUser(null);
          return;
        }
        setUser(response.user);
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
  // Without this, the functions would be recreated on every render and
  // the useMemo context value would change needlessly, triggering
  // re-renders in every consumer of useAuth().
  const login = useCallback(async (username, password) => {
    const data = await authApi.login(username, password);
    setUser(data.user);
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
