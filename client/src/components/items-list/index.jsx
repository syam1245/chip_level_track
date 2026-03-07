import React, { useState, useMemo } from "react";
import {
    Box, Pagination, Snackbar, Alert,
    useMediaQuery, useTheme, Paper, Typography,
    Button, Chip, Tooltip,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";
import { useNotifications } from "../../hooks/useNotifications";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

import useItemsData from "./useItemsData";
import useItemsActions from "./useItemsActions";

import JobSheetPrintTemplate from "../JobSheetPrintTemplate";
import MobileCard from "../MobileCard";
import PullToRefresh from "../PullToRefresh";
import KeyboardShortcutsDialog from "../KeyboardShortcutsDialog";
import { ItemsListSkeleton } from "../Skeletons";

import ItemsListHeader from "./ItemsListHeader";
import ItemsListFilters from "./ItemsListFilters";
import ItemsTable from "./ItemsTable";
import EditJobDialog from "./EditJobDialog";
import DeleteJobDialog from "./DeleteJobDialog";
import BulkActionBar from "./BulkActionBar";
import SummaryDialog from "../AI/SummaryDialog";

const ItemsList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { notify } = useNotifications();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const isAdmin = user?.role === "admin";

    // ── Data hook — state, fetching, filters, pagination ───────────────
    const data = useItemsData({ isAdmin, user });

    // ── Actions hook — CRUD, print, whatsapp, bulk ─────────────────────
    const actions = useItemsActions({
        items: data.items,
        setItems: data.setItems,
        setSnackbar: data.setSnackbar,
        refetch: data.refetch,
        notify,
    });

    // ── Keyboard shortcuts ─────────────────────────────────────────────
    const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);
    const [focusedRowIndex, setFocusedRowIndex] = useState(-1);
    const [summaryDialogItem, setSummaryDialogItem] = useState(null);

    const handleOpenSummary = (item) => setSummaryDialogItem(item);

    const shortcuts = useMemo(() => ({
        "n": () => navigate("/"),
        "s": () => data.searchInputRef.current?.focus(),
        "/": () => data.searchInputRef.current?.focus(),
        "a": () => isAdmin && navigate("/admin"),
        "r": () => data.refetch(),
        "1": () => data.handleFilterChange("inProgress"),
        "2": () => data.handleFilterChange("ready"),
        "3": () => data.handleFilterChange("returned"),
        "4": () => data.handleFilterChange("all"),
        "f": () => { data.setSearch(""); data.setTechnicianFilter("All"); data.handleFilterChange("all"); },
        "ArrowDown": () => { if (data.items.length) setFocusedRowIndex((p) => Math.min(p + 1, data.items.length - 1)); },
        "ArrowUp": () => { if (data.items.length) setFocusedRowIndex((p) => Math.max(p - 1, 0)); },
        "Enter": () => { if (focusedRowIndex >= 0 && focusedRowIndex < data.items.length) actions.setEditItem(data.items[focusedRowIndex]); },
        " ": () => { if (focusedRowIndex >= 0 && focusedRowIndex < data.items.length) { const id = data.items[focusedRowIndex]._id; actions.onSelectChange(id, !actions.selectedIds.has(id)); } },
        "e": () => { if (focusedRowIndex >= 0 && focusedRowIndex < data.items.length) actions.setEditItem(data.items[focusedRowIndex]); },
        "w": () => { if (focusedRowIndex >= 0 && focusedRowIndex < data.items.length) actions.handleWhatsApp(data.items[focusedRowIndex]); },
        "p": () => { if (focusedRowIndex >= 0 && focusedRowIndex < data.items.length) actions.setPrintItem(data.items[focusedRowIndex]); },
        "d": () => { if (isAdmin && focusedRowIndex >= 0 && focusedRowIndex < data.items.length) actions.handleDelete(data.items[focusedRowIndex]._id); },
        "ArrowLeft": () => data.page > 1 && data.setPage((p) => p - 1),
        "[": () => data.page > 1 && data.setPage((p) => p - 1),
        "ArrowRight": () => data.page < data.totalPages && data.setPage((p) => p + 1),
        "]": () => data.page < data.totalPages && data.setPage((p) => p + 1),
        "Escape": () => {
            if (shortcutsDialogOpen) { setShortcutsDialogOpen(false); return; }
            if (actions.editItem) { actions.setEditItem(null); return; }
            if (summaryDialogItem) { setSummaryDialogItem(null); return; }
            if (actions.deleteConfirmId) { actions.setDeleteConfirmId(null); return; }
            if (actions.selectedIds.size > 0) { actions.clearSelection(); return; }
            if (data.search) { data.setSearch(""); return; }
            setFocusedRowIndex(-1);
        },
        "b": () => isAdmin && actions.downloadBackup(),
        "shift+?": () => setShortcutsDialogOpen(true),
    }), [navigate, isAdmin, data, actions, focusedRowIndex, shortcutsDialogOpen]);

    useKeyboardShortcuts(shortcuts, !isMobile);

    // Clear selection on page change
    React.useEffect(() => { actions.clearSelection(); }, [data.page, actions.clearSelection]);

    return (
        <Box sx={{ maxWidth: "1400px", margin: "0 auto", padding: isMobile ? 2 : 4, pb: 10 }}>
            <div style={{ display: "none" }}>
                <JobSheetPrintTemplate ref={actions.printComponentRef} item={actions.printItem} />
            </div>

            <ItemsListHeader isAdmin={isAdmin} downloadBackup={actions.downloadBackup} onNewJob={() => navigate("/")} />

            <ItemsListFilters
                stats={data.stats} activeFilter={data.activeFilter}
                handleFilterChange={data.handleFilterChange}
                search={data.search} setSearch={data.setSearch}
                loading={data.loading} searchInputRef={data.searchInputRef}
            />

            <AnimatePresence mode="wait">
                {data.loading && data.items.length === 0 ? (
                    <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                        <ItemsListSkeleton isMobile={isMobile} />
                    </motion.div>
                ) : data.items.length === 0 ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
                        <Paper className="glass-panel" sx={{
                            p: { xs: 5, md: 8 },
                            textAlign: "center",
                            borderRadius: "var(--radius)",
                            bgcolor: "var(--surface)",
                            position: "relative",
                            overflow: "hidden"
                        }}>
                            <Box sx={{
                                position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)",
                                width: 200, height: 200,
                                backgroundImage: "radial-gradient(circle, var(--color-primary-light) 0%, transparent 70%)",
                                opacity: 0.15, zIndex: 0, borderRadius: "50%", pointerEvents: "none"
                            }} />
                            <Box sx={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <Typography variant="h4" fontWeight="900" gutterBottom className="text-gradient">No Jobs Found</Typography>
                                <Typography color="text.secondary" sx={{ maxWidth: 400, mb: 4, lineHeight: 1.6 }}>Try adjusting your search filters, or there might not be any jobs matching this criteria yet.</Typography>
                                <Button
                                    size="large" variant="contained"
                                    onClick={() => { data.setSearch(""); data.setTechnicianFilter("All"); data.setActiveFilter("all"); }}
                                    sx={{ borderRadius: "12px", px: 4, py: 1.2, fontWeight: 700, boxShadow: "var(--shadow-md)" }}
                                >
                                    Clear All Filters
                                </Button>
                            </Box>
                        </Paper>
                    </motion.div>
                ) : isMobile ? (
                    <PullToRefresh onRefresh={async () => data.refetch()} disabled={data.loading}>
                        <Box sx={{ opacity: data.loading ? 0.6 : 1, transition: "opacity 0.2s", px: 0.5 }}>
                            {data.items.map((item, idx) => (
                                <motion.div key={item._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.3) }}>
                                    <MobileCard item={item} onWhatsApp={actions.handleWhatsApp} onAIGenerateWhatsApp={actions.handleAIGenerateWhatsApp} onPrint={actions.setPrintItem} onEdit={actions.setEditItem} onDelete={actions.handleDelete} canDelete={isAdmin} onOpenSummary={handleOpenSummary} />
                                </motion.div>
                            ))}
                        </Box>
                    </PullToRefresh>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <BulkActionBar
                            selectedCount={actions.selectedIds.size} bulkStatus={actions.bulkStatus}
                            setBulkStatus={actions.setBulkStatus} onApply={actions.handleBulkApply} onClear={actions.clearSelection}
                            isAdmin={isAdmin} onBulkDelete={actions.handleBulkDelete}
                        />
                        <ItemsTable
                            items={data.items} loading={data.loading}
                            sortBy={data.sortBy} sortOrder={data.sortOrder} handleSort={data.handleSort}
                            technicianFilter={data.technicianFilter} setTechnicianFilter={data.setTechnicianFilter}
                            setPage={data.setPage} techniciansList={data.techniciansList}
                            handleWhatsApp={actions.handleWhatsApp} handleAIGenerateWhatsApp={actions.handleAIGenerateWhatsApp} setPrintItem={actions.setPrintItem}
                            setEditItem={actions.setEditItem} handleDelete={actions.handleDelete}
                            selectedIds={actions.selectedIds} onSelectChange={actions.onSelectChange}
                            isAdmin={isAdmin} focusedRowIndex={focusedRowIndex} onOpenSummary={handleOpenSummary}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {data.totalPages > 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 4, gap: 3, flexWrap: "wrap" }}>
                    <Pagination
                        count={data.totalPages} page={data.page} onChange={data.handlePageChange}
                        color="primary" size={isMobile ? "small" : "large"}
                        showFirstButton={!isMobile} showLastButton={!isMobile}
                        sx={{ "& .MuiPaginationItem-root": { borderRadius: "10px", fontWeight: 700 } }}
                    />
                    {!isMobile && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: "0.75rem" }}>
                                Rows per page:
                            </Typography>
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                                {data.PAGE_SIZE_OPTIONS.map((size) => (
                                    <Chip key={size} label={size} size="small"
                                        variant={data.pageSize === size ? "filled" : "outlined"}
                                        color={data.pageSize === size ? "primary" : "default"}
                                        onClick={() => data.handlePageSizeChange(size)}
                                        sx={{ fontWeight: 700, fontSize: "0.72rem", height: 26, borderRadius: "8px", cursor: "pointer", minWidth: 38, transition: "all 0.15s" }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}
                </Box>
            )}

            <EditJobDialog editItem={actions.editItem} setEditItem={actions.setEditItem} handleEditSave={actions.handleEditSave} isAdmin={isAdmin} />
            <DeleteJobDialog deleteConfirmId={actions.deleteConfirmId} setDeleteConfirmId={actions.setDeleteConfirmId} confirmDelete={actions.confirmDelete} />
            <SummaryDialog open={!!summaryDialogItem} onClose={() => setSummaryDialogItem(null)} jobData={summaryDialogItem} />
            <KeyboardShortcutsDialog open={shortcutsDialogOpen} onClose={() => setShortcutsDialogOpen(false)} />

            <Snackbar open={data.snackbar.open} autoHideDuration={4000} onClose={data.handleCloseSnackbar} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert onClose={data.handleCloseSnackbar} severity={data.snackbar.severity} sx={{ width: "100%", borderRadius: "8px", boxShadow: "var(--shadow-md)" }}>
                    {data.snackbar.message}
                </Alert>
            </Snackbar>

            {!isMobile && (
                <Tooltip title="Press ? to see all keyboard shortcuts" placement="left">
                    <Chip label="? Shortcuts" size="small" onClick={() => setShortcutsDialogOpen(true)}
                        sx={{ position: "fixed", bottom: 20, right: 20, fontWeight: 700, fontSize: "0.7rem", bgcolor: "background.paper", border: "1px solid", borderColor: "divider", boxShadow: "var(--shadow-sm)", cursor: "pointer", opacity: 0.7, transition: "opacity 0.2s", "&:hover": { opacity: 1 }, zIndex: 10 }}
                    />
                </Tooltip>
            )}
        </Box>
    );
};

export default ItemsList;
