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
  Skeleton,
} from "@mui/material";
import { lightTheme, darkTheme } from "./theme";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

const Input = lazy(() => import("./components/InputForm"));
const ItemsList = lazy(() => import("./components/items-list"));
const LoginPage = lazy(() => import("./components/LoginPage.jsx"));
const Navbar = lazy(() => import("./components/Navbar.jsx"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard.jsx"));
const TrackJob = lazy(() => import("./components/TrackJob.jsx"));
import CommandPalette from "./components/CommandPalette";

const LoadingFallback = () => (
  <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
    {/* Skeleton Navbar */}
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 3,
        py: 1.5,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box display="flex" alignItems="center" gap={1.5}>
        <Skeleton variant="circular" width={32} height={32} animation="wave" />
        <Skeleton variant="text" width={150} height={28} animation="wave" sx={{ borderRadius: 1 }} />
      </Box>
      <Box display="flex" gap={2}>
        <Skeleton variant="rounded" width={70} height={28} animation="wave" sx={{ borderRadius: "8px" }} />
        <Skeleton variant="rounded" width={70} height={28} animation="wave" sx={{ borderRadius: "8px" }} />
        <Skeleton variant="rounded" width={70} height={28} animation="wave" sx={{ borderRadius: "8px" }} />
      </Box>
      <Box display="flex" alignItems="center" gap={1}>
        <Skeleton variant="text" width={80} height={20} animation="wave" sx={{ borderRadius: 1 }} />
        <Skeleton variant="circular" width={36} height={36} animation="wave" />
      </Box>
    </Box>

    {/* Skeleton Content area */}
    <Box sx={{ maxWidth: 1400, mx: "auto", px: { xs: 2, md: 4 }, pt: 4 }}>
      {/* Title */}
      <Skeleton variant="text" width={280} height={48} animation="wave" sx={{ borderRadius: 1, mb: 1 }} />
      <Skeleton variant="text" width={220} height={18} animation="wave" sx={{ borderRadius: 1, mb: 4 }} />

      {/* Stat cards grid */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,1fr)", md: "repeat(5,1fr)" }, gap: 2, mb: 4 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={80} animation="wave" sx={{ borderRadius: "var(--radius, 16px)" }} />
        ))}
      </Box>

      {/* Search bar */}
      <Skeleton variant="rounded" height={52} animation="wave" sx={{ borderRadius: "var(--radius, 16px)", mb: 4 }} />

      {/* Table rows */}
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rounded"
          height={52}
          animation="wave"
          sx={{ borderRadius: 1, mb: 1, opacity: 1 - i * 0.12 }}
        />
      ))}
    </Box>
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
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Global Ctrl+K / Cmd+K handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (user) setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [user]);

  if (loadingSession) return <LoadingFallback />;

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Navbar mode={mode} toggleTheme={toggleTheme} onOpenPalette={() => setPaletteOpen(true)} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/track" element={<TrackJob />} />

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

        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          toggleTheme={toggleTheme}
          mode={mode}
        />
      </Suspense>
    </ErrorBoundary>
  );
};

export default App;
