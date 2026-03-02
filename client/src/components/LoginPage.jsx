import {
  Box, Button, Container, Paper, Stack,
  TextField, Typography, Alert, CircularProgress,
  MenuItem, Avatar
} from "@mui/material";
import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import API_BASE_URL from "../api";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [loadingTechs, setLoadingTechs] = useState(true);
  const navigate = useNavigate();
  const { user, login } = useAuth();

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/auth/technicians`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTechnicians(data);
        }
      })
      .catch(() => { /* silently fail, user can still type */ })
      .finally(() => setLoadingTechs(false));
  }, []);

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
          Select your account and enter your password to continue.
        </Typography>
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={3}>
            <TextField
              select
              label="Technician"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              fullWidth
              autoFocus
              helperText="Select your technician account"
              disabled={loadingTechs}
              InputProps={{
                startAdornment: loadingTechs ? (
                  <CircularProgress size={18} sx={{ mr: 1 }} />
                ) : null,
              }}
            >
              {technicians.map((tech) => (
                <MenuItem key={tech.username} value={tech.username}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        bgcolor: 'var(--color-primary)',
                      }}
                    >
                      {tech.displayName?.[0] || tech.username[0]}
                    </Avatar>
                    <Typography fontWeight={600}>{tech.displayName}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </TextField>

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
