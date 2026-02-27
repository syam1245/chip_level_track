import React, { Suspense, lazy, useState, useMemo, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  CircularProgress,
  Box,
  Typography,
  ThemeProvider,
  CssBaseline,
  useMediaQuery,
} from "@mui/material";
import { lightTheme, darkTheme } from "./theme";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const Input = lazy(() => import("./components/InputForm"));
const ItemsList = lazy(() => import("./components/items-list"));
const LoginPage = lazy(() => import("./components/LoginPage.jsx"));
const Navbar = lazy(() => import("./components/Navbar.jsx"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard.jsx"));

const LoadingFallback = () => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      bgcolor: "background.default",
    }}
  >
    <CircularProgress size={60} thickness={4} color="primary" />
    <Typography variant="h6" sx={{ mt: 2, color: "text.secondary" }}>
      Loading Application...
    </Typography>
  </Box>
);

const THEME_KEY = "chip_theme_mode";

function getInitialMode(prefersDark) {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch (_) { /* localStorage unavailable (e.g. private browsing) */ }
  return prefersDark ? "dark" : "light";
}

function App() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const [mode, setMode] = useState(() => getInitialMode(prefersDarkMode));

  // If no saved preference exists, follow the OS setting
  useEffect(() => {
    try {
      if (!localStorage.getItem(THEME_KEY)) {
        setMode(prefersDarkMode ? "dark" : "light");
      }
    } catch (_) { }
  }, [prefersDarkMode]);

  // Keep body data-theme attribute in sync (used by CSS custom properties)
  useEffect(() => {
    document.body.dataset.theme = mode;
  }, [mode]);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prev) => {
          const next = prev === "light" ? "dark" : "light";
          try { localStorage.setItem(THEME_KEY, next); } catch (_) { }
          return next;
        });
      },
    }),
    [],
  );

  const theme = useMemo(() => (mode === "dark" ? darkTheme : lightTheme), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <AuthAppContent mode={mode} toggleTheme={colorMode.toggleColorMode} />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

const AuthAppContent = ({ mode, toggleTheme }) => {
  const { user, loadingSession } = useAuth();

  if (loadingSession) return <LoadingFallback />;

  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
        <Navbar mode={mode} toggleTheme={toggleTheme} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* "/" = New Job form */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Input />
              </ProtectedRoute>
            }
          />

          {/* Dedicated route for job list (tech view) */}
          <Route
            path="/items"
            element={
              <ProtectedRoute>
                <ItemsList />
              </ProtectedRoute>
            }
          />

          {/* Dedicated route for admin dashboard — admin role required */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;
