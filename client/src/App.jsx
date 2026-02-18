import React, { Suspense, lazy, useState, useMemo, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  CircularProgress,
  Box,
  Typography,
  ThemeProvider,
  CssBaseline,
  IconButton,
  useMediaQuery,
  Tooltip,
} from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { lightTheme, darkTheme } from "./theme";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const Input = lazy(() => import("./components/input.jsx"));
const ItemsList = lazy(() => import("./components/ItemsList.jsx"));
const LoginPage = lazy(() => import("./components/LoginPage.jsx"));

const LoadingFallback = () => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: "background.default",
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
          <Box sx={{ position: "fixed", top: 16, right: 16, zIndex: 9999 }}>
            <Tooltip title={`Switch to ${mode === "dark" ? "Light" : "Dark"} Mode`}>
              <IconButton
                onClick={colorMode.toggleColorMode}
                color="inherit"
                sx={{
                  bgcolor: "background.paper",
                  boxShadow: 3,
                  transition: "transform 0.2s",
                  "&:hover": { bgcolor: "action.hover", transform: "rotate(180deg)" },
                }}
              >
                {theme.palette.mode === "dark" ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Tooltip>
          </Box>

          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={(
                  <ProtectedRoute>
                    <Input />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/items"
                element={(
                  <ProtectedRoute>
                    <ItemsList />
                  </ProtectedRoute>
                )}
              />
              <Route path="*" element={<Navigate to="/items" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
