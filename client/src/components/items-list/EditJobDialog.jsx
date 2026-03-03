import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    TextField,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Grid,
    Typography,
    Box,
    InputAdornment,
    useTheme,
    useMediaQuery,
    Autocomplete,
    Paper,
    Collapse,
    IconButton,
    Chip,
    Fade,
    Slide,
    Tooltip,
    alpha
} from '@mui/material';
import {
    Person as PersonIcon,
    Phone as PhoneIcon,
    Devices as DevicesIcon,
    AttachMoney as MoneyIcon,
    AdminPanelSettings as AdminIcon,
    Notes as NotesIcon,
    ExpandMore as ExpandMoreIcon,
    Close as CloseIcon,
    CalendarToday as CalendarIcon,
    Build as BuildIcon,
    Receipt as ReceiptIcon,
    Schedule as ScheduleIcon,
    SaveAlt as SaveIcon,
    Info as InfoIcon,
    Circle as CircleIcon
} from '@mui/icons-material';
import { STATUS_COLORS, STATUS_ACCENT } from "../../constants/status";
import { FAULT_OPTIONS } from "../../constants/faults";
import { formatDate } from '../../utils/date';

/* ─── mobile slide-up transition ───────────────────────────────────── */
const SlideUp = React.forwardRef(function SlideUp(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

/* ─── reusable section wrapper ─────────────────────────────────────── */
const Section = ({ icon, title, accent, children, sx }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Box
            sx={{
                p: { xs: 2, sm: 2.5 },
                borderRadius: { xs: '14px', sm: '16px' },
                bgcolor: isDark
                    ? alpha(accent || '#94a3b8', 0.06)
                    : alpha(accent || '#94a3b8', 0.04),
                border: `1px solid ${isDark
                    ? alpha(accent || '#94a3b8', 0.15)
                    : alpha(accent || '#94a3b8', 0.12)}`,
                position: 'relative',
                overflow: 'hidden',
                transition: 'border-color 0.3s ease',
                '&:hover': {
                    borderColor: alpha(accent || '#94a3b8', 0.3),
                },
                ...sx
            }}
        >
            {/* subtle gradient glow at top */}
            <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: `linear-gradient(90deg, transparent, ${accent || '#94a3b8'}, transparent)`,
                opacity: 0.5
            }} />
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: { xs: 2, sm: 2.5 },
            }}>
                <Box sx={{
                    width: { xs: 28, sm: 32 },
                    height: { xs: 28, sm: 32 },
                    borderRadius: { xs: '8px', sm: '10px' },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(accent || '#94a3b8', 0.15),
                    color: accent || '#94a3b8',
                    flexShrink: 0
                }}>
                    {icon}
                </Box>
                <Typography
                    variant="subtitle2"
                    sx={{
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        fontSize: '0.72rem',
                        color: accent || 'text.secondary'
                    }}
                >
                    {title}
                </Typography>
            </Box>
            {children}
        </Box>
    );
};

/* ─── input styling helper ─────────────────────────────────────────── */
const inputSx = (theme) => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: '12px',
        bgcolor: theme.palette.mode === 'dark'
            ? 'rgba(255,255,255,0.03)'
            : 'rgba(0,0,0,0.02)',
        transition: 'all 0.2s ease',
        // Larger touch targets on mobile
        minHeight: { xs: '48px', sm: 'auto' },
        '&:hover': {
            bgcolor: theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(0,0,0,0.04)',
        },
        '&.Mui-focused': {
            bgcolor: 'transparent',
        },
    },
    '& .MuiInputLabel-root': {
        fontWeight: 600,
        fontSize: '0.85rem',
    }
});

/* ─── main component ───────────────────────────────────────────────── */
const EditJobDialog = ({ editItem, setEditItem, handleEditSave, isAdmin }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [showMeta, setShowMeta] = useState(false);

    if (!editItem) return null;

    const statusColor = STATUS_ACCENT[editItem.status] || '#94a3b8';

    return (
        <Dialog
            open={!!editItem}
            onClose={() => setEditItem(null)}
            maxWidth="sm"
            fullWidth
            fullScreen={isMobile}
            TransitionComponent={isMobile ? SlideUp : Fade}
            transitionDuration={isMobile ? 350 : 280}
            PaperProps={{
                elevation: 0,
                sx: {
                    borderRadius: isMobile ? '16px 16px 0 0' : '20px',
                    border: isMobile ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                    overflow: 'hidden',
                    maxHeight: isMobile ? '100vh' : '92vh',
                    boxShadow: isDark
                        ? '0 24px 80px rgba(0,0,0,0.6)'
                        : '0 24px 80px rgba(0,0,0,0.12)',
                    // On mobile: pin to bottom and allow full height
                    ...(isMobile && {
                        position: 'fixed',
                        bottom: 0,
                        top: 'auto',
                        m: 0,
                        maxHeight: '95vh',
                        height: 'auto',
                    }),
                }
            }}
            // Override backdrop for mobile to allow tapping above the sheet to close
            slotProps={{
                backdrop: {
                    sx: {
                        bgcolor: isMobile
                            ? 'rgba(0,0,0,0.5)'
                            : undefined,
                        backdropFilter: isMobile ? 'blur(4px)' : undefined,
                    }
                }
            }}
        >
            {/* ═══════════════════════════════════════════════════════════
                HEADER — Job summary at a glance
               ═══════════════════════════════════════════════════════════ */}
            <Box
                sx={{
                    px: { xs: 2, sm: 3 },
                    pt: { xs: 2, sm: 3 },
                    pb: { xs: 1.5, sm: 2 },
                    background: isDark
                        ? `linear-gradient(135deg, ${alpha(statusColor, 0.12)} 0%, transparent 70%)`
                        : `linear-gradient(135deg, ${alpha(statusColor, 0.08)} 0%, transparent 70%)`,
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                    position: 'relative',
                    // Drag handle indicator for mobile bottom-sheet feel
                    ...(isMobile && {
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 8,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 36,
                            height: 4,
                            borderRadius: 2,
                            bgcolor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                        },
                        pt: 3.5, // extra top padding for drag handle
                    }),
                }}
            >
                {/* close button */}
                <IconButton
                    onClick={() => setEditItem(null)}
                    size="small"
                    sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        color: 'text.secondary',
                        bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        '&:hover': {
                            bgcolor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                        },
                        width: 32,
                        height: 32,
                    }}
                >
                    <CloseIcon sx={{ fontSize: '1.1rem' }} />
                </IconButton>

                {/* job number badge + status */}
                <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
                    <Box sx={{
                        px: 1.5,
                        py: 0.6,
                        borderRadius: '10px',
                        bgcolor: alpha(statusColor, 0.15),
                        border: `1px solid ${alpha(statusColor, 0.25)}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                    }}>
                        <Typography variant="caption" sx={{
                            fontWeight: 900,
                            fontSize: '0.8rem',
                            color: statusColor,
                            letterSpacing: '0.03em',
                            fontFamily: '"JetBrains Mono", "Fira Code", monospace'
                        }}>
                            #{editItem.jobNumber}
                        </Typography>
                    </Box>
                    <Chip
                        icon={<CircleIcon sx={{ fontSize: '8px !important', color: `${statusColor} !important` }} />}
                        label={editItem.status || 'Received'}
                        size="small"
                        sx={{
                            bgcolor: alpha(statusColor, 0.12),
                            color: statusColor,
                            fontWeight: 700,
                            borderRadius: '10px',
                            fontSize: '0.75rem',
                            border: `1px solid ${alpha(statusColor, 0.2)}`,
                            '& .MuiChip-icon': { ml: '6px' }
                        }}
                    />
                </Box>

                {/* title line */}
                <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ fontWeight: 800, lineHeight: 1.3, pr: 4 }}>
                    {editItem.customerName || 'Unnamed Customer'}
                </Typography>
                <Box display="flex" alignItems="center" gap={0.75} mt={0.5} flexWrap="wrap">
                    <DevicesIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                        {editItem.brand || 'Unknown Device'}
                    </Typography>
                    {editItem.issue && (
                        <>
                            <Typography variant="body2" color="text.disabled" sx={{ mx: 0.25 }}>·</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: { xs: '0.78rem', sm: '0.82rem' } }}>
                                {editItem.issue}
                            </Typography>
                        </>
                    )}
                </Box>

                {/* quick metadata pills */}
                <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
                    {editItem.phoneNumber && (
                        <Tooltip title="Customer Phone" arrow placement="top">
                            <Box sx={{
                                display: 'inline-flex', alignItems: 'center', gap: 0.5,
                                px: 1.2, py: 0.4, borderRadius: '8px',
                                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600
                            }}>
                                <PhoneIcon sx={{ fontSize: 13 }} />
                                {editItem.phoneNumber}
                            </Box>
                        </Tooltip>
                    )}
                    {editItem.createdAt && (
                        <Tooltip title="Created" arrow placement="top">
                            <Box sx={{
                                display: 'inline-flex', alignItems: 'center', gap: 0.5,
                                px: 1.2, py: 0.4, borderRadius: '8px',
                                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600
                            }}>
                                <CalendarIcon sx={{ fontSize: 12 }} />
                                {formatDate(editItem.createdAt)}
                            </Box>
                        </Tooltip>
                    )}
                    {editItem.technicianName && (
                        <Tooltip title="Assigned Technician" arrow placement="top">
                            <Box sx={{
                                display: 'inline-flex', alignItems: 'center', gap: 0.5,
                                px: 1.2, py: 0.4, borderRadius: '8px',
                                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600
                            }}>
                                <PersonIcon sx={{ fontSize: 13 }} />
                                {editItem.technicianName}
                            </Box>
                        </Tooltip>
                    )}
                </Box>
            </Box>

            {/* ═══════════════════════════════════════════════════════════
                BODY — Editable sections
               ═══════════════════════════════════════════════════════════ */}
            <DialogContent
                sx={{
                    px: { xs: 2, sm: 3 },
                    py: { xs: 2, sm: 3 },
                    // Smooth momentum scrolling on iOS
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehavior: 'contain',
                    '&::-webkit-scrollbar': { width: isMobile ? 0 : 6 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(128,128,128,0.3)', borderRadius: 3 },
                    // Safe area padding for notched phones
                    pb: { xs: 'calc(16px + env(safe-area-inset-bottom, 0px))', sm: 3 },
                }}
            >
                <Stack spacing={{ xs: 2, sm: 2.5 }}>

                    {/* ── Section: Status & Service ──────────────────── */}
                    <Section
                        icon={<BuildIcon sx={{ fontSize: '1.1rem' }} />}
                        title="Status & Service"
                        accent={statusColor}
                    >
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ fontWeight: 600 }}>Current Status</InputLabel>
                                    <Select
                                        value={editItem.status || "Received"}
                                        label="Current Status"
                                        onChange={(e) => setEditItem({ ...editItem, status: e.target.value })}
                                        sx={{
                                            borderRadius: '12px',
                                            bgcolor: alpha(statusColor, 0.06),
                                            fontWeight: 700,
                                            color: statusColor,
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: alpha(statusColor, 0.25),
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: alpha(statusColor, 0.45),
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: statusColor,
                                            },
                                        }}
                                    >
                                        {Object.keys(STATUS_COLORS).map((status) => (
                                            <MenuItem
                                                key={status}
                                                value={status}
                                                sx={{
                                                    fontWeight: editItem.status === status ? 700 : 500,
                                                    color: STATUS_ACCENT[status] || 'inherit',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    '&::before': {
                                                        content: '""',
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: '50%',
                                                        bgcolor: STATUS_ACCENT[status] || '#94a3b8',
                                                        flexShrink: 0,
                                                    }
                                                }}
                                            >
                                                {status}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Autocomplete
                                    freeSolo
                                    options={FAULT_OPTIONS}
                                    value={editItem.issue || ""}
                                    onChange={(_event, newValue) => {
                                        setEditItem({ ...editItem, issue: (newValue || "").toUpperCase() });
                                    }}
                                    onInputChange={(_event, newInputValue) => {
                                        setEditItem({ ...editItem, issue: newInputValue.toUpperCase() });
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Fault / Issue"
                                            onChange={(e) => setEditItem({ ...editItem, issue: e.target.value.toUpperCase() })}
                                            fullWidth
                                            size="small"
                                            sx={inputSx(theme)}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Due Date"
                                    type="date"
                                    value={editItem.dueDate ? new Date(editItem.dueDate).toISOString().slice(0, 10) : ""}
                                    onChange={(e) => setEditItem({ ...editItem, dueDate: e.target.value || null })}
                                    fullWidth
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                    helperText="Optional — leave blank for no deadline"
                                    sx={inputSx(theme)}
                                    slotProps={{
                                        input: {
                                            startAdornment: <InputAdornment position="start"><ScheduleIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment>,
                                        }
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Section>

                    {/* ── Section: Customer & Device ─────────────────── */}
                    <Section
                        icon={<PersonIcon sx={{ fontSize: '1.1rem' }} />}
                        title="Customer & Device"
                        accent="#3b82f6"
                    >
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Customer Name"
                                    value={editItem.customerName}
                                    onChange={(e) => setEditItem({ ...editItem, customerName: e.target.value.toUpperCase() })}
                                    fullWidth
                                    size="small"
                                    sx={inputSx(theme)}
                                    slotProps={{
                                        input: {
                                            startAdornment: <InputAdornment position="start"><PersonIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment>,
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Phone Number"
                                    value={editItem.phoneNumber}
                                    onChange={(e) => setEditItem({ ...editItem, phoneNumber: e.target.value })}
                                    fullWidth
                                    size="small"
                                    sx={inputSx(theme)}
                                    slotProps={{
                                        input: {
                                            startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment>,
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Brand / Model"
                                    value={editItem.brand}
                                    onChange={(e) => setEditItem({ ...editItem, brand: e.target.value })}
                                    fullWidth
                                    size="small"
                                    sx={inputSx(theme)}
                                    slotProps={{
                                        input: {
                                            startAdornment: <InputAdornment position="start"><DevicesIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment>,
                                        }
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Section>

                    {/* ── Section: Financials ────────────────────────── */}
                    <Section
                        icon={<ReceiptIcon sx={{ fontSize: '1.1rem' }} />}
                        title="Financials"
                        accent="#10b981"
                    >
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Estimated Cost (₹)"
                                    type="number"
                                    value={editItem.cost || ""}
                                    onChange={(e) => setEditItem({ ...editItem, cost: e.target.value })}
                                    fullWidth
                                    size="small"
                                    sx={inputSx(theme)}
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: 'text.disabled' }}>₹</Typography>
                                                </InputAdornment>
                                            ),
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Final Cost (₹)"
                                    type="number"
                                    value={editItem.finalCost || ""}
                                    onChange={(e) => setEditItem({ ...editItem, finalCost: e.target.value })}
                                    fullWidth
                                    size="small"
                                    color="success"
                                    focused={!!editItem.finalCost}
                                    placeholder="Leave blank if pending"
                                    sx={{
                                        ...inputSx(theme),
                                        '& .MuiOutlinedInput-root': {
                                            ...inputSx(theme)['& .MuiOutlinedInput-root'],
                                            bgcolor: editItem.finalCost
                                                ? (isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.04)')
                                                : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                                        }
                                    }}
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: editItem.finalCost ? '#10b981' : 'text.disabled' }}>₹</Typography>
                                                </InputAdornment>
                                            ),
                                        }
                                    }}
                                />
                            </Grid>
                            {/* visual cost comparison */}
                            {(editItem.cost > 0 || editItem.finalCost > 0) && (
                                <Grid size={12}>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        px: 2,
                                        py: 1.2,
                                        borderRadius: '10px',
                                        bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                    }}>
                                        {editItem.cost > 0 && (
                                            <Box>
                                                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                                    Estimated
                                                </Typography>
                                                <Typography variant="body2" fontWeight={700} color="text.secondary">
                                                    ₹{editItem.cost}
                                                </Typography>
                                            </Box>
                                        )}
                                        {editItem.cost > 0 && editItem.finalCost > 0 && (
                                            <Typography color="text.disabled" sx={{ fontSize: '1.2rem' }}>→</Typography>
                                        )}
                                        {editItem.finalCost > 0 && (
                                            <Box>
                                                <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: '#10b981' }}>
                                                    Final
                                                </Typography>
                                                <Typography variant="body2" fontWeight={800} sx={{ color: '#10b981' }}>
                                                    ₹{editItem.finalCost}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Grid>
                            )}
                        </Grid>
                    </Section>

                    {/* ── Section: Notes & Admin ─────────────────────── */}
                    <Section
                        icon={<NotesIcon sx={{ fontSize: '1.1rem' }} />}
                        title="Notes & Details"
                        accent="#8b5cf6"
                    >
                        <Grid container spacing={2}>
                            <Grid size={12}>
                                <TextField
                                    label="Repair Notes"
                                    multiline
                                    minRows={3}
                                    maxRows={6}
                                    value={editItem.repairNotes || ""}
                                    onChange={(e) => setEditItem({ ...editItem, repairNotes: e.target.value })}
                                    placeholder="E.g. Replaced display, Checked charging port..."
                                    fullWidth
                                    variant="outlined"
                                    sx={{
                                        ...inputSx(theme),
                                        '& .MuiOutlinedInput-root': {
                                            ...inputSx(theme)['& .MuiOutlinedInput-root'],
                                            borderRadius: '12px',
                                            fontFamily: '"Inter", sans-serif',
                                            fontSize: '0.88rem',
                                            lineHeight: 1.7,
                                        }
                                    }}
                                />
                            </Grid>
                            {isAdmin && (
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        label="Technician Name"
                                        value={editItem.technicianName || ""}
                                        onChange={(e) => setEditItem({ ...editItem, technicianName: e.target.value })}
                                        fullWidth
                                        size="small"
                                        helperText="Admin override"
                                        sx={inputSx(theme)}
                                        slotProps={{
                                            input: {
                                                startAdornment: <InputAdornment position="start"><AdminIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment>,
                                            }
                                        }}
                                    />
                                </Grid>
                            )}
                        </Grid>
                    </Section>

                    {/* ── Expandable: Audit Log (admin only) ─────────── */}
                    {isAdmin && editItem.metadata && (
                        <Box>
                            <Button
                                size="small"
                                color="inherit"
                                onClick={() => setShowMeta(!showMeta)}
                                startIcon={<InfoIcon sx={{ fontSize: '1rem !important' }} />}
                                endIcon={<ExpandMoreIcon sx={{ transform: showMeta ? 'rotate(180deg)' : 'none', transition: '0.3s ease' }} />}
                                sx={{
                                    textTransform: 'none',
                                    opacity: 0.6,
                                    fontWeight: 600,
                                    fontSize: '0.78rem',
                                    borderRadius: '10px',
                                    px: 1.5,
                                    '&:hover': { opacity: 1, bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }
                                }}
                            >
                                Creation Audit Log
                            </Button>
                            <Collapse in={showMeta}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        mt: 1,
                                        p: 2,
                                        bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                                        borderRadius: "12px",
                                        border: `1px dashed ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                                    }}
                                >
                                    <Grid container spacing={1.5}>
                                        {[
                                            { label: 'IP', value: editItem.metadata.ip },
                                            { label: 'User Role', value: editItem.metadata.userRole },
                                            { label: 'OS', value: editItem.metadata.os },
                                            { label: 'Browser', value: editItem.metadata.browser },
                                            { label: 'Device', value: editItem.metadata.device },
                                            { label: 'Time', value: editItem.metadata.timestamp ? new Date(editItem.metadata.timestamp).toLocaleString() : null },
                                        ].map((row) => (
                                            <Grid size={6} key={row.label}>
                                                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 0.3 }}>
                                                    {row.label}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: row.label === 'IP' ? 'monospace' : 'inherit', fontWeight: 600 }}>
                                                    {row.value || 'N/A'}
                                                </Typography>
                                            </Grid>
                                        ))}
                                        <Grid size={12}>
                                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 0.3 }}>
                                                Source
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all', fontWeight: 600 }}>
                                                {editItem.metadata.referer || 'N/A'}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Collapse>
                        </Box>
                    )}
                </Stack>
            </DialogContent>

            {/* ═══════════════════════════════════════════════════════════
                FOOTER — Actions (sticky on mobile)
               ═══════════════════════════════════════════════════════════ */}
            <DialogActions
                sx={{
                    px: { xs: 2, sm: 3 },
                    py: { xs: 1.5, sm: 2 },
                    borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                    gap: 1,
                    // On mobile: sticky bottom, full-width buttons
                    ...(isMobile && {
                        position: 'sticky',
                        bottom: 0,
                        bgcolor: isDark ? 'rgba(18,18,18,0.95)' : 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(12px)',
                        pb: 'calc(12px + env(safe-area-inset-bottom, 0px))',
                        flexDirection: 'row',
                        zIndex: 10,
                    }),
                }}
            >
                <Button
                    onClick={() => setEditItem(null)}
                    sx={{
                        color: 'text.secondary',
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 2.5,
                        py: { xs: 1.2, sm: 1 },
                        flex: isMobile ? 1 : 'none',
                        fontSize: { xs: '0.9rem', sm: '0.875rem' },
                        border: isMobile ? `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` : 'none',
                        '&:hover': {
                            bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        }
                    }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleEditSave}
                    startIcon={<SaveIcon sx={{ fontSize: '1.1rem !important' }} />}
                    sx={{
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: 700,
                        px: 3,
                        py: { xs: 1.2, sm: 1 },
                        flex: isMobile ? 2 : 'none',
                        fontSize: { xs: '0.9rem', sm: '0.875rem' },
                        background: `linear-gradient(135deg, ${statusColor}, ${alpha(statusColor, 0.8)})`,
                        boxShadow: `0 4px 14px ${alpha(statusColor, 0.35)}`,
                        '&:hover': {
                            background: statusColor,
                            boxShadow: `0 6px 20px ${alpha(statusColor, 0.45)}`,
                        },
                        // Larger touch target on mobile
                        ...(isMobile && {
                            minHeight: 48,
                        }),
                    }}
                >
                    Save Changes
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditJobDialog;
