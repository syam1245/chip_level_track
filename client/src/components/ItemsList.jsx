// This usage is effectively a "reset" for this file to fix the broken state.
import React, { useEffect, useState, useCallback, useRef } from "react";
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
  Grid,
  Pagination,
  CircularProgress,
  Divider
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  WhatsApp as WhatsAppIcon,
  Print as PrintIcon,
  Devices as DeviceIcon,
  Build as BuildIcon,
  Pending as PendingIcon,
  CheckCircle as CheckCircleIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { motion, AnimatePresence } from "framer-motion";
import API_BASE_URL, { authFetch } from "../api";
import { useAuth } from "../auth/AuthContext";
import JobSheetPrintTemplate from "./JobSheetPrintTemplate";

const STATUS_COLORS = {
  Received: "default",
  "In Progress": "warning",
  "Waiting for Parts": "error",
  "Sent to Service": "info",
  Ready: "success",
  Delivered: "primary",
};

// --- Sub-Components ---

const StatCard = ({ title, value, color, icon, isMobile }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    style={{ height: '100%' }}
  >
    <Card
      elevation={0}
      sx={{
        bgcolor: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-sm)",
        height: '100%',
        transition: "transform 0.2s",
        "&:hover": { transform: "translateY(-4px)", boxShadow: "var(--shadow-md)" }
      }}
    >
      <CardContent sx={{
        p: { xs: 1, md: 2 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        "&:last-child": { pb: { xs: 1, md: 2 } }
      }}>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight="700" textTransform="uppercase" sx={{ fontSize: { xs: '0.6rem', md: '0.75rem' }, letterSpacing: '0.05em' }}>
            {title}
          </Typography>
          <Typography
            variant={isMobile ? "h6" : "h5"}
            fontWeight="800"
            sx={{
              color: color,
              mt: { xs: 0, md: 0.5 },
              lineHeight: 1.2
            }}
          >
            {value}
          </Typography>
        </Box>
        <Box sx={{
          bgcolor: `${color}15`,
          p: { xs: 0.75, md: 1.5 },
          borderRadius: "12px",
          color: color,
          display: 'flex',
          '& svg': { fontSize: { xs: '1.1rem', md: '1.75rem' } }
        }}>
          {icon}
        </Box>
      </CardContent>
    </Card>
  </motion.div>
);

const MobileCard = ({ item, onWhatsApp, onPrint, onEdit, onDelete, canDelete }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.2 }}
  >
    <Card sx={{ mb: 2, borderRadius: "var(--radius)", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Typography variant="h6" fontWeight="800" sx={{ color: "var(--color-primary)" }}>
            #{item.jobNumber}
          </Typography>
          <Chip
            label={item.status || "Received"}
            color={STATUS_COLORS[item.status] || "default"}
            size="small"
            sx={{ fontWeight: 600, borderRadius: '6px' }}
          />
        </Box>
        <Typography variant="h6" fontWeight="600" gutterBottom>
          {item.customerName}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {item.brand}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          📞 {item.phoneNumber}
        </Typography>
      </CardContent>
      <Divider sx={{ opacity: 0.5 }} />
      <CardActions sx={{ justifyContent: "space-between", px: 2, py: 1.5 }}>
        <Box>
          <IconButton size="small" color="success" onClick={() => onWhatsApp(item)} sx={{ bgcolor: '#dcfce7', mr: 1 }}>
            <WhatsAppIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="default" onClick={() => onPrint(item)} sx={{ bgcolor: '#f1f5f9' }}>
            <PrintIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box>
          <IconButton size="small" color="primary" onClick={() => onEdit(item)} sx={{ bgcolor: '#dbeafe', mr: 1 }}>
            <EditIcon fontSize="small" />
          </IconButton>
          {canDelete ? (
          <IconButton size="small" color="error" onClick={() => onDelete(item._id)} sx={{ bgcolor: '#fee2e2' }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
          ) : null}
        </Box>
      </CardActions>
    </Card>
  </motion.div>
);

const ItemsList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    waiting: 0,
    ready: 0
  });

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 10;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [editItem, setEditItem] = useState(null);
  const [printItem, setPrintItem] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const printComponentRef = useRef();

  // Handle Print Logic
  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: printItem ? `Receipt_${printItem.jobNumber}` : "Receipt",
    onAfterPrint: () => setPrintItem(null)
  });

  useEffect(() => {
    if (printItem && printComponentRef.current) {
      handlePrint();
    }
  }, [printItem, handlePrint]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch items
  const fetchItems = useCallback(() => {
    setLoading(true);
    let url = `${API_BASE_URL}/api/items?page=${page}&limit=${LIMIT}`;
    if (debouncedSearch) {
      url += `&search=${encodeURIComponent(debouncedSearch)}`;
    }

    authFetch(url.replace(API_BASE_URL, ""), { method: "GET" })
      .then((res) => res.json())
      .then((data) => {
        // Backend now returns { items, currentPage, totalPages, totalItems }
        setItems(data.items || []);
        setTotalPages(data.totalPages || 1);
        if (data.stats) setStats(data.stats);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setSnackbar({ open: true, message: "Failed to load data", severity: "error" });
        setLoading(false);
      });
  }, [debouncedSearch, page]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      const res = await authFetch(`/api/items/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item._id !== id));
        setSnackbar({ open: true, message: "Deleted successfully", severity: "success" });
        fetchItems(); // Refresh to update counts/pages
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
      const res = await authFetch(`/api/items/${editItem._id}`, {
        method: "PUT",
        body: JSON.stringify(editItem),
      });

      if (res.ok) {
        setSnackbar({ open: true, message: "Updated successfully", severity: "success" });
        setEditItem(null);
        fetchItems();
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

  const handleWhatsApp = (item) => {
    const message = `Hi I am from Admin info solution, your ${item.brand} (Job #${item.jobNumber}) is now READY for pickup! Give us a callback for further details.`;
    const url = `https://wa.me/91${item.phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });
  const handlePageChange = (event, value) => setPage(value);

  return (
    <Box sx={{ maxWidth: "1400px", margin: "0 auto", padding: isMobile ? 2 : 4, pb: 10 }}>
      {/* Hidden container for printing */}
      <div style={{ display: 'none' }}>
        <JobSheetPrintTemplate ref={printComponentRef} item={printItem} />
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "start", md: "center" }}
          spacing={3}
          mb={5}
        >
          <Box>
            <Typography variant="h3" fontWeight="900" className="text-gradient" sx={{ letterSpacing: '-1px' }}>
              Repair Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" mt={0.5}>
              Manage your service jobs effectively.
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Signed in as <strong>{user?.displayName}</strong> ({user?.role})
            </Typography>
          </Box>

          <Stack direction="row" spacing={2}>
            {isAdmin ? (
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={downloadBackup}
              sx={{ borderRadius: "var(--radius)", textTransform: 'none', fontWeight: 600 }}
            >
              Backup Data
            </Button>
            ) : null}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/")}
              sx={{
                borderRadius: "var(--radius)",
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: "var(--shadow-md)",
                background: "var(--color-primary)",
                "&:hover": { background: "var(--color-primary-dark)" }
              }}
            >
              New Job
            </Button>
            <Button
              variant="text"
              onClick={async () => {
                await logout();
                navigate("/login", { replace: true });
              }}
            >
              Logout
            </Button>
          </Stack>
        </Stack>
      </motion.div>


      <AnimatePresence>
        {/* Stats Summary - Always visible to prevent layout shift */}
        <Box sx={{ position: 'relative', mb: 4, opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s' }}>
          {/* Subtle Fade Edges for Scroll Indicator */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: 40,
            background: 'linear-gradient(to left, var(--background-default), transparent)',
            zIndex: 2,
            pointerEvents: 'none',
            display: { md: 'none' }
          }} />
          <Box
            sx={{
              display: "flex",
              gap: 2,
              overflowX: { xs: "auto", md: "visible" },
              pb: { xs: 1, md: 0 },
              mx: { xs: -2, md: 0 },
              px: { xs: 2, md: 0 },
              scrollSnapType: { xs: "x mandatory", md: "none" },
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {[
              { title: "Total Jobs", value: stats.total, color: "var(--color-primary)", icon: <DeviceIcon /> },
              { title: "In Progress", value: stats.inProgress, color: "#f59e0b", icon: <BuildIcon /> },
              { title: "Waiting Parts", value: stats.waiting, color: "#ef4444", icon: <PendingIcon /> },
              { title: "Ready", value: stats.ready, color: "#10b981", icon: <CheckCircleIcon /> }
            ].map((stat, index) => (
              <Box
                key={index}
                sx={{
                  minWidth: { xs: "160px", sm: "200px", md: "auto" },
                  flex: { xs: "0 0 auto", md: 1 },
                  scrollSnapAlign: "start"
                }}
              >
                <StatCard {...stat} isMobile={isMobile} />
              </Box>
            ))}
          </Box>
        </Box>
      </AnimatePresence>

      {/* Search & Statistics Placeholder (Future: Real Stats) */}
      <Paper
        elevation={0}
        className="glass-panel"
        sx={{ p: 2, mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}
      >
        <SearchIcon color="action" />
        <input
          style={{
            border: 'none',
            outline: 'none',
            width: '100%',
            fontSize: '1rem',
            background: 'transparent',
            color: 'var(--text-main)'
          }}
          placeholder="Search by Customer, Job Number, Brand or Phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {loading && <CircularProgress size={20} />}
      </Paper>

      {/* Content */}
      <AnimatePresence mode="wait">
        {loading && items.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress sx={{ color: "var(--color-primary)" }} />
          </Box>
        ) : items.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Paper sx={{ p: 8, textAlign: "center", borderRadius: "var(--radius)", bgcolor: "var(--surface)" }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>No Jobs Found</Typography>
              <Typography color="text.secondary">Try adjusting your search filters or add a new job.</Typography>
              <Button sx={{ mt: 3 }} variant="contained" onClick={() => setSearch("")}>Clear Search</Button>
            </Paper>
          </motion.div>
        ) : isMobile ? (
          <Box sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
            {items.map((item) => (
              <MobileCard
                key={item._id}
                item={item}
                onWhatsApp={handleWhatsApp}
                onPrint={setPrintItem}
                onEdit={setEditItem}
                onDelete={handleDelete}
                canDelete={isAdmin}
              />
            ))}
          </Box>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: 'hidden', opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
              <Table>
                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                  <TableRow>
                    <TableCell><Typography variant="subtitle2" fontWeight="700" color="text.secondary">JOB NO</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2" fontWeight="700" color="text.secondary">CUSTOMER</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2" fontWeight="700" color="text.secondary">DEVICE</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2" fontWeight="700" color="text.secondary">PHONE</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2" fontWeight="700" color="text.secondary">STATUS</Typography></TableCell>
                    <TableCell align="right"><Typography variant="subtitle2" fontWeight="700" color="text.secondary">ACTIONS</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell align="left">
                        <Typography fontWeight="600" color="primary">{item.jobNumber}</Typography>
                        <Typography variant="caption" color="text.secondary">{new Date(item.createdAt).toLocaleDateString()}</Typography>
                      </TableCell>
                      <TableCell>{item.customerName}</TableCell>
                      <TableCell>{item.brand}</TableCell>
                      <TableCell>{item.phoneNumber}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.status || "Received"}
                          color={STATUS_COLORS[item.status] || "default"}
                          size="small"
                          sx={{ borderRadius: '6px', fontWeight: 600, fontSize: '0.75rem', height: '24px' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" justifyContent="flex-end" spacing={1}>
                          <Tooltip title="WhatsApp">
                            <IconButton size="small" onClick={() => handleWhatsApp(item)} sx={{ color: '#10b981', bgcolor: '#dcfce7' }}>
                              <WhatsAppIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Print">
                            <IconButton size="small" onClick={() => setPrintItem(item)} sx={{ color: '#64748b', bgcolor: '#f1f5f9' }}>
                              <PrintIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => setEditItem(item)} sx={{ color: '#3b82f6', bgcolor: '#dbeafe' }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {isAdmin ? (
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleDelete(item._id)} sx={{ color: '#ef4444', bgcolor: '#fee2e2' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          ) : null}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
            sx={{
              '& .MuiPaginationItem-root': { borderRadius: '8px' }
            }}
          />
        </Box>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editItem}
        onClose={() => setEditItem(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "var(--radius)" }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Job Details</DialogTitle>
        <DialogContent dividers>
          {editItem && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Job Number"
                    value={editItem.jobNumber}
                    disabled
                    fullWidth
                    variant="filled"
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Brand"
                    value={editItem.brand}
                    onChange={(e) => setEditItem({ ...editItem, brand: e.target.value })}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>

              <TextField
                label="Customer Name"
                value={editItem.customerName}
                onChange={(e) => setEditItem({ ...editItem, customerName: e.target.value })}
                fullWidth
                size="small"
              />
              <TextField
                label="Phone Number"
                value={editItem.phoneNumber}
                onChange={(e) => setEditItem({ ...editItem, phoneNumber: e.target.value })}
                fullWidth
                size="small"
              />
              <FormControl fullWidth size="small">
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

              <TextField
                label="Repair Notes (Optional)"
                multiline
                rows={3}
                value={editItem.repairNotes || ""}
                onChange={(e) => setEditItem({ ...editItem, repairNotes: e.target.value })}
                placeholder="E.g. Replaced display, Checked charging port..."
                fullWidth
                variant="outlined"
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditItem(null)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave} sx={{ borderRadius: "8px" }}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%", borderRadius: "8px", boxShadow: "var(--shadow-md)" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ItemsList;
