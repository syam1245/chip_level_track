import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
    Box, Dialog, InputBase, Typography, List, ListItemButton,
    ListItemIcon, ListItemText, Chip, Divider, useTheme,
} from "@mui/material";
import {
    Add as AddIcon,
    FormatListBulleted as ListIcon,
    Dashboard as AdminIcon,
    Download as BackupIcon,
    Brightness4 as DarkIcon,
    Brightness7 as LightIcon,
    Search as SearchIcon,
    ArrowForward as ArrowIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const ACTIONS = [
    { id: "new", label: "New Repair Job", description: "Open the job intake form", icon: <AddIcon />, color: "#3b82f6", shortcut: "N" },
    { id: "list", label: "Repair List", description: "View all repair jobs", icon: <ListIcon />, color: "#10b981", shortcut: "L" },
    { id: "admin", label: "Admin Panel", description: "Revenue, audit trail & technicians", icon: <AdminIcon />, color: "#8b5cf6", adminOnly: true },
    { id: "backup", label: "Download Backup", description: "Export all jobs as JSON", icon: <BackupIcon />, color: "#f59e0b", adminOnly: true },
    { id: "theme", label: "Toggle Theme", description: "Switch dark / light mode", icon: null, color: "#94a3b8" },
];

const CommandPalette = ({ open, onClose, toggleTheme, mode, items = [], onDownloadBackup }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    const [query, setQuery] = useState("");
    const [activeIdx, setActiveIdx] = useState(0);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setQuery("");
            setActiveIdx(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    // Build the results list
    const results = useMemo(() => {
        const q = query.toLowerCase().trim();

        // Recent items section (top 6 matching jobs)
        const matchingItems = items
            .filter((item) =>
                !q ||
                item.jobNumber?.toLowerCase().includes(q) ||
                item.customerName?.toLowerCase().includes(q) ||
                item.brand?.toLowerCase().includes(q) ||
                item.phoneNumber?.includes(q)
            )
            .slice(0, 6)
            .map((item) => ({
                id: `job-${item._id}`,
                label: `${item.jobNumber} — ${item.customerName}`,
                description: `${item.brand} · ${item.status}`,
                icon: <SearchIcon />,
                color: "#3b82f6",
                action: () => { /* handled in onSelect */ },
                _raw: item,
            }));

        // Actions section
        const matchingActions = ACTIONS
            .filter((a) => !a.adminOnly || isAdmin)
            .filter((a) =>
                !q ||
                a.label.toLowerCase().includes(q) ||
                a.description.toLowerCase().includes(q)
            );

        return { items: matchingItems, actions: matchingActions };
    }, [query, items, isAdmin]);

    const flatList = useMemo(() => [...results.items, ...results.actions], [results]);

    const onSelect = useCallback((entry) => {
        onClose();
        if (entry._raw) {
            // It's a job — navigate to /items and could trigger edit (future enhancement)
            navigate("/items");
            return;
        }
        switch (entry.id) {
            case "new": navigate("/"); break;
            case "list": navigate("/items"); break;
            case "admin": navigate("/admin"); break;
            case "backup": onDownloadBackup?.(); break;
            case "theme": toggleTheme(); break;
            default: break;
        }
    }, [navigate, onClose, toggleTheme, onDownloadBackup]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((i) => Math.min(i + 1, flatList.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (flatList[activeIdx]) onSelect(flatList[activeIdx]);
        }
    }, [flatList, activeIdx, onSelect]);

    // Reset active index when list changes
    useEffect(() => setActiveIdx(0), [query]);

    const isDark = theme.palette.mode === "dark";
    const ThemeIcon = mode === "dark" ? <LightIcon /> : <DarkIcon />;

    const renderItem = (entry, idx, globalIdx) => {
        const icon = entry.id === "theme" ? ThemeIcon : entry.icon;
        const isActive = globalIdx === activeIdx;
        return (
            <ListItemButton
                key={entry.id}
                onClick={() => onSelect(entry)}
                onMouseEnter={() => setActiveIdx(globalIdx)}
                selected={isActive}
                sx={{
                    borderRadius: "10px",
                    mx: 0.5,
                    py: 1,
                    transition: "all 0.15s",
                    "&.Mui-selected": {
                        bgcolor: alpha(entry.color, 0.1),
                        "&:hover": { bgcolor: alpha(entry.color, 0.14) },
                    },
                }}
            >
                <ListItemIcon sx={{ minWidth: 36 }}>
                    <Box sx={{
                        width: 28, height: 28, borderRadius: "8px",
                        bgcolor: alpha(entry.color, 0.15),
                        color: entry.color,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        "& svg": { fontSize: "1rem" }
                    }}>
                        {icon}
                    </Box>
                </ListItemIcon>
                <ListItemText
                    primary={<Typography variant="body2" fontWeight={700} sx={{ fontSize: "0.85rem" }}>{entry.label}</Typography>}
                    secondary={<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>{entry.description}</Typography>}
                />
                {entry.shortcut && (
                    <Chip label={entry.shortcut} size="small" sx={{ height: 20, fontSize: "0.62rem", fontWeight: 700, bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", ml: 1 }} />
                )}
                {isActive && <ArrowIcon sx={{ fontSize: "0.9rem", color: entry.color, ml: 0.5 }} />}
            </ListItemButton>
        );
    };

    let globalIdx = 0;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                elevation: 0,
                sx: {
                    borderRadius: "20px",
                    overflow: "hidden",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
                    boxShadow: isDark ? "0 32px 80px rgba(0,0,0,0.7)" : "0 32px 80px rgba(0,0,0,0.18)",
                    bgcolor: isDark ? "#1e293b" : "#ffffff",
                    maxHeight: "70vh",
                }
            }}
            slotProps={{
                backdrop: { sx: { backdropFilter: "blur(8px)", bgcolor: isDark ? "rgba(0,0,0,0.65)" : "rgba(15,23,42,0.35)" } }
            }}
        >
            {/* Search input */}
            <Box sx={{
                display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.5,
                borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "#f1f5f9"}`
            }}>
                <SearchIcon sx={{ color: "text.secondary", flexShrink: 0 }} />
                <InputBase
                    inputRef={inputRef}
                    fullWidth
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search jobs, or run a command…"
                    sx={{ fontSize: "1rem", fontWeight: 500, "& input": { p: 0 } }}
                />
                <Chip label="Esc" size="small" sx={{ height: 20, fontSize: "0.62rem", fontWeight: 700, flexShrink: 0, bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }} />
            </Box>

            {/* Results */}
            <Box ref={listRef} sx={{ overflowY: "auto", maxHeight: "calc(70vh - 64px)", py: 1 }}>
                <AnimatePresence mode="wait">
                    {flatList.length === 0 ? (
                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <Typography color="text.secondary" textAlign="center" py={4} variant="body2">
                                No results for "{query}"
                            </Typography>
                        </motion.div>
                    ) : (
                        <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
                            {results.items.length > 0 && (
                                <>
                                    <Typography variant="caption" sx={{ px: 2, py: 0.5, display: "block", fontWeight: 700, textTransform: "uppercase", color: "text.disabled", fontSize: "0.62rem", letterSpacing: "0.08em" }}>
                                        Recent Jobs
                                    </Typography>
                                    <List dense disablePadding>
                                        {results.items.map((entry) => renderItem(entry, globalIdx, globalIdx++))}
                                    </List>
                                    {results.actions.length > 0 && <Divider sx={{ my: 1, mx: 2 }} />}
                                </>
                            )}

                            {results.actions.length > 0 && (
                                <>
                                    <Typography variant="caption" sx={{ px: 2, py: 0.5, display: "block", fontWeight: 700, textTransform: "uppercase", color: "text.disabled", fontSize: "0.62rem", letterSpacing: "0.08em" }}>
                                        Actions
                                    </Typography>
                                    <List dense disablePadding>
                                        {results.actions.map((entry) => renderItem(entry, globalIdx, globalIdx++))}
                                    </List>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </Box>

            {/* Footer hint */}
            <Box sx={{
                borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"}`,
                px: 2, py: 1, display: "flex", gap: 2, alignItems: "center"
            }}>
                {[["↑↓", "Navigate"], ["↵", "Select"], ["Esc", "Close"]].map(([key, desc]) => (
                    <Box key={key} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Chip label={key} size="small" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700, bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }} />
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem" }}>{desc}</Typography>
                    </Box>
                ))}
            </Box>
        </Dialog>
    );
};

export default CommandPalette;
