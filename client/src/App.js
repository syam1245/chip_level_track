import React, { Suspense, lazy, useState, useMemo, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

// Lazy load components for better performance
const Input = lazy(() => import("./components/input.js"));
const ItemsList = lazy(() => import("./components/ItemsList.js"));

// Loading Component
const LoadingFallback = () => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: "background.default" // Use theme background
    }}
  >
    <CircularProgress size={60} thickness={4} color="primary" />
    <Typography variant="h6" sx={{ mt: 2, color: "text.secondary" }}>Loading Application...</Typography>
  </Box>
);

function App() {
  /* import Tooltip */

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState(prefersDarkMode ? "dark" : "light");

  // Automatically adapt to system theme changes
  useEffect(() => {
    setMode(prefersDarkMode ? "dark" : "light");
  }, [prefersDarkMode]);

  // Apply theme class to body for CSS variables
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

  const theme = useMemo(
    () => (mode === "dark" ? darkTheme : lightTheme),
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        {/* Theme Toggle Button - Fixed Position */}
        <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 9999 }}>
          <Tooltip title={`Switch to ${mode === 'dark' ? 'Light' : 'Dark'} Mode`}>
            <IconButton
              onClick={colorMode.toggleColorMode}
              color="inherit"
              sx={{
                bgcolor: 'background.paper',
                boxShadow: 3,
                transition: 'transform 0.2s',
                '&:hover': { bgcolor: 'action.hover', transform: 'rotate(180deg)' }
              }}
            >
              {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>
        </Box>

        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Input />} />
            <Route path="/items" element={<ItemsList />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
