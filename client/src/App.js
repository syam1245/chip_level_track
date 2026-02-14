import React, { Suspense, lazy } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CircularProgress, Box, Typography } from "@mui/material";

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
      background: "var(--bg-gradient)"
    }}
  >
    <CircularProgress size={60} thickness={4} sx={{ color: "var(--color-primary)" }} />
    <Typography variant="h6" sx={{ mt: 2, color: "text.secondary" }}>Loading Application...</Typography>
  </Box>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Input />} />
          <Route path="/items" element={<ItemsList />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
