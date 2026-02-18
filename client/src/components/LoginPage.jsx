import React, { useState } from "react";
import { Box, Button, Container, Paper, Stack, TextField, Typography, Alert } from "@mui/material";
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
          Access is restricted to predefined Admin and Normal User accounts.
        </Typography>
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={2}>
            <TextField label="Username" value={username} onChange={(event) => setUsername(event.target.value)} required />
            <TextField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;
