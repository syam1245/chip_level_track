import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Paper,
    useMediaQuery,
    Avatar,
    Chip,
    alpha
} from "@mui/material";
import {
    Inbox,
    Send,
    Build,
    HourglassBottom,
    CheckCircle,
    LocalShipping,
    KeyboardReturn,
    PendingActions,
    FormatQuote
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { format } from "date-fns";
import { STATUS_ACCENT } from "../../constants/status";

const getStatusIcon = (status) => {
    switch (status) {
        case "Received": return <Inbox fontSize="small" />;
        case "Sent to Service": return <Send fontSize="small" />;
        case "In Progress": return <Build fontSize="small" />;
        case "Waiting for Parts": return <HourglassBottom fontSize="small" />;
        case "Ready": return <CheckCircle fontSize="small" />;
        case "Delivered": return <LocalShipping fontSize="small" />;
        case "Return": return <KeyboardReturn fontSize="small" />;
        case "Pending": return <PendingActions fontSize="small" />;
        default: return <Inbox fontSize="small" />;
    }
};

const ServiceHistoryDialog = ({ open, onClose, item }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    if (!item) return null;

    const history = item.statusHistory || [];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
                sx: {
                    borderRadius: isMobile ? 0 : 4,
                    ...(isMobile && {
                        m: 0,
                        maxHeight: '100%',
                        height: '100%'
                    })
                }
            }}
        >
            <DialogTitle sx={{ fontWeight: 800, fontSize: { xs: '1rem', sm: '1.25rem' }, py: { xs: 1.5, sm: 2 } }}>
                Service History: #{item.jobNumber}
            </DialogTitle>
            <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                        {item.customerName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                        {item.brand} - {item.issue}
                    </Typography>
                </Box>

                {history.length === 0 ? (
                    <Typography color="text.secondary" align="center" sx={{ py: 4, fontSize: '0.85rem' }}>
                        No history logs found for this device.
                    </Typography>
                ) : (
                    <Box sx={{ position: 'relative', mt: 3, mb: 1, pl: { xs: 2, sm: 4 }, pr: { xs: 1, sm: 2 } }}>
                        {/* Vertical Timeline Line */}
                        <Box sx={{
                            position: 'absolute',
                            left: { xs: 32, sm: 52 },
                            top: 24,
                            bottom: 24,
                            width: 2,
                            marginLeft: '-1px',
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                            zIndex: 0
                        }} />

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 3, sm: 4 } }}>
                            {history.map((step, index) => {
                                const statusColor = STATUS_ACCENT[step.status] || theme.palette.primary.main;
                                const isLatest = index === history.length - 1;

                                return (
                                    <Box key={index} sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, position: 'relative', zIndex: 1, width: '100%' }}>
                                        {/* Status Icon/Dot */}
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <Avatar sx={{
                                                width: { xs: 32, sm: 40 },
                                                height: { xs: 32, sm: 40 },
                                                bgcolor: alpha(statusColor, 0.1),
                                                color: statusColor,
                                                border: `2px solid ${statusColor}`,
                                                boxShadow: isLatest ? `0 0 0 4px ${alpha(statusColor, 0.15)}` : 'none',
                                                transition: 'all 0.2s',
                                                flexShrink: 0
                                            }}>
                                                {getStatusIcon(step.status)}
                                            </Avatar>
                                        </Box>

                                        {/* Step Content */}
                                        <Box sx={{ pt: 0.5, minWidth: 0, flex: 1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                                                <Typography variant="subtitle1" fontWeight={800} sx={{ color: statusColor, lineHeight: 1.2, fontSize: { xs: '0.9rem', sm: '1.05rem' } }}>
                                                    {step.status}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, whiteSpace: 'nowrap', bgcolor: 'action.hover', px: 1, py: 0.5, borderRadius: 1.5 }}>
                                                    {format(new Date(step.changedAt), "MMM dd, yyyy • hh:mm a")}
                                                </Typography>
                                            </Box>

                                            {step.note && (
                                                <Paper elevation={0} sx={{
                                                    p: { xs: 1.5, sm: 2 },
                                                    mt: 1.5,
                                                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8f9fa',
                                                    border: `1px solid ${theme.palette.divider}`,
                                                    borderRadius: 3,
                                                    display: 'flex',
                                                    gap: 1.5,
                                                    alignItems: 'flex-start'
                                                }}>
                                                    <FormatQuote sx={{ color: 'text.disabled', fontSize: 20, flexShrink: 0, transform: 'scaleX(-1)' }} />
                                                    <Typography variant="body2" color="text.primary" sx={{ fontStyle: 'italic', lineHeight: 1.5, fontSize: { xs: '0.8rem', sm: '0.875rem' }, fontWeight: 500 }}>
                                                        {step.note}
                                                    </Typography>
                                                </Paper>
                                            )}
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2 }} size={isMobile ? "small" : "medium"}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ServiceHistoryDialog;
