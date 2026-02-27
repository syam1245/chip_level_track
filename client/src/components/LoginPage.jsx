import {
  Box, Button, Container, Paper, Stack,
  TextField, Typography, Alert, CircularProgress
} from "@mui/material";
import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, login } = useAuth();

  if (user) return <Navigate to="/items" replace />;

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError("Username and password are required.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      await login(username.trim(), password);
      navigate("/items", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <Paper className="glass-panel" sx={{ p: 4, width: "100%" }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Sign In
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Access is restricted to authorised technician accounts.
        </Typography>
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              fullWidth
              autoComplete="username"
              autoFocus
              placeholder="e.g. Shyam"
              helperText="Your technician name (any capitalisation works)"
              inputProps={{ spellCheck: false }}
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              fullWidth
              autoComplete="current-password"
            />
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              size="large"
              sx={{ borderRadius: "8px", fontWeight: 700, textTransform: "none", py: 1.5 }}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;
