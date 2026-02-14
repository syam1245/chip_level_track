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
  Container
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";

const BRAND_OPTIONS = [
  "HP", "Lenovo", "Dell", "Apple", "Samsung", "Acer", "Asus", "Toshiba", "Sony", "MSI", "Infinix", "Life"
];

const Input = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    jobNumber: "",
    customerName: "",
    brand: "",
    phoneNumber: "",
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phoneNumber" && !/^\d*$/.test(value)) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBrandChange = (event, newValue) => {
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

    try {
      const res = await fetch(`${API_BASE_URL}/api/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setSnackbar({ open: true, message: "✅ Job created successfully!", severity: "success" });
        setForm({ jobNumber: "", customerName: "", brand: "", phoneNumber: "" });
      } else {
        setSnackbar({ open: true, message: data.error || "Failed to save data.", severity: "error" });
      }
    } catch (err) {
      setSnackbar({ open: true, message: "Error connecting to server.", severity: "error" });
    }
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={0} sx={{ p: 4, border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
        <Typography variant="h5" align="center" gutterBottom fontWeight="bold">
          New Repair Entry
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" mb={4}>
          Enter the device details below.
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              name="jobNumber"
              label="Job Number"
              value={form.jobNumber}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              name="customerName"
              label="Customer Name"
              value={form.customerName}
              onChange={handleChange}
              required
              fullWidth
            />
            <Autocomplete
              freeSolo
              options={BRAND_OPTIONS}
              value={form.brand}
              onChange={handleBrandChange}
              onInputChange={(event, newInputValue) => {
                setForm((prev) => ({ ...prev, brand: newInputValue }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Brand"
                  name="brand"
                  required
                  onChange={handleChange}
                  fullWidth
                />
              )}
            />
            <TextField
              name="phoneNumber"
              label="Phone Number"
              value={form.phoneNumber}
              onChange={handleChange}
              required
              inputProps={{ maxLength: 10 }}
              helperText={form.phoneNumber.length > 0 && form.phoneNumber.length < 10 ? "Must be 10 digits" : ""}
              fullWidth
            />

            <Stack direction="row" spacing={2} pt={2}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate("/items")}
                size="large"
              >
                View All
              </Button>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                sx={{ boxShadow: "var(--shadow-md)" }}
              >
                Save Entry
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Input;
