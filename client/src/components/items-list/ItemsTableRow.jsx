import React, { useState } from "react";
import {
    TableRow, TableCell, Typography, Box,
    Chip, IconButton, Tooltip, Stack, Checkbox, Menu, MenuItem, ListItemIcon, ListItemText
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PrintIcon from "@mui/icons-material/Print";
import NotesIcon from "@mui/icons-material/Notes";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SummarizeIcon from "@mui/icons-material/Summarize";
import ChatIcon from "@mui/icons-material/ChatBubbleOutline";
import CircularProgress from "@mui/material/CircularProgress";
import { motion } from "framer-motion";
import { STATUS_COLORS } from "../../constants/status";
import { formatAge, getAgingInfo } from "../../utils/aging";
import { formatDate } from "../../utils/date";

const ItemsTableRow = ({
    item, rowIdx, focusedRowIndex, selectedIds,
    onSelectChange, handleWhatsApp, handleAIGenerateWhatsApp, setPrintItem, setEditItem, handleDelete,
    onOpenSummary
}) => {
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [aiAnchorEl, setAiAnchorEl] = useState(null);

    const handleAIMenuOpen = (event) => {
        setAiAnchorEl(event.currentTarget);
    };

    const handleAIMenuClose = () => {
        setAiAnchorEl(null);
    };

    const handleAIGenerate = async () => {
        handleAIMenuClose();
        setIsGeneratingAI(true);
        try {
            await handleAIGenerateWhatsApp(item);
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleOpenSummary = () => {
        handleAIMenuClose();
        onOpenSummary(item);
    };

    const aging = getAgingInfo(item);
    const isFocused = rowIdx === focusedRowIndex;
    const isSelected = selectedIds.has(item._id);

    return (
        <TableRow
            selected={isSelected}
            sx={{
                "&:last-child td, &:last-child th": { border: 0 },
                bgcolor: aging.tier === "critical" ? "rgba(239,68,68,0.06)"
                    : aging.tier === "overdue" ? "rgba(249,115,22,0.05)"
                        : isSelected ? "action.selected" : "background.paper",
                borderLeft: aging.isAging ? `3px solid ${aging.color}` : "3px solid transparent",
                transition: "all 0.2s ease-in-out",
                outline: isFocused ? "2px solid" : "none",
                outlineColor: isFocused ? "primary.main" : "transparent",
                outlineOffset: "-2px",
                position: "relative",
                zIndex: isFocused ? 1 : 0,
                "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                    zIndex: 2,
                    bgcolor: aging.tier === "critical" ? "rgba(239,68,68,0.12)"
                        : aging.tier === "overdue" ? "rgba(249,115,22,0.1)"
                            : isSelected ? "action.selected" : "action.hover",
                }
            }}
        >
            <TableCell padding="checkbox" sx={{ pl: 2 }}>
                <Checkbox size="small" checked={isSelected} onChange={(e) => onSelectChange(item._id, e.target.checked)} />
            </TableCell>

            {/* Job # + date + aging badge */}
            <TableCell align="left">
                <Typography fontWeight="600" color="primary">{item.jobNumber}</Typography>
                <Typography variant="caption" color="text.secondary">{formatDate(item.createdAt)}</Typography>
                {aging.isAging && (
                    <Tooltip title={`${aging.label} — ${aging.ageDays} day${aging.ageDays !== 1 ? "s" : ""} since received`} arrow placement="right">
                        <Box component="span" sx={{
                            display: "inline-flex", alignItems: "center", gap: 0.4,
                            ml: 0.8, px: 0.8, py: 0.1, borderRadius: "6px",
                            fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.03em",
                            color: aging.color, bgcolor: `${aging.color}18`, border: `1px solid ${aging.color}30`,
                            animation: aging.tier === "critical" ? "agingPulse 2.5s ease-in-out infinite" : "none",
                            verticalAlign: "middle", cursor: "default",
                            "@keyframes agingPulse": {
                                "0%, 100%": { boxShadow: `0 0 0 0 ${aging.color}00` },
                                "50%": { boxShadow: `0 0 8px 2px ${aging.color}35` },
                            },
                        }}>
                            {formatAge(aging.ageDays)}
                        </Box>
                    </Tooltip>
                )}
            </TableCell>

            <TableCell><Typography fontWeight="bold">{item.customerName}</Typography></TableCell>
            <TableCell>{item.brand}</TableCell>
            <TableCell><Typography variant="body2" fontWeight="600">{item.technicianName}</Typography></TableCell>
            <TableCell>
                <Box component="a" href={`tel:${item.phoneNumber}`} sx={{ textDecoration: "none", color: "inherit", '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}>
                    {item.phoneNumber}
                </Box>
            </TableCell>

            <TableCell>
                {item.finalCost > 0 ? (
                    <Box>
                        <Typography variant="body2" fontWeight="700" color="success.main">₹{item.finalCost}</Typography>
                        <Typography variant="caption" sx={{ fontSize: "0.65rem", color: "success.dark", bgcolor: "success.light", px: 0.8, py: 0.2, borderRadius: 1 }}>FINAL</Typography>
                    </Box>
                ) : (
                    <Typography variant="body2" fontWeight="700" color="text.secondary">—</Typography>
                )}
            </TableCell>

            {/* Status chip */}
            <TableCell>
                <Chip label={item.status || "Received"} color={STATUS_COLORS[item.status] || "default"} size="small"
                    sx={{ borderRadius: "6px", fontWeight: 600, fontSize: "0.75rem", height: "24px" }} />
            </TableCell>

            {/* Repair notes */}
            <TableCell sx={{ maxWidth: 220 }}>
                {item.repairNotes ? (
                    <Box sx={{ p: "6px 10px", bgcolor: "action.hover", borderRadius: "6px", borderLeft: "3px solid var(--color-primary)", display: "flex", gap: 0.75, alignItems: "flex-start" }}>
                        <NotesIcon sx={{ fontSize: "0.85rem", color: "var(--color-primary)", mt: "2px", flexShrink: 0 }} />
                        <Typography variant="caption" color="text.secondary"
                            sx={{ lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontStyle: "italic" }}>
                            {item.repairNotes}
                        </Typography>
                    </Box>
                ) : (
                    <Typography variant="caption" color="text.disabled">—</Typography>
                )}
            </TableCell>

            {/* Action buttons */}
            <TableCell align="right">
                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    <Tooltip title="AI Actions">
                        <span>
                            <IconButton size="small" onClick={handleAIMenuOpen} disabled={isGeneratingAI} sx={{ color: "var(--color-primary)", bgcolor: "var(--color-primary-light)", "&:hover": { bgcolor: "var(--color-primary)", color: "#fff" } }}>
                                {isGeneratingAI ? (
                                    <motion.div
                                        animate={{
                                            rotate: [0, 15, -15, 15, 0],
                                            scale: [1, 1.3, 1],
                                        }}
                                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                                        style={{ display: "flex" }}
                                    >
                                        <AutoAwesomeIcon fontSize="small" />
                                    </motion.div>
                                ) : (
                                    <AutoAwesomeIcon fontSize="small" />
                                )}
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title="Direct WhatsApp">
                        <IconButton size="small" onClick={() => handleWhatsApp(item)} sx={{ color: "success.main", bgcolor: "success.light", "&:hover": { bgcolor: "success.main", color: "success.contrastText" } }}>
                            <WhatsAppIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Print">
                        <IconButton size="small" onClick={() => setPrintItem(item)} sx={{ color: "text.secondary", bgcolor: "action.selected", "&:hover": { bgcolor: "action.hover", color: "text.primary" } }}>
                            <PrintIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => setEditItem(item)} sx={{ color: "primary.main", bgcolor: "primary.light", "&:hover": { bgcolor: "primary.main", color: "primary.contrastText" } }}>
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(item._id)} sx={{ color: "error.main", bgcolor: "error.light", "&:hover": { bgcolor: "error.main", color: "error.contrastText" } }}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>

                <Menu
                    anchorEl={aiAnchorEl}
                    open={Boolean(aiAnchorEl)}
                    onClose={handleAIMenuClose}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    PaperProps={{
                        sx: {
                            borderRadius: "12px",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                            border: "1px solid rgba(139, 92, 246, 0.2)",
                            mt: 1
                        }
                    }}
                >
                    <MenuItem onClick={handleOpenSummary} sx={{ py: 1, px: 2 }}>
                        <ListItemIcon>
                            <SummarizeIcon sx={{ color: "#8b5cf6", fontSize: "1.2rem" }} />
                        </ListItemIcon>
                        <ListItemText
                            primary="Summarize Case"
                            secondary="Quick repair TL;DR"
                            secondaryTypographyProps={{ fontSize: "0.7rem" }}
                        />
                    </MenuItem>
                    <MenuItem onClick={handleAIGenerate} sx={{ py: 1, px: 2 }}>
                        <ListItemIcon>
                            <ChatIcon sx={{ color: "#ec4899", fontSize: "1.2rem" }} />
                        </ListItemIcon>
                        <ListItemText
                            primary="Draft WhatsApp"
                            secondary="Smart message generation"
                            secondaryTypographyProps={{ fontSize: "0.7rem" }}
                        />
                    </MenuItem>
                </Menu>

            </TableCell>
        </TableRow>
    );
};

export default React.memo(ItemsTableRow);
