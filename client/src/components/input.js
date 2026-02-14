// client/src/components/Input.js
import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";

const BRAND_OPTIONS = [
  "HP",
  "Lenovo",
  "Dell",
  "Apple",
  "Samsung",
  "Acer",
  "Asus",
  "Toshiba",
  "Sony",
  "MSI",
  "Infinix",
  "Life",
];

const Input = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    jobNumber: "",
    customerName: "",
    brand: "",
    phoneNumber: "",
  });
  const [error, setError] = useState(null);

  // handle field updates
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Allow only numbers for phone number
    if (name === "phoneNumber" && !/^\d*$/.test(value)) return;

    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  // handle brand change (Autocomplete)
  const handleBrandChange = (event, newValue) => {
    setForm((prev) => ({ ...prev, brand: newValue }));
    if (error) setError(null);
  };

  // handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Frontend Validation
    if (!form.jobNumber || !form.customerName || !form.brand || !form.phoneNumber) {
      setError("All fields are required.");
      return;
    }

    if (form.phoneNumber.length !== 10) {
      setError("Phone number must be exactly 10 digits.");
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
        console.log("✅ Saved:", data);
        alert("✅ Writing to database successful!");
        setForm({ jobNumber: "", customerName: "", brand: "", phoneNumber: "" });
        navigate("/");
      } else {
        console.error("❌ Error saving:", data);
        alert("❌ Writing to database failed. Please try again.");
        setError(data.error || "Failed to save data.");
      }
    } catch (err) {
      console.error("⚠️ Network error:", err);
      setError("Error connecting to server.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        width: "100%",       // Changed from 300px
        maxWidth: "400px",   // Slightly wider for better UX
        margin: "2rem auto",
        padding: "0 1rem",   // Add padding for mobile edges
        boxSizing: 'border-box'
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "0.5rem" }}>New Entry</h2>

      <TextField
        name="jobNumber"
        label="Job Number"
        value={form.jobNumber}
        onChange={handleChange}
        required
        error={!!error}
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
        fullWidth
      />

      {error && (
        <Typography color="error" variant="body2" align="center">
          {error}
        </Typography>
      )}

      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "1rem" }}>
        <Button type="submit" variant="contained" color="primary" style={{ flex: 1, padding: "10px" }}>
          Save
        </Button>
        <Button variant="outlined" onClick={() => navigate("/items")} style={{ flex: 1, padding: "10px" }}>
          VIEW
        </Button>
      </div>
    </form>
  );
};

export default Input;
