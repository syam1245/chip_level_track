// client/src/components/Input.js
import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";

const Input = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    jobNumber: "",
    customerName: "",
    brand: "",
  });

  // handle field updates
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE_URL}/api/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        console.log("✅ Saved:", data);
        alert("Data saved successfully!");
        setForm({ jobNumber: "", customerName: "", brand: "" });
        navigate("/"); // optional redirect
      } else {
        console.error("❌ Error saving:", data);
        alert("Failed to save data.");
      }
    } catch (err) {
      console.error("⚠️ Network error:", err);
      alert("Error connecting to server.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        width: "300px",
        margin: "2rem auto",
      }}
    >
      <TextField
        name="jobNumber"
        label="Job Number"
        value={form.jobNumber}
        onChange={handleChange}
        required
      />
      <TextField
        name="customerName"
        label="Customer Name"
        value={form.customerName}
        onChange={handleChange}
        required
      />
      <TextField
        name="brand"
        label="Brand"
        value={form.brand}
        onChange={handleChange}
        required
      />

      <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
        <Button type="submit" variant="contained" color="primary">
          Save
        </Button>
        <Button variant="outlined" onClick={() => navigate("/items")}>
          VIEW
        </Button>
      </div>
    </form>
  );
};

export default Input;
