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

const Input = lazy(() => import("./components/input.jsx"));
const ItemsList = lazy(() => import("./components/ItemsList.jsx"));
const LoginPage = lazy(() => import("./components/LoginPage.jsx"));
const Navbar = lazy(() => import("./components/Navbar.jsx"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard.jsx"));
const RoleSelection = lazy(() => import("./components/RoleSelection.jsx"));

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

function App() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const [mode, setMode] = useState(prefersDarkMode ? "dark" : "light");

  useEffect(() => {
    setMode(prefersDarkMode ? "dark" : "light");
  }, [prefersDarkMode]);

  useEffect(() => {
    document.body.dataset.theme = mode;
  }, [mode]);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
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
  const { user, isAdminView, loadingSession } = useAuth();

  if (loadingSession) return <LoadingFallback />;

  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
        <Navbar mode={mode} toggleTheme={toggleTheme} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* "/" = New Job form — always, regardless of admin mode */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                {user?.role === "admin" && isAdminView === null
                  ? <RoleSelection />
                  : <Input />
                }
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

          {/* Dedicated route for admin dashboard */}
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
