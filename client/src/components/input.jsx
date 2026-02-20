import React, { useState, useRef, useCallback } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  Devices as DeviceIcon,
  ConfirmationNumber as JobIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  CameraAlt as CameraIcon,
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  AutoFixHigh as MagicIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Webcam from "react-webcam";
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
  const [visionOpen, setVisionOpen] = useState(false);
  const [visionLoading, setVisionLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
  }, [webcamRef]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVisionExtract = async () => {
    if (!capturedImage) return;
    setVisionLoading(true);
    try {
      const res = await authFetch("/api/vision/extract", {
        method: "POST",
        body: JSON.stringify({ image: capturedImage }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const extracted = data.data;
        setForm((prev) => ({
          ...prev,
          jobNumber: extracted.jobNumber || prev.jobNumber,
          customerName: extracted.customerName || prev.customerName,
          brand: extracted.brand || prev.brand,
          phoneNumber: extracted.phoneNumber || prev.phoneNumber,
        }));
        setSnackbar({ open: true, message: "✨ Data extracted successfully!", severity: "success" });
        setVisionOpen(false);
        setCapturedImage(null);
      } else {
        const errorMsg = data.error || data.message || "Extraction failed.";
        setSnackbar({ open: true, message: `❌ ${errorMsg}`, severity: "error" });
      }
    } catch (err) {
      setSnackbar({ open: true, message: "Error connecting to vision service.", severity: "error" });
    } finally {
      setVisionLoading(false);
    }
  };

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
        setSnackbar({ open: true, message: "✅ Job created! Redirecting...", severity: "success" });
        setForm({ jobNumber: "", customerName: "", brand: "", phoneNumber: "" });
        // Navigate to items list after a short delay so user sees the success message
        setTimeout(() => navigate("/items"), 1500);
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

              <Button
                variant="outlined"
                fullWidth
                onClick={() => setVisionOpen(true)}
                startIcon={<MagicIcon />}
                sx={{
                  borderRadius: "8px",
                  borderStyle: "dashed",
                  borderWidth: "2px",
                  py: 1.5,
                  fontWeight: 700,
                  textTransform: "none",
                  color: "var(--color-primary)",
                  borderColor: "var(--color-primary)",
                  "&:hover": {
                    borderColor: "var(--color-primary-dark)",
                    bgcolor: "rgba(59, 130, 246, 0.05)",
                  }
                }}
              >
                Scan Job Sheet using Camera
              </Button>

              <Stack direction="row" spacing={2} pt={2}>
                <Button
                  variant="text"
                  fullWidth
                  onClick={() => navigate("/items")}
                  size="large"
                  startIcon={<ArrowBackIcon />}
                  sx={{ color: "text.secondary", fontWeight: 600 }}
                >
                  View All
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

      <Box sx={{ mt: 3, textAlign: "center" }}>
        <Button variant="text" size="small" onClick={() => navigate("/items")} sx={{ color: 'text.secondary', fontWeight: 700 }}>
          Manage All Jobs
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

      <Dialog
        open={visionOpen}
        onClose={() => !visionLoading && setVisionOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "var(--radius)", overflow: "hidden" }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="h6" fontWeight="800">Scan Repair Info</Typography>
          <IconButton onClick={() => setVisionOpen(false)} disabled={visionLoading} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, minHeight: 300, bgcolor: '#000', position: 'relative' }}>
          {capturedImage ? (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#000' }}>
              <img src={capturedImage} alt="Captured" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
              {visionLoading && (
                <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', flexWrap: 'wrap', placeContent: 'center', gap: 2, color: '#fff', zIndex: 2 }}>
                  <CircularProgress color="inherit" />
                  <Typography variant="h6" fontWeight="700">Analyzing the image...</Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment" }}
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between', bgcolor: 'background.paper' }}>
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <Button
            startIcon={<UploadIcon />}
            onClick={() => fileInputRef.current.click()}
            disabled={visionLoading}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Upload
          </Button>
          <Stack direction="row" spacing={1}>
            {capturedImage ? (
              <Button
                variant="outlined"
                onClick={() => setCapturedImage(null)}
                disabled={visionLoading}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Retake
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={capture}
                startIcon={<CameraIcon />}
                disabled={visionLoading}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
              >
                Capture
              </Button>
            )}
            <Button
              variant="contained"
              onClick={handleVisionExtract}
              disabled={!capturedImage || visionLoading}
              startIcon={<MagicIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: '8px',
                background: "linear-gradient(135deg, #6366f1, #3b82f6)",
                "&:hover": { background: "linear-gradient(135deg, #4f46e5, #2563eb)" }
              }}
            >
              Analyze with AI
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Input;
