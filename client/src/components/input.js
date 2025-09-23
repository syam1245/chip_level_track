// client/src/components/Input.js
import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { useNavigate } from 'react-router-dom';


const Input = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    jobNumber: "",
    customerName: "",
    brand: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Failed to create item");
      }

      const data = await response.json();
      console.log("Created:", data);

      // reset form
      setForm({ jobNumber: "", customerName: "", brand: "" });
    } catch (err) {
      console.error(err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <TextField
        name="jobNumber"
        label="Job Number"
        variant="outlined"
        value={form.jobNumber}
        onChange={handleChange}
      />
      <TextField
        name="customerName"
        label="Customer Name"
        variant="outlined"
        value={form.customerName}
        onChange={handleChange}
      />
      <TextField
        name="brand"
        label="Brand"
        variant="outlined"
        value={form.brand}
        onChange={handleChange}
      />
      <Button variant="contained" onClick={handleSubmit}>
        CREATE
      </Button>
      <Button variant="outlined" onClick={() => navigate('/items')}>VIEW</Button>
    </div>
  );
};

export default Input;
