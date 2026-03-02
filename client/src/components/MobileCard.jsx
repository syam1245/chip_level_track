import React, { useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";
import {
    Card,
    CardContent,
    Box,
    Typography,
    Chip,
    IconButton,
    Tooltip,
} from "@mui/material";
import {
    WhatsApp as WhatsAppIcon,
    Print as PrintIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Devices as DeviceIcon,
    Notes as NotesIcon,
    Phone as PhoneIcon,
    Person as PersonIcon,
    CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import { STATUS_COLORS, STATUS_ACCENT } from "../constants/status";
import { formatDate } from "../utils/date";
import { getAgingInfo, formatAge } from "../utils/aging";

const SWIPE_THRESHOLD = 80;  // px needed to lock actions open
const ACTION_WIDTH = 165;     // width of the revealed action panel

const MobileCard = React.memo(({ item, onWhatsApp, onPrint, onEdit, onDelete, canDelete }) => {
    const aging = getAgingInfo(item);
    const [isOpen, setIsOpen] = useState(false);
    const x = useMotionValue(0);
    const controls = useAnimation();

    // Reveal bg opacity based on drag distance
    const actionOpacity = useTransform(x, [-ACTION_WIDTH, -30, 0], [1, 0.5, 0]);

    const handleDragEnd = useCallback((_, info) => {
        const offsetX = info.offset.x;
        if (offsetX < -SWIPE_THRESHOLD && !isOpen) {
            // Swipe left — reveal actions
            controls.start({ x: -ACTION_WIDTH, transition: { type: "spring", stiffness: 500, damping: 35 } });
            setIsOpen(true);
        } else {
            // Snap back
            controls.start({ x: 0, transition: { type: "spring", stiffness: 500, damping: 35 } });
            setIsOpen(false);
        }
    }, [isOpen, controls]);

    const closeActions = useCallback(() => {
        controls.start({ x: 0, transition: { type: "spring", stiffness: 500, damping: 35 } });
        setIsOpen(false);
    }, [controls]);

    const handleAction = useCallback((fn) => () => {
        closeActions();
        fn(item);
    }, [closeActions, item]);

    const handleDeleteAction = useCallback(() => {
        closeActions();
        onDelete(item._id);
    }, [closeActions, onDelete, item._id]);

    return (
        <Box sx={{ position: "relative", mb: 1.5, overflow: "hidden", borderRadius: "var(--radius)" }}>
            {/* ── Swipe-reveal actions (behind the card) ───────────────── */}
            <motion.div
                style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: ACTION_WIDTH,
                    display: "flex",
                    alignItems: "stretch",
                    opacity: actionOpacity,
                    zIndex: 0,
                    borderRadius: "0 var(--radius) var(--radius) 0",
                    overflow: "hidden",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-evenly",
                        width: "100%",
                        gap: 0.5,
                        px: 1,
                        background: "linear-gradient(90deg, transparent 0%, rgba(30,41,59,0.95) 25%)",
                    }}
                >
                    <Tooltip title="WhatsApp" placement="top">
                        <IconButton
                            onClick={handleAction(onWhatsApp)}
                            sx={{
                                color: "#fff",
                                bgcolor: "#25D366",
                                width: 44,
                                height: 44,
                                "&:hover": { bgcolor: "#1da851" },
                                "&:active": { transform: "scale(0.9)" },
                            }}
                        >
                            <WhatsAppIcon sx={{ fontSize: "1.25rem" }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit" placement="top">
                        <IconButton
                            onClick={handleAction(onEdit)}
                            sx={{
                                color: "#fff",
                                bgcolor: "#3b82f6",
                                width: 44,
                                height: 44,
                                "&:hover": { bgcolor: "#2563eb" },
                                "&:active": { transform: "scale(0.9)" },
                            }}
                        >
                            <EditIcon sx={{ fontSize: "1.25rem" }} />
                        </IconButton>
                    </Tooltip>
                    {canDelete && (
                        <Tooltip title="Delete" placement="top">
                            <IconButton
                                onClick={handleDeleteAction}
                                sx={{
                                    color: "#fff",
                                    bgcolor: "#ef4444",
                                    width: 44,
                                    height: 44,
                                    "&:hover": { bgcolor: "#dc2626" },
                                    "&:active": { transform: "scale(0.9)" },
                                }}
                            >
                                <DeleteIcon sx={{ fontSize: "1.25rem" }} />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </motion.div>

            {/* ── Main card (draggable) ─────────────────────────────── */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -ACTION_WIDTH, right: 0 }}
                dragElastic={0.15}
                onDragEnd={handleDragEnd}
                animate={controls}
                style={{ x, position: "relative", zIndex: 1, touchAction: "pan-y" }}
            >
                <Card
                    elevation={0}
                    sx={{
                        borderRadius: "var(--radius)",
                        boxShadow: "var(--shadow-sm)",
                        border: aging.isAging ? `1px solid ${aging.color}40` : "1px solid var(--border)",
                        overflow: "hidden",
                        position: "relative",
                        userSelect: "none",
                    }}
                >
                    {/* Status accent bar */}
                    <Box
                        sx={{
                            height: "4px",
                            background: aging.isAging
                                ? aging.color
                                : STATUS_ACCENT[item.status] || "#94a3b8",
                        }}
                    />

                    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                        {/* ── Row 1: Job number + Aging + Status ────────────── */}
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                            <Box display="flex" alignItems="center" gap={0.75}>
                                <Typography
                                    variant="caption"
                                    fontWeight="900"
                                    sx={{
                                        color: "primary.main",
                                        letterSpacing: "0.05em",
                                        bgcolor: "primary.light",
                                        px: 1.2,
                                        py: 0.5,
                                        borderRadius: 1.5,
                                        fontSize: "0.75rem",
                                    }}
                                >
                                    #{item.jobNumber}
                                </Typography>
                                {aging.isAging && (
                                    <Box
                                        component="span"
                                        sx={{
                                            px: 0.8,
                                            py: 0.2,
                                            borderRadius: "6px",
                                            fontSize: "0.6rem",
                                            fontWeight: 800,
                                            color: aging.color,
                                            bgcolor: `${aging.color}18`,
                                            border: `1px solid ${aging.color}30`,
                                            animation:
                                                aging.tier === "critical"
                                                    ? "agingPulse 2.5s ease-in-out infinite"
                                                    : "none",
                                            "@keyframes agingPulse": {
                                                "0%, 100%": { boxShadow: `0 0 0 0 ${aging.color}00` },
                                                "50%": { boxShadow: `0 0 6px 2px ${aging.color}35` },
                                            },
                                        }}
                                    >
                                        {formatAge(aging.ageDays)}
                                    </Box>
                                )}
                            </Box>
                            <Chip
                                label={item.status || "Received"}
                                color={STATUS_COLORS[item.status] || "default"}
                                size="small"
                                sx={{
                                    fontWeight: 800,
                                    borderRadius: "8px",
                                    fontSize: "0.7rem",
                                    height: 24,
                                    px: 0.5,
                                }}
                            />
                        </Box>

                        {/* ── Row 2: Customer name + Brand ──────────────────── */}
                        <Box mb={1.5}>
                            <Typography
                                variant="body1"
                                fontWeight="800"
                                sx={{ lineHeight: 1.2, mb: 0.5, fontSize: "1rem" }}
                            >
                                {item.customerName}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={0.75}>
                                <DeviceIcon sx={{ fontSize: 15, color: "text.secondary" }} />
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    fontWeight="600"
                                    sx={{ fontSize: "0.85rem" }}
                                >
                                    {item.brand}
                                </Typography>
                            </Box>
                            {item.issue && (
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        display: "block",
                                        mt: 0.5,
                                        fontStyle: "italic",
                                        fontSize: "0.75rem",
                                    }}
                                >
                                    Issue: {item.issue}
                                </Typography>
                            )}
                        </Box>

                        {/* ── Row 3: Info chips — phone, tech, date, cost ──── */}
                        <Box
                            sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 0.75,
                                mb: item.repairNotes ? 1.5 : 0,
                            }}
                        >
                            <Box
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    bgcolor: "action.hover",
                                    borderRadius: "8px",
                                    px: 1,
                                    py: 0.5,
                                    minHeight: 32,
                                }}
                            >
                                <PhoneIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                                <Typography variant="caption" fontWeight="700" sx={{ fontSize: "0.78rem" }}>
                                    {item.phoneNumber}
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    bgcolor: "action.hover",
                                    borderRadius: "8px",
                                    px: 1,
                                    py: 0.5,
                                    minHeight: 32,
                                }}
                            >
                                <PersonIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                                <Typography variant="caption" fontWeight="700" sx={{ fontSize: "0.75rem" }}>
                                    {item.technicianName}
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    bgcolor: "action.hover",
                                    borderRadius: "8px",
                                    px: 1,
                                    py: 0.5,
                                    minHeight: 32,
                                }}
                            >
                                <CalendarIcon sx={{ fontSize: 13, color: "text.secondary" }} />
                                <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ fontSize: "0.72rem" }}>
                                    {formatDate(item.createdAt)}
                                </Typography>
                            </Box>
                            {(item.finalCost > 0 || item.cost > 0) && (
                                <Box
                                    sx={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 0.3,
                                        bgcolor: item.finalCost > 0 ? "success.light" : "action.hover",
                                        borderRadius: "8px",
                                        px: 1,
                                        py: 0.5,
                                        minHeight: 32,
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        fontWeight="900"
                                        sx={{
                                            fontSize: "0.8rem",
                                            color: item.finalCost > 0 ? "success.main" : "text.secondary",
                                        }}
                                    >
                                        ₹{item.finalCost > 0 ? item.finalCost : item.cost}
                                    </Typography>
                                    {item.finalCost > 0 && (
                                        <Typography
                                            variant="caption"
                                            sx={{ fontSize: "0.55rem", color: "success.dark", fontWeight: 700 }}
                                        >
                                            FINAL
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </Box>

                        {/* ── Repair Notes ──────────────────────────────────── */}
                        {item.repairNotes && (
                            <Box
                                sx={{
                                    p: 1.2,
                                    bgcolor: "action.hover",
                                    borderRadius: "10px",
                                    borderLeft: "3px solid var(--color-primary)",
                                    display: "flex",
                                    gap: 0.75,
                                    alignItems: "flex-start",
                                }}
                            >
                                <NotesIcon
                                    sx={{
                                        fontSize: "0.95rem",
                                        color: "var(--color-primary)",
                                        mt: "2px",
                                        flexShrink: 0,
                                    }}
                                />
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        lineHeight: 1.6,
                                        display: "-webkit-box",
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                        fontStyle: "italic",
                                        fontSize: "0.76rem",
                                    }}
                                >
                                    {item.repairNotes}
                                </Typography>
                            </Box>
                        )}

                        {/* ── Quick actions row (always visible — tap-friendly) ── */}
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mt: 1.5,
                                pt: 1.5,
                                borderTop: "1px solid",
                                borderColor: "divider",
                            }}
                        >
                            {/* Swipe hint */}
                            <Typography
                                variant="caption"
                                color="text.disabled"
                                sx={{ fontSize: "0.6rem", fontStyle: "italic", userSelect: "none" }}
                            >
                                ← swipe for more
                            </Typography>

                            {/* Primary quick actions */}
                            <Box display="flex" gap={1}>
                                <IconButton
                                    onClick={() => onWhatsApp(item)}
                                    size="medium"
                                    sx={{
                                        color: "#fff",
                                        bgcolor: "#25D366",
                                        width: 40,
                                        height: 40,
                                        "&:hover": { bgcolor: "#1da851" },
                                        "&:active": { transform: "scale(0.92)" },
                                        transition: "transform 0.1s",
                                    }}
                                >
                                    <WhatsAppIcon sx={{ fontSize: "1.15rem" }} />
                                </IconButton>
                                <IconButton
                                    onClick={() => onPrint(item)}
                                    size="medium"
                                    sx={{
                                        color: "text.secondary",
                                        bgcolor: "action.selected",
                                        width: 40,
                                        height: 40,
                                        "&:hover": { bgcolor: "action.hover" },
                                        "&:active": { transform: "scale(0.92)" },
                                        transition: "transform 0.1s",
                                    }}
                                >
                                    <PrintIcon sx={{ fontSize: "1.15rem" }} />
                                </IconButton>
                                <IconButton
                                    onClick={() => onEdit(item)}
                                    size="medium"
                                    sx={{
                                        color: "#fff",
                                        bgcolor: "primary.main",
                                        width: 40,
                                        height: 40,
                                        "&:hover": { bgcolor: "primary.dark" },
                                        "&:active": { transform: "scale(0.92)" },
                                        transition: "transform 0.1s",
                                    }}
                                >
                                    <EditIcon sx={{ fontSize: "1.15rem" }} />
                                </IconButton>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </motion.div>
        </Box>
    );
});

export default MobileCard;
