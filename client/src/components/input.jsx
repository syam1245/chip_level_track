import React, { useState } from "react";
import {
  TextField,
  Autocomplete,
  Button,
  Typography,
  Paper,
  Snackbar,
  Alert,
  Stack,
  Container,
  Box,
  InputAdornment,
} from "@mui/material";
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  Devices as DeviceIcon,
  ConfirmationNumber as JobIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { authFetch } from "../api";
import { useAuth } from "../auth/AuthContext";

const BRAND_OPTIONS = [
  "HP", "Lenovo", "Dell", "Apple", "Samsung", "Acer", "Asus", "Toshiba", "Sony", "MSI", "Infinix", "Life",
];

const Input = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [form, setForm] = useState({
    jobNumber: "",
    customerName: "",
    brand: "",
    phoneNumber: "",
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phoneNumber" && !/^\d*$/.test(value)) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBrandChange = (_event, newValue) => {
    setForm((prev) => ({ ...prev, brand: newValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.jobNumber || !form.customerName || !form.brand || !form.phoneNumber) {
      setSnackbar({ open: true, message: "All fields are required.", severity: "error" });
      return;
    }

    if (form.phoneNumber.length !== 10) {
      setSnackbar({ open: true, message: "Phone number must be exactly 10 digits.", severity: "error" });
      return;
    }

    setLoading(true);

    try {
      const res = await authFetch("/api/items", {
        method: "POST",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setSnackbar({ open: true, message: "✅ Job created successfully!", severity: "success" });
        setForm({ jobNumber: "", customerName: "", brand: "", phoneNumber: "" });
      } else {
        setSnackbar({ open: true, message: data.error || "Failed to save data.", severity: "error" });
      }
    } catch (_err) {
      setSnackbar({ open: true, message: "Error connecting to server.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  return (
    <Container maxWidth="sm" sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", py: 4 }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}>
        <Paper
          elevation={0}
          className="glass-panel"
          sx={{ p: 5, borderRadius: "var(--radius)", position: "relative", overflow: "hidden" }}
        >
          <Box
            sx={{
              position: "absolute",
              top: -50,
              right: -50,
              width: 150,
              height: 150,
              backgroundImage: "linear-gradient(135deg, var(--color-primary), #4f46e5)",
              filter: "blur(60px)",
              opacity: 0.2,
              zIndex: 0,
              borderRadius: "50%",
            }}
          />

          <Typography variant="h4" align="center" fontWeight="900" gutterBottom className="text-gradient" sx={{ position: "relative" }}>
            New Repair Job
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" mb={1.5} sx={{ position: "relative" }}>
            Enter device and customer details to generate a job sheet.
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" mb={4} sx={{ position: "relative" }}>
            Signed in as <strong>{user?.displayName}</strong> ({user?.role})
          </Typography>

          <form onSubmit={handleSubmit} style={{ position: "relative", zIndex: 1 }}>
            <Stack spacing={3}>
              <TextField
                name="jobNumber"
                label="Job Number"
                value={form.jobNumber}
                onChange={handleChange}
                required
                fullWidth
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <JobIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                name="customerName"
                label="Customer Name"
                value={form.customerName}
                onChange={handleChange}
                required
                fullWidth
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <Autocomplete
                freeSolo
                options={BRAND_OPTIONS}
                value={form.brand}
                onChange={handleBrandChange}
                onInputChange={(_event, newInputValue) => {
                  setForm((prev) => ({ ...prev, brand: newInputValue }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Device Brand / Model"
                    name="brand"
                    required
                    onChange={handleChange}
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <DeviceIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />

              <TextField
                name="phoneNumber"
                label="Phone Number"
                value={form.phoneNumber}
                onChange={handleChange}
                required
                fullWidth
                inputProps={{ maxLength: 10 }}
                helperText={form.phoneNumber.length > 0 && form.phoneNumber.length < 10 ? "Must be 10 digits" : ""}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <Stack direction="row" spacing={2} pt={2}>
                <Button
                  variant="text"
                  fullWidth
                  onClick={() => navigate("/items")}
                  size="large"
                  startIcon={<ArrowBackIcon />}
                  sx={{ color: "text.secondary", fontWeight: 600 }}
                >
                  Cancel / View All
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading}
                  startIcon={!loading && <SaveIcon />}
                  sx={{
                    borderRadius: "8px",
                    boxShadow: "var(--shadow-md)",
                    background: "var(--color-primary)",
                    fontWeight: 700,
                    textTransform: "none",
                    py: 1.2,
                  }}
                >
                  {loading ? "Saving..." : "Create Job"}
                </Button>
              </Stack>
            </Stack>
          </form>
        </Paper>
      </motion.div>

      <Box sx={{ mt: 2, textAlign: "center" }}>
        <Button
          variant="text"
          onClick={async () => {
            await logout();
            navigate("/login", { replace: true });
          }}
        >
          Logout
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%", borderRadius: "8px" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Input;
