import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
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
    Divider,
    Typography,
    Box,
    InputAdornment,
    useTheme,
    Autocomplete,
    Paper,
    Collapse,
    IconButton
} from '@mui/material';
import {
    Person as PersonIcon,
    Phone as PhoneIcon,
    Devices as DevicesIcon,
    WarningAmber as WarningIcon,
    AttachMoney as MoneyIcon,
    AdminPanelSettings as AdminIcon,
    Notes as NotesIcon,
    ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { STATUS_COLORS, STATUS_ACCENT } from "../../constants/status";
import { FAULT_OPTIONS } from "../../constants/faults";

const EditJobDialog = ({ editItem, setEditItem, handleEditSave, isAdmin }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [showMeta, setShowMeta] = useState(false);

    if (!editItem) return null;

    return (
        <Dialog
            open={!!editItem}
            onClose={() => setEditItem(null)}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: "var(--radius)" }
            }}
        >
            <DialogTitle sx={{ fontWeight: 700 }}>Edit Job Details</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={3} sx={{ mt: 1 }}>
                    {/* SECTION 1: CUSTOMER & DEVICE INFO */}
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                            <PersonIcon fontSize="small" /> Customer & Device
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Job Number"
                                    value={editItem.jobNumber}
                                    disabled
                                    fullWidth
                                    variant="filled"
                                    size="small"
                                    sx={{ '& .MuiInputBase-root': { fontWeight: 700 } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Brand / Model"
                                    value={editItem.brand}
                                    onChange={(e) => setEditItem({ ...editItem, brand: e.target.value })}
                                    fullWidth
                                    size="small"
                                    slotProps={{
                                        input: {
                                            startAdornment: <InputAdornment position="start"><DevicesIcon fontSize="small" /></InputAdornment>,
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Customer Name"
                                    value={editItem.customerName}
                                    onChange={(e) => setEditItem({ ...editItem, customerName: e.target.value.toUpperCase() })}
                                    fullWidth
                                    size="small"
                                    slotProps={{
                                        input: {
                                            startAdornment: <InputAdornment position="start"><PersonIcon fontSize="small" /></InputAdornment>,
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
                                    slotProps={{
                                        input: {
                                            startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" /></InputAdornment>,
                                        }
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* HIGHLIGHTED SECTION 2: STATUS, ISSUE, & FINANCES */}
                    <Box sx={{
                        p: 2.5,
                        borderRadius: '12px',
                        bgcolor: isDark ? 'rgba(255, 152, 0, 0.08)' : '#fff8e1',
                        border: `1px solid ${isDark ? 'rgba(255, 152, 0, 0.2)' : '#ffe0b2'}`,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                    }}>
                        <Typography variant="subtitle1" color="warning.main" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
                            <WarningIcon fontSize="small" /> Action Required (Status & Issue)
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ fontWeight: 600 }}>Current Status</InputLabel>
                                    <Select
                                        value={editItem.status || "Received"}
                                        label="Current Status"
                                        onChange={(e) => setEditItem({ ...editItem, status: e.target.value })}
                                        sx={{
                                            bgcolor: STATUS_ACCENT[editItem.status] ? `${STATUS_ACCENT[editItem.status]}15` : 'background.paper',
                                            fontWeight: 700,
                                            color: STATUS_ACCENT[editItem.status] || 'inherit',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: STATUS_ACCENT[editItem.status] ? `${STATUS_ACCENT[editItem.status]}50` : 'transparent'
                                            }
                                        }}
                                    >
                                        {Object.keys(STATUS_COLORS).map((status) => (
                                            <MenuItem key={status} value={status} sx={{ fontWeight: editItem.status === status ? 700 : 500, color: STATUS_ACCENT[status] || 'inherit' }}>
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
                                            label="Fault / Issue Description"
                                            onChange={(e) => setEditItem({ ...editItem, issue: e.target.value.toUpperCase() })}
                                            fullWidth
                                            size="small"
                                            color="warning"
                                            sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', fontWeight: 600 } }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Estimated Cost (₹)"
                                    type="number"
                                    value={editItem.cost || ""}
                                    onChange={(e) => setEditItem({ ...editItem, cost: e.target.value })}
                                    fullWidth
                                    size="small"
                                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
                                    slotProps={{
                                        input: {
                                            startAdornment: <InputAdornment position="start"><MoneyIcon fontSize="small" /></InputAdornment>,
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
                                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: isDark ? 'rgba(76, 175, 80, 0.05)' : '#f0fdf4' } }}
                                    slotProps={{
                                        input: {
                                            startAdornment: <InputAdornment position="start"><MoneyIcon fontSize="small" color={isDark ? "success.light" : "success"} /></InputAdornment>,
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Due Date (Deadline)"
                                    type="date"
                                    value={editItem.dueDate ? new Date(editItem.dueDate).toISOString().slice(0, 10) : ""}
                                    onChange={(e) => setEditItem({ ...editItem, dueDate: e.target.value || null })}
                                    fullWidth
                                    size="small"
                                    color="warning"
                                    InputLabelProps={{ shrink: true }}
                                    helperText="Optional — leave blank for no deadline"
                                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* SECTION 3: NOTES */}
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                            <NotesIcon fontSize="small" /> Additional Details
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid size={12}>
                                <TextField
                                    label="Repair Notes (Optional)"
                                    multiline
                                    rows={3}
                                    value={editItem.repairNotes || ""}
                                    onChange={(e) => setEditItem({ ...editItem, repairNotes: e.target.value })}
                                    placeholder="E.g. Replaced display, Checked charging port..."
                                    fullWidth
                                    variant="outlined"
                                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: isDark ? 'rgba(0, 0, 0, 0.2)' : '#f8fafc' } }}
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
                                        helperText="Admin override."
                                        slotProps={{
                                            input: {
                                                startAdornment: <InputAdornment position="start"><AdminIcon fontSize="small" color="disabled" /></InputAdornment>,
                                            }
                                        }}
                                    />
                                </Grid>
                            )}
                        </Grid>
                    </Box>

                    {isAdmin && editItem.metadata && (
                        <Box sx={{ mt: 2 }}>
                            <Button
                                size="small"
                                color="inherit"
                                onClick={() => setShowMeta(!showMeta)}
                                endIcon={<ExpandMoreIcon sx={{ transform: showMeta ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />}
                                sx={{ textTransform: 'none', opacity: 0.7 }}
                            >
                                Creation Audit Log
                            </Button>
                            <Collapse in={showMeta}>
                                <Paper elevation={0} sx={{ mt: 1, p: 2, bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", borderRadius: "8px", border: "1px dashed var(--border)" }}>
                                    <Grid container spacing={1}>
                                        <Grid size={6}><Typography variant="caption" color="text.secondary" sx={{ display: 'flex', gap: 1 }}><strong>IP:</strong> <span style={{ fontFamily: 'monospace' }}>{editItem.metadata.ip || "N/A"}</span></Typography></Grid>
                                        <Grid size={6}><Typography variant="caption" color="text.secondary" sx={{ display: 'flex', gap: 1 }}><strong>User Role:</strong> <span>{editItem.metadata.userRole || "N/A"}</span></Typography></Grid>

                                        <Grid size={6}><Typography variant="caption" color="text.secondary" sx={{ display: 'flex', gap: 1 }}><strong>OS:</strong> <span>{editItem.metadata.os || "N/A"}</span></Typography></Grid>
                                        <Grid size={6}><Typography variant="caption" color="text.secondary" sx={{ display: 'flex', gap: 1 }}><strong>Browser:</strong> <span>{editItem.metadata.browser || "N/A"}</span></Typography></Grid>

                                        <Grid size={6}><Typography variant="caption" color="text.secondary" sx={{ display: 'flex', gap: 1 }}><strong>Device:</strong> <span>{editItem.metadata.device || "N/A"}</span></Typography></Grid>
                                        <Grid size={6}><Typography variant="caption" color="text.secondary" sx={{ display: 'flex', gap: 1 }}><strong>Time:</strong> <span>{editItem.metadata.timestamp ? new Date(editItem.metadata.timestamp).toLocaleString() : "N/A"}</span></Typography></Grid>

                                        <Grid size={12}><Typography variant="caption" color="text.secondary" sx={{ display: 'flex', gap: 1, mt: 0.5, maxWidth: '100%', wordBreak: 'break-word' }}><strong>Source:</strong> <span>{editItem.metadata.referer || "N/A"}</span></Typography></Grid>
                                    </Grid>
                                </Paper>
                            </Collapse>
                        </Box>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={() => setEditItem(null)} sx={{ color: 'text.secondary' }}>Cancel</Button>
                <Button variant="contained" onClick={handleEditSave} sx={{ borderRadius: "8px" }}>Save Changes</Button>
            </DialogActions>
        </Dialog >
    );
};

export default EditJobDialog;
