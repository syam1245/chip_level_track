import React from "react";
import { Box, Typography, IconButton, Chip, Tooltip } from "@mui/material";
import { Close as CloseIcon, Devices as DevicesIcon, Phone as PhoneIcon, CalendarToday as CalendarIcon, Person as PersonIcon, Circle as CircleIcon } from "@mui/icons-material";
import { alpha } from "@mui/system";
import { formatDate } from "../../utils/date";

const EditJobHeader = ({ editItem, setEditItem, statusColor, isMobile, isDark }) => {
    return (
        <Box
            sx={{
                px: { xs: 2, sm: 3 },
                pt: { xs: 2, sm: 3 },
                pb: { xs: 1.5, sm: 2 },
                background: isDark
                    ? `linear-gradient(135deg, ${alpha(statusColor, 0.12)} 0%, transparent 70%)`
                    : `linear-gradient(135deg, ${alpha(statusColor, 0.08)} 0%, transparent 70%)`,
                borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                position: "relative",
                ...(isMobile && {
                    "&::before": {
                        content: '""', position: "absolute", top: 8, left: "50%",
                        transform: "translateX(-50%)", width: 36, height: 4, borderRadius: 2,
                        bgcolor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
                    },
                    pt: 3.5,
                }),
            }}
        >
            <IconButton
                onClick={() => setEditItem(null)}
                size="small"
                sx={{
                    position: "absolute", top: 12, right: 12, color: "text.secondary",
                    bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                    "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)" },
                    width: 32, height: 32,
                }}
            >
                <CloseIcon sx={{ fontSize: "1.1rem" }} />
            </IconButton>

            <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
                <Box sx={{
                    px: 1.5, py: 0.6, borderRadius: "10px", bgcolor: alpha(statusColor, 0.15),
                    border: `1px solid ${alpha(statusColor, 0.25)}`, display: "flex", alignItems: "center", gap: 0.5,
                }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, fontSize: "0.8rem", color: statusColor, letterSpacing: "0.03em", fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}>
                        #{editItem.jobNumber}
                    </Typography>
                </Box>
                <Chip
                    icon={<CircleIcon sx={{ fontSize: "8px !important", color: `${statusColor} !important` }} />}
                    label={editItem.status || "Received"} size="small"
                    sx={{
                        bgcolor: alpha(statusColor, 0.12), color: statusColor, fontWeight: 700,
                        borderRadius: "10px", fontSize: "0.75rem", border: `1px solid ${alpha(statusColor, 0.2)}`, "& .MuiChip-icon": { ml: "6px" },
                    }}
                />
            </Box>

            <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ fontWeight: 800, lineHeight: 1.3, pr: 4 }}>
                {editItem.customerName || "Unnamed Customer"}
            </Typography>
            <Box display="flex" alignItems="center" gap={0.75} mt={0.5} flexWrap="wrap">
                <DevicesIcon sx={{ fontSize: 15, color: "text.secondary" }} />
                <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                    {editItem.brand || "Unknown Device"}
                </Typography>
                {editItem.issue && (
                    <>
                        <Typography variant="body2" color="text.disabled" sx={{ mx: 0.25 }}>·</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", fontSize: { xs: "0.78rem", sm: "0.82rem" } }}>
                            {editItem.issue}
                        </Typography>
                    </>
                )}
            </Box>

            <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
                {editItem.phoneNumber && (
                    <Tooltip title="Customer Phone" arrow placement="top">
                        <Box sx={{
                            display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.2, py: 0.4, borderRadius: "8px",
                            bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", fontSize: "0.75rem", color: "text.secondary", fontWeight: 600,
                        }}>
                            <PhoneIcon sx={{ fontSize: 13 }} />
                            {editItem.phoneNumber}
                        </Box>
                    </Tooltip>
                )}
                {editItem.createdAt && (
                    <Tooltip title="Created" arrow placement="top">
                        <Box sx={{
                            display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.2, py: 0.4, borderRadius: "8px",
                            bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", fontSize: "0.75rem", color: "text.secondary", fontWeight: 600,
                        }}>
                            <CalendarIcon sx={{ fontSize: 12 }} />
                            {formatDate(editItem.createdAt)}
                        </Box>
                    </Tooltip>
                )}
                {editItem.technicianName && (
                    <Tooltip title="Assigned Technician" arrow placement="top">
                        <Box sx={{
                            display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.2, py: 0.4, borderRadius: "8px",
                            bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", fontSize: "0.75rem", color: "text.secondary", fontWeight: 600,
                        }}>
                            <PersonIcon sx={{ fontSize: 13 }} />
                            {editItem.technicianName}
                        </Box>
                    </Tooltip>
                )}
            </Box>
        </Box>
    );
};

export default React.memo(EditJobHeader);
