import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  IconButton,
  Typography,
  Box,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  CardActions,
  Stack,
  Tooltip,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";

const STATUS_COLORS = {
  Received: "default",
  "In Progress": "warning",
  "Waiting for Parts": "error",
  Ready: "success",
  Delivered: "primary",
};

const ItemsList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [editItem, setEditItem] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch items
  const fetchItems = useCallback(() => {
    setLoading(true);
    let url = `${API_BASE_URL}/api/items`;
    if (debouncedSearch) {
      url += `?search=${encodeURIComponent(debouncedSearch)}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [debouncedSearch]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/items/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item._id !== id));
        setSnackbar({ open: true, message: "Deleted successfully", severity: "success" });
      } else {
        setSnackbar({ open: true, message: "Failed to delete", severity: "error" });
      }
    } catch (err) {
      setSnackbar({ open: true, message: "Network error", severity: "error" });
    }
  };

  const handleEditSave = async () => {
    if (!editItem) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/items/${editItem._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editItem),
      });

      if (res.ok) {
        setSnackbar({ open: true, message: "Updated successfully", severity: "success" });
        setEditItem(null);
        fetchItems(); // Refresh current view
      } else {
        const data = await res.json();
        setSnackbar({ open: true, message: data.error || "Update failed", severity: "error" });
      }
    } catch (err) {
      setSnackbar({ open: true, message: "Network error", severity: "error" });
    }
  };

  const downloadBackup = () => {
    window.open(`${API_BASE_URL}/api/items/backup`, "_blank");
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  // Mobile Card Component
  const MobileCard = ({ item }) => (
    <Card sx={{ mb: 2, boxShadow: "var(--shadow-sm)", borderRadius: "var(--radius)" }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" component="div" fontWeight="bold">
            {item.jobNumber}
          </Typography>
          <Chip
            label={item.status || "Received"}
            color={STATUS_COLORS[item.status] || "default"}
            size="small"
            variant="outlined"
          />
        </Box>
        <Typography color="text.secondary" gutterBottom>
          {item.brand}
        </Typography>
        <Typography variant="body1" component="div">
          {item.customerName}
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          📞 {item.phoneNumber}
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: "flex-end", px: 2, pb: 2 }}>
        <IconButton color="primary" onClick={() => setEditItem(item)}>
          <EditIcon />
        </IconButton>
        <IconButton color="error" onClick={() => handleDelete(item._id)}>
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );

  return (
    <Box sx={{ maxWidth: "1200px", margin: "0 auto", padding: isMobile ? 2 : 4 }}>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        mb={4}
      >
        <Typography variant="h4" fontWeight="bold" sx={{ color: "var(--text-main)" }}>
          Repair Jobs
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={downloadBackup}
          >
            Backup
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate("/")}
            sx={{ boxShadow: "var(--shadow-md)" }}
          >
            New Job
          </Button>
        </Stack>
      </Stack>

      {/* Search Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by Customer, Job #, or Brand..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
          }}
          size="small"
        />
      </Paper>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <Typography>Loading...</Typography>
        </Box>
      ) : items.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center", borderRadius: "var(--radius)" }}>
          <Typography variant="h5" gutterBottom>📭 Database is Empty</Typography>
          <Typography color="text.secondary">Running a search? Try a different keyword.</Typography>
          {search === "" && (
            <Button
              sx={{ mt: 2 }}
              variant="contained"
              onClick={() => navigate("/")}
            >
              Add First Job
            </Button>
          )}
        </Paper>
      ) : isMobile ? (
        <Box>{items.map((item) => <MobileCard key={item._id} item={item} />)}</Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
          <Table>
            <TableHead sx={{ bgcolor: "var(--bg-gradient)" }}>
              <TableRow>
                <TableCell><b>Job Number</b></TableCell>
                <TableCell><b>Customer</b></TableCell>
                <TableCell><b>Brand</b></TableCell>
                <TableCell><b>Phone</b></TableCell>
                <TableCell><b>Status</b></TableCell>
                <TableCell align="right"><b>Actions</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item._id} hover>
                  <TableCell>{item.jobNumber}</TableCell>
                  <TableCell>{item.customerName}</TableCell>
                  <TableCell>{item.brand}</TableCell>
                  <TableCell>{item.phoneNumber}</TableCell>
                  <TableCell>
                    <Chip
                      label={item.status || "Received"}
                      color={STATUS_COLORS[item.status] || "default"}
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton color="primary" onClick={() => setEditItem(item)} size="small">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton color="error" onClick={() => handleDelete(item._id)} size="small">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onClose={() => setEditItem(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Job Details</DialogTitle>
        <DialogContent dividers>
          {editItem && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Job Number"
                value={editItem.jobNumber}
                disabled // Job Number usually shouldn't change
                fullWidth
              />
              <TextField
                label="Customer Name"
                value={editItem.customerName}
                onChange={(e) => setEditItem({ ...editItem, customerName: e.target.value })}
                fullWidth
              />
              <TextField
                label="Brand"
                value={editItem.brand}
                onChange={(e) => setEditItem({ ...editItem, brand: e.target.value })}
                fullWidth
              />
              <TextField
                label="Phone Number"
                value={editItem.phoneNumber}
                onChange={(e) => setEditItem({ ...editItem, phoneNumber: e.target.value })}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editItem.status || "Received"}
                  label="Status"
                  onChange={(e) => setEditItem({ ...editItem, status: e.target.value })}
                >
                  {Object.keys(STATUS_COLORS).map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditItem(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
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
    </Box>
  );
};

export default ItemsList;
