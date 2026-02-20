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
  Divider,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
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
  CheckCircle as CheckCircleIcon,
  Notes as NotesIcon,
  HourglassEmpty as HourglassIcon,
  GridView as AllJobsIcon
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
  Return: "default",
};

// Status accent colors for the card top bar
const STATUS_ACCENT = {
  Received: '#94a3b8',
  'In Progress': '#f59e0b',
  'Waiting for Parts': '#ef4444',
  'Sent to Service': '#3b82f6',
  Ready: '#10b981',
  Delivered: '#6366f1',
  Return: '#a855f7',
};

// --- Sub-Components ---

const StatCard = React.memo(({ title, value, color, icon, isActive, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    style={{ height: '100%' }}
  >
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        bgcolor: isActive ? `${color}18` : "var(--surface)",
        border: isActive ? `2px solid ${color}` : "1px solid var(--border)",
        borderRadius: "var(--radius)",
        boxShadow: isActive ? `0 0 0 3px ${color}22` : "var(--shadow-sm)",
        height: '100%',
        cursor: 'pointer',
        transition: "all 0.2s ease",
        "&:hover": { transform: "translateY(-3px)", boxShadow: `0 6px 20px ${color}30`, borderColor: color }
      }}
    >
      <CardContent sx={{
        p: { xs: 1.5, md: 2 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        "&:last-child": { pb: { xs: 1.5, md: 2 } }
      }}>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight="700" textTransform="uppercase" sx={{ fontSize: { xs: '0.6rem', md: '0.7rem' }, letterSpacing: '0.06em' }}>
            {title}
          </Typography>
          <Typography
            variant="h5"
            fontWeight="800"
            sx={{ color: color, mt: 0.25, lineHeight: 1.2, fontSize: { xs: '1.4rem', md: '1.75rem' } }}
          >
            {value}
          </Typography>
          {isActive && (
            <Typography variant="caption" sx={{ color: color, fontWeight: 700, fontSize: '0.6rem' }}>
              ● ACTIVE FILTER
            </Typography>
          )}
        </Box>
        <Box sx={{
          bgcolor: `${color}18`,
          p: { xs: 1, md: 1.5 },
          borderRadius: "12px",
          color: color,
          display: 'flex',
          '& svg': { fontSize: { xs: '1.3rem', md: '1.75rem' } }
        }}>
          {icon}
        </Box>
      </CardContent>
    </Card>
  </motion.div>
));

const MobileCard = React.memo(({ item, onWhatsApp, onPrint, onEdit, onDelete, canDelete }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.2 }}
  >
    <Card sx={{
      mb: 2,
      borderRadius: "var(--radius)",
      boxShadow: "var(--shadow-sm)",
      border: "1px solid var(--border)",
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Status accent bar at top */}
      <Box sx={{
        height: '4px',
        background: STATUS_ACCENT[item.status] || '#94a3b8'
      }} />
      <CardContent sx={{ pb: 1, p: { xs: 1.5, sm: 2 } }}>
        {/* Header row: Job number + Status chip */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Typography variant="caption" fontWeight="900" sx={{ color: "primary.main", letterSpacing: '0.05em', bgcolor: alpha('#3b82f6', 0.1), px: 1, py: 0.5, borderRadius: 1.5 }}>
            #{item.jobNumber}
          </Typography>
          <Chip
            label={item.status || "Received"}
            color={STATUS_COLORS[item.status] || "default"}
            size="small"
            sx={{ fontWeight: 800, borderRadius: '6px', fontSize: '0.65rem', height: 20 }}
          />
        </Box>

        {/* Customer + Device row */}
        <Box mb={1.5}>
          <Typography variant="body1" fontWeight="800" sx={{ lineHeight: 1.2, mb: 0.5 }}>
            {item.customerName}
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <DeviceIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary" fontWeight="600" sx={{ fontSize: '0.8rem' }}>
              {item.brand}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 700 }}>
            📞 {item.phoneNumber}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
              By <strong>{item.technicianName}</strong> • {new Date(item.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>

        {/* Repair Notes — only shown if present */}
        {item.repairNotes && (
          <Box sx={{
            mt: 1,
            p: 1,
            bgcolor: 'action.hover',
            borderRadius: '8px',
            borderLeft: '3px solid var(--color-primary)',
            display: 'flex',
            gap: 0.75,
            alignItems: 'flex-start'
          }}>
            <NotesIcon sx={{ fontSize: '0.9rem', color: 'var(--color-primary)', mt: '2px', flexShrink: 0 }} />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                fontStyle: 'italic'
              }}
            >
              {item.repairNotes}
            </Typography>
          </Box>
        )}

        {/* Date */}
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
          {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Typography>
      </CardContent>

      <Divider sx={{ opacity: 0.4 }} />

      <CardActions sx={{ justifyContent: "space-between", px: 1.5, py: 1 }}>
        <Box display="flex" gap={0.75}>
          <Tooltip title="WhatsApp">
            <IconButton size="small" color="success" onClick={() => onWhatsApp(item)} sx={{ bgcolor: '#dcfce7' }}>
              <WhatsAppIcon sx={{ fontSize: '1.1rem' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print Job Sheet">
            <IconButton size="small" onClick={() => onPrint(item)} sx={{ bgcolor: '#f1f5f9', color: '#64748b' }}>
              <PrintIcon sx={{ fontSize: '1.1rem' }} />
            </IconButton>
          </Tooltip>
        </Box>
        <Box display="flex" gap={0.75}>
          <Tooltip title="Edit">
            <IconButton size="small" color="primary" onClick={() => onEdit(item)} sx={{ bgcolor: '#dbeafe' }}>
              <EditIcon sx={{ fontSize: '1.1rem' }} />
            </IconButton>
          </Tooltip>
          {canDelete && (
            <Tooltip title="Delete">
              <IconButton size="small" color="error" onClick={() => onDelete(item._id)} sx={{ bgcolor: '#fee2e2' }}>
                <DeleteIcon sx={{ fontSize: '1.1rem' }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </CardActions>
    </Card>
  </motion.div>
));

const ItemsList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    ready: 0,
    returned: 0
  });

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 10;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  // activeFilter: 'all' | 'inProgress' | 'ready' | 'pending'
  // Default to 'inProgress' — newly created jobs (Received) land here
  const [activeFilter, setActiveFilter] = useState("inProgress");

  const [editItem, setEditItem] = useState(null);
  const [printItem, setPrintItem] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null); // replaces window.confirm
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

  // Fetch items — AbortController cancels stale requests on rapid re-triggers
  const fetchItems = useCallback(() => {
    const controller = new AbortController();
    setLoading(true);

    let url = `/api/items?page=${page}&limit=${LIMIT}`;
    if (debouncedSearch) {
      // Global search — ignore the active status card filter entirely
      url += `&search=${encodeURIComponent(debouncedSearch)}`;
    } else if (activeFilter && activeFilter !== "all") {
      // Card filter only applies when the search box is empty
      url += `&statusGroup=${activeFilter}`;
    }

    authFetch(url, { method: "GET", signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        setItems(data.items || []);
        setTotalPages(data.totalPages || 1);
        if (data.stats) setStats(data.stats);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return; // cancelled — ignore
        console.error(err);
        setSnackbar({ open: true, message: "Failed to load data", severity: "error" });
        setLoading(false);
      });

    // Return cleanup so the useEffect can cancel on re-fire
    return () => controller.abort();
  }, [debouncedSearch, page, activeFilter]);

  useEffect(() => {
    const cancel = fetchItems();
    return cancel; // abort on cleanup
  }, [fetchItems]);

  const handleDelete = useCallback(async (id) => {
    setDeleteConfirmId(id);
  }, []);

  const confirmDelete = async () => {
    const id = deleteConfirmId;
    setDeleteConfirmId(null);
    try {
      const res = await authFetch(`/api/items/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item._id !== id));
        setSnackbar({ open: true, message: "Deleted successfully", severity: "success" });
        fetchItems();
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

  const downloadBackup = useCallback(() => {
    window.open(`${API_BASE_URL}/api/items/backup`, "_blank");
  }, []);

  const handleWhatsApp = useCallback((item) => {
    const message = `Hi I am from Admin info solution, your ${item.brand} (Job #${item.jobNumber}) is now READY for pickup! Give us a callback for further details.`;
    const url = `https://wa.me/91${item.phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }, []);

  const handleCloseSnackbar = useCallback(() => setSnackbar((prev) => ({ ...prev, open: false })), []);
  const handlePageChange = useCallback((event, value) => setPage(value), []);
  const handleFilterChange = useCallback((filter) => {
    setActiveFilter(filter);
    setPage(1); // reset to page 1 on filter change
  }, []);

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
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "var(--shadow-md)",
                background: "var(--color-primary)",
                "&:hover": { background: "var(--color-primary-dark)" },
              }}
            >
              New Job
            </Button>
          </Stack>
        </Stack>
      </motion.div>


      <AnimatePresence>
        {/* Stats Filter Cards */}
        <Box sx={{ position: 'relative', mb: 4, opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s' }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
              gap: { xs: 1.5, md: 2 },
            }}
          >
            {[
              {
                key: "inProgress",
                title: "In Progress",
                value: stats.inProgress,
                color: "#f59e0b",
                icon: <BuildIcon />,
                subtitle: "Received · Working · Waiting · Sent"
              },
              {
                key: "ready",
                title: "Ready / Done",
                value: stats.ready,
                color: "#10b981",
                icon: <CheckCircleIcon />,
                subtitle: "Ready for pickup · Delivered"
              },
              {
                key: "returned",
                title: "Return",
                value: stats.returned,
                color: "#a855f7",
                icon: <HourglassIcon />,
                subtitle: "Awaiting customer feedback"
              },
              {
                key: "all",
                title: "All Jobs",
                value: stats.total,
                color: "var(--color-primary)",
                icon: <AllJobsIcon />,
                subtitle: "Every job in the system"
              },
            ].map((stat) => (
              <StatCard
                key={stat.key}
                title={stat.title}
                value={stat.value}
                color={stat.color}
                icon={stat.icon}
                isActive={activeFilter === stat.key}
                onClick={() => handleFilterChange(stat.key)}
              />
            ))}
          </Box>
          {/* Active filter label */}
          {activeFilter !== "all" && (
            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Showing filtered results —
              </Typography>
              <Chip
                label={`Clear filter`}
                size="small"
                onDelete={() => handleFilterChange("all")}
                sx={{ fontWeight: 600, fontSize: '0.7rem', height: '22px' }}
              />
            </Box>
          )}
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
                canDelete={true}
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
                    <TableCell><Typography variant="subtitle2" fontWeight="700" color="text.secondary">TECHNICIAN</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2" fontWeight="700" color="text.secondary">PHONE</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2" fontWeight="700" color="text.secondary">STATUS</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2" fontWeight="700" color="text.secondary">NOTES</Typography></TableCell>
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
                      <TableCell>
                        <Typography variant="body2" fontWeight="600">{item.technicianName}</Typography>
                      </TableCell>
                      <TableCell>{item.phoneNumber}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.status || "Received"}
                          color={STATUS_COLORS[item.status] || "default"}
                          size="small"
                          sx={{ borderRadius: '6px', fontWeight: 600, fontSize: '0.75rem', height: '24px' }}
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 220 }}>
                        {item.repairNotes ? (
                          <Box sx={{
                            p: '6px 10px',
                            bgcolor: 'action.hover',
                            borderRadius: '6px',
                            borderLeft: '3px solid var(--color-primary)',
                            display: 'flex',
                            gap: 0.75,
                            alignItems: 'flex-start'
                          }}>
                            <NotesIcon sx={{ fontSize: '0.85rem', color: 'var(--color-primary)', mt: '2px', flexShrink: 0 }} />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                lineHeight: 1.5,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                fontStyle: 'italic'
                              }}
                            >
                              {item.repairNotes}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        )}
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
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleDelete(item._id)} sx={{ color: '#ef4444', bgcolor: '#fee2e2' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
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
      {
        totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size={isMobile ? "small" : "large"}
              showFirstButton={!isMobile}
              showLastButton={!isMobile}
              sx={{
                '& .MuiPaginationItem-root': { borderRadius: '10px', fontWeight: 700 }
              }}
            />
          </Box>
        )
      }

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
                <Grid size={6}>
                  <TextField
                    label="Job Number"
                    value={editItem.jobNumber}
                    disabled
                    fullWidth
                    variant="filled"
                    size="small"
                  />
                </Grid>
                <Grid size={6}>
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 0 }}>Delete Job?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone. The job will be permanently removed from the list.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDeleteConfirmId(null)} sx={{ color: "text.secondary", borderRadius: "8px" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDelete}
            sx={{ borderRadius: "8px", fontWeight: 700 }}
          >
            Yes, Delete
          </Button>
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
    </Box >
  );
};

export default ItemsList;
