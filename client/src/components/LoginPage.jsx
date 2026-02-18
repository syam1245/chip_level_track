import { Box, Button, Container, Paper, Stack, TextField, Typography, Alert, MenuItem, Select, FormControl, InputLabel, CircularProgress } from "@mui/material";
import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [loadingTechs, setLoadingTechs] = useState(true);
  const navigate = useNavigate();
  const { user, login, fetchTechnicians } = useAuth();

  useEffect(() => {
    fetchTechnicians()
      .then(setTechnicians)
      .catch((err) => setError("Failed to load technicians list"))
      .finally(() => setLoadingTechs(false));
  }, [fetchTechnicians]);

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
          <Stack spacing={3}>
            <FormControl fullWidth required>
              <InputLabel id="tech-select-label">Select Technician</InputLabel>
              <Select
                labelId="tech-select-label"
                value={username}
                label="Select Technician"
                onChange={(e) => setUsername(e.target.value)}
                disabled={loadingTechs}
              >
                {technicians.map((tech) => (
                  <MenuItem key={tech.username} value={tech.username}>
                    {tech.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              fullWidth
            />
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
