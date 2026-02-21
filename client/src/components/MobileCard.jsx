import React from "react";
import { motion } from "framer-motion";
import {
    Card,
    CardContent,
    CardActions,
    Box,
    Typography,
    Chip,
    IconButton,
    Divider,
    Tooltip,
} from "@mui/material";
import {
    alpha
} from "@mui/material/styles";
import {
    WhatsApp as WhatsAppIcon,
    Print as PrintIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Devices as DeviceIcon,
    Notes as NotesIcon,
} from "@mui/icons-material";
import { STATUS_COLORS, STATUS_ACCENT } from "../constants/status";
import { formatDate } from "../utils/date";

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
                    <Typography variant="caption" fontWeight="900" sx={{ color: "primary.main", letterSpacing: '0.05em', bgcolor: 'primary.light', px: 1, py: 0.5, borderRadius: 1.5 }}>
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
                    {item.issue && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                            Issue: {item.issue}
                        </Typography>
                    )}
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 700 }}>
                        📞 {item.phoneNumber}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem', textAlign: 'right' }}>
                            By <strong>{item.technicianName}</strong> • {formatDate(item.createdAt)}
                            {item.cost > 0 && (
                                <Box component="span" sx={{ display: 'block', color: 'success.main', fontWeight: 900, fontSize: '0.75rem' }}>
                                    ₹{item.cost}
                                </Box>
                            )}
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
                    {formatDate(item.createdAt)}
                </Typography>
            </CardContent>

            <Divider sx={{ opacity: 0.4 }} />

            <CardActions sx={{ justifyContent: "space-between", px: 1.5, py: 1 }}>
                <Box display="flex" gap={0.75}>
                    <Tooltip title="WhatsApp">
                        <IconButton size="small" onClick={() => onWhatsApp(item)} sx={{ color: 'success.main', bgcolor: 'success.light', '&:hover': { bgcolor: 'success.main', color: 'success.contrastText' } }}>
                            <WhatsAppIcon sx={{ fontSize: '1.1rem' }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Print Job Sheet">
                        <IconButton size="small" onClick={() => onPrint(item)} sx={{ color: 'text.secondary', bgcolor: 'action.selected', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } }}>
                            <PrintIcon sx={{ fontSize: '1.1rem' }} />
                        </IconButton>
                    </Tooltip>
                </Box>
                <Box display="flex" gap={0.75}>
                    <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => onEdit(item)} sx={{ color: 'primary.main', bgcolor: 'primary.light', '&:hover': { bgcolor: 'primary.main', color: 'primary.contrastText' } }}>
                            <EditIcon sx={{ fontSize: '1.1rem' }} />
                        </IconButton>
                    </Tooltip>
                    {canDelete && (
                        <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => onDelete(item._id)} sx={{ color: 'error.main', bgcolor: 'error.light', '&:hover': { bgcolor: 'error.main', color: 'error.contrastText' } }}>
                                <DeleteIcon sx={{ fontSize: '1.1rem' }} />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </CardActions>
        </Card>
    </motion.div>
));

export default MobileCard;
