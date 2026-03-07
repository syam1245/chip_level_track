import React from "react";
import {
    CardContent, Box, Typography, Chip, IconButton,
} from "@mui/material";
import {
    WhatsApp as WhatsAppIcon,
    Print as PrintIcon,
    Edit as EditIcon,
    Devices as DeviceIcon,
    Notes as NotesIcon,
    Phone as PhoneIcon,
    Person as PersonIcon,
    CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import { STATUS_COLORS } from "../constants/status";
import { formatDate } from "../utils/date";
import { formatAge } from "../utils/aging";
import SummaryWidget from "./AI/SummaryWidget";

const MobileCardContent = ({ item, aging, onWhatsApp, onPrint, onEdit }) => {
    return (
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            {/* ── Row 1: Job number + Aging + Status ────────────── */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Box display="flex" alignItems="center" gap={0.75}>
                    <Typography
                        variant="caption"
                        fontWeight="900"
                        sx={{ color: "primary.main", letterSpacing: "0.05em", bgcolor: "primary.light", px: 1.2, py: 0.5, borderRadius: 1.5, fontSize: "0.75rem" }}
                    >
                        #{item.jobNumber}
                    </Typography>
                    {aging.isAging && (
                        <Box
                            component="span"
                            sx={{
                                px: 0.8, py: 0.2, borderRadius: "6px", fontSize: "0.6rem", fontWeight: 800,
                                color: aging.color, bgcolor: `${aging.color}18`, border: `1px solid ${aging.color}30`,
                                animation: aging.tier === "critical" ? "agingPulse 2.5s ease-in-out infinite" : "none",
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
                    sx={{ fontWeight: 800, borderRadius: "8px", fontSize: "0.7rem", height: 24, px: 0.5 }}
                />
            </Box>

            {/* ── Row 2: Customer name + Brand ──────────────────── */}
            <Box mb={1.5}>
                <Typography variant="body1" fontWeight="800" sx={{ lineHeight: 1.2, mb: 0.5, fontSize: "1rem" }}>
                    {item.customerName}
                </Typography>
                <Box display="flex" alignItems="center" gap={0.75}>
                    <DeviceIcon sx={{ fontSize: 15, color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary" fontWeight="600" sx={{ fontSize: "0.85rem" }}>
                        {item.brand}
                    </Typography>
                </Box>
                {item.issue && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, fontStyle: "italic", fontSize: "0.75rem" }}>
                        Issue: {item.issue}
                    </Typography>
                )}
            </Box>

            {/* ── Row 3: Info chips — phone, tech, date, cost ──── */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: item.repairNotes ? 1.5 : 0 }}>
                <Box component="a" href={`tel:${item.phoneNumber}`} sx={{ textDecoration: "none", color: "inherit", display: "inline-flex", alignItems: "center", gap: 0.5, bgcolor: "action.hover", borderRadius: "8px", px: 1, py: 0.5, minHeight: 32, cursor: "pointer", '&:hover': { bgcolor: 'action.selected' } }}>
                    <PhoneIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                    <Typography variant="caption" fontWeight="700" sx={{ fontSize: "0.78rem" }}>{item.phoneNumber}</Typography>
                </Box>
                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, bgcolor: "action.hover", borderRadius: "8px", px: 1, py: 0.5, minHeight: 32 }}>
                    <PersonIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                    <Typography variant="caption" fontWeight="700" sx={{ fontSize: "0.75rem" }}>{item.technicianName}</Typography>
                </Box>
                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, bgcolor: "action.hover", borderRadius: "8px", px: 1, py: 0.5, minHeight: 32 }}>
                    <CalendarIcon sx={{ fontSize: 13, color: "text.secondary" }} />
                    <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ fontSize: "0.72rem" }}>{formatDate(item.createdAt)}</Typography>
                </Box>

                {item.finalCost > 0 && (
                    <Box sx={{
                        display: "inline-flex", alignItems: "center", gap: 0.3,
                        bgcolor: "success.light",
                        borderRadius: "8px", px: 1, py: 0.5, minHeight: 32
                    }}>
                        <Typography variant="caption" fontWeight="900" sx={{ fontSize: "0.8rem", color: "success.main" }}>
                            ₹{item.finalCost}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: "0.55rem", color: "success.dark", fontWeight: 700 }}>FINAL</Typography>
                    </Box>
                )}
            </Box>

            {/* ── Repair Notes ──────────────────────────────────── */}
            {item.repairNotes && (
                <Box sx={{ p: 1.2, bgcolor: "action.hover", borderRadius: "10px", borderLeft: "3px solid var(--color-primary)", display: "flex", gap: 0.75, alignItems: "flex-start" }}>
                    <NotesIcon sx={{ fontSize: "0.95rem", color: "var(--color-primary)", mt: "2px", flexShrink: 0 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", fontStyle: "italic", fontSize: "0.76rem" }}>
                        {item.repairNotes}
                    </Typography>
                </Box>
            )}

            {/* ── AI Co-Pilot Summary ───────────────────────────── */}
            {item.repairNotes && item.repairNotes.length > 20 && (
                <SummaryWidget jobData={item} />
            )}

            {/* ── Quick actions row (always visible — tap-friendly) ── */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1.5, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.6rem", fontStyle: "italic", userSelect: "none" }}>← swipe for more</Typography>
                <Box display="flex" gap={1}>
                    <IconButton
                        onClick={() => onWhatsApp(item)} size="medium"
                        sx={{ color: "#fff", bgcolor: "#25D366", width: 40, height: 40, "&:hover": { bgcolor: "#1da851" }, "&:active": { transform: "scale(0.92)" }, transition: "transform 0.1s" }}
                    >
                        <WhatsAppIcon sx={{ fontSize: "1.15rem" }} />
                    </IconButton>
                    <IconButton
                        onClick={() => onPrint(item)} size="medium"
                        sx={{ color: "text.secondary", bgcolor: "action.selected", width: 40, height: 40, "&:hover": { bgcolor: "action.hover" }, "&:active": { transform: "scale(0.92)" }, transition: "transform 0.1s" }}
                    >
                        <PrintIcon sx={{ fontSize: "1.15rem" }} />
                    </IconButton>
                    <IconButton
                        onClick={() => onEdit(item)} size="medium"
                        sx={{ color: "#fff", bgcolor: "primary.main", width: 40, height: 40, "&:hover": { bgcolor: "primary.dark" }, "&:active": { transform: "scale(0.92)" }, transition: "transform 0.1s" }}
                    >
                        <EditIcon sx={{ fontSize: "1.15rem" }} />
                    </IconButton>
                </Box>
            </Box>
        </CardContent>
    );
};

export default React.memo(MobileCardContent);
