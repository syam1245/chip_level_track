import React, { useEffect, useState, useCallback, useRef } from "react";
import {
    Box,
    Pagination,
    Snackbar,
    Alert,
    useMediaQuery,
    useTheme,
    CircularProgress,
    Paper,
    Typography,
    Button
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";

import API_BASE_URL, { authFetch } from "../../api";
import { useAuth } from "../../auth/AuthContext";

import JobSheetPrintTemplate from "../JobSheetPrintTemplate";
import MobileCard from "../MobileCard";

import { generateWhatsAppMessage } from "../../utils/whatsapp";

import ItemsListHeader from "./ItemsListHeader";
import ItemsListFilters from "./ItemsListFilters";
import ItemsTable from "./ItemsTable";
import EditJobDialog from "./EditJobDialog";
import DeleteJobDialog from "./DeleteJobDialog";

const ItemsList = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        inProgress: 0,
        ready: 0,
        returned: 0
    });
    // Incrementing this counter causes the main fetchItems useEffect to re-run
    // without adding fetchItems to its deps — avoids fire-and-forget anti-pattern.
    const [dataVersion, setDataVersion] = useState(0);
    const refetch = useCallback(() => setDataVersion((v) => v + 1), []);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const LIMIT = 10;

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState("inProgress");

    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");
    // Debounced sort — prevents a new API request on every rapid column-header click
    const [debouncedSortBy, setDebouncedSortBy] = useState("createdAt");
    const [debouncedSortOrder, setDebouncedSortOrder] = useState("desc");

    const [technicianFilter, setTechnicianFilter] = useState("All");
    const [techniciansList, setTechniciansList] = useState([]);

    const [editItem, setEditItem] = useState(null);
    const [printItem, setPrintItem] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
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
        documentTitle: printItem ? `Receipt_${printItem.jobNumber}` : "Receipt",
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

        let url = `/api/items?page=${page}&limit=${LIMIT}&sortBy=${debouncedSortBy}&sortOrder=${debouncedSortOrder}`;
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
    }, [debouncedSearch, page, activeFilter, debouncedSortBy, debouncedSortOrder, technicianFilter, isAdmin]);

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

        try {
            const res = await authFetch(`/api/items/${editItem._id}`, {
                method: "PUT",
                body: JSON.stringify(editItem),
            });

            if (res.ok) {
                setSnackbar({ open: true, message: "Updated successfully", severity: "success" });
                setEditItem(null);
                refetch(); // Clean re-fetch via version counter
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
            />

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
                            <Button sx={{ mt: 3 }} variant="contained" onClick={() => {
                                setSearch("");
                                setTechnicianFilter("All");
                                setActiveFilter("all");
                            }}>Clear Filters</Button>
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
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {totalPages > 1 && (
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
