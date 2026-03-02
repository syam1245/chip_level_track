import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
    Box,
    Pagination,
    Snackbar,
    Alert,
    useMediaQuery,
    useTheme,
    Paper,
    Typography,
    Button,
    Chip,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Stack,
    Tooltip,
    IconButton,
} from "@mui/material";
import { Close as CloseIcon, CheckBox as CheckBoxIcon } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";

import API_BASE_URL, { authFetch } from "../../api";
import { useAuth } from "../../auth/AuthContext";

import JobSheetPrintTemplate from "../JobSheetPrintTemplate";
import MobileCard from "../MobileCard";
import PullToRefresh from "../PullToRefresh";
import KeyboardShortcutsDialog from "../KeyboardShortcutsDialog";

import { generateWhatsAppMessage } from "../../utils/whatsapp";

import ItemsListHeader from "./ItemsListHeader";
import ItemsListFilters from "./ItemsListFilters";
import ItemsTable from "./ItemsTable";
import EditJobDialog from "./EditJobDialog";
import DeleteJobDialog from "./DeleteJobDialog";
import { useNotifications } from "../../hooks/useNotifications";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { ItemsListSkeleton } from "../Skeletons";

const ItemsList = () => {
    // ── Context / hooks that other state depends on — must come first ──────────
    const navigate = useNavigate();
    const { user } = useAuth();
    const { notify } = useNotifications();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const isAdmin = user?.role === "admin";

    // ── State ──────────────────────────────────────────────────────────────────
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        inProgress: 0,
        ready: 0,
        returned: 0,
        agingSummary: { attention: 0, overdue: 0, critical: 0, total: 0 }
    });
    // Incrementing this counter causes the main fetchItems useEffect to re-run
    // without adding fetchItems to its deps — avoids fire-and-forget anti-pattern.
    const [dataVersion, setDataVersion] = useState(0);
    const refetch = useCallback(() => setDataVersion((v) => v + 1), []);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Page size — user can pick 10, 25, 50, or 100 rows.  Stored in localStorage.
    const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
    const [pageSize, setPageSize] = useState(() => {
        try {
            const saved = parseInt(localStorage.getItem('chip_page_size'), 10);
            return PAGE_SIZE_OPTIONS.includes(saved) ? saved : 10;
        } catch { return 10; }
    });
    const handlePageSizeChange = useCallback((newSize) => {
        setPageSize(newSize);
        setPage(1);
        try { localStorage.setItem('chip_page_size', String(newSize)); } catch { }
    }, []);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState("inProgress");

    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");
    // Debounced sort — prevents a new API request on every rapid column-header click
    const [debouncedSortBy, setDebouncedSortBy] = useState("createdAt");
    const [debouncedSortOrder, setDebouncedSortOrder] = useState("desc");

    const [technicianFilter, setTechnicianFilter] = useState(() =>
        // Non-admins default to "My Jobs"; admins see everyone by default.
        // user is declared above so this initializer can safely reference it.
        user?.role !== "admin" && user?.displayName ? user.displayName : "All"
    );
    const [techniciansList, setTechniciansList] = useState([]);

    const [editItem, setEditItem] = useState(null);
    const [printItem, setPrintItem] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    // Bulk selection — uses a Set for O(1) lookup
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [bulkStatus, setBulkStatus] = useState("");

    // Keyboard shortcuts state
    const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);
    const [focusedRowIndex, setFocusedRowIndex] = useState(-1);
    const searchInputRef = useRef(null);

    const onSelectChange = useCallback((id, checked) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            checked ? next.add(id) : next.delete(id);
            return next;
        });
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
        setBulkStatus("");
    }, []);

    // ── Refs ───────────────────────────────────────────────────────────────────
    const printComponentRef = useRef();

    useEffect(() => {
        authFetch("/api/auth/users")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setTechniciansList(data);
                }
            })
            .catch(console.error);
    }, []);

    const handlePrint = useReactToPrint({
        contentRef: printComponentRef,
        documentTitle: printItem ? `JobSheet_${printItem.jobNumber}` : "JobSheet",
        onAfterPrint: () => setPrintItem(null)
    });

    useEffect(() => {
        if (printItem && printComponentRef.current) {
            handlePrint();
        }
    }, [printItem, handlePrint]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Debounce sort changes — 150ms is imperceptible to users but prevents
    // a burst of API calls when a column header is clicked repeatedly.
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSortBy(sortBy);
            setDebouncedSortOrder(sortOrder);
        }, 150);
        return () => clearTimeout(timer);
    }, [sortBy, sortOrder]);

    const fetchItems = useCallback(() => {
        const controller = new AbortController();
        setLoading(true);

        let url = `/api/items?page=${page}&limit=${pageSize}&sortBy=${debouncedSortBy}&sortOrder=${debouncedSortOrder}`;
        if (isAdmin) {
            url += `&includeMetadata=true`;
        }
        if (technicianFilter !== "All") {
            url += `&technicianName=${encodeURIComponent(technicianFilter)}`;
        }

        if (debouncedSearch) {
            url += `&search=${encodeURIComponent(debouncedSearch)}`;
        } else if (activeFilter && activeFilter !== "all") {
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
                if (err.name === "AbortError") return;
                console.error(err);
                setSnackbar({ open: true, message: "Failed to load data", severity: "error" });
                setLoading(false);
            });

        return () => controller.abort();
    }, [debouncedSearch, page, activeFilter, debouncedSortBy, debouncedSortOrder, technicianFilter, isAdmin, pageSize]);

    useEffect(() => {
        const cancel = fetchItems();
        return cancel;
        // dataVersion is intentionally included — incrementing it triggers a clean refetch
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchItems, dataVersion]);

    const handleSort = useCallback((property) => {
        setSortOrder((prevOrder) => (sortBy === property && prevOrder === "asc" ? "desc" : "asc"));
        setSortBy(property);
        setPage(1);
    }, [sortBy]);

    const handleDelete = useCallback(async (id) => {
        setDeleteConfirmId(id);
    }, []);

    const confirmDelete = async () => {
        const id = deleteConfirmId;
        setDeleteConfirmId(null);
        try {
            const res = await authFetch(`/api/items/${id}`, { method: "DELETE" });
            if (res.ok) {
                // Optimistic UI update — remove the item immediately from view
                setItems((prev) => prev.filter((item) => item._id !== id));
                setSnackbar({ open: true, message: "Deleted successfully", severity: "success" });
                // Trigger a clean server-driven refetch to sync pagination totals
                refetch();
            } else {
                setSnackbar({ open: true, message: "Failed to delete", severity: "error" });
            }
        } catch (err) {
            setSnackbar({ open: true, message: "Network error", severity: "error" });
        }
    };

    const handleEditSave = async () => {
        if (!editItem) return;
        const prevStatus = items.find(i => i._id === editItem._id)?.status;

        try {
            const res = await authFetch(`/api/items/${editItem._id}`, {
                method: "PUT",
                body: JSON.stringify(editItem),
            });

            if (res.ok) {
                setSnackbar({ open: true, message: "Updated successfully", severity: "success" });
                // Fire notification if status changed
                if (editItem.status && editItem.status !== prevStatus) {
                    notify(
                        `Job ${editItem.jobNumber} — ${editItem.status}`,
                        { body: `${editItem.customerName} · ${editItem.brand}` }
                    );
                }
                setEditItem(null);
                refetch();
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
        const cleanNumber = item.phoneNumber.replace(/\D/g, '');
        const message = generateWhatsAppMessage(item);
        const url = `https://wa.me/91${cleanNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank");
    }, []);

    const handleCloseSnackbar = useCallback(() => setSnackbar((prev) => ({ ...prev, open: false })), []);
    const handlePageChange = useCallback((event, value) => setPage(value), []);
    const handleFilterChange = useCallback((filter) => {
        setActiveFilter(filter);
        setPage(1);
    }, []);

    // Clear selection when page changes
    useEffect(() => { clearSelection(); }, [page, clearSelection]);

    const handleBulkApply = useCallback(async () => {
        if (!bulkStatus || selectedIds.size === 0) return;
        try {
            const res = await authFetch("/api/items/bulk-status", {
                method: "PATCH",
                body: JSON.stringify({ ids: [...selectedIds], status: bulkStatus }),
            });
            const data = await res.json();
            if (res.ok) {
                setSnackbar({ open: true, message: `${data.modifiedCount} job(s) updated to "${bulkStatus}"`, severity: "success" });
                clearSelection();
                refetch();
            } else {
                setSnackbar({ open: true, message: data.error || "Bulk update failed", severity: "error" });
            }
        } catch {
            setSnackbar({ open: true, message: "Network error", severity: "error" });
        }
    }, [bulkStatus, selectedIds, clearSelection, refetch]);

    // ── Keyboard Shortcuts ──────────────────────────────────────────────────
    const shortcuts = useMemo(() => ({
        // Navigation
        "n": () => navigate("/"),
        "s": () => searchInputRef.current?.focus(),
        "/": () => searchInputRef.current?.focus(),
        "a": () => isAdmin && navigate("/admin"),
        "r": () => refetch(),

        // Filters  (1-4 map to the stat cards)
        "1": () => handleFilterChange("inProgress"),
        "2": () => handleFilterChange("ready"),
        "3": () => handleFilterChange("returned"),
        "4": () => handleFilterChange("all"),
        "f": () => {
            setSearch("");
            setTechnicianFilter("All");
            handleFilterChange("all");
        },

        // Table row navigation
        "ArrowDown": () => {
            if (items.length === 0) return;
            setFocusedRowIndex((prev) => Math.min(prev + 1, items.length - 1));
        },
        "ArrowUp": () => {
            if (items.length === 0) return;
            setFocusedRowIndex((prev) => Math.max(prev - 1, 0));
        },
        "Enter": () => {
            if (focusedRowIndex >= 0 && focusedRowIndex < items.length) {
                setEditItem(items[focusedRowIndex]);
            }
        },
        " ": () => {
            // Space — toggle selection on focused row
            if (focusedRowIndex >= 0 && focusedRowIndex < items.length) {
                const id = items[focusedRowIndex]._id;
                onSelectChange(id, !selectedIds.has(id));
            }
        },

        // Row actions on focused row
        "e": () => {
            if (focusedRowIndex >= 0 && focusedRowIndex < items.length) {
                setEditItem(items[focusedRowIndex]);
            }
        },
        "w": () => {
            if (focusedRowIndex >= 0 && focusedRowIndex < items.length) {
                handleWhatsApp(items[focusedRowIndex]);
            }
        },
        "p": () => {
            if (focusedRowIndex >= 0 && focusedRowIndex < items.length) {
                setPrintItem(items[focusedRowIndex]);
            }
        },
        "d": () => {
            if (isAdmin && focusedRowIndex >= 0 && focusedRowIndex < items.length) {
                handleDelete(items[focusedRowIndex]._id);
            }
        },

        // Pagination
        "ArrowLeft": () => page > 1 && setPage((p) => p - 1),
        "[": () => page > 1 && setPage((p) => p - 1),
        "ArrowRight": () => page < totalPages && setPage((p) => p + 1),
        "]": () => page < totalPages && setPage((p) => p + 1),

        // General
        "Escape": () => {
            if (shortcutsDialogOpen) { setShortcutsDialogOpen(false); return; }
            if (editItem) { setEditItem(null); return; }
            if (deleteConfirmId) { setDeleteConfirmId(null); return; }
            if (selectedIds.size > 0) { clearSelection(); return; }
            if (search) { setSearch(""); return; }
            setFocusedRowIndex(-1);
        },
        "b": () => isAdmin && downloadBackup(),
        "shift+?": () => setShortcutsDialogOpen(true),
    }), [navigate, isAdmin, refetch, handleFilterChange, items, focusedRowIndex,
        onSelectChange, selectedIds, handleWhatsApp, handleDelete, page, totalPages,
        shortcutsDialogOpen, editItem, deleteConfirmId, clearSelection, search,
        downloadBackup, setSearch, setTechnicianFilter]);

    // Only enable shortcuts when no dialog is open (except Escape)
    useKeyboardShortcuts(shortcuts, !isMobile);

    return (
        <Box sx={{ maxWidth: "1400px", margin: "0 auto", padding: isMobile ? 2 : 4, pb: 10 }}>
            {/* Hidden container for printing */}
            <div style={{ display: 'none' }}>
                <JobSheetPrintTemplate ref={printComponentRef} item={printItem} />
            </div>

            <ItemsListHeader
                isAdmin={isAdmin}
                downloadBackup={downloadBackup}
                onNewJob={() => navigate("/")}
            />

            <ItemsListFilters
                stats={stats}
                activeFilter={activeFilter}
                handleFilterChange={handleFilterChange}
                search={search}
                setSearch={setSearch}
                loading={loading}
                searchInputRef={searchInputRef}
            />

            <AnimatePresence mode="wait">
                {loading && items.length === 0 ? (
                    <motion.div
                        key="skeleton"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ItemsListSkeleton isMobile={isMobile} />
                    </motion.div>
                ) : items.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Paper sx={{ p: 8, textAlign: "center", borderRadius: "var(--radius)", bgcolor: "var(--surface)" }}>
                            <Typography variant="h5" fontWeight="bold" gutterBottom>No Jobs Found</Typography>
                            <Typography color="text.secondary">Try adjusting your search filters or add a new job.</Typography>
                            <Button sx={{ mt: 3 }} variant="contained" onClick={() => {
                                setSearch("");
                                setTechnicianFilter("All");
                                setActiveFilter("all");
                            }}>Clear Filters</Button>
                        </Paper>
                    </motion.div>
                ) : isMobile ? (
                    <PullToRefresh onRefresh={async () => { refetch(); }} disabled={loading}>
                        <Box sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s', px: 0.5 }}>
                            {items.map((item, index) => (
                                <motion.div
                                    key={item._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
                                >
                                    <MobileCard
                                        item={item}
                                        onWhatsApp={handleWhatsApp}
                                        onPrint={setPrintItem}
                                        onEdit={setEditItem}
                                        onDelete={handleDelete}
                                        canDelete={isAdmin}
                                    />
                                </motion.div>
                            ))}
                        </Box>
                    </PullToRefresh>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {/* Bulk action toolbar — appears when rows are selected */}
                        {selectedIds.size > 0 && (
                            <Paper
                                elevation={4}
                                sx={{
                                    mb: 1, px: 2, py: 1, borderRadius: 2,
                                    display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
                                    bgcolor: 'primary.dark', color: 'primary.contrastText',
                                    border: '1px solid', borderColor: 'primary.main'
                                }}
                            >
                                <CheckBoxIcon sx={{ color: 'primary.contrastText' }} />
                                <Chip
                                    label={`${selectedIds.size} selected`}
                                    size="small"
                                    sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 }}
                                />
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 'auto' }}>
                                    <FormControl size="small" sx={{ minWidth: 170 }}>
                                        <InputLabel sx={{ color: 'primary.contrastText', '&.Mui-focused': { color: 'primary.contrastText' } }}>
                                            Set Status
                                        </InputLabel>
                                        <Select
                                            value={bulkStatus}
                                            label="Set Status"
                                            onChange={(e) => setBulkStatus(e.target.value)}
                                            sx={{
                                                color: 'primary.contrastText',
                                                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' },
                                                '& .MuiSvgIcon-root': { color: 'primary.contrastText' },
                                            }}
                                        >
                                            {['Received', 'Sent to Service', 'In Progress', 'Waiting for Parts', 'Ready', 'Delivered', 'Return', 'Pending'].map(s => (
                                                <MenuItem key={s} value={s}>{s}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={handleBulkApply}
                                        disabled={!bulkStatus}
                                        sx={{ bgcolor: 'white', color: 'primary.dark', fontWeight: 700, '&:hover': { bgcolor: 'grey.100' } }}
                                    >
                                        Apply
                                    </Button>
                                    <Tooltip title="Clear selection (Esc)">
                                        <IconButton size="small" onClick={clearSelection} sx={{ color: 'primary.contrastText' }}>
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            </Paper>
                        )}
                        <ItemsTable
                            items={items}
                            loading={loading}
                            sortBy={sortBy}
                            sortOrder={sortOrder}
                            handleSort={handleSort}
                            technicianFilter={technicianFilter}
                            setTechnicianFilter={setTechnicianFilter}
                            setPage={setPage}
                            techniciansList={techniciansList}
                            handleWhatsApp={handleWhatsApp}
                            setPrintItem={setPrintItem}
                            setEditItem={setEditItem}
                            handleDelete={handleDelete}
                            selectedIds={selectedIds}
                            onSelectChange={onSelectChange}
                            isAdmin={isAdmin}
                            focusedRowIndex={focusedRowIndex}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {totalPages > 1 && (
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    mt: 4,
                    gap: 3,
                    flexWrap: 'wrap',
                }}>
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

                    {/* Page size selector */}
                    {!isMobile && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.75rem' }}>
                                Rows per page:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                {PAGE_SIZE_OPTIONS.map(size => (
                                    <Chip
                                        key={size}
                                        label={size}
                                        size="small"
                                        variant={pageSize === size ? "filled" : "outlined"}
                                        color={pageSize === size ? "primary" : "default"}
                                        onClick={() => handlePageSizeChange(size)}
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: '0.72rem',
                                            height: 26,
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            minWidth: 38,
                                            transition: 'all 0.15s',
                                        }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}
                </Box>
            )}

            <EditJobDialog
                editItem={editItem}
                setEditItem={setEditItem}
                handleEditSave={handleEditSave}
                isAdmin={isAdmin}
            />

            <DeleteJobDialog
                deleteConfirmId={deleteConfirmId}
                setDeleteConfirmId={setDeleteConfirmId}
                confirmDelete={confirmDelete}
            />

            <KeyboardShortcutsDialog
                open={shortcutsDialogOpen}
                onClose={() => setShortcutsDialogOpen(false)}
            />

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

            {/* Keyboard hint — subtle, only on desktop */}
            {!isMobile && (
                <Tooltip title="Press ? to see all keyboard shortcuts" placement="left">
                    <Chip
                        label="? Shortcuts"
                        size="small"
                        onClick={() => setShortcutsDialogOpen(true)}
                        sx={{
                            position: 'fixed',
                            bottom: 20,
                            right: 20,
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: 'var(--shadow-sm)',
                            cursor: 'pointer',
                            opacity: 0.7,
                            transition: 'opacity 0.2s',
                            '&:hover': { opacity: 1 },
                            zIndex: 10,
                        }}
                    />
                </Tooltip>
            )}
        </Box>
    );
};

export default ItemsList;
